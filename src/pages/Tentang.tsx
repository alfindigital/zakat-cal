import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { TELEGRAM_BASE } from "@/lib/contact";
import { useSeo, SITE_URL } from "@/lib/seo";

export default function Tentang() {
  useSeo({
    title: "Tentang ZakatCal — Metodologi, Sumber & Disclaimer",
    description:
      "Metodologi perhitungan zakat di ZakatCal, sumber rujukan (BAZNAS & fikih klasik), kebijakan privasi, dan disclaimer. Kalkulator zakat online gratis.",
    path: "/tentang",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "Tentang ZakatCal",
      url: `${SITE_URL}/tentang`,
    },
  });

  return (
    <div className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tentang ZakatCal</h1>
          <p className="text-muted-foreground">Kalkulator zakat online gratis, akurat, dan menjaga privasi.</p>
        </div>


        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Metodologi Perhitungan</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5">
              <li><span className="text-foreground font-medium">Nisab</span> — setara 85 gram emas atau 595 gram perak. Harga logam dapat Anda atur manual dan tersimpan di perangkat.</li>
              <li><span className="text-foreground font-medium">Kadar</span> — 2,5% (penghasilan, maal, perniagaan, ma'din), 5%/10% (pertanian), 20% (rikaz), tabel khusus (peternakan), 2,5 kg/jiwa (fitrah).</li>
              <li><span className="text-foreground font-medium">Penghasilan</span> — mendukung metode bruto maupun netto (potong kebutuhan pokok), mengikuti perbedaan pendapat ulama.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Sumber Rujukan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>Acuan perhitungan merujuk pada ketentuan umum BAZNAS dan kitab-kitab fikih klasik tentang zakat. Untuk keputusan yang mengikat, konsultasikan dengan amil zakat atau ustadz tepercaya.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Privasi</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>Semua perhitungan dilakukan sepenuhnya di perangkat Anda (browser). Angka penghasilan dan harta yang Anda masukkan <span className="text-foreground font-medium">tidak pernah dikirim ke server mana pun</span>. Riwayat hanya disimpan di penyimpanan lokal perangkat dan bisa Anda ekspor/hapus kapan saja.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Disclaimer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>Hasil perhitungan bersifat <span className="text-foreground font-medium">estimasi</span> untuk membantu, bukan fatwa. Perbedaan pendapat fikih, kondisi harta, dan kebijakan lembaga zakat setempat dapat memengaruhi nilai akhir. Pastikan menyalurkan zakat melalui amil/lembaga tepercaya.</p>
          </CardContent>
        </Card>

        <div className="rounded-xl border bg-card p-5 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Ingin menunaikan atau bertanya tentang penyaluran zakat?</p>
          <Button asChild className="h-11">
            <a href={TELEGRAM_BASE} target="_blank" rel="noopener noreferrer">
              <Send className="mr-2 h-4 w-4" /> Hubungi via Telegram
            </a>
          </Button>
        </div>

      </div>
    </div>
  );
}
