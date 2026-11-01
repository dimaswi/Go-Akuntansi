package repository

import (
	"fmt"
	"strings"
	"time"

	"backend/internal/model"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type InventoryRepository interface {
	// Items
	GetItemsPaginated(page, perPage int, search string, categoryID *uint, lowStockOnly bool) ([]model.Item, int64, error)
	GetItemByID(id uint) (*model.Item, error)
	CreateItem(item *model.Item) error
	UpdateItem(item *model.Item) error
	DeleteItem(id uint) error
	GetLowStockCount() (int64, error)

	// Item Categories
	GetCategories() ([]model.ItemCategory, error)
	GetCategoryByID(id uint) (*model.ItemCategory, error)
	CreateCategory(cat *model.ItemCategory) error
	UpdateCategory(cat *model.ItemCategory) error
	DeleteCategory(id uint) error

	// Suppliers
	GetSuppliers(search string) ([]model.Supplier, error)
	GetSupplierByID(id uint) (*model.Supplier, error)
	CreateSupplier(sup *model.Supplier) error
	UpdateSupplier(sup *model.Supplier) error
	DeleteSupplier(id uint) error

	// Purchases
	GetPurchasesPaginated(page, perPage int, search, status string, from, to *time.Time) ([]model.Purchase, int64, error)
	GetPurchaseByID(id uint) (*model.Purchase, error)
	CreatePurchase(p *model.Purchase) error
	UpdatePurchase(p *model.Purchase) error
	DeletePurchase(id uint) error
	GeneratePurchaseNumber() (string, error)

	// Payments
	CreatePurchasePayment(payment *model.PurchasePayment) error
	GetPurchasePayments(purchaseID *uint) ([]model.PurchasePayment, error)
	GetPurchasePaymentByID(id uint) (*model.PurchasePayment, error)
	GeneratePaymentNumber() (string, error)

	// Stock Operations
	GetItemStock(itemID uint, deptID *uint) (*model.ItemStock, error)
	UpdateItemStock(stock *model.ItemStock) error
	GetStockSummary(deptID *uint) ([]model.ItemStock, error)

	// Stock Adjustments
	GetStockAdjustmentsPaginated(page, perPage int, search string) ([]model.StockAdjustment, int64, error)
	GetStockAdjustmentByID(id uint) (*model.StockAdjustment, error)
	CreateStockAdjustment(adj *model.StockAdjustment) error
	UpdateStockAdjustment(adj *model.StockAdjustment) error
	GenerateAdjustmentNumber() (string, error)

	// Stock Transfers
	GetStockTransfersPaginated(page, perPage int, search string) ([]model.StockTransfer, int64, error)
	GetStockTransferByID(id uint) (*model.StockTransfer, error)
	CreateStockTransfer(trf *model.StockTransfer) error
	UpdateStockTransfer(trf *model.StockTransfer) error
	GenerateTransferNumber() (string, error)

	// Stock Opname
	GetStockOpnamesPaginated(page, perPage int, search string) ([]model.StockOpname, int64, error)
	GetStockOpnameByID(id uint) (*model.StockOpname, error)
	CreateStockOpname(opn *model.StockOpname) error
	UpdateStockOpname(opn *model.StockOpname) error
	CreateStockOpnameItem(item *model.StockOpnameItem) error
	GenerateOpnameNumber() (string, error)

	// Stock Requests
	GetStockRequestsPaginated(page, perPage int, search string) ([]model.StockRequest, int64, error)
	GetStockRequestByID(id uint) (*model.StockRequest, error)
	CreateStockRequest(req *model.StockRequest) error
	UpdateStockRequest(req *model.StockRequest) error
	GenerateRequestNumber() (string, error)

	// Dashboard Stats
	GetDashboardStats() (map[string]interface{}, error)
}

type inventoryRepository struct {
	db *gorm.DB
}

func NewInventoryRepository(db *gorm.DB) InventoryRepository {
	return &inventoryRepository{db: db}
}

// ------------------- ITEMS -------------------

func (r *inventoryRepository) GetItemsPaginated(page, perPage int, search string, categoryID *uint, lowStockOnly bool) ([]model.Item, int64, error) {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	query := r.db.Model(&model.Item{}).Preload("Category").Preload("Supplier")

	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(code) LIKE ? OR LOWER(name) LIKE ?", s, s)
	}
	if categoryID != nil && *categoryID > 0 {
		query = query.Where("category_id = ?", *categoryID)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.Item
	if err := query.Order("name ASC").Offset(offset).Limit(perPage).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	// Hitung total_stock riil dalam 1 batch query (hindari N+1 query saat pindah halaman)
	if len(items) > 0 {
		itemIDs := make([]uint, len(items))
		for i := range items {
			itemIDs[i] = items[i].ID
		}
		type stockSum struct {
			ItemID   uint
			TotalQty decimal.Decimal
		}
		var sums []stockSum
		r.db.Model(&model.ItemStock{}).
			Select("item_id, COALESCE(SUM(quantity_on_hand), 0) as total_qty").
			Where("item_id IN ? AND department_id IS NULL", itemIDs).
			Group("item_id").
			Scan(&sums)

		stockMap := make(map[uint]decimal.Decimal, len(sums))
		for _, s := range sums {
			stockMap[s.ItemID] = s.TotalQty
		}

		for i := range items {
			totalQty := stockMap[items[i].ID]
			items[i].TotalStock = totalQty
			cost := items[i].StandardCost
			if cost.IsZero() {
				cost = items[i].LastPurchaseCost
			}
			items[i].StockValue = totalQty.Mul(cost)
		}
	}

	if lowStockOnly {
		var filtered []model.Item
		for _, it := range items {
			if it.TotalStock.LessThanOrEqual(it.ReorderLevel) {
				filtered = append(filtered, it)
			}
		}
		return filtered, int64(len(filtered)), nil
	}

	return items, total, nil
}

func (r *inventoryRepository) GetItemByID(id uint) (*model.Item, error) {
	var item model.Item
	err := r.db.Preload("Category").Preload("Supplier").First(&item, id).Error
	if err != nil {
		return nil, err
	}

	var totalQty decimal.Decimal
	r.db.Model(&model.ItemStock{}).Where("item_id = ? AND department_id IS NULL", item.ID).Select("COALESCE(SUM(quantity_on_hand), 0)").Scan(&totalQty)
	item.TotalStock = totalQty
	cost := item.StandardCost
	if cost.IsZero() {
		cost = item.LastPurchaseCost
	}
	item.StockValue = totalQty.Mul(cost)

	return &item, nil
}

func (r *inventoryRepository) CreateItem(item *model.Item) error {
	return r.db.Create(item).Error
}

func (r *inventoryRepository) UpdateItem(item *model.Item) error {
	return r.db.Save(item).Error
}

func (r *inventoryRepository) DeleteItem(id uint) error {
	return r.db.Delete(&model.Item{}, id).Error
}

func (r *inventoryRepository) GetLowStockCount() (int64, error) {
	var count int64
	query := `
		SELECT COUNT(DISTINCT i.id) 
		FROM items i 
		LEFT JOIN (
			SELECT item_id, COALESCE(SUM(quantity_on_hand), 0) as total_qty 
			FROM item_stocks 
			WHERE department_id IS NULL 
			GROUP BY item_id
		) s ON i.id = s.item_id 
		WHERE COALESCE(s.total_qty, 0) <= i.reorder_level
	`
	err := r.db.Raw(query).Scan(&count).Error
	return count, err
}

// ------------------- CATEGORIES -------------------

func (r *inventoryRepository) GetCategories() ([]model.ItemCategory, error) {
	var cats []model.ItemCategory
	err := r.db.Preload("Parent").Order("name ASC").Find(&cats).Error
	return cats, err
}

func (r *inventoryRepository) GetCategoryByID(id uint) (*model.ItemCategory, error) {
	var cat model.ItemCategory
	err := r.db.Preload("Parent").First(&cat, id).Error
	return &cat, err
}

func (r *inventoryRepository) CreateCategory(cat *model.ItemCategory) error {
	return r.db.Create(cat).Error
}

func (r *inventoryRepository) UpdateCategory(cat *model.ItemCategory) error {
	return r.db.Save(cat).Error
}

func (r *inventoryRepository) DeleteCategory(id uint) error {
	return r.db.Delete(&model.ItemCategory{}, id).Error
}

// ------------------- SUPPLIERS -------------------

func (r *inventoryRepository) GetSuppliers(search string) ([]model.Supplier, error) {
	query := r.db.Model(&model.Supplier{})
	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(email) LIKE ?", s, s, s)
	}
	var sups []model.Supplier
	err := query.Order("name ASC").Find(&sups).Error
	return sups, err
}

