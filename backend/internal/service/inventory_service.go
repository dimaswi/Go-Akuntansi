package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/repository"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type InventoryService interface {
	// Items
	GetItems(page, perPage int, search string, categoryID *uint, lowStockOnly bool) ([]model.Item, int64, error)
	GetItemByID(id uint) (*model.Item, error)
	CreateItem(item *model.Item) error
	UpdateItem(id uint, item *model.Item) error
	DeleteItem(id uint) error

	// Categories & Suppliers
	GetCategories() ([]model.ItemCategory, error)
	GetCategoryByID(id uint) (*model.ItemCategory, error)
	CreateCategory(cat *model.ItemCategory) error
	UpdateCategory(id uint, cat *model.ItemCategory) error
	DeleteCategory(id uint) error

	GetSuppliers(search string) ([]model.Supplier, error)
	GetSupplierByID(id uint) (*model.Supplier, error)
	CreateSupplier(sup *model.Supplier) error
	UpdateSupplier(id uint, sup *model.Supplier) error
	DeleteSupplier(id uint) error

	// Purchases
	GetPurchases(page, perPage int, search, status string, from, to *time.Time) ([]model.Purchase, int64, error)
	GetPurchaseByID(id uint) (*model.Purchase, error)
	CreatePurchase(p *model.Purchase, userID uint) error
	UpdatePurchase(id uint, p *model.Purchase) error
	ApprovePurchase(id uint, userID uint) error
	ReceivePurchase(id uint, items []ReceiveItemInput) error
	PostPurchaseToJournal(id uint, userID uint, debitAccountID uint, creditAccountID uint) (*model.Journal, error)

	// Payments
	CreatePurchasePayment(payment *model.PurchasePayment, userID uint) error
	GetPurchasePayments(purchaseID *uint) ([]model.PurchasePayment, error)
	GetPurchasePaymentByID(id uint) (*model.PurchasePayment, error)

	// Stock Operations
	GetStockSummary(deptID *uint) ([]model.ItemStock, error)

	// Stock Adjustments
	GetStockAdjustments(page, perPage int, search string) ([]model.StockAdjustment, int64, error)
	GetStockAdjustmentByID(id uint) (*model.StockAdjustment, error)
	CreateStockAdjustment(adj *model.StockAdjustment) error
	ApproveStockAdjustment(id uint, userID uint, debitAccountID *uint, creditAccountID *uint) error

	// Stock Transfers
	GetStockTransfers(page, perPage int, search string) ([]model.StockTransfer, int64, error)
	GetStockTransferByID(id uint) (*model.StockTransfer, error)
	CreateStockTransfer(trf *model.StockTransfer) error
	ReceiveStockTransfer(id uint, userID uint) error

	// Stock Opname
	GetStockOpnames(page, perPage int, search string) ([]model.StockOpname, int64, error)
	GetStockOpnameByID(id uint) (*model.StockOpname, error)
	CreateStockOpname(opn *model.StockOpname, userID uint) error
	CompleteStockOpname(id uint, userID uint, counts []OpnameCountInput) error

	// Stock Requests
	GetStockRequests(page, perPage int, search string) ([]model.StockRequest, int64, error)
	GetStockRequestByID(id uint) (*model.StockRequest, error)
	CreateStockRequest(req *model.StockRequest, userID uint) error
	ApproveStockRequest(id uint, userID uint) error
	CompleteStockRequest(id uint, userID uint) error

	// Dashboard
	GetDashboardStats() (map[string]interface{}, error)
}

type ReceiveItemInput struct {
	PurchaseItemID   uint            `json:"purchase_item_id"`
	QuantityReceived decimal.Decimal `json:"quantity_received"`
	BatchNumber      string          `json:"batch_number"`
	ExpiryDate       *string         `json:"expiry_date"`
}

type OpnameCountInput struct {
	ItemID        uint            `json:"item_id"`
	PhysicalStock decimal.Decimal `json:"physical_stock"`
	Notes         string          `json:"notes"`
}

type inventoryService struct {
	repo        repository.InventoryRepository
	journalRepo repository.JournalRepository
	accountRepo repository.AccountRepository
	db          *gorm.DB
}

