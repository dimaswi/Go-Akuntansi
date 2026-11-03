package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"backend/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "postgres"
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "akuntansi_db"
	}
	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}
	timezone := os.Getenv("DB_TIMEZONE")
	if timezone == "" {
		timezone = "Asia/Jakarta"
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		host, user, password, dbname, port, sslmode, timezone,
	)

	var err error
	DB, err = gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Printf("Warning: Failed to connect to PostgreSQL (%v). Silently continuing to allow mock / dev setup.", err)
		return nil
	}

	sqlDB, err := DB.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	// Normalisasi skema database PostgreSQL (boolean, json->text, nullable FK, cleanup soft-delete, sync sequence)
	NormalizeDatabaseSchema(DB)

	// Auto Migrate tabel baru jika belum ada
	err = DB.AutoMigrate(
		&model.ChartOfAccount{},
		&model.Journal{},
		&model.JournalDetail{},
		&model.BankAccount{},
		&model.CashTransaction{},
		&model.BankTransaction{},
		&model.GiroTransaction{},
		&model.Department{},
		&model.ItemCategory{},
		&model.Supplier{},
		&model.Item{},
		&model.ItemStock{},
		&model.Purchase{},
		&model.PurchaseItem{},
		&model.PurchasePayment{},
		&model.StockAdjustment{},
		&model.StockTransfer{},
		&model.StockOpname{},
		&model.StockOpnameItem{},
		&model.StockRequest{},
		&model.StockRequestItem{},

		// Modul Aset Tetap (Fixed Assets)
		&model.AssetCategory{},
		&model.Asset{},
		&model.AssetDepreciation{},
		&model.AssetMaintenance{},
		&model.AssetDisposal{},
		&model.AssetTransfer{},
		&model.AssetBudget{},
		&model.AssetBudgetItem{},

		// Modul Penggajian (Payroll)
		&model.SalaryBatch{},
		&model.SalaryDetail{},
	)
	if err != nil {
		log.Printf("AutoMigrate error: %v", err)
	}

	// Update existing batches with employees from 'draft' to 'done' status
	DB.Model(&model.SalaryBatch{}).
		Where("status = ? AND total_employees > 0", "draft").
		Update("status", model.SalaryBatchStatusDone)

	// Daftarkan permission untuk card dashboard (idempotent)
	SeedDashboardPermissions(DB)

	return DB
}