func (r *inventoryRepository) GetSupplierByID(id uint) (*model.Supplier, error) {
	var sup model.Supplier
	err := r.db.First(&sup, id).Error
	return &sup, err
}

func (r *inventoryRepository) CreateSupplier(sup *model.Supplier) error {
	return r.db.Create(sup).Error
}

func (r *inventoryRepository) UpdateSupplier(sup *model.Supplier) error {
	return r.db.Save(sup).Error
}

func (r *inventoryRepository) DeleteSupplier(id uint) error {
	return r.db.Delete(&model.Supplier{}, id).Error
}

// ------------------- PURCHASES -------------------

func (r *inventoryRepository) GetPurchasesPaginated(page, perPage int, search, status string, from, to *time.Time) ([]model.Purchase, int64, error) {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	query := r.db.Model(&model.Purchase{}).Preload("Supplier").Preload("Items").Preload("Items.Item")

	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(purchase_number) LIKE ? OR LOWER(notes) LIKE ?", s, s)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if from != nil {
		query = query.Where("purchase_date >= ?", from.Format("2006-01-02"))
	}
	if to != nil {
		query = query.Where("purchase_date <= ?", to.Format("2006-01-02"))
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var purchases []model.Purchase
	err := query.Order("purchase_date DESC, id DESC").Offset(offset).Limit(perPage).Find(&purchases).Error
	return purchases, total, err
}

