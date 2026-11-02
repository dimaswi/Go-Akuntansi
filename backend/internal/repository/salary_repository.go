package repository

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"backend/internal/model"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type SalaryRepository interface {
	GetBatches(search, status, year, month string) ([]model.SalaryBatch, SalarySummary, error)
	GetBatchByID(id uint) (*model.SalaryBatch, error)
	CreateBatch(batch *model.SalaryBatch) error
	UpdateBatch(id uint, description string) error
	DeleteBatch(id uint) error
	GetUsersWithNIP() ([]model.User, error)
	SaveSalaryDetails(batchID uint, details []model.SalaryDetail) error
	GetJournalPreview(batchIDs []uint) ([]JournalPreviewEntry, error)
	PostToJournal(batchIDs []uint, detailJurnals []PostJournalDetail, userID uint) (*model.Journal, error)
	GetPersonalSalarySlips(userID uint, userNIP, year, month string) ([]model.SalaryDetail, PersonalSalarySummary, error)
	GetSalaryDetailByID(id uint) (*model.SalaryDetail, error)
}

type SalarySummary struct {
	TotalDraft            int64           `json:"total_draft"`
	TotalDone             int64           `json:"total_done"`
	TotalPosted           int64           `json:"total_posted"`
	TotalEmployeesAll     int64           `json:"total_employees_all"`
	TotalGajiBersihPosted decimal.Decimal `json:"total_gaji_bersih_posted"`
}

type PersonalSalarySummary struct {
	TotalSlips      int64           `json:"total_slips"`
	TotalGajiBersih decimal.Decimal `json:"total_gaji_bersih"`
	LatestPeriod    string          `json:"latest_period"`
}

type JournalPreviewEntry struct {
	AccountName string          `json:"account_name"`
	Type        string          `json:"type"` // "debit" | "credit"
	Amount      decimal.Decimal `json:"amount"`
}

type PostJournalDetail struct {
	DaftarAkunID uint            `json:"daftar_akun_id"`
	Keterangan   string          `json:"keterangan"`
	JumlahDebit  decimal.Decimal `json:"jumlah_debit"`
	JumlahKredit decimal.Decimal `json:"jumlah_kredit"`
}

type salaryRepository struct {
	db *gorm.DB
}

func NewSalaryRepository(db *gorm.DB) SalaryRepository {
	return &salaryRepository{db: db}
}

func (r *salaryRepository) GetBatches(search, status, year, month string) ([]model.SalaryBatch, SalarySummary, error) {
	var batches []model.SalaryBatch
	query := r.db.Model(&model.SalaryBatch{}).
		Preload("Creator").
		Preload("Journal").
		Preload("PaymentAccount")

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("batch_number ILIKE ? OR description ILIKE ?", s, s)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if year != "" {
		if y, err := strconv.Atoi(year); err == nil && y > 0 {
			query = query.Where("period_year = ?", y)
		}
	}

	if month != "" {
		if m, err := strconv.Atoi(month); err == nil && m > 0 {
			query = query.Where("period_month = ?", m)
		}
	}

	err := query.Order("period_year DESC, period_month DESC, id DESC").Find(&batches).Error
	if err != nil {
		return nil, SalarySummary{}, err
	}

	// Calculate summary
	var summary SalarySummary
	r.db.Model(&model.SalaryBatch{}).Where("status = ?", "draft").Count(&summary.TotalDraft)
	r.db.Model(&model.SalaryBatch{}).Where("status = ?", "done").Count(&summary.TotalDone)
	r.db.Model(&model.SalaryBatch{}).Where("status = ?", "posted").Count(&summary.TotalPosted)

	var sumEmployees struct {
		Total int64
	}
	r.db.Model(&model.SalaryBatch{}).Where("status = ?", "posted").Select("COALESCE(SUM(total_employees), 0) as total").Scan(&sumEmployees)
	summary.TotalEmployeesAll = sumEmployees.Total

	var sumGaji struct {
		Total decimal.Decimal
	}
	r.db.Model(&model.SalaryBatch{}).Where("status = ?", "posted").Select("COALESCE(SUM(total_gaji_bersih), 0) as total").Scan(&sumGaji)
	summary.TotalGajiBersihPosted = sumGaji.Total

	return batches, summary, nil
}

