package service

import (
	"sort"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/repository"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type BukuBesarEntry struct {
	TanggalTransaksi time.Time       `json:"tanggal_transaksi"`
	NomorJurnal      string          `json:"nomor_jurnal"`
	Keterangan       string          `json:"keterangan"`
	Debit            decimal.Decimal `json:"debit"`
	Kredit           decimal.Decimal `json:"kredit"`
	Saldo            decimal.Decimal `json:"saldo"`
}

type BukuBesarResponse struct {
	Akun         model.ChartOfAccount `json:"akun"`
	SaldoAwal    decimal.Decimal      `json:"saldo_awal"`
	TotalDebit   decimal.Decimal      `json:"total_debit"`
	TotalKredit  decimal.Decimal      `json:"total_kredit"`
	SaldoAkhir   decimal.Decimal      `json:"saldo_akhir"`
	Transactions []BukuBesarEntry     `json:"transactions"`
}

type BukuBesarAccountSummary struct {
	Akun           model.ChartOfAccount `json:"akun"`
	SaldoAwal      decimal.Decimal      `json:"saldo_awal"`
	MutasiDebet    decimal.Decimal      `json:"mutasi_debet"`
	MutasiKredit   decimal.Decimal      `json:"mutasi_kredit"`
	SaldoAkhir     decimal.Decimal      `json:"saldo_akhir"`
	TransaksiCount int                  `json:"transaksi_count"`
}

type BukuBesarSummaryResponse struct {
	PeriodeDari       string                    `json:"periode_dari"`
	PeriodeSampai      string                    `json:"periode_sampai"`
	TotalSaldoAwal    decimal.Decimal           `json:"total_saldo_awal"`
	TotalMutasiDebet  decimal.Decimal           `json:"total_mutasi_debet"`
	TotalMutasiKredit decimal.Decimal           `json:"total_mutasi_kredit"`
	TotalSaldoAkhir   decimal.Decimal           `json:"total_saldo_akhir"`
	Accounts          []BukuBesarAccountSummary `json:"accounts"`
}

type NeracaItem struct {
	ID       uint            `json:"id,omitempty"`
	KodeAkun string          `json:"kode_akun"`
	NamaAkun string          `json:"nama_akun"`
	Saldo    decimal.Decimal `json:"saldo"`
}

type NeracaResponse struct {
	Tanggal            time.Time         `json:"tanggal"`
	PeriodeDari        string            `json:"periode_dari"`
	PeriodeSampai      string            `json:"periode_sampai"`
	Mode               string            `json:"mode"`
	IncludePenyesuaian bool              `json:"include_penyesuaian"`
	ParentMap          map[string]string `json:"parent_map"`
	AsetLancar         []NeracaItem      `json:"aset_lancar"`
	TotalAsetLancar    decimal.Decimal   `json:"total_aset_lancar"`
	AsetTetap          []NeracaItem      `json:"aset_tetap"`
	TotalAsetTetap     decimal.Decimal   `json:"total_aset_tetap"`
	TotalAset          decimal.Decimal   `json:"total_aset"`

	Kewajiban      []NeracaItem    `json:"kewajiban"`
	TotalKewajiban decimal.Decimal `json:"total_kewajiban"`
	Ekuitas        []NeracaItem    `json:"ekuitas"`
	TotalEkuitas   decimal.Decimal `json:"total_ekuitas"`
	TotalPasiva    decimal.Decimal `json:"total_pasiva"` // Kewajiban + Ekuitas
	IsBalance      bool            `json:"is_balance"`
}

type LabaRugiResponse struct {
	StartDate          time.Time         `json:"start_date"`
	EndDate            time.Time         `json:"end_date"`
	PeriodeDari        string            `json:"periode_dari"`
	PeriodeSampai      string            `json:"periode_sampai"`
	IncludePenyesuaian bool              `json:"include_penyesuaian"`
	ParentMap          map[string]string `json:"parent_map"`
	Pendapatan         []NeracaItem      `json:"pendapatan"`
	TotalPendapatan    decimal.Decimal   `json:"total_pendapatan"`
	Beban              []NeracaItem      `json:"beban"`
	TotalBeban         decimal.Decimal   `json:"total_beban"`
	LabaBersih         decimal.Decimal   `json:"laba_bersih"`
}

type DampakJurnalDetail struct {
	NomorJurnal string          `json:"nomor_jurnal"`
	Tanggal     string          `json:"tanggal"`
	Keterangan  string          `json:"keterangan"`
	Debit       decimal.Decimal `json:"debit"`
	Kredit      decimal.Decimal `json:"kredit"`
	Net         decimal.Decimal `json:"net"`
}

type DampakAkunItem struct {
	AkunID      uint                 `json:"akun_id"`
	KodeAkun    string               `json:"kode_akun"`
	NamaAkun    string               `json:"nama_akun"`
	JenisAkun   string               `json:"jenis_akun"`
	TotalDebit  decimal.Decimal      `json:"total_debit"`
	TotalKredit decimal.Decimal      `json:"total_kredit"`
	Net         decimal.Decimal      `json:"net"`
	JurnalList  []DampakJurnalDetail `json:"jurnal_list"`
}

type DampakPenyesuaianResponse struct {
	PeriodeDari            string                      `json:"periode_dari"`
	PeriodeSampai          string                      `json:"periode_sampai"`
	TotalJurnalPenyesuaian int                         `json:"total_jurnal_penyesuaian"`
	DampakPendapatan       decimal.Decimal             `json:"dampak_pendapatan"`
	DampakBeban            decimal.Decimal             `json:"dampak_beban"`
	DampakLabaRugi         decimal.Decimal             `json:"dampak_laba_rugi"`
	DampakAset             decimal.Decimal             `json:"dampak_aset"`
	DampakKewajiban        decimal.Decimal             `json:"dampak_kewajiban"`
	DampakModal            decimal.Decimal             `json:"dampak_modal"`
	DampakPerJenisAkun     map[string][]DampakAkunItem `json:"dampak_per_jenis_akun"`
}

type ArusKasDetail struct {
	Tanggal    time.Time       `json:"tanggal"`
	Keterangan string          `json:"keterangan"`
	Referensi  string          `json:"referensi"`
	KasMasuk   decimal.Decimal `json:"kas_masuk"`
	KasKeluar  decimal.Decimal `json:"kas_keluar"`
	Net        decimal.Decimal `json:"net"`
}

type ArusKasAccountGroup struct {
	Akun        model.ChartOfAccount `json:"akun"`
	SaldoAwal   decimal.Decimal      `json:"saldo_awal"`
	TotalMasuk  decimal.Decimal      `json:"total_masuk"`
	TotalKeluar decimal.Decimal      `json:"total_keluar"`
	Net         decimal.Decimal      `json:"net"`
	SaldoAkhir  decimal.Decimal      `json:"saldo_akhir"`
	Transaksi   []ArusKasDetail      `json:"transaksi"`
}

type ArusKasResponse struct {
	PeriodeDari     string                `json:"periode_dari"`
	PeriodeSampai   string                `json:"periode_sampai"`
	TotalSaldoAwal  decimal.Decimal       `json:"total_saldo_awal"`
	TotalKasMasuk   decimal.Decimal       `json:"total_kas_masuk"`
	TotalKasKeluar  decimal.Decimal       `json:"total_kas_keluar"`
	NetArusKas      decimal.Decimal       `json:"net_arus_kas"`
	TotalSaldoAkhir decimal.Decimal       `json:"total_saldo_akhir"`
	Accounts        []ArusKasAccountGroup `json:"accounts"`
}

type DetailLabaDitahanBulan struct {
	Bulan          string          `json:"bulan"`
	Tahun          int             `json:"tahun"`
	BulanNum       int             `json:"bulan_num"`
	PeriodeDari    string          `json:"periode_dari"`
	PeriodeSampai  string          `json:"periode_sampai"`
	LabaRugi       decimal.Decimal `json:"laba_rugi"`
	SaldoAkumulasi decimal.Decimal `json:"saldo_akumulasi"`
}

