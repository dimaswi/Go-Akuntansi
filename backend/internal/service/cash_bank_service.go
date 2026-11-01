package service

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/repository"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type CustomJournalDetailRequest struct {
	DaftarAkunID uint            `json:"daftar_akun_id" binding:"required"`
	Keterangan   string          `json:"keterangan"`
	JumlahDebit  decimal.Decimal `json:"jumlah_debit"`
	JumlahKredit decimal.Decimal `json:"jumlah_kredit"`
}

// CashBankService interface
type CashBankService interface {
	// Bank Accounts
	GetBankAccounts(search string, isAktif *bool) ([]model.BankAccount, error)
	GetBankAccountsPaginated(page, perPage int, search string, isAktif *bool) ([]model.BankAccount, int64, error)
	GetBankAccountByID(id uint) (*model.BankAccount, error)
	CreateBankAccount(acc *model.BankAccount) error
	UpdateBankAccount(id uint, acc *model.BankAccount) error
	DeleteBankAccount(id uint) error

	// Cash Transactions
	GetCashTransactionsPaginated(page, perPage int, search, jenis, status string, from, to *time.Time) ([]model.CashTransaction, int64, map[string]interface{}, error)
	GetCashTransactionByID(id uint) (*model.CashTransaction, error)
	CreateCashTransaction(tx *model.CashTransaction, userID uint) error
	UpdateCashTransaction(id uint, tx *model.CashTransaction) error
	DeleteCashTransaction(id uint) error
	PostCashToJournal(id uint, userID uint, details []CustomJournalDetailRequest) (*model.Journal, error)

	// Bank Transactions
	GetBankTransactionsPaginated(page, perPage int, search, jenis, status string, bankAccountID *uint, from, to *time.Time) ([]model.BankTransaction, int64, map[string]interface{}, error)
	GetBankTransactionByID(id uint) (*model.BankTransaction, error)
	CreateBankTransaction(tx *model.BankTransaction, userID uint) error
	UpdateBankTransaction(id uint, tx *model.BankTransaction) error
	DeleteBankTransaction(id uint) error
	ReconcileBankTransaction(id uint, tglRekonsiliasi time.Time) error
	PostBankToJournal(id uint, userID uint, details []CustomJournalDetailRequest) (*model.Journal, error)

	// Giro Transactions
	GetGiroTransactionsPaginated(page, perPage int, search, jenisGiro, statusGiro, status string, bankAccountID *uint, from, to *time.Time) ([]model.GiroTransaction, int64, error)
	GetGiroTransactionByID(id uint) (*model.GiroTransaction, error)
	CreateGiroTransaction(tx *model.GiroTransaction, userID uint) error
	UpdateGiroTransaction(id uint, tx *model.GiroTransaction) error
	DeleteGiroTransaction(id uint) error
	SubmitGiroToBank(id uint) error
	CashGiro(id uint, tanggalCair time.Time, userID uint) (*model.Journal, error)
	BounceGiro(id uint, alasan string) error
	PostGiroToJournal(id uint, userID uint, details []CustomJournalDetailRequest) (*model.Journal, error)
	GetGiroReport(from, to time.Time, bankAccountID *uint) (map[string]interface{}, error)
}

type cashBankService struct {
	bankAccountRepo     repository.BankAccountRepository
	cashTransactionRepo repository.CashTransactionRepository
	bankTransactionRepo repository.BankTransactionRepository
	giroTransactionRepo repository.GiroTransactionRepository
	accountRepo         repository.AccountRepository
	journalRepo         repository.JournalRepository
	db                  *gorm.DB
}

func NewCashBankService(
	bankAccountRepo repository.BankAccountRepository,
	cashTransactionRepo repository.CashTransactionRepository,
	bankTransactionRepo repository.BankTransactionRepository,
	giroTransactionRepo repository.GiroTransactionRepository,
	accountRepo repository.AccountRepository,
	journalRepo repository.JournalRepository,
	db *gorm.DB,
) CashBankService {
	return &cashBankService{
		bankAccountRepo:     bankAccountRepo,
		cashTransactionRepo: cashTransactionRepo,
		bankTransactionRepo: bankTransactionRepo,
		giroTransactionRepo: giroTransactionRepo,
		accountRepo:         accountRepo,
		journalRepo:         journalRepo,
		db:                  db,
	}
}

