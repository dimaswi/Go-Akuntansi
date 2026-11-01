package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

func parseFlexibleDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, nil
	}
	// Try YYYY-MM-DD
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	// Try RFC3339
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	// Try 2006-01-02T15:04:05
	if t, err := time.Parse("2006-01-02T15:04:05", s); err == nil {
		return t, nil
	}
	return time.Time{}, errors.New("format tanggal tidak valid (harus YYYY-MM-DD atau RFC3339)")
}

type CashTransactionInput struct {
	NomorTransaksi    string          `json:"nomor_transaksi"`
	TanggalTransaksi  string          `json:"tanggal_transaksi"`
	JenisTransaksi    string          `json:"jenis_transaksi"`
	KategoriTransaksi string          `json:"kategori_transaksi"`
	Jumlah            decimal.Decimal `json:"jumlah"`
	Keterangan        string          `json:"keterangan"`
	PihakTerkait      string          `json:"pihak_terkait"`
	Referensi         string          `json:"referensi"`
	DaftarAkunKasID   uint            `json:"daftar_akun_kas_id"`
	DaftarAkunLawanID *uint           `json:"daftar_akun_lawan_id"`
}

type BankTransactionInput struct {
	NomorTransaksi    string          `json:"nomor_transaksi"`
	TanggalTransaksi  string          `json:"tanggal_transaksi"`
	TanggalEfektif    *string         `json:"tanggal_efektif"`
	JenisTransaksi    string          `json:"jenis_transaksi"`
	KategoriTransaksi string          `json:"kategori_transaksi"`
	BankAccountID     uint            `json:"bank_account_id"`
	Jumlah            decimal.Decimal `json:"jumlah"`
	Keterangan        string          `json:"keterangan"`
	NomorReferensi    string          `json:"nomor_referensi"`
	PihakTerkait      string          `json:"pihak_terkait"`
	DaftarAkunLawanID *uint           `json:"daftar_akun_lawan_id"`
}

type GiroTransactionInput struct {
	NomorGiro         string          `json:"nomor_giro"`
	TanggalTerima     string          `json:"tanggal_terima"`
	TanggalGiro       string          `json:"tanggal_giro"`
	TanggalJatuhTempo string          `json:"tanggal_jatuh_tempo"`
	JenisGiro         string          `json:"jenis_giro"`
	StatusGiro        string          `json:"status_giro"`
	BankAccountID     uint            `json:"bank_account_id"`
	Jumlah            decimal.Decimal `json:"jumlah"`
	NamaPenerbit      string          `json:"nama_penerbit"`
	Penerbit          string          `json:"penerbit"`
	BankPenerbit      string          `json:"bank_penerbit"`
	Penerima          string          `json:"penerima"`
	Keterangan        string          `json:"keterangan"`
	NomorReferensi    string          `json:"nomor_referensi"`
	DaftarAkunGiroID  uint            `json:"daftar_akun_giro_id"`
	DaftarAkunID      uint            `json:"daftar_akun_id"`
	DaftarAkunLawanID *uint           `json:"daftar_akun_lawan_id"`
}

type CashBankHandler struct {
	svc service.CashBankService
}

func NewCashBankHandler(svc service.CashBankService) *CashBankHandler {
	return &CashBankHandler{svc: svc}
}

// -------------------------------------------------------------
// Bank Accounts
// -------------------------------------------------------------

func (h *CashBankHandler) GetBankAccounts(c *gin.Context) {
	search := c.Query("search")
	var isAktif *bool
	if val := c.Query("is_aktif"); val != "" {
		b := val == "true" || val == "1"
		isAktif = &b
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	// If paginated
	if c.Query("all") == "true" {
		accounts, err := h.svc.GetBankAccounts(search, isAktif)
		if err != nil {
			response.InternalError(c, "Gagal mengambil data rekening bank", err)
			return
		}
		response.Success(c, http.StatusOK, "Berhasil mengambil data rekening bank", accounts)
		return
	}

	accounts, total, err := h.svc.GetBankAccountsPaginated(page, perPage, search, isAktif)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data rekening bank", err)
		return
	}

	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	meta := response.PaginationMeta{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		TotalPages:  totalPages,
	}

	response.SuccessWithMeta(c, http.StatusOK, "Berhasil mengambil data rekening bank", accounts, meta)
}

