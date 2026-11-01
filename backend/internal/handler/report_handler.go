package handler

import (
	"net/http"
	"strconv"
	"time"

	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	svc service.ReportService
}

func NewReportHandler(svc service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

func (h *ReportHandler) GetBukuBesarSummary(c *gin.Context) {
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

	jenisAkun := c.Query("jenis_akun")
	var accountID *uint
	if a := c.Query("daftar_akun_id"); a != "" && a != "all" {
		if aid, err := strconv.Atoi(a); err == nil && aid > 0 {
			u := uint(aid)
			accountID = &u
		}
	}

	data, err := h.svc.GetBukuBesarSummary(startDate, endDate, jenisAkun, accountID)
	if err != nil {
		response.InternalError(c, "Gagal mengambil ringkasan buku besar", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil ringkasan buku besar", data)
}

func (h *ReportHandler) GetBukuBesar(c *gin.Context) {
	accountID, err := strconv.Atoi(c.Param("accountId"))
	if err != nil {
		response.BadRequest(c, "ID Akun tidak valid", nil)
		return
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

	data, err := h.svc.GetBukuBesar(uint(accountID), startDate, endDate)
	if err != nil {
		response.InternalError(c, "Gagal mengambil data buku besar", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil buku besar akun", data)
}

func (h *ReportHandler) GetNeraca(c *gin.Context) {
	var startDate, endDate *time.Time

	fromParam := c.Query("start_date")
	if fromParam == "" {
		fromParam = c.Query("periode_dari")
	}
	if fromParam != "" {
		if t, err := time.Parse("2006-01-02", fromParam); err == nil {
			startDate = &t
		}
	}

	toParam := c.Query("end_date")
	if toParam == "" {
		toParam = c.Query("periode_sampai")
	}
	if toParam == "" {
		toParam = c.Query("tanggal")
	}
	if toParam != "" {
		if t, err := time.Parse("2006-01-02", toParam); err == nil {
			endDate = &t
		}
	}

	mode := c.DefaultQuery("mode", "akumulasi")
	includePenyesuaian := true
	if ip := c.Query("include_penyesuaian"); ip != "" {
		includePenyesuaian = ip == "true" || ip == "1"
	}

	neraca, err := h.svc.GetNeraca(startDate, endDate, mode, includePenyesuaian)
	if err != nil {
		response.InternalError(c, "Gagal mengambil laporan neraca", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil laporan neraca", neraca)
}

func (h *ReportHandler) GetLabaRugi(c *gin.Context) {
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endDate := now

	fromParam := c.Query("start_date")
	if fromParam == "" {
		fromParam = c.Query("periode_dari")
	}
	if fromParam != "" {
		if t, err := time.Parse("2006-01-02", fromParam); err == nil {
			startDate = t
		}
	}

	toParam := c.Query("end_date")
	if toParam == "" {
		toParam = c.Query("periode_sampai")
	}
	if toParam != "" {
		if t, err := time.Parse("2006-01-02", toParam); err == nil {
			endDate = t
		}
	}

	includePenyesuaian := true
	if ip := c.Query("include_penyesuaian"); ip != "" {
		includePenyesuaian = ip == "true" || ip == "1"
	}

	labaRugi, err := h.svc.GetLabaRugi(startDate, endDate, includePenyesuaian)
	if err != nil {
		response.InternalError(c, "Gagal mengambil laporan laba rugi", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil laporan laba rugi", labaRugi)
}

func (h *ReportHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.svc.GetDashboardStats()
	if err != nil {
		response.InternalError(c, "Gagal mengambil data statistik dashboard", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil statistik dashboard", stats)
}

func (h *ReportHandler) GetDampakPenyesuaian(c *gin.Context) {
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
	endDate := startDate.AddDate(0, 1, -1)

	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	} else if s := c.Query("periode_dari"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	}

	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	} else if e := c.Query("periode_sampai"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	}

	dampak, err := h.svc.GetDampakPenyesuaian(startDate, endDate)
	if err != nil {
		response.InternalError(c, "Gagal mengambil dampak jurnal penyesuaian", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil dampak jurnal penyesuaian", dampak)
}

func (h *ReportHandler) GetArusKas(c *gin.Context) {
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
	endDate := now

	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	} else if s := c.Query("periode_dari"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	}

	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	} else if e := c.Query("periode_sampai"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	}

	includePenyesuaian := true
	if inc := c.Query("include_penyesuaian"); inc != "" {
		includePenyesuaian = inc == "true" || inc == "1"
	}

	data, err := h.svc.GetArusKas(startDate, endDate, includePenyesuaian)
	if err != nil {
		response.InternalError(c, "Gagal mengambil laporan arus kas", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil laporan arus kas", data)
}

func (h *ReportHandler) GetPerubahanModal(c *gin.Context) {
	now := time.Now()
	startDate := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.Local)
	endDate := now

	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	} else if s := c.Query("periode_dari"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	}

	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	} else if e := c.Query("periode_sampai"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	}

	includePenyesuaian := true
	if inc := c.Query("include_penyesuaian"); inc != "" {
		includePenyesuaian = inc == "true" || inc == "1"
	}

	data, err := h.svc.GetPerubahanModal(startDate, endDate, includePenyesuaian)
	if err != nil {
		response.InternalError(c, "Gagal mengambil laporan perubahan modal", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil laporan perubahan modal", data)
}

func (h *ReportHandler) GetAnalisisRasio(c *gin.Context) {
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endDate := now

	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	} else if s := c.Query("periode_dari"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = t
		}
	}

	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	} else if e := c.Query("periode_sampai"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = t
		}
	} else if tStr := c.Query("tanggal"); tStr != "" {
		if t, err := time.Parse("2006-01-02", tStr); err == nil {
			endDate = t
		}
	}

	includePenyesuaian := true
	if inc := c.Query("include_penyesuaian"); inc != "" {
		includePenyesuaian = inc == "true" || inc == "1"
	}

	data, err := h.svc.GetAnalisisRasio(startDate, endDate, includePenyesuaian)
	if err != nil {
		response.InternalError(c, "Gagal mengambil analisis rasio keuangan", err)
		return
	}

	response.Success(c, http.StatusOK, "Berhasil mengambil analisis rasio keuangan", data)
}