// -------------------------------------------------------------
// Bank Accounts
// -------------------------------------------------------------

func (s *cashBankService) GetBankAccounts(search string, isAktif *bool) ([]model.BankAccount, error) {
	return s.bankAccountRepo.GetAll(search, isAktif)
}

func (s *cashBankService) GetBankAccountsPaginated(page, perPage int, search string, isAktif *bool) ([]model.BankAccount, int64, error) {
	return s.bankAccountRepo.GetPaginated(page, perPage, search, isAktif)
}

func (s *cashBankService) GetBankAccountByID(id uint) (*model.BankAccount, error) {
	return s.bankAccountRepo.GetByID(id)
}

func (s *cashBankService) CreateBankAccount(acc *model.BankAccount) error {
	if acc.SaldoBerjalan.IsZero() && !acc.SaldoAwal.IsZero() {
		acc.SaldoBerjalan = acc.SaldoAwal
	}
	return s.bankAccountRepo.Create(acc)
}

func (s *cashBankService) UpdateBankAccount(id uint, req *model.BankAccount) error {
	existing, err := s.bankAccountRepo.GetByID(id)
	if err != nil {
		return err
	}
	existing.NamaBank = req.NamaBank
	existing.NamaRekening = req.NamaRekening
	existing.NomorRekening = req.NomorRekening
	existing.Cabang = req.Cabang
	existing.DaftarAkunID = req.DaftarAkunID
	existing.JenisRekening = req.JenisRekening
	existing.Keterangan = req.Keterangan
	existing.IsAktif = req.IsAktif
	return s.bankAccountRepo.Update(existing)
}

func (s *cashBankService) DeleteBankAccount(id uint) error {
	return s.bankAccountRepo.Delete(id)
}

// -------------------------------------------------------------
// Cash Transactions
// -------------------------------------------------------------

func (s *cashBankService) GetCashTransactionsPaginated(page, perPage int, search, jenis, status string, from, to *time.Time) ([]model.CashTransaction, int64, map[string]interface{}, error) {
	items, total, err := s.cashTransactionRepo.GetPaginated(page, perPage, search, jenis, status, from, to)
	if err != nil {
		return nil, 0, nil, err
	}

	// Calculate summary stats
	type sumRes struct {
		TotalMasuk  decimal.Decimal
		TotalKeluar decimal.Decimal
		TotalDraft  int64
	}
	var res sumRes
	s.db.Model(&model.CashTransaction{}).
		Select("COALESCE(SUM(CASE WHEN jenis_transaksi = 'penerimaan' AND status = 'posted' THEN jumlah ELSE 0 END), 0) as total_masuk, " +
			"COALESCE(SUM(CASE WHEN jenis_transaksi = 'pengeluaran' AND status = 'posted' THEN jumlah ELSE 0 END), 0) as total_keluar, " +
			"COUNT(CASE WHEN status = 'draft' THEN 1 END) as total_draft").
		Scan(&res)

	saldoKas := res.TotalMasuk.Sub(res.TotalKeluar)

	summary := map[string]interface{}{
		"total_penerimaan": res.TotalMasuk,
		"total_pengeluaran": res.TotalKeluar,
		"total_draft":      res.TotalDraft,
		"saldo_kas":        saldoKas,
	}

	return items, total, summary, nil
}

func (s *cashBankService) GetCashTransactionByID(id uint) (*model.CashTransaction, error) {
	return s.cashTransactionRepo.GetByID(id)
}

