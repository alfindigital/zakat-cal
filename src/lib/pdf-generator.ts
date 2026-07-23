import { formatRupiah, roundZakat } from "@/lib/zakat";
import { WA_NUMBER } from "@/lib/contact";

interface PdfRow {
  label: string;
  value: string;
}

// jsPDF (+ its html2canvas/dompurify deps) is heavy, so it is imported
// dynamically only when the user actually downloads a PDF. This keeps it out
// of the initial bundle.
// Brand palette derived from the app's design tokens (light theme --primary
// `158 64% 32%`). PDFs stay on a light surface regardless of the in-app
// dark/light preference so the printed output is always legible.
const BRAND = { r: 29, g: 134, b: 95 } as const;
const INK = { r: 30, g: 41, b: 46 } as const;
const MUTED = { r: 100, g: 116, b: 120 } as const;
const BORDER = { r: 210, g: 218, b: 214 } as const;
const SURFACE = { r: 240, g: 247, b: 243 } as const;

export async function generateZakatPdf(type: string, rows: PdfRow[], rawAmount: number, isWajib: boolean) {
  const zakatAmount = roundZakat(rawAmount);
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  // Brand header bar
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, 14, "F");

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text("ZakatCal — Kalkulator Zakat", pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(`Hasil Perhitungan Zakat ${type}`, pageWidth / 2, 36, { align: "center" });
  doc.text(date, pageWidth / 2, 43, { align: "center" });

  // Divider
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(20, 49, pageWidth - 20, 49);

  // Rows
  let y = 61;
  doc.setFontSize(11);

  for (const row of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(row.label, 25, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(row.value, pageWidth - 25, y, { align: "right" });
    y += 10;
  }

  // Status
  y += 4;
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(25, y, pageWidth - 25, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Status", 25, y);
  doc.setFont("helvetica", "bold");
  if (isWajib) {
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  } else {
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  }
  doc.text(isWajib ? "Wajib Zakat" : "Belum Wajib", pageWidth - 25, y, { align: "right" });

  // Total
  y += 14;
  doc.setFillColor(SURFACE.r, SURFACE.g, SURFACE.b);
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.roundedRect(20, y - 8, pageWidth - 40, 22, 3, 3, "FD");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text("Zakat yang Harus Dibayar", 25, y + 4);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setFontSize(14);
  doc.text(formatRupiah(zakatAmount), pageWidth - 25, y + 4, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tunaikan via Telegram: t.me/${WA_NUMBER}  •  Perhitungan bersifat estimasi.`,
    pageWidth / 2,
    280,
    { align: "center" },
  );

  doc.save(`zakat-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.pdf`);
}

