package handler

import (
	"net/http"
	"strconv"
	"time"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type InventoryHandler struct {
	svc service.InventoryService
}

func NewInventoryHandler(svc service.InventoryService) *InventoryHandler {
	return &InventoryHandler{svc: svc}
}

// ------------------- DASHBOARD -------------------

func (h *InventoryHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.svc.GetDashboardStats()
	if err != nil {
		response.InternalError(c, "Gagal mengambil statistik inventory", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil statistik inventory", stats)
}

// ------------------- ITEMS -------------------

func (h *InventoryHandler) GetItems(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	lowStock := c.Query("low_stock") == "true"

	var categoryID *uint
	if catStr := c.Query("category_id"); catStr != "" {
		if cid, err := strconv.ParseUint(catStr, 10, 32); err == nil && cid > 0 {
			u := uint(cid)
			categoryID = &u
		}
	}

	items, total, err := h.svc.GetItems(page, perPage, search, categoryID, lowStock)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data barang", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil data barang",
		"data":    items,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *InventoryHandler) GetItemByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID barang tidak valid", err)
		return
	}

	item, err := h.svc.GetItemByID(uint(id))
	if err != nil {
		response.NotFound(c, "Barang tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail barang", item)
}

type ItemInput struct {
	Code             string          `json:"code"`
	Name             string          `json:"name" binding:"required"`
	CategoryID       *uint           `json:"category_id"`
	SupplierID       *uint           `json:"supplier_id"`
	DepartmentID     *uint           `json:"department_id"`
	Description      string          `json:"description"`
	UnitOfMeasure    string          `json:"unit_of_measure"`
	ReorderLevel     decimal.Decimal `json:"reorder_level"`
	MaxLevel         decimal.Decimal `json:"max_level"`
	SafetyStock      decimal.Decimal `json:"safety_stock"`
	StandardCost     decimal.Decimal `json:"standard_cost"`
	LastPurchaseCost decimal.Decimal `json:"last_purchase_cost"`
	IsActive         *bool           `json:"is_active"`
}

func (h *InventoryHandler) CreateItem(c *gin.Context) {
	var input ItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input barang tidak valid", err)
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}
	if input.UnitOfMeasure == "" {
		input.UnitOfMeasure = "PCS"
	}

	item := model.Item{
		Code:             input.Code,
		Name:             input.Name,
		CategoryID:       input.CategoryID,
		SupplierID:       input.SupplierID,
		DepartmentID:     input.DepartmentID,
		Description:      input.Description,
		UnitOfMeasure:    input.UnitOfMeasure,
		ReorderLevel:     input.ReorderLevel,
		MaxLevel:         input.MaxLevel,
		SafetyStock:      input.SafetyStock,
		StandardCost:     input.StandardCost,
		LastPurchaseCost: input.LastPurchaseCost,
		IsActive:         isActive,
	}

	if err := h.svc.CreateItem(&item); err != nil {
		response.InternalError(c, "Gagal menambahkan barang", err)
		return
	}
	response.Success(c, http.StatusCreated, "Barang berhasil ditambahkan", item)
}

func (h *InventoryHandler) UpdateItem(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID barang tidak valid", err)
		return
	}

	var input ItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	item := model.Item{
		Code:             input.Code,
		Name:             input.Name,
		CategoryID:       input.CategoryID,
		SupplierID:       input.SupplierID,
		DepartmentID:     input.DepartmentID,
		Description:      input.Description,
		UnitOfMeasure:    input.UnitOfMeasure,
		ReorderLevel:     input.ReorderLevel,
		MaxLevel:         input.MaxLevel,
		SafetyStock:      input.SafetyStock,
		StandardCost:     input.StandardCost,
		LastPurchaseCost: input.LastPurchaseCost,
		IsActive:         isActive,
	}

	if err := h.svc.UpdateItem(uint(id), &item); err != nil {
		response.InternalError(c, "Gagal mengupdate barang", err)
		return
	}
	response.Success(c, http.StatusOK, "Barang berhasil diperbarui", item)
}

