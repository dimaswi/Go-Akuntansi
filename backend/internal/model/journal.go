package model

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type JournalStatus string
type JenisJurnal string

const (
	StatusDraft    JournalStatus = "draft"
	StatusPosted   JournalStatus = "posted"
	StatusReversed JournalStatus = "reversed"

	JenisJurnalUmum         JenisJurnal = "umum"
	JenisJurnalPenyesuaian  JenisJurnal = "penyesuaian"
	JenisJurnalPenutup      JenisJurnal = "penutup"
	JenisJurnalPembalik     JenisJurnal = "pembalik"
)

type Journal struct {
	ID               uint            `gorm:"primaryKey" json:"id"`
	NomorJurnal      string          `gorm:"size:50;uniqueIndex;not null" json:"nomor_jurnal"`
	TanggalTransaksi time.Time       `gorm:"type:date;not null;index" json:"tanggal_transaksi"`
	JenisReferensi   string          `gorm:"size:100" json:"jenis_referensi"`
	NomorReferensi   string          `gorm:"size:100;index" json:"nomor_referensi"`
	JenisJurnal      JenisJurnal     `gorm:"size:50;default:'umum';index" json:"jenis_jurnal"`
	Keterangan       string          `gorm:"type:text" json:"keterangan"`
	TotalDebit       decimal.Decimal `gorm:"type:numeric(18,2);not null;default:0" json:"total_debit"`
	TotalKredit      decimal.Decimal `gorm:"type:numeric(18,2);not null;default:0" json:"total_kredit"`
	Status           JournalStatus   `gorm:"size:20;default:'draft';index" json:"status"`
	DibuatOleh       uint            `gorm:"not null" json:"dibuat_oleh"`
	Pembuat          *User           `gorm:"foreignKey:DibuatOleh" json:"pembuat,omitempty"`
	DipostingOleh    *uint           `json:"diposting_oleh"`
	Poster           *User           `gorm:"foreignKey:DipostingOleh" json:"poster,omitempty"`
	TanggalPosting   *time.Time      `json:"tanggal_posting"`
	Details          []JournalDetail `gorm:"foreignKey:JurnalID" json:"details"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	DeletedAt        gorm.DeletedAt  `gorm:"index" json:"-"`
}

func (Journal) TableName() string {
	return "jurnal"
}

type JournalDetail struct {
	ID           uint            `gorm:"primaryKey" json:"id"`
	JurnalID     uint            `gorm:"not null;index" json:"jurnal_id"`
	Jurnal       *Journal        `gorm:"foreignKey:JurnalID" json:"jurnal,omitempty"`
	DaftarAkunID uint            `gorm:"not null;index" json:"daftar_akun_id"`
	DaftarAkun   *ChartOfAccount `gorm:"foreignKey:DaftarAkunID" json:"daftar_akun,omitempty"`
	JumlahDebit  decimal.Decimal `gorm:"type:numeric(18,2);not null;default:0" json:"jumlah_debit"`
	JumlahKredit decimal.Decimal `gorm:"type:numeric(18,2);not null;default:0" json:"jumlah_kredit"`
	Keterangan   string          `gorm:"type:text" json:"keterangan"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

func (JournalDetail) TableName() string {
	return "detail_jurnal"
}
