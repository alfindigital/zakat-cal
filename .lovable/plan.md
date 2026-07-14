## Halaman Riwayat + Detail + Edit Ulang

Bangun halaman `/riwayat` yang menampilkan daftar semua perhitungan zakat, membuka detail lengkap per item, dan mengarahkan kembali ke kalkulator dengan field yang sudah terisi ulang siap diedit.

### Yang akan dibangun

1. **Route baru `/riwayat`** — halaman penuh terpisah dari beranda, dengan header + tautan balik. Riwayat kompak yang sudah ada di beranda tetap dipertahankan (untuk chart & undo cepat) tapi diberi link "Lihat semua riwayat".

2. **Daftar item riwayat** — pakai komponen list yang sudah ada (badge tipe, tanggal, jumlah, swipe-to-delete di mobile), plus dua aksi baru pada tiap item:
   - **Detail** — buka dialog berisi seluruh baris breakdown (`detail[]`) + tombol Unduh PDF & Bagikan.
   - **Edit ulang** — navigasi ke route kalkulator terkait (`/`, `/zakat-maal`, dll.) dengan `location.state.prefill` sehingga input terisi otomatis. Item lama tanpa snapshot input akan menampilkan tombol "Buka Kalkulator" saja (tanpa prefill).

3. **Snapshot input pada `addHistory`** — perluas `ZakatHistory` dengan `inputs?: Record<string, unknown>` opsional. Setiap kalkulator (9 buah) menyimpan raw form state saat "Simpan ke Riwayat" ditekan, dan mem-baca `useLocation().state?.prefill` saat mount untuk menyeed state-nya. Skema `inputs` per kalkulator sederhana — cukup nilai string dari tiap `useState` input.

4. **Navigasi** — tambahkan ikon History di header (samping Settings/Info) yang mengarah ke `/riwayat`. Item bottom-nav mobile tidak diubah agar tab kalkulator tetap dominan.

### Detail teknis

- **File baru**: `src/pages/Riwayat.tsx`, `src/components/HistoryDetailDialog.tsx`.
- **File diubah**:
  - `src/lib/zakat.ts` — tambah field `inputs` di `ZakatHistory` + `addHistory` signature; migrasi backward-compatible (opsional, default undefined).
  - `src/App.tsx` — daftarkan route `/riwayat`.
  - `src/lib/seo.ts` (kalau perlu meta) atau langsung `useSeo` di halaman.
  - `src/components/ZakatRiwayat.tsx` — tambah tombol/ikon "Detail" & "Edit ulang" per item, plus link "Lihat semua" ke `/riwayat`.
  - `src/pages/Index.tsx` — header: tombol History; teruskan `location.state?.prefill` ke `<ZakatXxx>` sebagai prop opsional `prefill`.
  - 9 kalkulator (`ZakatPenghasilan`, `Maal`, `Fitrah`, `Perniagaan`, `Pertanian`, `Peternakan`, `Rikaz`, `Madin`, `Fidyah`) — terima `prefill?: Record<string, unknown>`, gunakan sebagai initial state via lazy `useState(() => prefill?.x ?? "")`, dan sertakan snapshot `inputs` saat `addHistory`.

- **Peta prefill (contoh)**:
  - Penghasilan → `{ monthly, bonus, method, deduction }`
  - Maal → `{ tabungan, emas, perak, investasi, properti, hutang }`
  - Fitrah → `{ mode, jiwa, riceIdx, customPrice, perJiwaUang }`
  - Rikaz → `{ nilai }`
  - dll.

- **Toast konfirmasi** — saat prefill dari edit ulang tersedia, tampilkan `toast.info("Data riwayat dimuat — silakan sesuaikan lalu simpan.")` sekali.

- **Test**: build + `bunx vitest run` (157 test yang ada tidak menyentuh signature `addHistory` selain field wajib, jadi backward-compatible).

### Yang tidak dilakukan

- Tidak menyentuh logika perhitungan/kadar zakat.
- Tidak menyentuh Cloud/backend — riwayat tetap di `localStorage` seperti sekarang.
- Tidak mengubah desain bottom-nav mobile (tetap 3 tab kalkulator utama).