func (r *salaryRepository) GetBatchByID(id uint) (*model.SalaryBatch, error) {
	var batch model.SalaryBatch
	err := r.db.Preload("Creator").
		Preload("Journal").
		Preload("PaymentAccount").
		Preload("Details", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("nama_pegawai ASC, id ASC")
		}).
		First(&batch, id).Error
	if err != nil {
		return nil, err
	}
	return &batch, nil
}

func (r *salaryRepository) generateBatchNumber(year, month int) string {
	prefix := fmt.Sprintf("SALARY-%04d-%02d-", year, month)
	var lastBatch model.SalaryBatch
	err := r.db.Unscoped().Where("batch_number LIKE ?", prefix+"%").
		Order("batch_number DESC").
		First(&lastBatch).Error

	newNum := 1
	if err == nil && len(lastBatch.BatchNumber) >= 3 {
		suffix := lastBatch.BatchNumber[len(lastBatch.BatchNumber)-3:]
		if val, err := strconv.Atoi(suffix); err == nil {
			newNum = val + 1
		}
	}

	for {
		candidate := fmt.Sprintf("%s%03d", prefix, newNum)
		var cnt int64
		r.db.Unscoped().Model(&model.SalaryBatch{}).Where("batch_number = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate
		}
		newNum++
	}
}

func (r *salaryRepository) CreateBatch(batch *model.SalaryBatch) error {
	// Check if batch already exists for period
	var cnt int64
	r.db.Model(&model.SalaryBatch{}).
		Where("period_month = ? AND period_year = ?", batch.PeriodMonth, batch.PeriodYear).
		Count(&cnt)
	if cnt > 0 {
		return errors.New("Batch gaji untuk periode ini sudah ada.")
	}

	batch.BatchNumber = r.generateBatchNumber(batch.PeriodYear, batch.PeriodMonth)
	batch.Status = model.SalaryBatchStatusDraft
	return r.db.Create(batch).Error
}

func (r *salaryRepository) UpdateBatch(id uint, description string) error {
	var batch model.SalaryBatch
	if err := r.db.First(&batch, id).Error; err != nil {
		return err
	}
	if batch.Status == model.SalaryBatchStatusPosted {
		return errors.New("Batch yang sudah diposting tidak dapat diedit.")
	}
	return r.db.Model(&batch).Update("description", description).Error
}

func (r *salaryRepository) DeleteBatch(id uint) error {
	var batch model.SalaryBatch
	if err := r.db.First(&batch, id).Error; err != nil {
		return err
	}
	if batch.Status == model.SalaryBatchStatusPosted {
		return errors.New("Batch yang sudah diposting tidak dapat dihapus.")
	}

	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("salary_batch_id = ?", id).Delete(&model.SalaryDetail{}).Error; err != nil {
			return err
		}
		return tx.Delete(&batch).Error
	})
}

func (r *salaryRepository) GetUsersWithNIP() ([]model.User, error) {
	var users []model.User
	err := r.db.Where("nip IS NOT NULL AND nip <> ''").
		Order("name ASC").
		Find(&users).Error
	return users, err
}

func (r *salaryRepository) SaveSalaryDetails(batchID uint, details []model.SalaryDetail) error {
	var batch model.SalaryBatch
	if err := r.db.First(&batch, batchID).Error; err != nil {
		return err
	}
	if batch.Status == model.SalaryBatchStatusPosted {
		return errors.New("Batch yang sudah diposting tidak dapat diedit.")
	}

	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Delete existing details
		if err := tx.Where("salary_batch_id = ?", batchID).Delete(&model.SalaryDetail{}).Error; err != nil {
			return err
		}

		// 2. Prepare new details with calculated totals
		totalEmployees := len(details)
		totalPendapatan := decimal.Zero
		totalPotongan := decimal.Zero
		totalGajiBersih := decimal.Zero

		for i := range details {
			details[i].SalaryBatchID = batchID
			details[i].CalculateTotals()

			totalPendapatan = totalPendapatan.Add(details[i].TotalPendapatan)
			totalPotongan = totalPotongan.Add(details[i].TotalPotongan)
			totalGajiBersih = totalGajiBersih.Add(details[i].GajiBersih)
		}

		if len(details) > 0 {
			if err := tx.CreateInBatches(details, 100).Error; err != nil {
				return err
			}
		}

		newStatus := model.SalaryBatchStatusDone
		if totalEmployees == 0 {
			newStatus = model.SalaryBatchStatusDraft
		}

		// 3. Update batch totals and status
		return tx.Model(&batch).Updates(map[string]interface{}{
			"total_employees":   totalEmployees,
			"total_pendapatan":  totalPendapatan,
			"total_potongan":    totalPotongan,
			"total_gaji_bersih": totalGajiBersih,
			"status":            newStatus,
		}).Error
	})
}

