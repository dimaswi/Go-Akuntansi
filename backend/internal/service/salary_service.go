package service

import (
	"encoding/base64"
	"fmt"
	"os"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/repository"

	"github.com/shopspring/decimal"
)

type SalaryService interface {
	GetBatches(search, status, year, month string) ([]model.SalaryBatch, repository.SalarySummary, error)
	GetBatchByID(id uint) (*model.SalaryBatch, error)
	CreateBatch(batch *model.SalaryBatch) error
	UpdateBatch(id uint, description string) error
	DeleteBatch(id uint) error
	GetUsersWithNIP() ([]model.User, error)
	SaveSalaryDetails(batchID uint, details []model.SalaryDetail) error
	GetJournalPreview(batchIDs []uint) ([]repository.JournalPreviewEntry, error)
	PostToJournal(batchIDs []uint, detailJurnals []repository.PostJournalDetail, userID uint) (*model.Journal, error)
	GetPersonalSalarySlips(userID uint, userNIP, userName, year, month string) ([]model.SalaryDetail, repository.PersonalSalarySummary, error)
	GetSalaryDetailByID(id uint) (*model.SalaryDetail, error)
	GenerateSalarySlipHTML(id uint, autoPrint bool) (string, error)
	GenerateSalarySlipPDF(id uint) ([]byte, string, error)
	GenerateSalaryTemplateXLSX(batchID uint, customRows []model.SalaryDetail) ([]byte, string, error)
}

type salaryService struct {
	repo repository.SalaryRepository
}

func NewSalaryService(repo repository.SalaryRepository) SalaryService {
	return &salaryService{repo: repo}
}

func (s *salaryService) GetBatches(search, status, year, month string) ([]model.SalaryBatch, repository.SalarySummary, error) {
	return s.repo.GetBatches(search, status, year, month)
}

func (s *salaryService) GetBatchByID(id uint) (*model.SalaryBatch, error) {
	return s.repo.GetBatchByID(id)
}

func (s *salaryService) CreateBatch(batch *model.SalaryBatch) error {
	return s.repo.CreateBatch(batch)
}

func (s *salaryService) UpdateBatch(id uint, description string) error {
	return s.repo.UpdateBatch(id, description)
}

func (s *salaryService) DeleteBatch(id uint) error {
	return s.repo.DeleteBatch(id)
}

func (s *salaryService) GetUsersWithNIP() ([]model.User, error) {
	return s.repo.GetUsersWithNIP()
}

func (s *salaryService) SaveSalaryDetails(batchID uint, details []model.SalaryDetail) error {
	return s.repo.SaveSalaryDetails(batchID, details)
}

func (s *salaryService) GetJournalPreview(batchIDs []uint) ([]repository.JournalPreviewEntry, error) {
	return s.repo.GetJournalPreview(batchIDs)
}

func (s *salaryService) PostToJournal(batchIDs []uint, detailJurnals []repository.PostJournalDetail, userID uint) (*model.Journal, error) {
	return s.repo.PostToJournal(batchIDs, detailJurnals, userID)
}

func (s *salaryService) GetPersonalSalarySlips(userID uint, userNIP, userName, year, month string) ([]model.SalaryDetail, repository.PersonalSalarySummary, error) {
	return s.repo.GetPersonalSalarySlips(userID, userNIP, userName, year, month)
}

func (s *salaryService) GetSalaryDetailByID(id uint) (*model.SalaryDetail, error) {
	return s.repo.GetSalaryDetailByID(id)
}