func (s *cashBankService) generateCashNumber(jenis string) (string, error) {
	prefix := "KAS"
	if jenis == "penerimaan" {
		prefix = "KM"
	} else if jenis == "pengeluaran" {
		prefix = "KK"
	}
	ym := time.Now().Format("2006/01")
	lastNo, _ := s.cashTransactionRepo.GetLastNumber(prefix, ym)

	nextSeq := 1
	if lastNo != "" {
		parts := strings.Split(lastNo, "/")
		if len(parts) >= 4 {
			if seq, err := strconv.Atoi(parts[len(parts)-1]); err == nil {
				nextSeq = seq + 1
			}
		}
	}
	for {
		candidate := fmt.Sprintf("%s/%s/%04d", prefix, ym, nextSeq)
		var cnt int64
		s.db.Unscoped().Model(&model.CashTransaction{}).Where("nomor_transaksi = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		nextSeq++
	}
}

func (s *cashBankService) CreateCashTransaction(tx *model.CashTransaction, userID uint) error {
	tx.UserID = userID
	tx.Status = "draft"
	if tx.NomorTransaksi == "" {
		no, err := s.generateCashNumber(tx.JenisTransaksi)
		if err != nil {
			return err
		}
		tx.NomorTransaksi = no
	}
	return s.cashTransactionRepo.Create(tx)
}

func (s *cashBankService) UpdateCashTransaction(id uint, req *model.CashTransaction) error {
	existing, err := s.cashTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return errors.New("hanya transaksi berstatus draft yang dapat diedit")
	}
	existing.TanggalTransaksi = req.TanggalTransaksi
	existing.JenisTransaksi = req.JenisTransaksi
	existing.KategoriTransaksi = req.KategoriTransaksi
	existing.Jumlah = req.Jumlah
	existing.Keterangan = req.Keterangan
	existing.PihakTerkait = req.PihakTerkait
	existing.Referensi = req.Referensi
	existing.DaftarAkunKasID = req.DaftarAkunKasID
	existing.DaftarAkunLawanID = req.DaftarAkunLawanID
	return s.cashTransactionRepo.Update(existing)
}

func (s *cashBankService) DeleteCashTransaction(id uint) error {
	existing, err := s.cashTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return errors.New("hanya transaksi berstatus draft yang dapat dihapus")
	}
	return s.cashTransactionRepo.Delete(id)
}

func (s *cashBankService) generateNomorJurnal(prefix string, tgl time.Time) string {
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
		candidate := fmt.Sprintf("%s/%s/%s/%04d", prefix, tahun, bulan, newNumber)
		var cnt int64
		s.db.Unscoped().Model(&model.Journal{}).Where("nomor_jurnal = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate
		}
		newNumber++
	}
}

func (s *cashBankService) PostCashToJournal(id uint, userID uint, details []CustomJournalDetailRequest) (*model.Journal, error) {
	tx, err := s.cashTransactionRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if tx.Status != "draft" {
		return nil, errors.New("transaksi sudah diposting atau bukan draft")
	}

	var journal *model.Journal
	err = s.db.Transaction(func(db *gorm.DB) error {
		// Generate nomor jurnal: JKS/YYYY/MM/XXXX
		nomorJurnal := s.generateNomorJurnal("JKS", tx.TanggalTransaksi)

		ket := tx.Keterangan
		if tx.PihakTerkait != "" {
			ket = fmt.Sprintf("%s - %s", tx.Keterangan, tx.PihakTerkait)
		}

		totDebit := decimal.Zero
		totKredit := decimal.Zero

		var journalDetails []model.JournalDetail
		if len(details) >= 2 {
			// Menggunakan custom details dari UI
			for _, d := range details {
				totDebit = totDebit.Add(d.JumlahDebit)
				totKredit = totKredit.Add(d.JumlahKredit)
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: d.DaftarAkunID,
					JumlahDebit:  d.JumlahDebit,
					JumlahKredit: d.JumlahKredit,
					Keterangan:   d.Keterangan,
				})
			}
		} else {
			// Auto generated detail berdasarkan jenis transaksi
			if tx.DaftarAkunLawanID == nil {
				return errors.New("rekening akun lawan wajib dipilih untuk posting jurnal")
			}

			if tx.JenisTransaksi == "penerimaan" {
				// Debit Kas, Kredit Lawan
				totDebit = tx.Jumlah
				totKredit = tx.Jumlah
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: tx.DaftarAkunKasID,
					JumlahDebit:  tx.Jumlah,
					JumlahKredit: decimal.Zero,
					Keterangan:   ket,
				})
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: *tx.DaftarAkunLawanID,
					JumlahDebit:  decimal.Zero,
					JumlahKredit: tx.Jumlah,
					Keterangan:   ket,
				})
			} else {
				// Debit Lawan, Kredit Kas
				totDebit = tx.Jumlah
				totKredit = tx.Jumlah
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: *tx.DaftarAkunLawanID,
					JumlahDebit:  tx.Jumlah,
					JumlahKredit: decimal.Zero,
					Keterangan:   ket,
				})
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: tx.DaftarAkunKasID,
					JumlahDebit:  decimal.Zero,
					JumlahKredit: tx.Jumlah,
					Keterangan:   ket,
				})
			}
		}

		if !totDebit.Equal(totKredit) {
			return errors.New("total debit dan kredit jurnal harus seimbang (balance)")
		}

		now := time.Now()
		jurnalHeader := model.Journal{
			NomorJurnal:      nomorJurnal,
			TanggalTransaksi: tx.TanggalTransaksi,
			JenisReferensi:   "kas",
			NomorReferensi:   tx.NomorTransaksi,
			JenisJurnal:      model.JenisJurnalUmum,
			Keterangan:       ket,
			TotalDebit:       totDebit,
			TotalKredit:      totKredit,
			Status:           model.StatusPosted,
			DibuatOleh:       userID,
			DipostingOleh:    &userID,
			TanggalPosting:   &now,
			Details:          journalDetails,
		}

		if err := db.Create(&jurnalHeader).Error; err != nil {
			return err
		}

		tx.JurnalID = &jurnalHeader.ID
		tx.Status = "posted"
		tx.PostedAt = &now
		tx.PostedBy = &userID
		if err := db.Save(tx).Error; err != nil {
			return err
		}

		journal = &jurnalHeader
		return nil
	})

	return journal, err
}

