package main

import (
	"log"
	"os"

	"backend/config"
	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	// Connect Database
	db := config.InitDB()

	r := gin.Default()
	r.Use(middleware.SetupCORS())

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		dbStatus := "connected"
		if db == nil {
			dbStatus = "disconnected (check postgres config in .env)"
		}
		c.JSON(200, gin.H{
			"status":   "ok",
			"system":   "Go Akuntansi API",
			"database": dbStatus,
			"version":  "1.0.0",
		})
	})

	if db != nil {
		// Bersihkan data dummy REV- yang sempat dibuat sebelumnya
		db.Exec("DELETE FROM detail_jurnal WHERE jurnal_id IN (SELECT id FROM jurnal WHERE nomor_jurnal LIKE 'REV-%')")
		db.Exec("DELETE FROM jurnal WHERE nomor_jurnal LIKE 'REV-%'")

		// Repositories
		accountRepo := repository.NewAccountRepository(db)
		journalRepo := repository.NewJournalRepository(db)
		userRepo := repository.NewUserRepository(db)
		roleRepo := repository.NewRoleRepository(db)

		// Services
		accountService := service.NewAccountService(accountRepo)
		journalService := service.NewJournalService(journalRepo, db)
		reportService := service.NewReportService(accountRepo, journalRepo, db)
		authService := service.NewAuthService(userRepo)
		roleService := service.NewRoleService(roleRepo)
		userService := service.NewUserService(userRepo)

		// Cash & Bank
		bankAccountRepo := repository.NewBankAccountRepository(db)
		cashTransactionRepo := repository.NewCashTransactionRepository(db)
		bankTransactionRepo := repository.NewBankTransactionRepository(db)
		giroTransactionRepo := repository.NewGiroTransactionRepository(db)
		cashBankService := service.NewCashBankService(
			bankAccountRepo,
			cashTransactionRepo,
			bankTransactionRepo,
			giroTransactionRepo,
			accountRepo,
			journalRepo,
			db,
		)

		// Inventory Repositories & Services
		inventoryRepo := repository.NewInventoryRepository(db)
		inventoryService := service.NewInventoryService(inventoryRepo, journalRepo, accountRepo, db)
		inventoryHandler := handler.NewInventoryHandler(inventoryService)

		// Fixed Asset Repositories & Services
		assetRepo := repository.NewAssetRepository(db)
		assetService := service.NewAssetService(assetRepo, journalRepo, accountRepo, db)
		assetHandler := handler.NewAssetHandler(assetService)

		// Penggajian (Payroll) Repositories & Services
		salaryRepo := repository.NewSalaryRepository(db)
		salaryService := service.NewSalaryService(salaryRepo)
		salaryHandler := handler.NewSalaryHandler(salaryService)

		// Handlers
		accountHandler := handler.NewAccountHandler(accountService)
		journalHandler := handler.NewJournalHandler(journalService)
		reportHandler := handler.NewReportHandler(reportService)
		authHandler := handler.NewAuthHandler(authService)
		roleHandler := handler.NewRoleHandler(roleService)
		userHandler := handler.NewUserHandler(userService)
		cashBankHandler := handler.NewCashBankHandler(cashBankService)

		// API v1 Routes
		api := r.Group("/api/v1")
		{
			// Auth Public
			authGroup := api.Group("/auth")
			{
				authGroup.POST("/login", authHandler.Login)
				authGroup.POST("/logout", authHandler.Logout)
			}

			// Auth Me & Session
			api.GET("/auth/me", middleware.AuthMiddleware(db), authHandler.GetProfile)
			api.POST("/auth/change-password", middleware.AuthMiddleware(db), authHandler.ChangePassword)

			// Users, Roles & Departments Management
			departments := api.Group("/departments")
			{
				departments.GET("", userHandler.GetDepartments)
				departments.GET("/:id", userHandler.GetDepartmentByID)
				departments.POST("", userHandler.CreateDepartment)
				departments.PUT("/:id", userHandler.UpdateDepartment)
				departments.DELETE("/:id", userHandler.DeleteDepartment)
			}

			users := api.Group("/users")
			{
				users.GET("", userHandler.GetAll)
				users.GET("/:id", userHandler.GetByID)
				users.POST("", userHandler.Create)
				users.PUT("/:id", userHandler.Update)
				users.DELETE("/:id", userHandler.Delete)
			}

			roles := api.Group("/roles")
			{
				roles.GET("", roleHandler.GetAll)
				roles.GET("/:id", roleHandler.GetByID)
				roles.POST("", roleHandler.Create)
				roles.PUT("/:id", roleHandler.Update)
				roles.DELETE("/:id", roleHandler.Delete)
			}

			permissions := api.Group("/permissions")
			{
				permissions.GET("", roleHandler.GetPermissions)
				permissions.GET("/:id", roleHandler.GetPermissionByID)
				permissions.POST("", roleHandler.CreatePermission)
				permissions.PUT("/:id", roleHandler.UpdatePermission)
				permissions.DELETE("/:id", roleHandler.DeletePermission)
			}

			// Chart of Accounts (Daftar Akun)
			accounts := api.Group("/daftar-akun")
			{
				accounts.GET("", accountHandler.GetAll)
				accounts.GET("/tree", accountHandler.GetTree)
				accounts.GET("/:id", accountHandler.GetByID)
				accounts.POST("", accountHandler.Create)
				accounts.PUT("/:id", accountHandler.Update)
				accounts.DELETE("/:id", accountHandler.Delete)
			}
			// Alias /accounts untuk kompatibilitas frontend
			accountsAlias := api.Group("/accounts")
			{
				accountsAlias.GET("", accountHandler.GetAll)
				accountsAlias.GET("/tree", accountHandler.GetTree)
				accountsAlias.GET("/:id", accountHandler.GetByID)
				accountsAlias.POST("", accountHandler.Create)
				accountsAlias.PUT("/:id", accountHandler.Update)
				accountsAlias.DELETE("/:id", accountHandler.Delete)
			}

			// Jurnal Umum & Penyesuaian
			journals := api.Group("/jurnal")
			{
				journals.GET("", journalHandler.GetAll)
				journals.GET("/:id", journalHandler.GetByID)
				journals.POST("", journalHandler.Create)
				journals.PUT("/:id", journalHandler.Update)
				journals.POST("/:id/post", journalHandler.Post)
				journals.POST("/:id/unpost", journalHandler.Unpost)
				journals.POST("/:id/reverse", journalHandler.Reverse)
				journals.DELETE("/:id", journalHandler.Delete)
			}

			// Laporan Keuangan
			reports := api.Group("/laporan")
			{
				reports.GET("/buku-besar", reportHandler.GetBukuBesarSummary)
				reports.GET("/buku-besar/:accountId", reportHandler.GetBukuBesar)
				reports.GET("/neraca", reportHandler.GetNeraca)
				reports.GET("/laba-rugi", reportHandler.GetLabaRugi)
				reports.GET("/dampak-penyesuaian", reportHandler.GetDampakPenyesuaian)
				reports.GET("/arus-kas", reportHandler.GetArusKas)
				reports.GET("/perubahan-modal", reportHandler.GetPerubahanModal)
				reports.GET("/analisis-rasio", reportHandler.GetAnalisisRasio)
			}

			// Modul Kas & Bank
			kasGroup := api.Group("/kas")
			{
				// Rekening Bank
				kasGroup.GET("/bank-accounts", cashBankHandler.GetBankAccounts)
				kasGroup.GET("/bank-accounts/:id", cashBankHandler.GetBankAccountByID)
				kasGroup.POST("/bank-accounts", cashBankHandler.CreateBankAccount)
				kasGroup.PUT("/bank-accounts/:id", cashBankHandler.UpdateBankAccount)
				kasGroup.DELETE("/bank-accounts/:id", cashBankHandler.DeleteBankAccount)

				// Transaksi Kas
				kasGroup.GET("/cash-transactions", cashBankHandler.GetCashTransactions)
				kasGroup.GET("/cash-transactions/:id", cashBankHandler.GetCashTransactionByID)
				kasGroup.POST("/cash-transactions", cashBankHandler.CreateCashTransaction)
				kasGroup.PUT("/cash-transactions/:id", cashBankHandler.UpdateCashTransaction)
				kasGroup.DELETE("/cash-transactions/:id", cashBankHandler.DeleteCashTransaction)
				kasGroup.POST("/cash-transactions/:id/post-to-journal", cashBankHandler.PostCashToJournal)

				// Transaksi Bank
				kasGroup.GET("/bank-transactions", cashBankHandler.GetBankTransactions)
				kasGroup.GET("/bank-transactions/:id", cashBankHandler.GetBankTransactionByID)
				kasGroup.POST("/bank-transactions", cashBankHandler.CreateBankTransaction)
				kasGroup.PUT("/bank-transactions/:id", cashBankHandler.UpdateBankTransaction)
				kasGroup.DELETE("/bank-transactions/:id", cashBankHandler.DeleteBankTransaction)
				kasGroup.POST("/bank-transactions/:id/reconcile", cashBankHandler.ReconcileBankTransaction)
				kasGroup.POST("/bank-transactions/:id/post-to-journal", cashBankHandler.PostBankToJournal)

				// Transaksi Giro
				kasGroup.GET("/giro-transactions", cashBankHandler.GetGiroTransactions)
				kasGroup.GET("/giro-transactions/:id", cashBankHandler.GetGiroTransactionByID)
				kasGroup.POST("/giro-transactions", cashBankHandler.CreateGiroTransaction)
				kasGroup.PUT("/giro-transactions/:id", cashBankHandler.UpdateGiroTransaction)
				kasGroup.DELETE("/giro-transactions/:id", cashBankHandler.DeleteGiroTransaction)
				kasGroup.POST("/giro-transactions/:id/submit-to-bank", cashBankHandler.SubmitGiroToBank)
				kasGroup.POST("/giro-transactions/:id/cash", cashBankHandler.CashGiro)
				kasGroup.POST("/giro-transactions/:id/bounce", cashBankHandler.BounceGiro)
				kasGroup.POST("/giro-transactions/:id/post-to-journal", cashBankHandler.PostGiroToJournal)

				// Laporan Giro
				kasGroup.GET("/reports/giro", cashBankHandler.GetGiroReport)
			}

			// Modul Inventory (Persediaan & Logistik)
			invGroup := api.Group("/inventory")
			{
				// Dashboard Stats
				invGroup.GET("/dashboard/stats", inventoryHandler.GetDashboardStats)

				// Master Items (Barang)
				invGroup.GET("/items", inventoryHandler.GetItems)
				invGroup.GET("/items/:id", inventoryHandler.GetItemByID)
				invGroup.POST("/items", inventoryHandler.CreateItem)
				invGroup.PUT("/items/:id", inventoryHandler.UpdateItem)
				invGroup.DELETE("/items/:id", inventoryHandler.DeleteItem)

				// Master Categories (Kategori)
				invGroup.GET("/categories", inventoryHandler.GetCategories)
				invGroup.GET("/categories/:id", inventoryHandler.GetCategoryByID)
				invGroup.POST("/categories", inventoryHandler.CreateCategory)
				invGroup.PUT("/categories/:id", inventoryHandler.UpdateCategory)
				invGroup.DELETE("/categories/:id", inventoryHandler.DeleteCategory)

				// Master Suppliers (Pemasok)
				invGroup.GET("/suppliers", inventoryHandler.GetSuppliers)
				invGroup.GET("/suppliers/:id", inventoryHandler.GetSupplierByID)
				invGroup.POST("/suppliers", inventoryHandler.CreateSupplier)
				invGroup.PUT("/suppliers/:id", inventoryHandler.UpdateSupplier)
				invGroup.DELETE("/suppliers/:id", inventoryHandler.DeleteSupplier)

				// Pengadaan / Pembelian (Purchases)
				invGroup.GET("/purchases", inventoryHandler.GetPurchases)
				invGroup.GET("/purchases/:id", inventoryHandler.GetPurchaseByID)
				invGroup.POST("/purchases", inventoryHandler.CreatePurchase)
				invGroup.PUT("/purchases/:id", inventoryHandler.UpdatePurchase)
				invGroup.POST("/purchases/:id/approve", inventoryHandler.ApprovePurchase)
				invGroup.POST("/purchases/:id/receive", inventoryHandler.ReceivePurchase)
				invGroup.POST("/purchases/:id/post-to-journal", inventoryHandler.PostPurchaseToJournal)

				// Pembayaran Hutang Pembelian
				invGroup.GET("/purchase-payments", inventoryHandler.GetPurchasePayments)
				invGroup.GET("/purchase-payments/:id", inventoryHandler.GetPurchasePaymentByID)
				invGroup.POST("/purchase-payments", inventoryHandler.CreatePurchasePayment)

				// Ringkasan Stok & Nilai Persediaan
				invGroup.GET("/stocks/summary", inventoryHandler.GetStockSummary)

				// Penyesuaian Stok (Adjustments)
				invGroup.GET("/stock-adjustments", inventoryHandler.GetStockAdjustments)
				invGroup.GET("/stock-adjustments/:id", inventoryHandler.GetStockAdjustmentByID)
				invGroup.POST("/stock-adjustments", inventoryHandler.CreateStockAdjustment)
				invGroup.POST("/stock-adjustments/:id/approve", inventoryHandler.ApproveStockAdjustment)

				// Transfer Stok Antar Gudang / Departemen
				invGroup.GET("/stock-transfers", inventoryHandler.GetStockTransfers)
				invGroup.GET("/stock-transfers/:id", inventoryHandler.GetStockTransferByID)
				invGroup.POST("/stock-transfers", inventoryHandler.CreateStockTransfer)
				invGroup.POST("/stock-transfers/:id/receive", inventoryHandler.ReceiveStockTransfer)

				// Stock Opname
				invGroup.GET("/stock-opnames", inventoryHandler.GetStockOpnames)
				invGroup.GET("/stock-opnames/:id", inventoryHandler.GetStockOpnameByID)
				invGroup.POST("/stock-opnames", inventoryHandler.CreateStockOpname)
				invGroup.POST("/stock-opnames/:id/complete", inventoryHandler.CompleteStockOpname)

				// Stock Requests (Permintaan Stok Unit)
				invGroup.GET("/stock-requests", inventoryHandler.GetStockRequests)
				invGroup.GET("/stock-requests/:id", inventoryHandler.GetStockRequestByID)
				invGroup.POST("/stock-requests", inventoryHandler.CreateStockRequest)
				invGroup.POST("/stock-requests/:id/approve", inventoryHandler.ApproveStockRequest)
				invGroup.POST("/stock-requests/:id/complete", inventoryHandler.CompleteStockRequest)
			}

			// Modul Aset (Fixed Assets)
			asetGroup := api.Group("/aset")
			{
				asetGroup.GET("/stats", assetHandler.GetDashboardStats)

				// Kategori Aset
				asetGroup.GET("/categories", assetHandler.GetCategories)
				asetGroup.GET("/categories/:id", assetHandler.GetCategoryByID)
				asetGroup.POST("/categories", assetHandler.CreateCategory)
				asetGroup.PUT("/categories/:id", assetHandler.UpdateCategory)
				asetGroup.DELETE("/categories/:id", assetHandler.DeleteCategory)

				// Daftar Aset
				asetGroup.GET("/assets", assetHandler.GetAssets)
				asetGroup.GET("/assets/:id", assetHandler.GetAssetByID)
				asetGroup.POST("/assets", assetHandler.CreateAsset)
				asetGroup.PUT("/assets/:id", assetHandler.UpdateAsset)
				asetGroup.DELETE("/assets/:id", assetHandler.DeleteAsset)

				// Penyusutan (Depreciation)
				asetGroup.GET("/depreciations", assetHandler.GetDepreciations)
				asetGroup.POST("/depreciations/run", assetHandler.RunDepreciation)

				// Pemeliharaan (Maintenance)
				asetGroup.GET("/maintenances", assetHandler.GetMaintenances)
				asetGroup.GET("/maintenances/:id", assetHandler.GetMaintenanceByID)
				asetGroup.POST("/maintenances", assetHandler.CreateMaintenance)
				asetGroup.PUT("/maintenances/:id", assetHandler.UpdateMaintenance)

				// Pelepasan / Penghapusan (Disposal)
				asetGroup.GET("/disposals", assetHandler.GetDisposals)
				asetGroup.GET("/disposals/:id", assetHandler.GetDisposalByID)
				asetGroup.POST("/disposals", assetHandler.CreateDisposal)
				asetGroup.POST("/disposals/:id/approve", assetHandler.ApproveDisposal)

				// Mutasi / Transfer Lokasi
				asetGroup.GET("/transfers", assetHandler.GetTransfers)
				asetGroup.GET("/transfers/:id", assetHandler.GetTransferByID)
				asetGroup.POST("/transfers", assetHandler.CreateTransfer)
				asetGroup.POST("/transfers/:id/approve", assetHandler.ApproveTransfer)

				// Anggaran & RAB Aset (Budgets)
				asetGroup.GET("/budgets", assetHandler.GetBudgets)
				asetGroup.GET("/budgets/:id", assetHandler.GetBudgetByID)
				asetGroup.POST("/budgets", assetHandler.CreateBudget)
			}

			// Modul Penggajian (Payroll)
			penggajianGroup := api.Group("/penggajian")
			{
				penggajianGroup.GET("/batches", salaryHandler.GetBatches)
				penggajianGroup.POST("/batches", salaryHandler.CreateBatch)
				penggajianGroup.GET("/batches/:id", salaryHandler.GetBatchByID)
				penggajianGroup.PUT("/batches/:id", salaryHandler.UpdateBatch)
				penggajianGroup.DELETE("/batches/:id", salaryHandler.DeleteBatch)
				penggajianGroup.GET("/users", salaryHandler.GetUsersWithNIP)
				penggajianGroup.POST("/batches/:id/gaji", salaryHandler.SaveSalaryDetails)
				penggajianGroup.GET("/batches/:id/excel-template", salaryHandler.DownloadSalaryExcelTemplate)
				penggajianGroup.POST("/batches/:id/excel-template", salaryHandler.DownloadSalaryExcelTemplate)
				penggajianGroup.GET("/journal-preview", salaryHandler.GetJournalPreview)
				penggajianGroup.POST("/post-to-journal", salaryHandler.PostToJournal)
				penggajianGroup.GET("/my-salary", salaryHandler.GetPersonalSalarySlips)
				penggajianGroup.GET("/slips/:id", salaryHandler.GetSlipByID)
				penggajianGroup.GET("/slips/:id/pdf", salaryHandler.DownloadSlipPDF)
				penggajianGroup.GET("/slips/:id/download", salaryHandler.DownloadSlipPDF)
				penggajianGroup.GET("/slips/:id/print", salaryHandler.PrintSlipHTML)
			}

			// Dashboard Ringkasan Stats (Ultra-fast single query)
			api.GET("/dashboard/stats", reportHandler.GetDashboardStats)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server berjalan di http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}
