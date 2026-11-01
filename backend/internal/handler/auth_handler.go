package handler

import (
	"net/http"
	"strconv"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	svc service.AuthService
}

func NewAuthHandler(svc service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

type LoginRequest struct {
	NIP      string `json:"nip" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "NIP dan kata sandi harus diisi", err.Error())
		return
	}

	token, user, err := h.svc.Login(req.NIP, req.Password)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Login berhasil", gin.H{
		"token": token,
		"user":  user,
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	val, exists := c.Get("currentUser")
	if !exists {
		response.Unauthorized(c, "Sesi login tidak ditemukan")
		return
	}

	user := val.(model.User)
	response.Success(c, http.StatusOK, "Profil pengguna berhasil diambil", user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	response.Success(c, http.StatusOK, "Logout berhasil", nil)
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	val, exists := c.Get("currentUser")
	if !exists {
		response.Unauthorized(c, "Sesi login tidak valid")
		return
	}

	user := val.(model.User)

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Kata sandi lama dan baru wajib diisi", err)
		return
	}

	if err := h.svc.ChangePassword(user.ID, req.OldPassword, req.NewPassword); err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Kata sandi berhasil diperbarui", nil)
}

// ─── Role Handler ────────────────────────────────────────────────────────────
type RoleHandler struct {
	svc service.RoleService
}

func NewRoleHandler(svc service.RoleService) *RoleHandler {
	return &RoleHandler{svc: svc}
}

type CreateRoleRequest struct {
	Name          string `json:"name" binding:"required"`
	DisplayName   string `json:"display_name"`
	Description   string `json:"description"`
	PermissionIDs []uint `json:"permission_ids"`
}

func (h *RoleHandler) GetAll(c *gin.Context) {
	roles, err := h.svc.GetRoles()
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar role", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil data role", roles)
}

func (h *RoleHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID role tidak valid", nil)
		return
	}

	role, err := h.svc.GetRole(uint(id))
	if err != nil {
		response.NotFound(c, "Role tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail role", role)
}

func (h *RoleHandler) Create(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data role tidak valid", err.Error())
		return
	}

	role, err := h.svc.CreateRole(req.Name, req.DisplayName, req.Description, req.PermissionIDs)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Role berhasil dibuat", role)
}

func (h *RoleHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID role tidak valid", nil)
		return
	}

	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data role tidak valid", err.Error())
		return
	}

	role, err := h.svc.UpdateRole(uint(id), req.Name, req.DisplayName, req.Description, req.PermissionIDs)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Role berhasil diperbarui", role)
}

func (h *RoleHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID role tidak valid", nil)
		return
	}

	if err := h.svc.DeleteRole(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus role", err)
		return
	}
	response.Success(c, http.StatusOK, "Role berhasil dihapus", nil)
}

type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	Module      string `json:"module"`
}

func (h *RoleHandler) GetPermissions(c *gin.Context) {
	perms, err := h.svc.GetPermissions()
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar permission", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil daftar permission", perms)
}

func (h *RoleHandler) GetPermissionByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID permission tidak valid", nil)
		return
	}
	perm, err := h.svc.GetPermission(uint(id))
	if err != nil {
		response.NotFound(c, "Permission tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil detail permission", perm)
}

func (h *RoleHandler) CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data permission tidak valid", err.Error())
		return
	}
	perm, err := h.svc.CreatePermission(req.Name, req.DisplayName, req.Description, req.Module)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Permission berhasil dibuat", perm)
}

func (h *RoleHandler) UpdatePermission(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID permission tidak valid", nil)
		return
	}
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data permission tidak valid", err.Error())
		return
	}
	perm, err := h.svc.UpdatePermission(uint(id), req.Name, req.DisplayName, req.Description, req.Module)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Permission berhasil diperbarui", perm)
}

func (h *RoleHandler) DeletePermission(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID permission tidak valid", nil)
		return
	}
	if err := h.svc.DeletePermission(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus permission", err)
		return
	}
	response.Success(c, http.StatusOK, "Permission berhasil dihapus", nil)
}

// ─── User Handler ────────────────────────────────────────────────────────────
type UserHandler struct {
	svc service.UserService
}

func NewUserHandler(svc service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

type CreateUserRequest struct {
	Name         string `json:"name" binding:"required"`
	NIP          string `json:"nip" binding:"required"`
	Email        string `json:"email"`
	Password     string `json:"password" binding:"required"`
	RoleID       *uint  `json:"role_id"`
	DepartmentID *uint  `json:"department_id"`
}

type UpdateUserRequest struct {
	Name         string `json:"name" binding:"required"`
	NIP          string `json:"nip" binding:"required"`
	Email        string `json:"email"`
	Password     string `json:"password"`
	RoleID       *uint  `json:"role_id"`
	DepartmentID *uint  `json:"department_id"`
	IsAktif      *bool  `json:"is_aktif"`
}

func (h *UserHandler) GetAll(c *gin.Context) {
	search := c.Query("search")
	var roleID *uint
	if rStr := c.Query("role_id"); rStr != "" {
		if r, err := strconv.Atoi(rStr); err == nil {
			uR := uint(r)
			roleID = &uR
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limitStr := c.Query("limit")
	if limitStr == "" {
		limitStr = c.DefaultQuery("per_page", "10")
	}
	limit, _ := strconv.Atoi(limitStr)

	users, total, err := h.svc.GetUsers(search, roleID, page, limit)
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar pengguna", err)
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	meta := response.PaginationMeta{
		CurrentPage: page,
		PerPage:     limit,
		Total:       total,
		TotalPages:  totalPages,
	}

	response.SuccessWithMeta(c, http.StatusOK, "Berhasil mengambil daftar pengguna", users, meta)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID pengguna tidak valid", nil)
		return
	}

	user, err := h.svc.GetUser(uint(id))
	if err != nil {
		response.NotFound(c, "Pengguna tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil data pengguna", user)
}

func (h *UserHandler) Create(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data pengguna tidak valid", err.Error())
		return
	}

	user, err := h.svc.CreateUser(req.Name, req.NIP, req.Email, req.Password, req.RoleID, req.DepartmentID)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusCreated, "Pengguna berhasil dibuat", user)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID pengguna tidak valid", nil)
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Data pengguna tidak valid", err.Error())
		return
	}

	user, err := h.svc.UpdateUser(uint(id), req.Name, req.NIP, req.Email, req.Password, req.RoleID, req.DepartmentID, req.IsAktif)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Pengguna berhasil diperbarui", user)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID pengguna tidak valid", nil)
		return
	}

	if err := h.svc.DeleteUser(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus pengguna", err)
		return
	}
	response.Success(c, http.StatusOK, "Pengguna berhasil dihapus", nil)
}

func (h *UserHandler) GetDepartments(c *gin.Context) {
	depts, err := h.svc.GetDepartments()
	if err != nil {
		response.InternalError(c, "Gagal mengambil daftar departemen", err)
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil daftar departemen", depts)
}

func (h *UserHandler) GetDepartmentByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID departemen tidak valid", nil)
		return
	}
	dept, err := h.svc.GetDepartmentByID(uint(id))
	if err != nil {
		response.NotFound(c, "Departemen tidak ditemukan")
		return
	}
	response.Success(c, http.StatusOK, "Berhasil mengambil data departemen", dept)
}

func (h *UserHandler) CreateDepartment(c *gin.Context) {
	var input struct {
		Code     string `json:"code" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Level    int    `json:"level"`
		ParentID *uint  `json:"parent_id"`
		IsActive *bool  `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err.Error())
		return
	}
	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}
	level := input.Level
	if level <= 0 {
		level = 1
	}

	dept := &model.Department{
		Code:     input.Code,
		Name:     input.Name,
		Level:    level,
		ParentID: input.ParentID,
		IsActive: isActive,
	}
	if err := h.svc.CreateDepartment(dept); err != nil {
		response.InternalError(c, "Gagal menambahkan departemen", err)
		return
	}
	response.Success(c, http.StatusCreated, "Departemen berhasil ditambahkan", dept)
}

func (h *UserHandler) UpdateDepartment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID departemen tidak valid", nil)
		return
	}
	dept, err := h.svc.GetDepartmentByID(uint(id))
	if err != nil {
		response.NotFound(c, "Departemen tidak ditemukan")
		return
	}

	var input struct {
		Code     string `json:"code"`
		Name     string `json:"name"`
		Level    int    `json:"level"`
		ParentID *uint  `json:"parent_id"`
		IsActive *bool  `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Data input tidak valid", err.Error())
		return
	}
	if input.Code != "" {
		dept.Code = input.Code
	}
	if input.Name != "" {
		dept.Name = input.Name
	}
	if input.Level > 0 {
		dept.Level = input.Level
	}
	dept.ParentID = input.ParentID
	if input.IsActive != nil {
		dept.IsActive = *input.IsActive
	}

	if err := h.svc.UpdateDepartment(dept); err != nil {
		response.InternalError(c, "Gagal memperbarui departemen", err)
		return
	}
	response.Success(c, http.StatusOK, "Departemen berhasil diperbarui", dept)
}

func (h *UserHandler) DeleteDepartment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID departemen tidak valid", nil)
		return
	}
	if err := h.svc.DeleteDepartment(uint(id)); err != nil {
		response.InternalError(c, "Gagal menghapus departemen", err)
		return
	}
	response.Success(c, http.StatusOK, "Departemen berhasil dihapus", nil)
}
