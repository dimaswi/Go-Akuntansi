package model

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// ItemCategory merepresentasikan kategori inventaris (sesuai tabel PostgreSQL: item_categories)
type ItemCategory struct {
	ID                     uint      `gorm:"primaryKey" json:"id"`
	Code                   string    `gorm:"size:50;not null;uniqueIndex" json:"code"`
	Name                   string    `gorm:"size:255;not null" json:"name"`
	Description            string    `gorm:"type:text" json:"description"`
	ParentID               *uint     `json:"parent_id"`
	CategoryType           string    `gorm:"size:50;default:'general'" json:"category_type"`
	IsActive               bool      `gorm:"default:true" json:"is_active"`
	RequiresBatchTracking  bool      `gorm:"default:false" json:"requires_batch_tracking"`
	RequiresExpiryTracking bool      `gorm:"default:false" json:"requires_expiry_tracking"`
	StorageRequirements    string    `gorm:"type:text" json:"storage_requirements"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`

	Parent   *ItemCategory  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []ItemCategory `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

func (ItemCategory) TableName() string {
	return "item_categories"
}

// Supplier merepresentasikan data vendor / pemasok (sesuai tabel PostgreSQL: suppliers)
type Supplier struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	Address   string    `gorm:"type:text" json:"address"`
	Phone     string    `gorm:"size:50" json:"phone"`
	Email     string    `gorm:"size:100" json:"email"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Supplier) TableName() string {
	return "suppliers"
}

// Item merepresentasikan master data barang inventaris (sesuai tabel PostgreSQL: items)
type Item struct {
	ID                    uint            `gorm:"primaryKey" json:"id"`
	CategoryID            *uint           `json:"category_id"`
	SupplierID            *uint           `json:"supplier_id"`
	DepartmentID          *uint           `json:"department_id"`
	Code                  string          `gorm:"size:50;not null;uniqueIndex" json:"code"`
	Name                  string          `gorm:"size:255;not null" json:"name"`
	Description           string          `gorm:"type:text" json:"description"`
	InventoryType         string          `gorm:"size:50;default:'general'" json:"inventory_type"`
	UnitOfMeasure         string          `gorm:"size:50;not null;default:'PCS'" json:"unit_of_measure"`
	PackSize              int             `gorm:"default:1" json:"pack_size"`
	ReorderLevel          decimal.Decimal `gorm:"type:decimal(15,2);default:10" json:"reorder_level"`
	MaxLevel              decimal.Decimal `gorm:"type:decimal(15,2);default:100" json:"max_level"`
	SafetyStock           decimal.Decimal `gorm:"type:decimal(15,2);default:5" json:"safety_stock"`
	StandardCost          decimal.Decimal `gorm:"type:decimal(15,2);default:0" json:"standard_cost"`
	LastPurchaseCost      decimal.Decimal `gorm:"type:decimal(15,2);default:0" json:"last_purchase_cost"`
	IsActive              bool            `gorm:"default:true" json:"is_active"`
	RequiresApproval      bool            `gorm:"default:false" json:"requires_approval"`
	IsControlledSubstance bool            `gorm:"default:false" json:"is_controlled_substance"`
	RequiresPrescription  bool            `gorm:"default:false" json:"requires_prescription"`
	CreatedAt             time.Time       `json:"created_at"`
	UpdatedAt             time.Time       `json:"updated_at"`

	Category   *ItemCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Supplier   *Supplier     `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Department *Department   `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`

	// Virtual / computed dari item_stocks
	TotalStock decimal.Decimal `gorm:"-" json:"total_stock"`
	StockValue decimal.Decimal `gorm:"-" json:"stock_value"`
}

func (Item) TableName() string {
	return "items"
}

// ItemStock merepresentasikan posisi stok item per gudang/departemen (sesuai tabel PostgreSQL: item_stocks)
type ItemStock struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	ItemID            uint            `gorm:"not null;index" json:"item_id"`
	DepartmentID      *uint           `gorm:"index" json:"department_id"` // NULL = Central Warehouse (Gudang Pusat)
	QuantityOnHand    decimal.Decimal `gorm:"type:numeric;default:0" json:"quantity_on_hand"`
	ReservedQuantity  decimal.Decimal `gorm:"type:numeric;default:0" json:"reserved_quantity"`
	AvailableQuantity decimal.Decimal `gorm:"type:numeric;default:0" json:"available_quantity"`
	LastUnitCost      decimal.Decimal `gorm:"type:numeric;default:0" json:"last_unit_cost"`
	AverageUnitCost   decimal.Decimal `gorm:"type:numeric;default:0" json:"average_unit_cost"`
	TotalValue        decimal.Decimal `gorm:"type:numeric;default:0" json:"total_value"`
	LastUpdatedAt     *time.Time      `json:"last_updated_at"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`

	Item       *Item       `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	Department *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
}

