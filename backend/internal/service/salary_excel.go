package service

import (
	"archive/zip"
	"bytes"
	"fmt"
	"strings"

	"backend/internal/model"

	"github.com/shopspring/decimal"
)

func escapeXML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	s = strings.ReplaceAll(s, "'", "&apos;")
	return s
}

// GenerateSalaryTemplateXLSX produces a genuine OpenXML .xlsx binary
func (s *salaryService) GenerateSalaryTemplateXLSX(batchID uint, customRows []model.SalaryDetail) ([]byte, string, error) {
	batch, err := s.repo.GetBatchByID(batchID)
	if err != nil {
		return nil, "", fmt.Errorf("batch gaji tidak ditemukan: %w", err)
	}

	rows := customRows
	if len(rows) == 0 {
		// If customRows not passed, load from DB details or active users
		if len(batch.Details) > 0 {
			rows = batch.Details
		} else {
			users, err := s.repo.GetUsersWithNIP()
			if err == nil && len(users) > 0 {
				for _, u := range users {
					rows = append(rows, model.SalaryDetail{
						NamaPegawai: u.Name,
						NIP:         u.NIP,
					})
				}
			}
		}
	}

	// 1. [Content_Types].xml
	contentTypesXML := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`

	// 2. _rels/.rels
	globalRelsXML := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

	// 3. xl/_rels/workbook.xml.rels
	wbRelsXML := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

	// 4. xl/workbook.xml
	wbXML := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr date1904="false"/>
  <bookViews>
    <workbookView xWindow="0" yWindow="0" windowWidth="20480" windowHeight="10240"/>
  </bookViews>
  <sheets>
    <sheet name="Format Gaji" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`

	// 5. xl/styles.xml
	stylesXML := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF111827"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF991B1B"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF1F2"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="9">
    <!-- 0: Default Data Normal (Text left) -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <!-- 1: Header Dark (No, Nama, NIP) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 2: Header Blue (Pendapatan) -->
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 3: Header Rose (Potongan) -->
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 4: Data Number (#,##0) -->
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 5: Data Text Center (No) -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 6: Total Bruto Number (Light Blue) -->
    <xf numFmtId="164" fontId="2" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 7: Total Potongan Number (Light Rose) -->
    <xf numFmtId="164" fontId="2" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 8: Gaji Bersih Number (Light Green) -->
    <xf numFmtId="164" fontId="2" fillId="7" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`

	// 6. xl/worksheets/sheet1.xml
	var ws bytes.Buffer
	ws.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/>
    <col min="2" max="2" width="34" customWidth="1"/>
    <col min="3" max="3" width="18" customWidth="1"/>
    <col min="4" max="14" width="16" customWidth="1"/>
    <col min="15" max="15" width="20" customWidth="1"/>
    <col min="16" max="23" width="16" customWidth="1"/>
    <col min="24" max="24" width="20" customWidth="1"/>
    <col min="25" max="25" width="22" customWidth="1"/>
  </cols>
  <sheetData>
`)

	// Header Row (Row 1)
	ws.WriteString(`    <row r="1" ht="28" customHeight="1">
      <c r="A1" t="inlineStr" s="1"><is><t>NO</t></is></c>
      <c r="B1" t="inlineStr" s="1"><is><t>NAMA PEGAWAI</t></is></c>
      <c r="C1" t="inlineStr" s="1"><is><t>NIP</t></is></c>
      <c r="D1" t="inlineStr" s="2"><is><t>GAJI POKOK</t></is></c>
      <c r="E1" t="inlineStr" s="2"><is><t>TUNJ. SIA</t></is></c>
      <c r="F1" t="inlineStr" s="2"><is><t>TRANSPORT</t></is></c>
      <c r="G1" t="inlineStr" s="2"><is><t>JABATAN</t></is></c>
      <c r="H1" t="inlineStr" s="2"><is><t>JAGA UTAMA</t></is></c>
      <c r="I1" t="inlineStr" s="2"><is><t>JAGA PRATAMA</t></is></c>
      <c r="J1" t="inlineStr" s="2"><is><t>JASPEL PRATAMA</t></is></c>
      <c r="K1" t="inlineStr" s="2"><is><t>JASPEL RANAP</t></is></c>
      <c r="L1" t="inlineStr" s="2"><is><t>JASPEL RALAN</t></is></c>
      <c r="M1" t="inlineStr" s="2"><is><t>RALAN BPJS</t></is></c>
      <c r="N1" t="inlineStr" s="2"><is><t>TUGAS TAMBAHAN</t></is></c>
      <c r="O1" t="inlineStr" s="2"><is><t>TOTAL BRUTO</t></is></c>
      <c r="P1" t="inlineStr" s="3"><is><t>PPH 21</t></is></c>
      <c r="Q1" t="inlineStr" s="3"><is><t>INFAQ</t></is></c>
      <c r="R1" t="inlineStr" s="3"><is><t>BPJS KES</t></is></c>
      <c r="S1" t="inlineStr" s="3"><is><t>BPJS TK</t></is></c>
      <c r="T1" t="inlineStr" s="3"><is><t>DENDA ABSEN</t></is></c>
      <c r="U1" t="inlineStr" s="3"><is><t>ARISAN KEL</t></is></c>
      <c r="V1" t="inlineStr" s="3"><is><t>DENDA NGAJI</t></is></c>
      <c r="W1" t="inlineStr" s="3"><is><t>KASBON</t></is></c>
      <c r="X1" t="inlineStr" s="3"><is><t>TOTAL POTONGAN</t></is></c>
      <c r="Y1" t="inlineStr" s="1"><is><t>GAJI BERSIH (NETTO)</t></is></c>
    </row>
`)

	decVal := func(d decimal.Decimal) int64 {
		return d.BigInt().Int64()
	}

	// Data Rows (Row 2, 3, ...)
	for idx, row := range rows {
		rNum := idx + 2
		ws.WriteString(fmt.Sprintf(`    <row r="%d" ht="20" customHeight="1">
      <c r="A%d" s="5"><v>%d</v></c>
      <c r="B%d" t="inlineStr" s="0"><is><t>%s</t></is></c>
      <c r="C%d" t="inlineStr" s="5"><is><t>%s</t></is></c>
      <c r="D%d" s="4"><v>%d</v></c>
      <c r="E%d" s="4"><v>%d</v></c>
      <c r="F%d" s="4"><v>%d</v></c>
      <c r="G%d" s="4"><v>%d</v></c>
      <c r="H%d" s="4"><v>%d</v></c>
      <c r="I%d" s="4"><v>%d</v></c>
      <c r="J%d" s="4"><v>%d</v></c>
      <c r="K%d" s="4"><v>%d</v></c>
      <c r="L%d" s="4"><v>%d</v></c>
      <c r="M%d" s="4"><v>%d</v></c>
      <c r="N%d" s="4"><v>%d</v></c>
      <c r="O%d" s="6"><f>SUM(D%d:N%d)</f><v>%d</v></c>
      <c r="P%d" s="4"><v>%d</v></c>
      <c r="Q%d" s="4"><v>%d</v></c>
      <c r="R%d" s="4"><v>%d</v></c>
      <c r="S%d" s="4"><v>%d</v></c>
      <c r="T%d" s="4"><v>%d</v></c>
      <c r="U%d" s="4"><v>%d</v></c>
      <c r="V%d" s="4"><v>%d</v></c>
      <c r="W%d" s="4"><v>%d</v></c>
      <c r="X%d" s="7"><f>SUM(P%d:W%d)</f><v>%d</v></c>
      <c r="Y%d" s="8"><f>O%d-X%d</f><v>%d</v></c>
    </row>
`,
			rNum,
			rNum, idx+1,
			rNum, escapeXML(row.NamaPegawai),
			rNum, escapeXML(row.NIP),
			rNum, decVal(row.GajiPokok),
			rNum, decVal(row.TunjanganSIA),
			rNum, decVal(row.TunjanganTransportasi),
			rNum, decVal(row.TunjanganJabatan),
			rNum, decVal(row.UangJagaUtama),
			rNum, decVal(row.UangJagaPratama),
			rNum, decVal(row.JasaPelayananPratama),
			rNum, decVal(row.JasaPelayananRawatInap),
			rNum, decVal(row.JasaPelayananRawatJalan),
			rNum, decVal(row.JasaPelayananRawatJalanBPJS),
			rNum, decVal(row.TugasTambahan),
			rNum, rNum, rNum, decVal(row.TotalPendapatan),
			rNum, decVal(row.PPh21),
			rNum, decVal(row.Infaq),
			rNum, decVal(row.BPJSKesehatan),
			rNum, decVal(row.BPJSKetenagakerjaan),
			rNum, decVal(row.DendaAbsen),
			rNum, decVal(row.ArisanKeluarga),
			rNum, decVal(row.DendaNgaji),
			rNum, decVal(row.Kasbon),
			rNum, rNum, rNum, decVal(row.TotalPotongan),
			rNum, rNum, rNum, decVal(row.GajiBersih),
		))
	}

	ws.WriteString(`  </sheetData>
</worksheet>`)

	// Create Zip Archive
	var zipBuf bytes.Buffer
	zw := zip.NewWriter(&zipBuf)

	entries := map[string]string{
		"[Content_Types].xml":        contentTypesXML,
		"_rels/.rels":                globalRelsXML,
		"xl/_rels/workbook.xml.rels": wbRelsXML,
		"xl/workbook.xml":            wbXML,
		"xl/styles.xml":              stylesXML,
		"xl/worksheets/sheet1.xml":   ws.String(),
	}

	for name, data := range entries {
		w, err := zw.Create(name)
		if err != nil {
			return nil, "", fmt.Errorf("gagal membuat zip entry %s: %w", name, err)
		}
		if _, err := w.Write([]byte(data)); err != nil {
			return nil, "", fmt.Errorf("gagal menulis data %s: %w", name, err)
		}
	}

	if err := zw.Close(); err != nil {
		return nil, "", fmt.Errorf("gagal menyelesaikan file excel zip: %w", err)
	}

	filename := fmt.Sprintf("Format_Pengisian_Gaji_%s.xlsx", batch.BatchNumber)
	return zipBuf.Bytes(), filename, nil
}