// -------------------------------------------------------------
// Bank Transactions
// -------------------------------------------------------------

func (s *cashBankService) GetBankTransactionsPaginated(page, perPage int, search, jenis, status string, bankAccountID *uint, from, to *time.Time) ([]model.BankTransaction, int64, map[string]interface{}, error) {
	items, total, err := s.bankTransactionRepo.GetPaginated(page, perPage, search, jenis, status, bankAccountID, from, to)
	if err != nil {
		return nil, 0, nil, err
	}

	type sumRes struct {
		TotalMasuk      decimal.Decimal
		TotalKeluar     decimal.Decimal
		TotalDraft      int64
		TotalReconciled int64
	}
	var res sumRes
	query := s.db.Model(&model.BankTransaction{})
	if bankAccountID != nil && *bankAccountID > 0 {
		query = query.Where("bank_account_id = ?", *bankAccountID)
	}
	query.Select("COALESCE(SUM(CASE WHEN jenis_transaksi IN ('penerimaan', 'setoran', 'transfer_masuk', 'bunga_bank') AND status = 'posted' THEN jumlah ELSE 0 END), 0) as total_masuk, " +
		"COALESCE(SUM(CASE WHEN jenis_transaksi IN ('pengeluaran', 'penarikan', 'transfer_keluar', 'biaya_admin', 'pajak_bunga') AND status = 'posted' THEN jumlah ELSE 0 END), 0) as total_keluar, " +
		"COUNT(CASE WHEN status = 'draft' THEN 1 END) as total_draft, " +
		"COUNT(CASE WHEN is_reconciled = true THEN 1 END) as total_reconciled").
		Scan(&res)

	summary := map[string]interface{}{
		"total_masuk":      res.TotalMasuk,
		"total_keluar":     res.TotalKeluar,
		"total_draft":      res.TotalDraft,
		"total_reconciled": res.TotalReconciled,
		"net_bank":         res.TotalMasuk.Sub(res.TotalKeluar),
	}

	return items, total, summary, nil
}

func (s *cashBankService) GetBankTransactionByID(id uint) (*model.BankTransaction, error) {
	return s.bankTransactionRepo.GetByID(id)
}

