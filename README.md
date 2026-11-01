# Go-Akuntansi: Enterprise Accounting System

Sistem Akuntansi Keuangan Enterprise yang dimigrasi dari Laravel ke arsitektur decoupled modern:
* **Backend**: **Golang (Gin Framework)** + **GORM** + **PostgreSQL** (ACID & high precision `shopspring/decimal`).
* **Frontend**: **React 19 + TypeScript (Vite)** + **Tailwind CSS v4** + **shadcn/ui** (Radix UI, Lucide Icons, Sonner).

---

## 📁 Struktur Direktori

```
Go-Akuntansi/
├── backend/                  # REST API Golang (Gin Framework)
│   ├── cmd/server/main.go    # Entrypoint server & routes
│   ├── config/               # Database GORM & AutoMigrate + Seeder
│   ├── internal/
│   │   ├── model/            # Entities: COA, Jurnal, DetailJurnal, User, Kas/Bank
│   │   ├── repository/       # Data Access Layer (GORM queries)
│   │   ├── service/          # Business logic (Debit=Credit validation, Reversals)
│   │   ├── handler/          # Gin HTTP Controllers & DTOs
│   │   └── middleware/       # CORS, Auth JWT
│   └── pkg/                  # Response format & Decimal utilities
├── frontend/                 # Single Page Application React + TypeScript
│   ├── src/
│   │   ├── api/client.ts     # Axios instance & interceptors
│   │   ├── components/ui/    # 40+ shadcn/ui components (Radix + Tailwind)
│   │   ├── components/layout/# App sidebar navigation
│   │   ├── pages/            # Dashboard, Bagan Akun, Jurnal, Buku Besar, Laporan
│   │   └── types/            # TypeScript interfaces (COA, Journal, dll.)
│   └── components.json       # Shadcn UI configuration
├── akuntansi/                # Kode Laravel eksisting (sebagai referensi)
└── docker-compose.yml        # PostgreSQL 16 database container
```

---

## 🚀 Panduan Menjalankan Sistem

### 1. Jalankan Database PostgreSQL
Pastikan Docker berjalan di komputer Anda, lalu jalankan:
```bash
docker compose up -d postgres
```
Database `akuntansi_db` otomatis siap di port `5432`.

### 2. Jalankan Backend Golang (Gin)
```bash
cd backend
go run ./cmd/server
```
Server Gin akan otomatis:
* Terhubung ke PostgreSQL
* Menjalankan **AutoMigrate** tabel (`daftar_akun`, `jurnal`, `detail_jurnal`, `users`, dll.)
* Menjalankan **Seeder** awal: Bagan Akun standar Indonesia (Aset, Kewajiban, Ekuitas, Pendapatan, Beban) dan user Administrator
* Berjalan di: `http://localhost:8080`

### 3. Jalankan Frontend (React + Vite)
Buka terminal baru:
```bash
cd frontend
npm run dev
```
Buka browser di: `http://localhost:5173`

---

## ⚖️ Keunggulan Arsitektur & Integritas Akuntansi

1. **Mesin Presisi Desimal**: Semua kalkulasi saldo, debit, dan kredit menggunakan `github.com/shopspring/decimal` (bukan `float64`), menjamin tidak ada selisih sen/pembulatan floating-point.
2. **Validasi Keseimbangan Double-Entry**: Sistem secara ketat menolak penyimpanan/posting jurnal jika `Total Debit != Total Kredit`.
3. **Audit Trail & Reversal**: Jurnal yang telah diposting tidak dapat diubah/dihapus sembarangan. Sistem menyediakan fitur **Unpost** dan **Reverse Journal** (jurnal pembalik).
4. **Laporan Keuangan Real-Time**: Laporan Neraca (Aktiva vs Pasiva) dan Laporan Laba Rugi dihitung langsung secara presisi dari Buku Besar.
