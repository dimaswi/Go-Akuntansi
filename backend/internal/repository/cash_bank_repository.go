package repository

import (
	"fmt"
	"time"

	"backend/internal/model"

	"gorm.io/gorm"
)

// BankAccountRepository
type BankAccountRepository interface {
	GetAll(search string, isAktif *bool) ([]model.BankAccount, error)
	GetPaginated(page, perPage int, search string, isAktif *bool) ([]model.BankAccount, int64, error)
	GetByID(id uint) (*model.BankAccount, error)
	GetByKode(kode string) (*model.BankAccount, error)
	Create(account *model.BankAccount) error
	Update(account *model.BankAccount) error
	Delete(id uint) error
	UpdateSaldoBerjalan(id uint, delta float64) error
}

type bankAccountRepo struct {
	db *gorm.DB
}

func NewBankAccountRepository(db *gorm.DB) BankAccountRepository {
	return &bankAccountRepo{db: db}
}

func (r *bankAccountRepo) GetAll(search string, isAktif *bool) ([]model.BankAccount, error) {
	var list []model.BankAccount
	query := r.db.Preload("DaftarAkun").Order("nama_bank asc, nama_rekening asc")
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("nama_bank ILIKE ? OR nama_rekening ILIKE ? OR nomor_rekening ILIKE ? OR kode_rekening ILIKE ?", like, like, like, like)
	}
	if isAktif != nil {
		query = query.Where("is_aktif = ?", *isAktif)
	}
	err := query.Find(&list).Error
	return list, err
}

