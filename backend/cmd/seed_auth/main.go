package main

import (
	"fmt"
	"log"

	"backend/config"
	"backend/internal/model"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	db := config.InitDB()
	if db == nil {
		log.Fatalf("Gagal connect DB")
	}

	var adminRole model.Role
	db.Where("name = ?", "admin").First(&adminRole)

	hash, _ := bcrypt.GenerateFromPassword([]byte("12345"), bcrypt.DefaultCost)

	// Pastikan user Dimas (NIP 2023.01.02.03) ada
	var dimas model.User
	err := db.Where("nip = ?", "2023.01.02.03").First(&dimas).Error
	if err != nil {
		dimas = model.User{
			Name:     "Dimas Wisnu Wirawan",
			NIP:      "2023.01.02.03",
			Password: string(hash),
			RoleID:   &adminRole.ID,
		}
		db.Create(&dimas)
		fmt.Println("✓ User Dimas Wisnu Wirawan berhasil dibuat")
	} else {
		dimas.Password = string(hash)
		dimas.RoleID = &adminRole.ID
		db.Save(&dimas)
		fmt.Println("✓ User Dimas Wisnu Wirawan diperbarui")
	}

	var users []model.User
	db.Preload("Role").Find(&users)
	for _, u := range users {
		rName := "-"
		if u.Role != nil {
			rName = u.Role.DisplayName
		}
		fmt.Printf("User: [%s] %s | Role: %s\n", u.NIP, u.Name, rName)
	}
}