func NewInventoryService(
	repo repository.InventoryRepository,
	journalRepo repository.JournalRepository,
	accountRepo repository.AccountRepository,
	db *gorm.DB,
) InventoryService {
	return &inventoryService{
		repo:        repo,
		journalRepo: journalRepo,
		accountRepo: accountRepo,
		db:          db,
	}
}

// ------------------- ITEMS -------------------

func (s *inventoryService) GetItems(page, perPage int, search string, categoryID *uint, lowStockOnly bool) ([]model.Item, int64, error) {
	return s.repo.GetItemsPaginated(page, perPage, search, categoryID, lowStockOnly)
}

func (s *inventoryService) GetItemByID(id uint) (*model.Item, error) {
	return s.repo.GetItemByID(id)
}

func (s *inventoryService) CreateItem(item *model.Item) error {
	if item.Code == "" {
		item.Code = fmt.Sprintf("ITM-%d", time.Now().UnixNano()%1000000)
	}
	return s.repo.CreateItem(item)
}

func (s *inventoryService) UpdateItem(id uint, item *model.Item) error {
	existing, err := s.repo.GetItemByID(id)
	if err != nil {
		return err
	}
	existing.Name = item.Name
	existing.Code = item.Code
	existing.CategoryID = item.CategoryID
	existing.SupplierID = item.SupplierID
	existing.DepartmentID = item.DepartmentID
	existing.Description = item.Description
	existing.UnitOfMeasure = item.UnitOfMeasure
	existing.ReorderLevel = item.ReorderLevel
	existing.MaxLevel = item.MaxLevel
	existing.SafetyStock = item.SafetyStock
	existing.StandardCost = item.StandardCost
	existing.LastPurchaseCost = item.LastPurchaseCost
	existing.IsActive = item.IsActive
	return s.repo.UpdateItem(existing)
}

func (s *inventoryService) DeleteItem(id uint) error {
	return s.repo.DeleteItem(id)
}

// ------------------- CATEGORIES & SUPPLIERS -------------------

func (s *inventoryService) GetCategories() ([]model.ItemCategory, error) {
	return s.repo.GetCategories()
}

func (s *inventoryService) GetCategoryByID(id uint) (*model.ItemCategory, error) {
	return s.repo.GetCategoryByID(id)
}

func (s *inventoryService) CreateCategory(cat *model.ItemCategory) error {
	return s.repo.CreateCategory(cat)
}

func (s *inventoryService) UpdateCategory(id uint, cat *model.ItemCategory) error {
	existing, err := s.repo.GetCategoryByID(id)
	if err != nil {
		return err
	}
	existing.Name = cat.Name
	existing.Code = cat.Code
	existing.Description = cat.Description
	if cat.CategoryType != "" {
		existing.CategoryType = cat.CategoryType
	}
	existing.IsActive = cat.IsActive
	return s.repo.UpdateCategory(existing)
}

func (s *inventoryService) DeleteCategory(id uint) error {
	return s.repo.DeleteCategory(id)
}

func (s *inventoryService) GetSuppliers(search string) ([]model.Supplier, error) {
	return s.repo.GetSuppliers(search)
}

func (s *inventoryService) GetSupplierByID(id uint) (*model.Supplier, error) {
	return s.repo.GetSupplierByID(id)
}

func (s *inventoryService) CreateSupplier(sup *model.Supplier) error {
	return s.repo.CreateSupplier(sup)
}

func (s *inventoryService) UpdateSupplier(id uint, sup *model.Supplier) error {
	existing, err := s.repo.GetSupplierByID(id)
	if err != nil {
		return err
	}
	existing.Name = sup.Name
	existing.Address = sup.Address
	existing.Phone = sup.Phone
	existing.Email = sup.Email
	existing.IsActive = sup.IsActive
	return s.repo.UpdateSupplier(existing)
}

func (s *inventoryService) DeleteSupplier(id uint) error {
	return s.repo.DeleteSupplier(id)
}

// ------------------- PURCHASES -------------------

func (s *inventoryService) GetPurchases(page, perPage int, search, status string, from, to *time.Time) ([]model.Purchase, int64, error) {
	return s.repo.GetPurchasesPaginated(page, perPage, search, status, from, to)
}

func (s *inventoryService) GetPurchaseByID(id uint) (*model.Purchase, error) {
	return s.repo.GetPurchaseByID(id)
}

