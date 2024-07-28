export type InvoiceLinesCreateModel = {
    /**
     * The guid of product. If product guid is set, description should be null.
     */
    productGuid?: string | null;
    /**
     * A description of the product. If no ProductGuid, this field is required.
 * This field will always have a value on the read model, even if a ProductGuid is set.
     */
    description?: string | null;
    /**
     * User supplied comment
     */
    comments?: string | null;
    /**
     * Quantity
     */
    quantity: number;
    /**
     * Account number
     */
    accountNumber: number;
    /**
     * Product unit. Required when LineType = Product. Available unit types: hours, parts, km, day, week, month, kilogram, cubicMetre, set, litre, box, case, carton, metre, package, shipment, squareMetre, session, tonne.
     */
    unit?: string | null;
    /**
     * Discount for the current line. Specified in percentage from 0 to 100.
     */
    discount: number;
    /**
     * Type. Either Product or Text line.
 * Text is used for creating bold lines only with text displayed, these lines are purely visual and have no effect on the voucher.
 * Text lines should only contain a description.
 * Product lines are the actual lines of the invoice used for accounting and total calculations.
     */
    lineType?: string | null;
    /**
     * Base amount. As default without VAT. If you want to use amounts incl vat, the setting 'ShowLinesInclVat' should be set to true on the voucher containing the lines.
     */
    baseAmountValue: number;
};


/**
 * Model for creating a sales voucher
 */
export type InvoiceCreateModel = {
    /**
     * The currency used on the voucher. Defaults to DKK if null. Dinero will assign days date currency rate for the given currency. Currencies are given in format: DKK, EUR, USD etc...
     */
    currency?: string | null;
    /**
     * The language to be used in the voucher. Available languages are 'da-DK' and 'en-GB'. Defaults to 'da-DK'.
     */
    language?: string | null;
    /**
     * Your external id
 * This can be used for ID'ing in external apps/services e.g. a web shop.
 * The maximum length is 128 characters
     */
    externalReference?: string | null;
    /**
     * User supplied description of the voucher e.g. 'Custom Invoice description'. Defaults to document type e.g. 'Invoice', 'Offer', 'Creditnote' using the selected language.
     */
    description?: string | null;
    /**
     * User supplied comment on the voucher
     */
    comment?: string | null;
    /**
     * The date of the creation/issuing. This should be in the format YYYY-MM-DD e.g. 2015-12-02. Defaults to today.
     */
    date?: string | null;
    /**
     * User supplied invoice lines. Minimum one.
     */
    productLines: Array<InvoiceLinesCreateModel>;
    /**
     * Contact address (linebreaks are allowed '\n'). When null is specified the address defaults to the contacts address.
     */
    address?: string | null;
    /**
     * Optional guid for the object. If not set the system will create a guid returned in the response.
     */
    guid?: string | null;
    /**
     * If your user (or your system) prefers to provide the line amounts incl. VAT, then this property should be set to true. All voucher lines will be assumed to have amounts incl VAT.
 * If your lines are excl VAT, you do not need to set this property. It will defaults to false.
     */
    showLinesInclVat?: boolean | null;
    /**
     * Template id to use for design. If null, the default one will be used.
     */
    invoiceTemplateId?: string | null;
    /**
     * Dinero contact guid. Optional for creating a draft, required for booking.
     */
    contactGuid?: string | null;
    /**
     * Number of days until payment deadline. If PaymentConditionNumberOfDays AND PaymentConditionType is left empty they will default to the contacts default payment conditions.
     */
    paymentConditionNumberOfDays?: number | null;
    /**
     * Type of payment condition. Valid types are: Netto, NettoCash, CurrentMonthOut, or Paid. Note that if you use NettoCash or Paid, PaymentConditionNumberOfDays should be null.
     */
    paymentConditionType?: string | null;
    /**
     * Reminder fee for any reminders created from the invoice. Should be nonnegative and at most 100. Will use default sales voucher setting if left empty.
     */
    reminderFee?: number | null;
    /**
     * Reminder interest rate for any reminders created from the invoice. Should be nonnegative and at most 100. Will use default sales voucher setting if left empty.
     */
    reminderInterestRate?: number | null;
    /**
     * Indicates whether MobilePay Invoice should be enabled for this invoice.
     */
    isMobilePayInvoiceEnabled?: boolean | null;
    /**
     * Indicates whether PensoPay should be enabled for this invoice.
     */
    isPensoPayEnabled?: boolean | null;
};