import * as React from "react";
import { createCast } from "ts-safe-cast";

import { formatPriceCentsWithCurrencySymbol } from "$app/utils/currency";
import { register } from "$app/utils/serverComponentUtil";

import { Button, NavigationButton } from "$app/components/Button";
import { Icon } from "$app/components/Icons";
import { useLoggedInUser } from "$app/components/LoggedInUser";
import { Select } from "$app/components/Select";
import { showAlert } from "$app/components/server-components/Alert";

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

const useHoverEffect = (offset = 4) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = `translate(-${offset}px, -${offset}px)`;
    e.currentTarget.style.boxShadow = `${offset}px ${offset}px 0 rgb(var(--color))`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translate(0, 0)";
    e.currentTarget.style.boxShadow = "none";
  };

  return { handleMouseEnter, handleMouseLeave };
};

const commonCardStyles = {
  backgroundColor: "rgb(var(--filled))",
  border: "1px solid rgb(var(--parent-color) / var(--border-alpha))",
  borderRadius: "8px",
  textDecoration: "none",
  color: "inherit",
  transition: "all 0.2s ease-in-out",
  cursor: "pointer",
};

const commonButtonStyles = {
  backgroundColor: "rgb(var(--filled))",
  border: "1px solid rgb(var(--parent-color) / var(--border-alpha))",
  borderRadius: "6px",
  color: "inherit",
  fontWeight: 500,
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  whiteSpace: "nowrap",
  display: "inline-block",
};

const commonSummaryStyles: React.CSSProperties = {
  listStyle: "none",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0",
  position: "relative",
};

const commonQuestionStyles: React.CSSProperties = {
  textAlign: "left",
  flex: "1",
  fontSize: "18px",
  fontWeight: "500",
};

const HoverableCard = ({ children, href }: { children: React.ReactNode; href: string }) => {
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();

  return (
    <a
      href={href}
      style={{
        ...commonCardStyles,
        padding: "var(--spacer-6)",
        textAlign: "center",
        minHeight: "144px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "1 1 calc(33.333% - var(--spacer-4))",
        minWidth: "250px",
        fontSize: "19px",
        fontWeight: "400",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </a>
  );
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
}) => {
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        ...commonCardStyles,
        flex: "1 1 220px",
        minWidth: "220px",
        padding: "var(--spacer-5)",
        display: "flex",
        alignItems: "center",
        gap: "var(--spacer-6)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
            objectFit: "contain",
            borderRadius: "12px",
          }}
        />
      </div>
      <div>
        <h3 style={{ margin: "0 0 var(--spacer-2) 0", fontSize: "18px", fontWeight: "600" }}>{title}</h3>
        <p style={{ margin: 0, fontSize: "14px", color: "rgb(var(--gray-3))" }}>{description}</p>
      </div>
    </a>
  );
};

