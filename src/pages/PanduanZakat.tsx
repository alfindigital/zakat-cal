import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSeo } from "@/lib/seo";


const sections = [
  {
    title: "Apa Itu Zakat?",
    content:
      "Zakat adalah rukun Islam ke-4, yaitu kewajiban mengeluarkan sebagian harta bagi setiap Muslim yang telah memenuhi syarat tertentu. Zakat berfungsi untuk membersihkan harta dan membantu mereka yang membutuhkan.",
  },
  {
    title: "Syarat Wajib Zakat",
    content: null,
    list: [
      "Muslim — Zakat hanya diwajibkan bagi umat Islam.",
      "Merdeka — Bukan hamba sahaya (konteks historis).",
      "Baligh & Berakal — Sudah dewasa dan berakal sehat.",
      "Mencapai Nisab — Harta mencapai batas minimum yang ditetapkan syariat (setara 85 gram emas untuk zakat maal).",
      "Haul — Harta telah dimiliki selama satu tahun hijriyah penuh (kecuali zakat pertanian dan rikaz).",
      "Milik Penuh — Harta dimiliki secara penuh dan tidak terikat utang pokok.",
    ],
  },
  {
    title: "Jenis-Jenis Zakat",
    content: null,
    list: [
      "Zakat Fitrah — Wajib dikeluarkan sebelum shalat Idul Fitri, sebesar 2,5 kg makanan pokok per jiwa.",
      "Zakat Maal (Harta) — Dikeluarkan atas harta yang mencapai nisab dan haul, meliputi tabungan, emas, perak, investasi, dan aset produktif.",
      "Zakat penghasilan/profesi termasuk bagian dari zakat maal — gaji dan pendapatan rutin dihitung bersama harta simpanan pada kalkulator Zakat Maal.",
    ],
  },
  {
    title: "Nisab & Kadar Zakat",
    content:
      "Nisab zakat maal dan penghasilan setara dengan 85 gram emas murni. Kadar zakatnya adalah 2,5% dari total harta/penghasilan yang memenuhi syarat. Untuk zakat fitrah, besarannya 2,5 kg (atau 3,5 liter) makanan pokok daerah setempat.",
  },
  {
    title: "8 Golongan Penerima Zakat (Asnaf)",
    content: "Berdasarkan QS. At-Taubah ayat 60:",
    list: [
      "Fakir — Orang yang hampir tidak memiliki apa-apa.",
      "Miskin — Orang yang penghasilannya tidak mencukupi kebutuhan dasar.",
      "Amil — Pengelola/pengumpul zakat.",
      "Muallaf — Orang yang baru masuk Islam atau yang hatinya perlu dilunakkan.",
      "Riqab — Memerdekakan budak (konteks historis).",
      "Gharimin — Orang yang terlilit hutang untuk kebutuhan halal.",
      "Fi Sabilillah — Pejuang di jalan Allah.",
      "Ibnu Sabil — Musafir yang kehabisan bekal dalam perjalanan.",
    ],
  },
  {
    title: "Waktu Pembayaran",
    content:
      "Zakat maal dan penghasilan dapat dibayarkan kapan saja setelah memenuhi syarat nisab dan haul. Zakat fitrah wajib dibayarkan sebelum shalat Idul Fitri, dan paling utama di akhir bulan Ramadhan.",
  },
];

export default function PanduanZakat() {
  useSeo({
    title: "Panduan Zakat: Syarat, Nisab & 8 Asnaf | ZakatCal",
    description:
      "Panduan zakat lengkap: pengertian, syarat wajib, jenis-jenis zakat, nisab & kadar, 8 golongan penerima zakat (asnaf), dan waktu pembayaran.",
    path: "/panduan-zakat",
  });
  return (
    <main
      className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-12 md:py-8 flex-1 space-y-4 sm:space-y-5 md:space-y-6"
      style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Panduan Zakat Lengkap</h1>

      <div className="space-y-3 sm:space-y-4">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
              <h2 className="text-base font-semibold leading-none tracking-tight sm:text-lg">{s.title}</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed px-4 pb-4 sm:px-6 sm:pb-5 sm:text-sm">
              {s.content && <p>{s.content}</p>}
              {s.list && (
                <ol className="list-decimal list-inside space-y-2">
                  {s.list.map((item, i) => {
                    const [term, ...rest] = item.split(" — ");
                    return (
                      <li key={i}>
                        <span className="text-foreground font-medium">{term}</span>
                        {rest.length > 0 && <> — {rest.join(" — ")}</>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs sm:text-sm">
        <Link to="/" className="font-semibold text-primary hover:underline">← Kembali ke kalkulator</Link>
      </div>
    </main>
  );
}

