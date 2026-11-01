package service

import (
	"bytes"
	"compress/zlib"
	"fmt"
	"image"
	_ "image/png"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/shopspring/decimal"
)

var (
	logoOnce       sync.Once
	cachedLogoZlib []byte
	cachedLogoW    int
	cachedLogoH    int
	cachedHasLogo  bool
)

func loadAndCacheLogo() {
	logoPaths := []string{
		"frontend/public/1.png",
		"../frontend/public/1.png",
		"public/1.png",
	}

	for _, path := range logoPaths {
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		defer f.Close()

		img, _, err := image.Decode(f)
		if err != nil {
			continue
		}

		bounds := img.Bounds()
		srcW := bounds.Dx()
		srcH := bounds.Dy()
		targetW, targetH := 160, 160

		var rawRGB bytes.Buffer
		for y := 0; y < targetH; y++ {
			srcY := bounds.Min.Y + (y * srcH / targetH)
			for x := 0; x < targetW; x++ {
				srcX := bounds.Min.X + (x * srcW / targetW)
				r, g, b, a := img.At(srcX, srcY).RGBA()
				if a == 0 {
					rawRGB.WriteByte(255)
					rawRGB.WriteByte(255)
					rawRGB.WriteByte(255)
				} else {
					alpha := float64(a) / 65535.0
					rVal := byte(float64(r>>8)*alpha + 255.0*(1.0-alpha))
					gVal := byte(float64(g>>8)*alpha + 255.0*(1.0-alpha))
					bVal := byte(float64(b>>8)*alpha + 255.0*(1.0-alpha))
					rawRGB.WriteByte(rVal)
					rawRGB.WriteByte(gVal)
					rawRGB.WriteByte(bVal)
				}
			}
		}

		var zlibBuf bytes.Buffer
		zw := zlib.NewWriter(&zlibBuf)
		zw.Write(rawRGB.Bytes())
		zw.Close()

		cachedLogoZlib = zlibBuf.Bytes()
		cachedLogoW = targetW
		cachedLogoH = targetH
		cachedHasLogo = true
		break
	}
}

type pdfDoc struct {
	buf     bytes.Buffer
	cs      bytes.Buffer
	offsets []int
	objNum  int
}

func newPDFDoc() *pdfDoc {
	p := &pdfDoc{
		offsets: make([]int, 1),
	}
	p.buf.WriteString("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
	return p
}

func (p *pdfDoc) nextObj() int {
	p.objNum++
	p.offsets = append(p.offsets, p.buf.Len())
	return p.objNum
}

func escapePDFStr(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "(", "\\(")
	s = strings.ReplaceAll(s, ")", "\\)")
	return s
}

func (p *pdfDoc) text(font string, size float64, r, g, b float64, x, y float64, str string) {
	p.cs.WriteString(fmt.Sprintf("BT /%s %.2f Tf %.3f %.3f %.3f rg %.2f %.2f Td (%s) Tj ET\n",
		font, size, r, g, b, x, y, escapePDFStr(str)))
}

func (p *pdfDoc) textRight(font string, size float64, r, g, b float64, rightX, y float64, str string) {
	// Approximate text width: standard proportional Helvetica is ~0.55 * size per char
	approxW := float64(len(str)) * size * 0.54
	x := rightX - approxW
	p.text(font, size, r, g, b, x, y, str)
}

func (p *pdfDoc) rect(x, y, w, h float64, fillR, fillG, fillB float64, strokeR, strokeG, strokeB float64, lineWidth float64, fill, stroke bool) {
	if fill && stroke {
		p.cs.WriteString(fmt.Sprintf("%.3f %.3f %.3f rg %.3f %.3f %.3f RG %.2f w %.2f %.2f %.2f %.2f re B\n",
			fillR, fillG, fillB, strokeR, strokeG, strokeB, lineWidth, x, y, w, h))
	} else if fill {
		p.cs.WriteString(fmt.Sprintf("%.3f %.3f %.3f rg %.2f %.2f %.2f %.2f re f\n",
			fillR, fillG, fillB, x, y, w, h))
	} else if stroke {
		p.cs.WriteString(fmt.Sprintf("%.3f %.3f %.3f RG %.2f w %.2f %.2f %.2f %.2f re S\n",
			strokeR, strokeG, strokeB, lineWidth, x, y, w, h))
	}
}