func (s *cashBankService) generateBankNumber(jenis string) (string, error) {
	prefix := "BANK"
	switch jenis {
	case "penerimaan", "setoran":
		prefix = "BM"
	case "pengeluaran", "penarikan":
		prefix = "BK"
	case "transfer_masuk":
		prefix = "BTM"
	case "transfer_keluar":
		prefix = "BTK"
	}
	ym := time.Now().Format("2006/01")
	lastNo, _ := s.bankTransactionRepo.GetLastNumber(prefix, ym)

	nextSeq := 1
	if lastNo != "" {
		parts := strings.Split(lastNo, "/")
		if len(parts) >= 4 {
			if seq, err := strconv.Atoi(parts[len(parts)-1]); err == nil {
				nextSeq = seq + 1
			}
		}
	}
	for {
		candidate := fmt.Sprintf("%s/%s/%04d", prefix, ym, nextSeq)
		var cnt int64
		s.db.Unscoped().Model(&model.BankTransaction{}).Where("nomor_transaksi = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		nextSeq++
	}
}

func (s *cashBankService) CreateBankTransaction(tx *model.BankTransaction, userID uint) error {
	tx.UserID = userID
	tx.Status = "draft"
	tx.IsReconciled = false
	if tx.NomorTransaksi == "" {
		no, err := s.generateBankNumber(tx.JenisTransaksi)
		if err != nil {
			return err
		}
		tx.NomorTransaksi = no
	}
	return s.bankTransactionRepo.Create(tx)
}

func (s *cashBankService) UpdateBankTransaction(id uint, req *model.BankTransaction) error {
	existing, err := s.bankTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return errors.New("hanya transaksi berstatus draft yang dapat diedit")
	}
	existing.TanggalTransaksi = req.TanggalTransaksi
	existing.TanggalEfektif = req.TanggalEfektif
	existing.JenisTransaksi = req.JenisTransaksi
	existing.KategoriTransaksi = req.KategoriTransaksi
	existing.BankAccountID = req.BankAccountID
	existing.Jumlah = req.Jumlah
	existing.Keterangan = req.Keterangan
	existing.NomorReferensi = req.NomorReferensi
	existing.PihakTerkait = req.PihakTerkait
	existing.DaftarAkunLawanID = req.DaftarAkunLawanID
	return s.bankTransactionRepo.Update(existing)
}

func (s *cashBankService) DeleteBankTransaction(id uint) error {
	existing, err := s.bankTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return errors.New("hanya transaksi berstatus draft yang dapat dihapus")
	}
	return s.bankTransactionRepo.Delete(id)
}

func (s *cashBankService) ReconcileBankTransaction(id uint, tgl time.Time) error {
	tx, err := s.bankTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	tx.IsReconciled = true
	tx.TanggalRekonsiliasi = &tgl
	if tx.Status == "posted" {
		tx.Status = "reconciled"
	}
	return s.bankTransactionRepo.Update(tx)
}

func (s *cashBankService) PostBankToJournal(id uint, userID uint, details []CustomJournalDetailRequest) (*model.Journal, error) {
	tx, err := s.bankTransactionRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if tx.Status != "draft" {
		return nil, errors.New("transaksi sudah diposting atau bukan draft")
	}

	var journal *model.Journal
	err = s.db.Transaction(func(db *gorm.DB) error {
		nomorJurnal := s.generateNomorJurnal("JBK", tx.TanggalTransaksi)

		ket := tx.Keterangan
		if tx.PihakTerkait != "" {
			ket = fmt.Sprintf("%s - %s", tx.Keterangan, tx.PihakTerkait)
		}

		bankAcc, err := s.bankAccountRepo.GetByID(tx.BankAccountID)
		if err != nil {
			return fmt.Errorf("rekening bank tidak ditemukan: %w", err)
		}

		totDebit := decimal.Zero
		totKredit := decimal.Zero

		var journalDetails []model.JournalDetail
		if len(details) >= 2 {
			for _, d := range details {
				totDebit = totDebit.Add(d.JumlahDebit)
				totKredit = totKredit.Add(d.JumlahKredit)
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: d.DaftarAkunID,
					JumlahDebit:  d.JumlahDebit,
					JumlahKredit: d.JumlahKredit,
					Keterangan:   d.Keterangan,
				})
			}
		} else {
			if tx.DaftarAkunLawanID == nil {
				return errors.New("rekening akun lawan wajib dipilih untuk posting jurnal")
			}

			isMasuk := tx.JenisTransaksi == "penerimaan" || tx.JenisTransaksi == "setoran" || tx.JenisTransaksi == "transfer_masuk" || tx.JenisTransaksi == "bunga_bank"
			if isMasuk {
				totDebit = tx.Jumlah
				totKredit = tx.Jumlah
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: bankAcc.DaftarAkunID,
					JumlahDebit:  tx.Jumlah,
					JumlahKredit: decimal.Zero,
					Keterangan:   ket,
				})
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: *tx.DaftarAkunLawanID,
					JumlahDebit:  decimal.Zero,
					JumlahKredit: tx.Jumlah,
					Keterangan:   ket,
				})
			} else {
				totDebit = tx.Jumlah
				totKredit = tx.Jumlah
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: *tx.DaftarAkunLawanID,
					JumlahDebit:  tx.Jumlah,
					JumlahKredit: decimal.Zero,
					Keterangan:   ket,
				})
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: bankAcc.DaftarAkunID,
					JumlahDebit:  decimal.Zero,
					JumlahKredit: tx.Jumlah,
					Keterangan:   ket,
				})
			}
		}

		if !totDebit.Equal(totKredit) {
			return errors.New("total debit dan kredit jurnal harus seimbang (balance)")
		}

		now := time.Now()
		jurnalHeader := model.Journal{
			NomorJurnal:      nomorJurnal,
			TanggalTransaksi: tx.TanggalTransaksi,
			JenisReferensi:   "bank",
			NomorReferensi:   tx.NomorTransaksi,
			JenisJurnal:      model.JenisJurnalUmum,
			Keterangan:       ket,
			TotalDebit:       totDebit,
			TotalKredit:      totKredit,
			Status:           model.StatusPosted,
			DibuatOleh:       userID,
			DipostingOleh:    &userID,
			TanggalPosting:   &now,
			Details:          journalDetails,
		}

		if err := db.Create(&jurnalHeader).Error; err != nil {
			return err
		}

		tx.JurnalID = &jurnalHeader.ID
		tx.Status = "posted"
		tx.PostedAt = &now
		tx.PostedBy = &userID
		if err := db.Save(tx).Error; err != nil {
			return err
		}

		// Update Saldo Berjalan Rekening Bank
		isMasuk := tx.JenisTransaksi == "penerimaan" || tx.JenisTransaksi == "setoran" || tx.JenisTransaksi == "transfer_masuk" || tx.JenisTransaksi == "bunga_bank"
		delta, _ := tx.Jumlah.Float64()
		if !isMasuk {
			delta = -delta
		}
		if err := s.bankAccountRepo.UpdateSaldoBerjalan(bankAcc.ID, delta); err != nil {
			return err
		}

		journal = &jurnalHeader
		return nil
	})

	return journal, err
}

