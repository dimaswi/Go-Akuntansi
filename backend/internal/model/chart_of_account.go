package model

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type JenisAkun string
type SaldoNormal string

const (
	JenisAset       JenisAkun = "aset"
	JenisKewajiban  JenisAkun = "kewajiban"
	JenisEkuitas    JenisAkun = "ekuitas"
	JenisModal      JenisAkun = "modal"
	JenisPendapatan JenisAkun = "pendapatan"
	JenisBeban      JenisAkun = "beban"

	SaldoDebit  SaldoNormal = "debit"
	SaldoKredit SaldoNormal = "kredit"
)

type ChartOfAccount struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	KodeAkun    string           `gorm:"size:50;uniqueIndex;not null" json:"kode_akun"`
	NamaAkun    string           `gorm:"size:255;not null" json:"nama_akun"`
	JenisAkun   JenisAkun        `gorm:"size:50;not null;index" json:"jenis_akun"`
	SubJenis    string           `gorm:"size:100" json:"sub_jenis"`
	SaldoNormal SaldoNormal      `gorm:"size:20;not null" json:"saldo_normal"`
	IndukAkunID *uint            `gorm:"index" json:"induk_akun_id"`
	IndukAkun   *ChartOfAccount  `gorm:"foreignKey:IndukAkunID" json:"induk_akun,omitempty"`
	SubAkun     []ChartOfAccount `gorm:"foreignKey:IndukAkunID" json:"sub_akun,omitempty"`
	Level       int              `gorm:"default:1" json:"level"`
	IsAktif     bool             `gorm:"default:true" json:"is_aktif"`
	Keterangan  string           `gorm:"type:text" json:"keterangan"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `gorm:"index" json:"-"`

	// Computed fields for reporting & trial balance
	SaldoAwal  decimal.Decimal `gorm:"-" json:"saldo_awal,omitempty"`
	TotalDebit decimal.Decimal `gorm:"-" json:"total_debit,omitempty"`
	TotalKredit decimal.Decimal `gorm:"-" json:"total_kredit,omitempty"`
	SaldoAkhir decimal.Decimal `gorm:"-" json:"saldo_akhir,omitempty"`
}

func (ChartOfAccount) TableName() string {
	return "daftar_akun"
}
