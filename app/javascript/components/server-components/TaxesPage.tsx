import * as React from "react";
import { createCast } from "ts-safe-cast";

import { formatPriceCentsWithCurrencySymbol } from "$app/utils/currency";
import { register } from "$app/utils/serverComponentUtil";

import { Button, NavigationButton } from "$app/components/Button";
import { Icon } from "$app/components/Icons";
import { useLoggedInUser } from "$app/components/LoggedInUser";
import { Select } from "$app/components/Select";
import { showAlert } from "$app/components/server-components/Alert";
import { useIsDarkTheme } from "$app/components/useIsDarkTheme";

import curvedDownloadImage from "$assets/images/curved_download.svg";
import chevronDownImage from "$assets/images/icons/outline-cheveron-down.svg";
import kickImage from "$assets/images/kick.png";
import taxesPlaceholder from "$assets/images/placeholders/taxes.png";
import stonksImage from "$assets/images/stonks.png";

type TaxDocument = {
  id: string;
  name: string;
  type: "IRS form" | "Report";
  gross_cents: number;
  fees_cents: number;
  taxes_cents: number;
  net_cents: number;
  is_new?: boolean;
  download_url?: string;
};

type TaxDocumentsData = {
  documents: TaxDocument[];
  selected_year: number;
  available_years: number[];
};

const ChevronDownIcon = ({ isDarkTheme }: { isDarkTheme: boolean | null }) => (
  <img
    src={chevronDownImage}
    alt="Expand"
    style={{
      width: "20px",
      height: "20px",
      transition: "transform 0.2s ease-in-out",
      flexShrink: 0,
      filter: isDarkTheme ? "invert(1)" : "none",
    }}
  />
);

const commonSummaryStyles: React.CSSProperties = {
  listStyle: "none",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "var(--spacer-1) 0",
  position: "relative",
};

const commonQuestionStyles: React.CSSProperties = {
  textAlign: "left",
  flex: "1",
  fontSize: "18px",
  fontWeight: "500",
};

const PartnerCard = ({
  href,
  imageSrc,
  imageAlt,
  title,
  description,
}: {
  href: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
}) => (
  <NavigationButton
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    color="filled"
    className="!flex !min-w-[220px] !flex-1 !items-center !gap-6 !p-5 !text-left"
    style={{ borderRadius: "8px" }}
  >
    <div
      style={{
        width: "96px",
        height: "96px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        style={{
          width: "96px",
          height: "96px",
          objectFit: "fill",
          borderRadius: "12px",
        }}
      />
    </div>
    <div>
      <h3 style={{ margin: "0 0 var(--spacer-1) 0", fontSize: "25px", fontWeight: "750" }}>{title}</h3>
      <p style={{ fontSize: "17px", fontWeight: "400", lineHeight: "1.5" }}>{description}</p>
    </div>
  </NavigationButton>
);

const DownloadButton = ({
  document,
  onDownload,
}: {
  document: TaxDocument;
  onDownload: (document: TaxDocument) => void;
}) => (
  <Button onClick={() => onDownload(document)} aria-label={`Download ${document.name}`}>
    Download
  </Button>
);

