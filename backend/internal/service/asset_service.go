package service

import (
	"backend/internal/model"
	"backend/internal/repository"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type AssetService interface {
	// Categories
	GetCategories(search string) ([]model.AssetCategory, error)
	GetCategoryByID(id uint) (*model.AssetCategory, error)
	CreateCategory(cat *model.AssetCategory) error
	UpdateCategory(cat *model.AssetCategory) error
	DeleteCategory(id uint) error

	// Assets
	GetAssets(page, perPage int, search string, categoryID, departmentID uint, status string) ([]model.Asset, int64, error)
	GetAssetByID(id uint) (*model.Asset, error)
	CreateAsset(asset *model.Asset) error
	UpdateAsset(asset *model.Asset) error
	DeleteAsset(id uint) error

	// Depreciations
	GetDepreciations(assetID uint, periodDate string) ([]model.AssetDepreciation, error)
	RunDepreciation(periodDate string, userID uint) (int, error)

	// Maintenances
	GetMaintenances(assetID uint, status string) ([]model.AssetMaintenance, error)
	GetMaintenanceByID(id uint) (*model.AssetMaintenance, error)
	CreateMaintenance(m *model.AssetMaintenance) error
	UpdateMaintenance(m *model.AssetMaintenance) error

	// Disposals
	GetDisposals(status string) ([]model.AssetDisposal, error)
	GetDisposalByID(id uint) (*model.AssetDisposal, error)
	CreateDisposal(d *model.AssetDisposal) error
	ApproveDisposal(id uint, approvedByID uint) error

	// Transfers
	GetTransfers(assetID uint, status string) ([]model.AssetTransfer, error)
	GetTransferByID(id uint) (*model.AssetTransfer, error)
	CreateTransfer(t *model.AssetTransfer) error
	ApproveTransfer(id uint, approvedByID uint) error

	// Budgets (RAB)
	GetBudgets(fiscalYear int, status string) ([]model.AssetBudget, error)
	GetBudgetByID(id uint) (*model.AssetBudget, error)
	CreateBudget(b *model.AssetBudget) error
	UpdateBudget(b *model.AssetBudget) error

	// Dashboard Stats
	GetDashboardStats() (map[string]interface{}, error)
}

type assetService struct {
	repo        repository.AssetRepository
	journalRepo repository.JournalRepository
	accountRepo repository.AccountRepository
	db          *gorm.DB
}

func NewAssetService(
	repo repository.AssetRepository,
	journalRepo repository.JournalRepository,
	accountRepo repository.AccountRepository,
	db *gorm.DB,
) AssetService {
	return &assetService{
		repo:        repo,
		journalRepo: journalRepo,
		accountRepo: accountRepo,
		db:          db,
	}
}

// ==========================================
// CATEGORIES
// ==========================================
func (s *assetService) GetCategories(search string) ([]model.AssetCategory, error) {
	return s.repo.GetCategories(search)
}

func (s *assetService) GetCategoryByID(id uint) (*model.AssetCategory, error) {
	return s.repo.GetCategoryByID(id)
}

func (s *assetService) CreateCategory(cat *model.AssetCategory) error {
	return s.repo.CreateCategory(cat)
}

func (s *assetService) UpdateCategory(cat *model.AssetCategory) error {
	return s.repo.UpdateCategory(cat)
}

func (s *assetService) DeleteCategory(id uint) error {
	return s.repo.DeleteCategory(id)
}

// ==========================================
// ASSETS
// ==========================================
func (s *assetService) GetAssets(page, perPage int, search string, categoryID, departmentID uint, status string) ([]model.Asset, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}
	return s.repo.GetAssets(page, perPage, search, categoryID, departmentID, status)
}

func (s *assetService) GetAssetByID(id uint) (*model.Asset, error) {
	return s.repo.GetAssetByID(id)
}

func (s *assetService) CreateAsset(asset *model.Asset) error {
	// Generate Code jika kosong
	if asset.Code == "" {
		cat, _ := s.repo.GetCategoryByID(asset.CategoryID)
		catCode := ""
		if cat != nil {
			catCode = cat.Code
		}
		code, err := s.repo.GenerateAssetCode(catCode)
		if err == nil {
			asset.Code = code
		}
	}

	// Inisialisasi nilai buku saat perolehan
	if asset.CurrentBookValue == 0 {
		asset.CurrentBookValue = asset.AcquisitionCost
	}
	if asset.Status == "" {
		asset.Status = "active"
	}
	if asset.Condition == "" {
		asset.Condition = "good"
	}

	return s.repo.CreateAsset(asset)
}

