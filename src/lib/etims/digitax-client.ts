export type DigitaxInvoicePayload = {
  invoiceNumber: string;
  customerName?: string;
  customerPin?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  paymentType?: string;
};

export type DigitaxInvoiceResponse = {
  digitaxInvoiceId: string;
  cuSerial: string;
  cuInvoiceNo: string;
  internalData: string;
  receiptSignature: string;
  receiptDate: string;
  receiptTime: string;
};

function formatKraDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

function formatKraTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}${min}${ss}`;
}

function mockDigitaxResponse(invoiceNumber: string): DigitaxInvoiceResponse {
  const now = new Date();
  const internalData = "MOCK" + Date.now().toString(36).toUpperCase().padEnd(20, "0").slice(0, 20);
  const receiptSignature = "SIG" + Date.now().toString(36).toUpperCase().padEnd(20, "0").slice(0, 20);

  return {
    digitaxInvoiceId: `mock-${invoiceNumber}`,
    cuSerial: "KRA001",
    cuInvoiceNo: invoiceNumber.replace(/\D/g, "").slice(-8).padStart(8, "0"),
    internalData,
    receiptSignature,
    receiptDate: formatKraDate(now),
    receiptTime: formatKraTime(now),
  };
}

export function buildEtimsQrPayload(response: DigitaxInvoiceResponse): string {
  return [
    response.receiptDate,
    response.receiptTime,
    response.cuSerial,
    response.cuInvoiceNo,
    response.internalData,
    response.receiptSignature,
  ].join("#");
}

export async function submitInvoiceToDigitax(
  payload: DigitaxInvoicePayload,
  apiKey?: string | null
): Promise<DigitaxInvoiceResponse> {
  const baseUrl = process.env.DIGITAX_API_BASE_URL;
  const key = apiKey ?? process.env.DIGITAX_PLATFORM_API_KEY;

  if (!baseUrl || !key) {
    return mockDigitaxResponse(payload.invoiceNumber);
  }

  const total = payload.lineItems.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0
  );

  const res = await fetch(`${baseUrl}/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
    },
    body: JSON.stringify({
      invoice_number: payload.invoiceNumber,
      customer_name: payload.customerName ?? "Guest",
      customer_pin: payload.customerPin,
      line_items: payload.lineItems.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        tax_rate: line.taxRate ?? 0,
      })),
      total_amount: total,
      payment_type: payload.paymentType ?? "CASH",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `DigiTax API error (${res.status})`);
  }

  const body = (await res.json()) as Record<string, string>;

  return {
    digitaxInvoiceId: body.id ?? body.invoice_id ?? payload.invoiceNumber,
    cuSerial: body.cu_serial ?? body.cuSerial ?? "KRA001",
    cuInvoiceNo: body.cu_invoice_no ?? body.cuInvoiceNo ?? payload.invoiceNumber,
    internalData: body.internal_data ?? body.internalData ?? "",
    receiptSignature: body.receipt_signature ?? body.receiptSignature ?? "",
    receiptDate: body.receipt_date ?? formatKraDate(new Date()),
    receiptTime: body.receipt_time ?? formatKraTime(new Date()),
  };
}