func (s *inventoryService) CreatePurchase(p *model.Purchase, userID uint) error {
	if p.PurchaseNumber == "" {
		no, err := s.repo.GeneratePurchaseNumber()
		if err != nil {
			return err
		}
		p.PurchaseNumber = no
	}

	p.CreatedBy = userID
	p.Status = "draft"

	// Hitung total nilai baris item
	var subtotal decimal.Decimal
	for i := range p.Items {
		total := p.Items[i].QuantityOrdered.Mul(p.Items[i].UnitPrice)
		p.Items[i].TotalPrice = total
		p.Items[i].ItemStatus = "draft"
		subtotal = subtotal.Add(total)
	}
	p.Subtotal = subtotal
	total := subtotal.Add(p.TaxAmount).Add(p.ShippingCost).Sub(p.DiscountAmount)
	p.TotalAmount = total
	p.ApOutstanding = total

	return s.repo.CreatePurchase(p)
}

func (s *inventoryService) ApprovePurchase(id uint, userID uint) error {
	p, err := s.repo.GetPurchaseByID(id)
	if err != nil {
		return err
	}
	now := time.Now()
	p.Status = "ordered"
	p.ApprovedBy = &userID
	p.ApprovedAt = &now
	p.OrderedAt = &now
	for i := range p.Items {
		if p.Items[i].ItemStatus == "" || p.Items[i].ItemStatus == "pending" || p.Items[i].ItemStatus == "draft" {
			p.Items[i].ItemStatus = "ordered"
		}
	}
	return s.repo.UpdatePurchase(p)
}

func (s *inventoryService) ReceivePurchase(id uint, items []ReceiveItemInput) error {
	p, err := s.repo.GetPurchaseByID(id)
	if err != nil {
		return err
	}
	if p.Status == "draft" {
		return errors.New("PO masih berstatus draft, harap setujui PO terlebih dahulu sebelum menerima barang")
	}

	allReceived := true
	now := time.Now()

	for _, itemInput := range items {
		for i := range p.Items {
			if p.Items[i].ID == itemInput.PurchaseItemID {
				newReceived := p.Items[i].QuantityReceived.Add(itemInput.QuantityReceived)
				p.Items[i].QuantityReceived = newReceived
				p.Items[i].BatchNumber = itemInput.BatchNumber
				p.Items[i].ReceivedAt = &now
				if newReceived.GreaterThanOrEqual(p.Items[i].QuantityOrdered) {
					p.Items[i].ItemStatus = "received"
				} else if newReceived.GreaterThan(decimal.Zero) {
					p.Items[i].ItemStatus = "partial"
				}

				// Tambahkan stok fisik ke Gudang Pusat (department_id = nil)
				stock, err := s.repo.GetItemStock(p.Items[i].ItemID, nil)
				if err == nil {
					stock.QuantityOnHand = stock.QuantityOnHand.Add(itemInput.QuantityReceived)
					stock.AvailableQuantity = stock.QuantityOnHand.Sub(stock.ReservedQuantity)
					stock.LastUnitCost = p.Items[i].UnitPrice
					stock.TotalValue = stock.QuantityOnHand.Mul(stock.LastUnitCost)
					_ = s.repo.UpdateItemStock(stock)
				}

				// Update last purchase cost pada master item
				masterItem, err := s.repo.GetItemByID(p.Items[i].ItemID)
				if err == nil {
					masterItem.LastPurchaseCost = p.Items[i].UnitPrice
					_ = s.repo.UpdateItem(masterItem)
				}
			}
		}
	}

	for i := range p.Items {
		if p.Items[i].QuantityReceived.LessThan(p.Items[i].QuantityOrdered) {
			allReceived = false
			break
		}
	}

	if allReceived {
		p.Status = "received"
		p.ActualDeliveryDate = &now
		p.CompletedAt = &now
	}

	return s.repo.UpdatePurchase(p)
}

func (s *inventoryService) GetPurchasePayments(purchaseID *uint) ([]model.PurchasePayment, error) {
	return s.repo.GetPurchasePayments(purchaseID)
}

func (s *inventoryService) GetPurchasePaymentByID(id uint) (*model.PurchasePayment, error) {
	return s.repo.GetPurchasePaymentByID(id)
}

