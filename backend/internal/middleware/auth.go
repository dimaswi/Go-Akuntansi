package middleware

import (
	"strings"

	"backend/internal/model"
	"backend/pkg/auth"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AuthMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Token autentikasi diperlukan")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Unauthorized(c, "Format token Authorization harus 'Bearer <token>'")
			c.Abort()
			return
		}

		claims, err := auth.ValidateToken(parts[1])
		if err != nil {
			response.Unauthorized(c, "Sesi login kedaluwarsa atau token tidak valid: "+err.Error())
			c.Abort()
			return
		}

		// Ambil data user lengkap beserta role, permissions, dan departemen
		var user model.User
		if err := db.Preload("Role.Permissions").Preload("Department").First(&user, claims.UserID).Error; err != nil {
			response.Unauthorized(c, "Pengguna tidak ditemukan")
			c.Abort()
			return
		}

		c.Set("currentUser", user)
		c.Set("currentUserID", user.ID)
		c.Set("user_id", user.ID)
		c.Set("userID", user.ID)
		c.Set("userNIP", user.NIP)
		c.Set("userName", user.Name)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}

func OptionalAuthMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}

		claims, err := auth.ValidateToken(strings.TrimSpace(parts[1]))
		if err != nil || claims == nil {
			c.Next()
			return
		}

		c.Set("currentUserID", claims.UserID)
		c.Set("user_id", claims.UserID)
		c.Set("userID", claims.UserID)
		c.Set("userNIP", claims.NIP)
		c.Set("userName", claims.Name)
		c.Set("userRole", claims.Role)

		var user model.User
		if err := db.Preload("Role.Permissions").Preload("Department").First(&user, claims.UserID).Error; err == nil {
			c.Set("currentUser", user)
			if user.NIP != "" {
				c.Set("userNIP", user.NIP)
			}
			if user.Name != "" {
				c.Set("userName", user.Name)
			}
		} else if err := db.First(&user, claims.UserID).Error; err == nil {
			c.Set("currentUser", user)
			if user.NIP != "" {
				c.Set("userNIP", user.NIP)
			}
			if user.Name != "" {
				c.Set("userName", user.Name)
			}
		}

		c.Next()
	}
}

func RequirePermission(permissionName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get("currentUser")
		if !exists {
			response.Unauthorized(c, "Tidak terautentikasi")
			c.Abort()
			return
		}

		user := val.(model.User)

		// Superadmin / role 'admin' memiliki akses penuh otomatis
		if user.Role != nil && strings.ToLower(user.Role.Name) == "admin" {
			c.Next()
			return
		}

		// Cek apakah permission ada dalam daftar role user
		if user.Role != nil {
			for _, p := range user.Role.Permissions {
				if p.Name == permissionName {
					c.Next()
					return
				}
			}
		}

		response.Forbidden(c, "Anda tidak memiliki hak akses ("+permissionName+") untuk aksi ini")
		c.Abort()
	}
}
