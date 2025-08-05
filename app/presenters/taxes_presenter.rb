# frozen_string_literal: true

class TaxesPresenter
  include CurrencyHelper
  include PayoutsHelper

  attr_reader :tax_documents_data, :pagination, :seller

  def initialize(tax_documents_data:, pagination:, seller:, current_tab: "taxes")
    @tax_documents_data = tax_documents_data
    @pagination = pagination
    @seller = seller
    @current_tab = current_tab
  end

  def props
    {
      tax_documents_data: @tax_documents_data,
      pagination: @pagination,
      current_tab: @current_tab
    }
  end
end
