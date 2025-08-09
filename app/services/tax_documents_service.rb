# frozen_string_literal: true

class TaxDocumentsService
  def initialize(user, year = nil)
    @user = user
    @year = year || default_year_for_user
  end

  def generate_tax_documents
    documents = []

    # Generate 1099-K form if eligible
    if @user.eligible_for_1099_k?(@year)
      document = generate_1099k_document
      documents << document unless document.nil?
    end

    # Generate quarterly earning summaries
    documents.concat(generate_quarterly_summaries)

    documents
  end

  def tax_documents_data
    documents = generate_tax_documents

    {
      documents: documents,
      selected_year: @year,
      available_years: available_years
    }
  end

  private
    def default_year_for_user
      # Find the most recent year where the user has sales
      years_with_sales = @user.sales.successful.pluck(:created_at).map(&:year).uniq.sort
      return Time.current.year if years_with_sales.empty?

      years_with_sales.last
    end

    def generate_1099k_document
      sales_data = @user.sales_scope_for(@year)
      gross_cents = sales_data.sum(:total_transaction_cents)
      fees_cents = sales_data.sum(:fee_cents)
      taxes_cents = sales_data.sum(:tax_cents)
      net_cents = gross_cents - fees_cents - taxes_cents

      # Only return 1099-K if there are actual sales
      return nil if gross_cents == 0

      {
        id: "1099k_#{@year}",
        name: "1099-K",
        type: "IRS form",
        gross_cents: gross_cents,
        fees_cents: fees_cents,
        taxes_cents: taxes_cents,
        net_cents: net_cents,
        is_new: true,
        download_url: "/tax-documents/1099k/annual/download?year=#{@year}"
      }
    end

    def generate_quarterly_summaries
      quarters = [
        { name: "Q1", start_date: Date.new(@year, 1, 1), end_date: Date.new(@year, 3, 31) },
        { name: "Q2", start_date: Date.new(@year, 4, 1), end_date: Date.new(@year, 6, 30) },
        { name: "Q3", start_date: Date.new(@year, 7, 1), end_date: Date.new(@year, 9, 30) },
        { name: "Q4", start_date: Date.new(@year, 10, 1), end_date: Date.new(@year, 12, 31) }
      ]

      quarter_documents = quarters.map do |quarter|
        sales_data = @user.sales
          .successful
          .where(created_at: quarter[:start_date]..quarter[:end_date])

        gross_cents = sales_data.sum(:total_transaction_cents)
        fees_cents = sales_data.sum(:fee_cents)
        taxes_cents = sales_data.sum(:tax_cents)
        net_cents = gross_cents - fees_cents - taxes_cents

        {
          id: "#{quarter[:name].downcase}_#{@year}",
          name: "#{quarter[:name]} Earning summary",
          type: "Report",
          gross_cents: gross_cents,
          fees_cents: fees_cents,
          taxes_cents: taxes_cents,
          net_cents: net_cents,
          download_url: "/tax-documents/quarterly/#{quarter[:name].downcase}/download?year=#{@year}"
        }
      end

      # Check if all quarters have 0 data
      all_quarters_zero = quarter_documents.all? { |doc| doc[:gross_cents] == 0 }

      if all_quarters_zero
        # Return empty array to show placeholder
        []
      else
        # Return only quarters with data
        quarter_documents.select { |doc| doc[:gross_cents] > 0 }
      end
    end

    def available_years
      current_year = Time.current.year
      years_with_sales = @user.sales.successful.pluck(:created_at).map(&:year).uniq.sort

      # Always include current year and years with sales
      (years_with_sales + [current_year]).uniq.sort
    end
end
