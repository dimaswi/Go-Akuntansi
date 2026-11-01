package handler

import (
	"net/http"
	"strconv"
	"time"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type JournalHandler struct {
	svc service.JournalService
}

func NewJournalHandler(svc service.JournalService) *JournalHandler {
	return &JournalHandler{svc: svc}
}

func (h *JournalHandler) GetAll(c *gin.Context) {
	status := model.JournalStatus(c.Query("status"))
	jenisQ := c.Query("jenis_jurnal")
	if jenisQ == "" {
		jenisQ = c.Query("jenis")
	}
	jenis := model.JenisJurnal(jenisQ)
	search := c.Query("search")
	if search == "" {
		search = c.Query("q")
	}

	var startDate, endDate *time.Time
	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = &t
		}
	}
	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = &t
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	journals, total, err := h.svc.GetAll(status, jenis, startDate, endDate, search, page, limit)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data jurnal", err)
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	meta := response.PaginationMeta{
		CurrentPage: page,
		PerPage:     limit,
		Total:       total,
		TotalPages:  totalPages,
	}

	response.SuccessWithMeta(c, http.StatusOK, "Berhasil mengambil data jurnal", journals, meta)
}

func (h *JournalHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	journal, err := h.svc.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "Jurnal tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil detail jurnal", journal)
}

func (h *JournalHandler) Create(c *gin.Context) {
	var req service.CreateJournalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data permintaan tidak valid", err.Error())
		return
	}

	userID := uint(1) // Default or extracted from JWT context
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	journal, err := h.svc.Create(&req, userID)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Jurnal berhasil disimpan sebagai draft", journal)
}

func (h *JournalHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	var req service.CreateJournalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data permintaan tidak valid", err.Error())
		return
	}

	journal, err := h.svc.Update(uint(id), &req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Jurnal berhasil diperbarui", journal)
}

func (h *JournalHandler) Post(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	journal, err := h.svc.Post(uint(id), userID)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Jurnal berhasil diposting ke buku besar", journal)
}

func (h *JournalHandler) Unpost(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	journal, err := h.svc.Unpost(uint(id))
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Jurnal berhasil di-unpost kembali ke status draft", journal)
}

type ReverseRequest struct {
	Alasan string `json:"alasan"`
}

func (h *JournalHandler) Reverse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	var req ReverseRequest
	_ = c.ShouldBindJSON(&req)

	userID := uint(1)
	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	reversed, err := h.svc.Reverse(uint(id), userID, req.Alasan)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Jurnal berhasil direverse", reversed)
}

func (h *JournalHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Jurnal berhasil dihapus", nil)
}