func (r *inventoryRepository) GetPurchaseByID(id uint) (*model.Purchase, error) {
	var p model.Purchase
	err := r.db.Preload("Supplier").Preload("Items").Preload("Items.Item").Preload("Journal").First(&p, id).Error
	if err != nil {
		return nil, err
	}
	for i := range p.Items {
		if p.Items[i].Item != nil {
			var stockQty decimal.Decimal
			r.db.Model(&model.ItemStock{}).
				Where("item_id = ? AND department_id IS NULL", p.Items[i].ItemID).
				Select("COALESCE(SUM(quantity_on_hand), 0)").
				Scan(&stockQty)
			p.Items[i].Item.TotalStock = stockQty
		}
		if (p.Status == "received" || p.Status == "completed") && p.Items[i].QuantityReceived.IsZero() && p.Items[i].ItemStatus == "pending" {
			p.Items[i].QuantityReceived = p.Items[i].QuantityOrdered
			p.Items[i].ItemStatus = "received"
			_ = r.db.Model(&model.PurchaseItem{}).Where("id = ?", p.Items[i].ID).Updates(map[string]interface{}{
				"quantity_received": p.Items[i].QuantityOrdered,
				"item_status":       "received",
			}).Error
		}
	}
	return &p, nil
}

func (r *inventoryRepository) CreatePurchase(p *model.Purchase) error {
	return r.db.Create(p).Error
}

func (r *inventoryRepository) UpdatePurchase(p *model.Purchase) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Items", "Supplier", "Journal").Save(p).Error; err != nil {
			return err
		}
		for i := range p.Items {
			if p.Items[i].ID > 0 {
				if err := tx.Model(&model.PurchaseItem{}).Where("id = ?", p.Items[i].ID).Updates(map[string]interface{}{
					"quantity_ordered":  p.Items[i].QuantityOrdered,
					"quantity_received": p.Items[i].QuantityReceived,
					"unit_price":        p.Items[i].UnitPrice,
					"total_price":       p.Items[i].TotalPrice,
					"batch_number":      p.Items[i].BatchNumber,
					"expiry_date":       p.Items[i].ExpiryDate,
					"notes":             p.Items[i].Notes,
					"item_status":       p.Items[i].ItemStatus,
					"received_at":       p.Items[i].ReceivedAt,
				}).Error; err != nil {
					return err
				}
			} else {
				p.Items[i].PurchaseID = p.ID
				if err := tx.Create(&p.Items[i]).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *inventoryRepository) DeletePurchase(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("purchase_id = ?", id).Delete(&model.PurchaseItem{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&model.Purchase{}, id).Error
	})
}