func NormalizeDatabaseSchema(db *gorm.DB) {
	if db == nil {
		return
	}

	// 1. Konversi kolom smallint bekas migrasi MySQL tinyint(1) menjadi boolean PostgreSQL
	type colInfo struct {
		TableName  string `gorm:"column:table_name"`
		ColumnName string `gorm:"column:column_name"`
	}
	var boolCols []colInfo
	db.Raw(`
		SELECT table_name, column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND data_type = 'smallint'
		  AND (
		      column_name LIKE 'is_%'
		      OR column_name LIKE 'requires_%'
		      OR column_name = 'jurnal_posted'
		  )
	`).Scan(&boolCols)

	for _, c := range boolCols {
		defVal := "false"
		if c.ColumnName == "is_active" || c.ColumnName == "is_aktif" {
			defVal = "true"
		}
		sql := fmt.Sprintf(
			`ALTER TABLE "%s" ALTER COLUMN "%s" DROP DEFAULT, ALTER COLUMN "%s" TYPE boolean USING ("%s"::int != 0), ALTER COLUMN "%s" SET DEFAULT %s`,
			c.TableName, c.ColumnName, c.ColumnName, c.ColumnName, c.ColumnName, defVal,
		)
		if err := db.Exec(sql).Error; err != nil {
			log.Printf("Warning: gagal konversi %s.%s ke boolean: %v", c.TableName, c.ColumnName, err)
		}
	}

	// 2. Konversi kolom bertipe json/jsonb menjadi text agar string kosong "" atau teks biasa tidak menyebabkan SQLSTATE 22P02
	var jsonCols []colInfo
	db.Raw(`
		SELECT table_name, column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND data_type IN ('json', 'jsonb')
	`).Scan(&jsonCols)

	for _, c := range jsonCols {
		sql := fmt.Sprintf(
			`ALTER TABLE "%s" ALTER COLUMN "%s" TYPE text USING "%s"::text`,
			c.TableName, c.ColumnName, c.ColumnName,
		)
		if err := db.Exec(sql).Error; err != nil {
			log.Printf("Warning: gagal konversi %s.%s dari json ke text: %v", c.TableName, c.ColumnName, err)
		}
	}

	// 3. Pastikan kolom relasi opsional (pointer di Go model) bersifat NULLABLE di PostgreSQL
	nullableTargets := []struct {
		table  string
		column string
	}{
		{"items", "category_id"},
		{"items", "supplier_id"},
		{"items", "department_id"},
		{"item_categories", "parent_id"},
		{"stock_opnames", "department_id"},
		{"stock_transfers", "from_department_id"},
		{"giro_transactions", "daftar_akun_giro_id"},
		{"giro_transactions", "daftar_akun_lawan_id"},
		{"cash_transactions", "daftar_akun_lawan_id"},
		{"bank_transactions", "daftar_akun_lawan_id"},
	}
	for _, t := range nullableTargets {
		_ = db.Exec(fmt.Sprintf(`ALTER TABLE "%s" ALTER COLUMN "%s" DROP NOT NULL`, t.table, t.column)).Error
	}

	// 4. Bersihkan baris soft-deleted (deleted_at IS NOT NULL) yang menghalangi unique index (seperti idx_jurnal_nomor_jurnal)
	db.Exec(`DELETE FROM detail_jurnal WHERE jurnal_id IN (SELECT id FROM jurnal WHERE deleted_at IS NOT NULL OR jenis_referensi = 'reversal')`)
	db.Exec(`DELETE FROM jurnal WHERE deleted_at IS NOT NULL OR jenis_referensi = 'reversal'`)
	db.Exec(`DELETE FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE deleted_at IS NOT NULL)`)
	db.Exec(`DELETE FROM purchases WHERE deleted_at IS NOT NULL`)
	db.Exec(`DELETE FROM stock_opname_items WHERE stock_opname_id IN (SELECT id FROM stock_opnames WHERE deleted_at IS NOT NULL)`)
	db.Exec(`DELETE FROM stock_opnames WHERE deleted_at IS NOT NULL`)
	db.Exec(`DELETE FROM stock_request_items WHERE stock_request_id IN (SELECT id FROM stock_requests WHERE deleted_at IS NOT NULL)`)
	db.Exec(`DELETE FROM stock_requests WHERE deleted_at IS NOT NULL`)

	// 5. Sinkronisasi seluruh sequence auto-increment PostgreSQL terhadap MAX(id)
	var tables []string
	db.Raw(`
		SELECT table_name FROM information_schema.columns
		WHERE table_schema = 'public' AND column_name = 'id'
		  AND table_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')
	`).Scan(&tables)
	for _, t := range tables {
		var maxID int64
		db.Raw(fmt.Sprintf(`SELECT COALESCE(MAX(id), 0) FROM "%s"`, t)).Scan(&maxID)
		var seqName string
		db.Raw(fmt.Sprintf(`SELECT COALESCE(pg_get_serial_sequence('"%s"', 'id'), '')`, t)).Scan(&seqName)
		if seqName != "" {
			var lastVal int64
			db.Raw(fmt.Sprintf(`SELECT last_value FROM %s`, seqName)).Scan(&lastVal)
			if lastVal <= maxID {
				db.Exec(fmt.Sprintf(`SELECT setval('%s', %d, true)`, seqName, maxID+1))
			}
		}
	}

	// 6. Normalisasi skema tabel modul RAB aset (asset_budgets & asset_budget_items)
	var hasAssetBudgetId bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'asset_budget_id')`).Scan(&hasAssetBudgetId)
	var hasBudgetId bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'budget_id')`).Scan(&hasBudgetId)
	if hasAssetBudgetId && !hasBudgetId {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "budget_id" bigint`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "budget_id" = "asset_budget_id"`).Error
	} else if hasBudgetId && !hasAssetBudgetId {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "asset_budget_id" bigint`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "asset_budget_id" = "budget_id"`).Error
	} else if hasAssetBudgetId && hasBudgetId {
		_ = db.Exec(`UPDATE "asset_budget_items" SET "budget_id" = "asset_budget_id" WHERE "budget_id" IS NULL AND "asset_budget_id" IS NOT NULL`).Error
	}

	var hasAssetCatId bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'asset_category_id')`).Scan(&hasAssetCatId)
	var hasCatId bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'category_id')`).Scan(&hasCatId)
	if hasAssetCatId && !hasCatId {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "category_id" bigint`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "category_id" = "asset_category_id"`).Error
	} else if hasCatId && !hasAssetCatId {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "asset_category_id" bigint`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "asset_category_id" = "category_id"`).Error
	} else if hasAssetCatId && hasCatId {
		_ = db.Exec(`UPDATE "asset_budget_items" SET "category_id" = "asset_category_id" WHERE "category_id" IS NULL AND "asset_category_id" IS NOT NULL`).Error
	}

	var hasItemName bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'item_name')`).Scan(&hasItemName)
	var hasNameCol bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'name')`).Scan(&hasNameCol)
	if hasItemName && !hasNameCol {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "name" varchar(255)`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "name" = "item_name"`).Error
	} else if hasNameCol && !hasItemName {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "item_name" varchar(255)`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "item_name" = "name"`).Error
	} else if hasItemName && hasNameCol {
		_ = db.Exec(`UPDATE "asset_budget_items" SET "name" = "item_name" WHERE ("name" IS NULL OR "name" = '') AND "item_name" IS NOT NULL`).Error
	}

	var hasEstCost bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'estimated_cost')`).Scan(&hasEstCost)
	var hasEstPrice bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'estimated_price')`).Scan(&hasEstPrice)
	if hasEstCost && !hasEstPrice {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "estimated_price" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "estimated_price" = "estimated_cost"`).Error
	} else if hasEstPrice && !hasEstCost {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "estimated_cost" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "estimated_cost" = "estimated_price"`).Error
	} else if hasEstCost && hasEstPrice {
		_ = db.Exec(`UPDATE "asset_budget_items" SET "estimated_price" = "estimated_cost" WHERE ("estimated_price" IS NULL OR "estimated_price" = 0) AND "estimated_cost" > 0`).Error
	}

	var hasTotalCost bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'total_cost')`).Scan(&hasTotalCost)
	var hasTotalAmt bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budget_items' AND column_name = 'total_amount')`).Scan(&hasTotalAmt)
	if hasTotalCost && !hasTotalAmt {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "total_amount" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "total_amount" = "total_cost"`).Error
	} else if hasTotalAmt && !hasTotalCost {
		_ = db.Exec(`ALTER TABLE "asset_budget_items" ADD COLUMN "total_cost" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budget_items" SET "total_cost" = "total_amount"`).Error
	} else if hasTotalCost && hasTotalAmt {
		_ = db.Exec(`UPDATE "asset_budget_items" SET "total_amount" = "total_cost" WHERE ("total_amount" IS NULL OR "total_amount" = 0) AND "total_cost" > 0`).Error
	}

	var hasBudgetCode bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'budget_code')`).Scan(&hasBudgetCode)
	var hasCode bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'code')`).Scan(&hasCode)
	if hasBudgetCode && !hasCode {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "code" varchar(50)`).Error
		_ = db.Exec(`UPDATE "asset_budgets" SET "code" = "budget_code"`).Error
	} else if hasCode && !hasBudgetCode {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "budget_code" varchar(50)`).Error
		_ = db.Exec(`UPDATE "asset_budgets" SET "budget_code" = "code"`).Error
	} else if hasBudgetCode && hasCode {
		_ = db.Exec(`UPDATE "asset_budgets" SET "code" = "budget_code" WHERE ("code" IS NULL OR "code" = '') AND "budget_code" IS NOT NULL`).Error
	}

	var hasTitle bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'title')`).Scan(&hasTitle)
	var hasBudgetName bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'budget_name')`).Scan(&hasBudgetName)
	var hasNameBgt bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'name')`).Scan(&hasNameBgt)
	if !hasTitle && (hasBudgetName || hasNameBgt) {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "title" varchar(255)`).Error
		if hasBudgetName {
			_ = db.Exec(`UPDATE "asset_budgets" SET "title" = "budget_name"`).Error
		} else if hasNameBgt {
			_ = db.Exec(`UPDATE "asset_budgets" SET "title" = "name"`).Error
		}
	} else if hasTitle && !hasBudgetName {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "budget_name" varchar(255)`).Error
		_ = db.Exec(`UPDATE "asset_budgets" SET "budget_name" = "title"`).Error
	} else if hasTitle && (hasBudgetName || hasNameBgt) {
		if hasBudgetName {
			_ = db.Exec(`UPDATE "asset_budgets" SET "title" = "budget_name" WHERE ("title" IS NULL OR "title" = '') AND "budget_name" IS NOT NULL`).Error
		} else if hasNameBgt {
			_ = db.Exec(`UPDATE "asset_budgets" SET "title" = "name" WHERE ("title" IS NULL OR "title" = '') AND "name" IS NOT NULL`).Error
		}
	}

	var hasTotalBudget bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'total_budget')`).Scan(&hasTotalBudget)
	var hasTotalAmountBudget bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'total_amount')`).Scan(&hasTotalAmountBudget)
	if hasTotalAmountBudget && !hasTotalBudget {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "total_budget" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budgets" SET "total_budget" = "total_amount"`).Error
	} else if hasTotalBudget && !hasTotalAmountBudget {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "total_amount" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budgets" SET "total_amount" = "total_budget"`).Error
	} else if hasTotalBudget && hasTotalAmountBudget {
		_ = db.Exec(`UPDATE "asset_budgets" SET "total_budget" = "total_amount" WHERE ("total_budget" IS NULL OR "total_budget" = 0) AND "total_amount" > 0`).Error
	}

	var hasTotalRealized bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'total_realized')`).Scan(&hasTotalRealized)
	var hasRealizedAmountBudget bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_budgets' AND column_name = 'realized_amount')`).Scan(&hasRealizedAmountBudget)
	if hasRealizedAmountBudget && !hasTotalRealized {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "total_realized" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budgets" SET "total_realized" = "realized_amount"`).Error
	} else if hasTotalRealized && !hasRealizedAmountBudget {
		_ = db.Exec(`ALTER TABLE "asset_budgets" ADD COLUMN "realized_amount" decimal(15,2)`).Error
		_ = db.Exec(`UPDATE "asset_budgets" SET "realized_amount" = "total_realized"`).Error
	} else if hasTotalRealized && hasRealizedAmountBudget {
		_ = db.Exec(`UPDATE "asset_budgets" SET "total_realized" = "realized_amount" WHERE ("total_realized" IS NULL OR "total_realized" = 0) AND "realized_amount" > 0`).Error
	}

	// 7. Bersihkan duplikasi data permission dan relasi role_permission, serta pasang unique constraint
	_ = db.Exec(`DELETE FROM permissions a USING permissions b WHERE a.id > b.id AND a.name = b.name`).Error

	var hasRolePermissionTable bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permission')`).Scan(&hasRolePermissionTable)
	if hasRolePermissionTable {
		_ = db.Exec(`DELETE FROM role_permission a USING role_permission b WHERE a.id > b.id AND a.role_id = b.role_id AND a.permission_id = b.permission_id`).Error
		_ = db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permission_role_perm ON role_permission (role_id, permission_id)`).Error
	}

	var hasRolePermissionsTable bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions')`).Scan(&hasRolePermissionsTable)
	if hasRolePermissionsTable {
		_ = db.Exec(`DELETE FROM role_permissions a USING role_permissions b WHERE a.ctid > b.ctid AND a.role_id = b.role_id AND a.permission_id = b.permission_id`).Error
		_ = db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_role_perm ON role_permissions (role_id, permission_id)`).Error
	}

	// 8. Normalisasi kolom salary_details (n_ip <-> nip, p_ph21 <-> pph_21) & sinkronisasi user_id berdasarkan NIP
	var hasSalaryDetailsNIP bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salary_details' AND column_name = 'n_ip')`).Scan(&hasSalaryDetailsNIP)
	if hasSalaryDetailsNIP {
		_ = db.Exec(`UPDATE "salary_details" SET "nip" = "n_ip" WHERE ("nip" IS NULL OR "nip" = '') AND "n_ip" IS NOT NULL AND "n_ip" <> ''`).Error
		_ = db.Exec(`UPDATE "salary_details" SET "n_ip" = "nip" WHERE ("n_ip" IS NULL OR "n_ip" = '') AND "nip" IS NOT NULL AND "nip" <> ''`).Error
	}
	var hasSalaryDetailsPPh21 bool
	db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salary_details' AND column_name = 'p_ph21')`).Scan(&hasSalaryDetailsPPh21)
	if hasSalaryDetailsPPh21 {
		_ = db.Exec(`UPDATE "salary_details" SET "pph_21" = "p_ph21" WHERE ("pph_21" IS NULL OR "pph_21" = 0) AND "p_ph21" IS NOT NULL AND "p_ph21" <> 0`).Error
		_ = db.Exec(`UPDATE "salary_details" SET "p_ph21" = "pph_21" WHERE ("p_ph21" IS NULL OR "p_ph21" = 0) AND "pph_21" IS NOT NULL AND "pph_21" <> 0`).Error
	}
	_ = db.Exec(`UPDATE "salary_details" sd SET "user_id" = u."id" FROM "users" u WHERE sd."nip" IS NOT NULL AND sd."nip" <> '' AND u."nip" = sd."nip" AND (sd."user_id" IS NULL OR sd."user_id" <> u."id")`).Error
}