func (s *inventoryService) PostPurchaseToJournal(id uint, userID uint, debitAccountID uint, creditAccountID uint) (*model.Journal, error) {
	p, err := s.repo.GetPurchaseByID(id)
	if err != nil {
		return nil, err
	}
	if p.Status == "draft" {
		return nil, errors.New("PO masih berstatus draft, harap setujui dan proses penerimaan barang terlebih dahulu")
	}
	if p.JurnalPosted {
		return nil, errors.New("pembelian ini sudah pernah diposting ke jurnal")
	}

	now := time.Now()
	// Format nomor jurnal: JUR/YYYY/MM/PO-XXXX (pastikan unik)
	nomorJurnal := fmt.Sprintf("JUR/%d/%02d/PO-%d", now.Year(), int(now.Month()), p.ID)
	var cnt int64
	s.db.Unscoped().Model(&model.Journal{}).Where("nomor_jurnal = ?", nomorJurnal).Count(&cnt)
	if cnt > 0 {
		nomorJurnal = fmt.Sprintf("JUR/%d/%02d/PO-%d-%d", now.Year(), int(now.Month()), p.ID, now.Unix()%10000)
	}

	journal := model.Journal{
		NomorJurnal:      nomorJurnal,
		TanggalTransaksi: p.PurchaseDate,
		Keterangan:       fmt.Sprintf("Pencatatan Hutang Pengadaan Barang PO: %s (%s)", p.PurchaseNumber, p.Notes),
		JenisReferensi:   "purchase",
		NomorReferensi:   p.PurchaseNumber,
		JenisJurnal:      model.JenisJurnalUmum,
		Status:           model.StatusPosted,
		DibuatOleh:       userID,
		DipostingOleh:    &userID,
		TanggalPosting:   &now,
		TotalDebit:       p.TotalAmount,
		TotalKredit:      p.TotalAmount,
		Details: []model.JournalDetail{
			{
				DaftarAkunID: debitAccountID, // Akun Persediaan Barang (Debit)
				JumlahDebit:  p.TotalAmount,
				JumlahKredit: decimal.Zero,
				Keterangan:   fmt.Sprintf("Persediaan PO %s", p.PurchaseNumber),
			},
			{
				DaftarAkunID: creditAccountID, // Akun Hutang Usaha / Supplier (Kredit)
				JumlahDebit:  decimal.Zero,
				JumlahKredit: p.TotalAmount,
				Keterangan:   fmt.Sprintf("Hutang Dagang PO %s", p.PurchaseNumber),
			},
		},
	}

	if err := s.journalRepo.CreateWithDetails(&journal); err != nil {
		return nil, err
	}

	p.JurnalID = &journal.ID
	p.JurnalPosted = true
	if err := s.repo.UpdatePurchase(p); err != nil {
		return nil, err
	}

	return &journal, nil
}

// ------------------- PAYMENTS -------------------

func (s *inventoryService) CreatePurchasePayment(payment *model.PurchasePayment, userID uint) error {
	p, err := s.repo.GetPurchaseByID(payment.PurchaseID)
	if err != nil {
		return err
	}
	if p.Status == "draft" {
		return errors.New("PO masih berstatus draft, tidak dapat melakukan pembayaran")
	}

	payment.CreatedBy = userID
	if payment.PaymentNumber == "" {
		no, err := s.repo.GeneratePaymentNumber()
		if err != nil {
			return err
		}
		payment.PaymentNumber = no
	}

	if err := s.repo.CreatePurchasePayment(payment); err != nil {
		return err
	}

	// Update AP purchase
	p.ApOutstanding = p.ApOutstanding.Sub(payment.Amount)
	if p.ApOutstanding.LessThanOrEqual(decimal.Zero) {
		p.ApOutstanding = decimal.Zero
	}
	return s.repo.UpdatePurchase(p)
}

// ------------------- STOCK OPERATIONS -------------------

func (s *inventoryService) GetStockSummary(deptID *uint) ([]model.ItemStock, error) {
	return s.repo.GetStockSummary(deptID)
}

// ------------------- STOCK ADJUSTMENTS -------------------

func (s *inventoryService) GetStockAdjustments(page, perPage int, search string) ([]model.StockAdjustment, int64, error) {
	return s.repo.GetStockAdjustmentsPaginated(page, perPage, search)
}

func (s *inventoryService) GetStockAdjustmentByID(id uint) (*model.StockAdjustment, error) {
	return s.repo.GetStockAdjustmentByID(id)
}

