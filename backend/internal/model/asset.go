package model

import (
	"time"

	"gorm.io/gorm"
)

// AssetCategory mewakili kategori/kelompok aset tetap
type AssetCategory struct {
	ID                        uint            `gorm:"primaryKey" json:"id"`
	Code                      string          `gorm:"type:varchar(20);unique;not null" json:"code"`
	Name                      string          `gorm:"type:varchar(255);not null" json:"name"`
	Description               string          `gorm:"type:text" json:"description"`
	DefaultUsefulLifeYears    int             `gorm:"column:default_useful_life_years;default:5" json:"default_useful_life_years"`
	DefaultDepreciationMethod string          `gorm:"column:default_depreciation_method;type:varchar(30);default:'straight_line'" json:"default_depreciation_method"` // straight_line, declining_balance, double_declining
	DefaultSalvagePercentage  float64         `gorm:"column:default_salvage_percentage;type:decimal(5,2);default:0" json:"default_salvage_percentage"`

	// Akun Integrasi Akuntansi
	AccountAssetID        *uint           `gorm:"column:account_asset_id" json:"account_asset_id"`
	AccountAsset          *ChartOfAccount `gorm:"foreignKey:AccountAssetID" json:"account_asset,omitempty"`
	AccountDepreciationID *uint           `gorm:"column:account_depreciation_id" json:"account_depreciation_id"`
	AccountDepreciation   *ChartOfAccount `gorm:"foreignKey:AccountDepreciationID" json:"account_depreciation,omitempty"`
	AccountExpenseID      *uint           `gorm:"column:account_expense_id" json:"account_expense_id"`
	AccountExpense        *ChartOfAccount `gorm:"foreignKey:AccountExpenseID" json:"account_expense,omitempty"`

	IsActive  bool      `gorm:"column:is_active;default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Virtual count & frontend compatibility fields
	AssetsCount        int64   `gorm:"-" json:"assets_count,omitempty"`
	UsefulLifeMonths   int     `gorm:"-" json:"useful_life_months,omitempty"`
	DepreciationMethod string  `gorm:"-" json:"depreciation_method,omitempty"`
	DepreciationRate   float64 `gorm:"-" json:"depreciation_rate,omitempty"`
}

func (c *AssetCategory) AfterFind(tx *gorm.DB) (err error) {
	if c.UsefulLifeMonths == 0 && c.DefaultUsefulLifeYears > 0 {
		c.UsefulLifeMonths = c.DefaultUsefulLifeYears * 12
	}
	if c.DepreciationMethod == "" {
		c.DepreciationMethod = c.DefaultDepreciationMethod
	}
	if c.DepreciationRate == 0 && c.DefaultUsefulLifeYears > 0 {
		c.DepreciationRate = float64(100) / float64(c.DefaultUsefulLifeYears)
	}
	return nil
}

func (c *AssetCategory) BeforeSave(tx *gorm.DB) (err error) {
	if c.DefaultUsefulLifeYears == 0 && c.UsefulLifeMonths > 0 {
		c.DefaultUsefulLifeYears = c.UsefulLifeMonths / 12
		if c.DefaultUsefulLifeYears == 0 {
			c.DefaultUsefulLifeYears = 1
		}
	}
	if c.DefaultDepreciationMethod == "" && c.DepreciationMethod != "" {
		c.DefaultDepreciationMethod = c.DepreciationMethod
	}
	return nil
}

func (AssetCategory) TableName() string {
	return "asset_categories"
}

// Asset mewakili master aset tetap
type Asset struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Code        string `gorm:"type:varchar(30);unique;not null" json:"code"` // AST-2026-0001
	Name        string `gorm:"type:varchar(255);not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`

	CategoryID   uint           `gorm:"not null" json:"category_id"`
	Category     *AssetCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	DepartmentID *uint          `json:"department_id"`
	Department   *Department    `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	SupplierID   *uint          `json:"supplier_id"`
	Supplier     *Supplier      `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`

	// Detail Fisik
	Location     string `gorm:"type:varchar(255)" json:"location"`
	Brand        string `gorm:"type:varchar(255)" json:"brand"`
	Model        string `gorm:"type:varchar(255)" json:"model"`
	SerialNumber string `gorm:"type:varchar(255)" json:"serial_number"`
	PlateNumber  string `gorm:"type:varchar(50)" json:"plate_number"`

	// Pembelian / Perolehan
	AcquisitionDate time.Time `gorm:"type:date;not null" json:"acquisition_date"`
	AcquisitionType string    `gorm:"type:varchar(30);default:'purchase'" json:"acquisition_type"` // purchase, donation, transfer_in, leasing, self_built
	AcquisitionCost float64   `gorm:"type:decimal(15,2);not null" json:"acquisition_cost"`
	PurchaseID      *uint     `json:"purchase_id"`
	Purchase        *Purchase `gorm:"foreignKey:PurchaseID" json:"purchase,omitempty"`

	// Penyusutan
	UsefulLifeMonths        int       `gorm:"not null" json:"useful_life_months"`
	SalvageValue            float64   `gorm:"type:decimal(15,2);default:0" json:"salvage_value"`
	DepreciationMethod      string    `gorm:"type:varchar(30);default:'straight_line'" json:"depreciation_method"`
	CurrentBookValue        float64   `gorm:"type:decimal(15,2);not null" json:"current_book_value"`
	AccumulatedDepreciation float64   `gorm:"type:decimal(15,2);default:0" json:"accumulated_depreciation"`
	DepreciationStartDate   time.Time `gorm:"type:date;not null" json:"depreciation_start_date"`

	// Status & Kondisi
	Status    string `gorm:"type:varchar(20);default:'active'" json:"status"`    // active, maintenance, disposed, inactive
	Condition string `gorm:"type:varchar(20);default:'good'" json:"condition"` // excellent, good, fair, poor, damaged

	// Tambahan
	WarrantyExpiryDate *time.Time `gorm:"type:date" json:"warranty_expiry_date"`
	Photo              string     `gorm:"type:varchar(255)" json:"photo"`
	Notes              string     `gorm:"type:text" json:"notes"`
	CreatedByID        *uint      `json:"created_by"`
	CreatedBy          *User      `gorm:"foreignKey:CreatedByID" json:"created_by_user,omitempty"`

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

func (Asset) TableName() string {
	return "assets"
}

// AssetDepreciation riwayat kalkulasi & jurnal penyusutan
type AssetDepreciation struct {
	ID                      uint      `gorm:"primaryKey" json:"id"`
	AssetID                 uint      `gorm:"not null" json:"asset_id"`
	Asset                   *Asset    `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	PeriodDate              time.Time `gorm:"type:date;not null" json:"period_date"`
	PeriodNumber            int       `gorm:"not null" json:"period_number"`
	DepreciationAmount      float64   `gorm:"type:decimal(15,2);not null" json:"depreciation_amount"`
	AccumulatedDepreciation float64   `gorm:"type:decimal(15,2);not null" json:"accumulated_depreciation"`
	BookValue               float64   `gorm:"type:decimal(15,2);not null" json:"book_value"`
	Method                  string    `gorm:"type:varchar(30);not null" json:"method"`
	JurnalID                *uint     `json:"jurnal_id"`
	Jurnal                  *Journal  `gorm:"foreignKey:JurnalID" json:"jurnal,omitempty"`
	Notes                   string    `gorm:"type:text" json:"notes"`
	CreatedByID             *uint     `json:"created_by"`
	CreatedBy               *User     `gorm:"foreignKey:CreatedByID" json:"created_by_user,omitempty"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

func (AssetDepreciation) TableName() string {
	return "asset_depreciations"
}

// AssetMaintenance pemeliharaan/perbaikan aset
type AssetMaintenance struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	MaintenanceNumber string     `gorm:"type:varchar(30);unique;not null" json:"maintenance_number"` // MNT-2026-0001
	AssetID           uint       `gorm:"not null" json:"asset_id"`
	Asset             *Asset     `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	Type              string     `gorm:"type:varchar(30);not null" json:"type"` // preventive, corrective, emergency
	Description       string     `gorm:"type:text;not null" json:"description"`
	ScheduledDate     time.Time  `gorm:"type:date;not null" json:"scheduled_date"`
	CompletedDate     *time.Time `gorm:"type:date" json:"completed_date"`
	Cost              float64    `gorm:"type:decimal(15,2);default:0" json:"cost"`
	Vendor            string     `gorm:"type:varchar(255)" json:"vendor"`
	VendorContact     string     `gorm:"type:varchar(255)" json:"vendor_contact"`
	Status            string     `gorm:"type:varchar(20);default:'scheduled'" json:"status"` // scheduled, in_progress, completed, cancelled
	Notes             string     `gorm:"type:text" json:"notes"`
	Result            string     `gorm:"type:text" json:"result"`
	CreatedByID       *uint      `json:"created_by"`
	CreatedBy         *User      `gorm:"foreignKey:CreatedByID" json:"created_by_user,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

func (AssetMaintenance) TableName() string {
	return "asset_maintenances"
}

// AssetDisposal pelepasan / penghapusan aset
type AssetDisposal struct {
	ID                  uint       `gorm:"primaryKey" json:"id"`
	DisposalNumber      string     `gorm:"type:varchar(30);unique;not null" json:"disposal_number"` // DSP-2026-0001
	AssetID             uint       `gorm:"not null" json:"asset_id"`
	Asset               *Asset     `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	DisposalDate        time.Time  `gorm:"type:date;not null" json:"disposal_date"`
	DisposalMethod      string     `gorm:"type:varchar(30);not null" json:"disposal_method"` // sale, scrap, donation, trade_in, write_off
	DisposalPrice       float64    `gorm:"type:decimal(15,2);default:0" json:"disposal_price"`
	BookValueAtDisposal float64    `gorm:"type:decimal(15,2);not null" json:"book_value_at_disposal"`
	GainLoss            float64    `gorm:"type:decimal(15,2);default:0" json:"gain_loss"`
	BuyerInfo           string     `gorm:"type:varchar(255)" json:"buyer_info"`
	Reason              string     `gorm:"type:text;not null" json:"reason"`
	Status              string     `gorm:"type:varchar(20);default:'pending'" json:"status"` // pending, approved, completed, cancelled
	JurnalID            *uint      `json:"jurnal_id"`
	Jurnal              *Journal   `gorm:"foreignKey:JurnalID" json:"jurnal,omitempty"`
	ApprovedByID        *uint      `json:"approved_by"`
	ApprovedBy          *User      `gorm:"foreignKey:ApprovedByID" json:"approved_by_user,omitempty"`
	ApprovedAt          *time.Time `json:"approved_at"`
	Notes               string     `gorm:"type:text" json:"notes"`
	CreatedByID         *uint      `json:"created_by"`
	CreatedBy           *User      `gorm:"foreignKey:CreatedByID" json:"created_by_user,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

func (AssetDisposal) TableName() string {
	return "asset_disposals"
}

// AssetTransfer mutasi / transfer aset antar unit
type AssetTransfer struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	TransferNumber   string     `gorm:"type:varchar(30);unique;not null" json:"transfer_number"` // ATR-2026-0001
	AssetID          uint       `gorm:"not null" json:"asset_id"`
	Asset            *Asset     `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	FromDepartmentID uint       `gorm:"not null" json:"from_department_id"`
	FromDepartment   *Department `gorm:"foreignKey:FromDepartmentID" json:"from_department,omitempty"`
	ToDepartmentID   uint       `gorm:"not null" json:"to_department_id"`
	ToDepartment     *Department `gorm:"foreignKey:ToDepartmentID" json:"to_department,omitempty"`
	TransferDate     time.Time  `gorm:"type:date;not null" json:"transfer_date"`
	Reason           string     `gorm:"type:text" json:"reason"`
	Status           string     `gorm:"type:varchar(20);default:'pending'" json:"status"` // pending, approved, completed, cancelled
	ApprovedByID     *uint      `json:"approved_by"`
	ApprovedBy       *User      `gorm:"foreignKey:ApprovedByID" json:"approved_by_user,omitempty"`
	ApprovedAt       *time.Time `json:"approved_at"`
	Notes            string     `gorm:"type:text" json:"notes"`
	CreatedByID      *uint      `json:"created_by"`
	CreatedBy        *User      `gorm:"foreignKey:CreatedByID" json:"created_by_user,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func (AssetTransfer) TableName() string {
	return "asset_transfers"
}

// AssetBudget RAB Anggaran Aset
type AssetBudget struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	Code          string      `gorm:"type:varchar(50);not null" json:"code"` // RAB-2026-001
	BudgetCode    string      `gorm:"-" json:"budget_code,omitempty"`
	FiscalYear    int         `gorm:"not null" json:"fiscal_year"`
	Title         string      `gorm:"type:varchar(255);not null" json:"title"`
	BudgetName    string      `gorm:"-" json:"budget_name,omitempty"`
	Description   string      `gorm:"type:text" json:"description"`
	DepartmentID  *uint       `json:"department_id"`
	Department    *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	TotalBudget   float64     `gorm:"type:decimal(15,2);default:0" json:"total_budget"`
	TotalAmount   float64     `gorm:"-" json:"total_amount,omitempty"`
	TotalRealized float64     `gorm:"type:decimal(15,2);default:0" json:"total_realized"`
	RealizedAmount float64    `gorm:"-" json:"realized_amount,omitempty"`
	Status        string      `gorm:"type:varchar(20);default:'draft'" json:"status"` // draft, submitted, approved, closed
	SubmittedByID *uint       `json:"submitted_by"`
	SubmittedBy   *User       `gorm:"foreignKey:SubmittedByID" json:"submitted_by_user,omitempty"`
	SubmittedAt   *time.Time  `json:"submitted_at"`
	ApprovedByID  *uint       `json:"approved_by"`
	ApprovedBy    *User       `gorm:"foreignKey:ApprovedByID" json:"approved_by_user,omitempty"`
	ApprovedAt    *time.Time  `json:"approved_at"`
	CreatedByID   *uint       `json:"created_by"`
	CreatedBy     *User       `gorm:"foreignKey:CreatedByID" json:"created_by_user,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
	DeletedAt     *time.Time  `gorm:"index" json:"deleted_at,omitempty"`

	Items []AssetBudgetItem `gorm:"foreignKey:BudgetID" json:"items,omitempty"`
}

