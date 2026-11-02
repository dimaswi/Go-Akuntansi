package handler

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/model"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type SalaryHandler struct {
	service service.SalaryService
}

func NewSalaryHandler(service service.SalaryService) *SalaryHandler {
	return &SalaryHandler{service: service}
}

func getUserID(c *gin.Context) uint {
	if uid, exists := c.Get("currentUserID"); exists {
		if id, ok := uid.(uint); ok {
			return id
		}
	}
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(uint); ok {
			return id
		}
	}
	if uid, exists := c.Get("userID"); exists {
		if id, ok := uid.(uint); ok {
			return id
		}
	}
	if val, exists := c.Get("currentUser"); exists {
		if u, ok := val.(model.User); ok {
			return u.ID
		}
		if u, ok := val.(*model.User); ok {
			return u.ID
		}
	}
	return 0
}

func getUserNIP(c *gin.Context) string {
	if val, exists := c.Get("currentUser"); exists {
		if u, ok := val.(model.User); ok {
			return u.NIP
		}
		if u, ok := val.(*model.User); ok {
			return u.NIP
		}
	}
	return ""
}

// GET /api/v1/penggajian/batches
func (h *SalaryHandler) GetBatches(c *gin.Context) {
	search := c.Query("search")
	status := c.Query("status")
	year := c.Query("period_year")
	month := c.Query("period_month")

	batches, summary, err := h.service.GetBatches(search, status, year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batches,
		"summary": summary,
	})
}

// GET /api/v1/penggajian/batches/:id
func (h *SalaryHandler) GetBatchByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	batch, err := h.service.GetBatchByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Batch gaji tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": batch})
}

// POST /api/v1/penggajian/batches
func (h *SalaryHandler) CreateBatch(c *gin.Context) {
	var input struct {
		PeriodMonth      int    `json:"period_month" binding:"required"`
		PeriodYear       int    `json:"period_year" binding:"required"`
		Description      string `json:"description"`
		PaymentAccountID uint   `json:"payment_account_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	batch := model.SalaryBatch{
		PeriodMonth:      input.PeriodMonth,
		PeriodYear:       input.PeriodYear,
		Description:      input.Description,
		PaymentAccountID: input.PaymentAccountID,
		CreatedBy:        getUserID(c),
	}

	if err := h.service.CreateBatch(&batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Batch gaji berhasil dibuat. Silakan isi data gaji karyawan.",
		"data":    batch,
	})
}

// PUT /api/v1/penggajian/batches/:id
func (h *SalaryHandler) UpdateBatch(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	var input struct {
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.service.UpdateBatch(uint(id), input.Description); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Batch gaji berhasil diperbarui"})
}

// DELETE /api/v1/penggajian/batches/:id
func (h *SalaryHandler) DeleteBatch(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	if err := h.service.DeleteBatch(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Batch gaji berhasil dihapus"})
}

// GET /api/v1/penggajian/users
func (h *SalaryHandler) GetUsersWithNIP(c *gin.Context) {
	users, err := h.service.GetUsersWithNIP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": users})
}

// POST /api/v1/penggajian/batches/:id/gaji
func (h *SalaryHandler) SaveSalaryDetails(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID tidak valid"})
		return
	}

	var input struct {
		Details []model.SalaryDetail `json:"details" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.service.SaveSalaryDetails(uint(id), input.Details); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Data gaji karyawan berhasil disimpan"})
}

// GET /api/v1/penggajian/journal-preview?batch_ids=1,2
func (h *SalaryHandler) GetJournalPreview(c *gin.Context) {
	rawIDs := c.Query("batch_ids")
	if rawIDs == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "batch_ids dibutuhkan"})
		return
	}

	parts := strings.Split(rawIDs, ",")
	batchIDs := make([]uint, 0, len(parts))
	for _, p := range parts {
		if id, err := strconv.Atoi(strings.TrimSpace(p)); err == nil && id > 0 {
			batchIDs = append(batchIDs, uint(id))
		}
	}

	if len(batchIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "batch_ids tidak valid"})
		return
	}

	preview, err := h.service.GetJournalPreview(batchIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": preview})
}

// POST /api/v1/penggajian/post-to-journal
func (h *SalaryHandler) PostToJournal(c *gin.Context) {
	var input struct {
		BatchIDs     []uint                        `json:"batch_ids" binding:"required"`
		DetailJurnal []repository.PostJournalDetail `json:"detail_jurnal" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	userID := getUserID(c)
	jurnal, err := h.service.PostToJournal(input.BatchIDs, input.DetailJurnal, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Batch gaji berhasil diposting ke jurnal akuntansi",
		"data":    jurnal,
	})
}

// GET /api/v1/penggajian/my-salary
func (h *SalaryHandler) GetPersonalSalarySlips(c *gin.Context) {
	userID := getUserID(c)
	userNIP := getUserNIP(c)
	year := c.Query("period_year")
	month := c.Query("period_month")

	if userID == 0 && userNIP == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    []interface{}{},
			"summary": gin.H{
				"total_slips":       0,
				"total_gaji_bersih": 0,
				"latest_period":     "",
			},
		})
		return
	}

	slips, summary, err := h.service.GetPersonalSalarySlips(userID, userNIP, year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    slips,
		"summary": summary,
	})
}

// GET /api/v1/penggajian/slips/:id
func (h *SalaryHandler) GetSlipByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID slip gaji tidak valid"})
		return
	}

	detail, err := h.service.GetSalaryDetailByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Slip gaji tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    detail,
	})
}

// GET /api/v1/penggajian/slips/:id/pdf
func (h *SalaryHandler) DownloadSlipPDF(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID slip gaji tidak valid"})
		return
	}

	pdfBytes, filename, err := h.service.GenerateSalarySlipPDF(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal meng-generate file PDF slip gaji: " + err.Error()})
		return
	}

	disposition := "attachment"
	if c.Query("view") == "1" || c.Query("inline") == "true" {
		disposition = "inline"
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", disposition+"; filename=\""+filename+"\"")
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}

// GET /api/v1/penggajian/slips/:id/print
func (h *SalaryHandler) PrintSlipHTML(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.String(http.StatusBadRequest, "ID slip gaji tidak valid")
		return
	}

	autoPrint := c.Query("auto_print") == "true"
	html, err := h.service.GenerateSalarySlipHTML(uint(id), autoPrint)
	if err != nil {
		c.String(http.StatusInternalServerError, "Gagal meng-generate slip gaji: "+err.Error())
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, html)
}

// GET & POST /api/v1/penggajian/batches/:id/excel-template
func (h *SalaryHandler) DownloadSalaryExcelTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID batch gaji tidak valid"})
		return
	}

	var customRows []model.SalaryDetail
	if c.Request.Method == http.MethodPost {
		var req struct {
			Details []model.SalaryDetail `json:"details"`
		}
		if err := c.ShouldBindJSON(&req); err == nil && len(req.Details) > 0 {
			customRows = req.Details
		}
	}

	excelBytes, filename, err := h.service.GenerateSalaryTemplateXLSX(uint(id), customRows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal meng-generate file excel: " + err.Error()})
		return
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes)
}