func (s *inventoryService) CreateStockAdjustment(adj *model.StockAdjustment) error {
	if adj.NomorAdjustment == "" {
		no, err := s.repo.GenerateAdjustmentNumber()
		if err != nil {
			return err
		}
		adj.NomorAdjustment = no
	}
	adj.TotalAmount = adj.UnitPrice.Mul(decimal.NewFromInt(int64(adj.Quantity)))
	adj.Status = "draft"
	return s.repo.CreateStockAdjustment(adj)
}

func (s *inventoryService) ApproveStockAdjustment(id uint, userID uint, debitAccountID *uint, creditAccountID *uint) error {
	adj, err := s.repo.GetStockAdjustmentByID(id)
	if err != nil {
		return err
	}

	now := time.Now()
	adj.Status = "approved"
	adj.ApprovedBy = &userID
	adj.ApprovedAt = &now

	// Update stok fisik (gudang pusat)
	stock, err := s.repo.GetItemStock(adj.ItemID, nil)
	if err == nil {
		qtyDec := decimal.NewFromInt(int64(adj.Quantity))
		if adj.TipeAdjustment == "overage" || adj.TipeAdjustment == "increase" {
			stock.QuantityOnHand = stock.QuantityOnHand.Add(qtyDec)
		} else {
			stock.QuantityOnHand = stock.QuantityOnHand.Sub(qtyDec)
		}
		stock.AvailableQuantity = stock.QuantityOnHand.Sub(stock.ReservedQuantity)
		stock.TotalValue = stock.QuantityOnHand.Mul(stock.LastUnitCost)
		_ = s.repo.UpdateItemStock(stock)
	}

	// Opsional: posting jurnal selisih persediaan
	if debitAccountID != nil && creditAccountID != nil && !adj.TotalAmount.IsZero() {
		nomorJurnal := fmt.Sprintf("JUR/%d/%02d/ADJ-%d", now.Year(), int(now.Month()), adj.ID)
		var cnt int64
		s.db.Unscoped().Model(&model.Journal{}).Where("nomor_jurnal = ?", nomorJurnal).Count(&cnt)
		if cnt > 0 {
			nomorJurnal = fmt.Sprintf("JUR/%d/%02d/ADJ-%d-%d", now.Year(), int(now.Month()), adj.ID, now.Unix()%10000)
		}
		journal := model.Journal{
			NomorJurnal:      nomorJurnal,
			TanggalTransaksi: adj.TanggalAdjustment,
			Keterangan:       fmt.Sprintf("Penyesuaian Stok Barang (%s): %s", adj.NomorAdjustment, adj.Keterangan),
			JenisReferensi:   "adjustment",
			NomorReferensi:   adj.NomorAdjustment,
			JenisJurnal:      model.JenisJurnalPenyesuaian,
			Status:           model.StatusPosted,
			DibuatOleh:       userID,
			DipostingOleh:    &userID,
			TanggalPosting:   &now,
			TotalDebit:       adj.TotalAmount,
			TotalKredit:      adj.TotalAmount,
			Details: []model.JournalDetail{
				{
					DaftarAkunID: *debitAccountID,
					JumlahDebit:  adj.TotalAmount,
					JumlahKredit: decimal.Zero,
					Keterangan:   fmt.Sprintf("Penyesuaian Stok %s", adj.NomorAdjustment),
				},
				{
					DaftarAkunID: *creditAccountID,
					JumlahDebit:  decimal.Zero,
					JumlahKredit: adj.TotalAmount,
					Keterangan:   fmt.Sprintf("Penyesuaian Stok %s", adj.NomorAdjustment),
				},
			},
		}
		if err := s.journalRepo.CreateWithDetails(&journal); err == nil {
			adj.JurnalID = &journal.ID
			adj.JurnalPosted = true
		}
	}

	return s.repo.UpdateStockAdjustment(adj)
}

// ------------------- STOCK TRANSFERS -------------------

func (s *inventoryService) GetStockTransfers(page, perPage int, search string) ([]model.StockTransfer, int64, error) {
	return s.repo.GetStockTransfersPaginated(page, perPage, search)
}

func (s *inventoryService) GetStockTransferByID(id uint) (*model.StockTransfer, error) {
	return s.repo.GetStockTransferByID(id)
}