// -------------------------------------------------------------
// Giro Transactions
// -------------------------------------------------------------

func (s *cashBankService) GetGiroTransactionsPaginated(page, perPage int, search, jenisGiro, statusGiro, status string, bankAccountID *uint, from, to *time.Time) ([]model.GiroTransaction, int64, error) {
	return s.giroTransactionRepo.GetPaginated(page, perPage, search, jenisGiro, statusGiro, status, bankAccountID, from, to)
}

func (s *cashBankService) GetGiroTransactionByID(id uint) (*model.GiroTransaction, error) {
	return s.giroTransactionRepo.GetByID(id)
}

func (s *cashBankService) CreateGiroTransaction(tx *model.GiroTransaction, userID uint) error {
	tx.UserID = userID
	tx.Status = "draft"
	if tx.StatusGiro == "" {
		tx.StatusGiro = "diterima"
	}
	return s.giroTransactionRepo.Create(tx)
}

func (s *cashBankService) UpdateGiroTransaction(id uint, req *model.GiroTransaction) error {
	existing, err := s.giroTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return errors.New("hanya transaksi giro draft yang dapat diedit")
	}
	existing.NomorGiro = req.NomorGiro
	existing.TanggalTerima = req.TanggalTerima
	existing.TanggalJatuhTempo = req.TanggalJatuhTempo
	existing.JenisGiro = req.JenisGiro
	existing.BankAccountID = req.BankAccountID
	existing.Jumlah = req.Jumlah
	existing.NamaPenerbit = req.NamaPenerbit
	existing.BankPenerbit = req.BankPenerbit
	existing.Keterangan = req.Keterangan
	existing.NomorReferensi = req.NomorReferensi
	existing.DaftarAkunGiroID = req.DaftarAkunGiroID
	existing.DaftarAkunLawanID = req.DaftarAkunLawanID
	return s.giroTransactionRepo.Update(existing)
}

func (s *cashBankService) DeleteGiroTransaction(id uint) error {
	existing, err := s.giroTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return errors.New("hanya giro berstatus draft yang dapat dihapus")
	}
	return s.giroTransactionRepo.Delete(id)
}

func (s *cashBankService) SubmitGiroToBank(id uint) error {
	tx, err := s.giroTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if tx.StatusGiro != "diterima" {
		return errors.New("hanya giro dengan status diterima yang dapat diserahkan ke bank")
	}
	tx.StatusGiro = "diserahkan_ke_bank"
	return s.giroTransactionRepo.Update(tx)
}

