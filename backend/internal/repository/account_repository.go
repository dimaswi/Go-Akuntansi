package repository

import (
	"backend/internal/model"

	"gorm.io/gorm"
)

type AccountRepository interface {
	GetAll(jenis model.JenisAkun, isAktif *bool) ([]model.ChartOfAccount, error)
	GetByID(id uint) (*model.ChartOfAccount, error)
	GetByKode(kode string) (*model.ChartOfAccount, error)
	Create(account *model.ChartOfAccount) error
	Update(account *model.ChartOfAccount) error
	Delete(id uint) error
	GetTree() ([]model.ChartOfAccount, error)
}

type accountRepository struct {
	db *gorm.DB
}

func NewAccountRepository(db *gorm.DB) AccountRepository {
	return &accountRepository{db: db}
}

func (r *accountRepository) GetAll(jenis model.JenisAkun, isAktif *bool) ([]model.ChartOfAccount, error) {
	var accounts []model.ChartOfAccount
	query := r.db.Model(&model.ChartOfAccount{}).Preload("IndukAkun")

	if jenis != "" {
		query = query.Where("jenis_akun = ?", jenis)
	}
	if isAktif != nil {
		query = query.Where("is_aktif = ?", *isAktif)
	}

	err := query.Order("kode_akun asc").Find(&accounts).Error
	return accounts, err
}

func (r *accountRepository) GetByID(id uint) (*model.ChartOfAccount, error) {
	var account model.ChartOfAccount
	err := r.db.Preload("IndukAkun").Preload("SubAkun").First(&account, id).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) GetByKode(kode string) (*model.ChartOfAccount, error) {
	var account model.ChartOfAccount
	err := r.db.Where("kode_akun = ?", kode).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) Create(account *model.ChartOfAccount) error {
	return r.db.Create(account).Error
}

func (r *accountRepository) Update(account *model.ChartOfAccount) error {
	return r.db.Save(account).Error
}

func (r *accountRepository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&model.ChartOfAccount{}, id).Error
}

func (r *accountRepository) GetTree() ([]model.ChartOfAccount, error) {
	var rootAccounts []model.ChartOfAccount
	err := r.db.Where("induk_akun_id IS NULL").
		Preload("SubAkun", func(db *gorm.DB) *gorm.DB {
			return db.Order("kode_akun asc")
		}).
		Order("kode_akun asc").
		Find(&rootAccounts).Error
	return rootAccounts, err
}