func (h *InventoryHandler) DeleteItem(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID barang tidak valid", err)
		return
	}

	if err := h.svc.DeleteItem(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus barang", err)
		return
	}
	response.Success(c, http.StatusOK, "Barang berhasil dihapus", nil)
}

// ------------------- CATEGORIES -------------------

func (h *InventoryHandler) GetCategories(c *gin.Context) {
	cats, err := h.svc.GetCategories()
	if err != nil {
		response.InternalError(c, "Gagal mengambil kategori", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil kategori", cats)
}

func (h *InventoryHandler) GetCategoryByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID kategori tidak valid", err)
		return
	}
	cat, err := h.svc.GetCategoryByID(uint(id))
	if err != nil {
		response.NotFound(c, "Kategori tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail kategori", cat)
}

func (h *InventoryHandler) CreateCategory(c *gin.Context) {
	var cat model.ItemCategory
	if err := c.ShouldBindJSON(&cat); err != nil {
		response.BadRequest(c, "Data kategori tidak valid", err)
		return
	}
	if err := h.svc.CreateCategory(&cat); err != nil {
		response.InternalError(c, "Gagal membuat kategori", err)
		return
	}
	response.Success(c, http.StatusCreated, "Kategori berhasil dibuat", cat)
}

func (h *InventoryHandler) UpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID kategori tidak valid", err)
		return
	}

	var cat model.ItemCategory
	if err := c.ShouldBindJSON(&cat); err != nil {
		response.BadRequest(c, "Data kategori tidak valid", err)
		return
	}

	if err := h.svc.UpdateCategory(uint(id), &cat); err != nil {
		response.InternalError(c, "Gagal memperbarui kategori", err)
		return
	}
	response.Success(c, http.StatusOK, "Kategori berhasil diperbarui", cat)
}

func (h *InventoryHandler) DeleteCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID kategori tidak valid", err)
		return
	}

	if err := h.svc.DeleteCategory(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus kategori", err)
		return
	}
	response.Success(c, http.StatusOK, "Kategori berhasil dihapus", nil)
}

// ------------------- SUPPLIERS -------------------

func (h *InventoryHandler) GetSuppliers(c *gin.Context) {
	search := c.Query("search")
	sups, err := h.svc.GetSuppliers(search)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data supplier", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil data supplier", sups)
}

func (h *InventoryHandler) GetSupplierByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID supplier tidak valid", err)
		return
	}
	sup, err := h.svc.GetSupplierByID(uint(id))
	if err != nil {
		response.NotFound(c, "Supplier tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail supplier", sup)
}

func (h *InventoryHandler) CreateSupplier(c *gin.Context) {
	var sup model.Supplier
	if err := c.ShouldBindJSON(&sup); err != nil {
		response.BadRequest(c, "Data supplier tidak valid", err)
		return
	}
	if err := h.svc.CreateSupplier(&sup); err != nil {
		response.InternalError(c, "Gagal menambahkan supplier", err)
		return
	}
	response.Success(c, http.StatusCreated, "Supplier berhasil ditambahkan", sup)
}

func (h *InventoryHandler) UpdateSupplier(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID supplier tidak valid", err)
		return
	}

	var sup model.Supplier
	if err := c.ShouldBindJSON(&sup); err != nil {
		response.BadRequest(c, "Data supplier tidak valid", err)
		return
	}

	if err := h.svc.UpdateSupplier(uint(id), &sup); err != nil {
		response.InternalError(c, "Gagal memperbarui supplier", err)
		return
	}
	response.Success(c, http.StatusOK, "Supplier berhasil diperbarui", sup)
}

func (h *InventoryHandler) DeleteSupplier(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID supplier tidak valid", err)
		return
	}

	if err := h.svc.DeleteSupplier(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus supplier", err)
		return
	}
	response.Success(c, http.StatusOK, "Supplier berhasil dihapus", nil)
}

// ------------------- PURCHASES -------------------

