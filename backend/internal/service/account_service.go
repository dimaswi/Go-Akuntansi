package service

import (
	"errors"

	"backend/internal/model"
	"backend/internal/repository"
)

type AccountService interface {
	GetAll(jenis model.JenisAkun, isAktif *bool) ([]model.ChartOfAccount, error)
	GetByID(id uint) (*model.ChartOfAccount, error)
	Create(account *model.ChartOfAccount) error
	Update(id uint, account *model.ChartOfAccount) error
	Delete(id uint) error
	GetTree() ([]model.ChartOfAccount, error)
}

type accountService struct {
	repo repository.AccountRepository
}

func NewAccountService(repo repository.AccountRepository) AccountService {
	return &accountService{repo: repo}
}

func (s *accountService) GetAll(jenis model.JenisAkun, isAktif *bool) ([]model.ChartOfAccount, error) {
	return s.repo.GetAll(jenis, isAktif)
}

func (s *accountService) GetByID(id uint) (*model.ChartOfAccount, error) {
	return s.repo.GetByID(id)
}

func (s *accountService) Create(account *model.ChartOfAccount) error {
	existing, _ := s.repo.GetByKode(account.KodeAkun)
	if existing != nil {
		return errors.New("kode akun sudah digunakan")
	}
	return s.repo.Create(account)
}

func (s *accountService) Update(id uint, account *model.ChartOfAccount) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	existing.NamaAkun = account.NamaAkun
	existing.JenisAkun = account.JenisAkun
	existing.SubJenis = account.SubJenis
	existing.SaldoNormal = account.SaldoNormal
	existing.IndukAkunID = account.IndukAkunID
	existing.Level = account.Level
	existing.IsAktif = account.IsAktif
	existing.Keterangan = account.Keterangan

	return s.repo.Update(existing)
}

func (s *accountService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *accountService) GetTree() ([]model.ChartOfAccount, error) {
	return s.repo.GetTree()
}
