import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { useSeo, SITE_URL } from "@/lib/seo";

const sections = [
  {
    title: "Nisab zakat emas: 85 gram",
    body: "Zakat emas wajib bila emas yang Anda simpan mencapai nisab 85 gram emas murni (24 karat) dan telah dimiliki selama satu tahun hijriyah (haul). Bila belum mencapai 85 gram, belum ada kewajiban zakat atas emas tersebut — kecuali digabung dengan harta simpanan lain pada perhitungan zakat maal.",
  },
  {
    title: "Kadar zakat emas: 2,5%",
    body: "Kadar zakat emas adalah 2,5% (1/40) dari nilai emas yang dimiliki saat haul tercapai. Nilainya dihitung dari harga emas per gram yang berlaku pada saat menunaikan zakat, bukan harga saat membeli.",
  },
  {
    title: "Cara menghitung zakat emas",
    body: "Rumusnya sederhana: (berat emas dalam gram × harga emas per gram) × 2,5%.",
    list: [
      "Timbang total emas simpanan Anda dalam gram (misal 100 gram).",
      "Pastikan sudah melewati nisab 85 gram dan haul 1 tahun hijriyah.",
      "Kalikan dengan harga emas per gram hari ini (misal Rp1.500.000) → Rp150.000.000.",
      "Kalikan 2,5% → zakat yang wajib dikeluarkan Rp3.750.000.",
    ],
  },
  {
    title: "Emas perhiasan yang dipakai sehari-hari",
    body: "Menurut sebagian besar ulama, emas perhiasan yang wajar dipakai sehari-hari tidak dikenai zakat. Yang dizakati adalah emas simpanan/investasi (batangan, koin, atau perhiasan yang disimpan sebagai aset). Jika Anda mengikuti pendapat ini, masukkan hanya emas simpanan pada kalkulator.",
  },
  {
    title: "Emas, perak, dan harta lain digabung",
    body: "Emas termasuk bagian dari zakat maal. Bila emas Anda sendiri belum mencapai nisab, nilainya tetap digabung dengan tabungan, perak, investasi, dan aset produktif lain. Bila totalnya mencapai nisab 85 gram emas, zakat 2,5% tetap wajib.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Cara menghitung zakat emas",
  description:
    "Cara menghitung zakat emas: nisab 85 gram emas, haul 1 tahun hijriyah, kadar 2,5% dari nilai emas.",
  url: `${SITE_URL}/zakat-emas`,
  step: [
    { "@type": "HowToStep", name: "Hitung berat emas", text: "Jumlahkan total emas simpanan Anda dalam gram." },
    { "@type": "HowToStep", name: "Cek nisab & haul", text: "Pastikan mencapai nisab 85 gram emas dan telah dimiliki satu tahun hijriyah." },
    { "@type": "HowToStep", name: "Hitung nilai emas", text: "Kalikan berat emas dengan harga emas per gram yang berlaku saat ini." },
    { "@type": "HowToStep", name: "Keluarkan 2,5%", text: "Kalikan nilai emas dengan 2,5% untuk mengetahui zakat yang wajib dibayar." },
  ],
};

export default function ZakatEmas() {
  useSeo({
    title: "Kalkulator Zakat Emas: Nisab 85g & 2,5% | ZakatCal",
    description:
      "Cara menghitung zakat emas: nisab 85 gram, haul 1 tahun, kadar 2,5%. Hitung otomatis dengan harga emas per gram terkini di kalkulator ZakatCal.",
    path: "/zakat-emas",
    jsonLd,
  });

  return (
    <main
      className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-12 md:py-8 flex-1 space-y-4 sm:space-y-5 md:space-y-6"
      style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Kalkulator Zakat Emas</h1>
        <p className="text-xs text-muted-foreground leading-relaxed sm:text-sm">
          Zakat emas wajib bila emas simpanan Anda mencapai nisab 85 gram dan telah dimiliki
          satu tahun hijriyah (haul). Kadarnya 2,5% dari nilai emas saat ini.
        </p>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/">
            <Calculator className="h-4 w-4 mr-2" />
            Hitung zakat emas sekarang
          </Link>
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
              <h2 className="text-base font-semibold leading-none tracking-tight sm:text-lg">{s.title}</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed px-4 pb-4 sm:px-6 sm:pb-5 sm:text-sm">
              <p>{s.body}</p>
              {s.list && (
                <ol className="list-decimal list-inside space-y-2">
                  {s.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="px-4 py-4 sm:px-6 sm:py-5 space-y-3 text-xs sm:text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Kalkulator Zakat Maal ZakatCal sudah memakai harga emas per gram terkini, jadi
            Anda cukup memasukkan berat emas dalam gram. Pelajari juga{" "}
            <Link to="/panduan-zakat" className="text-primary underline underline-offset-4">
              panduan zakat lengkap
            </Link>{" "}
            untuk syarat wajib dan 8 golongan penerima zakat.
          </p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to="/">Buka kalkulator Zakat Maal</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