func (ItemStock) TableName() string {
	return "item_stocks"
}

// Purchase merepresentasikan pesanan pembelian / pengadaan inventaris (sesuai tabel PostgreSQL: purchases)
type Purchase struct {
	ID                   uint            `gorm:"primaryKey" json:"id"`
	PurchaseNumber       string          `gorm:"size:50;not null;uniqueIndex" json:"purchase_number"`
	SupplierID           uint            `gorm:"not null" json:"supplier_id"`
	CreatedBy            uint            `json:"created_by"`
	ApprovedBy           *uint           `json:"approved_by"`
	PurchaseDate         time.Time       `gorm:"type:date;not null" json:"purchase_date"`
	ExpectedDeliveryDate *time.Time      `gorm:"type:date" json:"expected_delivery_date"`
	ActualDeliveryDate   *time.Time      `gorm:"type:date" json:"actual_delivery_date"`
	Status               string          `gorm:"size:30;not null;default:'draft'" json:"status"`
	Subtotal             decimal.Decimal `gorm:"type:numeric;default:0" json:"subtotal"`
	TaxAmount            decimal.Decimal `gorm:"type:numeric;default:0" json:"tax_amount"`
	DiscountAmount       decimal.Decimal `gorm:"type:numeric;default:0" json:"discount_amount"`
	ShippingCost         decimal.Decimal `gorm:"type:numeric;default:0" json:"shipping_cost"`
	TotalAmount          decimal.Decimal `gorm:"type:numeric;default:0" json:"total_amount"`
	JurnalPosted         bool            `gorm:"default:false" json:"jurnal_posted"`
	Notes                string          `gorm:"type:text" json:"notes"`
	PaymentTerms         string          `gorm:"size:100" json:"payment_terms"`
	ApprovedAt           *time.Time      `json:"approved_at"`
	OrderedAt            *time.Time      `json:"ordered_at"`
	CompletedAt          *time.Time      `json:"completed_at"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
	DeletedAt            gorm.DeletedAt  `gorm:"index" json:"-"`
	AkunKasID            *uint           `json:"akun_kas_id"`
	JurnalID             *uint           `json:"jurnal_id"`
	ApOutstanding        decimal.Decimal `gorm:"type:numeric;default:0" json:"ap_outstanding"`

	Supplier *Supplier      `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Items    []PurchaseItem `gorm:"foreignKey:PurchaseID" json:"items,omitempty"`
	Journal  *Journal       `gorm:"foreignKey:JurnalID" json:"journal,omitempty"`
}

func (Purchase) TableName() string {
	return "purchases"
}

// PurchaseItem merepresentasikan rincian item dalam pembelian (sesuai tabel PostgreSQL: purchase_items)
type PurchaseItem struct {
	ID                 uint            `gorm:"primaryKey" json:"id"`
	PurchaseID         uint            `gorm:"not null;index" json:"purchase_id"`
	ItemID             uint            `gorm:"not null;index" json:"item_id"`
	QuantityOrdered    decimal.Decimal `gorm:"type:numeric;not null" json:"quantity_ordered"`
	QuantityReceived   decimal.Decimal `gorm:"type:numeric;default:0" json:"quantity_received"`
	UnitPrice          decimal.Decimal `gorm:"type:numeric;not null" json:"unit_price"`
	ActualUnitCost     decimal.Decimal `gorm:"type:numeric;default:0" json:"actual_unit_cost"`
	LandedCost         decimal.Decimal `gorm:"type:numeric;default:0" json:"landed_cost"`
	TotalPrice         decimal.Decimal `gorm:"type:numeric;not null" json:"total_price"`
	BatchNumber        string          `gorm:"size:50" json:"batch_number"`
	ExpiryDate         *time.Time      `gorm:"type:date" json:"expiry_date"`
	Notes              string          `gorm:"type:text" json:"notes"`
	InventoryAccountID *uint           `json:"inventory_account_id"`
	ExpenseAccountID   *uint           `json:"expense_account_id"`
	AllocationType     string          `gorm:"size:50" json:"allocation_type"`
	ItemStatus         string          `gorm:"size:30;default:'pending'" json:"item_status"`
	ReceivedAt         *time.Time      `json:"received_at"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`

	Item *Item `gorm:"foreignKey:ItemID" json:"item,omitempty"`
}

func (PurchaseItem) TableName() string {
	return "purchase_items"
}

