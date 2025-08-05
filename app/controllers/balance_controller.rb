# frozen_string_literal: true

require "prawn"
require "zip"

class BalanceController < Sellers::BaseController
  include CurrencyHelper
  include PayoutsHelper
  include Pagy::Backend

  PAST_PAYMENTS_PER_PAGE = 3

  before_action :set_body_id_as_app
  before_action :set_on_balance_page

  def index
    authorize :balance

    tab = params[:tab] || "payouts"
    @seller_stats = UserBalanceStatsService.new(user: current_seller).fetch
    pagination, _past_payouts = fetch_payouts

    if tab == "taxes"
      @title = "Taxes"

      # Generate tax documents data
      year = params[:year]&.to_i
      tax_service = TaxDocumentsService.new(current_seller, year)
      @tax_documents_data = tax_service.tax_documents_data

      @taxes_presenter = TaxesPresenter.new(
        tax_documents_data: @tax_documents_data,
        pagination: pagination,
        seller: current_seller,
        current_tab: tab
      )
    else
      @title = "Payouts"
      @payout_presenter = PayoutsPresenter.new(
        next_payout_period_data: @seller_stats[:next_payout_period_data],
        processing_payout_periods_data: @seller_stats[:processing_payout_periods_data],
        seller: current_seller,
        pagination:,
        past_payouts: _past_payouts
      )
    end
  end

  def payments_paged
    authorize :balance, :index?

    pagination, payouts = fetch_payouts

    render json: {
      payouts: payouts.map { payout_period_data(current_seller, _1) },
      pagination:
    }
  end

  def tax_documents_download_all
    authorize :balance, :index?

    year = params[:year]&.to_i || Time.current.year
    tax_service = TaxDocumentsService.new(current_seller, year)
    documents = tax_service.generate_tax_documents

    # Generate ZIP file with all documents
    temp_file = Tempfile.new(["tax_documents", ".zip"])

    Zip::File.open(temp_file.path, Zip::File::CREATE) do |zipfile|
      documents.each do |document|
        # Generate proper content for each document
        content = generate_tax_document_content(document, year)
        zipfile.get_output_stream("#{document[:name].gsub(/\s+/, '-')}-#{year}.pdf") do |f|
          f.write(content)
        end
      end
    end

    send_file temp_file.path,
              filename: "tax-documents-#{year}.zip",
              type: "application/zip",
              disposition: "attachment"
  end

  def tax_document_download
    authorize :balance, :index?

    year = params[:year]&.to_i || Time.current.year
    document_type = params[:document_type]
    quarter = params[:quarter]

    tax_service = TaxDocumentsService.new(current_seller, year)
    documents = tax_service.generate_tax_documents

    # Find the specific document
    document = if document_type == "1099k"
      documents.find { |doc| doc[:id] == "1099k_#{year}" }
    elsif document_type == "quarterly"
      documents.find { |doc| doc[:id] == "#{quarter.downcase}_#{year}" }
    end

    if document.nil?
      render json: { error: "Document not found" }, status: :not_found
      return
    end

    # Generate formatted PDF content with actual data
    pdf_content = generate_tax_document_content(document, year)

    send_data pdf_content,
              filename: "#{document[:name].gsub(/\s+/, '-')}-#{year}.pdf",
              type: "application/pdf",
              disposition: "attachment"
  end

  private
    def set_on_balance_page
      @on_balance_page = true
    end

    def fetch_payouts
      payouts = current_seller.payments
        .completed
        .displayable
        .order(created_at: :desc)

      payouts_count = payouts.count
      total_pages = (payouts_count / PAST_PAYMENTS_PER_PAGE.to_f).ceil
      page_num = params[:page].to_i

      if page_num <= 0
        page_num = 1
      elsif page_num > total_pages && total_pages != 0
        page_num = total_pages
      end

      pagination, payouts = pagy(payouts, page: page_num, limit: PAST_PAYMENTS_PER_PAGE)
      [PagyPresenter.new(pagination).props, payouts]
    end

    def generate_tax_document_content(document, year)
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

    def format_currency(cents)
      (cents / 100.0).round(2)
    end
end
