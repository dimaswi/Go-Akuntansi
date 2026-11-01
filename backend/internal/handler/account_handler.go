package handler

import (
	"net/http"
	"strconv"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AccountHandler struct {
	svc service.AccountService
}

func NewAccountHandler(svc service.AccountService) *AccountHandler {
	return &AccountHandler{svc: svc}
}

func (h *AccountHandler) GetAll(c *gin.Context) {
	jenis := model.JenisAkun(c.Query("jenis"))
	var isAktif *bool
	if val := c.Query("is_aktif"); val != "" {
		b := val == "true" || val == "1"
		isAktif = &b
	}

	accounts, err := h.svc.GetAll(jenis, isAktif)
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar akun", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil daftar akun", accounts)
}

func (h *AccountHandler) GetTree(c *gin.Context) {
	tree, err := h.svc.GetTree()
	if err != nil {
		response.InternalError(c, "Gagal mengambil struktur hierarki akun", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil hierarki akun", tree)
}

func (h *AccountHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	acc, err := h.svc.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "Akun tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil detail akun", acc)
}

func (h *AccountHandler) Create(c *gin.Context) {
	var acc model.ChartOfAccount
	if err := c.ShouldBindJSON(&acc); err != nil {
		response.BadRequest(c, "Data yang dikirim tidak valid", err.Error())
		return
	}

	if err := h.svc.Create(&acc); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Akun berhasil dibuat", acc)
}

func (h *AccountHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	var acc model.ChartOfAccount
	if err := c.ShouldBindJSON(&acc); err != nil {
		response.BadRequest(c, "Data yang dikirim tidak valid", err.Error())
		return
	}

	if err := h.svc.Update(uint(id), &acc); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Akun berhasil diperbarui", acc)
}

func (h *AccountHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID tidak valid", nil)
		return
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus akun", err)
		return
	}

	response.Success(c, http.StatusOK, "Akun berhasil dihapus", nil)
}