type DetailModalAccount struct {
	Akun       model.ChartOfAccount `json:"akun"`
	SaldoAwal  decimal.Decimal      `json:"saldo_awal"`
	Mutasi     decimal.Decimal      `json:"mutasi"`
	SaldoAkhir decimal.Decimal      `json:"saldo_akhir"`
}

type PerubahanModalResponse struct {
	PeriodeDari               string                   `json:"periode_dari"`
	PeriodeSampai              string                   `json:"periode_sampai"`
	SaldoAwalModal            decimal.Decimal          `json:"saldo_awal_modal"`
	LabaDitahan               decimal.Decimal          `json:"laba_ditahan"`
	DetailLabaDitahanPerBulan []DetailLabaDitahanBulan `json:"detail_laba_ditahan_per_bulan"`
	LabaRugiPeriode           decimal.Decimal          `json:"laba_rugi_periode"`
	TambahanInvestasi         decimal.Decimal          `json:"tambahan_investasi"`
	Penarikan                 decimal.Decimal          `json:"penarikan"`
	SaldoAkhirModal           decimal.Decimal          `json:"saldo_akhir_modal"`
	DetailModal               []DetailModalAccount     `json:"detail_modal"`
}

type AnalisisRasioResponse struct {
	PeriodeDari          string          `json:"periode_dari"`
	PeriodeSampai        string          `json:"periode_sampai"`
	TotalAsetLancar      decimal.Decimal `json:"total_aset_lancar"`
	TotalKewajibanLancar decimal.Decimal `json:"total_kewajiban_lancar"`
	TotalKas             decimal.Decimal `json:"total_kas"`
	TotalPersediaan      decimal.Decimal `json:"total_persediaan"`
	TotalAset            decimal.Decimal `json:"total_aset"`
	TotalKewajiban       decimal.Decimal `json:"total_kewajiban"`
	TotalEkuitas         decimal.Decimal `json:"total_ekuitas"`
	ModalKerja           decimal.Decimal `json:"modal_kerja"`
	CurrentRatio         float64         `json:"current_ratio"`
	QuickRatio           float64         `json:"quick_ratio"`
	CashRatio            float64         `json:"cash_ratio"`
	DebtToAssetRatio     float64         `json:"debt_to_asset_ratio"`
	DebtToEquityRatio    float64         `json:"debt_to_equity_ratio"`
}

type DashboardKasBankItem struct {
	ID       uint            `json:"id"`
	KodeAkun string          `json:"kode_akun"`
	NamaAkun string          `json:"nama_akun"`
	Saldo    decimal.Decimal `json:"saldo"`
}

type DashboardRecentJournal struct {
	ID               uint            `json:"id"`
	NomorJurnal      string          `json:"nomor_jurnal"`
	TanggalTransaksi string          `json:"tanggal_transaksi"`
	Keterangan       string          `json:"keterangan"`
	TotalDebit       decimal.Decimal `json:"total_debit"`
	Status           string          `json:"status"`
}

type DashboardStatsResponse struct {
	TotalAkun        int64                    `json:"total_akun"`
	TotalJurnal      int64                    `json:"total_jurnal"`
	TotalDraftJurnal int64                    `json:"total_draft_jurnal"`
	TotalPosted      int64                    `json:"total_posted"`
	TotalAset        decimal.Decimal          `json:"total_aset"`
	TotalKewajiban   decimal.Decimal          `json:"total_kewajiban"`
	TotalEkuitas     decimal.Decimal          `json:"total_ekuitas"`
	LabaBersihBulan  decimal.Decimal          `json:"laba_bersih_bulan"`
	TotalPendapatan  decimal.Decimal          `json:"total_pendapatan"`
	TotalBeban       decimal.Decimal          `json:"total_beban"`
	TotalKasBank     decimal.Decimal          `json:"total_kas_bank"`
	KasBankAccounts  []DashboardKasBankItem   `json:"kas_bank_accounts"`
	RecentJournals   []DashboardRecentJournal `json:"recent_journals"`
	CurrentRatio     float64                  `json:"current_ratio"`
}

type ReportService interface {
	GetBukuBesar(accountID uint, startDate, endDate *time.Time) (*BukuBesarResponse, error)
	GetBukuBesarSummary(startDate, endDate *time.Time, jenisAkun string, accountID *uint) (*BukuBesarSummaryResponse, error)
	GetNeraca(startDate, endDate *time.Time, mode string, includePenyesuaian bool) (*NeracaResponse, error)
	GetLabaRugi(startDate, endDate time.Time, includePenyesuaian bool) (*LabaRugiResponse, error)
	GetDampakPenyesuaian(startDate, endDate time.Time) (*DampakPenyesuaianResponse, error)
	GetArusKas(startDate, endDate time.Time, includePenyesuaian bool) (*ArusKasResponse, error)
	GetPerubahanModal(startDate, endDate time.Time, includePenyesuaian bool) (*PerubahanModalResponse, error)
	GetAnalisisRasio(startDate, endDate time.Time, includePenyesuaian bool) (*AnalisisRasioResponse, error)
	GetDashboardStats() (*DashboardStatsResponse, error)
}

type reportService struct {
	accountRepo repository.AccountRepository
	journalRepo repository.JournalRepository
	db          *gorm.DB
}

func NewReportService(accountRepo repository.AccountRepository, journalRepo repository.JournalRepository, db *gorm.DB) ReportService {
	return &reportService{
		accountRepo: accountRepo,
		journalRepo: journalRepo,
		db:          db,
	}
}

type accountSummary struct {
	DaftarAkunID uint            `gorm:"column:daftar_akun_id"`
	TotalDebit   decimal.Decimal `gorm:"column:total_debit"`
	TotalKredit  decimal.Decimal `gorm:"column:total_kredit"`
}

