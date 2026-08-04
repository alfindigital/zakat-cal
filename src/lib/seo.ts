import { useEffect } from "react";

export const SITE_URL = "https://zakat-cal.lovable.app";
export const SITE_NAME = "ZakatCal";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export interface ContentSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface ZakatPage {
  /** URL slug, e.g. "zakat-maal" (empty string = home "/"). */
  slug: string;
  /** Tab id used by the calculator. */
  tab: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: ContentSection[];
}

// Single source of truth for the zakat calculators + their SEO content.
// The home route ("/") defaults to Maal but keeps a generic title.
export const ZAKAT_PAGES: ZakatPage[] = [
  {
    slug: "zakat-maal",
    tab: "maal",
    label: "Maal",
    title: "Zakat Maal: Tabungan, Emas & Investasi | ZakatCal",
    description:
      "Hitung zakat maal dari tabungan, emas, perak, investasi/saham/kripto, dan properti dikurangi hutang. Nisab 85g emas, kadar 2,5% setelah haul.",
    h1: "Kalkulator Zakat Maal (Harta)",
    intro:
      "Zakat maal dikenakan atas total harta simpanan yang mencapai nisab dan telah dimiliki satu tahun (haul): tabungan, emas, perak, investasi, hingga properti produktif.",
    sections: [
      {
        heading: "Harta apa saja yang dihitung?",
        body: "Tabungan & deposito, emas dan perak, investasi/saham/reksadana/kripto, serta properti yang diniatkan investasi. Hutang jatuh tempo boleh dikurangkan.",
      },
      {
        heading: "Emas perhiasan yang dipakai",
        body: "Menurut sebagian ulama, emas perhiasan yang wajar dipakai sehari-hari tidak dikenai zakat. Masukkan hanya emas simpanan/investasi bila Anda mengikuti pendapat tersebut.",
      },
    ],
  },
  {
    slug: "zakat-perniagaan",
    tab: "perniagaan",
    label: "Perniagaan",
    title: "Kalkulator Zakat Perniagaan / Perdagangan (Tijarah) — ZakatCal",
    description:
      "Hitung zakat perdagangan: modal kerja + piutang lancar + stok dagang − hutang dagang. Nisab 85g emas, kadar 2,5% setelah haul.",
    h1: "Kalkulator Zakat Perniagaan",
    intro:
      "Zakat perniagaan (tijarah) dihitung dari aset usaha: modal kerja, piutang lancar, dan stok dagang, dikurangi hutang dagang jangka pendek.",
    sections: [
      {
        heading: "Rumus zakat dagang",
        body: "(Modal kerja + piutang lancar + nilai stok) − hutang dagang. Jika hasilnya mencapai nisab 85g emas dan telah berlalu satu haul, keluarkan 2,5%.",
      },
    ],
  },
  {
    slug: "zakat-pertanian",
    tab: "pertanian",
    label: "Pertanian",
    title: "Kalkulator Zakat Pertanian (Hasil Panen) 5%/10% — ZakatCal",
    description:
      "Hitung zakat pertanian dari hasil panen. Nisab 653 kg, kadar 10% (tadah hujan) atau 5% (irigasi/berbiaya), dibayar saat panen tanpa haul.",
    h1: "Kalkulator Zakat Pertanian",
    intro:
      "Zakat pertanian wajib saat panen bila hasil mencapai nisab 653 kg (5 wasaq). Kadarnya 10% untuk lahan tadah hujan dan 5% bila pengairan berbiaya.",
    sections: [
      {
        heading: "5% atau 10%?",
        body: "Lahan yang diairi hujan/sungai tanpa biaya: 10%. Lahan yang diairi dengan biaya (pompa, irigasi berbayar): 5%, karena ada beban biaya produksi.",
      },
    ],
  },
  {
    slug: "zakat-peternakan",
    tab: "peternakan",
    label: "Peternakan",
    title: "Zakat Peternakan: Unta, Sapi, Kambing | ZakatCal",
    description:
      "Hitung zakat hewan ternak unta, sapi/kerbau, dan kambing/domba sesuai tabel nisab klasik. Estimasi nilai zakat dalam rupiah.",
    h1: "Kalkulator Zakat Peternakan",
    intro:
      "Zakat ternak mengikuti tabel nisab: kambing/domba mulai 40 ekor, sapi/kerbau 30 ekor, dan unta 5 ekor, dengan haul satu tahun.",
    sections: [
      {
        heading: "Syarat hewan ternak",
        body: "Hewan digembalakan (saimah), mencapai jumlah nisab, dan telah dimiliki satu haul. Kalkulator menampilkan jenis hewan zakat yang wajib dikeluarkan beserta estimasi nilainya.",
      },
    ],
  },
  {
    slug: "zakat-rikaz",
    tab: "rikaz",
    label: "Rikaz",
    title: "Kalkulator Zakat Rikaz (Harta Temuan/Karun) 20% — ZakatCal",
    description:
      "Hitung zakat rikaz (harta terpendam/temuan) sebesar 20% (seperlima). Tanpa nisab dan tanpa haul, wajib langsung saat ditemukan.",
    h1: "Kalkulator Zakat Rikaz",
    intro:
      "Rikaz adalah harta terpendam peninggalan masa lampau yang ditemukan. Kadar zakatnya 20% (1/5), tanpa syarat nisab maupun haul.",
    sections: [
      {
        heading: "Kapan dibayar?",
        body: "Langsung saat harta ditemukan, tanpa menunggu satu tahun. Cukup masukkan nilai temuan untuk mengetahui 20% yang wajib dikeluarkan.",
      },
    ],
  },
  {
    slug: "zakat-madin",
    tab: "madin",
    label: "Ma'din",
    title: "Kalkulator Zakat Ma'din (Hasil Tambang) 2,5% — ZakatCal",
    description:
      "Hitung zakat ma'din (hasil tambang: emas, perak, mineral). Menurut jumhur ulama nisab setara 85g emas dan kadar 2,5%.",
    h1: "Kalkulator Zakat Ma'din",
    intro:
      "Ma'din adalah hasil tambang seperti emas, perak, dan mineral. Menurut pendapat jumhur, nisabnya setara 85 gram emas dengan kadar 2,5%.",
    sections: [
      {
        heading: "Dibayar saat diperoleh",
        body: "Zakat ma'din ditunaikan ketika hasil tambang diperoleh, tanpa menunggu haul. Masukkan nilai hasil tambang untuk menghitung kewajibannya.",
      },
    ],
  },
  {
    slug: "zakat-fitrah",
    tab: "fitrah",
    label: "Fitrah",
    title: "Kalkulator Zakat Fitrah 2,5 kg per Jiwa — ZakatCal",
    description:
      "Hitung zakat fitrah 2,5 kg makanan pokok per jiwa, atau bayar dengan uang sesuai tarif daerah. Wajib sebelum shalat Idul Fitri.",
    h1: "Kalkulator Zakat Fitrah",
    intro:
      "Zakat fitrah wajib bagi setiap jiwa Muslim sebelum shalat Idul Fitri, sebesar 2,5 kg (3,5 liter) makanan pokok, atau senilai uang menurut tarif daerah.",
    sections: [
      {
        heading: "Beras atau uang?",
        body: "Anda bisa menghitung berdasarkan harga beras yang dikonsumsi, atau membayar dengan uang sesuai tarif yang ditetapkan BAZNAS/LAZ di daerah Anda.",
      },
    ],
  },
];

