package repository

import (
	"strings"

	"backend/internal/model"

	"gorm.io/gorm"
)

type UserRepository interface {
	GetByNIP(nip string) (*model.User, error)
	GetByID(id uint) (*model.User, error)
	GetAll(search string, roleID *uint, page, limit int) ([]model.User, int64, error)
	Create(user *model.User) error
	Update(user *model.User) error
	UpdatePassword(userID uint, hashedPassword string) error
	Delete(id uint) error
	GetDepartments() ([]model.Department, error)
	GetDepartmentByID(id uint) (*model.Department, error)
	CreateDepartment(dept *model.Department) error
	UpdateDepartment(dept *model.Department) error
	DeleteDepartment(id uint) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByNIP(nip string) (*model.User, error) {
	var user model.User
	err := r.db.Preload("Role.Permissions").Preload("Department").Where("nip = ?", nip).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.Preload("Role.Permissions").Preload("Department").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetAll(search string, roleID *uint, page, limit int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	query := r.db.Model(&model.User{})
	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(nip) LIKE ?", s, s)
	}
	if roleID != nil && *roleID > 0 {
		query = query.Where("role_id = ?", *roleID)
	}

	query.Count(&total)

	q := query.Preload("Role").Preload("Department").Order("id asc")
	if limit > 0 {
		offset := (page - 1) * limit
		q = q.Offset(offset).Limit(limit)
	}
	err := q.Find(&users).Error

	return users, total, err
}

func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) Update(user *model.User) error {
	return r.db.Model(&model.User{}).Where("id = ?", user.ID).Omit("Role", "Department").Save(user).Error
}

func (r *userRepository) UpdatePassword(userID uint, hashedPassword string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("password", hashedPassword).Error
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&model.User{}, id).Error
}

func (r *userRepository) GetDepartments() ([]model.Department, error) {
	var depts []model.Department
	err := r.db.Preload("Parent").Order("name asc").Find(&depts).Error
	return depts, err
}

func (r *userRepository) GetDepartmentByID(id uint) (*model.Department, error) {
	var dept model.Department
	err := r.db.Preload("Parent").First(&dept, id).Error
	if err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *userRepository) CreateDepartment(dept *model.Department) error {
	return r.db.Create(dept).Error
}

func (r *userRepository) UpdateDepartment(dept *model.Department) error {
	return r.db.Save(dept).Error
}

func (r *userRepository) DeleteDepartment(id uint) error {
	return r.db.Delete(&model.Department{}, id).Error
}