func (r *inventoryRepository) GeneratePurchaseNumber() (string, error) {
	now := time.Now()
	prefix := fmt.Sprintf("PO/%d/%02d/", now.Year(), int(now.Month()))
	var lastNumber string
	r.db.Unscoped().Model(&model.Purchase{}).Where("purchase_number LIKE ?", prefix+"%").
		Order("id DESC").Limit(1).Pluck("purchase_number", &lastNumber)

	seq := 1
	if lastNumber != "" {
		parts := strings.Split(lastNumber, "/")
		if len(parts) >= 4 {
			var lastSeq int
			if _, err := fmt.Sscanf(parts[3], "%04d", &lastSeq); err == nil {
				seq = lastSeq + 1
			}
		}
	}
	for {
		candidate := fmt.Sprintf("%s%04d", prefix, seq)
		var cnt int64
		r.db.Unscoped().Model(&model.Purchase{}).Where("purchase_number = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		seq++
	}
}

// ------------------- PURCHASE PAYMENTS -------------------

func (r *inventoryRepository) CreatePurchasePayment(payment *model.PurchasePayment) error {
	return r.db.Create(payment).Error
}

func (r *inventoryRepository) GetPurchasePayments(purchaseID *uint) ([]model.PurchasePayment, error) {
	var payments []model.PurchasePayment
	query := r.db.Model(&model.PurchasePayment{}).Preload("Purchase").Preload("Purchase.Supplier")
	if purchaseID != nil && *purchaseID > 0 {
		query = query.Where("purchase_id = ?", *purchaseID)
	}
	err := query.Order("payment_date DESC, id DESC").Find(&payments).Error
	return payments, err
}

func (r *inventoryRepository) GetPurchasePaymentByID(id uint) (*model.PurchasePayment, error) {
	var payment model.PurchasePayment
	err := r.db.Preload("Purchase").Preload("Purchase.Supplier").First(&payment, id).Error
	return &payment, err
}

func (r *inventoryRepository) GeneratePaymentNumber() (string, error) {
	now := time.Now()
	prefix := fmt.Sprintf("PAY/%d/%02d/", now.Year(), int(now.Month()))
	var lastNumber string
	r.db.Unscoped().Model(&model.PurchasePayment{}).Where("payment_number LIKE ?", prefix+"%").
		Order("id DESC").Limit(1).Pluck("payment_number", &lastNumber)

	seq := 1
	if lastNumber != "" {
		parts := strings.Split(lastNumber, "/")
		if len(parts) >= 4 {
			var lastSeq int
			if _, err := fmt.Sscanf(parts[3], "%04d", &lastSeq); err == nil {
				seq = lastSeq + 1
			}
		}
	}
	for {
		candidate := fmt.Sprintf("%s%04d", prefix, seq)
		var cnt int64
		r.db.Unscoped().Model(&model.PurchasePayment{}).Where("payment_number = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		seq++
	}
}

// ------------------- STOCK OPERATIONS -------------------

func (r *inventoryRepository) GetItemStock(itemID uint, deptID *uint) (*model.ItemStock, error) {
	var stock model.ItemStock
	query := r.db.Where("item_id = ?", itemID)
	if deptID != nil && *deptID > 0 {
		query = query.Where("department_id = ?", *deptID)
	} else {
		query = query.Where("department_id IS NULL")
	}

	err := query.First(&stock).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			now := time.Now()
			newStock := model.ItemStock{
				ItemID:            itemID,
				DepartmentID:      deptID,
				QuantityOnHand:    decimal.Zero,
				ReservedQuantity:  decimal.Zero,
				AvailableQuantity: decimal.Zero,
				LastUpdatedAt:     &now,
			}
			if err := r.db.Create(&newStock).Error; err != nil {
				return nil, err
			}
			return &newStock, nil
		}
		return nil, err
	}
	return &stock, nil
}

