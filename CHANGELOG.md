# Changelog

## 2026-01-19 - Feature Updates

### New Features

#### 1. Ekstraksi Data "Jumlah" dari Product Info
- **File diubah**: `utils/csvParser.ts`
- **Fungsi baru**: `extractJumlahFromProductInfo()`
- **Deskripsi**: Sekarang aplikasi dapat mengekstrak data "Jumlah" dari kolom `product_info` menggunakan regex pattern `/Jumlah:\s*(\d+)/i`
- **Format**: Mengambil angka dari text seperti "Jumlah: 1; Nomor Referensi SKU: A;"

#### 2. Fitur Reset Scan
- **File diubah**:
  - `db/database.ts` - Menambahkan fungsi `resetScan()`
  - `components/Dashboard.tsx` - Menambahkan UI dan logika untuk reset scan
  - `app/page.tsx` - Menambahkan prop `onDataChange` ke Dashboard
- **Deskripsi**: Fitur baru untuk mengulang proses scanning tanpa menghapus data Excel
- **Fungsi**:
  - Mengubah semua order dengan status "scanned" kembali ke "pending"
  - Reset field `scanned_at` menjadi null
  - Data pesanan tetap tersimpan di database
  - Progress bar kembali ke 0%
- **UI Changes**:
  - Tombol "Reset Data" (merah) - menghapus semua data
  - Tombol "Reset Scan" (biru) - hanya reset status scan, data tetap ada
  - Tombol "Reset Scan" hanya muncul jika ada order yang sudah di-scan

### Improvements

#### Auto-Detection Kolom Excel yang Diperbaiki
- **Buyer User Name**: Otomatis mendeteksi kolom dengan nama:
  - `buyer_user_name`, `buyer_username`, `nama_pembeli`, `pembeli`
- **Jumlah**: Otomatis mendeteksi atau ekstrak dari `product_info`
  - Kolom detection: `jumlah`, `quantity`, `qty`, `amount`
  - Auto-extract dari product_info jika kolom `product_info` dipilih untuk variasi
- **Shipping Method**: Otomatis mendeteksi kolom dengan nama:
  - `shipping_method`, `metode_pengiriman`, `pengiriman`, `kurir`

### Database Schema Changes

SQL Migration tersedia di: `migrations/add_new_columns.sql`

Kolom baru yang ditambahkan ke tabel `orders`:
- `buyer_user_name` (TEXT) - Username pembeli
- `jumlah` (TEXT) - Jumlah/quantity produk
- `shipping_method` (TEXT) - Metode pengiriman (J&T Cargo, dll)

### UI Changes

#### Pending List Display
Sekarang menampilkan informasi tambahan di setiap card pesanan:
1. Order ID
2. **Pembeli** (baru)
3. Variasi
4. Penerima
5. **Jumlah** (baru)
6. **Pengiriman** (baru)

#### CSV Uploader
Menambahkan 3 dropdown baru untuk column mapping:
1. Kolom Nama Pembeli (opsional)
2. Kolom Jumlah (opsional)
3. Kolom Metode Pengiriman (opsional)

Tabel preview juga diupdate untuk menampilkan semua kolom baru.

#### Dashboard
- Tombol "Reset" diubah menjadi "Reset Data"
- Menambahkan tombol "Reset Scan" (hanya muncul jika ada data yang sudah di-scan)
- Dua dialog konfirmasi berbeda untuk Reset Data vs Reset Scan

### Technical Details

#### CSV Parser Logic Update
```typescript
// Ekstraksi Jumlah dengan prioritas:
1. Jika ada kolom "jumlah" yang dipilih → gunakan nilai dari kolom tersebut
2. Jika tidak ada, dan kolom "product_info" dipilih untuk variasi
   → ekstrak menggunakan regex dari product_info
3. Jika tidak ada → kosong
```

#### Reset Scan Query
```sql
UPDATE orders
SET status = 'pending', scanned_at = null
WHERE status = 'scanned'
```

### Breaking Changes
Tidak ada breaking changes. Semua fitur backward compatible.

### Migration Required
Jalankan SQL migration file untuk menambahkan kolom baru:
```bash
# Buka Supabase Dashboard → SQL Editor
# Copy-paste isi file: migrations/add_new_columns.sql
# Execute query
```
