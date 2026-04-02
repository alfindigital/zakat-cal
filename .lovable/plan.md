
# Kalkulator Zakat — All-in-One

## Overview
Kalkulator zakat lengkap dengan tampilan modern & minimalis, mencakup semua jenis zakat dengan navigasi tab.

## Halaman & Layout
- **Single page** dengan header "Kalkulator Zakat" dan 3 tab: **Penghasilan**, **Maal (Harta)**, **Fitrah**
- Clean white card di tengah halaman, rounded corners, subtle shadow

## Tab 1: Zakat Penghasilan
- Input: Penghasilan bulanan (Rp), bonus/THR tahunan (opsional)
- Otomatis hitung penghasilan tahunan
- Tampilkan nisab (setara 85g emas × harga emas terkini dari API)
- Hasil: 2.5% dari penghasilan jika melebihi nisab
- Tampilkan breakdown: penghasilan tahunan, nisab, status wajib/tidak, jumlah zakat

## Tab 2: Zakat Maal (Harta)
- Input fields: Tabungan (Rp), Emas (gram), Perak (gram), Investasi/Saham (Rp), Properti investasi (Rp), Hutang (Rp)
- Hitung total harta bersih (total - hutang)
- Nisab otomatis dari harga emas 85g
- Hasil: 2.5% jika melebihi nisab

## Tab 3: Zakat Fitrah
- Input: Jumlah jiwa/anggota keluarga
- Pilih jenis beras (standar / premium) dengan harga per kg
- Hasil: 2.5kg × harga beras × jumlah jiwa

## Nisab Otomatis
- Fetch harga emas dari public API (fallback ke harga default jika API gagal)
- Tampilkan harga emas yang digunakan & tanggal update

## Riwayat Perhitungan
- Simpan setiap hasil kalkulasi ke localStorage
- Section "Riwayat" di bawah kalkulator, tampilkan tanggal, jenis zakat, jumlah
- Tombol hapus per-item dan hapus semua

## Design
- Background putih/abu sangat terang, card putih dengan shadow
- Accent color hijau subtle (emerald-600) untuk tombol & highlight
- Typography clean, angka besar untuk hasil zakat
- Responsive: full-width card di mobile, max-w-2xl di desktop
- Gunakan Tabs dari shadcn/ui, input fields, dan badge untuk status
