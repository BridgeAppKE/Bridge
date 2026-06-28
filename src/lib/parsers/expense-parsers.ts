/**
 * Lightweight M-Pesa statement parser (no external AI required).
 * Extracts amount, reference, date from pasted SMS/statement text.
 */
export type MpesaParseResult = {
  amount: number | null;
  reference: string | null;
  date: string | null;
  vendorHint: string | null;
};

export function parseMpesaText(text: string): MpesaParseResult {
  const normalized = text.replace(/\s+/g, " ").trim();

  const amountMatch = normalized.match(
    /(?:Ksh\.?|KES)\s*([\d,]+(?:\.\d{2})?)/i
  );
  const refMatch = normalized.match(
    /(?:Ref|Reference|Transaction(?:\s+ID)?|Receipt(?:\s+No)?)[:\s#]*([A-Z0-9]{6,12})/i
  );
  const dateMatch = normalized.match(
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/
  );
  const paidToMatch = normalized.match(
    /(?:paid to|sent to|received from)\s+([A-Za-z0-9 '&.-]{3,40})/i
  );

  const amount = amountMatch
    ? parseFloat(amountMatch[1].replace(/,/g, ""))
    : null;

  return {
    amount: amount && !isNaN(amount) ? amount : null,
    reference: refMatch?.[1] ?? null,
    date: dateMatch?.[1] ?? null,
    vendorHint: paidToMatch?.[1]?.trim() ?? null,
  };
}

/**
 * Stub OCR parser — pre-fills expense fields from receipt filename hints.
 * Replace with Edge Function vision call when OPENAI_API_KEY is configured.
 */
export type ReceiptParseResult = {
  vendor_name: string | null;
  amount: number | null;
  etims_invoice_number: string | null;
  vendor_kra_pin: string | null;
};

export function parseReceiptStub(fileName: string): ReceiptParseResult {
  const amountMatch = fileName.match(/(\d+(?:\.\d{2})?)/);
  return {
    vendor_name: fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || null,
    amount: amountMatch ? parseFloat(amountMatch[1]) : null,
    etims_invoice_number: null,
    vendor_kra_pin: null,
  };
}
