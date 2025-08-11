# frozen_string_literal: true

require "prawn"

class TaxDocumentsService
  attr_reader :user, :year

  def initialize(user, year = nil)
    @user = user
    @year = year || default_year_for_user
  end

  def tax_documents_data
    documents = generate_tax_documents

    {
      documents: documents,
      selected_year: @year,
      available_years: available_years
    }
  end

  def generate_tax_documents
    documents = []

    # Generate 1099-K form if eligible
    if user.eligible_for_1099_k?(year)
      document = generate_1099k_document
      documents << document if document.present?
    end

    # Generate quarterly earning summaries
    documents.concat(generate_quarterly_summaries)

    documents
  end

  def generate_pdf(document)
    Prawn::Document.new do |pdf|
      pdf.font_size 12
      pdf.font "Helvetica"

      # Header
      pdf.text "GUMROAD TAX DOCUMENT", size: 18, style: :bold, align: :center
      pdf.move_down 20

      # Document info
      pdf.text "Document: #{document[:name]}", size: 12
      pdf.text "Year: #{year}", size: 12
      pdf.text "Type: #{document[:type]}", size: 12
      pdf.text "Generated: #{Time.current.strftime('%B %d, %Y at %I:%M %p')}", size: 12
      pdf.move_down 20

      # Financial summary
      pdf.text "FINANCIAL SUMMARY", size: 14, style: :bold
      pdf.move_down 10

      pdf.text "Gross Revenue:     $#{format_currency(document[:gross_cents])}", size: 12
      pdf.text "Fees:              $#{format_currency(document[:fees_cents])}", size: 12
      pdf.text "Taxes:             $#{format_currency(document[:taxes_cents])}", size: 12
      pdf.text "Net Earnings:      $#{format_currency(document[:net_cents])}", size: 12
      pdf.move_down 20

      # Additional information based on document type
      if document[:type] == "Report" && document[:name].include?("Q")
        pdf.text "QUARTERLY BREAKDOWN", size: 14, style: :bold
        pdf.move_down 10
        pdf.text "This document contains your earnings summary for #{document[:name]}."
        pdf.text "Please consult with your tax professional for proper tax filing."
        pdf.move_down 10
      elsif document[:type] == "IRS form"
        pdf.text "IRS FORM 1099-K INFORMATION", size: 14, style: :bold
        pdf.move_down 10
        pdf.text "This document contains information that may be reported to the IRS."
        pdf.text "Please consult with your tax professional for proper tax filing."
        pdf.move_down 10
      end

      # Important notes
      pdf.text "IMPORTANT NOTES", size: 14, style: :bold
      pdf.move_down 10
      pdf.text "• This document is for informational purposes only"
      pdf.text "• Please consult with a qualified tax professional"
      pdf.text "• Keep this document for your tax records"
      pdf.text "• Gumroad is not responsible for tax advice"
    end.render
  end

  private
    def default_year_for_user
      years_with_sales = user.sales.in_progress_or_successful.excluding_test.pluck(:created_at).map(&:year).uniq.sort
      return Time.current.year if years_with_sales.empty?

      years_with_sales.last
    end

    def generate_1099k_document
      sales_data = user.sales.in_progress_or_successful.excluding_test.where("EXTRACT(YEAR FROM created_at) = ?", year)
      gross_cents = sales_data.sum(:total_transaction_cents)
      fees_cents = sales_data.sum(:fee_cents)
      taxes_cents = sales_data.sum(:tax_cents)
      net_cents = gross_cents - fees_cents - taxes_cents

      return nil if gross_cents.zero?

      {
        id: "1099k_#{year}",
        name: "1099-K",
        type: "IRS form",
        gross_cents: gross_cents,
        fees_cents: fees_cents,
        taxes_cents: taxes_cents,
        net_cents: net_cents,
        # is_new: year == Time.current.year || year == Time.current.year - 1,
        download_url: "/tax-documents/1099k/annual/download?year=#{year}"
      }
    end

    def generate_quarterly_summaries
      quarters = [
        { name: "Q1", start_date: Date.new(year, 1, 1), end_date: Date.new(year, 3, 31) },
        { name: "Q2", start_date: Date.new(year, 4, 1), end_date: Date.new(year, 6, 30) },
        { name: "Q3", start_date: Date.new(year, 7, 1), end_date: Date.new(year, 9, 30) },
        { name: "Q4", start_date: Date.new(year, 10, 1), end_date: Date.new(year, 12, 31) }
      ]

      quarter_documents = quarters.map do |quarter|
        sales_data = user.sales
          .in_progress_or_successful
          .excluding_test
          .where(created_at: quarter[:start_date]..quarter[:end_date])

        gross_cents = sales_data.sum(:total_transaction_cents)
        fees_cents = sales_data.sum(:fee_cents)
        taxes_cents = sales_data.sum(:tax_cents)
        net_cents = gross_cents - fees_cents - taxes_cents

        {
          id: "#{quarter[:name].downcase}_#{year}",
          name: "#{quarter[:name]} Earning summary",
          type: "Report",
          gross_cents: gross_cents,
          fees_cents: fees_cents,
          taxes_cents: taxes_cents,
          net_cents: net_cents,
          # is_new: year == Time_current.year || year == Time.current.year - 1,
          download_url: "/tax-documents/quarterly/#{quarter[:name].downcase}/download?year=#{year}"
        }
      end

      all_quarters_zero = quarter_documents.all? { |doc| doc[:gross_cents].zero? }

      if all_quarters_zero
        []
      else
        quarter_documents.select { |doc| doc[:gross_cents].positive? }
      end
    end

    def available_years
      current_year = Time.current.year
      years_with_sales = user.sales.in_progress_or_successful.excluding_test.pluck(:created_at).map(&:year).uniq.sort

      (years_with_sales + [current_year]).uniq.sort
    end

    def format_currency(cents)
      (cents / 100.0).round(2)
    end
end