// Terbilang converts numbers into Indonesian words
func Terbilang(n int64) string {
	if n < 0 {
		return "Minus " + Terbilang(-n)
	}
	satuan := []string{"", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"}
	switch {
	case n < 12:
		return satuan[n]
	case n < 20:
		return Terbilang(n-10) + " Belas"
	case n < 100:
		res := Terbilang(n/10) + " Puluh"
		if n%10 > 0 {
			res += " " + Terbilang(n%10)
		}
		return res
	case n < 200:
		res := "Seratus"
		if n-100 > 0 {
			res += " " + Terbilang(n-100)
		}
		return res
	case n < 1000:
		res := Terbilang(n/100) + " Ratus"
		if n%100 > 0 {
			res += " " + Terbilang(n%100)
		}
		return res
	case n < 2000:
		res := "Seribu"
		if n-1000 > 0 {
			res += " " + Terbilang(n-1000)
		}
		return res
	case n < 1000000:
		res := Terbilang(n/1000) + " Ribu"
		if n%1000 > 0 {
			res += " " + Terbilang(n%1000)
		}
		return res
	case n < 1000000000:
		res := Terbilang(n/1000000) + " Juta"
		if n%1000000 > 0 {
			res += " " + Terbilang(n%1000000)
		}
		return res
	case n < 1000000000000:
		res := Terbilang(n/1000000000) + " Miliar"
		if n%1000000000 > 0 {
			res += " " + Terbilang(n%1000000000)
		}
		return res
	default:
		res := Terbilang(n/1000000000000) + " Triliun"
		if n%1000000000000 > 0 {
			res += " " + Terbilang(n%1000000000000)
		}
		return res
	}
}

func formatRupiah(d decimal.Decimal) string {
	intVal := d.IntPart()
	s := fmt.Sprintf("%d", intVal)
	if intVal < 0 {
		s = fmt.Sprintf("%d", -intVal)
	}

	var parts []string
	for len(s) > 3 {
		parts = append([]string{s[len(s)-3:]}, parts...)
		s = s[:len(s)-3]
	}
	if len(s) > 0 {
		parts = append([]string{s}, parts...)
	}
	res := strings.Join(parts, ".")
	if intVal < 0 {
		return "Rp -" + res
	}
	return "Rp " + res
}

func (s *salaryService) GenerateSalarySlipHTML(id uint, autoPrint bool) (string, error) {
	detail, err := s.repo.GetSalaryDetailByID(id)
	if err != nil {
		return "", err
	}

	// Try reading logo from disk and base64 encode it for self-contained HTML
	logoSrc := "/1.png"
	logoPaths := []string{
		"frontend/public/logo.png",
		"frontend/public/1.png",
		"../frontend/public/logo.png",
		"../frontend/public/1.png",
	}
	for _, p := range logoPaths {
		if b, err := os.ReadFile(p); err == nil && len(b) > 0 {
			logoSrc = fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(b))
			break
		}
	}

	periodDisplay := "Periode Gaji"
	batchNumber := "-"
	if detail.SalaryBatch != nil {
		periodDisplay = detail.SalaryBatch.PeriodDisplay
		batchNumber = detail.SalaryBatch.BatchNumber
	}

	// Construct income rows
	type LineItem struct {
		Label  string
		Amount decimal.Decimal
	}

	incomes := []LineItem{
		{"Gaji Pokok", detail.GajiPokok},
		{"Tunjangan SIA", detail.TunjanganSIA},
		{"Tunjangan Transportasi", detail.TunjanganTransportasi},
		{"Tunjangan Jabatan", detail.TunjanganJabatan},
		{"Uang Jaga Utama", detail.UangJagaUtama},
		{"Uang Jaga Pratama", detail.UangJagaPratama},
		{"Jasa Pelayanan Pratama", detail.JasaPelayananPratama},
		{"Jasa Pelayanan Rawat Inap", detail.JasaPelayananRawatInap},
		{"Jasa Pelayanan Rawat Jalan", detail.JasaPelayananRawatJalan},
		{"Jasa Pelayanan Ralan BPJS", detail.JasaPelayananRawatJalanBPJS},
		{"Tugas Tambahan", detail.TugasTambahan},
	}

	deductions := []LineItem{
		{"PPh 21", detail.PPh21},
		{"Infaq", detail.Infaq},
		{"BPJS Kesehatan", detail.BPJSKesehatan},
		{"BPJS Ketenagakerjaan", detail.BPJSKetenagakerjaan},
		{"Denda Absen", detail.DendaAbsen},
		{"Arisan Keluarga", detail.ArisanKeluarga},
		{"Denda Ngaji", detail.DendaNgaji},
		{"Kasbon", detail.Kasbon},
	}

	var incomeRowsBuilder strings.Builder
	for _, item := range incomes {
		if item.Amount.GreaterThan(decimal.Zero) {
			incomeRowsBuilder.WriteString(fmt.Sprintf(`
				<tr class="item-row">
					<td class="text-left">%s</td>
					<td class="text-right font-mono">%s</td>
				</tr>
			`, item.Label, formatRupiah(item.Amount)))
		}
	}
	if incomeRowsBuilder.Len() == 0 {
		incomeRowsBuilder.WriteString(`<tr><td colspan="2" class="text-center text-muted italic">Tidak ada rincian</td></tr>`)
	}

	var deductionRowsBuilder strings.Builder
	for _, item := range deductions {
		if item.Amount.GreaterThan(decimal.Zero) {
			deductionRowsBuilder.WriteString(fmt.Sprintf(`
				<tr class="item-row">
					<td class="text-left">%s</td>
					<td class="text-right font-mono text-rose">%s</td>
				</tr>
			`, item.Label, formatRupiah(item.Amount)))
		}
	}
	if deductionRowsBuilder.Len() == 0 {
		deductionRowsBuilder.WriteString(`<tr><td colspan="2" class="text-center text-muted italic">Tidak ada potongan</td></tr>`)
	}

	cleanTerbilang := "Nol Rupiah"
	if detail.GajiBersih.GreaterThan(decimal.Zero) {
		cleanTerbilang = strings.TrimSpace(Terbilang(detail.GajiBersih.IntPart())) + " Rupiah"
	}

	currentDateStr := time.Now().Format("02 January 2006")
	// Convert english months in Format to Indonesian
	idMonths := map[string]string{
		"January": "Januari", "February": "Februari", "March": "Maret", "April": "April",
		"May": "Mei", "June": "Juni", "July": "Juli", "August": "Agustus",
		"September": "September", "October": "Oktober", "November": "November", "December": "Desember",
	}
	for en, idn := range idMonths {
		currentDateStr = strings.ReplaceAll(currentDateStr, en, idn)
	}

	autoPrintScript := ""
	if autoPrint {
		autoPrintScript = `
			<script>
				window.addEventListener('load', function() {
					setTimeout(function() {
						window.print();
					}, 400);
				});
			</script>
		`
	}

	nipDisplay := detail.NIP
	if nipDisplay == "" {
		nipDisplay = "-"
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Slip Gaji - %s - %s</title>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			background-color: #f3f4f6;
			color: #1f2937;
			padding: 24px;
			font-size: 13px;
			line-height: 1.4;
		}
		.no-print-bar {
			max-width: 800px;
			margin: 0 auto 16px auto;
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #ffffff;
			padding: 12px 18px;
			border: 1px solid #e5e7eb;
			box-shadow: 0 1px 3px rgba(0,0,0,0.05);
		}
		.btn {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 8px 16px;
			font-size: 13px;
			font-weight: 600;
			border-radius: 4px;
			cursor: pointer;
			text-decoration: none;
			border: none;
		}
		.btn-primary {
			background-color: #047857;
			color: #ffffff;
		}
		.btn-primary:hover {
			background-color: #065f46;
		}
		.btn-secondary {
			background-color: #e5e7eb;
			color: #374151;
		}
		.btn-secondary:hover {
			background-color: #d1d5db;
		}
		.slip-card {
			max-width: 800px;
			margin: 0 auto;
			background: #ffffff;
			border: 1px solid #d1d5db;
			padding: 36px 40px;
			box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		}
		.kop-container {
			display: flex;
			align-items: center;
			gap: 20px;
			border-bottom: 3px double #047857;
			padding-bottom: 16px;
			margin-bottom: 20px;
		}
		.kop-logo {
			width: 82px;
			height: 82px;
			object-fit: contain;
			flex-shrink: 0;
		}
		.kop-text h1 {
			font-size: 20px;
			font-weight: 800;
			color: #111827;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-bottom: 2px;
		}
		.kop-text h2 {
			font-size: 18px;
			font-weight: 800;
			color: #047857;
			text-transform: uppercase;
			margin-bottom: 4px;
		}
		.kop-text p {
			font-size: 11px;
			color: #4b5563;
			line-height: 1.35;
		}
		.slip-title {
			text-align: center;
			margin-bottom: 20px;
		}
		.slip-title h3 {
			font-size: 16px;
			font-weight: 800;
			text-transform: uppercase;
			letter-spacing: 1px;
			color: #111827;
		}
		.slip-title p {
			font-size: 12px;
			font-weight: 600;
			color: #047857;
			margin-top: 2px;
		}
		.meta-box {
			background-color: #f9fafb;
			border: 1px solid #e5e7eb;
			padding: 12px 16px;
			margin-bottom: 20px;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 8px 24px;
			font-size: 12px;
		}
		.meta-item {
			display: flex;
		}
		.meta-label {
			width: 110px;
			font-weight: 600;
			color: #4b5563;
		}
		.meta-value {
			font-weight: 700;
			color: #111827;
		}
		.grid-2 {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 16px;
			margin-bottom: 20px;
		}
		.breakdown-box {
			border: 1px solid #e5e7eb;
			border-radius: 2px;
			overflow: hidden;
		}
		.breakdown-header {
			padding: 8px 12px;
			font-size: 11px;
			font-weight: 800;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.header-income {
			background-color: #ecfdf5;
			color: #065f46;
			border-bottom: 1px solid #a7f3d0;
		}
		.header-deduction {
			background-color: #fff1f2;
			color: #9f1239;
			border-bottom: 1px solid #fecdd3;
		}
		table {
			width: 100%%;
			border-collapse: collapse;
			font-size: 11.5px;
		}
		td {
			padding: 5px 12px;
			border-bottom: 1px dashed #f3f4f6;
		}
		.item-row:last-child td {
			border-bottom: none;
		}
		.text-left { text-align: left; }
		.text-right { text-align: right; }
		.text-center { text-align: center; }
		.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
		.text-rose { color: #e11d48; }
		.text-muted { color: #9ca3af; }
		.breakdown-footer {
			background-color: #f9fafb;
			border-top: 1px solid #e5e7eb;
			padding: 8px 12px;
			display: flex;
			justify-content: space-between;
			font-weight: 800;
			font-size: 12px;
		}
		.take-home-box {
			background: #ecfdf5;
			border: 1.5px solid #059669;
			padding: 14px 18px;
			margin-bottom: 24px;
		}
		.take-home-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.take-home-label {
			font-size: 13px;
			font-weight: 800;
			color: #065f46;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.take-home-amount {
			font-size: 18px;
			font-weight: 900;
			color: #047857;
		}
		.terbilang-text {
			margin-top: 6px;
			font-size: 11px;
			font-style: italic;
			color: #065f46;
			border-top: 1px dashed #a7f3d0;
			padding-top: 6px;
		}
		.signatures {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 40px;
			margin-top: 28px;
			padding-top: 10px;
		}
		.sign-col {
			text-align: center;
			font-size: 12px;
		}
		.sign-space {
			height: 56px;
		}
		.sign-name {
			font-weight: 700;
			text-decoration: underline;
			color: #111827;
		}
		.sign-role {
			font-size: 11px;
			color: #6b7280;
			margin-top: 2px;
		}
		.disclaimer {
			margin-top: 32px;
			text-align: center;
			font-size: 10px;
			color: #9ca3af;
			font-style: italic;
			border-top: 1px solid #f3f4f6;
			padding-top: 8px;
		}

		@media print {
			body {
				background-color: #ffffff;
				padding: 0;
			}
			.no-print-bar {
				display: none !important;
			}
			.slip-card {
				border: none;
				box-shadow: none;
				padding: 12px 16px;
				max-width: 100%%;
			}
			@page {
				size: A4 portrait;
				margin: 12mm;
			}
		}
	</style>
</head>
<body>

	<div class="no-print-bar">
		<div>
			<strong>Pratinjau Cetak Slip Gaji</strong>
			<span style="color: #6b7280; margin-left: 8px; font-size: 12px;">Sistem Otomatis Backend</span>
		</div>
		<div style="display: flex; gap: 8px;">
			<button class="btn btn-secondary" onclick="window.close()">Tutup</button>
			<button class="btn btn-primary" onclick="window.print()">
				🖨️ Cetak Slip Sekarang
			</button>
		</div>
	</div>

	<div class="slip-card">
		<!-- KOP HEADER DENGAN LOGO KLINIK -->
		<div class="kop-container">
			<img src="%s" alt="Logo Klinik" class="kop-logo">
			<div class="kop-text">
				<h1>KLINIK RAWAT INAP UTAMA</h1>
				<h2>MUHAMMADIYAH KEDUNGADEM</h2>
				<p>Jl. Raya Kedungadem - Bojonegoro, Jawa Timur</p>
				<p>Telp: (0353) 881-XXX | Email: klinik.muhammadiyah@kedungadem.or.id</p>
			</div>
		</div>

		<!-- JUDUL SLIP -->
		<div class="slip-title">
			<h3>SLIP GAJI KARYAWAN</h3>
			<p>Periode: %s • No. Batch: %s</p>
		</div>

		<!-- INFORMASI PEGAWAI -->
		<div class="meta-box">
			<div class="meta-item">
				<span class="meta-label">Nama Pegawai</span>
				<span class="meta-value">: %s</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">No. Batch</span>
				<span class="meta-value">: %s</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">NIP Pegawai</span>
				<span class="meta-value">: %s</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Waktu Cetak</span>
				<span class="meta-value">: %s</span>
			</div>
		</div>

		<!-- RINCIAN 2 KOLOM (PENDAPATAN & POTONGAN) -->
		<div class="grid-2">
			<!-- KOLOM PENDAPATAN -->
			<div class="breakdown-box">
				<div class="breakdown-header header-income">
					A. KOMPONEN PENDAPATAN (BRUTO)
				</div>
				<table>
					<tbody>
						%s
					</tbody>
				</table>
				<div class="breakdown-footer" style="color: #065f46;">
					<span>Total Pendapatan</span>
					<span class="font-mono">%s</span>
				</div>
			</div>

			<!-- KOLOM POTONGAN -->
			<div class="breakdown-box">
				<div class="breakdown-header header-deduction">
					B. KOMPONEN POTONGAN
				</div>
				<table>
					<tbody>
						%s
					</tbody>
				</table>
				<div class="breakdown-footer" style="color: #9f1239;">
					<span>Total Potongan</span>
					<span class="font-mono text-rose">%s</span>
				</div>
			</div>
		</div>

		<!-- TOTAL DITERIMA (TAKE HOME PAY) & TERBILANG -->
		<div class="take-home-box">
			<div class="take-home-row">
				<span class="take-home-label">GAJI BERSIH DITERIMA (TAKE HOME PAY):</span>
				<span class="take-home-amount font-mono">%s</span>
			</div>
			<div class="terbilang-text">
				<strong>Terbilang:</strong> %s
			</div>
		</div>

		<!-- TANDA TANGAN -->
		<div class="signatures">
			<div class="sign-col">
				<p>Penerima,</p>
				<div class="sign-space"></div>
				<p class="sign-name">%s</p>
				<p class="sign-role">NIP: %s</p>
			</div>
			<div class="sign-col">
				<p>Kedungadem, %s</p>
				<p style="margin-top: 2px;">Bagian Keuangan / Pimpinan,</p>
				<div class="sign-space"></div>
				<p class="sign-name">Bendahara Penggajian</p>
				<p class="sign-role">Klinik Muhammadiyah Kedungadem</p>
			</div>
		</div>

		<!-- DISCLAIMER -->
		<div class="disclaimer">
			Slip gaji ini dihasilkan secara elektronik oleh Sistem ERP Keuangan & Akuntansi dan sah tanpa tanda tangan basah.
		</div>
	</div>

	%s
</body>
</html>`,
		detail.NamaPegawai,
		periodDisplay,
		logoSrc,
		periodDisplay,
		batchNumber,
		detail.NamaPegawai,
		batchNumber,
		nipDisplay,
		currentDateStr,
		incomeRowsBuilder.String(),
		formatRupiah(detail.TotalPendapatan),
		deductionRowsBuilder.String(),
		formatRupiah(detail.TotalPotongan),
		formatRupiah(detail.GajiBersih),
		cleanTerbilang,
		detail.NamaPegawai,
		nipDisplay,
		currentDateStr,
		autoPrintScript,
	)

	return html, nil
}