const TaxDocumentsTable = ({
  documents,
  onDownload,
}: {
  documents: TaxDocument[];
  onDownload: (document: TaxDocument) => void;
}) => (
  <table
    style={{
      borderCollapse: "separate",
      borderSpacing: "0",
      backgroundColor: "transparent",
      marginTop: "var(--spacer-4)",
      borderRadius: "8px",
      overflow: "visible",
      border: "1px solid var(--border-color)",
    }}
  >
    <thead>
      <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
        <th style={{ textAlign: "left", padding: "16px 12px", fontWeight: 700 }}>Document</th>
        <th style={{ textAlign: "left", padding: "16px 12px", fontWeight: 700 }}>Type</th>
        <th style={{ textAlign: "left", padding: "16px 12px", fontWeight: 700 }}>Gross</th>
        <th style={{ textAlign: "left", padding: "16px 12px", fontWeight: 700 }}>Fees</th>
        <th style={{ textAlign: "left", padding: "16px 12px", fontWeight: 700 }}>Taxes</th>
        <th style={{ textAlign: "left", padding: "16px 12px", fontWeight: 700 }}>Net</th>
        <th style={{ textAlign: "left", padding: "16px 12px", fontWeight: 700 }}></th>
      </tr>
    </thead>
    <tbody>
      {documents.map((document) => (
        <tr key={document.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
          <td style={{ padding: "16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacer-2)" }}>
              {document.is_new ? (
                <span
                  style={{
                    backgroundColor: "rgb(var(--gray-1))",
                    color: "rgb(var(--gray-3))",
                    fontSize: "12px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  New
                </span>
              ) : null}
              {document.name}
            </div>
          </td>
          <td style={{ padding: "16px 12px", color: "rgb(var(--gray-3))" }}>{document.type}</td>
          <td style={{ padding: "16px 12px", textAlign: "left", fontWeight: "500" }}>
            {formatPriceCentsWithCurrencySymbol("usd", document.gross_cents, {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "16px 12px", textAlign: "left" }}>
            -
            {formatPriceCentsWithCurrencySymbol("usd", Math.abs(document.fees_cents), {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "16px 12px", textAlign: "left" }}>
            -
            {formatPriceCentsWithCurrencySymbol("usd", Math.abs(document.taxes_cents), {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "16px 12px", textAlign: "left", fontWeight: "500" }}>
            {formatPriceCentsWithCurrencySymbol("usd", document.net_cents, {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "16px 12px" }}>
            {(() => {
              const { handleMouseEnter, handleMouseLeave } = useHoverEffect(2);
              return (
                <button
                  onClick={() => onDownload(document)}
                  aria-label={`Download ${document.name}`}
                  style={{
                    ...commonButtonStyles,
                    padding: "2px 8px",
                    minHeight: "28px",
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  Download
                </button>
              );
            })()}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TaxDocumentsEmpty = () => (
  <div style={{ textAlign: "center" }}>
    <img src={taxesPlaceholder} alt="Tax documents placeholder" style={{ maxWidth: "100%", height: "auto" }} />
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

const FAQSection = () => (
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
        details[open] summary svg {
          transform: rotate(180deg);
        }
      `}
    </style>
    <h2>FAQs</h2>
    <div className="stack" style={{ marginTop: "var(--spacer-4)" }}>
      <details style={{ marginTop: "var(--spacer-1)" }}>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>Why did I receive a 1099-K?</span>
          <svg
            width="20"
            height="20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transition: "transform 0.2s ease-in-out", flexShrink: 0 }}
          >
            <path
              d="m19 9.007-7 7-7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <p>
          A 1099-K is an informational tax form that reports the gross amount of all payment transactions processed by a
          payment settlement entity (PSE) on your behalf. It's designed to help you report your income accurately.
        </p>
      </details>
      <details style={{ marginBottom: "var(--spacer-1)", marginTop: "var(--spacer-1)" }}>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>How is the 'Gross Sales' amount on my 1099-K calculated?</span>
          <svg
            width="20"
            height="20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transition: "transform 0.2s ease-in-out", flexShrink: 0 }}
          >
            <path
              d="m19 9.007-7 7-7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <p>
          The gross sales amount is the total of all payments processed on your behalf by Gumroad for the calendar year,
          before any fees, refunds, or adjustments. This is the amount reported to the IRS.
        </p>
      </details>
      <details style={{ marginBottom: "var(--spacer-1)", marginTop: "var(--spacer-1)" }}>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>Where can I find my Gumroad fees to deduct on my tax return?</span>
          <svg
            width="20"
            height="20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transition: "transform 0.2s ease-in-out", flexShrink: 0 }}
          >
            <path
              d="m19 9.007-7 7-7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <p>
          Taxes are calculated based on your sales and the applicable tax rates in your jurisdiction. The exact
          calculation depends on your location and the type of products you sell.
        </p>
      </details>
      <details style={{ marginBottom: "var(--spacer-2)" }}>
        <summary style={commonSummaryStyles}>
          <span style={commonQuestionStyles}>Do I need to report income if I didn't receive a 1099-K?</span>
          <svg
            width="20"
            height="20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transition: "transform 0.2s ease-in-out", flexShrink: 0 }}
          >
            <path
              d="m19 9.007-7 7-7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <p>
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
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--spacer-4)",
        marginTop: "var(--spacer-4)",
      }}
    >
      <HoverableCard href="#">How to estimate quarterly taxes</HoverableCard>
      <HoverableCard href="#">Using earnings summaries with your accountant</HoverableCard>
      <HoverableCard href="#">This is a placeholder for a real article</HoverableCard>
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
    const url = new URL(window.location.href);
    if (tab === "payouts") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tab);
    }
    window.location.href = url.toString();
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Navigate to the taxes page with the selected year
    window.location.href = `/payouts?tab=taxes&year=${year}`;
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
      link.href = `/tax-documents/download-all?year=${selectedYear}`;
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

  // Show placeholder only when there's no data at all (no available years)
  const shouldShowPlaceholder = availableYears.length === 0;

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
            href={Routes.balance_path({ tab: "taxes" })}
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
              {hasDocuments ? (
                <Button
                  onClick={handleDownloadAll}
                  disabled={isLoading}
                  aria-label="Download all documents"
                  style={{
                    ...commonButtonStyles,
                    padding: "14px 20px",
                    minWidth: "110px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M0.249969 3.25C0.249969 1.59325 1.59322 0.25 3.24997 0.25H4.74997C5.16397 0.25 5.49997 0.586 5.49997 1C5.49997 1.414 5.16397 1.75 4.74997 1.75H3.24997C2.42122 1.75 1.74997 2.42125 1.74997 3.25V10.75C1.74997 11.5787 2.42122 12.25 3.24997 12.25H10.75C11.5787 12.25 12.25 11.5787 12.25 10.75V3.25C12.25 2.42125 11.5787 1.75 10.75 1.75H9.24998C8.42123 1.75 7.74998 2.42125 7.74998 3.25L7.74997 7.75H9.99997L6.99997 10.75L3.99997 7.75H6.24997V3.25C6.24997 1.59325 7.59323 0.25 9.24998 0.25H10.75C12.4067 0.25 13.75 1.59325 13.75 3.25V10.75C13.75 12.4067 12.4067 13.75 10.75 13.75H3.24997C1.59322 13.75 0.249969 12.4067 0.249969 10.75V3.25Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
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
                  className="min-w-[100px]"
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
        <FAQSection />
        <RelatedArticlesSection />
      </div>
    </main>
  );
};

export default register({ component: TaxesPage, propParser: createCast() });