func (r *bankAccountRepo) GetPaginated(page, perPage int, search string, isAktif *bool) ([]model.BankAccount, int64, error) {
	var list []model.BankAccount
	var total int64
	query := r.db.Model(&model.BankAccount{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("nama_bank ILIKE ? OR nama_rekening ILIKE ? OR nomor_rekening ILIKE ? OR kode_rekening ILIKE ?", like, like, like, like)
	}
	if isAktif != nil {
		query = query.Where("is_aktif = ?", *isAktif)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("DaftarAkun").
		Order("nama_bank asc, nama_rekening asc").
		Offset(offset).
		Limit(perPage).
		Find(&list).Error

	return list, total, err
}

func (r *bankAccountRepo) GetByID(id uint) (*model.BankAccount, error) {
	var acc model.BankAccount
	err := r.db.Preload("DaftarAkun").First(&acc, id).Error
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *bankAccountRepo) GetByKode(kode string) (*model.BankAccount, error) {
	var acc model.BankAccount
	err := r.db.Preload("DaftarAkun").Where("kode_rekening = ?", kode).First(&acc).Error
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *bankAccountRepo) Create(account *model.BankAccount) error {
	return r.db.Create(account).Error
}

func (r *bankAccountRepo) Update(account *model.BankAccount) error {
	return r.db.Save(account).Error
}

func (r *bankAccountRepo) Delete(id uint) error {
	return r.db.Delete(&model.BankAccount{}, id).Error
}

func (r *bankAccountRepo) UpdateSaldoBerjalan(id uint, delta float64) error {
	return r.db.Model(&model.BankAccount{}).Where("id = ?", id).
		Update("saldo_berjalan", gorm.Expr("saldo_berjalan + ?", delta)).Error
}

// CashTransactionRepository
type CashTransactionRepository interface {
	GetPaginated(page, perPage int, search, jenis, status string, from, to *time.Time) ([]model.CashTransaction, int64, error)
	GetByID(id uint) (*model.CashTransaction, error)
	Create(tx *model.CashTransaction) error
	Update(tx *model.CashTransaction) error
	Delete(id uint) error
	GetLastNumber(prefix, yearMonth string) (string, error)
}

type cashTransactionRepo struct {
	db *gorm.DB
}

func NewCashTransactionRepository(db *gorm.DB) CashTransactionRepository {
	return &cashTransactionRepo{db: db}
}

func (r *cashTransactionRepo) GetPaginated(page, perPage int, search, jenis, status string, from, to *time.Time) ([]model.CashTransaction, int64, error) {
	var list []model.CashTransaction
	var total int64
	query := r.db.Model(&model.CashTransaction{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("nomor_transaksi ILIKE ? OR keterangan ILIKE ? OR pihak_terkait ILIKE ? OR referensi ILIKE ?", like, like, like, like)
	}
	if jenis != "" && jenis != "all" {
		query = query.Where("jenis_transaksi = ?", jenis)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if from != nil {
		query = query.Where("tanggal_transaksi >= ?", *from)
	}
	if to != nil {
		query = query.Where("tanggal_transaksi <= ?", *to)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("DaftarAkunKas").
		Preload("DaftarAkunLawan").
		Preload("User").
		Preload("Poster").
		Preload("Jurnal").
		Order("tanggal_transaksi desc, created_at desc").
		Offset(offset).
		Limit(perPage).
		Find(&list).Error

	return list, total, err
}

func (r *cashTransactionRepo) GetByID(id uint) (*model.CashTransaction, error) {
	var tx model.CashTransaction
	err := r.db.Preload("DaftarAkunKas").
		Preload("DaftarAkunLawan").
		Preload("User").
		Preload("Poster").
		Preload("Jurnal.Details.DaftarAkun").
		First(&tx, id).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *cashTransactionRepo) Create(tx *model.CashTransaction) error {
	return r.db.Create(tx).Error
}

func (r *cashTransactionRepo) Update(tx *model.CashTransaction) error {
	return r.db.Save(tx).Error
}

func (r *cashTransactionRepo) Delete(id uint) error {
	return r.db.Delete(&model.CashTransaction{}, id).Error
}

func (r *cashTransactionRepo) GetLastNumber(prefix, yearMonth string) (string, error) {
	var tx model.CashTransaction
	pattern := fmt.Sprintf("%s/%s/%%", prefix, yearMonth)
	err := r.db.Where("nomor_transaksi LIKE ?", pattern).
		Order("nomor_transaksi desc").
		First(&tx).Error
	if err != nil {
		return "", err
	}
	return tx.NomorTransaksi, nil
}

// BankTransactionRepository
type BankTransactionRepository interface {
	GetPaginated(page, perPage int, search, jenis, status string, bankAccountID *uint, from, to *time.Time) ([]model.BankTransaction, int64, error)
	GetByID(id uint) (*model.BankTransaction, error)
	Create(tx *model.BankTransaction) error
	Update(tx *model.BankTransaction) error
	Delete(id uint) error
	GetLastNumber(prefix, yearMonth string) (string, error)
}

type bankTransactionRepo struct {
	db *gorm.DB
}

func NewBankTransactionRepository(db *gorm.DB) BankTransactionRepository {
	return &bankTransactionRepo{db: db}
}

func (r *bankTransactionRepo) GetPaginated(page, perPage int, search, jenis, status string, bankAccountID *uint, from, to *time.Time) ([]model.BankTransaction, int64, error) {
	var list []model.BankTransaction
	var total int64
	query := r.db.Model(&model.BankTransaction{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("nomor_transaksi ILIKE ? OR keterangan ILIKE ? OR pihak_terkait ILIKE ? OR nomor_referensi ILIKE ?", like, like, like, like)
	}
	if jenis != "" && jenis != "all" {
		query = query.Where("jenis_transaksi = ?", jenis)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if bankAccountID != nil && *bankAccountID > 0 {
		query = query.Where("bank_account_id = ?", *bankAccountID)
	}
	if from != nil {
		query = query.Where("tanggal_transaksi >= ?", *from)
	}
	if to != nil {
		query = query.Where("tanggal_transaksi <= ?", *to)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("BankAccount.DaftarAkun").
		Preload("DaftarAkunLawan").
		Preload("User").
		Preload("Poster").
		Preload("Jurnal").
		Order("tanggal_transaksi desc, created_at desc").
		Offset(offset).
		Limit(perPage).
		Find(&list).Error

	return list, total, err
}

func (r *bankTransactionRepo) GetByID(id uint) (*model.BankTransaction, error) {
	var tx model.BankTransaction
	err := r.db.Preload("BankAccount.DaftarAkun").
		Preload("DaftarAkunLawan").
		Preload("User").
		Preload("Poster").
		Preload("Jurnal.Details.DaftarAkun").
		First(&tx, id).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *bankTransactionRepo) Create(tx *model.BankTransaction) error {
	return r.db.Create(tx).Error
}

func (r *bankTransactionRepo) Update(tx *model.BankTransaction) error {
	return r.db.Save(tx).Error
}

func (r *bankTransactionRepo) Delete(id uint) error {
	return r.db.Delete(&model.BankTransaction{}, id).Error
}

func (r *bankTransactionRepo) GetLastNumber(prefix, yearMonth string) (string, error) {
	var tx model.BankTransaction
	pattern := fmt.Sprintf("%s/%s/%%", prefix, yearMonth)
	err := r.db.Where("nomor_transaksi LIKE ?", pattern).
		Order("nomor_transaksi desc").
		First(&tx).Error
	if err != nil {
		return "", err
	}
	return tx.NomorTransaksi, nil
}

// GiroTransactionRepository
type GiroTransactionRepository interface {
	GetPaginated(page, perPage int, search, jenisGiro, statusGiro, status string, bankAccountID *uint, from, to *time.Time) ([]model.GiroTransaction, int64, error)
	GetByID(id uint) (*model.GiroTransaction, error)
	Create(tx *model.GiroTransaction) error
	Update(tx *model.GiroTransaction) error
	Delete(id uint) error
	GetReportSummary(from, to time.Time, bankAccountID *uint) (map[string]interface{}, error)
}

type giroTransactionRepo struct {
	db *gorm.DB
}

func NewGiroTransactionRepository(db *gorm.DB) GiroTransactionRepository {
	return &giroTransactionRepo{db: db}
}

func (r *giroTransactionRepo) GetPaginated(page, perPage int, search, jenisGiro, statusGiro, status string, bankAccountID *uint, from, to *time.Time) ([]model.GiroTransaction, int64, error) {
	var list []model.GiroTransaction
	var total int64
	query := r.db.Model(&model.GiroTransaction{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("nomor_giro ILIKE ? OR keterangan ILIKE ? OR nama_penerbit ILIKE ? OR bank_penerbit ILIKE ? OR nomor_referensi ILIKE ?", like, like, like, like, like)
	}
	if jenisGiro != "" && jenisGiro != "all" {
		query = query.Where("jenis_giro = ?", jenisGiro)
	}
	if statusGiro != "" && statusGiro != "all" {
		query = query.Where("status_giro = ?", statusGiro)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if bankAccountID != nil && *bankAccountID > 0 {
		query = query.Where("bank_account_id = ?", *bankAccountID)
	}
	if from != nil {
		query = query.Where("tanggal_terima >= ?", *from)
	}
	if to != nil {
		query = query.Where("tanggal_terima <= ?", *to)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("BankAccount.DaftarAkun").
		Preload("DaftarAkunGiro").
		Preload("DaftarAkunLawan").
		Preload("User").
		Preload("Poster").
		Preload("JurnalTerima").
		Preload("JurnalCair").
		Order("tanggal_terima desc, created_at desc").
		Offset(offset).
		Limit(perPage).
		Find(&list).Error

	return list, total, err
}

func (r *giroTransactionRepo) GetByID(id uint) (*model.GiroTransaction, error) {
	var tx model.GiroTransaction
	err := r.db.Preload("BankAccount.DaftarAkun").
		Preload("DaftarAkunGiro").
		Preload("DaftarAkunLawan").
		Preload("User").
		Preload("Poster").
		Preload("JurnalTerima.Details.DaftarAkun").
		Preload("JurnalCair.Details.DaftarAkun").
		First(&tx, id).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *giroTransactionRepo) Create(tx *model.GiroTransaction) error {
	return r.db.Create(tx).Error
}

func (r *giroTransactionRepo) Update(tx *model.GiroTransaction) error {
	return r.db.Save(tx).Error
}

func (r *giroTransactionRepo) Delete(id uint) error {
	return r.db.Delete(&model.GiroTransaction{}, id).Error
}

func (r *giroTransactionRepo) GetReportSummary(from, to time.Time, bankAccountID *uint) (map[string]interface{}, error) {
	var list []model.GiroTransaction
	query := r.db.Preload("BankAccount").
		Preload("DaftarAkunGiro").
		Preload("DaftarAkunLawan").
		Where("tanggal_terima BETWEEN ? AND ?", from, to)

	if bankAccountID != nil && *bankAccountID > 0 {
		query = query.Where("bank_account_id = ?", *bankAccountID)
	}

	if err := query.Order("tanggal_jatuh_tempo asc").Find(&list).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"items": list,
	}, nil
}