// PurchasePayment merepresentasikan pembayaran hutang pembelian kepada supplier (sesuai tabel PostgreSQL: purchase_payments)
type PurchasePayment struct {
	ID             uint            `gorm:"primaryKey" json:"id"`
	PurchaseID     uint            `gorm:"not null;index" json:"purchase_id"`
	PaymentNumber  string          `gorm:"size:50;not null;uniqueIndex" json:"payment_number"`
	PaymentDate    time.Time       `gorm:"type:date;not null" json:"payment_date"`
	PaymentMethod  string          `gorm:"size:50;default:'bank_transfer'" json:"payment_method"`
	KodeAkunBank   string          `gorm:"size:20" json:"kode_akun_bank"`
	Amount         decimal.Decimal `gorm:"type:numeric;not null" json:"amount"`
	DiscountAmount decimal.Decimal `gorm:"type:numeric;default:0" json:"discount_amount"`
	Notes          string          `gorm:"type:text" json:"notes"`
	JurnalID       *uint           `json:"jurnal_id"`
	JurnalPosted   bool            `gorm:"default:false" json:"jurnal_posted"`
	CreatedBy      uint            `json:"created_by"`
	ApprovedBy     *uint           `json:"approved_by"`
	ApprovedAt     *time.Time      `json:"approved_at"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`

	Purchase *Purchase `gorm:"foreignKey:PurchaseID" json:"purchase,omitempty"`
}

func (PurchasePayment) TableName() string {
	return "purchase_payments"
}