func (h *InventoryHandler) GetPurchases(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	status := c.Query("status")

	var from, to *time.Time
	if fromStr := c.Query("from_date"); fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			from = &t
		}
	}
	if toStr := c.Query("to_date"); toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			to = &t
		}
	}

	purchases, total, err := h.svc.GetPurchases(page, perPage, search, status, from, to)
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar pembelian", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil daftar pembelian",
		"data":    purchases,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *InventoryHandler) GetPurchaseByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID pembelian tidak valid", err)
		return
	}

	p, err := h.svc.GetPurchaseByID(uint(id))
	if err != nil {
		response.NotFound(c, "Pembelian tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail pembelian", p)
}

type CreatePurchaseInput struct {
	SupplierID           uint                 `json:"supplier_id" binding:"required"`
	PurchaseDate         string               `json:"purchase_date" binding:"required"`
	ExpectedDeliveryDate *string              `json:"expected_delivery_date"`
	PaymentTerms         string               `json:"payment_terms"`
	Notes                string               `json:"notes"`
	TaxAmount            decimal.Decimal      `json:"tax_amount"`
	ShippingCost         decimal.Decimal      `json:"shipping_cost"`
	DiscountAmount       decimal.Decimal      `json:"discount_amount"`
	Items                []PurchaseItemInput `json:"items" binding:"required,dive"`
}

type PurchaseItemInput struct {
	ItemID          uint            `json:"item_id" binding:"required"`
	QuantityOrdered decimal.Decimal `json:"quantity_ordered" binding:"required"`
	UnitPrice       decimal.Decimal `json:"unit_price" binding:"required"`
	Notes           string          `json:"notes"`
}

func (h *InventoryHandler) CreatePurchase(c *gin.Context) {
	var input CreatePurchaseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input pembelian tidak valid", err)
		return
	}

	pDate, err := time.Parse("2006-01-02", input.PurchaseDate)
	if err != nil {
		pDate = time.Now()
	}

	var expDelivery *time.Time
	if input.ExpectedDeliveryDate != nil && *input.ExpectedDeliveryDate != "" {
		if t, err := time.Parse("2006-01-02", *input.ExpectedDeliveryDate); err == nil {
			expDelivery = &t
		}
	}

	var items []model.PurchaseItem
	for _, it := range input.Items {
		items = append(items, model.PurchaseItem{
			ItemID:          it.ItemID,
			QuantityOrdered: it.QuantityOrdered,
			UnitPrice:       it.UnitPrice,
			Notes:           it.Notes,
		})
	}

	p := model.Purchase{
		SupplierID:           input.SupplierID,
		PurchaseDate:         pDate,
		ExpectedDeliveryDate: expDelivery,
		PaymentTerms:         input.PaymentTerms,
		Notes:                input.Notes,
		TaxAmount:            input.TaxAmount,
		ShippingCost:         input.ShippingCost,
		DiscountAmount:       input.DiscountAmount,
		Items:                items,
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CreatePurchase(&p, userID); err != nil {
		response.InternalError(c, "Gagal membuat pengadaan/PO", err)
		return
	}

	response.Success(c, http.StatusCreated, "Pengadaan/PO berhasil dibuat", p)
}

