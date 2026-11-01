package main

import (
	"fmt"
	"backend/config"
)

func main() {
	db := config.InitDB()
	db.Logger = db.Logger.LogMode(0)

	var tables []string
	db.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name").Scan(&tables)
	fmt.Printf("\n=== SEMUA TABEL DI DATABASE (%d) ===\n", len(tables))
	for _, t := range tables {
		fmt.Printf("- %s\n", t)
	}
}
