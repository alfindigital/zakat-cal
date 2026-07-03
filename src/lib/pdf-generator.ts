import { formatRupiah, roundZakat } from "@/lib/zakat";
import { WA_NUMBER } from "@/lib/contact";

interface PdfRow {
  label: string;
  value: string;
}

// jsPDF (+ its html2canvas/dompurify deps) is heavy, so it is imported
// dynamically only when the user actually downloads a PDF. This keeps it out
// of the initial bundle.
export async function generateZakatPdf(type: string, rows: PdfRow[], rawAmount: number, isWajib: boolean) {
  const zakatAmount = roundZakat(rawAmount);
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ZakatCal — Kalkulator Zakat", pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Hasil Perhitungan Zakat ${type}`, pageWidth / 2, 33, { align: "center" });
  doc.text(date, pageWidth / 2, 40, { align: "center" });

  // Divider
  doc.setDrawColor(200);
  doc.line(20, 46, pageWidth - 20, 46);

  // Rows
  let y = 58;
  doc.setTextColor(60);
  doc.setFontSize(11);

  for (const row of rows) {
    doc.setFont("helvetica", "normal");
    doc.text(row.label, 25, y);
    doc.setFont("helvetica", "bold");
    doc.text(row.value, pageWidth - 25, y, { align: "right" });
    y += 10;
  }

  // Status
  y += 4;
  doc.setDrawColor(200);
  doc.line(25, y, pageWidth - 25, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text("Status", 25, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isWajib ? 22 : 100, isWajib ? 130 : 100, isWajib ? 76 : 100);
  doc.text(isWajib ? "Wajib Zakat" : "Belum Wajib", pageWidth - 25, y, { align: "right" });

  // Total
  y += 14;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, y - 8, pageWidth - 40, 22, 3, 3, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40);
  doc.text("Zakat yang Harus Dibayar", 25, y + 4);
  doc.setTextColor(22, 130, 76);
  doc.setFontSize(14);
  doc.text(formatRupiah(zakatAmount), pageWidth - 25, y + 4, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tunaikan via Telegram: t.me/${WA_NUMBER}  •  Perhitungan bersifat estimasi.`,
    pageWidth / 2,
    280,
    { align: "center" },
  );


  doc.save(`zakat-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.pdf`);
}
