/**
 * Lightweight M-Pesa statement parser (no external AI required).
 * Extracts amount, reference, date from pasted SMS/statement text.
 */
export type MpesaParseResult = {
  amount: number | null;
  reference: string | null;
  date: string | null;
  vendorHint: string | null;
  phone: string | null;
  direction: "sent" | "received" | null;
};

export function parseMpesaText(text: string): MpesaParseResult {
  const normalized = text.replace(/\s+/g, " ").trim();

  // Reference code is the leading alphanumeric token, e.g. "RDE4K8L9PQ Confirmed."
  const refMatch = normalized.match(/^([A-Z0-9]{8,12})\s+Confirmed/i);

  const amountMatch = normalized.match(/Ksh\.?\s*([\d,]+(?:\.\d{2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;

  const dateMatch = normalized.match(
    /on\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+at\s+([\d:]+\s*[APap][Mm])/
  );

  const sentMatch = normalized.match(
    /sent to\s+([A-Za-z'.\- ]+?)\s+(0\d{9}|\+?254\d{9})/i
  );
  const receivedMatch = normalized.match(
    /\bfrom\s+([A-Za-z'.\- ]+?)\s+(0\d{9}|\+?254\d{9})/i
  );

  const match = sentMatch ?? receivedMatch;

  return {
    amount: amount && !isNaN(amount) ? amount : null,
    reference: refMatch?.[1]?.toUpperCase() ?? null,
    date: dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : null,
    vendorHint: match?.[1]?.trim() ?? null,
    phone: match?.[2] ?? null,
    direction: sentMatch ? "sent" : receivedMatch ? "received" : null,
  };
}

/**
 * Receipt OCR via Claude Haiku vision. Falls back to filename-based stub
 * when ANTHROPIC_API_KEY is not configured, so the form still works offline.
 */
export type ReceiptParseResult = {
  vendor_name: string | null;
  amount: number | null;
  date: string | null;
  items: { description: string; amount: number }[];
  etims_invoice_number: string | null;
  vendor_kra_pin: string | null;
};

export function parseReceiptStub(fileName: string): ReceiptParseResult {
  const amountMatch = fileName.match(/(\d+(?:\.\d{2})?)/);
  return {
    vendor_name: fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || null,
    amount: amountMatch ? parseFloat(amountMatch[1]) : null,
    date: null,
    items: [],
    etims_invoice_number: null,
    vendor_kra_pin: null,
  };
}

const RECEIPT_OCR_PROMPT =
  "Extract from this receipt: vendor name, total amount in KES, date, and itemised list if visible. Return JSON only: {\"vendor\": string, \"amount\": number, \"date\": string, \"items\": [{\"description\": string, \"amount\": number}]}";

export async function parseReceiptWithClaude(
  base64Image: string,
  mediaType: string
): Promise<ReceiptParseResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64Image },
              },
              { type: "text", text: RECEIPT_OCR_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      vendor_name: parsed.vendor ?? null,
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      date: parsed.date ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      etims_invoice_number: null,
      vendor_kra_pin: null,
    };
  } catch {
    return null;
  }
}