func (h *InventoryHandler) UpdatePurchase(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID pembelian tidak valid", err)
		return
	}

	var input struct {
		SupplierID           uint       `json:"supplier_id"`
		PurchaseDate         string     `json:"purchase_date"`
		ExpectedDeliveryDate *string    `json:"expected_delivery_date"`
		Notes                string     `json:"notes"`
		PaymentTerms         string     `json:"payment_terms"`
		Items                []struct {
			ItemID          uint    `json:"item_id"`
			QuantityOrdered float64 `json:"quantity_ordered"`
			UnitPrice       float64 `json:"unit_price"`
			Notes           string  `json:"notes"`
		} `json:"items"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	existing, err := h.svc.GetPurchaseByID(uint(id))
	if err != nil {
		response.NotFound(c, "Purchase order tidak ditemukan")
		return
	}

	if input.SupplierID > 0 {
		existing.SupplierID = input.SupplierID
	}
	if input.PurchaseDate != "" {
		if t, err := time.Parse("2006-01-02", input.PurchaseDate); err == nil {
			existing.PurchaseDate = t
		}
	}
	if input.ExpectedDeliveryDate != nil && *input.ExpectedDeliveryDate != "" {
		if t, err := time.Parse("2006-01-02", *input.ExpectedDeliveryDate); err == nil {
			existing.ExpectedDeliveryDate = &t
		}
	}
	existing.Notes = input.Notes
	if input.PaymentTerms != "" {
		existing.PaymentTerms = input.PaymentTerms
	}

	if len(input.Items) > 0 {
		var pItems []model.PurchaseItem
		subtotal := decimal.Zero
		for _, it := range input.Items {
			qty := decimal.NewFromFloat(it.QuantityOrdered)
			price := decimal.NewFromFloat(it.UnitPrice)
			lineTotal := qty.Mul(price)
			subtotal = subtotal.Add(lineTotal)
			pItems = append(pItems, model.PurchaseItem{
				PurchaseID:      uint(id),
				ItemID:          it.ItemID,
				QuantityOrdered: qty,
				UnitPrice:       price,
				TotalPrice:      lineTotal,
				Notes:           it.Notes,
			})
		}
		existing.Items = pItems
		existing.Subtotal = subtotal
		existing.TotalAmount = subtotal.Add(existing.TaxAmount).Add(existing.ShippingCost).Sub(existing.DiscountAmount)
		existing.ApOutstanding = existing.TotalAmount
	}

	if err := h.svc.UpdatePurchase(uint(id), existing); err != nil {
		response.InternalError(c, "Gagal memperbarui pengadaan/PO", err)
		return
	}

	response.Success(c, http.StatusOK, "Pengadaan/PO berhasil diperbarui", existing)
}

func (h *InventoryHandler) ApprovePurchase(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID pembelian tidak valid", err)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.ApprovePurchase(uint(id), userID); err != nil {
		response.InternalError(c, "Gagal menyetujui pembelian", err)
		return
	}
	response.Success(c, http.StatusOK, "Pembelian berhasil disetujui (Status: Ordered)", nil)
}

func (h *InventoryHandler) ReceivePurchase(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID pembelian tidak valid", err)
		return
	}

	var input struct {
		Items []service.ReceiveItemInput `json:"items" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data penerimaan barang tidak valid", err)
		return
	}

	if err := h.svc.ReceivePurchase(uint(id), input.Items); err != nil {
		response.InternalError(c, "Gagal memproses penerimaan barang", err)
		return
	}

	response.Success(c, http.StatusOK, "Penerimaan barang berhasil diproses dan stok telah ditambahkan", nil)
}

func (h *InventoryHandler) PostPurchaseToJournal(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID pembelian tidak valid", err)
		return
	}

	var input struct {
		DebitAccountID  uint `json:"debit_account_id" binding:"required"`  // Akun Persediaan
		CreditAccountID uint `json:"credit_account_id" binding:"required"` // Akun Hutang Usaha
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Harap pilih Akun Persediaan (Debit) dan Akun Hutang (Kredit)", err)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	journal, err := h.svc.PostPurchaseToJournal(uint(id), userID, input.DebitAccountID, input.CreditAccountID)
	if err != nil {
		response.InternalError(c, "Gagal memposting pembelian ke jurnal: "+err.Error(), err)
		return
	}

	response.Success(c, http.StatusOK, "Pembelian berhasil diposting ke Jurnal Umum", journal)
}

// ------------------- PAYMENTS -------------------