func (h *CashBankHandler) GetBankAccountByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	acc, err := h.svc.GetBankAccountByID(uint(id))
	if err != nil {
		response.NotFound(c, "Rekening bank tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil data rekening bank", acc)
}

func (h *CashBankHandler) CreateBankAccount(c *gin.Context) {
	var req model.BankAccount
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	if err := h.svc.CreateBankAccount(&req); err != nil {
		response.InternalError(c, "Gagal membuat rekening bank", err)
		return
	}

	response.Success(c, http.StatusCreated, "Rekening bank berhasil dibuat", req)
}

func (h *CashBankHandler) UpdateBankAccount(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var req model.BankAccount
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	if err := h.svc.UpdateBankAccount(uint(id), &req); err != nil {
		response.InternalError(c, "Gagal memperbarui rekening bank", err)
		return
	}

	response.Success(c, http.StatusOK, "Rekening bank berhasil diperbarui", req)
}

func (h *CashBankHandler) DeleteBankAccount(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	if err := h.svc.DeleteBankAccount(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus rekening bank", err)
		return
	}

	response.Success(c, http.StatusOK, "Rekening bank berhasil dihapus", nil)
}

// -------------------------------------------------------------
// Cash Transactions
// -------------------------------------------------------------

func (h *CashBankHandler) GetCashTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	jenis := c.Query("jenis_transaksi")
	status := c.Query("status")

	var from, to *time.Time
	if fStr := c.Query("tanggal_dari"); fStr != "" {
		if t, err := time.Parse("2006-01-02", fStr); err == nil {
			from = &t
		}
	}
	if tStr := c.Query("tanggal_sampai"); tStr != "" {
		if t, err := time.Parse("2006-01-02", tStr); err == nil {
			to = &t
		}
	}

	items, total, summary, err := h.svc.GetCashTransactionsPaginated(page, perPage, search, jenis, status, from, to)
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar transaksi kas", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil daftar transaksi kas",
		"data":    items,
		"summary": summary,
		"meta": gin.H{
			"page":      page,
			"per_page":  perPage,
			"total":     total,
			"last_page": (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *CashBankHandler) GetCashTransactionByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	tx, err := h.svc.GetCashTransactionByID(uint(id))
	if err != nil {
		response.NotFound(c, "Transaksi kas tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil detail transaksi kas", tx)
}

func (h *CashBankHandler) CreateCashTransaction(c *gin.Context) {
	var input CashTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	tgl, err := parseFlexibleDate(input.TanggalTransaksi)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	if tgl.IsZero() {
		tgl = time.Now()
	}

	req := model.CashTransaction{
		NomorTransaksi:    input.NomorTransaksi,
		TanggalTransaksi:  tgl,
		JenisTransaksi:    input.JenisTransaksi,
		KategoriTransaksi: input.KategoriTransaksi,
		Jumlah:            input.Jumlah,
		Keterangan:        input.Keterangan,
		PihakTerkait:      input.PihakTerkait,
		Referensi:         input.Referensi,
		DaftarAkunKasID:   input.DaftarAkunKasID,
		DaftarAkunLawanID: input.DaftarAkunLawanID,
	}

	userID := uint(1) // Default to superadmin or context
	if uid, exists := c.Get("userID"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CreateCashTransaction(&req, userID); err != nil {
		response.InternalError(c, "Gagal menyimpan transaksi kas", err)
		return
	}

	response.Success(c, http.StatusCreated, "Transaksi kas berhasil dibuat", req)
}

func (h *CashBankHandler) UpdateCashTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var input CashTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	tgl, err := parseFlexibleDate(input.TanggalTransaksi)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	if tgl.IsZero() {
		tgl = time.Now()
	}

	req := model.CashTransaction{
		NomorTransaksi:    input.NomorTransaksi,
		TanggalTransaksi:  tgl,
		JenisTransaksi:    input.JenisTransaksi,
		KategoriTransaksi: input.KategoriTransaksi,
		Jumlah:            input.Jumlah,
		Keterangan:        input.Keterangan,
		PihakTerkait:      input.PihakTerkait,
		Referensi:         input.Referensi,
		DaftarAkunKasID:   input.DaftarAkunKasID,
		DaftarAkunLawanID: input.DaftarAkunLawanID,
	}

	if err := h.svc.UpdateCashTransaction(uint(id), &req); err != nil {
		response.InternalError(c, "Gagal memperbarui transaksi kas", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi kas berhasil diperbarui", req)
}

func (h *CashBankHandler) DeleteCashTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	if err := h.svc.DeleteCashTransaction(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus transaksi kas", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi kas berhasil dihapus", nil)
}

type PostCashToJournalRequest struct {
	Details []service.CustomJournalDetailRequest `json:"details"`
}

func (h *CashBankHandler) PostCashToJournal(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var req PostCashToJournalRequest
	c.ShouldBindJSON(&req) // Optional custom details

	userID := uint(1)
	if uid, exists := c.Get("userID"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	journal, err := h.svc.PostCashToJournal(uint(id), userID, req.Details)
	if err != nil {
		response.InternalError(c, "Gagal memposting transaksi kas ke jurnal", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi kas berhasil diposting ke jurnal buku besar", journal)
}

// -------------------------------------------------------------
// Bank Transactions
// -------------------------------------------------------------

func (h *CashBankHandler) GetBankTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	jenis := c.Query("jenis_transaksi")
	status := c.Query("status")

	var bankAccountID *uint
	if bID := c.Query("bank_account_id"); bID != "" {
		if id, err := strconv.ParseUint(bID, 10, 32); err == nil {
			uID := uint(id)
			bankAccountID = &uID
		}
	}

	var from, to *time.Time
	if fStr := c.Query("tanggal_dari"); fStr != "" {
		if t, err := time.Parse("2006-01-02", fStr); err == nil {
			from = &t
		}
	}
	if tStr := c.Query("tanggal_sampai"); tStr != "" {
		if t, err := time.Parse("2006-01-02", tStr); err == nil {
			to = &t
		}
	}

	items, total, summary, err := h.svc.GetBankTransactionsPaginated(page, perPage, search, jenis, status, bankAccountID, from, to)
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar transaksi bank", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berhasil mengambil daftar transaksi bank",
		"data":    items,
		"summary": summary,
		"meta": gin.H{
			"page":      page,
			"per_page":  perPage,
			"total":     total,
			"last_page": (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

func (h *CashBankHandler) GetBankTransactionByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	tx, err := h.svc.GetBankTransactionByID(uint(id))
	if err != nil {
		response.NotFound(c, "Transaksi bank tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil detail transaksi bank", tx)
}

func (h *CashBankHandler) CreateBankTransaction(c *gin.Context) {
	var input BankTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	tgl, err := parseFlexibleDate(input.TanggalTransaksi)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	if tgl.IsZero() {
		tgl = time.Now()
	}

	var tglEfektif *time.Time
	if input.TanggalEfektif != nil && *input.TanggalEfektif != "" {
		if te, err := parseFlexibleDate(*input.TanggalEfektif); err == nil && !te.IsZero() {
			tglEfektif = &te
		}
	}

	req := model.BankTransaction{
		NomorTransaksi:    input.NomorTransaksi,
		TanggalTransaksi:  tgl,
		TanggalEfektif:    tglEfektif,
		JenisTransaksi:    input.JenisTransaksi,
		KategoriTransaksi: input.KategoriTransaksi,
		BankAccountID:     input.BankAccountID,
		Jumlah:            input.Jumlah,
		Keterangan:        input.Keterangan,
		NomorReferensi:    input.NomorReferensi,
		PihakTerkait:      input.PihakTerkait,
		DaftarAkunLawanID: input.DaftarAkunLawanID,
	}

	userID := uint(1)
	if uid, exists := c.Get("userID"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CreateBankTransaction(&req, userID); err != nil {
		response.InternalError(c, "Gagal menyimpan transaksi bank", err)
		return
	}

	response.Success(c, http.StatusCreated, "Transaksi bank berhasil dibuat", req)
}

func (h *CashBankHandler) UpdateBankTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var input BankTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	tgl, err := parseFlexibleDate(input.TanggalTransaksi)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	if tgl.IsZero() {
		tgl = time.Now()
	}

	var tglEfektif *time.Time
	if input.TanggalEfektif != nil && *input.TanggalEfektif != "" {
		if te, err := parseFlexibleDate(*input.TanggalEfektif); err == nil && !te.IsZero() {
			tglEfektif = &te
		}
	}

	req := model.BankTransaction{
		NomorTransaksi:    input.NomorTransaksi,
		TanggalTransaksi:  tgl,
		TanggalEfektif:    tglEfektif,
		JenisTransaksi:    input.JenisTransaksi,
		KategoriTransaksi: input.KategoriTransaksi,
		BankAccountID:     input.BankAccountID,
		Jumlah:            input.Jumlah,
		Keterangan:        input.Keterangan,
		NomorReferensi:    input.NomorReferensi,
		PihakTerkait:      input.PihakTerkait,
		DaftarAkunLawanID: input.DaftarAkunLawanID,
	}

	if err := h.svc.UpdateBankTransaction(uint(id), &req); err != nil {
		response.InternalError(c, "Gagal memperbarui transaksi bank", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi bank berhasil diperbarui", req)
}

func (h *CashBankHandler) DeleteBankTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	if err := h.svc.DeleteBankTransaction(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus transaksi bank", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi bank berhasil dihapus", nil)
}

func (h *CashBankHandler) ReconcileBankTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	tgl := time.Now()
	var body struct {
		TanggalRekonsiliasi string `json:"tanggal_rekonsiliasi"`
	}
	if err := c.ShouldBindJSON(&body); err == nil && body.TanggalRekonsiliasi != "" {
		if t, err := time.Parse("2006-01-02", body.TanggalRekonsiliasi); err == nil {
			tgl = t
		}
	}

	if err := h.svc.ReconcileBankTransaction(uint(id), tgl); err != nil {
		response.InternalError(c, "Gagal merekonsiliasi transaksi bank", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi bank berhasil direkonsiliasi", nil)
}

func (h *CashBankHandler) PostBankToJournal(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var req PostCashToJournalRequest
	c.ShouldBindJSON(&req)

	userID := uint(1)
	if uid, exists := c.Get("userID"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	journal, err := h.svc.PostBankToJournal(uint(id), userID, req.Details)
	if err != nil {
		response.InternalError(c, "Gagal memposting transaksi bank ke jurnal", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi bank berhasil diposting ke jurnal buku besar", journal)
}

// -------------------------------------------------------------
// Giro Transactions
// -------------------------------------------------------------

func (h *CashBankHandler) GetGiroTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	jenisGiro := c.Query("jenis_giro")
	statusGiro := c.Query("status_giro")
	status := c.Query("status")

	var bankAccountID *uint
	if bID := c.Query("bank_account_id"); bID != "" {
		if id, err := strconv.ParseUint(bID, 10, 32); err == nil {
			uID := uint(id)
			bankAccountID = &uID
		}
	}

	var from, to *time.Time
	if fStr := c.Query("tanggal_dari"); fStr != "" {
		if t, err := time.Parse("2006-01-02", fStr); err == nil {
			from = &t
		}
	}
	if tStr := c.Query("tanggal_sampai"); tStr != "" {
		if t, err := time.Parse("2006-01-02", tStr); err == nil {
			to = &t
		}
	}

	items, total, err := h.svc.GetGiroTransactionsPaginated(page, perPage, search, jenisGiro, statusGiro, status, bankAccountID, from, to)
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar transaksi giro", err)
		return
	}

	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	meta := response.PaginationMeta{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		TotalPages:  totalPages,
	}

	response.SuccessWithMeta(c, http.StatusOK, "Berhasil mengambil daftar transaksi giro", items, meta)
}

func (h *CashBankHandler) GetGiroTransactionByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	tx, err := h.svc.GetGiroTransactionByID(uint(id))
	if err != nil {
		response.NotFound(c, "Transaksi giro tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil detail transaksi giro", tx)
}

func (h *CashBankHandler) CreateGiroTransaction(c *gin.Context) {
	var input GiroTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	tglTerimaStr := input.TanggalTerima
	if tglTerimaStr == "" {
		tglTerimaStr = input.TanggalGiro
	}
	tglTerima, _ := parseFlexibleDate(tglTerimaStr)
	if tglTerima.IsZero() {
		tglTerima = time.Now()
	}

	tglJatuhTempo, _ := parseFlexibleDate(input.TanggalJatuhTempo)
	if tglJatuhTempo.IsZero() {
		tglJatuhTempo = tglTerima
	}

	penerbit := input.NamaPenerbit
	if penerbit == "" {
		penerbit = input.Penerbit
	}
	if penerbit == "" && input.Penerima != "" {
		penerbit = input.Penerima
	}

	akunGiroID := input.DaftarAkunGiroID
	if akunGiroID == 0 {
		akunGiroID = input.DaftarAkunID
	}

	statusGiro := input.StatusGiro
	if statusGiro == "" {
		statusGiro = "diterima"
	}

	req := model.GiroTransaction{
		NomorGiro:         input.NomorGiro,
		TanggalTerima:     tglTerima,
		TanggalJatuhTempo: tglJatuhTempo,
		JenisGiro:         input.JenisGiro,
		StatusGiro:        statusGiro,
		BankAccountID:     input.BankAccountID,
		Jumlah:            input.Jumlah,
		NamaPenerbit:      penerbit,
		BankPenerbit:      input.BankPenerbit,
		Keterangan:        input.Keterangan,
		NomorReferensi:    input.NomorReferensi,
		DaftarAkunGiroID:  akunGiroID,
		DaftarAkunLawanID: input.DaftarAkunLawanID,
	}

	userID := uint(1)
	if uid, exists := c.Get("userID"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	if err := h.svc.CreateGiroTransaction(&req, userID); err != nil {
		response.InternalError(c, "Gagal menyimpan transaksi giro", err)
		return
	}

	response.Success(c, http.StatusCreated, "Transaksi giro berhasil dibuat", req)
}

func (h *CashBankHandler) UpdateGiroTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var input GiroTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err)
		return
	}

	tglTerimaStr := input.TanggalTerima
	if tglTerimaStr == "" {
		tglTerimaStr = input.TanggalGiro
	}
	tglTerima, _ := parseFlexibleDate(tglTerimaStr)
	if tglTerima.IsZero() {
		tglTerima = time.Now()
	}

	tglJatuhTempo, _ := parseFlexibleDate(input.TanggalJatuhTempo)
	if tglJatuhTempo.IsZero() {
		tglJatuhTempo = tglTerima
	}

	penerbit := input.NamaPenerbit
	if penerbit == "" {
		penerbit = input.Penerbit
	}
	if penerbit == "" && input.Penerima != "" {
		penerbit = input.Penerima
	}

	akunGiroID := input.DaftarAkunGiroID
	if akunGiroID == 0 {
		akunGiroID = input.DaftarAkunID
	}

	statusGiro := input.StatusGiro
	if statusGiro == "" {
		statusGiro = "diterima"
	}

	req := model.GiroTransaction{
		NomorGiro:         input.NomorGiro,
		TanggalTerima:     tglTerima,
		TanggalJatuhTempo: tglJatuhTempo,
		JenisGiro:         input.JenisGiro,
		StatusGiro:        statusGiro,
		BankAccountID:     input.BankAccountID,
		Jumlah:            input.Jumlah,
		NamaPenerbit:      penerbit,
		BankPenerbit:      input.BankPenerbit,
		Keterangan:        input.Keterangan,
		NomorReferensi:    input.NomorReferensi,
		DaftarAkunGiroID:  akunGiroID,
		DaftarAkunLawanID: input.DaftarAkunLawanID,
	}

	if err := h.svc.UpdateGiroTransaction(uint(id), &req); err != nil {
		response.InternalError(c, "Gagal memperbarui transaksi giro", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi giro berhasil diperbarui", req)
}

func (h *CashBankHandler) DeleteGiroTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	if err := h.svc.DeleteGiroTransaction(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus transaksi giro", err)
		return
	}

	response.Success(c, http.StatusOK, "Transaksi giro berhasil dihapus", nil)
}

func (h *CashBankHandler) SubmitGiroToBank(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	if err := h.svc.SubmitGiroToBank(uint(id)); err != nil {
		response.InternalError(c, "Gagal mengubah status serah giro ke bank", err)
		return
	}

	response.Success(c, http.StatusOK, "Giro berhasil diserahkan ke bank", nil)
}

func (h *CashBankHandler) CashGiro(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	tgl := time.Now()
	var body struct {
		TanggalCair string `json:"tanggal_cair"`
	}
	if err := c.ShouldBindJSON(&body); err == nil && body.TanggalCair != "" {
		if t, err := time.Parse("2006-01-02", body.TanggalCair); err == nil {
			tgl = t
		}
	}

	userID := uint(1)
	if uid, exists := c.Get("userID"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	journal, err := h.svc.CashGiro(uint(id), tgl, userID)
	if err != nil {
		response.InternalError(c, "Gagal mencairkan giro", err)
		return
	}

	response.Success(c, http.StatusOK, "Giro berhasil dicairkan dan jurnal buku besar terbentuk", journal)
}

func (h *CashBankHandler) BounceGiro(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var body struct {
		Alasan string `json:"alasan"`
	}
	c.ShouldBindJSON(&body)

	if err := h.svc.BounceGiro(uint(id), body.Alasan); err != nil {
		response.InternalError(c, "Gagal menolak giro", err)
		return
	}

	response.Success(c, http.StatusOK, "Giro berhasil ditandai tolak / mundur", nil)
}

func (h *CashBankHandler) PostGiroToJournal(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid", err)
		return
	}

	var req PostCashToJournalRequest
	c.ShouldBindJSON(&req)

	userID := uint(1)
	if uid, exists := c.Get("userID"); exists {
		if u, ok := uid.(uint); ok {
			userID = u
		}
	}

	journal, err := h.svc.PostGiroToJournal(uint(id), userID, req.Details)
	if err != nil {
		response.InternalError(c, "Gagal memposting giro ke jurnal", err)
		return
	}

	response.Success(c, http.StatusOK, "Giro berhasil diposting ke jurnal buku besar", journal)
}

func (h *CashBankHandler) GetGiroReport(c *gin.Context) {
	now := time.Now()
	from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	to := now

	if fStr := c.Query("tanggal_dari"); fStr != "" {
		if t, err := time.Parse("2006-01-02", fStr); err == nil {
			from = t
		}
	}
	if tStr := c.Query("tanggal_sampai"); tStr != "" {
		if t, err := time.Parse("2006-01-02", tStr); err == nil {
			to = t
		}
	}

	var bankAccountID *uint
	if bID := c.Query("bank_account_id"); bID != "" {
		if id, err := strconv.ParseUint(bID, 10, 32); err == nil {
			uID := uint(id)
			bankAccountID = &uID
		}
	}

	data, err := h.svc.GetGiroReport(from, to, bankAccountID)
	if err != nil {
		response.InternalError(c, "Gagal mengambil laporan giro", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil laporan giro", data)
}