func (r *salaryRepository) GetJournalPreview(batchIDs []uint) ([]JournalPreviewEntry, error) {
	var details []model.SalaryDetail
	err := r.db.Where("salary_batch_id IN (?)", batchIDs).Find(&details).Error
	if err != nil {
		return nil, err
	}

	var sumGajiPokok, sumSIA, sumTransport, sumJabatan, sumJagaUtama, sumJagaPratama decimal.Decimal
	var sumJaspelPratama, sumJaspelRanap, sumJaspelRalan, sumJaspelRalanBPJS, sumTugasTambahan decimal.Decimal
	var sumPph21, sumInfaq, sumBPJSKes, sumBPJSTk, sumDendaAbsen, sumArisan, sumDendaNgaji, sumKasbon decimal.Decimal
	var sumGajiBersih decimal.Decimal

	for _, d := range details {
		sumGajiPokok = sumGajiPokok.Add(d.GajiPokok)
		sumSIA = sumSIA.Add(d.TunjanganSIA)
		sumTransport = sumTransport.Add(d.TunjanganTransportasi)
		sumJabatan = sumJabatan.Add(d.TunjanganJabatan)
		sumJagaUtama = sumJagaUtama.Add(d.UangJagaUtama)
		sumJagaPratama = sumJagaPratama.Add(d.UangJagaPratama)
		sumJaspelPratama = sumJaspelPratama.Add(d.JasaPelayananPratama)
		sumJaspelRanap = sumJaspelRanap.Add(d.JasaPelayananRawatInap)
		sumJaspelRalan = sumJaspelRalan.Add(d.JasaPelayananRawatJalan)
		sumJaspelRalanBPJS = sumJaspelRalanBPJS.Add(d.JasaPelayananRawatJalanBPJS)
		sumTugasTambahan = sumTugasTambahan.Add(d.TugasTambahan)

		sumPph21 = sumPph21.Add(d.PPh21)
		sumInfaq = sumInfaq.Add(d.Infaq)
		sumBPJSKes = sumBPJSKes.Add(d.BPJSKesehatan)
		sumBPJSTk = sumBPJSTk.Add(d.BPJSKetenagakerjaan)
		sumDendaAbsen = sumDendaAbsen.Add(d.DendaAbsen)
		sumArisan = sumArisan.Add(d.ArisanKeluarga)
		sumDendaNgaji = sumDendaNgaji.Add(d.DendaNgaji)
		sumKasbon = sumKasbon.Add(d.Kasbon)

		sumGajiBersih = sumGajiBersih.Add(d.GajiBersih)
	}

	entries := []JournalPreviewEntry{}

	// Debits (Expenses)
	expenses := []struct {
		Name   string
		Amount decimal.Decimal
	}{
		{"Beban Gaji Pokok", sumGajiPokok},
		{"Beban Tunjangan SIA", sumSIA},
		{"Beban Tunjangan Transportasi", sumTransport},
		{"Beban Tunjangan Jabatan", sumJabatan},
		{"Beban Uang Jaga Utama", sumJagaUtama},
		{"Beban Uang Jaga Pratama", sumJagaPratama},
		{"Beban Jasa Pelayanan Pratama", sumJaspelPratama},
		{"Beban Jasa Pelayanan Rawat Inap", sumJaspelRanap},
		{"Beban Jasa Pelayanan Rawat Jalan", sumJaspelRalan},
		{"Beban Jasa Pelayanan Rawat Jalan BPJS", sumJaspelRalanBPJS},
		{"Beban Tugas Tambahan", sumTugasTambahan},
	}

	for _, exp := range expenses {
		if exp.Amount.GreaterThan(decimal.Zero) {
			entries = append(entries, JournalPreviewEntry{
				AccountName: exp.Name,
				Type:        "debit",
				Amount:      exp.Amount,
			})
		}
	}

	// Credits (Liabilities & Deductions)
	if sumGajiBersih.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Hutang Gaji Karyawan",
			Type:        "credit",
			Amount:      sumGajiBersih,
		})
	}
	if sumPph21.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Hutang PPh 21",
			Type:        "credit",
			Amount:      sumPph21,
		})
	}
	if sumInfaq.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Hutang Infaq",
			Type:        "credit",
			Amount:      sumInfaq,
		})
	}
	if sumBPJSKes.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Hutang BPJS Kesehatan",
			Type:        "credit",
			Amount:      sumBPJSKes,
		})
	}
	if sumBPJSTk.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Hutang BPJS Ketenagakerjaan",
			Type:        "credit",
			Amount:      sumBPJSTk,
		})
	}
	if sumKasbon.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Piutang Kasbon Karyawan",
			Type:        "credit",
			Amount:      sumKasbon,
		})
	}

	totalDenda := sumDendaAbsen.Add(sumDendaNgaji)
	if totalDenda.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Kas - Pendapatan Denda",
			Type:        "credit",
			Amount:      totalDenda,
		})
	}

	if sumArisan.GreaterThan(decimal.Zero) {
		entries = append(entries, JournalPreviewEntry{
			AccountName: "Kas - Arisan Keluarga",
			Type:        "credit",
			Amount:      sumArisan,
		})
	}

	return entries, nil
}

