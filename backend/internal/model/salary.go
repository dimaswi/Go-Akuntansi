package model

import (
	"fmt"
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type SalaryBatchStatus string

const (
	SalaryBatchStatusDraft  SalaryBatchStatus = "draft"
	SalaryBatchStatusDone   SalaryBatchStatus = "done"
	SalaryBatchStatusPosted SalaryBatchStatus = "posted"
)

type SalaryBatch struct {
	ID               uint              `gorm:"primaryKey" json:"id"`
	BatchNumber      string            `gorm:"size:100;uniqueIndex;not null" json:"batch_number"`
	PeriodMonth      int               `gorm:"not null;index:idx_salary_period" json:"period_month"`
	PeriodYear       int               `gorm:"not null;index:idx_salary_period" json:"period_year"`
	PeriodDisplay    string            `gorm:"-" json:"period_display"`
	Description      string            `gorm:"size:500" json:"description"`
	TotalEmployees   int               `gorm:"default:0" json:"total_employees"`
	TotalPendapatan  decimal.Decimal   `gorm:"type:numeric(15,2);default:0" json:"total_pendapatan"`
	TotalPotongan    decimal.Decimal   `gorm:"type:numeric(15,2);default:0" json:"total_potongan"`
	TotalGajiBersih  decimal.Decimal   `gorm:"type:numeric(15,2);default:0" json:"total_gaji_bersih"`
	Status           SalaryBatchStatus `gorm:"size:20;default:'draft';index" json:"status"`
	PaymentAccountID uint              `gorm:"not null" json:"payment_account_id"`
	PaymentAccount   *ChartOfAccount   `gorm:"foreignKey:PaymentAccountID" json:"payment_account,omitempty"`
	JournalID        *uint             `json:"journal_id"`
	Journal          *Journal          `gorm:"foreignKey:JournalID" json:"journal,omitempty"`
	CreatedBy        uint              `gorm:"not null" json:"created_by"`
	Creator          *User             `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	PostedBy         *uint             `json:"posted_by"`
	Poster           *User             `gorm:"foreignKey:PostedBy" json:"poster,omitempty"`
	PostedAt         *time.Time        `json:"posted_at"`
	Details          []SalaryDetail    `gorm:"foreignKey:SalaryBatchID" json:"details,omitempty"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`
	DeletedAt        gorm.DeletedAt    `gorm:"index" json:"-"`
	CanEdit          bool              `gorm:"-" json:"can_edit"`
	CanPost          bool              `gorm:"-" json:"can_post"`
}

func (SalaryBatch) TableName() string {
	return "salary_batches"
}

func (s *SalaryBatch) AfterFind(tx *gorm.DB) error {
	months := map[int]string{
		1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
		5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
		9: "September", 10: "Oktober", 11: "November", 12: "Desember",
	}
	s.PeriodDisplay = fmt.Sprintf("%s %d", months[s.PeriodMonth], s.PeriodYear)
	s.CanEdit = s.Status != SalaryBatchStatusPosted
	s.CanPost = s.Status != SalaryBatchStatusPosted && s.TotalEmployees > 0
	return nil
}

type SalaryDetail struct {
	ID                          uint            `gorm:"primaryKey" json:"id"`
	SalaryBatchID               uint            `gorm:"not null;index" json:"salary_batch_id"`
	SalaryBatch                 *SalaryBatch    `gorm:"foreignKey:SalaryBatchID" json:"salary_batch,omitempty"`
	UserID                      *uint           `gorm:"index" json:"user_id"`
	User                        *User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	NIP                         string          `gorm:"size:50" json:"nip"`
	NamaPegawai                 string          `gorm:"size:255;not null" json:"nama_pegawai"`
	NomorWhatsapp               string          `gorm:"size:50" json:"nomor_whatsapp"`
	GajiPokok                   decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"gaji_pokok"`
	TunjanganSIA                decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"tunjangan_sia"`
	TunjanganTransportasi       decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"tunjangan_transportasi"`
	TunjanganJabatan            decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"tunjangan_jabatan"`
	UangJagaUtama               decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"uang_jaga_utama"`
	UangJagaPratama             decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"uang_jaga_pratama"`
	JasaPelayananPratama        decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"jasa_pelayanan_pratama"`
	JasaPelayananRawatInap      decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"jasa_pelayanan_rawat_inap"`
	JasaPelayananRawatJalan     decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"jasa_pelayanan_rawat_jalan"`
	JasaPelayananRawatJalanBPJS decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"jasa_pelayanan_rawat_jalan_bpjs"`
	TugasTambahan               decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"tugas_tambahan"`
	TotalPendapatan             decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"total_pendapatan"`
	PPh21                       decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"pph_21"`
	Infaq                       decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"infaq"`
	BPJSKesehatan               decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"bpjs_kesehatan"`
	BPJSKetenagakerjaan         decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"bpjs_ketenagakerjaan"`
	DendaAbsen                  decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"denda_absen"`
	ArisanKeluarga              decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"arisan_keluarga"`
	DendaNgaji                  decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"denda_ngaji"`
	Kasbon                      decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"kasbon"`
	TotalPotongan               decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"total_potongan"`
	GajiBersih                  decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"gaji_bersih"`
	CreatedAt                   time.Time       `json:"created_at"`
	UpdatedAt                   time.Time       `json:"updated_at"`
}

func (SalaryDetail) TableName() string {
	return "salary_details"
}

func (d *SalaryDetail) CalculateTotals() {
	d.TotalPendapatan = d.GajiPokok.
		Add(d.TunjanganSIA).
		Add(d.TunjanganTransportasi).
		Add(d.TunjanganJabatan).
		Add(d.UangJagaUtama).
		Add(d.UangJagaPratama).
		Add(d.JasaPelayananPratama).
		Add(d.JasaPelayananRawatInap).
		Add(d.JasaPelayananRawatJalan).
		Add(d.JasaPelayananRawatJalanBPJS).
		Add(d.TugasTambahan)

	d.TotalPotongan = d.PPh21.
		Add(d.Infaq).
		Add(d.BPJSKesehatan).
		Add(d.BPJSKetenagakerjaan).
		Add(d.DendaAbsen).
		Add(d.ArisanKeluarga).
		Add(d.DendaNgaji).
		Add(d.Kasbon)

	d.GajiBersih = d.TotalPendapatan.Sub(d.TotalPotongan)
}