func (b *AssetBudget) AfterFind(tx *gorm.DB) (err error) {
	b.BudgetCode = b.Code
	b.BudgetName = b.Title
	b.TotalAmount = b.TotalBudget
	b.RealizedAmount = b.TotalRealized
	return nil
}

func (b *AssetBudget) BeforeSave(tx *gorm.DB) (err error) {
	if b.Code == "" && b.BudgetCode != "" {
		b.Code = b.BudgetCode
	}
	if b.Title == "" && b.BudgetName != "" {
		b.Title = b.BudgetName
	}
	if b.TotalBudget == 0 && b.TotalAmount != 0 {
		b.TotalBudget = b.TotalAmount
	}
	if b.TotalRealized == 0 && b.RealizedAmount != 0 {
		b.TotalRealized = b.RealizedAmount
	}
	return nil
}

func (AssetBudget) TableName() string {
	return "asset_budgets"
}

// AssetBudgetItem baris rincian RAB aset
type AssetBudgetItem struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	BudgetID        uint           `gorm:"column:budget_id" json:"budget_id"`
	AssetBudgetID   *uint          `gorm:"column:asset_budget_id" json:"asset_budget_id,omitempty"`
	CategoryID      *uint          `gorm:"column:category_id" json:"category_id"`
	AssetCategoryID *uint          `gorm:"column:asset_category_id" json:"asset_category_id,omitempty"`
	Category        *AssetCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	DepartmentID    *uint          `json:"department_id"`
	Department      *Department    `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	Name            string         `gorm:"type:varchar(255)" json:"name"`
	ItemName        string         `gorm:"-" json:"item_name,omitempty"`
	Specification   string         `gorm:"type:text" json:"specification"`
	Quantity        int            `gorm:"not null;default:1" json:"quantity"`
	EstimatedPrice  float64        `gorm:"type:decimal(15,2);default:0" json:"estimated_price"`
	EstimatedCost   float64        `gorm:"-" json:"estimated_cost,omitempty"`
	TotalAmount     float64        `gorm:"type:decimal(15,2);default:0" json:"total_amount"`
	TotalCost       float64        `gorm:"-" json:"total_cost,omitempty"`
	RealizedAmount  float64        `gorm:"type:decimal(15,2);default:0" json:"realized_amount"`
	Priority        string         `gorm:"type:varchar(20);default:'medium'" json:"priority"` // low, medium, high, urgent
	Status          string         `gorm:"type:varchar(20);default:'pending'" json:"status"`   // pending, realized, cancelled
	Notes           string         `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