func (h *InventoryHandler) CreatePurchasePayment(c *gin.Context) {
	var input struct {
		PurchaseID      uint            `json:"purchase_id" binding:"required"`
		PaymentDate     string          `json:"payment_date" binding:"required"`
		Amount          decimal.Decimal `json:"amount" binding:"required"`
		PaymentMethod   string          `json:"payment_method"`
		DaftarAkunKasID *uint           `json:"daftar_akun_kas_id"`
		ReferenceNumber string          `json:"reference_number"`
		Notes           string          `json:"notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data pembayaran tidak valid", err)
		return
	}

	tgl, err := time.Parse("2006-01-02", input.PaymentDate)
	if err != nil {
		tgl = time.Now()
	}

	payment := model.PurchasePayment{
		PurchaseID:    input.PurchaseID,
		PaymentDate:   tgl,
		Amount:        input.Amount,
		PaymentMethod: input.PaymentMethod,
		Notes:         input.Notes,
	}
	if input.ReferenceNumber != "" {
		payment.PaymentNumber = input.ReferenceNumber
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CreatePurchasePayment(&payment, userID); err != nil {
		response.InternalError(c, "Gagal mencatat pembayaran hutang", err)
		return
	}

	response.Success(c, http.StatusCreated, "Pembayaran hutang pembelian berhasil dicatat", payment)
}

func (h *InventoryHandler) GetPurchasePayments(c *gin.Context) {
	var purchaseID *uint
	if pStr := c.Query("purchase_id"); pStr != "" {
		if pid, err := strconv.ParseUint(pStr, 10, 32); err == nil && pid > 0 {
			u := uint(pid)
			purchaseID = &u
		}
	}

	payments, err := h.svc.GetPurchasePayments(purchaseID)
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar pembayaran", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil daftar pembayaran", payments)
}

func (h *InventoryHandler) GetPurchasePaymentByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID pembayaran tidak valid", err)
		return
	}
	payment, err := h.svc.GetPurchasePaymentByID(uint(id))
	if err != nil {
		response.NotFound(c, "Data pembayaran tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail pembayaran", payment)
}

// ------------------- STOCKS & SUMMARY -------------------

func (h *InventoryHandler) GetStockSummary(c *gin.Context) {
	var deptID *uint
	if dStr := c.Query("department_id"); dStr != "" {
		if dStr == "0" || dStr == "central" {
			zero := uint(0)
			deptID = &zero
		} else if did, err := strconv.ParseUint(dStr, 10, 32); err == nil {
			u := uint(did)
			deptID = &u
		}
	} else if c.Query("central_only") == "true" {
		zero := uint(0)
		deptID = &zero
	}

	stocks, err := h.svc.GetStockSummary(deptID)
	if err != nil {
		response.InternalError(c, "Gagal mengambil ringkasan stok", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil ringkasan stok", stocks)
}

// ------------------- STOCK ADJUSTMENTS -------------------

func (h *InventoryHandler) GetStockAdjustments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")

	adjs, total, err := h.svc.GetStockAdjustments(page, perPage, search)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data penyesuaian stok", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil data penyesuaian stok",
		"data":    adjs,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *InventoryHandler) GetStockAdjustmentByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID penyesuaian stok tidak valid", err)
		return
	}
	adj, err := h.svc.GetStockAdjustmentByID(uint(id))
	if err != nil {
		response.NotFound(c, "Penyesuaian stok tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail penyesuaian stok", adj)
}

func (h *InventoryHandler) CreateStockAdjustment(c *gin.Context) {
	var input struct {
		TanggalAdjustment string          `json:"tanggal_adjustment" binding:"required"`
		TipeAdjustment    string          `json:"tipe_adjustment" binding:"required"` // increase / decrease
		ItemID            uint            `json:"item_id" binding:"required"`
		DepartmentID      *uint           `json:"department_id"`
		Quantity          decimal.Decimal `json:"quantity" binding:"required"`
		UnitPrice         decimal.Decimal `json:"unit_price"`
		Keterangan        string          `json:"keterangan"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data penyesuaian stok tidak valid", err)
		return
	}

	tgl, err := time.Parse("2006-01-02", input.TanggalAdjustment)
	if err != nil {
		tgl = time.Now()
	}

	adj := model.StockAdjustment{
		TanggalAdjustment: tgl,
		TipeAdjustment:    input.TipeAdjustment,
		ItemID:            input.ItemID,
		Quantity:          int(input.Quantity.IntPart()),
		UnitPrice:         input.UnitPrice,
		Keterangan:        input.Keterangan,
	}

	if err := h.svc.CreateStockAdjustment(&adj); err != nil {
		response.InternalError(c, "Gagal membuat penyesuaian stok", err)
		return
	}
	response.Success(c, http.StatusCreated, "Draft penyesuaian stok berhasil dibuat", adj)
}

