package handler

import (
	"backend/internal/model"
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AssetHandler struct {
	service service.AssetService
}

func NewAssetHandler(service service.AssetService) *AssetHandler {
	return &AssetHandler{service: service}
}

// ==========================================
// CATEGORIES
// ==========================================
func (h *AssetHandler) GetCategories(c *gin.Context) {
	search := c.Query("search")
	data, err := h.service.GetCategories(search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) GetCategoryByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	data, err := h.service.GetCategoryByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Kategori aset tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) CreateCategory(c *gin.Context) {
	var input model.AssetCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid: " + err.Error()})
		return
	}

	if err := h.service.CreateCategory(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan kategori: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Kategori aset berhasil ditambahkan", "data": input})
}

func (h *AssetHandler) UpdateCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	var input model.AssetCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid: " + err.Error()})
		return
	}
	input.ID = uint(id)

	if err := h.service.UpdateCategory(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal memperbarui kategori: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Kategori aset berhasil diperbarui", "data": input})
}

func (h *AssetHandler) DeleteCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	if err := h.service.DeleteCategory(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Kategori aset berhasil dihapus"})
}

// ==========================================
// ASSETS
// ==========================================
func (h *AssetHandler) GetAssets(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}
	search := c.Query("search")
	categoryID, _ := strconv.Atoi(c.Query("category_id"))
	departmentID, _ := strconv.Atoi(c.Query("department_id"))
	status := c.Query("status")

	data, total, err := h.service.GetAssets(page, perPage, search, uint(categoryID), uint(departmentID), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	lastPage := 1
	if perPage > 0 {
		lastPage = int(total) / perPage
		if int(total)%perPage != 0 {
			lastPage++
		}
	}
	if lastPage < 1 {
		lastPage = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
		"total":   total,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    lastPage,
		},
	})
}

func (h *AssetHandler) GetAssetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	data, err := h.service.GetAssetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Aset tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) CreateAsset(c *gin.Context) {
	var input model.Asset
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid: " + err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if exists {
		if id, ok := userID.(uint); ok {
			input.CreatedByID = &id
		}
	}

	if err := h.service.CreateAsset(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan aset: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Aset berhasil ditambahkan", "data": input})
}

func (h *AssetHandler) UpdateAsset(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	var input model.Asset
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid: " + err.Error()})
		return
	}
	input.ID = uint(id)

	if err := h.service.UpdateAsset(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal memperbarui aset: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Aset berhasil diperbarui", "data": input})
}

func (h *AssetHandler) DeleteAsset(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	if err := h.service.DeleteAsset(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menghapus aset: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Aset berhasil dihapus"})
}

// ==========================================
// DEPRECIATIONS
// ==========================================
func (h *AssetHandler) GetDepreciations(c *gin.Context) {
	assetID, _ := strconv.Atoi(c.Query("asset_id"))
	periodDate := c.Query("period_date")

	data, err := h.service.GetDepreciations(uint(assetID), periodDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) RunDepreciation(c *gin.Context) {
	var input struct {
		PeriodDate string `json:"period_date"`
	}
	_ = c.ShouldBindJSON(&input)

	var userID uint = 1
	if uid, exists := c.Get("user_id"); exists {
		userID = uid.(uint)
	}

	count, err := h.service.RunDepreciation(input.PeriodDate, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menjalankan penyusutan: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Penyusutan berhasil diproses untuk " + strconv.Itoa(count) + " aset",
		"count":   count,
	})
}

// ==========================================
// MAINTENANCES
// ==========================================
func (h *AssetHandler) GetMaintenances(c *gin.Context) {
	assetID, _ := strconv.Atoi(c.Query("asset_id"))
	status := c.Query("status")

	data, err := h.service.GetMaintenances(uint(assetID), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) GetMaintenanceByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	data, err := h.service.GetMaintenanceByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Data maintenance tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) CreateMaintenance(c *gin.Context) {
	var input model.AssetMaintenance
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(uint); ok {
			input.CreatedByID = &id
		}
	}
	if err := h.service.CreateMaintenance(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Data maintenance berhasil dibuat", "data": input})
}

func (h *AssetHandler) UpdateMaintenance(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	var input model.AssetMaintenance
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	input.ID = uint(id)
	if err := h.service.UpdateMaintenance(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Data maintenance berhasil diperbarui", "data": input})
}

// ==========================================
// DISPOSALS
// ==========================================
func (h *AssetHandler) GetDisposals(c *gin.Context) {
	status := c.Query("status")
	data, err := h.service.GetDisposals(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) GetDisposalByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	data, err := h.service.GetDisposalByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Data disposal tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) CreateDisposal(c *gin.Context) {
	var input model.AssetDisposal
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(uint); ok {
			input.CreatedByID = &id
		}
	}
	if err := h.service.CreateDisposal(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Pengajuan disposal berhasil disimpan", "data": input})
}

func (h *AssetHandler) ApproveDisposal(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	var userID uint = 1
	if uid, exists := c.Get("user_id"); exists {
		userID = uid.(uint)
	}
	if err := h.service.ApproveDisposal(uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Disposal berhasil disetujui"})
}

// ==========================================
// TRANSFERS
// ==========================================
func (h *AssetHandler) GetTransfers(c *gin.Context) {
	assetID, _ := strconv.Atoi(c.Query("asset_id"))
	status := c.Query("status")
	data, err := h.service.GetTransfers(uint(assetID), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) GetTransferByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	data, err := h.service.GetTransferByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Data transfer tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) CreateTransfer(c *gin.Context) {
	var input model.AssetTransfer
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(uint); ok {
			input.CreatedByID = &id
		}
	}
	if err := h.service.CreateTransfer(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Transfer aset berhasil dibuat", "data": input})
}

func (h *AssetHandler) ApproveTransfer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	var userID uint = 1
	if uid, exists := c.Get("user_id"); exists {
		userID = uid.(uint)
	}
	if err := h.service.ApproveTransfer(uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Transfer aset berhasil disetujui"})
}

// ==========================================
// BUDGETS (RAB)
// ==========================================
func (h *AssetHandler) GetBudgets(c *gin.Context) {
	fiscalYear, _ := strconv.Atoi(c.Query("fiscal_year"))
	status := c.Query("status")
	data, err := h.service.GetBudgets(fiscalYear, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) GetBudgetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}
	data, err := h.service.GetBudgetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "RAB aset tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *AssetHandler) CreateBudget(c *gin.Context) {
	var input model.AssetBudget
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(uint); ok {
			input.CreatedByID = &id
		}
	}
	if err := h.service.CreateBudget(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "RAB aset berhasil disimpan", "data": input})
}

// ==========================================
// DASHBOARD STATS
// ==========================================
func (h *AssetHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.service.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}