func (it *AssetBudgetItem) AfterFind(tx *gorm.DB) (err error) {
	if it.BudgetID == 0 && it.AssetBudgetID != nil {
		it.BudgetID = *it.AssetBudgetID
	}
	if it.CategoryID == nil && it.AssetCategoryID != nil {
		it.CategoryID = it.AssetCategoryID
	}
	it.ItemName = it.Name
	it.EstimatedCost = it.EstimatedPrice
	it.TotalCost = it.TotalAmount
	return nil
}

func (it *AssetBudgetItem) BeforeSave(tx *gorm.DB) (err error) {
	if it.AssetBudgetID == nil && it.BudgetID > 0 {
		it.AssetBudgetID = &it.BudgetID
	}
	if it.BudgetID == 0 && it.AssetBudgetID != nil {
		it.BudgetID = *it.AssetBudgetID
	}
	if it.AssetCategoryID == nil && it.CategoryID != nil {
		it.AssetCategoryID = it.CategoryID
	}
	if it.CategoryID == nil && it.AssetCategoryID != nil {
		it.CategoryID = it.AssetCategoryID
	}
	if it.Name == "" && it.ItemName != "" {
		it.Name = it.ItemName
	}
	if it.EstimatedPrice == 0 && it.EstimatedCost != 0 {
		it.EstimatedPrice = it.EstimatedCost
	}
	if it.TotalAmount == 0 && it.TotalCost != 0 {
		it.TotalAmount = it.TotalCost
	}
	if it.TotalAmount == 0 && it.EstimatedPrice > 0 && it.Quantity > 0 {
		it.TotalAmount = float64(it.Quantity) * it.EstimatedPrice
	}
	return nil
}

func (AssetBudgetItem) TableName() string {
	return "asset_budget_items"
}