func (s *cashBankService) CashGiro(id uint, tanggalCair time.Time, userID uint) (*model.Journal, error) {
	tx, err := s.giroTransactionRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if tx.StatusGiro == "cair" {
		return nil, errors.New("giro sudah dicairkan sebelumnya")
	}
	if tx.StatusGiro == "tolak" || tx.StatusGiro == "batal" {
		return nil, errors.New("giro yang ditolak atau batal tidak dapat dicairkan")
	}

	var journal *model.Journal
	err = s.db.Transaction(func(db *gorm.DB) error {
		now := time.Now()
		nomorJurnal := s.generateNomorJurnal("JGR", tanggalCair)

		bankAcc, err := s.bankAccountRepo.GetByID(tx.BankAccountID)
		if err != nil {
			return fmt.Errorf("rekening bank tujuan tidak ditemukan: %w", err)
		}

		ket := fmt.Sprintf("Pencairan Giro: %s - %s", tx.NomorGiro, tx.NamaPenerbit)

		var journalDetails []model.JournalDetail
		if tx.JenisGiro == "masuk" {
			// Giro Masuk Cair: Debit Rekening Bank, Kredit Akun Giro (Warkat/Giro Belum Disetor)
			journalDetails = append(journalDetails, model.JournalDetail{
				DaftarAkunID: bankAcc.DaftarAkunID,
				JumlahDebit:  tx.Jumlah,
				JumlahKredit: decimal.Zero,
				Keterangan:   ket,
			})
			journalDetails = append(journalDetails, model.JournalDetail{
				DaftarAkunID: tx.DaftarAkunGiroID,
				JumlahDebit:  decimal.Zero,
				JumlahKredit: tx.Jumlah,
				Keterangan:   ket,
			})
		} else {
			// Giro Keluar Cair: Debit Akun Hutang Giro, Kredit Rekening Bank
			journalDetails = append(journalDetails, model.JournalDetail{
				DaftarAkunID: tx.DaftarAkunGiroID,
				JumlahDebit:  tx.Jumlah,
				JumlahKredit: decimal.Zero,
				Keterangan:   ket,
			})
			journalDetails = append(journalDetails, model.JournalDetail{
				DaftarAkunID: bankAcc.DaftarAkunID,
				JumlahDebit:  decimal.Zero,
				JumlahKredit: tx.Jumlah,
				Keterangan:   ket,
			})
		}

		jurnalHeader := model.Journal{
			NomorJurnal:      nomorJurnal,
			TanggalTransaksi: tanggalCair,
			JenisReferensi:   "giro",
			NomorReferensi:   tx.NomorGiro,
			JenisJurnal:      model.JenisJurnalUmum,
			Keterangan:       ket,
			TotalDebit:       tx.Jumlah,
			TotalKredit:      tx.Jumlah,
			Status:           model.StatusPosted,
			DibuatOleh:       userID,
			DipostingOleh:    &userID,
			TanggalPosting:   &now,
			Details:          journalDetails,
		}

		if err := db.Create(&jurnalHeader).Error; err != nil {
			return err
		}

		tx.StatusGiro = "cair"
		tx.TanggalCair = &tanggalCair
		tx.JurnalCairID = &jurnalHeader.ID
		if err := db.Save(tx).Error; err != nil {
			return err
		}

		// Update Saldo Rekening Bank (+ untuk giro masuk, - untuk giro keluar)
		delta, _ := tx.Jumlah.Float64()
		if tx.JenisGiro == "keluar" {
			delta = -delta
		}
		if err := s.bankAccountRepo.UpdateSaldoBerjalan(bankAcc.ID, delta); err != nil {
			return err
		}

		journal = &jurnalHeader
		return nil
	})

	return journal, err
}

func (s *cashBankService) BounceGiro(id uint, alasan string) error {
	tx, err := s.giroTransactionRepo.GetByID(id)
	if err != nil {
		return err
	}
	if tx.StatusGiro == "cair" {
		return errors.New("giro sudah dicairkan dan tidak dapat ditolak")
	}
	tx.StatusGiro = "tolak"
	if alasan != "" {
		tx.PostingNotes = alasan
	}
	return s.giroTransactionRepo.Update(tx)
}