func (s *reportService) GetBukuBesar(accountID uint, startDate, endDate *time.Time) (*BukuBesarResponse, error) {
	account, err := s.accountRepo.GetByID(accountID)
	if err != nil {
		return nil, err
	}

	// Hitung saldo awal sebelum startDate
	saldoAwal := decimal.Zero
	if startDate != nil {
		type sumResult struct {
			TotalDebit  decimal.Decimal `gorm:"column:total_debit"`
			TotalKredit decimal.Decimal `gorm:"column:total_kredit"`
		}
		var prev sumResult
		s.db.Table("detail_jurnal dj").
			Select("COALESCE(SUM(dj.jumlah_debit), 0) as total_debit, COALESCE(SUM(dj.jumlah_kredit), 0) as total_kredit").
			Joins("JOIN jurnal j ON j.id = dj.jurnal_id").
			Where("dj.daftar_akun_id = ? AND j.tanggal_transaksi < ? AND j.status = ? AND j.deleted_at IS NULL", accountID, *startDate, model.StatusPosted).
			Scan(&prev)

		if account.SaldoNormal == model.SaldoDebit {
			saldoAwal = prev.TotalDebit.Sub(prev.TotalKredit)
		} else {
			saldoAwal = prev.TotalKredit.Sub(prev.TotalDebit)
		}
	}

	details, err := s.journalRepo.GetDetailsByAccount(accountID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	res := &BukuBesarResponse{
		Akun:         *account,
		SaldoAwal:    saldoAwal,
		TotalDebit:   decimal.Zero,
		TotalKredit:  decimal.Zero,
		Transactions: make([]BukuBesarEntry, 0, len(details)),
	}

	// Batch fetch header journals to avoid N+1 query in loop
	journalMap := make(map[uint]model.Journal)
	if len(details) > 0 {
		journalIDSet := make(map[uint]bool)
		for _, d := range details {
			journalIDSet[d.JurnalID] = true
		}
		journalIDs := make([]uint, 0, len(journalIDSet))
		for id := range journalIDSet {
			journalIDs = append(journalIDs, id)
		}

		var journals []model.Journal
		if err := s.db.Where("id IN ?", journalIDs).Find(&journals).Error; err == nil {
			for _, j := range journals {
				journalMap[j.ID] = j
			}
		}
	}

	currentSaldo := saldoAwal
	for _, d := range details {
		j := journalMap[d.JurnalID]

		res.TotalDebit = res.TotalDebit.Add(d.JumlahDebit)
		res.TotalKredit = res.TotalKredit.Add(d.JumlahKredit)

		if account.SaldoNormal == model.SaldoDebit {
			currentSaldo = currentSaldo.Add(d.JumlahDebit).Sub(d.JumlahKredit)
		} else {
			currentSaldo = currentSaldo.Add(d.JumlahKredit).Sub(d.JumlahDebit)
		}

		ket := d.Keterangan
		if ket == "" {
			ket = j.Keterangan
		}

		res.Transactions = append(res.Transactions, BukuBesarEntry{
			TanggalTransaksi: j.TanggalTransaksi,
			NomorJurnal:      j.NomorJurnal,
			Keterangan:       ket,
			Debit:            d.JumlahDebit,
			Kredit:           d.JumlahKredit,
			Saldo:            currentSaldo,
		})
	}

	res.SaldoAkhir = currentSaldo
	return res, nil
}

func (s *reportService) GetBukuBesarSummary(startDate, endDate *time.Time, jenisAkun string, accountID *uint) (*BukuBesarSummaryResponse, error) {
	now := time.Now()
	var start, end time.Time
	if startDate != nil {
		start = *startDate
	} else {
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}
	if endDate != nil {
		end = *endDate
	} else {
		end = start.AddDate(0, 1, -1)
	}

	// Query akun aktif
	akunQuery := s.db.Model(&model.ChartOfAccount{}).Where("is_aktif = ?", true)
	if jenisAkun != "" && jenisAkun != "all" {
		akunQuery = akunQuery.Where("jenis_akun = ?", jenisAkun)
	}
	if accountID != nil && *accountID > 0 {
		akunQuery = akunQuery.Where("id = ?", *accountID)
	}

	var accounts []model.ChartOfAccount
	if err := akunQuery.Order("kode_akun asc").Find(&accounts).Error; err != nil {
		return nil, err
	}

	// 1. Saldo awal per akun (transaksi sebelum start)
	type prevAgg struct {
		DaftarAkunID uint            `gorm:"column:daftar_akun_id"`
		TotalDebit   decimal.Decimal `gorm:"column:total_debit"`
		TotalKredit  decimal.Decimal `gorm:"column:total_kredit"`
	}
	var prevList []prevAgg
	if err := s.db.Table("detail_jurnal dj").
		Select("dj.daftar_akun_id, COALESCE(SUM(dj.jumlah_debit), 0) as total_debit, COALESCE(SUM(dj.jumlah_kredit), 0) as total_kredit").
		Joins("JOIN jurnal j ON j.id = dj.jurnal_id").
		Where("j.tanggal_transaksi < ? AND j.status = ? AND j.deleted_at IS NULL", start, model.StatusPosted).
		Group("dj.daftar_akun_id").
		Scan(&prevList).Error; err != nil {
		return nil, err
	}

	prevMap := make(map[uint]prevAgg)
	for _, p := range prevList {
		prevMap[p.DaftarAkunID] = p
	}

	// 2. Mutasi transaksi dalam periode (antara start dan end)
	type periodAgg struct {
		DaftarAkunID uint            `gorm:"column:daftar_akun_id"`
		TotalDebit   decimal.Decimal `gorm:"column:total_debit"`
		TotalKredit  decimal.Decimal `gorm:"column:total_kredit"`
		TxCount      int             `gorm:"column:tx_count"`
	}
	var periodList []periodAgg
	if err := s.db.Table("detail_jurnal dj").
		Select("dj.daftar_akun_id, COALESCE(SUM(dj.jumlah_debit), 0) as total_debit, COALESCE(SUM(dj.jumlah_kredit), 0) as total_kredit, COUNT(*) as tx_count").
		Joins("JOIN jurnal j ON j.id = dj.jurnal_id").
		Where("j.tanggal_transaksi >= ? AND j.tanggal_transaksi <= ? AND j.status = ? AND j.deleted_at IS NULL", start, end, model.StatusPosted).
		Group("dj.daftar_akun_id").
		Scan(&periodList).Error; err != nil {
		return nil, err
	}

	periodMap := make(map[uint]periodAgg)
	for _, p := range periodList {
		periodMap[p.DaftarAkunID] = p
	}

	response := &BukuBesarSummaryResponse{
		PeriodeDari:       start.Format("2006-01-02"),
		PeriodeSampai:      end.Format("2006-01-02"),
		TotalSaldoAwal:    decimal.Zero,
		TotalMutasiDebet:  decimal.Zero,
		TotalMutasiKredit: decimal.Zero,
		TotalSaldoAkhir:   decimal.Zero,
		Accounts:          make([]BukuBesarAccountSummary, 0, len(accounts)),
	}

	for _, acc := range accounts {
		prev := prevMap[acc.ID]
		period := periodMap[acc.ID]

		saldoAwal := decimal.Zero
		if acc.SaldoNormal == model.SaldoDebit {
			saldoAwal = prev.TotalDebit.Sub(prev.TotalKredit)
		} else {
			saldoAwal = prev.TotalKredit.Sub(prev.TotalDebit)
		}

		mutasiDebet := period.TotalDebit
		mutasiKredit := period.TotalKredit

		saldoAkhir := saldoAwal
		if acc.SaldoNormal == model.SaldoDebit {
			saldoAkhir = saldoAwal.Add(mutasiDebet).Sub(mutasiKredit)
		} else {
			saldoAkhir = saldoAwal.Add(mutasiKredit).Sub(mutasiDebet)
		}

		// Lewati akun yang sama sekali tidak memiliki saldo awal, mutasi, dan saldo akhir (kecuali difilter per akun spesifik)
		if (accountID == nil || *accountID == 0) && saldoAwal.IsZero() && mutasiDebet.IsZero() && mutasiKredit.IsZero() && saldoAkhir.IsZero() && period.TxCount == 0 {
			continue
		}

		response.TotalSaldoAwal = response.TotalSaldoAwal.Add(saldoAwal)
		response.TotalMutasiDebet = response.TotalMutasiDebet.Add(mutasiDebet)
		response.TotalMutasiKredit = response.TotalMutasiKredit.Add(mutasiKredit)
		response.TotalSaldoAkhir = response.TotalSaldoAkhir.Add(saldoAkhir)

		response.Accounts = append(response.Accounts, BukuBesarAccountSummary{
			Akun:           acc,
			SaldoAwal:      saldoAwal,
			MutasiDebet:    mutasiDebet,
			MutasiKredit:   mutasiKredit,
			SaldoAkhir:     saldoAkhir,
			TransaksiCount: period.TxCount,
		})
	}

	return response, nil
}

func (s *reportService) GetNeraca(startDate, endDate *time.Time, mode string, includePenyesuaian bool) (*NeracaResponse, error) {
	now := time.Now()
	var start, end time.Time
	if startDate != nil {
		start = *startDate
	} else {
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}
	if endDate != nil {
		end = *endDate
	} else {
		end = now
	}

	if mode != "periode" {
		mode = "akumulasi"
	}

	accounts, err := s.accountRepo.GetAll("", nil)
	if err != nil {
		return nil, err
	}

	// Single Aggregated Query with GROUP BY to avoid N+1 queries in loop
	// Mode Akumulasi (standar): jurnal.tanggal_transaksi <= end
	// Mode Periode (analisis mutasi): jurnal.tanggal_transaksi >= start AND jurnal.tanggal_transaksi <= end
	query := s.db.Model(&model.JournalDetail{}).
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("jurnal.status = ?", model.StatusPosted)

	if !includePenyesuaian {
		query = query.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
	}

	if mode == "periode" {
		query = query.Where("jurnal.tanggal_transaksi >= ? AND jurnal.tanggal_transaksi <= ?", start, end)
	} else {
		query = query.Where("jurnal.tanggal_transaksi <= ?", end)
	}

	var summaries []accountSummary
	err = query.Select("detail_jurnal.daftar_akun_id, COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").
		Group("detail_jurnal.daftar_akun_id").
		Scan(&summaries).Error
	if err != nil {
		return nil, err
	}

	balanceMap := make(map[uint]accountSummary, len(summaries))
	for _, sum := range summaries {
		balanceMap[sum.DaftarAkunID] = sum
	}

	parentMap := make(map[string]string)
	for _, acc := range accounts {
		if len(acc.KodeAkun) == 2 {
			parentMap[acc.KodeAkun] = acc.NamaAkun
		}
	}

	resp := &NeracaResponse{
		Tanggal:            end,
		PeriodeDari:        start.Format("2006-01-02"),
		PeriodeSampai:      end.Format("2006-01-02"),
		Mode:               mode,
		IncludePenyesuaian: includePenyesuaian,
		ParentMap:          parentMap,
		AsetLancar:         make([]NeracaItem, 0),
		AsetTetap:          make([]NeracaItem, 0),
		Kewajiban:          make([]NeracaItem, 0),
		Ekuitas:            make([]NeracaItem, 0),
		TotalAsetLancar:    decimal.Zero,
		TotalAsetTetap:     decimal.Zero,
		TotalAset:          decimal.Zero,
		TotalKewajiban:     decimal.Zero,
		TotalEkuitas:       decimal.Zero,
		TotalPasiva:        decimal.Zero,
	}

	for _, acc := range accounts {
		sum := balanceMap[acc.ID]

		var saldo decimal.Decimal
		if acc.SaldoNormal == model.SaldoDebit {
			saldo = sum.TotalDebit.Sub(sum.TotalKredit)
		} else {
			saldo = sum.TotalKredit.Sub(sum.TotalDebit)
		}

		// Lewati akun yang saldonya 0 dan tidak ada mutasi
		if saldo.IsZero() && sum.TotalDebit.IsZero() && sum.TotalKredit.IsZero() {
			continue
		}

		item := NeracaItem{
			ID:       acc.ID,
			KodeAkun: acc.KodeAkun,
			NamaAkun: acc.NamaAkun,
			Saldo:    saldo,
		}

		switch acc.JenisAkun {
		case model.JenisAset:
			if acc.SubJenis == "tetap" {
				resp.AsetTetap = append(resp.AsetTetap, item)
				resp.TotalAsetTetap = resp.TotalAsetTetap.Add(saldo)
			} else {
				resp.AsetLancar = append(resp.AsetLancar, item)
				resp.TotalAsetLancar = resp.TotalAsetLancar.Add(saldo)
			}
			resp.TotalAset = resp.TotalAset.Add(saldo)
		case model.JenisKewajiban:
			resp.Kewajiban = append(resp.Kewajiban, item)
			resp.TotalKewajiban = resp.TotalKewajiban.Add(saldo)
		case model.JenisEkuitas, model.JenisModal:
			resp.Ekuitas = append(resp.Ekuitas, item)
			resp.TotalEkuitas = resp.TotalEkuitas.Add(saldo)
		}
	}

	// Hitung Laba/Rugi Berjalan up to asOfDate (sesuai standar akuntansi Laravel)
	labaRugiBerjalan := decimal.Zero
	for _, acc := range accounts {
		sum := balanceMap[acc.ID]
		if acc.JenisAkun == model.JenisPendapatan {
			labaRugiBerjalan = labaRugiBerjalan.Add(sum.TotalKredit.Sub(sum.TotalDebit))
		} else if acc.JenisAkun == model.JenisBeban {
			labaRugiBerjalan = labaRugiBerjalan.Sub(sum.TotalDebit.Sub(sum.TotalKredit))
		}
	}

	if !labaRugiBerjalan.IsZero() {
		resp.Ekuitas = append(resp.Ekuitas, NeracaItem{
			KodeAkun: "-",
			NamaAkun: "Laba (Rugi) Periode Berjalan",
			Saldo:    labaRugiBerjalan,
		})
		resp.TotalEkuitas = resp.TotalEkuitas.Add(labaRugiBerjalan)
	}

	resp.TotalPasiva = resp.TotalKewajiban.Add(resp.TotalEkuitas)
	diff := resp.TotalAset.Sub(resp.TotalPasiva).Abs()
	resp.IsBalance = diff.LessThanOrEqual(decimal.NewFromFloat(0.01))

	return resp, nil
}

func (s *reportService) GetLabaRugi(startDate, endDate time.Time, includePenyesuaian bool) (*LabaRugiResponse, error) {
	accounts, err := s.accountRepo.GetAll("", nil)
	if err != nil {
		return nil, err
	}

	query := s.db.Model(&model.JournalDetail{}).
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("jurnal.status = ? AND jurnal.tanggal_transaksi >= ? AND jurnal.tanggal_transaksi <= ?", model.StatusPosted, startDate, endDate)

	if !includePenyesuaian {
		query = query.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
	}

	var summaries []accountSummary
	err = query.Select("detail_jurnal.daftar_akun_id, COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").
		Group("detail_jurnal.daftar_akun_id").
		Scan(&summaries).Error
	if err != nil {
		return nil, err
	}

	balanceMap := make(map[uint]accountSummary, len(summaries))
	for _, sum := range summaries {
		balanceMap[sum.DaftarAkunID] = sum
	}

	parentMap := make(map[string]string)
	for _, acc := range accounts {
		if len(acc.KodeAkun) == 2 {
			parentMap[acc.KodeAkun] = acc.NamaAkun
		}
	}

	resp := &LabaRugiResponse{
		StartDate:          startDate,
		EndDate:            endDate,
		PeriodeDari:        startDate.Format("2006-01-02"),
		PeriodeSampai:      endDate.Format("2006-01-02"),
		IncludePenyesuaian: includePenyesuaian,
		ParentMap:          parentMap,
		Pendapatan:         make([]NeracaItem, 0),
		Beban:              make([]NeracaItem, 0),
		TotalPendapatan:    decimal.Zero,
		TotalBeban:         decimal.Zero,
	}

	for _, acc := range accounts {
		if acc.JenisAkun != model.JenisPendapatan && acc.JenisAkun != model.JenisBeban {
			continue
		}

		sum := balanceMap[acc.ID]

		var saldo decimal.Decimal
		if acc.JenisAkun == model.JenisPendapatan {
			saldo = sum.TotalKredit.Sub(sum.TotalDebit)
		} else if acc.JenisAkun == model.JenisBeban {
			saldo = sum.TotalDebit.Sub(sum.TotalKredit)
		} else if acc.SaldoNormal == model.SaldoKredit {
			saldo = sum.TotalKredit.Sub(sum.TotalDebit)
		} else {
			saldo = sum.TotalDebit.Sub(sum.TotalKredit)
		}

		// Prune zero-balance accounts with no activity
		if saldo.IsZero() && sum.TotalDebit.IsZero() && sum.TotalKredit.IsZero() {
			continue
		}

		item := NeracaItem{
			ID:       acc.ID,
			KodeAkun: acc.KodeAkun,
			NamaAkun: acc.NamaAkun,
			Saldo:    saldo,
		}

		if acc.JenisAkun == model.JenisPendapatan {
			resp.Pendapatan = append(resp.Pendapatan, item)
			resp.TotalPendapatan = resp.TotalPendapatan.Add(saldo)
		} else if acc.JenisAkun == model.JenisBeban {
			resp.Beban = append(resp.Beban, item)
			resp.TotalBeban = resp.TotalBeban.Add(saldo)
		}
	}

	resp.LabaBersih = resp.TotalPendapatan.Sub(resp.TotalBeban)
	return resp, nil
}

func (s *reportService) GetDashboardStats() (*DashboardStatsResponse, error) {
	var totalAkun int64
	var totalJurnal int64
	var totalDraft int64
	var totalPosted int64

	s.db.Model(&model.ChartOfAccount{}).Count(&totalAkun)
	s.db.Model(&model.Journal{}).Count(&totalJurnal)
	s.db.Model(&model.Journal{}).Where("status = ?", model.StatusDraft).Count(&totalDraft)
	s.db.Model(&model.Journal{}).Where("status = ?", model.StatusPosted).Count(&totalPosted)

	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Hitung total aset
	var asetDebit, asetKredit decimal.Decimal
	s.db.Model(&model.JournalDetail{}).
		Joins("JOIN daftar_akun ON daftar_akun.id = detail_jurnal.daftar_akun_id").
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("jurnal.status = ? AND daftar_akun.jenis_akun = ?", model.StatusPosted, model.JenisAset).
		Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").
		Row().Scan(&asetDebit, &asetKredit)
	totalAset := asetDebit.Sub(asetKredit)

	// Hitung total kewajiban
	var kewajibanDebit, kewajibanKredit decimal.Decimal
	s.db.Model(&model.JournalDetail{}).
		Joins("JOIN daftar_akun ON daftar_akun.id = detail_jurnal.daftar_akun_id").
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("jurnal.status = ? AND daftar_akun.jenis_akun = ?", model.StatusPosted, model.JenisKewajiban).
		Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").
		Row().Scan(&kewajibanDebit, &kewajibanKredit)
	totalKewajiban := kewajibanKredit.Sub(kewajibanDebit)

	// Hitung total ekuitas
	var ekuitasDebit, ekuitasKredit decimal.Decimal
	s.db.Model(&model.JournalDetail{}).
		Joins("JOIN daftar_akun ON daftar_akun.id = detail_jurnal.daftar_akun_id").
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("jurnal.status = ? AND (daftar_akun.jenis_akun = ? OR daftar_akun.jenis_akun = 'modal')", model.StatusPosted, model.JenisEkuitas).
		Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").
		Row().Scan(&ekuitasDebit, &ekuitasKredit)
	totalEkuitas := ekuitasKredit.Sub(ekuitasDebit)

	// Hitung laba bersih bulan berjalan (pendapatan - beban)
	var pendapatanDebit, pendapatanKredit decimal.Decimal
	s.db.Model(&model.JournalDetail{}).
		Joins("JOIN daftar_akun ON daftar_akun.id = detail_jurnal.daftar_akun_id").
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("jurnal.status = ? AND daftar_akun.jenis_akun = ? AND jurnal.tanggal_transaksi >= ?", model.StatusPosted, model.JenisPendapatan, startOfMonth).
		Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").
		Row().Scan(&pendapatanDebit, &pendapatanKredit)
	pendapatan := pendapatanKredit.Sub(pendapatanDebit)

	var bebanDebit, bebanKredit decimal.Decimal
	s.db.Model(&model.JournalDetail{}).
		Joins("JOIN daftar_akun ON daftar_akun.id = detail_jurnal.daftar_akun_id").
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Where("jurnal.status = ? AND daftar_akun.jenis_akun = ? AND jurnal.tanggal_transaksi >= ?", model.StatusPosted, model.JenisBeban, startOfMonth).
		Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").
		Row().Scan(&bebanDebit, &bebanKredit)
	beban := bebanDebit.Sub(bebanKredit)

	labaBersih := pendapatan.Sub(beban)

	// Kas & Bank Accounts
	var kasBankItems []DashboardKasBankItem
	type coaBalRow struct {
		ID       uint
		KodeAkun string
		NamaAkun string
		Deb      decimal.Decimal
		Kre      decimal.Decimal
	}
	var coaRows []coaBalRow
	s.db.Model(&model.ChartOfAccount{}).
		Select("daftar_akun.id, daftar_akun.kode_akun, daftar_akun.nama_akun, COALESCE(SUM(dj.jumlah_debit), 0) as deb, COALESCE(SUM(dj.jumlah_kredit), 0) as kre").
		Joins("LEFT JOIN detail_jurnal dj ON dj.daftar_akun_id = daftar_akun.id").
		Joins("LEFT JOIN jurnal j ON j.id = dj.jurnal_id AND j.status = 'posted'").
		Where("daftar_akun.jenis_akun = 'aset' AND (daftar_akun.kode_akun LIKE '111%' OR daftar_akun.kode_akun LIKE '112%' OR LOWER(daftar_akun.nama_akun) LIKE '%kas%' OR LOWER(daftar_akun.nama_akun) LIKE '%bank%')").
		Group("daftar_akun.id, daftar_akun.kode_akun, daftar_akun.nama_akun").
		Order("daftar_akun.kode_akun ASC").
		Limit(8).
		Scan(&coaRows)

	totalKasBank := decimal.Zero
	for _, r := range coaRows {
		net := r.Deb.Sub(r.Kre)
		totalKasBank = totalKasBank.Add(net)
		kasBankItems = append(kasBankItems, DashboardKasBankItem{
			ID:       r.ID,
			KodeAkun: r.KodeAkun,
			NamaAkun: r.NamaAkun,
			Saldo:    net,
		})
	}

	// Recent 5 Journals
	var recentJurnals []model.Journal
	s.db.Order("tanggal_transaksi DESC, id DESC").Limit(5).Find(&recentJurnals)
	var recentJournalItems []DashboardRecentJournal
	for _, j := range recentJurnals {
		recentJournalItems = append(recentJournalItems, DashboardRecentJournal{
			ID:               j.ID,
			NomorJurnal:      j.NomorJurnal,
			TanggalTransaksi: j.TanggalTransaksi.Format("2006-01-02"),
			Keterangan:       j.Keterangan,
			TotalDebit:       j.TotalDebit,
			Status:           string(j.Status),
		})
	}

	// Quick Current Ratio
	currentRatio := 0.0
	if !totalKewajiban.IsZero() && totalKewajiban.GreaterThan(decimal.Zero) {
		r, _ := totalAset.Div(totalKewajiban).Float64()
		currentRatio = r
	} else if totalAset.GreaterThan(decimal.Zero) {
		currentRatio = 99.99
	}

	return &DashboardStatsResponse{
		TotalAkun:        totalAkun,
		TotalJurnal:      totalJurnal,
		TotalDraftJurnal: totalDraft,
		TotalPosted:      totalPosted,
		TotalAset:        totalAset,
		TotalKewajiban:   totalKewajiban,
		TotalEkuitas:     totalEkuitas,
		LabaBersihBulan:  labaBersih,
		TotalPendapatan:  pendapatan,
		TotalBeban:       beban,
		TotalKasBank:     totalKasBank,
		KasBankAccounts:  kasBankItems,
		RecentJournals:   recentJournalItems,
		CurrentRatio:     currentRatio,
	}, nil
}

func (s *reportService) GetDampakPenyesuaian(startDate, endDate time.Time) (*DampakPenyesuaianResponse, error) {
	var journals []model.Journal
	err := s.db.Preload("Details.DaftarAkun").
		Where("jenis_jurnal = ? AND status = ? AND tanggal_transaksi BETWEEN ? AND ?",
			model.JenisJurnalPenyesuaian, model.StatusPosted, startDate, endDate).
		Order("tanggal_transaksi ASC, id ASC").
		Find(&journals).Error
	if err != nil {
		return nil, err
	}

	dampakPerAkun := make(map[uint]*DampakAkunItem)

	for _, j := range journals {
		tglStr := j.TanggalTransaksi.Format("2006-01-02")
		for _, d := range j.Details {
			akunID := d.DaftarAkunID
			item, exists := dampakPerAkun[akunID]
			if !exists {
				var kode, nama, jenis string
				if d.DaftarAkun != nil {
					kode = d.DaftarAkun.KodeAkun
					nama = d.DaftarAkun.NamaAkun
					jenis = string(d.DaftarAkun.JenisAkun)
				}
				item = &DampakAkunItem{
					AkunID:      akunID,
					KodeAkun:    kode,
					NamaAkun:    nama,
					JenisAkun:   jenis,
					TotalDebit:  decimal.Zero,
					TotalKredit: decimal.Zero,
					Net:         decimal.Zero,
					JurnalList:  []DampakJurnalDetail{},
				}
				dampakPerAkun[akunID] = item
			}

			item.TotalDebit = item.TotalDebit.Add(d.JumlahDebit)
			item.TotalKredit = item.TotalKredit.Add(d.JumlahKredit)

			isNormalDebit := item.JenisAkun == "aset" || item.JenisAkun == "beban"
			var netTrx decimal.Decimal
			if isNormalDebit {
				netTrx = d.JumlahDebit.Sub(d.JumlahKredit)
			} else {
				netTrx = d.JumlahKredit.Sub(d.JumlahDebit)
			}
			item.Net = item.Net.Add(netTrx)

			item.JurnalList = append(item.JurnalList, DampakJurnalDetail{
				NomorJurnal: j.NomorJurnal,
				Tanggal:     tglStr,
				Keterangan:  d.Keterangan,
				Debit:       d.JumlahDebit,
				Kredit:      d.JumlahKredit,
				Net:         netTrx,
			})
		}
	}

	dampakPerJenis := map[string][]DampakAkunItem{
		"aset":       {},
		"kewajiban":  {},
		"ekuitas":    {},
		"pendapatan": {},
		"beban":      {},
	}

	var totalPendapatan, totalBeban, totalAset, totalKewajiban, totalModal decimal.Decimal

	for _, item := range dampakPerAkun {
		kategori := strings.ToLower(item.JenisAkun)
		if kategori == "modal" {
			kategori = "ekuitas"
		}
		if _, ok := dampakPerJenis[kategori]; !ok {
			dampakPerJenis[kategori] = []DampakAkunItem{}
		}
		dampakPerJenis[kategori] = append(dampakPerJenis[kategori], *item)

		switch kategori {
		case "pendapatan":
			totalPendapatan = totalPendapatan.Add(item.Net)
		case "beban":
			totalBeban = totalBeban.Add(item.Net)
		case "aset":
			totalAset = totalAset.Add(item.Net)
		case "kewajiban":
			totalKewajiban = totalKewajiban.Add(item.Net)
		case "ekuitas":
			totalModal = totalModal.Add(item.Net)
		}
	}

	for kat := range dampakPerJenis {
		sort.Slice(dampakPerJenis[kat], func(i, j int) bool {
			return dampakPerJenis[kat][i].KodeAkun < dampakPerJenis[kat][j].KodeAkun
		})
	}

	totalLabaRugi := totalPendapatan.Sub(totalBeban)

	return &DampakPenyesuaianResponse{
		PeriodeDari:            startDate.Format("2006-01-02"),
		PeriodeSampai:          endDate.Format("2006-01-02"),
		TotalJurnalPenyesuaian: len(journals),
		DampakPendapatan:       totalPendapatan,
		DampakBeban:            totalBeban,
		DampakLabaRugi:         totalLabaRugi,
		DampakAset:             totalAset,
		DampakKewajiban:        totalKewajiban,
		DampakModal:            totalModal,
		DampakPerJenisAkun:     dampakPerJenis,
	}, nil
}

func (s *reportService) GetArusKas(startDate, endDate time.Time, includePenyesuaian bool) (*ArusKasResponse, error) {
	// Ambil akun kas/bank: jenis_akun = 'aset' AND (nama_akun ILIKE %kas% OR nama_akun ILIKE %bank% OR kode_akun LIKE '1.1.1%' OR kode_akun LIKE '111%')
	var akunKas []model.ChartOfAccount
	err := s.db.Where("is_aktif = ?", true).
		Where("jenis_akun = ?", model.JenisAset).
		Where("LOWER(nama_akun) LIKE ? OR LOWER(nama_akun) LIKE ? OR kode_akun LIKE ? OR kode_akun LIKE ?",
			"%kas%", "%bank%", "1.1.1%", "111%").
		Order("kode_akun asc").
		Find(&akunKas).Error
	if err != nil {
		return nil, err
	}

	accountGroups := make([]ArusKasAccountGroup, 0)
	totalSaldoAwal := decimal.Zero
	totalMasukAll := decimal.Zero
	totalKeluarAll := decimal.Zero

	for _, akun := range akunKas {
		// Hitung saldo awal akun kas (transaksi sebelum startDate)
		queryAwal := s.db.Model(&model.JournalDetail{}).
			Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
			Where("detail_jurnal.daftar_akun_id = ?", akun.ID).
			Where("jurnal.tanggal_transaksi < ?", startDate).
			Where("jurnal.status = ?", model.StatusPosted)

		if !includePenyesuaian {
			queryAwal = queryAwal.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
		}

		type sumResult struct {
			TotalDebit  decimal.Decimal
			TotalKredit decimal.Decimal
		}
		var awal sumResult
		queryAwal.Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").Scan(&awal)
		saldoAwal := awal.TotalDebit.Sub(awal.TotalKredit) // Aset saldo normal debit

		// Transaksi pada periode
		queryPeriod := s.db.Preload("Jurnal").
			Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
			Where("detail_jurnal.daftar_akun_id = ?", akun.ID).
			Where("jurnal.tanggal_transaksi BETWEEN ? AND ?", startDate, endDate).
			Where("jurnal.status = ?", model.StatusPosted)

		if !includePenyesuaian {
			queryPeriod = queryPeriod.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
		}

		var details []model.JournalDetail
		queryPeriod.Order("jurnal.tanggal_transaksi asc, jurnal.id asc").Find(&details)

		txList := make([]ArusKasDetail, 0)
		totMasuk := decimal.Zero
		totKeluar := decimal.Zero

		for _, d := range details {
			masuk := d.JumlahDebit
			keluar := d.JumlahKredit
			net := masuk.Sub(keluar)

			totMasuk = totMasuk.Add(masuk)
			totKeluar = totKeluar.Add(keluar)

			tgl := time.Time{}
			ket := d.Keterangan
			ref := ""
			if d.Jurnal != nil {
				tgl = d.Jurnal.TanggalTransaksi
				if d.Jurnal.Keterangan != "" {
					ket = d.Jurnal.Keterangan
				}
				ref = d.Jurnal.NomorJurnal
			}

			txList = append(txList, ArusKasDetail{
				Tanggal:    tgl,
				Keterangan: ket,
				Referensi:  ref,
				KasMasuk:   masuk,
				KasKeluar:  keluar,
				Net:        net,
			})
		}

		net := totMasuk.Sub(totKeluar)
		saldoAkhir := saldoAwal.Add(net)

		if !saldoAwal.IsZero() || len(txList) > 0 {
			accountGroups = append(accountGroups, ArusKasAccountGroup{
				Akun:        akun,
				SaldoAwal:   saldoAwal,
				TotalMasuk:  totMasuk,
				TotalKeluar: totKeluar,
				Net:         net,
				SaldoAkhir:  saldoAkhir,
				Transaksi:   txList,
			})

			totalSaldoAwal = totalSaldoAwal.Add(saldoAwal)
			totalMasukAll = totalMasukAll.Add(totMasuk)
			totalKeluarAll = totalKeluarAll.Add(totKeluar)
		}
	}

	netArusKas := totalMasukAll.Sub(totalKeluarAll)
	totalSaldoAkhir := totalSaldoAwal.Add(netArusKas)

	return &ArusKasResponse{
		PeriodeDari:     startDate.Format("2006-01-02"),
		PeriodeSampai:   endDate.Format("2006-01-02"),
		TotalSaldoAwal:  totalSaldoAwal,
		TotalKasMasuk:   totalMasukAll,
		TotalKasKeluar:  totalKeluarAll,
		NetArusKas:      netArusKas,
		TotalSaldoAkhir: totalSaldoAkhir,
		Accounts:        accountGroups,
	}, nil
}

func (s *reportService) GetPerubahanModal(startDate, endDate time.Time, includePenyesuaian bool) (*PerubahanModalResponse, error) {
	// 1. Ambil akun ekuitas/modal
	var akunEkuitas []model.ChartOfAccount
	err := s.db.Where("is_aktif = ?", true).
		Where("jenis_akun IN ?", []string{string(model.JenisModal), string(model.JenisEkuitas)}).
		Order("kode_akun asc").
		Find(&akunEkuitas).Error
	if err != nil {
		return nil, err
	}

	// 2. Saldo awal modal & detail modal
	saldoAwalModalTotal := decimal.Zero
	tambahanInvestasiTotal := decimal.Zero
	penarikanTotal := decimal.Zero
	detailModalList := make([]DetailModalAccount, 0)

	for _, akun := range akunEkuitas {
		namaLower := strings.ToLower(akun.NamaAkun)
		isRetainedEarnings := strings.Contains(namaLower, "laba") || strings.Contains(namaLower, "rugi") || strings.Contains(namaLower, "ditahan")
		isPenarikan := strings.Contains(namaLower, "prive") || strings.Contains(namaLower, "dividen") || strings.Contains(namaLower, "penarikan")

		// Saldo awal sebelum startDate
		qAwal := s.db.Model(&model.JournalDetail{}).
			Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
			Where("detail_jurnal.daftar_akun_id = ?", akun.ID).
			Where("jurnal.tanggal_transaksi < ?", startDate).
			Where("jurnal.status = ?", model.StatusPosted)
		if !includePenyesuaian {
			qAwal = qAwal.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
		}

		type sumResult struct {
			TotalDebit  decimal.Decimal
			TotalKredit decimal.Decimal
		}
		var awal sumResult
		qAwal.Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").Scan(&awal)
		saldoAwalAkun := awal.TotalKredit.Sub(awal.TotalDebit) // Ekuitas saldo normal kredit

		// Mutasi selama periode
		qMutasi := s.db.Model(&model.JournalDetail{}).
			Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
			Where("detail_jurnal.daftar_akun_id = ?", akun.ID).
			Where("jurnal.tanggal_transaksi BETWEEN ? AND ?", startDate, endDate).
			Where("jurnal.status = ?", model.StatusPosted)
		if !includePenyesuaian {
			qMutasi = qMutasi.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
		}
		var mut sumResult
		qMutasi.Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").Scan(&mut)
		mutasiAkun := mut.TotalKredit.Sub(mut.TotalDebit)
		saldoAkhirAkun := saldoAwalAkun.Add(mutasiAkun)

		saldoAwalModalTotal = saldoAwalModalTotal.Add(saldoAwalAkun)

		if !isRetainedEarnings && !isPenarikan {
			if mutasiAkun.IsPositive() {
				tambahanInvestasiTotal = tambahanInvestasiTotal.Add(mutasiAkun)
			}
		}

		if isPenarikan {
			penarikanVal := mut.TotalDebit.Sub(mut.TotalKredit)
			if penarikanVal.IsPositive() {
				penarikanTotal = penarikanTotal.Add(penarikanVal)
			}
		}

		if !saldoAwalAkun.IsZero() || !mutasiAkun.IsZero() || !saldoAkhirAkun.IsZero() {
			detailModalList = append(detailModalList, DetailModalAccount{
				Akun:       akun,
				SaldoAwal:  saldoAwalAkun,
				Mutasi:     mutasiAkun,
				SaldoAkhir: saldoAkhirAkun,
			})
		}
	}

	// 3. Laba Ditahan (Kumulatif sebelum startDate)
	labaDitahanTotal := s.hitungLabaRugiRentang(time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC), startDate.AddDate(0, 0, -1), includePenyesuaian)

	// 4. Detail Laba Ditahan per Bulan
	detailLabaDitahanPerBulan := s.getLabaDitahanPerBulan(startDate, includePenyesuaian)

	// 5. Laba Rugi Periode Berjalan
	labaRugiPeriode := s.hitungLabaRugiRentang(startDate, endDate, includePenyesuaian)

	// 6. Saldo Akhir Modal
	// SaldoAkhir = SaldoAwal + LabaDitahan + LabaRugiPeriode + TambahanInvestasi - Penarikan
	saldoAkhirModalTotal := saldoAwalModalTotal.Add(labaDitahanTotal).Add(labaRugiPeriode).Add(tambahanInvestasiTotal).Sub(penarikanTotal)

	return &PerubahanModalResponse{
		PeriodeDari:               startDate.Format("2006-01-02"),
		PeriodeSampai:              endDate.Format("2006-01-02"),
		SaldoAwalModal:            saldoAwalModalTotal,
		LabaDitahan:               labaDitahanTotal,
		DetailLabaDitahanPerBulan: detailLabaDitahanPerBulan,
		LabaRugiPeriode:           labaRugiPeriode,
		TambahanInvestasi:         tambahanInvestasiTotal,
		Penarikan:                 penarikanTotal,
		SaldoAkhirModal:           saldoAkhirModalTotal,
		DetailModal:               detailModalList,
	}, nil
}

