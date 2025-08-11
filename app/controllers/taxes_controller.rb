# frozen_string_literal: true

class TaxesController < Sellers::BaseController
  before_action :set_on_taxes_page

  def index
    authorize :balance

    year = selected_year
    tax_service = TaxDocumentsService.new(current_seller, year)
    @tax_documents_data = tax_service.tax_documents_data
    @taxes_presenter = TaxesPresenter.new(
      tax_documents_data: @tax_documents_data,
      pagination: nil,
      seller: current_seller
    )

    render "taxes/index"
  end

  def tax_documents_download_all
    authorize :balance, :index?

    year = selected_year
    tax_service = TaxDocumentsService.new(current_seller, year)
    documents = tax_service.generate_tax_documents

    if documents.empty?
      render json: { success: false, error: "No tax documents available for this year" }, status: :not_found
      return
    end

    require "zip"

    temp_file = Tempfile.new(["tax-documents", ".zip"])
    Zip::File.open(temp_file.path, Zip::File::CREATE) do |zipfile|
      documents.each do |document|
        begin
          pdf_content = tax_service.generate_pdf(document)
          filename = "#{document[:name].gsub(/\s+/, '-')}-#{year}.pdf"
          zipfile.get_output_stream(filename) { |f| f.write(pdf_content) }
        rescue => e
          Rails.logger.error("Failed to generate PDF for document #{document[:id]}: #{e.message}")
          next
        end
      end
    end

    send_file temp_file.path,
              filename: "tax-documents-#{year}.zip",
              type: "application/zip",
              disposition: "attachment"
  rescue => e
    Rails.logger.error("Failed to generate tax documents ZIP: #{e.message}")
    render json: { success: false, error: "Failed to generate tax documents" }, status: :internal_server_error
  end

  def tax_document_download
    authorize :balance, :index?

    year = selected_year
    document_type = params[:document_type]
    identifier = params[:identifier]

    tax_service = TaxDocumentsService.new(current_seller, year)
    documents = tax_service.generate_tax_documents

    # Find the specific document
    document = if document_type == "1099k"
      documents.find { |doc| doc[:id] == "1099k_#{year}" }
    elsif document_type == "quarterly"
      documents.find { |doc| doc[:id] == "#{identifier.downcase}_#{year}" }
    end

    if document.nil?
      render json: { success: false, error: "Document not found" }, status: :not_found
      return
    end

    # Generate PDF using the service
    begin
      pdf_content = tax_service.generate_pdf(document)
    rescue StandardError => e
      Rails.logger.error("Failed to generate PDF for document #{document[:id]}: #{e.message}")
      render json: { success: false, error: "Failed to generate PDF document" }, status: :internal_server_error
      return
    end

    send_data pdf_content,
              filename: "#{document[:name].gsub(/\s+/, '-')}-#{year}.pdf",
              type: "application/pdf",
              disposition: "attachment"
  end

  private
    def set_on_taxes_page
      @on_taxes_page = true
    end

    def selected_year
      y = params[:year].to_s
      (/\A\d{4}\z/ =~ y) ? y.to_i : Time.current.year
    end
end