func (r *salaryRepository) generateNomorJurnal(tgl time.Time) string {
	prefix := "JGA" // Jurnal Gaji
	tahun := tgl.Format("2006")
	bulan := tgl.Format("01")
	pattern := fmt.Sprintf("%s/%s/%s/", prefix, tahun, bulan)

	var lastJurnal model.Journal
	err := r.db.Unscoped().Where("nomor_jurnal LIKE ?", pattern+"%").
		Order("LENGTH(nomor_jurnal) desc, nomor_jurnal desc").
		First(&lastJurnal).Error

	newNum := 1
	if err == nil && len(lastJurnal.NomorJurnal) >= 4 {
		suffix := lastJurnal.NomorJurnal[len(lastJurnal.NomorJurnal)-4:]
		if val, err := strconv.Atoi(suffix); err == nil {
			newNum = val + 1
		}
	}

	for {
		candidate := fmt.Sprintf("%s%04d", pattern, newNum)
		var cnt int64
		r.db.Unscoped().Model(&model.Journal{}).Where("nomor_jurnal = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate
		}
		newNum++
	}
}

func (r *salaryRepository) PostToJournal(batchIDs []uint, detailJurnals []PostJournalDetail, userID uint) (*model.Journal, error) {
	if len(batchIDs) == 0 {
		return nil, errors.New("Pilih minimal 1 batch untuk diposting.")
	}
	if len(detailJurnals) < 2 {
		return nil, errors.New("Detail jurnal harus memiliki minimal 2 baris (debit dan kredit).")
	}

	var batches []model.SalaryBatch
	err := r.db.Where("id IN (?) AND status IN (?)", batchIDs, []string{string(model.SalaryBatchStatusDraft), string(model.SalaryBatchStatusDone)}).Find(&batches).Error
	if err != nil || len(batches) == 0 {
		return nil, errors.New("Tidak ada batch draft/done yang valid untuk diposting.")
	}

	// Validate balance
	totalDebit := decimal.Zero
	totalKredit := decimal.Zero
	for _, dj := range detailJurnals {
		totalDebit = totalDebit.Add(dj.JumlahDebit)
		totalKredit = totalKredit.Add(dj.JumlahKredit)
	}

	if !totalDebit.Equal(totalKredit) {
		return nil, fmt.Errorf("Total debit (%s) dan kredit (%s) harus balance.", totalDebit.StringFixed(2), totalKredit.StringFixed(2))
	}

	var createdJournal model.Journal

	err = r.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		nomorJurnal := r.generateNomorJurnal(now)

		batchNumbers := make([]string, len(batches))
		for i, b := range batches {
			batchNumbers[i] = b.BatchNumber
		}
		combinedBatch := strings.Join(batchNumbers, ", ")
		keteranganJurnal := fmt.Sprintf("Beban Gaji Karyawan - %s", combinedBatch)

		createdJournal = model.Journal{
			NomorJurnal:      nomorJurnal,
			TanggalTransaksi: now,
			JenisReferensi:   "penggajian",
			NomorReferensi:   combinedBatch,
			JenisJurnal:      model.JenisJurnalUmum,
			Keterangan:       keteranganJurnal,
			TotalDebit:       totalDebit,
			TotalKredit:      totalKredit,
			DibuatOleh:       userID,
			Status:           model.StatusPosted,
			DipostingOleh:    &userID,
			TanggalPosting:   &now,
		}

		if err := tx.Create(&createdJournal).Error; err != nil {
			return err
		}

		// Create journal details
		for _, dj := range detailJurnals {
			detail := model.JournalDetail{
				JurnalID:     createdJournal.ID,
				DaftarAkunID: dj.DaftarAkunID,
				Keterangan:   dj.Keterangan,
				JumlahDebit:  dj.JumlahDebit,
				JumlahKredit: dj.JumlahKredit,
			}
			if err := tx.Create(&detail).Error; err != nil {
				return err
			}
		}

		// Update batches
		if err := tx.Model(&model.SalaryBatch{}).
			Where("id IN (?)", batchIDs).
			Updates(map[string]interface{}{
				"status":     model.SalaryBatchStatusPosted,
				"journal_id": createdJournal.ID,
				"posted_by":  userID,
				"posted_at":  now,
			}).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &createdJournal, nil
}