func (h *InventoryHandler) ApproveStockAdjustment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID penyesuaian tidak valid", err)
		return
	}

	var input struct {
		DebitAccountID  *uint `json:"debit_account_id"`
		CreditAccountID *uint `json:"credit_account_id"`
	}
	_ = c.ShouldBindJSON(&input)

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.ApproveStockAdjustment(uint(id), userID, input.DebitAccountID, input.CreditAccountID); err != nil {
		response.InternalError(c, "Gagal menyetujui penyesuaian stok", err)
		return
	}
	response.Success(c, http.StatusOK, "Penyesuaian stok disetujui dan saldo fisik telah disinkronkan", nil)
}

// ------------------- STOCK TRANSFERS -------------------

func (h *InventoryHandler) GetStockTransfers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")

	trfs, total, err := h.svc.GetStockTransfers(page, perPage, search)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data transfer stok", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil data transfer stok",
		"data":    trfs,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *InventoryHandler) GetStockTransferByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID transfer stok tidak valid", err)
		return
	}
	trf, err := h.svc.GetStockTransferByID(uint(id))
	if err != nil {
		response.NotFound(c, "Transfer stok tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail transfer stok", trf)
}

func (h *InventoryHandler) CreateStockTransfer(c *gin.Context) {
	var input struct {
		TanggalTransfer  string          `json:"tanggal_transfer" binding:"required"`
		ItemID           uint            `json:"item_id" binding:"required"`
		FromDepartmentID *uint           `json:"from_department_id"`
		ToDepartmentID   uint            `json:"to_department_id" binding:"required"`
		Quantity         decimal.Decimal `json:"quantity" binding:"required"`
		Keterangan       string          `json:"keterangan"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data transfer stok tidak valid", err)
		return
	}

	tgl, err := time.Parse("2006-01-02", input.TanggalTransfer)
	if err != nil {
		tgl = time.Now()
	}

	trf := model.StockTransfer{
		TanggalTransfer:  tgl,
		ItemID:           input.ItemID,
		FromDepartmentID: input.FromDepartmentID,
		ToDepartmentID:   input.ToDepartmentID,
		Quantity:         int(input.Quantity.IntPart()),
		Keterangan:       input.Keterangan,
	}

	if err := h.svc.CreateStockTransfer(&trf); err != nil {
		response.InternalError(c, "Gagal membuat transfer stok", err)
		return
	}
	response.Success(c, http.StatusCreated, "Permintaan transfer stok berhasil dibuat", trf)
}

func (h *InventoryHandler) ReceiveStockTransfer(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID transfer tidak valid", err)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.ReceiveStockTransfer(uint(id), userID); err != nil {
		response.InternalError(c, "Gagal memproses penerimaan transfer stok", err)
		return
	}
	response.Success(c, http.StatusOK, "Transfer stok diterima dan saldo unit diperbarui", nil)
}

// ------------------- STOCK OPNAME -------------------

func (h *InventoryHandler) GetStockOpnames(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")

	opns, total, err := h.svc.GetStockOpnames(page, perPage, search)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data stock opname", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil data stock opname",
		"data":    opns,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *InventoryHandler) GetStockOpnameByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID stock opname tidak valid", err)
		return
	}

	opn, err := h.svc.GetStockOpnameByID(uint(id))
	if err != nil {
		response.NotFound(c, "Stock opname tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail stock opname", opn)
}

func (h *InventoryHandler) CreateStockOpname(c *gin.Context) {
	var input struct {
		DepartmentID *uint  `json:"department_id"`
		OpnameDate   string `json:"opname_date" binding:"required"`
		Notes        string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data stock opname tidak valid", err)
		return
	}

	tgl, err := time.Parse("2006-01-02", input.OpnameDate)
	if err != nil {
		tgl = time.Now()
	}

	opn := model.StockOpname{
		DepartmentID: input.DepartmentID,
		OpnameDate:   tgl,
		Notes:        input.Notes,
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CreateStockOpname(&opn, userID); err != nil {
		response.InternalError(c, "Gagal membuat sesi stock opname", err)
		return
	}
	response.Success(c, http.StatusCreated, "Sesi stock opname berhasil dibuat", opn)
}

func (h *InventoryHandler) CompleteStockOpname(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID stock opname tidak valid", err)
		return
	}

	var input struct {
		Counts []service.OpnameCountInput `json:"counts" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data perhitungan fisik tidak valid", err)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CompleteStockOpname(uint(id), userID, input.Counts); err != nil {
		response.InternalError(c, "Gagal menyelesaikan stock opname", err)
		return
	}
	response.Success(c, http.StatusOK, "Stock opname berhasil diselesaikan dan stok fisik disesuaikan", nil)
}