// Fidyah is not a zakat but lives in the same calculator. Kept separate from
// ZAKAT_PAGES so it gets its own slug ("/fidyah") and SEO content.
export const FIDYAH_PAGE: ZakatPage = {
  slug: "fidyah",
  tab: "fidyah",
  label: "Fidyah",
  title: "Kalkulator Fidyah Puasa Ramadhan | ZakatCal",
  description:
    "Hitung fidyah puasa Ramadhan yang ditinggalkan: ±0,75 kg makanan pokok per hari atau senilai uang. Untuk lansia, sakit menahun, ibu hamil/menyusui.",
  h1: "Kalkulator Fidyah Puasa",
  intro:
    "Fidyah adalah denda bagi yang meninggalkan puasa Ramadhan dan tidak mampu menggantinya. Besarnya ±0,75 kg makanan pokok per hari yang ditinggalkan, atau senilai uang.",
  sections: [
    {
      heading: "Siapa yang membayar fidyah?",
      body: "Orang tua renta, penderita sakit menahun yang sulit sembuh, serta — menurut sebagian pendapat — ibu hamil/menyusui yang mengkhawatirkan anaknya. Hitung jumlah hari × nilai makanan pokok per hari.",
    },
  ],
};

export const ALL_PAGES: ZakatPage[] = [...ZAKAT_PAGES, FIDYAH_PAGE];

export const HOME_SEO = {
  title: "ZakatCal - Kalkulator Zakat Online Gratis",
  description:
    "ZakatCal — kalkulator zakat online gratis untuk menghitung zakat maal, fitrah, perniagaan, pertanian, peternakan, rikaz & ma'din sesuai syariat Islam.",
};

/**
 * Display label for a stored history ZakatType. Keeps history badges, PDF
 * titles and filters using the SAME wording as the nav/drawer labels.
 */
export const ZAKAT_TYPE_LABELS: Record<string, string> = {
  Penghasilan: "Maal",
  Maal: "Maal",
  Fitrah: "Fitrah",
  Perniagaan: "Perniagaan",
  Pertanian: "Pertanian",
  Peternakan: "Peternakan",
  Rikaz: "Rikaz",
  Madin: "Ma'din",
  Fidyah: "Fidyah",
};

export const labelForZakatType = (type: string): string =>
  ZAKAT_TYPE_LABELS[type] ?? type;

export function getPageBySlug(slug: string): ZakatPage | undefined {
  return ALL_PAGES.find((p) => p.slug === slug);
}
export function getPageByTab(tab: string): ZakatPage | undefined {
  return ALL_PAGES.find((p) => p.tab === tab);
}

// ---- Imperative <head> management (dependency-free, client-side) ----

function setMeta(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export interface SeoOptions {
  title: string;
  description: string;
  path?: string; // leading slash path, e.g. "/zakat-maal"
  jsonLd?: object | null;
}

// Reactively sync document head with the current route's metadata.
export function useSeo({ title, description, path = "/", jsonLd = null }: SeoOptions) {
  useEffect(() => {
    const url = `${SITE_URL}${path === "/" ? "" : path}`;
    document.title = title;
    setMeta("name", "description", description);
    setCanonical(url || `${SITE_URL}`);

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url || SITE_URL);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:image", OG_IMAGE);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", OG_IMAGE);

    // Managed JSON-LD (replaced on each route change to avoid duplicates).
    const existing = document.head.querySelector('script[data-seo="route"]');
    if (existing) existing.remove();
    if (jsonLd) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-seo", "route");
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
  }, [title, description, path, jsonLd]);
}