// SeedDashboardPermissions mendaftarkan permission untuk setiap card pada dashboard utama.
// Hanya membuat permission yang belum ada; tidak mengubah role manapun.
func SeedDashboardPermissions(db *gorm.DB) {
	perms := []model.Permission{
		// Card dashboard lain memakai permission yang sudah ada:
		// akuntansi.view, kas.view, inventory.dashboard.view, aset.dashboard.view, penggajian.view
		{Name: "penggajian.slip-saya.view", DisplayName: "Penggajian - Slip Gaji Saya", Description: "Melihat slip gaji pribadi (juga card Slip Gaji Saya pada dashboard)", Module: "Penggajian"},

		// Kas & Bank granular permissions
		{Name: "kas.cash-transaction.view", DisplayName: "Lihat Transaksi Kas", Description: "Melihat daftar dan detail transaksi kas", Module: "Transaksi Kas & Bank"},
		{Name: "kas.cash-transaction.create", DisplayName: "Tambah Transaksi Kas", Description: "Membuat transaksi kas masuk / keluar (BKM/BKK)", Module: "Transaksi Kas & Bank"},
		{Name: "kas.cash-transaction.edit", DisplayName: "Edit Transaksi Kas", Description: "Mengubah transaksi kas", Module: "Transaksi Kas & Bank"},
		{Name: "kas.cash-transaction.post", DisplayName: "Posting Transaksi Kas ke Jurnal", Description: "Memposting transaksi kas ke jurnal umum akuntansi", Module: "Transaksi Kas & Bank"},

		{Name: "kas.bank-transaction.view", DisplayName: "Lihat Transaksi Bank", Description: "Melihat daftar dan detail transaksi bank", Module: "Transaksi Kas & Bank"},
		{Name: "kas.bank-transaction.create", DisplayName: "Tambah Transaksi Bank", Description: "Membuat mutasi transaksi bank", Module: "Transaksi Kas & Bank"},
		{Name: "kas.bank-transaction.edit", DisplayName: "Edit Transaksi Bank", Description: "Mengubah mutasi transaksi bank", Module: "Transaksi Kas & Bank"},
		{Name: "kas.bank-transaction.post", DisplayName: "Posting Transaksi Bank ke Jurnal", Description: "Memposting transaksi bank ke jurnal umum akuntansi", Module: "Transaksi Kas & Bank"},
		{Name: "kas.bank-transaction.reconcile", DisplayName: "Rekonsiliasi Transaksi Bank", Description: "Melakukan rekonsiliasi transaksi bank", Module: "Transaksi Kas & Bank"},

		// Purchase Payments granular aliases
		{Name: "inventory.purchase-payments.view", DisplayName: "Lihat Pembayaran PO", Description: "Melihat daftar pembayaran hutang PO", Module: "Pembelian"},
		{Name: "inventory.purchase-payments.create", DisplayName: "Tambah Pembayaran PO", Description: "Mencatat pembayaran hutang PO", Module: "Pembelian"},

		// Asset granular aliases
		{Name: "aset.disposals.edit", DisplayName: "Edit Disposal", Description: "Mengubah data penghentian / disposal aset", Module: "Aset - Disposal"},
		{Name: "aset.disposals.delete", DisplayName: "Hapus Disposal", Description: "Menghapus data disposal aset", Module: "Aset - Disposal"},
		{Name: "aset.transfers.edit", DisplayName: "Edit Transfer Aset", Description: "Mengubah data transfer aset", Module: "Aset - Transfer"},
		{Name: "aset.transfers.delete", DisplayName: "Hapus Transfer Aset", Description: "Menghapus data transfer aset", Module: "Aset - Transfer"},

		// Stock Requests permissions
		{Name: "inventory.stock-requests.view", DisplayName: "Lihat Permintaan Stok", Description: "Melihat daftar permintaan stok unit", Module: "Permintaan Stok"},
		{Name: "inventory.stock-requests.create", DisplayName: "Tambah Permintaan Stok", Description: "Membuat pengajuan amprahan stok baru", Module: "Permintaan Stok"},
		{Name: "inventory.stock-requests.edit", DisplayName: "Edit Permintaan Stok", Description: "Mengubah pengajuan permintaan stok", Module: "Permintaan Stok"},
		{Name: "inventory.stock-requests.delete", DisplayName: "Hapus Permintaan Stok", Description: "Menghapus pengajuan permintaan stok", Module: "Permintaan Stok"},
		{Name: "inventory.stock-requests.approve", DisplayName: "Setujui Permintaan Stok", Description: "Menyetujui kuantitas permintaan stok unit", Module: "Permintaan Stok"},
		{Name: "inventory.stock-requests.complete", DisplayName: "Serahkan Barang / Selesaikan Amprahan", Description: "Menyerahkan fisik barang dari gudang pusat ke unit dan menambah stok fisik unit", Module: "Permintaan Stok"},
		{Name: "inventory.stock-requests.cancel", DisplayName: "Batalkan Permintaan Stok", Description: "Membatalkan permintaan stok unit", Module: "Permintaan Stok"},
	}
	for i := range perms {
		var count int64
		db.Model(&model.Permission{}).Where("name = ?", perms[i].Name).Count(&count)
		if count == 0 {
			if err := db.Create(&perms[i]).Error; err != nil {
				log.Printf("Seed permission %s gagal: %v", perms[i].Name, err)
			}
		}
	}

	// Berikan permission ke role admin dan logistics jika ada
	hasRolePermissionsTable := db.Migrator().HasTable("role_permissions")
	var adminRole model.Role
	if err := db.Where("name = ?", "admin").First(&adminRole).Error; err == nil {
		for i := range perms {
			var perm model.Permission
			if err := db.Where("name = ?", perms[i].Name).First(&perm).Error; err == nil {
				// role_permission
				var count int64
				db.Table("role_permission").Where("role_id = ? AND permission_id = ?", adminRole.ID, perm.ID).Count(&count)
				if count == 0 {
					db.Exec("INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)", adminRole.ID, perm.ID)
				}
				// role_permissions (jika ada variasi tabel)
				if hasRolePermissionsTable {
					var countLegacy int64
					db.Table("role_permissions").Where("role_id = ? AND permission_id = ?", adminRole.ID, perm.ID).Count(&countLegacy)
					if countLegacy == 0 {
						db.Exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", adminRole.ID, perm.ID)
					}
				}
			}
		}
	}
	var logRole model.Role
	if err := db.Where("name = ?", "logistics").First(&logRole).Error; err == nil {
		for i := range perms {
			if strings.HasPrefix(perms[i].Name, "inventory.stock-requests.") {
				var perm model.Permission
				if err := db.Where("name = ?", perms[i].Name).First(&perm).Error; err == nil {
					var count int64
					db.Table("role_permission").Where("role_id = ? AND permission_id = ?", logRole.ID, perm.ID).Count(&count)
					if count == 0 {
						db.Exec("INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)", logRole.ID, perm.ID)
					}
					if hasRolePermissionsTable {
						var countLegacy int64
						db.Table("role_permissions").Where("role_id = ? AND permission_id = ?", logRole.ID, perm.ID).Count(&countLegacy)
						if countLegacy == 0 {
							db.Exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", logRole.ID, perm.ID)
						}
					}
				}
			}
		}
	}
}

func SeedInitialData(db *gorm.DB) {
	// Database produksi sudah memiliki seluruh data akun, jurnal, user, role, dan permission.
}