// ------------------- STOCK REQUESTS -------------------

func (h *InventoryHandler) GetStockRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")

	requests, total, err := h.svc.GetStockRequests(page, perPage, search)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data permintaan stok", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil data permintaan stok",
		"data":    requests,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *InventoryHandler) GetStockRequestByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID permintaan stok tidak valid", err)
		return
	}
	req, err := h.svc.GetStockRequestByID(uint(id))
	if err != nil {
		response.NotFound(c, "Permintaan stok tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil rincian permintaan stok", req)
}

func (h *InventoryHandler) CreateStockRequest(c *gin.Context) {
	var input struct {
		DepartmentID uint   `json:"department_id" binding:"required"`
		Priority     string `json:"priority"`
		Purpose      string `json:"purpose"`
		Notes        string `json:"notes"`
		Items        []struct {
			ItemID            uint    `json:"item_id" binding:"required"`
			QuantityRequested float64 `json:"quantity_requested" binding:"required"`
			Notes             string  `json:"notes"`
		} `json:"items" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data permintaan stok tidak valid", err)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	priority := input.Priority
	if priority == "" {
		priority = "normal"
	}

	var reqItems []model.StockRequestItem
	for _, it := range input.Items {
		reqItems = append(reqItems, model.StockRequestItem{
			ItemID:            it.ItemID,
			QuantityRequested: decimal.NewFromFloat(it.QuantityRequested),
			Notes:             it.Notes,
		})
	}

	req := model.StockRequest{
		DepartmentID: input.DepartmentID,
		RequestDate:  time.Now(),
		Priority:     priority,
		Purpose:      input.Purpose,
		Notes:        input.Notes,
		Items:        reqItems,
	}

	if err := h.svc.CreateStockRequest(&req, userID); err != nil {
		response.InternalError(c, "Gagal membuat permintaan stok", err)
		return
	}

	response.Success(c, http.StatusCreated, "Permintaan stok berhasil diajukan", req)
}

func (h *InventoryHandler) ApproveStockRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID permintaan stok tidak valid", err)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.ApproveStockRequest(uint(id), userID); err != nil {
		response.InternalError(c, "Gagal menyetujui permintaan stok", err)
		return
	}

	response.Success(c, http.StatusOK, "Permintaan stok berhasil disetujui", nil)
}

func (h *InventoryHandler) CompleteStockRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID permintaan stok tidak valid", err)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CompleteStockRequest(uint(id), userID); err != nil {
		response.InternalError(c, "Gagal menyelesaikan penyerahan permintaan stok", err)
		return
	}

	response.Success(c, http.StatusOK, "Permintaan stok berhasil diselesaikan dan barang telah diserahkan ke unit", nil)
}