func (r *salaryRepository) GetPersonalSalarySlips(userID uint, userNIP, year, month string) ([]model.SalaryDetail, PersonalSalarySummary, error) {
	if userID == 0 && userNIP == "" {
		return []model.SalaryDetail{}, PersonalSalarySummary{}, nil
	}

	var slips []model.SalaryDetail
	query := r.db.Model(&model.SalaryDetail{}).
		Preload("SalaryBatch")

	if userNIP != "" && userID > 0 {
		query = query.Where("user_id = ? OR nip = ?", userID, userNIP)
	} else if userID > 0 {
		query = query.Where("user_id = ?", userID)
	} else if userNIP != "" {
		query = query.Where("nip = ?", userNIP)
	}

	if year != "" || month != "" {
		query = query.Joins("JOIN salary_batches ON salary_batches.id = salary_details.salary_batch_id")
		if year != "" {
			if y, err := strconv.Atoi(year); err == nil {
				query = query.Where("salary_batches.period_year = ?", y)
			}
		}
		if month != "" {
			if m, err := strconv.Atoi(month); err == nil {
				query = query.Where("salary_batches.period_month = ?", m)
			}
		}
	}

	err := query.Order("id DESC").Find(&slips).Error
	if err != nil {
		return nil, PersonalSalarySummary{}, err
	}

	var summary PersonalSalarySummary
	summary.TotalSlips = int64(len(slips))
	for _, s := range slips {
		summary.TotalGajiBersih = summary.TotalGajiBersih.Add(s.GajiBersih)
	}
	if len(slips) > 0 && slips[0].SalaryBatch != nil {
		summary.LatestPeriod = slips[0].SalaryBatch.PeriodDisplay
	}

	return slips, summary, nil
}

func (r *salaryRepository) GetSalaryDetailByID(id uint) (*model.SalaryDetail, error) {
	var detail model.SalaryDetail
	err := r.db.Preload("SalaryBatch").First(&detail, id).Error
	if err != nil {
		return nil, err
	}
	return &detail, nil
}

