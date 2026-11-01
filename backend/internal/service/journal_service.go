package service

import (
	"errors"
	"fmt"
	"time"

	"backend/internal/model"
	"backend/internal/repository"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type JournalService interface {
	GetAll(status model.JournalStatus, jenis model.JenisJurnal, startDate, endDate *time.Time, search string, page, limit int) ([]model.Journal, int64, error)
	GetByID(id uint) (*model.Journal, error)
	Create(req *CreateJournalRequest, userID uint) (*model.Journal, error)
	Update(id uint, req *CreateJournalRequest) (*model.Journal, error)
	Post(id uint, userID uint) (*model.Journal, error)
	Unpost(id uint) (*model.Journal, error)
	Reverse(id uint, userID uint, alasan string) (*model.Journal, error)
	Delete(id uint) error
}

type journalService struct {
	repo repository.JournalRepository
	db   *gorm.DB
}

func NewJournalService(repo repository.JournalRepository, db *gorm.DB) JournalService {
	return &journalService{repo: repo, db: db}
}

type CreateJournalDetailRequest struct {
	DaftarAkunID uint            `json:"daftar_akun_id" binding:"required"`
	JumlahDebit  decimal.Decimal `json:"jumlah_debit"`
	JumlahKredit decimal.Decimal `json:"jumlah_kredit"`
	Keterangan   string          `json:"keterangan"`
}

type CreateJournalRequest struct {
	NomorJurnal      string                       `json:"nomor_jurnal"`
	TanggalTransaksi string                       `json:"tanggal_transaksi" binding:"required"` // "YYYY-MM-DD"
	JenisJurnal      model.JenisJurnal            `json:"jenis_jurnal"`
	JenisReferensi   string                       `json:"jenis_referensi"`
	NomorReferensi   string                       `json:"nomor_referensi"`
	Keterangan       string                       `json:"keterangan"`
	Details          []CreateJournalDetailRequest `json:"details" binding:"required,min=2"`
}

func (s *journalService) GetAll(status model.JournalStatus, jenis model.JenisJurnal, startDate, endDate *time.Time, search string, page, limit int) ([]model.Journal, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 500 {
		limit = 500
	}
	return s.repo.GetAll(status, jenis, startDate, endDate, search, page, limit)
}

func (s *journalService) GetByID(id uint) (*model.Journal, error) {
	return s.repo.GetByID(id)
}

func (s *journalService) generateNomorJurnal(prefix string, tgl time.Time) string {
	tahun := tgl.Format("2006")
	bulan := tgl.Format("01")
	pattern := fmt.Sprintf("%s/%s/%s/", prefix, tahun, bulan)

	var lastJournal model.Journal
	err := s.db.Unscoped().Where("nomor_jurnal LIKE ?", pattern+"%").
		Order("LENGTH(nomor_jurnal) desc, nomor_jurnal desc").
		First(&lastJournal).Error

	newNumber := 1
	if err == nil && len(lastJournal.NomorJurnal) >= 4 {
		suffix := lastJournal.NomorJurnal[len(lastJournal.NomorJurnal)-4:]
		var lastNum int
		if _, scanErr := fmt.Sscanf(suffix, "%04d", &lastNum); scanErr == nil {
			newNumber = lastNum + 1
		}
	}

	for {
		candidate := fmt.Sprintf("%s%04d", pattern, newNumber)
		var cnt int64
		s.db.Unscoped().Model(&model.Journal{}).Where("nomor_jurnal = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate
		}
		newNumber++
	}
}

func (s *journalService) Create(req *CreateJournalRequest, userID uint) (*model.Journal, error) {
	tgl, err := time.Parse("2006-01-02", req.TanggalTransaksi)
	if err != nil {
		return nil, errors.New("format tanggal_transaksi tidak valid (harus YYYY-MM-DD)")
	}

	totalDebit := decimal.Zero
	totalKredit := decimal.Zero

	var details []model.JournalDetail
	for idx, d := range req.Details {
		if d.JumlahDebit.IsNegative() || d.JumlahKredit.IsNegative() {
			return nil, fmt.Errorf("baris #%d: jumlah debit dan kredit tidak boleh bernilai negatif", idx+1)
		}
		// Validasi aturan Laravel: setiap baris harus debit ATAU kredit (tidak boleh keduanya dan tidak boleh nol dua-duanya)
		isDebitSet := d.JumlahDebit.GreaterThan(decimal.Zero)
		isKreditSet := d.JumlahKredit.GreaterThan(decimal.Zero)
		if (isDebitSet && isKreditSet) || (!isDebitSet && !isKreditSet) {
			return nil, fmt.Errorf("baris #%d: setiap baris harus memiliki nilai debit ATAU kredit, tidak boleh keduanya atau bernilai nol", idx+1)
		}

		totalDebit = totalDebit.Add(d.JumlahDebit)
		totalKredit = totalKredit.Add(d.JumlahKredit)

		barisKeterangan := d.Keterangan
		if barisKeterangan == "" {
			barisKeterangan = req.Keterangan
		}

		details = append(details, model.JournalDetail{
			DaftarAkunID: d.DaftarAkunID,
			JumlahDebit:  d.JumlahDebit,
			JumlahKredit: d.JumlahKredit,
			Keterangan:   barisKeterangan,
		})
	}

	// VALIDASI AKUNTANSI: Total Debit HARUS SAMA DENGAN Total Kredit
	if !totalDebit.Equal(totalKredit) {
		return nil, fmt.Errorf("jurnal tidak seimbang: Total Debit (%s) tidak sama dengan Total Kredit (%s)", totalDebit.StringFixed(2), totalKredit.StringFixed(2))
	}

	nomorJurnal := req.NomorJurnal
	if nomorJurnal == "" {
		prefix := "JE"
		if req.JenisJurnal == model.JenisJurnalPenyesuaian {
			prefix = "JP"
		} else if req.JenisJurnal == model.JenisJurnalPenutup {
			prefix = "JT"
		}
		nomorJurnal = s.generateNomorJurnal(prefix, tgl)
	}

	jenisJurnal := req.JenisJurnal
	if jenisJurnal == "" {
		jenisJurnal = model.JenisJurnalUmum
	}

	journal := &model.Journal{
		NomorJurnal:      nomorJurnal,
		TanggalTransaksi: tgl,
		JenisReferensi:   req.JenisReferensi,
		NomorReferensi:   req.NomorReferensi,
		JenisJurnal:      jenisJurnal,
		Keterangan:       req.Keterangan,
		TotalDebit:       totalDebit,
		TotalKredit:      totalKredit,
		Status:           model.StatusDraft,
		DibuatOleh:       userID,
		Details:          details,
	}

	if err := s.repo.CreateWithDetails(journal); err != nil {
		return nil, err
	}

	return s.GetByID(journal.ID)
}

func (s *journalService) Update(id uint, req *CreateJournalRequest) (*model.Journal, error) {
	journal, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if journal.Status != model.StatusDraft {
		return nil, errors.New("hanya jurnal dengan status draft yang dapat diedit")
	}

	tgl, err := time.Parse("2006-01-02", req.TanggalTransaksi)
	if err != nil {
		return nil, errors.New("format tanggal_transaksi tidak valid (harus YYYY-MM-DD)")
	}

	totalDebit := decimal.Zero
	totalKredit := decimal.Zero

	var details []model.JournalDetail
	for idx, d := range req.Details {
		if d.JumlahDebit.IsNegative() || d.JumlahKredit.IsNegative() {
			return nil, fmt.Errorf("baris #%d: jumlah debit dan kredit tidak boleh bernilai negatif", idx+1)
		}
		isDebitSet := d.JumlahDebit.GreaterThan(decimal.Zero)
		isKreditSet := d.JumlahKredit.GreaterThan(decimal.Zero)
		if (isDebitSet && isKreditSet) || (!isDebitSet && !isKreditSet) {
			return nil, fmt.Errorf("baris #%d: setiap baris harus memiliki nilai debit ATAU kredit, tidak boleh keduanya atau bernilai nol", idx+1)
		}

		totalDebit = totalDebit.Add(d.JumlahDebit)
		totalKredit = totalKredit.Add(d.JumlahKredit)

		barisKeterangan := d.Keterangan
		if barisKeterangan == "" {
			barisKeterangan = req.Keterangan
		}

		details = append(details, model.JournalDetail{
			JurnalID:     journal.ID,
			DaftarAkunID: d.DaftarAkunID,
			JumlahDebit:  d.JumlahDebit,
			JumlahKredit: d.JumlahKredit,
			Keterangan:   barisKeterangan,
		})
	}

	if !totalDebit.Equal(totalKredit) {
		return nil, fmt.Errorf("jurnal tidak seimbang: Total Debit (%s) tidak sama dengan Total Kredit (%s)", totalDebit.StringFixed(2), totalKredit.StringFixed(2))
	}

	if req.NomorJurnal != "" {
		journal.NomorJurnal = req.NomorJurnal
	}
	journal.TanggalTransaksi = tgl
	if req.JenisJurnal != "" {
		journal.JenisJurnal = req.JenisJurnal
	}
	journal.JenisReferensi = req.JenisReferensi
	journal.NomorReferensi = req.NomorReferensi
	journal.Keterangan = req.Keterangan
	journal.TotalDebit = totalDebit
	journal.TotalKredit = totalKredit
	journal.Details = details

	if err := s.repo.UpdateWithDetails(journal); err != nil {
		return nil, err
	}

	return s.GetByID(journal.ID)
}

func (s *journalService) Post(id uint, userID uint) (*model.Journal, error) {
	journal, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if journal.Status == model.StatusPosted {
		return nil, errors.New("jurnal sudah diposting sebelumnya")
	}

	now := time.Now()
	journal.Status = model.StatusPosted
	journal.DipostingOleh = &userID
	journal.TanggalPosting = &now

	if err := s.repo.Update(journal); err != nil {
		return nil, err
	}

	return journal, nil
}

func (s *journalService) Unpost(id uint) (*model.Journal, error) {
	journal, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if journal.Status == model.StatusDraft {
		return nil, errors.New("jurnal sudah berstatus draft")
	}

	journal.Status = model.StatusDraft
	journal.DipostingOleh = nil
	journal.TanggalPosting = nil

	if err := s.repo.Update(journal); err != nil {
		return nil, err
	}

	return journal, nil
}

func (s *journalService) Reverse(id uint, userID uint, alasan string) (*model.Journal, error) {
	journal, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if journal.Status != model.StatusPosted {
		return nil, errors.New("hanya jurnal yang sudah berstatus 'posted' yang dapat direverse")
	}

	if alasan != "" {
		journal.Keterangan = fmt.Sprintf("%s (Reversed: %s)", journal.Keterangan, alasan)
	}
	journal.Status = model.StatusReversed

	if err := s.db.Model(&model.Journal{}).Where("id = ?", journal.ID).Updates(map[string]interface{}{
		"status":     model.StatusReversed,
		"keterangan": journal.Keterangan,
	}).Error; err != nil {
		return nil, err
	}

	return journal, nil
}

func (s *journalService) Delete(id uint) error {
	journal, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if journal.Status == model.StatusPosted {
		return errors.New("jurnal yang sudah diposting tidak dapat dihapus! Lakukan unpost atau reversal terlebih dahulu")
	}

	return s.repo.Delete(id)
}