func (r *inventoryRepository) UpdateItemStock(stock *model.ItemStock) error {
	now := time.Now()
	stock.LastUpdatedAt = &now
	return r.db.Save(stock).Error
}

func (r *inventoryRepository) GetStockSummary(deptID *uint) ([]model.ItemStock, error) {
	query := r.db.Preload("Item").Preload("Item.Category").Preload("Department")
	if deptID != nil {
		if *deptID > 0 {
			query = query.Where("department_id = ?", *deptID)
		} else {
			query = query.Where("department_id IS NULL")
		}
	}
	var stocks []model.ItemStock
	err := query.Order("id ASC").Find(&stocks).Error
	return stocks, err
}

// ------------------- STOCK ADJUSTMENTS -------------------

func (r *inventoryRepository) GetStockAdjustmentsPaginated(page, perPage int, search string) ([]model.StockAdjustment, int64, error) {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	query := r.db.Model(&model.StockAdjustment{}).Preload("Item").Preload("Journal")
	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(nomor_adjustment) LIKE ? OR LOWER(keterangan) LIKE ?", s, s)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var adjs []model.StockAdjustment
	err := query.Order("tanggal_adjustment DESC, id DESC").Offset(offset).Limit(perPage).Find(&adjs).Error
	return adjs, total, err
}

func (r *inventoryRepository) GetStockAdjustmentByID(id uint) (*model.StockAdjustment, error) {
	var adj model.StockAdjustment
	err := r.db.Preload("Item").Preload("Journal").First(&adj, id).Error
	return &adj, err
}

func (r *inventoryRepository) CreateStockAdjustment(adj *model.StockAdjustment) error {
	return r.db.Create(adj).Error
}

func (r *inventoryRepository) UpdateStockAdjustment(adj *model.StockAdjustment) error {
	return r.db.Save(adj).Error
}