// StockAdjustment merepresentasikan penyesuaian stok (sesuai tabel PostgreSQL: stock_adjustments)
type StockAdjustment struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	NomorAdjustment   string          `gorm:"size:50;not null;uniqueIndex" json:"nomor_adjustment"`
	TanggalAdjustment time.Time       `gorm:"type:date;not null" json:"tanggal_adjustment"`
	TipeAdjustment    string          `gorm:"size:30;not null" json:"tipe_adjustment"` // shortage, overage
	ItemID            uint            `gorm:"not null" json:"item_id"`
	Quantity          int             `gorm:"not null" json:"quantity"`
	UnitPrice         decimal.Decimal `gorm:"type:numeric;default:0" json:"unit_price"`
	TotalAmount       decimal.Decimal `gorm:"type:numeric;default:0" json:"total_amount"`
	Keterangan        string          `gorm:"type:text" json:"keterangan"`
	Status            string          `gorm:"size:30;default:'draft'" json:"status"` // draft, approved
	ApprovedBy        *uint           `json:"approved_by"`
	ApprovedAt        *time.Time      `json:"approved_at"`
	JurnalPosted      bool            `gorm:"default:false" json:"jurnal_posted"`
	JurnalID          *uint           `json:"jurnal_id"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`

	Item    *Item    `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	Journal *Journal `gorm:"foreignKey:JurnalID" json:"journal,omitempty"`
}

func (StockAdjustment) TableName() string {
	return "stock_adjustments"
}

// StockTransfer merepresentasikan transfer stok (sesuai tabel PostgreSQL: stock_transfers)
type StockTransfer struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	NomorTransfer    string     `gorm:"size:50;not null;uniqueIndex" json:"nomor_transfer"`
	TanggalTransfer  time.Time  `gorm:"type:date;not null" json:"tanggal_transfer"`
	ItemID           uint       `gorm:"not null" json:"item_id"`
	FromDepartmentID *uint      `json:"from_department_id"` // null = Gudang Pusat
	ToDepartmentID   uint       `gorm:"not null" json:"to_department_id"`
	Quantity         int        `gorm:"not null" json:"quantity"`
	Keterangan       string     `gorm:"type:text" json:"keterangan"`
	Status           string     `gorm:"size:30;default:'draft'" json:"status"` // draft, approved, received
	ApprovedBy       *uint      `json:"approved_by"`
	ApprovedAt       *time.Time `json:"approved_at"`
	ReceivedBy       *uint      `json:"received_by"`
	ReceivedAt       *time.Time `json:"received_at"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

	Item           *Item       `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	FromDepartment *Department `gorm:"foreignKey:FromDepartmentID" json:"from_department,omitempty"`
	ToDepartment   *Department `gorm:"foreignKey:ToDepartmentID" json:"to_department,omitempty"`
}

func (StockTransfer) TableName() string {
	return "stock_transfers"
}

// StockOpname merepresentasikan kegiatan stock opname fisik (sesuai tabel PostgreSQL: stock_opnames)
type StockOpname struct {
	ID                 uint            `gorm:"primaryKey" json:"id"`
	OpnameNumber       string          `gorm:"size:50;not null;uniqueIndex" json:"opname_number"`
	DepartmentID       *uint           `gorm:"index" json:"department_id"`
	OpnameDate         time.Time       `gorm:"type:date;not null" json:"opname_date"`
	Status             string          `gorm:"size:30;default:'draft'" json:"status"` // draft, submitted, approved, rejected
	Notes              string          `gorm:"type:text" json:"notes"`
	TotalItemsCounted  int             `gorm:"default:0" json:"total_items_counted"`
	TotalVarianceValue decimal.Decimal `gorm:"type:numeric;default:0" json:"total_variance_value"`
	CreatedBy          uint            `json:"created_by"`
	ApprovedBy         *uint           `json:"approved_by"`
	ApprovedAt         *time.Time      `json:"approved_at"`
	RejectionReason    string          `gorm:"type:text" json:"rejection_reason"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
	DeletedAt          gorm.DeletedAt  `gorm:"index" json:"-"`

	Department *Department       `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	Items      []StockOpnameItem `gorm:"foreignKey:StockOpnameID" json:"items,omitempty"`
}

func (StockOpname) TableName() string {
	return "stock_opnames"
}

// StockOpnameItem merepresentasikan item yang di-opname (sesuai tabel PostgreSQL: stock_opname_items)
type StockOpnameItem struct {
	ID               uint            `gorm:"primaryKey" json:"id"`
	StockOpnameID    uint            `gorm:"not null;index" json:"stock_opname_id"`
	ItemID           uint            `gorm:"not null;index" json:"item_id"`
	SystemQuantity   decimal.Decimal `gorm:"type:numeric;default:0" json:"system_quantity"`
	PhysicalQuantity decimal.Decimal `gorm:"type:numeric;default:0" json:"physical_quantity"`
	Variance         decimal.Decimal `gorm:"type:numeric;default:0" json:"variance"`
	UnitPrice        decimal.Decimal `gorm:"type:numeric;default:0" json:"unit_price"`
	VarianceValue    decimal.Decimal `gorm:"type:numeric;default:0" json:"variance_value"`
	Notes            string          `gorm:"type:text" json:"notes"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`

	Item *Item `gorm:"foreignKey:ItemID" json:"item,omitempty"`
}

func (StockOpnameItem) TableName() string {
	return "stock_opname_items"
}

// StockRequest merepresentasikan permintaan stok antar unit (sesuai tabel PostgreSQL: stock_requests)
type StockRequest struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	RequestNumber   string         `gorm:"size:50;not null;uniqueIndex" json:"request_number"`
	DepartmentID    uint           `gorm:"not null" json:"department_id"`
	RequestedBy     uint           `json:"requested_by"`
	RequestDate     time.Time      `gorm:"type:date;not null" json:"request_date"`
	RequiredDate    *time.Time     `gorm:"type:date" json:"required_date"`
	Status          string         `gorm:"size:30;default:'draft'" json:"status"`
	Priority        string         `gorm:"size:30;default:'normal'" json:"priority"`
	Purpose         string         `gorm:"type:text" json:"purpose"`
	Notes           string         `gorm:"type:text" json:"notes"`
	ApprovedBy      *uint          `json:"approved_by"`
	ApprovedAt      *time.Time     `json:"approved_at"`
	RejectionReason string         `gorm:"type:text" json:"rejection_reason"`
	CompletedAt     *time.Time     `json:"completed_at"`
	CompletedBy     *uint          `json:"completed_by"`
	JurnalID        *uint          `json:"jurnal_id"`
	JurnalPosted    bool           `gorm:"default:false" json:"jurnal_posted"`
	JurnalPostedAt  *time.Time     `json:"jurnal_posted_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Department *Department        `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	Items      []StockRequestItem `gorm:"foreignKey:StockRequestID" json:"items,omitempty"`
}

func (StockRequest) TableName() string {
	return "stock_requests"
}

type StockRequestItem struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	StockRequestID    uint            `gorm:"not null;index" json:"stock_request_id"`
	ItemID            uint            `gorm:"not null;index" json:"item_id"`
	QuantityRequested decimal.Decimal `gorm:"type:numeric(15,3);not null" json:"quantity_requested"`
	QuantityApproved  decimal.Decimal `gorm:"type:numeric(15,3);default:0" json:"quantity_approved"`
	QuantityIssued    decimal.Decimal `gorm:"type:numeric(15,3);default:0" json:"quantity_issued"`
	UnitCost          decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"unit_cost"`
	TotalCost         decimal.Decimal `gorm:"type:numeric(15,2);default:0" json:"total_cost"`
	Notes             string          `gorm:"type:text" json:"notes"`
	ApprovalNotes     string          `gorm:"type:text" json:"approval_notes"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`

	Item *Item `gorm:"foreignKey:ItemID" json:"item,omitempty"`
}

func (StockRequestItem) TableName() string {
	return "stock_request_items"
}