func (s *reportService) hitungLabaRugiRentang(from, to time.Time, includePenyesuaian bool) decimal.Decimal {
	// Total Pendapatan: kredit - debit on jenis_akun = 'pendapatan'
	qPendapatan := s.db.Model(&model.JournalDetail{}).
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Joins("JOIN daftar_akun ON daftar_akun.id = detail_jurnal.daftar_akun_id").
		Where("daftar_akun.jenis_akun = ?", model.JenisPendapatan).
		Where("jurnal.tanggal_transaksi BETWEEN ? AND ?", from, to).
		Where("jurnal.status = ?", model.StatusPosted)
	if !includePenyesuaian {
		qPendapatan = qPendapatan.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
	}

	type sumResult struct {
		TotalDebit  decimal.Decimal
		TotalKredit decimal.Decimal
	}
	var resPendapatan sumResult
	qPendapatan.Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").Scan(&resPendapatan)
	totPendapatan := resPendapatan.TotalKredit.Sub(resPendapatan.TotalDebit)

	// Total Beban: debit - kredit on jenis_akun = 'beban'
	qBeban := s.db.Model(&model.JournalDetail{}).
		Joins("JOIN jurnal ON jurnal.id = detail_jurnal.jurnal_id").
		Joins("JOIN daftar_akun ON daftar_akun.id = detail_jurnal.daftar_akun_id").
		Where("daftar_akun.jenis_akun = ?", model.JenisBeban).
		Where("jurnal.tanggal_transaksi BETWEEN ? AND ?", from, to).
		Where("jurnal.status = ?", model.StatusPosted)
	if !includePenyesuaian {
		qBeban = qBeban.Where("jurnal.jenis_jurnal != ? OR jurnal.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
	}
	var resBeban sumResult
	qBeban.Select("COALESCE(SUM(detail_jurnal.jumlah_debit), 0) as total_debit, COALESCE(SUM(detail_jurnal.jumlah_kredit), 0) as total_kredit").Scan(&resBeban)
	totBeban := resBeban.TotalDebit.Sub(resBeban.TotalKredit)

	return totPendapatan.Sub(totBeban)
}

func (s *reportService) getLabaDitahanPerBulan(sampaiTanggal time.Time, includePenyesuaian bool) []DetailLabaDitahanBulan {
	detail := make([]DetailLabaDitahanBulan, 0)

	var oldest model.Journal
	err := s.db.Where("tanggal_transaksi < ?", sampaiTanggal).
		Where("status = ?", model.StatusPosted).
		Order("tanggal_transaksi asc").
		First(&oldest).Error
	if err != nil {
		return detail
	}

	currentDate := time.Date(oldest.TanggalTransaksi.Year(), oldest.TanggalTransaksi.Month(), 1, 0, 0, 0, 0, time.UTC)
	batasAkhir := sampaiTanggal.AddDate(0, 0, -1)
	saldoAkumulasi := decimal.Zero

	for !currentDate.After(batasAkhir) {
		bulanAwal := currentDate
		bulanAkhir := currentDate.AddDate(0, 1, -1)
		if bulanAkhir.After(batasAkhir) {
			bulanAkhir = batasAkhir
		}

		labaRugiBulan := s.hitungLabaRugiRentang(bulanAwal, bulanAkhir, includePenyesuaian)
		saldoAkumulasi = saldoAkumulasi.Add(labaRugiBulan)

		detail = append(detail, DetailLabaDitahanBulan{
			Bulan:          bulanAwal.Format("January 2006"),
			Tahun:          bulanAwal.Year(),
			BulanNum:       int(bulanAwal.Month()),
			PeriodeDari:    bulanAwal.Format("2006-01-02"),
			PeriodeSampai:  bulanAkhir.Format("2006-01-02"),
			LabaRugi:       labaRugiBulan,
			SaldoAkumulasi: saldoAkumulasi,
		})

		currentDate = currentDate.AddDate(0, 1, 0)
	}

	return detail
}

func (s *reportService) GetAnalisisRasio(startDate, endDate time.Time, includePenyesuaian bool) (*AnalisisRasioResponse, error) {
	var accounts []model.ChartOfAccount
	err := s.db.Where("is_aktif = ?", true).Order("kode_akun asc").Find(&accounts).Error
	if err != nil {
		return nil, err
	}

	type aggResult struct {
		DaftarAkunID uint            `gorm:"column:daftar_akun_id"`
		TotalDebit   decimal.Decimal `gorm:"column:total_debit"`
		TotalKredit  decimal.Decimal `gorm:"column:total_kredit"`
	}

	aggQuery := s.db.Table("detail_jurnal dj").
		Select("dj.daftar_akun_id, COALESCE(SUM(dj.jumlah_debit), 0) as total_debit, COALESCE(SUM(dj.jumlah_kredit), 0) as total_kredit").
		Joins("JOIN jurnal j ON j.id = dj.jurnal_id").
		Where("j.tanggal_transaksi <= ? AND j.status = ? AND j.deleted_at IS NULL", endDate, model.StatusPosted)

	if !includePenyesuaian {
		aggQuery = aggQuery.Where("j.jenis_jurnal != ? OR j.jenis_jurnal IS NULL", model.JenisJurnalPenyesuaian)
	}

	var results []aggResult
	if err := aggQuery.Group("dj.daftar_akun_id").Scan(&results).Error; err != nil {
		return nil, err
	}

	balanceMap := make(map[uint]aggResult, len(results))
	for _, r := range results {
		balanceMap[r.DaftarAkunID] = r
	}

	totalAsetLancar := decimal.Zero
	totalKas := decimal.Zero
	totalPersediaan := decimal.Zero
	totalKewajibanLancar := decimal.Zero
	totalAset := decimal.Zero
	totalKewajiban := decimal.Zero
	totalEkuitas := decimal.Zero
	labaBerjalan := decimal.Zero

	for _, acc := range accounts {
		sum := balanceMap[acc.ID]

		saldoDebit := sum.TotalDebit.Sub(sum.TotalKredit)
		saldoKredit := sum.TotalKredit.Sub(sum.TotalDebit)

		namaLower := strings.ToLower(acc.NamaAkun)
		subLower := strings.ToLower(acc.SubJenis)

		switch acc.JenisAkun {
		case model.JenisAset:
			totalAset = totalAset.Add(saldoDebit)

			isAsetLancar := subLower == "aset_lancar" || subLower == "lancar" || (!strings.Contains(subLower, "tetap") && (strings.HasPrefix(acc.KodeAkun, "1.1") || strings.HasPrefix(acc.KodeAkun, "11")))
			if isAsetLancar {
				totalAsetLancar = totalAsetLancar.Add(saldoDebit)

				if strings.Contains(namaLower, "kas") || strings.Contains(namaLower, "bank") || strings.HasPrefix(acc.KodeAkun, "1.1.1") || strings.HasPrefix(acc.KodeAkun, "111") {
					totalKas = totalKas.Add(saldoDebit)
				}

				if strings.Contains(namaLower, "persediaan") || strings.Contains(namaLower, "inventory") || strings.HasPrefix(acc.KodeAkun, "1.1.4") || strings.HasPrefix(acc.KodeAkun, "114") {
					totalPersediaan = totalPersediaan.Add(saldoDebit)
				}
			}

		case model.JenisKewajiban:
			totalKewajiban = totalKewajiban.Add(saldoKredit)

			isKewajibanLancar := subLower == "kewajiban_lancar" || subLower == "lancar" || (!strings.Contains(subLower, "panjang") && (strings.HasPrefix(acc.KodeAkun, "2.1") || strings.HasPrefix(acc.KodeAkun, "21")))
			if isKewajibanLancar {
				totalKewajibanLancar = totalKewajibanLancar.Add(saldoKredit)
			}

		case model.JenisModal, model.JenisEkuitas:
			totalEkuitas = totalEkuitas.Add(saldoKredit)

		case model.JenisPendapatan:
			labaBerjalan = labaBerjalan.Add(saldoKredit)

		case model.JenisBeban:
			labaBerjalan = labaBerjalan.Sub(saldoDebit)
		}
	}

	totalEkuitas = totalEkuitas.Add(labaBerjalan)
	modalKerja := totalAsetLancar.Sub(totalKewajibanLancar)

	var currentRatio, quickRatio, cashRatio, debtToAssetRatio, debtToEquityRatio float64

	if totalKewajibanLancar.GreaterThan(decimal.Zero) {
		currentRatio, _ = totalAsetLancar.Div(totalKewajibanLancar).Float64()
		quickRatio, _ = totalAsetLancar.Sub(totalPersediaan).Div(totalKewajibanLancar).Float64()
		cashRatio, _ = totalKas.Div(totalKewajibanLancar).Float64()
	}

	if totalAset.GreaterThan(decimal.Zero) {
		debtToAssetRatio, _ = totalKewajiban.Div(totalAset).Float64()
	}

	if totalEkuitas.GreaterThan(decimal.Zero) {
		debtToEquityRatio, _ = totalKewajiban.Div(totalEkuitas).Float64()
	}

	return &AnalisisRasioResponse{
		PeriodeDari:          startDate.Format("2006-01-02"),
		PeriodeSampai:        endDate.Format("2006-01-02"),
		TotalAsetLancar:      totalAsetLancar,
		TotalKewajibanLancar: totalKewajibanLancar,
		TotalKas:             totalKas,
		TotalPersediaan:      totalPersediaan,
		TotalAset:            totalAset,
		TotalKewajiban:       totalKewajiban,
		TotalEkuitas:         totalEkuitas,
		ModalKerja:           modalKerja,
		CurrentRatio:         currentRatio,
		QuickRatio:           quickRatio,
		CashRatio:            cashRatio,
		DebtToAssetRatio:     debtToAssetRatio,
		DebtToEquityRatio:    debtToEquityRatio,
	}, nil
}