func (s *inventoryService) CreateStockTransfer(trf *model.StockTransfer) error {
	if trf.NomorTransfer == "" {
		no, err := s.repo.GenerateTransferNumber()
		if err != nil {
			return err
		}
		trf.NomorTransfer = no
	}
	trf.Status = "pending"
	return s.repo.CreateStockTransfer(trf)
}

func (s *inventoryService) ReceiveStockTransfer(id uint, userID uint) error {
	trf, err := s.repo.GetStockTransferByID(id)
	if err != nil {
		return err
	}

	now := time.Now()
	trf.Status = "received"
	trf.ReceivedBy = &userID
	trf.ReceivedAt = &now

	// Kurangi stok dari gudang/departemen asal
	qtyDec := decimal.NewFromInt(int64(trf.Quantity))
	fromStock, err := s.repo.GetItemStock(trf.ItemID, trf.FromDepartmentID)
	if err == nil {
		fromStock.QuantityOnHand = fromStock.QuantityOnHand.Sub(qtyDec)
		fromStock.AvailableQuantity = fromStock.QuantityOnHand.Sub(fromStock.ReservedQuantity)
		_ = s.repo.UpdateItemStock(fromStock)
	}

	// Tambahkan stok ke departemen tujuan
	toDeptID := trf.ToDepartmentID
	toStock, err := s.repo.GetItemStock(trf.ItemID, &toDeptID)
	if err == nil {
		toStock.QuantityOnHand = toStock.QuantityOnHand.Add(qtyDec)
		toStock.AvailableQuantity = toStock.QuantityOnHand.Sub(toStock.ReservedQuantity)
		_ = s.repo.UpdateItemStock(toStock)
	}

	return s.repo.UpdateStockTransfer(trf)
}

// ------------------- STOCK OPNAME -------------------

func (s *inventoryService) GetStockOpnames(page, perPage int, search string) ([]model.StockOpname, int64, error) {
	return s.repo.GetStockOpnamesPaginated(page, perPage, search)
}

func (s *inventoryService) GetStockOpnameByID(id uint) (*model.StockOpname, error) {
	return s.repo.GetStockOpnameByID(id)
}

func (s *inventoryService) CreateStockOpname(opn *model.StockOpname, userID uint) error {
	if opn.OpnameNumber == "" {
		no, err := s.repo.GenerateOpnameNumber()
		if err != nil {
			return err
		}
		opn.OpnameNumber = no
	}
	opn.CreatedBy = userID
	opn.Status = "draft"
	return s.repo.CreateStockOpname(opn)
}

func (s *inventoryService) CompleteStockOpname(id uint, userID uint, counts []OpnameCountInput) error {
	opn, err := s.repo.GetStockOpnameByID(id)
	if err != nil {
		return err
	}

	now := time.Now()
	opn.Status = "completed"
	opn.ApprovedBy = &userID
	opn.ApprovedAt = &now
	opn.TotalItemsCounted = len(counts)

	var totalVariance decimal.Decimal
	for _, c := range counts {
		stock, _ := s.repo.GetItemStock(c.ItemID, opn.DepartmentID)
		systemQty := decimal.Zero
		cost := decimal.Zero
		if stock != nil {
			systemQty = stock.QuantityOnHand
			cost = stock.LastUnitCost
		}
		diff := c.PhysicalStock.Sub(systemQty)
		varVal := diff.Mul(cost)
		totalVariance = totalVariance.Add(varVal)

		// Simpan detail opname
		opnItem := model.StockOpnameItem{
			StockOpnameID:    opn.ID,
			ItemID:           c.ItemID,
			SystemQuantity:   systemQty,
			PhysicalQuantity: c.PhysicalStock,
			Variance:         diff,
			UnitPrice:        cost,
			VarianceValue:    varVal,
			Notes:            c.Notes,
		}
		_ = s.repo.CreateStockOpnameItem(&opnItem)

		// Sesuaikan fisik stok dengan hasil opname
		if stock != nil {
			stock.QuantityOnHand = c.PhysicalStock
			stock.AvailableQuantity = c.PhysicalStock.Sub(stock.ReservedQuantity)
			_ = s.repo.UpdateItemStock(stock)
		}
	}

	opn.TotalVarianceValue = totalVariance
	return s.repo.UpdateStockOpname(opn)
}

// ------------------- DASHBOARD -------------------

func (s *inventoryService) GetDashboardStats() (map[string]interface{}, error) {
	return s.repo.GetDashboardStats()
}