func (s *assetService) UpdateAsset(asset *model.Asset) error {
	return s.repo.UpdateAsset(asset)
}

func (s *assetService) DeleteAsset(id uint) error {
	return s.repo.DeleteAsset(id)
}

// ==========================================
// DEPRECIATIONS
// ==========================================
func (s *assetService) GetDepreciations(assetID uint, periodDate string) ([]model.AssetDepreciation, error) {
	return s.repo.GetDepreciations(assetID, periodDate)
}

func (s *assetService) RunDepreciation(periodDateStr string, userID uint) (int, error) {
	// Parse periodDate
	periodDate, err := time.Parse("2006-01-02", periodDateStr)
	if err != nil {
		periodDate = time.Now()
	}

	// Ambil semua aset aktif yang memiliki sisa masa manfaat
	var assets []model.Asset
	err = s.db.Preload("Category").
		Where("status = 'active' AND current_book_value > salvage_value AND depreciation_start_date <= ?", periodDate).
		Find(&assets).Error
	if err != nil {
		return 0, err
	}

	processedCount := 0
	for _, asset := range assets {
		// Cek apakah sudah pernah disusutkan pada periode yang sama
		var existingCount int64
		s.db.Model(&model.AssetDepreciation{}).
			Where("asset_id = ? AND period_date = ?", asset.ID, periodDate.Format("2006-01-02")).
			Count(&existingCount)
		if existingCount > 0 {
			continue
		}

		// Hitung depresiasi bulanan (Straight Line default)
		usefulMonths := asset.UsefulLifeMonths
		if usefulMonths <= 0 {
			usefulMonths = 60 // 5 tahun default
		}
		monthlyDep := (asset.AcquisitionCost - asset.SalvageValue) / float64(usefulMonths)

		// Jangan sampai nilai buku turun di bawah salvage value
		if (asset.CurrentBookValue - monthlyDep) < asset.SalvageValue {
			monthlyDep = asset.CurrentBookValue - asset.SalvageValue
		}

		if monthlyDep <= 0 {
			continue
		}

		newAccum := asset.AccumulatedDepreciation + monthlyDep
		newBookValue := asset.CurrentBookValue - monthlyDep

		var depCount int64
		s.db.Model(&model.AssetDepreciation{}).Where("asset_id = ?", asset.ID).Count(&depCount)

		var createdByPtr *uint
		if userID > 0 {
			createdByPtr = &userID
		}

		dep := model.AssetDepreciation{
			AssetID:                 asset.ID,
			PeriodDate:              periodDate,
			PeriodNumber:            int(depCount) + 1,
			DepreciationAmount:      monthlyDep,
			AccumulatedDepreciation: newAccum,
			BookValue:               newBookValue,
			Method:                  asset.DepreciationMethod,
			Notes:                   fmt.Sprintf("Penyusutan otomatis periode %s", periodDate.Format("2006-01")),
			CreatedByID:             createdByPtr,
		}

		// Simpan record depresiasi
		if err := s.repo.CreateDepreciation(&dep); err == nil {
			// Update nilai pada aset
			s.db.Model(&model.Asset{}).Where("id = ?", asset.ID).Updates(map[string]interface{}{
				"accumulated_depreciation": newAccum,
				"current_book_value":       newBookValue,
			})
			processedCount++
		}
	}

	return processedCount, nil
}

// ==========================================
// MAINTENANCES
// ==========================================
func (s *assetService) GetMaintenances(assetID uint, status string) ([]model.AssetMaintenance, error) {
	return s.repo.GetMaintenances(assetID, status)
}

func (s *assetService) GetMaintenanceByID(id uint) (*model.AssetMaintenance, error) {
	return s.repo.GetMaintenanceByID(id)
}

func (s *assetService) CreateMaintenance(m *model.AssetMaintenance) error {
	if m.MaintenanceNumber == "" {
		m.MaintenanceNumber = fmt.Sprintf("MNT-%d-%04d", time.Now().Year(), time.Now().Unix()%10000)
	}
	return s.repo.CreateMaintenance(m)
}

