# ZakatCal — Kalkulator Zakat Online Gratis

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)](https://ui.shadcn.com)
[![CI](https://github.com/alfindigital/zakat-cal/actions/workflows/ci.yml/badge.svg)](https://github.com/alfindigital/zakat-cal/actions/workflows/ci.yml)

> **ZakatCal** adalah aplikasi web kalkulator zakat lengkap yang membantu umat Muslim menghitung kewajiban zakat sesuai syariat Islam — gratis, tanpa iklan, dan dapat dijalankan secara mandiri (_self-hosted_).

---

## ✨ Fitur

| Jenis Zakat | Keterangan |
|---|---|
| 💰 **Zakat Maal** | Harta, tabungan, investasi — nisab emas/perak, haul 1 tahun |
| 🌙 **Zakat Fitrah** | Per jiwa, mode beras (kg) atau uang (Rp) |
| 🏪 **Zakat Perniagaan** | Modal + piutang + stok − hutang dagang, 2,5% |
| 🌾 **Zakat Pertanian** | 5% (berpengairan) / 10% (tadah hujan), nisab 653 kg |
| 🐄 **Zakat Peternakan** | Sapi, kambing, unta — nisab & kadar per hewan |
| ⛏️ **Zakat Rikaz & Ma'din** | Harta temuan & hasil tambang |
| 💼 **Zakat Penghasilan** | Profesi / gaji bulanan |
| 🍽️ **Fidyah** | Pengganti puasa bagi yang tidak mampu berpuasa |

**Fitur tambahan:**
- 📊 Riwayat perhitungan (disimpan di browser)
- 📄 Ekspor hasil ke PDF
- 🌙 Mode gelap / terang / sistem
- ♿ Aksesibel — ARIA live region, keyboard navigation lengkap
- 📱 Responsif — PWA-ready dengan manifest & service worker
- 🔒 Privasi penuh — tidak ada data yang dikirim ke server

---

## 🚀 Quick Start

### Prasyarat

- [Node.js](https://nodejs.org) v18+ (atau [Bun](https://bun.sh) v1+)
- npm / bun

### Instalasi

```bash
# 1. Clone repo
git clone https://github.com/alfindigital/zakat-cal.git
cd zakat-cal

# 2. Install dependencies
npm install

# 3. Salin file env contoh
cp .env.example .env
# Edit .env jika ingin mengaktifkan fitur kontak Telegram

# 4. Jalankan development server
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

### Build untuk Produksi

```bash
npm run build      # output ke folder dist/
npm run preview    # pratinjau hasil build
```

---

## ⚙️ Konfigurasi

Salin `.env.example` ke `.env` lalu isi nilainya:

| Variabel | Deskripsi | Wajib |
|---|---|---|
| `VITE_TELEGRAM_HANDLE` | Handle Telegram untuk tombol "Hubungi Amil" | Tidak |

Jika `VITE_TELEGRAM_HANDLE` dikosongkan, fitur kontak akan disembunyikan.

---

## 📁 Struktur Proyek

```
zakat-cal/
├── src/
│   ├── components/        # Komponen UI yang dapat digunakan ulang
│   │   ├── ui/            # shadcn/ui primitives
│   │   └── zakat/         # Komponen khusus kalkulator zakat
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilitas (logika hitung zakat, format, kontak)
│   ├── pages/             # Halaman aplikasi (React Router)
│   │   ├── Index.tsx      # Halaman utama — semua kalkulator
│   │   ├── Riwayat.tsx    # Riwayat perhitungan
│   │   ├── Pengaturan.tsx # Pengaturan nisab & preferensi
│   │   ├── ZakatEmas.tsx  # Info harga emas & nisab
│   │   ├── PanduanZakat.tsx # Panduan & FAQ zakat
│   │   └── Tentang.tsx    # Tentang aplikasi
│   └── main.tsx           # Entry point
├── public/                # Aset statis (ikon, manifest, OG image)
├── e2e/                   # E2E tests (Playwright) — a11y & visual regression
├── .env.example           # Template variabel lingkungan
├── index.html             # HTML entry point
└── package.json
```

---

## 🛠️ Tech Stack

| Teknologi | Versi | Peran |
|---|---|---|
| [React](https://react.dev) | 18 | UI framework |
| [Vite](https://vitejs.dev) | 5 | Build tool & dev server |
| [TypeScript](https://www.typescriptlang.org) | 5 | Type safety |
| [React Router](https://reactrouter.com) | 6 | Client-side routing |
| [shadcn/ui](https://ui.shadcn.com) | latest | UI components (Radix UI + Tailwind) |
| [Tailwind CSS](https://tailwindcss.com) | 3 | Styling |
| [TanStack Query](https://tanstack.com/query) | 5 | Server state management |
| [React Hook Form](https://react-hook-form.com) | 7 | Form handling |
| [Zod](https://zod.dev) | 3 | Schema validation |
| [jsPDF](https://github.com/parallax/jsPDF) | 4 | PDF export |
| [Framer Motion](https://www.framer.com/motion) | 12 | Animasi |
| [Vitest](https://vitest.dev) | 3 | Unit testing |
| [Playwright](https://playwright.dev) | 1 | E2E & accessibility testing |

---

## 🧪 Testing

```bash
npm test                   # Unit tests (Vitest)
npm run test:e2e           # E2E tests (Playwright CI config)
npm run test:e2e:a11y      # Aksesibilitas — ARIA, keyboard nav
npm run test:e2e:visual    # Visual regression
```

---

## 🤝 Contributing

Kontribusi sangat diterima! Baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap.

---

## 🔒 Security

Untuk melaporkan kerentanan keamanan, baca [SECURITY.md](SECURITY.md).

---

## 📜 License

[MIT](LICENSE) © 2026 contributors