const TaxDocumentsTable = ({
  documents,
  onDownload,
}: {
  documents: TaxDocument[];
  onDownload: (document: TaxDocument) => void;
}) => (
  <table aria-live="polite">
    <thead>
      <tr>
        <th>Document</th>
        <th>Type</th>
        <th>Gross</th>
        <th>Fees</th>
        <th>Taxes</th>
        <th>Net</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {documents.map((taxDocument) => (
        <tr key={taxDocument.id}>
          <td>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacer-2)" }}>
              {taxDocument.is_new ? (
                <div
                  className="pill small"
                  style={{ backgroundColor: "rgb(var(--gray-1))", color: "rgb(var(--gray-3))" }}
                >
                  New
                </div>
              ) : null}
              <div>{taxDocument.name || ""}</div>
            </div>
          </td>
          <td>{taxDocument.type}</td>
          <td style={{ whiteSpace: "nowrap" }}>
            {formatPriceCentsWithCurrencySymbol("usd", taxDocument.gross_cents, {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ whiteSpace: "nowrap" }}>
            -
            {formatPriceCentsWithCurrencySymbol("usd", Math.abs(taxDocument.fees_cents), {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ whiteSpace: "nowrap" }}>
            -
            {formatPriceCentsWithCurrencySymbol("usd", Math.abs(taxDocument.taxes_cents), {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ whiteSpace: "nowrap", fontWeight: "500" }}>
            {formatPriceCentsWithCurrencySymbol("usd", taxDocument.net_cents, {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td>
            <div className="actions">
              <DownloadButton document={taxDocument} onDownload={onDownload} />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TaxDocumentsEmpty = () => (
  <div className="placeholder">
    <figure>
      <img src={taxesPlaceholder} alt="Tax documents placeholder" />
    </figure>
    <h2>Let's get your tax info ready.</h2>
    <p>Your 1099-K and quarterly summaries will appear here once they're available.</p>
  </div>
);

const SaveOnTaxesSection = () => (
  <section>
    <h2>Save on your taxes</h2>
    <p style={{ marginTop: "var(--spacer-2)", color: "rgb(var(--gray-3))" }}>
      Explore ways to minimize your tax burden as your business grows.
    </p>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--spacer-4)",
        marginTop: "var(--spacer-4)",
      }}
    >
      <PartnerCard
        href="https://stonks.com"
        imageSrc={stonksImage}
        imageAlt="stonks.com"
        title="stonks.com"
        description="Help creators register as a business and unlock major tax deductions. Avg refund: $8,200."
      />
      <PartnerCard
        href="https://kick.co"
        imageSrc={kickImage}
        imageAlt="kick.co"
        title="kick.co"
        description="Handles your bookkeeping automatically, so you're always tax-ready. Built for creators."
      />
    </div>
  </section>
);

const FAQSection = ({ isDarkTheme }: { isDarkTheme: boolean | null }) => (
  <section>
    <style>
      {`
        details summary::-webkit-details-marker {
          display: none !important;
        }
        details summary::marker {
          display: none !important;
        }
        details summary {
          list-style: none !important;
          list-style-type: none !important;
        }
        details summary::before {
          display: none !important;
        }
        details summary::after {
          display: none !important;
        }
        details[open] summary img {
          transform: rotate(180deg);
        }
      `}
    </style>
    <h2>FAQs</h2>
    <div className="stack" style={{ marginTop: "var(--spacer-4)" }}>
      <details>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>Why did I receive a 1099-K?</span>
          <ChevronDownIcon isDarkTheme={isDarkTheme} />
        </summary>
        <p style={{ paddingRight: "var(--spacer-8)" }}>
          A 1099-K is an informational tax form that reports the gross amount of all payment transactions processed by a
          payment settlement entity (PSE) on your behalf. It's designed to help you report your income accurately.
        </p>
      </details>
      <details>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>How is the 'Gross Sales' amount on my 1099-K calculated?</span>
          <ChevronDownIcon isDarkTheme={isDarkTheme} />
        </summary>
        <p style={{ paddingRight: "var(--spacer-8)" }}>
          The gross sales amount is the total of all payments processed on your behalf by Gumroad for the calendar year,
          before any fees, refunds, or adjustments. This is the amount reported to the IRS.
        </p>
      </details>
      <details>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>Where can I find my Gumroad fees to deduct on my tax return?</span>
          <ChevronDownIcon isDarkTheme={isDarkTheme} />
        </summary>
        <p style={{ paddingRight: "var(--spacer-8)" }}>
          Taxes are calculated based on your sales and the applicable tax rates in your jurisdiction. The exact
          calculation depends on your location and the type of products you sell.
        </p>
      </details>
      <details>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>Do I need to report income if I didn't receive a 1099-K?</span>
          <ChevronDownIcon isDarkTheme={isDarkTheme} />
        </summary>
        <p style={{ paddingRight: "var(--spacer-8)" }}>
          Yes, you must report all income earned during the tax year, regardless of whether you received a 1099-K form.
          The 1099-K is just an informational form to help you report your income accurately.
        </p>
      </details>
    </div>
  </section>
);

const RelatedArticlesSection = () => (
  <section>
    <h2>Related articles from our Help Center</h2>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "var(--spacer-4)",
        marginTop: "var(--spacer-4)",
      }}
    >
      <NavigationButton color="filled" className="!p-12 text-center !text-xl">
        How to estimate quarterly taxes
      </NavigationButton>
      <NavigationButton color="filled" className="!p-12 text-center !text-xl">
        Using earnings summaries with your accountant
      </NavigationButton>
      <NavigationButton color="filled" className="!p-12 text-center !text-xl">
        This is a placeholder for a real article
      </NavigationButton>
    </div>
  </section>
);

const TaxesPage = ({
  tax_documents_data,
  current_tab,
}: {
  tax_documents_data: TaxDocumentsData | null;
  current_tab: string;
}) => {
  const loggedInUser = useLoggedInUser();
  const isDarkTheme = useIsDarkTheme();
  const availableYears = tax_documents_data?.available_years || [];

  const [selectedYear, setSelectedYear] = React.useState(() => {
    if (tax_documents_data?.selected_year) {
      return tax_documents_data.selected_year;
    }

    // If we have available years, use the most recent one
    if (availableYears.length > 0) {
      return Math.max(...availableYears);
    }

    return new Date().getFullYear();
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const activeTab = current_tab;

  const handleTabClick = (tab: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (tab === "payouts") {
      window.location.href = Routes.balance_path();
    } else {
      window.location.href = "/payouts/taxes";
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Navigate to the taxes page with the selected year
    window.location.href = `/payouts/taxes?year=${year}`;
  };

  const handleDownloadDocument = (taxDocument: TaxDocument) => {
    if (!taxDocument.download_url) {
      showAlert("Download not available for this document.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const link = document.createElement("a");
      link.href = taxDocument.download_url;
      link.download = `${taxDocument.name}-${selectedYear}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showAlert("Document download started.", "success");
    } catch (_error) {
      showAlert("Failed to download document. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = () => {
    if (!tax_documents_data?.documents.length) {
      showAlert("No documents available for download.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const link = document.createElement("a");
      link.href = `${Routes.tax_documents_download_all_path()}?year=${selectedYear}`;
      link.download = `tax-documents-${selectedYear}.zip`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showAlert("Download started.", "success");
    } catch (_error) {
      showAlert("Failed to download documents. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const settingsAction = loggedInUser?.policies.balance.index ? (
    <NavigationButton href={Routes.settings_payments_path()}>
      <Icon name="gear-fill" />
      Settings
    </NavigationButton>
  ) : null;

  const hasDocuments = tax_documents_data?.documents && tax_documents_data.documents.length > 0;
  const documents = tax_documents_data?.documents || [];

  // Show year picker when there are available years
  const shouldShowYearPicker = availableYears.length > 0;

  // Show placeholder when there are no documents for the selected year
  // This includes cases where all quarters have 0 data
  const shouldShowPlaceholder = !hasDocuments;

  // Show "Download all" button only when there are at least 2 quarters with data
  const shouldShowDownloadAll = hasDocuments && documents.length >= 2;

  return (
    <main>
      <header>
        <h1>Tax documents</h1>
        {settingsAction ? <div className="actions flex gap-2">{settingsAction}</div> : null}
        <div role="tablist">
          <a
            href={Routes.balance_path()}
            role="tab"
            aria-selected={activeTab === "payouts"}
            onClick={(e) => handleTabClick("payouts", e)}
          >
            Payouts
          </a>
          <a
            href="/payouts/taxes"
            role="tab"
            aria-selected={activeTab === "taxes"}
            onClick={(e) => handleTabClick("taxes", e)}
          >
            Taxes
          </a>
        </div>
      </header>

      <div style={{ display: "grid", gap: "var(--spacer-7)" }}>
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacer-4)",
            }}
          >
            <h2>Tax documents</h2>
            <div style={{ display: "flex", gap: "var(--spacer-3)", alignItems: "center" }}>
              {shouldShowDownloadAll ? (
                <Button onClick={handleDownloadAll} disabled={isLoading} aria-label="Download all documents">
                  <img
                    src={curvedDownloadImage}
                    alt="Download"
                    style={{
                      width: "14px",
                      height: "14px",
                      marginRight: "var(--spacer-1)",
                      filter: isDarkTheme ? "invert(1)" : "none",
                    }}
                  />
                  Download all
                </Button>
              ) : null}
              {shouldShowYearPicker ? (
                <Select
                  options={availableYears.map((year) => ({ id: year.toString(), label: year.toString() }))}
                  value={
                    availableYears
                      .map((year) => ({ id: year.toString(), label: year.toString() }))
                      .find((option) => option.id === selectedYear.toString()) || null
                  }
                  onChange={(option) => {
                    if (option && typeof option === "object" && "id" in option) {
                      handleYearChange(Number(option.id));
                    }
                  }}
                  className="min-w-[120px]"
                />
              ) : null}
            </div>
          </div>
          {shouldShowPlaceholder ? (
            <div style={{ marginTop: "var(--spacer-5)" }}>
              <TaxDocumentsEmpty />
            </div>
          ) : (
            <TaxDocumentsTable documents={documents} onDownload={handleDownloadDocument} />
          )}
        </section>

        <SaveOnTaxesSection />
        <FAQSection isDarkTheme={isDarkTheme} />
        <RelatedArticlesSection />
      </div>
    </main>
  );
};

export default register({ component: TaxesPage, propParser: createCast() });