func (s *assetService) UpdateMaintenance(m *model.AssetMaintenance) error {
	return s.repo.UpdateMaintenance(m)
}

// ==========================================
// DISPOSALS
// ==========================================
func (s *assetService) GetDisposals(status string) ([]model.AssetDisposal, error) {
	return s.repo.GetDisposals(status)
}

func (s *assetService) GetDisposalByID(id uint) (*model.AssetDisposal, error) {
	return s.repo.GetDisposalByID(id)
}

func (s *assetService) CreateDisposal(d *model.AssetDisposal) error {
	if d.DisposalNumber == "" {
		d.DisposalNumber = fmt.Sprintf("DSP-%d-%04d", time.Now().Year(), time.Now().Unix()%10000)
	}

	// Hitung Gain/Loss (Harga Jual - Nilai Buku)
	asset, err := s.repo.GetAssetByID(d.AssetID)
	if err == nil && asset != nil {
		d.BookValueAtDisposal = asset.CurrentBookValue
		d.GainLoss = d.DisposalPrice - asset.CurrentBookValue
	}

	return s.repo.CreateDisposal(d)
}

func (s *assetService) ApproveDisposal(id uint, approvedByID uint) error {
	disp, err := s.repo.GetDisposalByID(id)
	if err != nil {
		return err
	}
	if disp.Status != "pending" {
		return fmt.Errorf("disposal sudah diproses")
	}

	now := time.Now()
	disp.Status = "approved"
	disp.ApprovedByID = &approvedByID
	disp.ApprovedAt = &now

	// Update status aset menjadi 'disposed'
	s.db.Model(&model.Asset{}).Where("id = ?", disp.AssetID).Update("status", "disposed")

	return s.repo.UpdateDisposal(disp)
}

// ==========================================
// TRANSFERS
// ==========================================
func (s *assetService) GetTransfers(assetID uint, status string) ([]model.AssetTransfer, error) {
	return s.repo.GetTransfers(assetID, status)
}

func (s *assetService) GetTransferByID(id uint) (*model.AssetTransfer, error) {
	return s.repo.GetTransferByID(id)
}

func (s *assetService) CreateTransfer(t *model.AssetTransfer) error {
	if t.TransferNumber == "" {
		t.TransferNumber = fmt.Sprintf("ATR-%d-%04d", time.Now().Year(), time.Now().Unix()%10000)
	}
	return s.repo.CreateTransfer(t)
}

func (s *assetService) ApproveTransfer(id uint, approvedByID uint) error {
	trans, err := s.repo.GetTransferByID(id)
	if err != nil {
		return err
	}
	if trans.Status != "pending" {
		return fmt.Errorf("transfer sudah diproses")
	}

	now := time.Now()
	trans.Status = "approved"
	trans.ApprovedByID = &approvedByID
	trans.ApprovedAt = &now

	// Update unit kerja / departemen aset ke tujuan baru
	s.db.Model(&model.Asset{}).Where("id = ?", trans.AssetID).Update("department_id", trans.ToDepartmentID)

	return s.repo.UpdateTransfer(trans)
}

// ==========================================
// BUDGETS (RAB)
// ==========================================
func (s *assetService) GetBudgets(fiscalYear int, status string) ([]model.AssetBudget, error) {
	return s.repo.GetBudgets(fiscalYear, status)
}

func (s *assetService) GetBudgetByID(id uint) (*model.AssetBudget, error) {
	return s.repo.GetBudgetByID(id)
}

func (s *assetService) CreateBudget(b *model.AssetBudget) error {
	if b.Code == "" {
		b.Code = fmt.Sprintf("RAB-%d-%03d", b.FiscalYear, time.Now().Unix()%1000)
	}

	// Hitung total budget dari rincian items
	var total float64
	for _, it := range b.Items {
		total += it.TotalAmount
	}
	b.TotalBudget = total

	return s.repo.CreateBudget(b)
}

func (s *assetService) UpdateBudget(b *model.AssetBudget) error {
	var total float64
	for _, it := range b.Items {
		total += it.TotalAmount
	}
	b.TotalBudget = total
	return s.repo.UpdateBudget(b)
}

// ==========================================
// DASHBOARD STATS
// ==========================================
func (s *assetService) GetDashboardStats() (map[string]interface{}, error) {
	return s.repo.GetDashboardStats()
}

