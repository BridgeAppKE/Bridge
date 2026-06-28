import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import type { DigitaxInvoiceResponse } from "@/lib/etims/digitax-client";
import { buildEtimsQrPayload } from "@/lib/etims/digitax-client";

export type InvoicePdfInput = {
  bookingId: string;
  unitName: string;
  guestCount: number;
  startDate: string;
  endDate: string;
  nightlyRate: number;
  hostName?: string;
  etims?: DigitaxInvoiceResponse & { qrPayload: string };
};

export async function generateInvoicePdfBuffer(data: InvoicePdfInput): Promise<Buffer> {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const total = nights * data.nightlyRate * Math.max(data.guestCount, 1);

  const doc = new jsPDF();
  doc.setFillColor(2, 44, 34);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(236, 253, 245);
  doc.setFontSize(22);
  doc.text(data.etims ? "EliteHost Tax Invoice" : "EliteHost Invoice", 14, 22);
  doc.setFontSize(10);
  doc.text(`Host: ${data.hostName ?? "EliteHost User"}`, 14, 32);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text(`Unit: ${data.unitName}`, 14, 52);
  doc.text(`Stay: ${data.startDate} to ${data.endDate}`, 14, 60);
  doc.text(`Guests: ${data.guestCount}`, 14, 68);

  autoTable(doc, {
    startY: 78,
    head: [["Description", "Qty", "Rate (KES)", "Total (KES)"]],
    body: [
      [
        "Accommodation",
        `${nights} night(s)`,
        data.nightlyRate.toLocaleString(),
        total.toLocaleString(),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [6, 78, 59] },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  doc.setFontSize(14);
  doc.text(`Total: KES ${total.toLocaleString()}`, 14, finalY + 14);

  if (data.etims) {
    const qrPayload = data.etims.qrPayload || buildEtimsQrPayload(data.etims);
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 120, margin: 1 });
    doc.setFontSize(9);
    doc.text(`CUIN: ${data.etims.cuInvoiceNo}`, 14, finalY + 26);
    doc.text(`SCU: ${data.etims.cuSerial}`, 14, finalY + 32);
    doc.addImage(qrDataUrl, "PNG", 150, finalY + 8, 40, 40);
    doc.setFontSize(7);
    doc.text("Scan to verify with KRA eTIMS", 140, finalY + 52);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