func (p *pdfDoc) line(x1, y1, x2, y2 float64, strokeR, strokeG, strokeB float64, lineWidth float64) {
	p.cs.WriteString(fmt.Sprintf("%.3f %.3f %.3f RG %.2f w %.2f %.2f m %.2f %.2f l S\n",
		strokeR, strokeG, strokeB, lineWidth, x1, y1, x2, y2))
}

func formatRupiahPDF(d decimal.Decimal) string {
	val := d.BigInt().Int64()
	if val == 0 && d.IsZero() {
		return "Rp 0"
	}

	neg := false
	if val < 0 {
		neg = true
		val = -val
	}

	s := fmt.Sprintf("%d", val)
	n := len(s)
	if n <= 3 {
		if neg {
			return "Rp -" + s
		}
		return "Rp " + s
	}

	var res []string
	rem := n % 3
	if rem > 0 {
		res = append(res, s[:rem])
	}
	for i := rem; i < n; i += 3 {
		res = append(res, s[i:i+3])
	}

	out := strings.Join(res, ".")
	if neg {
		return "Rp -" + out
	}
	return "Rp " + out
}

// GenerateSalarySlipPDF creates a high quality, authentic PDF binary for a salary slip
func (s *salaryService) GenerateSalarySlipPDF(id uint) ([]byte, string, error) {
	detail, err := s.repo.GetSalaryDetailByID(id)
	if err != nil {
		return nil, "", fmt.Errorf("slip gaji tidak ditemukan: %w", err)
	}

	logoOnce.Do(loadAndCacheLogo)

	p := newPDFDoc()

	leftMargin := 40.0
	contentW := 515.28

	// Kop Header Logo & Info
	if cachedHasLogo {
		p.cs.WriteString(fmt.Sprintf("q 50 0 0 50 %.2f %.2f cm /Im1 Do Q\n", leftMargin, 841.89-40.0-50.0))
	}

	headerTextX := leftMargin + 60.0
	if !cachedHasLogo {
		headerTextX = leftMargin
	}

	p.text("F2", 13, 0.1, 0.1, 0.1, headerTextX, 786.0, "KLINIK RAWAT INAP UTAMA")
	p.text("F2", 14, 0.016, 0.471, 0.341, headerTextX, 768.0, "MUHAMMADIYAH KEDUNGADEM")
	p.text("F1", 8, 0.4, 0.4, 0.4, headerTextX, 754.0, "Jl. Raya Kedungadem - Bojonegoro, Jawa Timur")
	p.text("F1", 8, 0.4, 0.4, 0.4, headerTextX, 743.0, "Telp: (0353) 881-XXX | Email: klinik.muhammadiyah@kedungadem.or.id")

	// Double horizontal rule
	p.line(leftMargin, 730.0, leftMargin+contentW, 730.0, 0.016, 0.471, 0.341, 1.5)
	p.line(leftMargin, 727.0, leftMargin+contentW, 727.0, 0.016, 0.471, 0.341, 0.5)

	// Document Title & Period
	periodStr := "Periode Gaji"
	batchNo := "-"
	batchStatus := "DRAFT"
	if detail.SalaryBatch != nil {
		periodStr = detail.SalaryBatch.PeriodDisplay
		batchNo = detail.SalaryBatch.BatchNumber
		if strings.ToUpper(string(detail.SalaryBatch.Status)) == "POSTED" {
			batchStatus = "POSTED (RESMI)"
		} else if strings.ToUpper(string(detail.SalaryBatch.Status)) == "DONE" {
			batchStatus = "DONE (SELESAI)"
		}
	}

	p.text("F2", 12, 0.1, 0.1, 0.1, leftMargin+180.0, 706.0, "SLIP GAJI KARYAWAN")
	p.text("F2", 8.5, 0.016, 0.471, 0.341, leftMargin+170.0, 693.0, fmt.Sprintf("Periode: %s  •  Batch: %s", periodStr, batchNo))

	// Employee Meta Information Box
	boxY := 638.0
	boxH := 42.0
	p.rect(leftMargin, boxY, contentW, boxH, 0.97, 0.97, 0.97, 0.88, 0.88, 0.88, 0.5, true, true)

	p.text("F2", 8, 0.4, 0.4, 0.4, leftMargin+12.0, boxY+26.0, "NAMA PEGAWAI:")
	p.text("F2", 9.5, 0.05, 0.05, 0.05, leftMargin+90.0, boxY+26.0, detail.NamaPegawai)
	nipStr := detail.NIP
	if nipStr == "" {
		nipStr = "-"
	}
	p.text("F2", 8, 0.4, 0.4, 0.4, leftMargin+12.0, boxY+12.0, "NIP / ID:")
	p.text("F1", 8.5, 0.1, 0.1, 0.1, leftMargin+90.0, boxY+12.0, nipStr)

	p.text("F2", 8, 0.4, 0.4, 0.4, leftMargin+280.0, boxY+26.0, "STATUS BATCH:")
	if batchStatus == "POSTED (RESMI)" {
		p.text("F2", 8, 0.016, 0.471, 0.341, leftMargin+355.0, boxY+26.0, batchStatus)
	} else if batchStatus == "DONE (SELESAI)" {
		p.text("F2", 8, 0.1, 0.3, 0.7, leftMargin+355.0, boxY+26.0, batchStatus)
	} else {
		p.text("F2", 8, 0.8, 0.5, 0.1, leftMargin+355.0, boxY+26.0, batchStatus)
	}

	p.text("F2", 8, 0.4, 0.4, 0.4, leftMargin+280.0, boxY+12.0, "TANGGAL CETAK:")
	nowStr := time.Now().Format("02 January 2006")
	p.text("F1", 8, 0.1, 0.1, 0.1, leftMargin+355.0, boxY+12.0, nowStr)

	// Collect Incomes
	type compItem struct {
		name string
		val  decimal.Decimal
	}

	var incs []compItem
	addInc := func(name string, val decimal.Decimal) {
		if val.GreaterThan(decimal.Zero) {
			incs = append(incs, compItem{name: name, val: val})
		}
	}
	addInc("Gaji Pokok", detail.GajiPokok)
	addInc("Tunjangan SIA", detail.TunjanganSIA)
	addInc("Tunjangan Transportasi", detail.TunjanganTransportasi)
	addInc("Tunjangan Jabatan", detail.TunjanganJabatan)
	addInc("Uang Jaga Utama", detail.UangJagaUtama)
	addInc("Uang Jaga Pratama", detail.UangJagaPratama)
	addInc("Jaspel Pratama", detail.JasaPelayananPratama)
	addInc("Jaspel Rawat Inap", detail.JasaPelayananRawatInap)
	addInc("Jaspel Rawat Jalan", detail.JasaPelayananRawatJalan)
	addInc("Jaspel Ralan BPJS", detail.JasaPelayananRawatJalanBPJS)
	addInc("Tugas Tambahan", detail.TugasTambahan)

	// Collect Deductions
	var deds []compItem
	addDed := func(name string, val decimal.Decimal) {
		if val.GreaterThan(decimal.Zero) {
			deds = append(deds, compItem{name: name, val: val})
		}
	}
	addDed("PPh 21", detail.PPh21)
	addDed("Infaq", detail.Infaq)
	addDed("BPJS Kesehatan", detail.BPJSKesehatan)
	addDed("BPJS Ketenagakerjaan", detail.BPJSKetenagakerjaan)
	addDed("Denda Absen", detail.DendaAbsen)
	addDed("Arisan Keluarga", detail.ArisanKeluarga)
	addDed("Denda Ngaji", detail.DendaNgaji)
	addDed("Kasbon", detail.Kasbon)

	// Columns setup
	colW := (contentW - 16.0) / 2.0
	colLeftX := leftMargin
	colRightX := leftMargin + colW + 16.0
	tablesTopY := 618.0

	// Column A Header (Income)
	p.rect(colLeftX, tablesTopY-18.0, colW, 18.0, 0.93, 0.96, 1.0, 0.75, 0.82, 0.95, 0.5, true, true)
	p.text("F2", 8, 0.1, 0.3, 0.6, colLeftX+8.0, tablesTopY-13.0, "A. RINCIAN PENDAPATAN")

	// Column B Header (Deduction)
	p.rect(colRightX, tablesTopY-18.0, colW, 18.0, 1.0, 0.94, 0.94, 0.95, 0.8, 0.8, 0.5, true, true)
	p.text("F2", 8, 0.7, 0.15, 0.15, colRightX+8.0, tablesTopY-13.0, "B. RINCIAN POTONGAN")

	// Render Incomes
	curY := tablesTopY - 32.0
	if len(incs) == 0 {
		p.text("F1", 8, 0.5, 0.5, 0.5, colLeftX+8.0, curY, "- Tidak ada pendapatan -")
	} else {
		for _, item := range incs {
			p.text("F1", 8, 0.2, 0.2, 0.2, colLeftX+8.0, curY, item.name)
			p.textRight("F1", 8, 0.1, 0.1, 0.1, colLeftX+colW-8.0, curY, formatRupiahPDF(item.val))
			p.line(colLeftX+8.0, curY-3.0, colLeftX+colW-8.0, curY-3.0, 0.9, 0.9, 0.9, 0.3)
			curY -= 14.5
		}
	}

	// Render Deductions
	curYDed := tablesTopY - 32.0
	if len(deds) == 0 {
		p.text("F1", 8, 0.5, 0.5, 0.5, colRightX+8.0, curYDed, "- Tidak ada potongan -")
	} else {
		for _, item := range deds {
			p.text("F1", 8, 0.2, 0.2, 0.2, colRightX+8.0, curYDed, item.name)
			p.textRight("F1", 8, 0.1, 0.1, 0.1, colRightX+colW-8.0, curYDed, formatRupiahPDF(item.val))
			p.line(colRightX+8.0, curYDed-3.0, colRightX+colW-8.0, curYDed-3.0, 0.9, 0.9, 0.9, 0.3)
			curYDed -= 14.5
		}
	}

	// Totals row at Y = 430.0
	totalsY := 430.0

	// Income Total
	p.rect(colLeftX, totalsY, colW, 18.0, 0.9, 0.95, 1.0, 0.7, 0.8, 0.95, 0.5, true, true)
	p.text("F2", 8, 0.1, 0.25, 0.5, colLeftX+8.0, totalsY+5.0, "Total Pendapatan (Bruto)")
	p.textRight("F2", 8, 0.1, 0.25, 0.5, colLeftX+colW-8.0, totalsY+5.0, formatRupiahPDF(detail.TotalPendapatan))

	// Deduction Total
	p.rect(colRightX, totalsY, colW, 18.0, 1.0, 0.92, 0.92, 0.95, 0.8, 0.8, 0.5, true, true)
	p.text("F2", 8, 0.65, 0.1, 0.1, colRightX+8.0, totalsY+5.0, "Total Potongan")
	p.textRight("F2", 8, 0.65, 0.1, 0.1, colRightX+colW-8.0, totalsY+5.0, formatRupiahPDF(detail.TotalPotongan))

	// Take Home Pay Box at Y = 360.0
	thpY := 360.0
	thpH := 52.0
	p.rect(leftMargin, thpY, contentW, thpH, 0.93, 0.98, 0.95, 0.05, 0.6, 0.4, 1.0, true, true)
	p.text("F2", 9.5, 0.02, 0.35, 0.25, leftMargin+15.0, thpY+32.0, "GAJI BERSIH DITERIMA (TAKE HOME PAY)")
	p.textRight("F2", 13, 0.016, 0.471, 0.341, leftMargin+contentW-15.0, thpY+30.0, formatRupiahPDF(detail.GajiBersih))

	gajiBersihInt := detail.GajiBersih.BigInt().Int64()
	terbilangStr := "Nol Rupiah"
	if gajiBersihInt > 0 {
		terbilangStr = Terbilang(gajiBersihInt) + " Rupiah"
	}
	p.text("F1", 8, 0.2, 0.3, 0.25, leftMargin+15.0, thpY+14.0, fmt.Sprintf("Terbilang: %s", terbilangStr))

	// Signatures at Y = 275.0
	sigY := 275.0
	p.text("F1", 8.5, 0.3, 0.3, 0.3, leftMargin+30.0, sigY, "Penerima Upah,")
	p.line(leftMargin+15.0, sigY-55.0, leftMargin+145.0, sigY-55.0, 0.5, 0.5, 0.5, 0.5)
	p.text("F2", 8.5, 0.1, 0.1, 0.1, leftMargin+20.0, sigY-68.0, detail.NamaPegawai)

	p.text("F1", 8.5, 0.3, 0.3, 0.3, leftMargin+contentW-160.0, sigY, "Kedungadem, "+nowStr)
	p.text("F1", 8.5, 0.3, 0.3, 0.3, leftMargin+contentW-160.0, sigY-12.0, "Bendahara / Bagian Keuangan,")
	p.line(leftMargin+contentW-170.0, sigY-55.0, leftMargin+contentW-20.0, sigY-55.0, 0.5, 0.5, 0.5, 0.5)
	p.text("F2", 8.5, 0.1, 0.1, 0.1, leftMargin+contentW-155.0, sigY-68.0, "Klinik Muhammadiyah")

	// Footer note
	p.text("F1", 7.5, 0.5, 0.5, 0.5, leftMargin+45.0, 160.0, "Dokumen ini dihasilkan secara elektronik oleh Sistem Akuntansi & ERP Klinik Muhammadiyah Kedungadem.")

	// Write objects
	// 1: Catalog
	p.nextObj()
	p.buf.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	// 2: Pages
	p.nextObj()
	p.buf.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

	// Resources string
	resStr := "<< /Font << /F1 4 0 R /F2 5 0 R >>"
	if cachedHasLogo {
		resStr += " /XObject << /Im1 7 0 R >>"
	}
	resStr += " >>"

	// 3: Page
	p.nextObj()
	fmt.Fprintf(&p.buf, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 6 0 R /Resources %s >>\nendobj\n", resStr)

	// 4: Font F1 (Helvetica)
	p.nextObj()
	p.buf.WriteString("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	// 5: Font F2 (Helvetica-Bold)
	p.nextObj()
	p.buf.WriteString("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

	// 6: Content Stream
	p.nextObj()
	fmt.Fprintf(&p.buf, "6 0 obj\n<< /Length %d >>\nstream\n%sendstream\nendobj\n", p.cs.Len(), p.cs.String())

	// 7: Image (if present)
	if cachedHasLogo {
		p.nextObj()
		fmt.Fprintf(&p.buf, "7 0 obj\n<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length %d >>\nstream\n", cachedLogoW, cachedLogoH, len(cachedLogoZlib))
		p.buf.Write(cachedLogoZlib)
		p.buf.WriteString("\nendstream\nendobj\n")
	}

	// Cross-reference table
	totalObjs := p.objNum
	xrefOffset := p.buf.Len()
	fmt.Fprintf(&p.buf, "xref\n0 %d\n0000000000 65535 f \n", totalObjs+1)
	for i := 1; i <= totalObjs; i++ {
		fmt.Fprintf(&p.buf, "%010d 00000 n \n", p.offsets[i])
	}
	fmt.Fprintf(&p.buf, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", totalObjs+1, xrefOffset)

	cleanPegawai := strings.ReplaceAll(detail.NamaPegawai, " ", "_")
	cleanPegawai = strings.ReplaceAll(cleanPegawai, ",", "")
	cleanPegawai = strings.ReplaceAll(cleanPegawai, ".", "")
	filename := fmt.Sprintf("Slip_Gaji_%s_%s.pdf", batchNo, cleanPegawai)

	return p.buf.Bytes(), filename, nil
}
