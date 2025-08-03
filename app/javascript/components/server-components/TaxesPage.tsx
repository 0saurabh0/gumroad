import * as React from "react";
import { createCast } from "ts-safe-cast";

import { formatPriceCentsWithCurrencySymbol } from "$app/utils/currency";
import { register } from "$app/utils/serverComponentUtil";

import { Button, NavigationButton } from "$app/components/Button";
import { Icon } from "$app/components/Icons";
import { useLoggedInUser } from "$app/components/LoggedInUser";
import { showAlert } from "$app/components/server-components/Alert";

import taxesPlaceholder from "$assets/images/placeholders/taxes.png";

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

const TaxDocumentsTable = ({
  documents,
  onDownload,
}: {
  documents: TaxDocument[];
  onDownload: (document: TaxDocument) => void;
}) => (
  <table
    style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "transparent", marginTop: "var(--spacer-4)" }}
  >
    <thead>
      <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
        <th style={{ textAlign: "left", padding: "var(--spacer-3)", fontWeight: "500" }}>Document</th>
        <th style={{ textAlign: "left", padding: "var(--spacer-3)", fontWeight: "500" }}>Type</th>
        <th style={{ textAlign: "left", padding: "var(--spacer-3)", fontWeight: "500" }}>Gross</th>
        <th style={{ textAlign: "left", padding: "var(--spacer-3)", fontWeight: "500" }}>Fees</th>
        <th style={{ textAlign: "left", padding: "var(--spacer-3)", fontWeight: "500" }}>Taxes</th>
        <th style={{ textAlign: "left", padding: "var(--spacer-3)", fontWeight: "500" }}>Net</th>
        <th style={{ textAlign: "center", padding: "var(--spacer-3)", fontWeight: "500" }}>Action</th>
      </tr>
    </thead>
    <tbody>
      {documents.map((document) => (
        <tr key={document.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
          <td style={{ padding: "var(--spacer-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacer-2)" }}>
              {document.is_new ? (
                <span
                  style={{
                    backgroundColor: "#E5E7EB",
                    color: "#6B7280",
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
          <td style={{ padding: "var(--spacer-3)", color: "#6B7280" }}>{document.type}</td>
          <td style={{ padding: "var(--spacer-3)", textAlign: "left", fontWeight: "500" }}>
            {formatPriceCentsWithCurrencySymbol("usd", document.gross_cents, {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "var(--spacer-3)", textAlign: "left", color: "#DC2626" }}>
            -
            {formatPriceCentsWithCurrencySymbol("usd", Math.abs(document.fees_cents), {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "var(--spacer-3)", textAlign: "left", color: "#DC2626" }}>
            -
            {formatPriceCentsWithCurrencySymbol("usd", Math.abs(document.taxes_cents), {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "var(--spacer-3)", textAlign: "left", fontWeight: "500" }}>
            {formatPriceCentsWithCurrencySymbol("usd", document.net_cents, {
              symbolFormat: "short",
              noCentsIfWhole: false,
            })}
          </td>
          <td style={{ padding: "var(--spacer-3)", textAlign: "center" }}>
            <Button small color="primary" onClick={() => onDownload(document)} aria-label={`Download ${document.name}`}>
              <Icon name="download" />
              Download
            </Button>
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
    <h2>Save on taxes</h2>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--spacer-4)",
        marginTop: "var(--spacer-6)",
      }}
    >
      <div className="card" style={{ flex: "1 1 300px", minWidth: "300px" }}>
        <h3>Stonks.com</h3>
        <p>Get help with your taxes and save money with our partner service.</p>
        <NavigationButton color="primary" href="https://stonks.com" target="_blank">
          Learn more
        </NavigationButton>
      </div>
      <div className="card" style={{ flex: "1 1 300px", minWidth: "300px" }}>
        <h3>Kick.co</h3>
        <p>Optimize your tax strategy and maximize your deductions.</p>
        <NavigationButton color="primary" href="https://kick.co" target="_blank">
          Learn more
        </NavigationButton>
      </div>
    </div>
  </section>
);

const FAQSection = () => (
  <section>
    <h2>Frequently asked questions</h2>
    <div className="stack" style={{ marginTop: "var(--spacer-6)" }}>
      <details>
        <summary>What is a 1099-K form?</summary>
        <p>
          A 1099-K is an informational tax form that reports the gross amount of all payment transactions processed by a
          payment settlement entity (PSE) on your behalf. It's designed to help you report your income accurately.
        </p>
      </details>
      <details>
        <summary>When will I receive my tax forms?</summary>
        <p>
          Tax forms are typically available by January 31st of the following year. You'll receive an email notification
          when your forms are ready to download.
        </p>
      </details>
      <details>
        <summary>How are taxes calculated?</summary>
        <p>
          Taxes are calculated based on your sales and the applicable tax rates in your jurisdiction. The exact
          calculation depends on your location and the type of products you sell.
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
        marginTop: "var(--spacer-6)",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #000",
          borderRadius: "4px",
          padding: "var(--spacer-6)",
          textAlign: "center",
          minHeight: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "1 1 calc(33.333% - var(--spacer-4))",
          minWidth: "250px",
        }}
      >
        <a href="#" style={{ textDecoration: "none", color: "inherit" }}>
          How to estimate quarterly taxes
        </a>
      </div>
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #000",
          borderRadius: "4px",
          padding: "var(--spacer-6)",
          textAlign: "center",
          minHeight: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "1 1 calc(33.333% - var(--spacer-4))",
          minWidth: "250px",
        }}
      >
        <a href="#" style={{ textDecoration: "none", color: "inherit" }}>
          Using earnings summaries with your accountant
        </a>
      </div>
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #000",
          borderRadius: "4px",
          padding: "var(--spacer-6)",
          textAlign: "center",
          minHeight: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "1 1 calc(33.333% - var(--spacer-4))",
          minWidth: "250px",
        }}
      >
        <a href="#" style={{ textDecoration: "none", color: "inherit" }}>
          How to estimate quarterly taxes
        </a>
      </div>
    </div>
  </section>
);

const TaxesPage = ({ tax_documents_data }: { tax_documents_data: TaxDocumentsData | null }) => {
  const loggedInUser = useLoggedInUser();
  const [selectedYear, setSelectedYear] = React.useState(tax_documents_data?.selected_year || new Date().getFullYear());
  const [isLoading, setIsLoading] = React.useState(false);

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

  // Use real data when available
  const hasDocuments = tax_documents_data?.documents && tax_documents_data.documents.length > 0;
  const documents = tax_documents_data?.documents || [];
  const availableYears = tax_documents_data?.available_years || [new Date().getFullYear()];

  return (
    <main>
      <header>
        <h1>Tax documents</h1>
        {settingsAction ? <div className="actions flex gap-2">{settingsAction}</div> : null}
        <div role="tablist">
          <a href={Routes.balance_path()} role="tab" aria-selected={false}>
            Payouts
          </a>
          <a href={Routes.balance_path({ tab: "taxes" })} role="tab" aria-selected>
            Taxes
          </a>
        </div>
      </header>

      <div style={{ display: "grid", gap: "var(--spacer-7)" }}>
        {hasDocuments ? (
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
                <Button
                  color="primary"
                  onClick={handleDownloadAll}
                  disabled={isLoading}
                  aria-label="Download all documents"
                  style={{ minWidth: "140px" }}
                >
                  <Icon name="download" />
                  Download all
                </Button>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  style={{
                    padding: "var(--spacer-2) var(--spacer-3)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    minWidth: "100px",
                  }}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <TaxDocumentsTable documents={documents} onDownload={handleDownloadDocument} />
          </section>
        ) : (
          <section>
            <h2>Tax documents</h2>
            <div style={{ marginTop: "var(--spacer-5)" }}>
              <TaxDocumentsEmpty />
            </div>
          </section>
        )}

        <SaveOnTaxesSection />
        <FAQSection />
        <RelatedArticlesSection />
      </div>
    </main>
  );
};

export default register({ component: TaxesPage, propParser: createCast() });
