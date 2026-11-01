package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"backend/config"
)

func main() {
	sqlFilePath := "e:/Golang/Go-Akuntansi/db_30-10-2026.sql"
	if len(os.Args) > 1 {
		sqlFilePath = os.Args[1]
	}

	fmt.Println("==================================================================")
	fmt.Println("🚀 MEMULAI MIGRASI TOTAL SEMUA TABEL & DATA MYSQL -> POSTGRESQL")
	fmt.Printf("File Source: %s\n", sqlFilePath)
	fmt.Println("==================================================================")

	db := config.InitDB()
	if db == nil {
		log.Fatalf("Gagal terhubung ke database PostgreSQL.")
	}

	// Buat logger silent agar output migrasi rapi dan tidak terpotong
	db.Logger = db.Logger.LogMode(0) // Silent

	// Nonaktifkan foreign keys, triggers, dan set konfigurasi string
	db.Exec("SET session_replication_role = 'replica';")
	db.Exec("SET standard_conforming_strings = off;")

	file, err := os.Open(sqlFilePath)
	if err != nil {
		log.Fatalf("Gagal membuka file SQL: %v", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	buf := make([]byte, 10*1024*1024)
	scanner.Buffer(buf, 100*1024*1024)

	reCreateTable := regexp.MustCompile(`(?i)^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?` + "`" + `?([a-zA-Z0-9_]+)` + "`" + `?`)
	reInsert := regexp.MustCompile(`(?i)^INSERT\s+INTO\s+` + "`" + `?([a-zA-Z0-9_]+)` + "`" + `?`)

	var tablesCreated []string
	tableRowsInserted := make(map[string]int)

	isReadingTable := false
	var currentCreateTable string
	var tableLines []string

	isReadingInsert := false
	var currentInsertTable string
	var insertSqlBuilder strings.Builder

	startTime := time.Now()

	convertMySQLToPostgreSQLDDL := func(tableName string, lines []string) (string, string) {
		var colDefs []string
		var pkClause string

		for _, l := range lines {
			trimmed := strings.TrimSpace(l)
			trimmed = strings.TrimSuffix(trimmed, ",")
			if trimmed == "" {
				continue
			}

			upper := strings.ToUpper(trimmed)

			// Lewati index, constraint, unique key, foreign key agar tidak bentrok order/dependensi
			if strings.HasPrefix(upper, "KEY ") ||
				strings.HasPrefix(upper, "INDEX ") ||
				strings.HasPrefix(upper, "UNIQUE KEY ") ||
				strings.HasPrefix(upper, "CONSTRAINT ") ||
				strings.HasPrefix(upper, "FULLTEXT ") ||
				strings.HasPrefix(upper, "SPATIAL ") {
				continue
			}

			// Tangani PRIMARY KEY (...)
			if strings.HasPrefix(upper, "PRIMARY KEY") {
				rePK := regexp.MustCompile(`(?i)PRIMARY\s+KEY\s*\(([^)]+)\)`)
				matches := rePK.FindStringSubmatch(trimmed)
				if len(matches) > 1 {
					cleanPK := strings.ReplaceAll(matches[1], "`", "\"")
					pkClause = fmt.Sprintf("PRIMARY KEY (%s)", cleanPK)
				}
				continue
			}

			colLine := trimmed

			// Bersihkan collation & charset
			reCollate := regexp.MustCompile(`(?i)\s+COLLATE\s+[a-zA-Z0-9_]+`)
			colLine = reCollate.ReplaceAllString(colLine, "")
			reCharSet := regexp.MustCompile(`(?i)\s+CHARACTER\s+SET\s+[a-zA-Z0-9_]+`)
			colLine = reCharSet.ReplaceAllString(colLine, "")

			// Hapus MySQL COMMENT '...'
			reComment := regexp.MustCompile(`(?i)\s+COMMENT\s+'(?:''|[^'])*'`)
			colLine = reComment.ReplaceAllString(colLine, "")

			// Hapus MySQL ON UPDATE CURRENT_TIMESTAMP
			reOnUpdate := regexp.MustCompile(`(?i)\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP`)
			colLine = reOnUpdate.ReplaceAllString(colLine, "")

			// Hapus MySQL GENERATED ALWAYS AS (...) VIRTUAL/STORED agar jadi kolom biasa di PG
			reGenerated := regexp.MustCompile(`(?i)\s+GENERATED\s+ALWAYS\s+AS\s*\([^;]+\)\s*(?:VIRTUAL|STORED)`)
			colLine = reGenerated.ReplaceAllString(colLine, "")

			// Tangani AUTO_INCREMENT -> ubah ke BIGSERIAL / SERIAL TANPA kata "PRIMARY KEY"
			if strings.Contains(strings.ToUpper(colLine), "AUTO_INCREMENT") {
				reAICol := regexp.MustCompile(`^` + "`" + `?([a-zA-Z0-9_]+)` + "`" + `?\s+([a-zA-Z0-9_]+)`)
				matches := reAICol.FindStringSubmatch(colLine)
				if len(matches) > 2 {
					colName := matches[1]
					colType := strings.ToLower(matches[2])
					if strings.Contains(colType, "bigint") {
						colDefs = append(colDefs, fmt.Sprintf("\"%s\" BIGSERIAL NOT NULL", colName))
					} else {
						colDefs = append(colDefs, fmt.Sprintf("\"%s\" SERIAL NOT NULL", colName))
					}
					continue
				}
			}

			// Konversi tipe data MySQL -> PostgreSQL (hapus tanda kurung panjang pada semua tipe integer)
			reEnum := regexp.MustCompile(`(?i)\benum\([^)]+\)`)
			colLine = reEnum.ReplaceAllString(colLine, "VARCHAR(100)")

			reBigInt := regexp.MustCompile(`(?i)\bbigint(?:\s*\([0-9]+\))?(?:\s+unsigned)?`)
			colLine = reBigInt.ReplaceAllString(colLine, "BIGINT")

			reTinyInt := regexp.MustCompile(`(?i)\btinyint(?:\s*\([0-9]+\))?(?:\s+unsigned)?`)
			colLine = reTinyInt.ReplaceAllString(colLine, "SMALLINT")

			reSmallInt := regexp.MustCompile(`(?i)\bsmallint(?:\s*\([0-9]+\))?(?:\s+unsigned)?`)
			colLine = reSmallInt.ReplaceAllString(colLine, "SMALLINT")

			reMediumInt := regexp.MustCompile(`(?i)\bmediumint(?:\s*\([0-9]+\))?(?:\s+unsigned)?`)
			colLine = reMediumInt.ReplaceAllString(colLine, "INTEGER")

			reInt := regexp.MustCompile(`(?i)\b(?:int|integer)(?:\s*\([0-9]+\))?(?:\s+unsigned)?`)
			colLine = reInt.ReplaceAllString(colLine, "INTEGER")

			reText := regexp.MustCompile(`(?i)\b(?:longtext|mediumtext|tinytext)\b`)
			colLine = reText.ReplaceAllString(colLine, "TEXT")

			reDateTime := regexp.MustCompile(`(?i)\bdatetime\b`)
			colLine = reDateTime.ReplaceAllString(colLine, "TIMESTAMP")

			reYear := regexp.MustCompile(`(?i)\byear(?:\([0-9]+\))?\b`)
			colLine = reYear.ReplaceAllString(colLine, "INTEGER")

			reDouble := regexp.MustCompile(`(?i)\bdouble\b`)
			colLine = reDouble.ReplaceAllString(colLine, "DOUBLE PRECISION")

			reUnsigned := regexp.MustCompile(`(?i)\s+unsigned\b`)
			colLine = reUnsigned.ReplaceAllString(colLine, "")

			// Bersihkan sisa backtick
			colLine = strings.ReplaceAll(colLine, "`", "\"")

			// Ganti `nama_kolom` menjadi "nama_kolom"
			reColName := regexp.MustCompile(`^` + "`" + `([a-zA-Z0-9_]+)` + "`" + `\s+`)
			colLine = reColName.ReplaceAllString(colLine, "\"$1\" ")

			colDefs = append(colDefs, colLine)
		}

		if pkClause != "" {
			colDefs = append(colDefs, pkClause)
		}

		dropSql := fmt.Sprintf("DROP TABLE IF EXISTS \"%s\" CASCADE;", tableName)
		createSql := fmt.Sprintf("CREATE TABLE \"%s\" (\n  %s\n);", tableName, strings.Join(colDefs, ",\n  "))
		return dropSql, createSql
	}

	executeInsert := func(table string, sqlStr string) {
		cleanSQL := strings.ReplaceAll(sqlStr, "`", "\"")
		cleanSQL = strings.ReplaceAll(cleanSQL, `\'`, `''`)
		cleanSQL = strings.ReplaceAll(cleanSQL, `$2$y$`, `$2y$`)

		res := db.Exec(cleanSQL)
		if res.Error != nil {
			fmt.Printf("   ⚠️ [Error Insert %s]: %v\n", table, res.Error)
		} else {
			tableRowsInserted[table] += int(res.RowsAffected)
		}
	}

	fmt.Println("Sedang membaca DDL & mengimpor seluruh 52 tabel...")

	for scanner.Scan() {
		rawLine := scanner.Text()
		line := strings.TrimRight(rawLine, "\r\n")
		trimmed := strings.TrimSpace(line)

		// ─── CREATE TABLE ───────────────────────────────────────────────────
		if !isReadingTable && !isReadingInsert {
			if strings.HasPrefix(strings.ToUpper(trimmed), "CREATE TABLE") {
				matches := reCreateTable.FindStringSubmatch(trimmed)
				if len(matches) > 1 {
					currentCreateTable = strings.ToLower(matches[1])
					isReadingTable = true
					tableLines = []string{}
					continue
				}
			}
		}

		if isReadingTable {
			if strings.HasPrefix(trimmed, ")") && strings.HasSuffix(trimmed, ";") {
				dropSql, createSql := convertMySQLToPostgreSQLDDL(currentCreateTable, tableLines)
				db.Exec(dropSql)
				if err := db.Exec(createSql).Error; err != nil {
					fmt.Printf("   ⚠️ Gagal membuat tabel %s: %v\n", currentCreateTable, err)
					fmt.Printf("   DDL:\n%s\n", createSql)
				} else {
					tablesCreated = append(tablesCreated, currentCreateTable)
				}
				isReadingTable = false
				tableLines = nil
				continue
			} else {
				tableLines = append(tableLines, line)
				continue
			}
		}

		// ─── INSERT INTO ────────────────────────────────────────────────────
		if !isReadingInsert && !isReadingTable {
			if strings.HasPrefix(strings.ToUpper(trimmed), "INSERT INTO") {
				matches := reInsert.FindStringSubmatch(trimmed)
				if len(matches) > 1 {
					currentInsertTable = strings.ToLower(matches[1])
					isReadingInsert = true
					insertSqlBuilder.Reset()
					insertSqlBuilder.WriteString(line)
					insertSqlBuilder.WriteString("\n")

					if strings.HasSuffix(trimmed, ";") {
						executeInsert(currentInsertTable, insertSqlBuilder.String())
						isReadingInsert = false
						insertSqlBuilder.Reset()
					}
					continue
				}
			}
		}

		if isReadingInsert {
			insertSqlBuilder.WriteString(line)
			insertSqlBuilder.WriteString("\n")

			if strings.HasSuffix(trimmed, ";") {
				executeInsert(currentInsertTable, insertSqlBuilder.String())
				isReadingInsert = false
				insertSqlBuilder.Reset()
			}
			continue
		}
	}

	// ─── POST-MIGRATION SEQUENCES & NORMALIZATION ────────────────────────────
	fmt.Println("\nMenyesuaikan sequence auto-increment untuk seluruh tabel...")
	for _, t := range tablesCreated {
		db.Exec(fmt.Sprintf("SELECT setval(pg_get_serial_sequence('\"%s\"', 'id'), COALESCE(MAX(id), 1)) FROM \"%s\";", t, t))
	}

	// Normalisasi data jika diperlukan
	db.Exec("UPDATE daftar_akun SET induk_akun_id = NULL WHERE induk_akun_id = 0;")

	// Kembalikan foreign key checks
	db.Exec("SET session_replication_role = 'origin';")
	db.Exec("SET standard_conforming_strings = on;")

	duration := time.Since(startTime)
	fmt.Println("\n==================================================================")
	fmt.Printf("🎉 MIGRASI SELESAI DALAM %v!\n", duration)
	fmt.Printf("Total Tabel Berhasil Dibuat di PostgreSQL: %d tabel\n", len(tablesCreated))
	fmt.Println("==================================================================")
	totalRows := 0
	for t, count := range tableRowsInserted {
		fmt.Printf("✓ %-32s : %d baris\n", t, count)
		totalRows += count
	}
	fmt.Printf("\nTOTAL DATA KESELURUHAN BERHASIL DIIMPOR: %d baris di %d tabel\n", totalRows, len(tableRowsInserted))
}