func (s *inventoryService) UpdatePurchase(id uint, p *model.Purchase) error {
	existing, err := s.repo.GetPurchaseByID(id)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return fmt.Errorf("hanya purchase order berstatus draft yang dapat diubah")
	}
	p.ID = id
	return s.repo.UpdatePurchase(p)
}

// ------------------- STOCK REQUESTS -------------------

func (s *inventoryService) GetStockRequests(page, perPage int, search string) ([]model.StockRequest, int64, error) {
	return s.repo.GetStockRequestsPaginated(page, perPage, search)
}

func (s *inventoryService) GetStockRequestByID(id uint) (*model.StockRequest, error) {
	return s.repo.GetStockRequestByID(id)
}

func (s *inventoryService) CreateStockRequest(req *model.StockRequest, userID uint) error {
	num, err := s.repo.GenerateRequestNumber()
	if err != nil {
		return err
	}
	req.RequestNumber = num
	req.RequestedBy = userID
	req.Status = "submitted"
	return s.repo.CreateStockRequest(req)
}

func (s *inventoryService) ApproveStockRequest(id uint, userID uint) error {
	req, err := s.repo.GetStockRequestByID(id)
	if err != nil {
		return err
	}
	now := time.Now()
	req.Status = "approved"
	req.ApprovedBy = &userID
	req.ApprovedAt = &now
	return s.repo.UpdateStockRequest(req)
}

func (s *inventoryService) CompleteStockRequest(id uint, userID uint) error {
	req, err := s.repo.GetStockRequestByID(id)
	if err != nil {
		return err
	}
	if strings.ToLower(req.Status) != "approved" {
		return fmt.Errorf("hanya permintaan stok dengan status APPROVED yang dapat diserahkan. Status saat ini: %s", req.Status)
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()

		for i := range req.Items {
			it := &req.Items[i]
			qtyToIssue := it.QuantityApproved
			if qtyToIssue.IsZero() {
				qtyToIssue = it.QuantityRequested
			}
			if qtyToIssue.IsZero() {
				continue
			}

			// 1. Kurangi stok fisik Gudang Pusat (department_id IS NULL)
			centralStock, err := s.repo.GetItemStock(it.ItemID, nil)
			if err != nil {
				return err
			}
			centralStock.QuantityOnHand = centralStock.QuantityOnHand.Sub(qtyToIssue)
			centralStock.AvailableQuantity = centralStock.QuantityOnHand.Sub(centralStock.ReservedQuantity)
			cost := centralStock.LastUnitCost
			if cost.IsZero() {
				cost = centralStock.AverageUnitCost
			}
			if cost.IsZero() && it.Item != nil {
				cost = it.Item.StandardCost
			}
			centralStock.TotalValue = centralStock.QuantityOnHand.Mul(cost)
			centralStock.LastUpdatedAt = &now
			if err := tx.Save(centralStock).Error; err != nil {
				return err
			}

			// 2. Tambah stok fisik Unit Pemohon (department_id = req.DepartmentID)
			deptID := req.DepartmentID
			deptStock, err := s.repo.GetItemStock(it.ItemID, &deptID)
			if err != nil {
				return err
			}
			deptStock.QuantityOnHand = deptStock.QuantityOnHand.Add(qtyToIssue)
			deptStock.AvailableQuantity = deptStock.QuantityOnHand.Sub(deptStock.ReservedQuantity)
			deptStock.LastUnitCost = cost
			deptStock.AverageUnitCost = cost
			deptStock.TotalValue = deptStock.QuantityOnHand.Mul(cost)
			deptStock.LastUpdatedAt = &now
			if err := tx.Save(deptStock).Error; err != nil {
				return err
			}

			// 3. Update rincian item permintaan stok
			it.QuantityIssued = qtyToIssue
			it.UnitCost = cost
			it.TotalCost = qtyToIssue.Mul(cost)
			if err := tx.Save(it).Error; err != nil {
				return err
			}
		}

		// 4. Update status permintaan stok menjadi "completed"
		if err := tx.Model(&model.StockRequest{}).Where("id = ?", req.ID).Updates(map[string]interface{}{
			"status":       "completed",
			"completed_by": userID,
			"completed_at": now,
		}).Error; err != nil {
			return err
		}

		return nil
	})
}