func (s *cashBankService) PostGiroToJournal(id uint, userID uint, details []CustomJournalDetailRequest) (*model.Journal, error) {
	tx, err := s.giroTransactionRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if tx.Status != "draft" {
		return nil, errors.New("transaksi giro sudah diposting sebelumnya")
	}

	var journal *model.Journal
	err = s.db.Transaction(func(db *gorm.DB) error {
		now := time.Now()
		nomorJurnal := s.generateNomorJurnal("JGR", tx.TanggalTerima)

		ket := fmt.Sprintf("Penerimaan/Penerbitan Giro: %s - %s", tx.NomorGiro, tx.NamaPenerbit)

		var journalDetails []model.JournalDetail
		if len(details) >= 2 {
			for _, d := range details {
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: d.DaftarAkunID,
					JumlahDebit:  d.JumlahDebit,
					JumlahKredit: d.JumlahKredit,
					Keterangan:   d.Keterangan,
				})
			}
		} else {
			if tx.DaftarAkunLawanID == nil {
				return errors.New("rekening lawan wajib diisi untuk posting giro")
			}

			if tx.JenisGiro == "masuk" {
				// Debit Akun Giro di Tangan, Kredit Piutang/Pendapatan Lawan
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: tx.DaftarAkunGiroID,
					JumlahDebit:  tx.Jumlah,
					JumlahKredit: decimal.Zero,
					Keterangan:   ket,
				})
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: *tx.DaftarAkunLawanID,
					JumlahDebit:  decimal.Zero,
					JumlahKredit: tx.Jumlah,
					Keterangan:   ket,
				})
			} else {
				// Debit Beban/Hutang Lawan, Kredit Akun Hutang Giro
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: *tx.DaftarAkunLawanID,
					JumlahDebit:  tx.Jumlah,
					JumlahKredit: decimal.Zero,
					Keterangan:   ket,
				})
				journalDetails = append(journalDetails, model.JournalDetail{
					DaftarAkunID: tx.DaftarAkunGiroID,
					JumlahDebit:  decimal.Zero,
					JumlahKredit: tx.Jumlah,
					Keterangan:   ket,
				})
			}
		}

		jurnalHeader := model.Journal{
			NomorJurnal:      nomorJurnal,
			TanggalTransaksi: tx.TanggalTerima,
			JenisReferensi:   "giro",
			NomorReferensi:   tx.NomorGiro,
			JenisJurnal:      model.JenisJurnalUmum,
			Keterangan:       ket,
			TotalDebit:       tx.Jumlah,
			TotalKredit:      tx.Jumlah,
			Status:           model.StatusPosted,
			DibuatOleh:       userID,
			DipostingOleh:    &userID,
			TanggalPosting:   &now,
			Details:          journalDetails,
		}

		if err := db.Create(&jurnalHeader).Error; err != nil {
			return err
		}

		tx.Status = "posted"
		tx.JurnalTerimaID = &jurnalHeader.ID
		tx.PostedAt = &now
		tx.PostedBy = &userID
		if err := db.Save(tx).Error; err != nil {
			return err
		}

		journal = &jurnalHeader
		return nil
	})

	return journal, err
}

func (s *cashBankService) GetGiroReport(from, to time.Time, bankAccountID *uint) (map[string]interface{}, error) {
	type summaryItem struct {
		JenisGiro   string          `json:"jenis_giro"`
		StatusGiro  string          `json:"status_giro"`
		TotalJumlah decimal.Decimal `json:"total_jumlah"`
		Count       int64           `json:"count"`
	}

	var stats []summaryItem
	query := s.db.Model(&model.GiroTransaction{}).
		Select("jenis_giro, status_giro, COALESCE(SUM(jumlah), 0) as total_jumlah, COUNT(*) as count").
		Where("tanggal_terima BETWEEN ? AND ?", from, to)

	if bankAccountID != nil && *bankAccountID > 0 {
		query = query.Where("bank_account_id = ?", *bankAccountID)
	}

	if err := query.Group("jenis_giro, status_giro").Scan(&stats).Error; err != nil {
		return nil, err
	}

	reportData, err := s.giroTransactionRepo.GetReportSummary(from, to, bankAccountID)
	if err != nil {
		return nil, err
	}
	reportData["statistics"] = stats
	reportData["periode_dari"] = from.Format("2006-01-02")
	reportData["periode_sampai"] = to.Format("2006-01-02")

	return reportData, nil
}