func (r *inventoryRepository) GenerateAdjustmentNumber() (string, error) {
	now := time.Now()
	prefix := fmt.Sprintf("ADJ/%d/%02d/", now.Year(), int(now.Month()))
	var lastNumber string
	r.db.Unscoped().Model(&model.StockAdjustment{}).Where("nomor_adjustment LIKE ?", prefix+"%").
		Order("id DESC").Limit(1).Pluck("nomor_adjustment", &lastNumber)

	seq := 1
	if lastNumber != "" {
		parts := strings.Split(lastNumber, "/")
		if len(parts) >= 4 {
			var lastSeq int
			if _, err := fmt.Sscanf(parts[3], "%04d", &lastSeq); err == nil {
				seq = lastSeq + 1
			}
		}
	}
	for {
		candidate := fmt.Sprintf("%s%04d", prefix, seq)
		var cnt int64
		r.db.Unscoped().Model(&model.StockAdjustment{}).Where("nomor_adjustment = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		seq++
	}
}

// ------------------- STOCK TRANSFERS -------------------

func (r *inventoryRepository) GetStockTransfersPaginated(page, perPage int, search string) ([]model.StockTransfer, int64, error) {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	query := r.db.Model(&model.StockTransfer{}).Preload("Item").Preload("FromDepartment").Preload("ToDepartment")
	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(nomor_transfer) LIKE ? OR LOWER(keterangan) LIKE ?", s, s)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var trfs []model.StockTransfer
	err := query.Order("tanggal_transfer DESC, id DESC").Offset(offset).Limit(perPage).Find(&trfs).Error
	return trfs, total, err
}

func (r *inventoryRepository) GetStockTransferByID(id uint) (*model.StockTransfer, error) {
	var trf model.StockTransfer
	err := r.db.Preload("Item").Preload("FromDepartment").Preload("ToDepartment").First(&trf, id).Error
	return &trf, err
}

func (r *inventoryRepository) CreateStockTransfer(trf *model.StockTransfer) error {
	return r.db.Create(trf).Error
}

func (r *inventoryRepository) UpdateStockTransfer(trf *model.StockTransfer) error {
	return r.db.Save(trf).Error
}

func (r *inventoryRepository) GenerateTransferNumber() (string, error) {
	now := time.Now()
	prefix := fmt.Sprintf("TRF/%d/%02d/", now.Year(), int(now.Month()))
	var lastNumber string
	r.db.Unscoped().Model(&model.StockTransfer{}).Where("nomor_transfer LIKE ?", prefix+"%").
		Order("id DESC").Limit(1).Pluck("nomor_transfer", &lastNumber)

	seq := 1
	if lastNumber != "" {
		parts := strings.Split(lastNumber, "/")
		if len(parts) >= 4 {
			var lastSeq int
			if _, err := fmt.Sscanf(parts[3], "%04d", &lastSeq); err == nil {
				seq = lastSeq + 1
			}
		}
	}
	for {
		candidate := fmt.Sprintf("%s%04d", prefix, seq)
		var cnt int64
		r.db.Unscoped().Model(&model.StockTransfer{}).Where("nomor_transfer = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		seq++
	}
}

// ------------------- STOCK OPNAME -------------------

func (r *inventoryRepository) GetStockOpnamesPaginated(page, perPage int, search string) ([]model.StockOpname, int64, error) {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	query := r.db.Model(&model.StockOpname{}).Preload("Department").Preload("Items").Preload("Items.Item")
	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(opname_number) LIKE ? OR LOWER(notes) LIKE ?", s, s)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var opns []model.StockOpname
	err := query.Order("opname_date DESC, id DESC").Offset(offset).Limit(perPage).Find(&opns).Error
	return opns, total, err
}

func (r *inventoryRepository) GetStockOpnameByID(id uint) (*model.StockOpname, error) {
	var opn model.StockOpname
	err := r.db.Preload("Department").Preload("Items").Preload("Items.Item").First(&opn, id).Error
	return &opn, err
}

func (r *inventoryRepository) CreateStockOpname(opn *model.StockOpname) error {
	return r.db.Create(opn).Error
}

func (r *inventoryRepository) UpdateStockOpname(opn *model.StockOpname) error {
	return r.db.Save(opn).Error
}

func (r *inventoryRepository) CreateStockOpnameItem(item *model.StockOpnameItem) error {
	return r.db.Create(item).Error
}

func (r *inventoryRepository) GenerateOpnameNumber() (string, error) {
	now := time.Now()
	prefix := fmt.Sprintf("OPN/%d/%02d/", now.Year(), int(now.Month()))
	var lastNumber string
	r.db.Unscoped().Model(&model.StockOpname{}).Where("opname_number LIKE ?", prefix+"%").
		Order("id DESC").Limit(1).Pluck("opname_number", &lastNumber)

	seq := 1
	if lastNumber != "" {
		parts := strings.Split(lastNumber, "/")
		if len(parts) >= 4 {
			var lastSeq int
			if _, err := fmt.Sscanf(parts[3], "%04d", &lastSeq); err == nil {
				seq = lastSeq + 1
			}
		}
	}
	for {
		candidate := fmt.Sprintf("%s%04d", prefix, seq)
		var cnt int64
		r.db.Unscoped().Model(&model.StockOpname{}).Where("opname_number = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		seq++
	}
}

// ------------------- DASHBOARD STATS -------------------

func (r *inventoryRepository) GetDashboardStats() (map[string]interface{}, error) {
	var totalSKU int64
	r.db.Model(&model.Item{}).Count(&totalSKU)

	var totalCategories int64
	r.db.Model(&model.ItemCategory{}).Count(&totalCategories)

	var totalSuppliers int64
	r.db.Model(&model.Supplier{}).Count(&totalSuppliers)

	// Low stock count
	lowStockCount, _ := r.GetLowStockCount()

	// Total nilai persediaan
	var totalValue decimal.Decimal
	queryValue := `
		SELECT COALESCE(SUM(s.quantity_on_hand * COALESCE(NULLIF(i.standard_cost, 0), i.last_purchase_cost, 0)), 0)
		FROM item_stocks s
		JOIN items i ON s.item_id = i.id
	`
	r.db.Raw(queryValue).Scan(&totalValue)

	// Total PO bulan ini
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	var totalPOBulanIni int64
	var nominalPOBulanIni decimal.Decimal
	r.db.Model(&model.Purchase{}).
		Where("purchase_date >= ?", startOfMonth.Format("2006-01-02")).
		Count(&totalPOBulanIni)

	r.db.Model(&model.Purchase{}).
		Where("purchase_date >= ?", startOfMonth.Format("2006-01-02")).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&nominalPOBulanIni)

	// Total Hutang Pembelian (AP Outstanding)
	var totalAPOutstanding decimal.Decimal
	r.db.Model(&model.Purchase{}).
		Where("status != 'cancelled'").
		Select("COALESCE(SUM(ap_outstanding), 0)").
		Scan(&totalAPOutstanding)

	// 5 Barang dengan stok paling menipis
	var criticalItems []model.Item
	rawQuery := `
		SELECT i.*, COALESCE(s.total_qty, 0) as total_stock
		FROM items i
		LEFT JOIN (
			SELECT item_id, COALESCE(SUM(quantity_on_hand), 0) as total_qty 
			FROM item_stocks 
			GROUP BY item_id
		) s ON i.id = s.item_id
		ORDER BY (COALESCE(s.total_qty, 0) - i.reorder_level) ASC
		LIMIT 5
	`
	r.db.Raw(rawQuery).Scan(&criticalItems)

	// 5 Pembelian terbaru
	var recentPurchases []model.Purchase
	r.db.Preload("Supplier").Order("purchase_date DESC, id DESC").Limit(5).Find(&recentPurchases)

	return map[string]interface{}{
		"total_sku":             totalSKU,
		"total_categories":      totalCategories,
		"total_suppliers":       totalSuppliers,
		"low_stock_count":       lowStockCount,
		"total_inventory_value": totalValue,
		"total_po_bulan_ini":    totalPOBulanIni,
		"nominal_po_bulan_ini":  nominalPOBulanIni,
		"total_ap_outstanding":  totalAPOutstanding,
		"critical_items":        criticalItems,
		"recent_purchases":      recentPurchases,
	}, nil
}

// ------------------- STOCK REQUESTS -------------------

func (r *inventoryRepository) GetStockRequestsPaginated(page, perPage int, search string) ([]model.StockRequest, int64, error) {
	var requests []model.StockRequest
	var total int64
	query := r.db.Model(&model.StockRequest{}).Preload("Department").Preload("Items.Item")
	if search != "" {
		query = query.Where("request_number ILIKE ? OR purpose ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * perPage
	err := query.Order("id DESC").Offset(offset).Limit(perPage).Find(&requests).Error
	return requests, total, err
}

func (r *inventoryRepository) GetStockRequestByID(id uint) (*model.StockRequest, error) {
	var req model.StockRequest
	err := r.db.Preload("Department").Preload("Items.Item").First(&req, id).Error
	if err != nil {
		return nil, err
	}
	for i := range req.Items {
		if req.Items[i].Item != nil {
			var stockQty decimal.Decimal
			r.db.Model(&model.ItemStock{}).
				Where("item_id = ? AND department_id IS NULL", req.Items[i].ItemID).
				Select("COALESCE(SUM(quantity_on_hand), 0)").
				Scan(&stockQty)
			req.Items[i].Item.TotalStock = stockQty
		}
	}
	return &req, nil
}

func (r *inventoryRepository) CreateStockRequest(req *model.StockRequest) error {
	return r.db.Create(req).Error
}

func (r *inventoryRepository) UpdateStockRequest(req *model.StockRequest) error {
	return r.db.Save(req).Error
}

func (r *inventoryRepository) GenerateRequestNumber() (string, error) {
	now := time.Now()
	prefix := fmt.Sprintf("SR/%s/%s/", now.Format("2006"), now.Format("01"))
	var count int64
	r.db.Unscoped().Model(&model.StockRequest{}).Where("request_number LIKE ?", prefix+"%").Count(&count)
	seq := int(count) + 1
	for {
		candidate := fmt.Sprintf("%s%04d", prefix, seq)
		var cnt int64
		r.db.Unscoped().Model(&model.StockRequest{}).Where("request_number = ?", candidate).Count(&cnt)
		if cnt == 0 {
			return candidate, nil
		}
		seq++
	}
}
