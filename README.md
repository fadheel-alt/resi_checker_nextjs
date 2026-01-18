# Resi Checker - Next.js App Router

Web aplikasi internal (mobile-first) untuk scan dan cocokkan barcode/QR code resi pesanan dengan database Supabase.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **React:** 18.2
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 3.4
- **Database:** Supabase
- **Barcode Scanner:** html5-qrcode 2.3.8
- **CSV/Excel Parser:** papaparse + xlsx

## Fitur

- ✅ Import data pesanan dari CSV/XLSX
- ✅ Auto-detect kolom tracking number dan order ID
- ✅ Scan barcode manual (keyboard input)
- ✅ Scan barcode dengan kamera (mobile)
- ✅ Dashboard statistik real-time
- ✅ Daftar pending orders
- ✅ Reset database

## Prerequisites

- Node.js 20.x atau lebih tinggi (untuk development lokal)
- npm atau yarn
- Akun Supabase dengan database sudah setup

## Setup Lokal

### 1. Install Dependencies

```bash
npm install
# atau
yarn install
```

### 2. Konfigurasi Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 4. Build Production

```bash
npm run build
npm run start
```

## Deploy ke Vercel

### Cara 1: Via Vercel Dashboard

1. Push code ke GitHub repository
2. Buka [Vercel Dashboard](https://vercel.com/new)
3. Import repository
4. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

### Cara 2: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

## Struktur Database (Supabase)

Buat tabel `orders` dengan struktur berikut:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT,
  tracking_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  scanned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_tracking_number ON orders(tracking_number);
CREATE INDEX idx_status ON orders(status);
```

## Cara Penggunaan

### 1. Import Data Pesanan

- Click tombol file input
- Pilih file CSV atau XLSX
- Pastikan file memiliki kolom tracking number
- Review mapping kolom yang terdeteksi otomatis
- Click "Import Data"

### 2. Scan Barcode

**Mode Manual (Desktop):**
- Arahkan kursor ke input field
- Scan barcode dengan barcode scanner
- Tekan Enter

**Mode Camera (Mobile):**
- Toggle ke mode Camera
- Izinkan akses kamera
- Arahkan kamera ke barcode
- Scan otomatis terdeteksi

### 3. Monitor Progress

- Lihat dashboard untuk statistik real-time
- Progress bar menunjukkan % scanned
- Pending list menampilkan order yang belum di-scan

## Catatan Penting

### Camera Scanner

- Camera mode membutuhkan HTTPS atau localhost
- Di production (Vercel), HTTPS sudah otomatis
- Tested di Chrome, Safari, Firefox (mobile & desktop)

### Performance

- Aplikasi dioptimasi untuk mobile-first
- SPA-style (Single Page App) dalam Next.js
- Semua komponen menggunakan Client Components kecuali Header/Footer
- Dynamic import untuk html5-qrcode menghindari SSR issues

### Browser Support

- Chrome/Edge (recommended)
- Safari (iOS/macOS)
- Firefox
- Camera scanner mungkin tidak bekerja di browser lama

## Troubleshooting

### Camera tidak bekerja
- Pastikan aplikasi diakses via HTTPS
- Check browser permissions untuk kamera
- Coba browser lain

### Build error di Vercel
- Pastikan Node.js version ≥ 20.x
- Check environment variables sudah di-set
- Review build logs untuk error spesifik

### Supabase connection error
- Verify URL dan API key di `.env.local`
- Check Supabase dashboard untuk database status
- Pastikan tabel `orders` sudah dibuat

## Development Notes

### Migrasi dari Vite

Aplikasi ini dimigrasikan dari Vite + React ke Next.js App Router dengan perubahan minimal:

- Environment variables: `VITE_*` → `NEXT_PUBLIC_*`
- Import paths: relative → `@/*` alias
- CameraScanner: Dynamic import untuk SSR compatibility
- TypeScript: Gradual adoption dengan minimal type annotations

### Project Structure

```
resi_checker_nextjs/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── CsvUploader.tsx
│   ├── ScanInput.tsx
│   ├── CameraScanner.tsx  # SSR-safe scanner
│   ├── Dashboard.tsx
│   └── PendingList.tsx
├── lib/
│   └── supabase.ts        # Supabase client
├── db/
│   └── database.ts        # Database operations
├── utils/
│   └── csvParser.ts       # CSV/XLSX parser
└── public/                # Static assets
```

## License

Internal use only.

## Support

Untuk bantuan atau pertanyaan, hubungi tim development.
