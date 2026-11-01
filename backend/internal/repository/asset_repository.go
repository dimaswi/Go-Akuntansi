package repository

import (
	"backend/internal/model"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type AssetRepository interface {
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
	GenerateAssetCode(categoryCode string) (string, error)

	// Depreciations
	GetDepreciations(assetID uint, periodDate string) ([]model.AssetDepreciation, error)
	CreateDepreciation(dep *model.AssetDepreciation) error

	// Maintenances
	GetMaintenances(assetID uint, status string) ([]model.AssetMaintenance, error)
	GetMaintenanceByID(id uint) (*model.AssetMaintenance, error)
	CreateMaintenance(m *model.AssetMaintenance) error
	UpdateMaintenance(m *model.AssetMaintenance) error

	// Disposals
	GetDisposals(status string) ([]model.AssetDisposal, error)
	GetDisposalByID(id uint) (*model.AssetDisposal, error)
	CreateDisposal(d *model.AssetDisposal) error
	UpdateDisposal(d *model.AssetDisposal) error

	// Transfers
	GetTransfers(assetID uint, status string) ([]model.AssetTransfer, error)
	GetTransferByID(id uint) (*model.AssetTransfer, error)
	CreateTransfer(t *model.AssetTransfer) error
	UpdateTransfer(t *model.AssetTransfer) error

	// Budgets (RAB)
	GetBudgets(fiscalYear int, status string) ([]model.AssetBudget, error)
	GetBudgetByID(id uint) (*model.AssetBudget, error)
	CreateBudget(b *model.AssetBudget) error
	UpdateBudget(b *model.AssetBudget) error

	// Dashboard Stats
	GetDashboardStats() (map[string]interface{}, error)
}

type assetRepository struct {
	db *gorm.DB
}

func NewAssetRepository(db *gorm.DB) AssetRepository {
	return &assetRepository{db: db}
}

// ==========================================
// CATEGORIES
// ==========================================
func (r *assetRepository) GetCategories(search string) ([]model.AssetCategory, error) {
	var categories []model.AssetCategory
	query := r.db.Preload("AccountAsset").
		Preload("AccountDepreciation").
		Preload("AccountExpense")

	if search != "" {
		q := "%" + search + "%"
		query = query.Where("code ILIKE ? OR name ILIKE ?", q, q)
	}

	err := query.Order("code ASC").Find(&categories).Error
	if err != nil {
		return nil, err
	}

	// Hitung assets_count
	for i := range categories {
		var count int64
		r.db.Model(&model.Asset{}).Where("category_id = ?", categories[i].ID).Count(&count)
		categories[i].AssetsCount = count
	}

	return categories, nil
}

func (r *assetRepository) GetCategoryByID(id uint) (*model.AssetCategory, error) {
	var cat model.AssetCategory
	err := r.db.Preload("AccountAsset").
		Preload("AccountDepreciation").
		Preload("AccountExpense").
		First(&cat, id).Error
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

func (r *assetRepository) CreateCategory(cat *model.AssetCategory) error {
	return r.db.Create(cat).Error
}

func (r *assetRepository) UpdateCategory(cat *model.AssetCategory) error {
	return r.db.Save(cat).Error
}

func (r *assetRepository) DeleteCategory(id uint) error {
	var assetCount int64
	r.db.Model(&model.Asset{}).Where("category_id = ?", id).Count(&assetCount)
	if assetCount > 0 {
		return fmt.Errorf("kategori tidak dapat dihapus karena masih digunakan oleh %d aset", assetCount)
	}
	return r.db.Delete(&model.AssetCategory{}, id).Error
}

// ==========================================
// ASSETS
// ==========================================
func (r *assetRepository) GetAssets(page, perPage int, search string, categoryID, departmentID uint, status string) ([]model.Asset, int64, error) {
	var assets []model.Asset
	var total int64

	query := r.db.Model(&model.Asset{}).
		Preload("Category").
		Preload("Department").
		Preload("Supplier")

	if search != "" {
		q := "%" + search + "%"
		query = query.Where("code ILIKE ? OR name ILIKE ? OR brand ILIKE ? OR serial_number ILIKE ? OR plate_number ILIKE ?", q, q, q, q, q)
	}
	if categoryID > 0 {
		query = query.Where("category_id = ?", categoryID)
	}
	if departmentID > 0 {
		query = query.Where("department_id = ?", departmentID)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Order("id DESC").Limit(perPage).Offset(offset).Find(&assets).Error
	return assets, total, err
}

func (r *assetRepository) GetAssetByID(id uint) (*model.Asset, error) {
	var asset model.Asset
	err := r.db.Preload("Category.AccountAsset").
		Preload("Category.AccountDepreciation").
		Preload("Category.AccountExpense").
		Preload("Department").
		Preload("Supplier").
		Preload("Purchase").
		First(&asset, id).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *assetRepository) CreateAsset(asset *model.Asset) error {
	return r.db.Create(asset).Error
}

func (r *assetRepository) UpdateAsset(asset *model.Asset) error {
	return r.db.Save(asset).Error
}

func (r *assetRepository) DeleteAsset(id uint) error {
	return r.db.Delete(&model.Asset{}, id).Error
}

func (r *assetRepository) GenerateAssetCode(categoryCode string) (string, error) {
	year := time.Now().Year()
	prefix := fmt.Sprintf("AST-%d-", year)
	if categoryCode != "" {
		prefix = fmt.Sprintf("AST-%s-%d-", categoryCode, year)
	}

	var count int64
	r.db.Model(&model.Asset{}).Where("code LIKE ?", prefix+"%").Count(&count)
	return fmt.Sprintf("%s%04d", prefix, count+1), nil
}

// ==========================================
// DEPRECIATIONS
// ==========================================
func (r *assetRepository) GetDepreciations(assetID uint, periodDate string) ([]model.AssetDepreciation, error) {
	var list []model.AssetDepreciation
	query := r.db.Preload("Asset.Category").Preload("Jurnal")

	if assetID > 0 {
		query = query.Where("asset_id = ?", assetID)
	}
	if periodDate != "" {
		query = query.Where("period_date = ?", periodDate)
	}

	err := query.Order("period_date DESC, id DESC").Find(&list).Error
	return list, err
}

func (r *assetRepository) CreateDepreciation(dep *model.AssetDepreciation) error {
	return r.db.Create(dep).Error
}

// ==========================================
// MAINTENANCES
// ==========================================
func (r *assetRepository) GetMaintenances(assetID uint, status string) ([]model.AssetMaintenance, error) {
	var list []model.AssetMaintenance
	query := r.db.Preload("Asset.Category").Preload("Asset.Department")

	if assetID > 0 {
		query = query.Where("asset_id = ?", assetID)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("scheduled_date DESC, id DESC").Find(&list).Error
	return list, err
}

func (r *assetRepository) GetMaintenanceByID(id uint) (*model.AssetMaintenance, error) {
	var m model.AssetMaintenance
	err := r.db.Preload("Asset.Category").Preload("Asset.Department").First(&m, id).Error
	return &m, err
}

func (r *assetRepository) CreateMaintenance(m *model.AssetMaintenance) error {
	return r.db.Create(m).Error
}

func (r *assetRepository) UpdateMaintenance(m *model.AssetMaintenance) error {
	return r.db.Save(m).Error
}

// ==========================================
// DISPOSALS
// ==========================================
func (r *assetRepository) GetDisposals(status string) ([]model.AssetDisposal, error) {
	var list []model.AssetDisposal
	query := r.db.Preload("Asset.Category").Preload("Asset.Department").Preload("Jurnal")

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("disposal_date DESC, id DESC").Find(&list).Error
	return list, err
}

func (r *assetRepository) GetDisposalByID(id uint) (*model.AssetDisposal, error) {
	var d model.AssetDisposal
	err := r.db.Preload("Asset.Category").Preload("Asset.Department").Preload("Jurnal").First(&d, id).Error
	return &d, err
}

func (r *assetRepository) CreateDisposal(d *model.AssetDisposal) error {
	return r.db.Create(d).Error
}

func (r *assetRepository) UpdateDisposal(d *model.AssetDisposal) error {
	return r.db.Save(d).Error
}

// ==========================================
// TRANSFERS
// ==========================================
func (r *assetRepository) GetTransfers(assetID uint, status string) ([]model.AssetTransfer, error) {
	var list []model.AssetTransfer
	query := r.db.Preload("Asset").Preload("FromDepartment").Preload("ToDepartment")

	if assetID > 0 {
		query = query.Where("asset_id = ?", assetID)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("transfer_date DESC, id DESC").Find(&list).Error
	return list, err
}

func (r *assetRepository) GetTransferByID(id uint) (*model.AssetTransfer, error) {
	var t model.AssetTransfer
	err := r.db.Preload("Asset").Preload("FromDepartment").Preload("ToDepartment").First(&t, id).Error
	return &t, err
}

func (r *assetRepository) CreateTransfer(t *model.AssetTransfer) error {
	return r.db.Create(t).Error
}

func (r *assetRepository) UpdateTransfer(t *model.AssetTransfer) error {
	return r.db.Save(t).Error
}

// ==========================================
// BUDGETS (RAB)
// ==========================================
func (r *assetRepository) GetBudgets(fiscalYear int, status string) ([]model.AssetBudget, error) {
	list := []model.AssetBudget{}
	query := r.db.Model(&model.AssetBudget{}).
		Preload("Department").
		Preload("Items.Category").
		Preload("Items.Department")

	if fiscalYear > 0 {
		query = query.Where("fiscal_year = ?", fiscalYear)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("fiscal_year DESC, id DESC").Find(&list).Error
	if err != nil {
		// Fallback query tanpa preload jika skema tabel lama belum sinkron
		fallbackQuery := r.db.Model(&model.AssetBudget{})
		if fiscalYear > 0 {
			fallbackQuery = fallbackQuery.Where("fiscal_year = ?", fiscalYear)
		}
		if status != "" && status != "all" {
			fallbackQuery = fallbackQuery.Where("status = ?", status)
		}
		fallbackErr := fallbackQuery.Order("fiscal_year DESC, id DESC").Find(&list).Error
		if fallbackErr == nil {
			return list, nil
		}
		return []model.AssetBudget{}, err
	}
	return list, nil
}

func (r *assetRepository) GetBudgetByID(id uint) (*model.AssetBudget, error) {
	var b model.AssetBudget
	err := r.db.Preload("Department").Preload("Items.Category").Preload("Items.Department").First(&b, id).Error
	return &b, err
}

func (r *assetRepository) CreateBudget(b *model.AssetBudget) error {
	return r.db.Create(b).Error
}

func (r *assetRepository) UpdateBudget(b *model.AssetBudget) error {
	return r.db.Save(b).Error
}

// ==========================================
// DASHBOARD STATS
// ==========================================
func (r *assetRepository) GetDashboardStats() (map[string]interface{}, error) {
	var totalAssets int64
	var totalActive int64
	var totalMaintenance int64
	var totalDisposed int64

	var totalAcquisitionCost float64
	var totalCurrentBookValue float64
	var totalAccumulatedDepreciation float64

	r.db.Model(&model.Asset{}).Count(&totalAssets)
	r.db.Model(&model.Asset{}).Where("status = 'active'").Count(&totalActive)
	r.db.Model(&model.Asset{}).Where("status = 'maintenance'").Count(&totalMaintenance)
	r.db.Model(&model.Asset{}).Where("status = 'disposed'").Count(&totalDisposed)

	r.db.Model(&model.Asset{}).Select("COALESCE(SUM(acquisition_cost), 0)").Scan(&totalAcquisitionCost)
	r.db.Model(&model.Asset{}).Select("COALESCE(SUM(current_book_value), 0)").Scan(&totalCurrentBookValue)
	r.db.Model(&model.Asset{}).Select("COALESCE(SUM(accumulated_depreciation), 0)").Scan(&totalAccumulatedDepreciation)

	return map[string]interface{}{
		"total_assets":                   totalAssets,
		"total_active":                   totalActive,
		"total_maintenance":              totalMaintenance,
		"total_disposed":                 totalDisposed,
		"total_acquisition_cost":         totalAcquisitionCost,
		"total_current_book_value":       totalCurrentBookValue,
		"total_accumulated_depreciation": totalAccumulatedDepreciation,
	}, nil
}

