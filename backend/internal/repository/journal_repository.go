package repository

import (
	"strings"
	"time"

	"backend/internal/model"

	"gorm.io/gorm"
)

type JournalRepository interface {
	GetAll(status model.JournalStatus, jenis model.JenisJurnal, startDate, endDate *time.Time, search string, page, limit int) ([]model.Journal, int64, error)
	GetByID(id uint) (*model.Journal, error)
	CreateWithDetails(journal *model.Journal) error
	Update(journal *model.Journal) error
	UpdateWithDetails(journal *model.Journal) error
	Delete(id uint) error
	GetDetailsByAccount(accountID uint, startDate, endDate *time.Time) ([]model.JournalDetail, error)
	GetDB() *gorm.DB
}

type journalRepository struct {
	db *gorm.DB
}

func NewJournalRepository(db *gorm.DB) JournalRepository {
	return &journalRepository{db: db}
}

func (r *journalRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *journalRepository) GetAll(status model.JournalStatus, jenis model.JenisJurnal, startDate, endDate *time.Time, search string, page, limit int) ([]model.Journal, int64, error) {
	var journals []model.Journal
	var total int64

	query := r.db.Model(&model.Journal{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if jenis != "" {
		if strings.HasPrefix(string(jenis), "!") {
			// "!penyesuaian" = semua jenis kecuali penyesuaian
			query = query.Where("jenis_jurnal <> ? OR jenis_jurnal IS NULL", strings.TrimPrefix(string(jenis), "!"))
		} else {
			query = query.Where("jenis_jurnal = ?", jenis)
		}
	}
	if startDate != nil {
		query = query.Where("tanggal_transaksi >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("tanggal_transaksi <= ?", *endDate)
	}
	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(nomor_jurnal) LIKE ? OR LOWER(keterangan) LIKE ? OR LOWER(nomor_referensi) LIKE ?", s, s, s)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	// Daftar tidak membutuhkan detail baris/relasi user; hindari preload berat agar cepat.
	err := query.
		Order("tanggal_transaksi desc, id desc").
		Offset(offset).
		Limit(limit).
		Find(&journals).Error

	return journals, total, err
}

func (r *journalRepository) GetByID(id uint) (*model.Journal, error) {
	var journal model.Journal
	err := r.db.Preload("Details.DaftarAkun").
		Preload("Pembuat").
		Preload("Poster").
		First(&journal, id).Error
	if err != nil {
		return nil, err
	}
	return &journal, nil
}

func (r *journalRepository) CreateWithDetails(journal *model.Journal) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(journal).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *journalRepository) Update(journal *model.Journal) error {
	return r.db.Save(journal).Error
}

func (r *journalRepository) UpdateWithDetails(journal *model.Journal) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Hapus detail lama
		if err := tx.Where("jurnal_id = ?", journal.ID).Delete(&model.JournalDetail{}).Error; err != nil {
			return err
		}
		// Update header jurnal
		if err := tx.Save(journal).Error; err != nil {
			return err
		}
		// Buat detail baru
		for i := range journal.Details {
			journal.Details[i].ID = 0
			journal.Details[i].JurnalID = journal.ID
			if err := tx.Create(&journal.Details[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *journalRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("jurnal_id = ?", id).Delete(&model.JournalDetail{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&model.Journal{}, id).Error
	})
}

func (r *journalRepository) GetDetailsByAccount(accountID uint, startDate, endDate *time.Time) ([]model.JournalDetail, error) {
	var details []model.JournalDetail
	query := r.db.Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("detail_jurnal.daftar_akun_id = ? AND jurnal.status = ?", accountID, model.StatusPosted).
		Preload("DaftarAkun")

	if startDate != nil {
		query = query.Where("jurnal.tanggal_transaksi >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("jurnal.tanggal_transaksi <= ?", *endDate)
	}

	err := query.Order("jurnal.tanggal_transaksi asc, detail_jurnal.id asc").Find(&details).Error
	return details, err
}
