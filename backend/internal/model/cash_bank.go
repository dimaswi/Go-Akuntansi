package model

import (
	"time"

	"github.com/shopspring/decimal"
)

type JenisRekening string

const (
	JenisRekeningGiro     JenisRekening = "giro"
	JenisRekeningTabungan JenisRekening = "tabungan"
	JenisRekeningDeposito JenisRekening = "deposito"
	JenisRekeningKredit   JenisRekening = "kredit"
)

type BankAccount struct {
	ID            uint            `gorm:"primaryKey" json:"id"`
	KodeRekening  string          `gorm:"column:kode_rekening;size:20;uniqueIndex;not null" json:"kode_rekening"`
	NamaBank      string          `gorm:"column:nama_bank;size:100;not null" json:"nama_bank"`
	NamaRekening  string          `gorm:"column:nama_rekening;size:150;not null" json:"nama_rekening"`
	NomorRekening string          `gorm:"column:nomor_rekening;size:50;not null" json:"nomor_rekening"`
	Cabang        string          `gorm:"column:cabang;size:100" json:"cabang"`
	SaldoAwal     decimal.Decimal `gorm:"column:saldo_awal;type:numeric(15,2);default:0" json:"saldo_awal"`
	SaldoBerjalan decimal.Decimal `gorm:"column:saldo_berjalan;type:numeric(15,2);default:0" json:"saldo_berjalan"`
	DaftarAkunID  uint            `gorm:"column:daftar_akun_id;not null;index" json:"daftar_akun_id"`
	DaftarAkun    *ChartOfAccount `gorm:"foreignKey:DaftarAkunID" json:"daftar_akun,omitempty"`
	JenisRekening JenisRekening   `gorm:"column:jenis_rekening;size:20;default:'giro'" json:"jenis_rekening"`
	Keterangan    string          `gorm:"column:keterangan;type:text" json:"keterangan"`
	IsAktif       bool            `gorm:"column:is_aktif;default:true;index" json:"is_aktif"`
	CreatedAt     time.Time       `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     time.Time       `gorm:"column:updated_at" json:"updated_at"`
}

func (BankAccount) TableName() string {
	return "bank_accounts"
}

type CashTransaction struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	NomorTransaksi    string          `gorm:"column:nomor_transaksi;size:30;uniqueIndex;not null" json:"nomor_transaksi"`
	TanggalTransaksi  time.Time       `gorm:"column:tanggal_transaksi;type:date;not null;index" json:"tanggal_transaksi"`
	JenisTransaksi    string          `gorm:"column:jenis_transaksi;size:50;not null;index" json:"jenis_transaksi"` // "penerimaan", "pengeluaran"
	KategoriTransaksi string          `gorm:"column:kategori_transaksi;size:100" json:"kategori_transaksi"`
	Jumlah            decimal.Decimal `gorm:"column:jumlah;type:numeric(15,2);not null" json:"jumlah"`
	Keterangan        string          `gorm:"column:keterangan;type:text" json:"keterangan"`
	PihakTerkait      string          `gorm:"column:pihak_terkait;size:200" json:"pihak_terkait"`
	Referensi         string          `gorm:"column:referensi;size:100" json:"referensi"`
	DaftarAkunKasID   uint            `gorm:"column:daftar_akun_kas_id;not null;index" json:"daftar_akun_kas_id"`
	DaftarAkunKas     *ChartOfAccount `gorm:"foreignKey:DaftarAkunKasID" json:"daftar_akun_kas,omitempty"`
	DaftarAkunLawanID *uint           `gorm:"column:daftar_akun_lawan_id;index" json:"daftar_akun_lawan_id"`
	DaftarAkunLawan   *ChartOfAccount `gorm:"foreignKey:DaftarAkunLawanID" json:"daftar_akun_lawan,omitempty"`
	JurnalID          *uint           `gorm:"column:jurnal_id;index" json:"jurnal_id"`
	Jurnal            *Journal        `gorm:"foreignKey:JurnalID" json:"jurnal,omitempty"`
	Status            string          `gorm:"column:status;size:20;default:'draft';index" json:"status"` // "draft", "posted", "cancelled"
	UserID            uint            `gorm:"column:user_id;not null" json:"user_id"`
	User              *User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PostedAt          *time.Time      `gorm:"column:posted_at" json:"posted_at"`
	PostedBy          *uint           `gorm:"column:posted_by" json:"posted_by"`
	Poster            *User           `gorm:"foreignKey:PostedBy" json:"poster,omitempty"`
	CreatedAt         time.Time       `gorm:"column:created_at" json:"created_at"`
	UpdatedAt         time.Time       `gorm:"column:updated_at" json:"updated_at"`
}

func (CashTransaction) TableName() string {
	return "cash_transactions"
}

type BankTransaction struct {
	ID                  uint            `gorm:"primaryKey" json:"id"`
	NomorTransaksi      string          `gorm:"column:nomor_transaksi;size:30;uniqueIndex;not null" json:"nomor_transaksi"`
	TanggalTransaksi    time.Time       `gorm:"column:tanggal_transaksi;type:date;not null;index" json:"tanggal_transaksi"`
	TanggalEfektif      *time.Time      `gorm:"column:tanggal_efektif;type:date" json:"tanggal_efektif"`
	JenisTransaksi      string          `gorm:"column:jenis_transaksi;size:50;not null;index" json:"jenis_transaksi"` // "penerimaan", "pengeluaran", "transfer_masuk", "transfer_keluar"
	KategoriTransaksi   string          `gorm:"column:kategori_transaksi;size:100" json:"kategori_transaksi"`
	BankAccountID       uint            `gorm:"column:bank_account_id;not null;index" json:"bank_account_id"`
	BankAccount         *BankAccount    `gorm:"foreignKey:BankAccountID" json:"bank_account,omitempty"`
	Jumlah              decimal.Decimal `gorm:"column:jumlah;type:numeric(15,2);not null" json:"jumlah"`
	Keterangan          string          `gorm:"column:keterangan;type:text" json:"keterangan"`
	NomorReferensi      string          `gorm:"column:nomor_referensi;size:100" json:"nomor_referensi"`
	PihakTerkait        string          `gorm:"column:pihak_terkait;size:200" json:"pihak_terkait"`
	DaftarAkunLawanID   *uint           `gorm:"column:daftar_akun_lawan_id;index" json:"daftar_akun_lawan_id"`
	DaftarAkunLawan     *ChartOfAccount `gorm:"foreignKey:DaftarAkunLawanID" json:"daftar_akun_lawan,omitempty"`
	JurnalID            *uint           `gorm:"column:jurnal_id;index" json:"jurnal_id"`
	Jurnal              *Journal        `gorm:"foreignKey:JurnalID" json:"jurnal,omitempty"`
	Status              string          `gorm:"column:status;size:20;default:'draft';index" json:"status"` // "draft", "posted", "reconciled", "cancelled"
	IsReconciled        bool            `gorm:"column:is_reconciled;default:false;index" json:"is_reconciled"`
	TanggalRekonsiliasi *time.Time      `gorm:"column:tanggal_rekonsiliasi;type:date" json:"tanggal_rekonsiliasi"`
	UserID              uint            `gorm:"column:user_id;not null" json:"user_id"`
	User                *User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PostedAt            *time.Time      `gorm:"column:posted_at" json:"posted_at"`
	PostedBy            *uint           `gorm:"column:posted_by" json:"posted_by"`
	Poster              *User           `gorm:"foreignKey:PostedBy" json:"poster,omitempty"`
	CreatedAt           time.Time       `gorm:"column:created_at" json:"created_at"`
	UpdatedAt           time.Time       `gorm:"column:updated_at" json:"updated_at"`
}

func (BankTransaction) TableName() string {
	return "bank_transactions"
}

type GiroTransaction struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	NomorGiro         string          `gorm:"column:nomor_giro;size:50;uniqueIndex;not null" json:"nomor_giro"`
	TanggalTerima     time.Time       `gorm:"column:tanggal_terima;type:date;not null;index" json:"tanggal_terima"`
	TanggalJatuhTempo time.Time       `gorm:"column:tanggal_jatuh_tempo;type:date;not null;index" json:"tanggal_jatuh_tempo"`
	TanggalCair       *time.Time      `gorm:"column:tanggal_cair;type:date" json:"tanggal_cair"`
	JenisGiro         string          `gorm:"column:jenis_giro;size:20;not null;index" json:"jenis_giro"`   // "masuk", "keluar"
	StatusGiro        string          `gorm:"column:status_giro;size:30;default:'diterima';index" json:"status_giro"` // "diterima", "diserahkan_ke_bank", "cair", "tolak", "batal"
	Status            string          `gorm:"column:status;size:20;default:'draft';index" json:"status"`   // "draft", "posted"
	BankAccountID     uint            `gorm:"column:bank_account_id;not null;index" json:"bank_account_id"`
	BankAccount       *BankAccount    `gorm:"foreignKey:BankAccountID" json:"bank_account,omitempty"`
	Jumlah            decimal.Decimal `gorm:"column:jumlah;type:numeric(15,2);not null" json:"jumlah"`
	NamaPenerbit      string          `gorm:"column:nama_penerbit;size:200;not null" json:"nama_penerbit"`
	BankPenerbit      string          `gorm:"column:bank_penerbit;size:100;not null" json:"bank_penerbit"`
	Keterangan        string          `gorm:"column:keterangan;type:text" json:"keterangan"`
	NomorReferensi    string          `gorm:"column:nomor_referensi;size:100" json:"nomor_referensi"`
	DaftarAkunGiroID  uint            `gorm:"column:daftar_akun_giro_id;not null;index" json:"daftar_akun_giro_id"`
	DaftarAkunGiro    *ChartOfAccount `gorm:"foreignKey:DaftarAkunGiroID" json:"daftar_akun_giro,omitempty"`
	DaftarAkunLawanID *uint           `gorm:"column:daftar_akun_lawan_id;index" json:"daftar_akun_lawan_id"`
	DaftarAkunLawan   *ChartOfAccount `gorm:"foreignKey:DaftarAkunLawanID" json:"daftar_akun_lawan,omitempty"`
	JurnalTerimaID    *uint           `gorm:"column:jurnal_terima_id;index" json:"jurnal_terima_id"`
	JurnalTerima      *Journal        `gorm:"foreignKey:JurnalTerimaID" json:"jurnal_terima,omitempty"`
	JurnalCairID      *uint           `gorm:"column:jurnal_cair_id;index" json:"jurnal_cair_id"`
	JurnalCair        *Journal        `gorm:"foreignKey:JurnalCairID" json:"jurnal_cair,omitempty"`
	UserID            uint            `gorm:"column:user_id;not null" json:"user_id"`
	User              *User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PostedAt          *time.Time      `gorm:"column:posted_at" json:"posted_at"`
	PostedBy          *uint           `gorm:"column:posted_by" json:"posted_by"`
	Poster            *User           `gorm:"foreignKey:PostedBy" json:"poster,omitempty"`
	PostingNotes      string          `gorm:"column:posting_notes;type:text" json:"posting_notes"`
	CreatedAt         time.Time       `gorm:"column:created_at" json:"created_at"`
	UpdatedAt         time.Time       `gorm:"column:updated_at" json:"updated_at"`
}

func (GiroTransaction) TableName() string {
	return "giro_transactions"
}
