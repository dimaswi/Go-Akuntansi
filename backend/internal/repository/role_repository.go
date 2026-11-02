package repository

import (
	"backend/internal/model"

	"gorm.io/gorm"
)

type RoleRepository interface {
	GetAll() ([]model.Role, error)
	GetByID(id uint) (*model.Role, error)
	GetByName(name string) (*model.Role, error)
	Create(role *model.Role, permissionIDs []uint) error
	Update(role *model.Role, permissionIDs []uint) error
	Delete(id uint) error
	GetAllPermissions() ([]model.Permission, error)
	GetPermissionByID(id uint) (*model.Permission, error)
	CreatePermission(p *model.Permission) error
	UpdatePermission(p *model.Permission) error
	DeletePermission(id uint) error
}

type roleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{db: db}
}

func deduplicatePermissions(perms []model.Permission) []model.Permission {
	seen := make(map[uint]bool)
	unique := make([]model.Permission, 0, len(perms))
	for _, p := range perms {
		if !seen[p.ID] {
			seen[p.ID] = true
			unique = append(unique, p)
		}
	}
	return unique
}

func (r *roleRepository) GetAll() ([]model.Role, error) {
	var roles []model.Role
	err := r.db.Preload("Permissions").Order("id asc").Find(&roles).Error
	if err == nil {
		for i := range roles {
			roles[i].Permissions = deduplicatePermissions(roles[i].Permissions)
		}
	}
	return roles, err
}

func (r *roleRepository) GetByID(id uint) (*model.Role, error) {
	var role model.Role
	err := r.db.Preload("Permissions").First(&role, id).Error
	if err != nil {
		return nil, err
	}
	role.Permissions = deduplicatePermissions(role.Permissions)
	return &role, nil
}

func (r *roleRepository) GetByName(name string) (*model.Role, error) {
	var role model.Role
	err := r.db.Preload("Permissions").Where("name = ?", name).First(&role).Error
	if err != nil {
		return nil, err
	}
	role.Permissions = deduplicatePermissions(role.Permissions)
	return &role, nil
}

func (r *roleRepository) Create(role *model.Role, permissionIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(role).Error; err != nil {
			return err
		}

		if len(permissionIDs) > 0 {
			var perms []model.Permission
			if err := tx.Where("id IN ?", permissionIDs).Find(&perms).Error; err != nil {
				return err
			}
			if err := tx.Model(role).Association("Permissions").Replace(perms); err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *roleRepository) Update(role *model.Role, permissionIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(role).Error; err != nil {
			return err
		}

		var perms []model.Permission
		if len(permissionIDs) > 0 {
			if err := tx.Where("id IN ?", permissionIDs).Find(&perms).Error; err != nil {
				return err
			}
		}
		if err := tx.Model(role).Association("Permissions").Replace(perms); err != nil {
			return err
		}

		return nil
	})
}

func (r *roleRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var role model.Role
		if err := tx.First(&role, id).Error; err != nil {
			return err
		}
		if err := tx.Model(&role).Association("Permissions").Clear(); err != nil {
			return err
		}
		return tx.Delete(&role).Error
	})
}

func (r *roleRepository) GetAllPermissions() ([]model.Permission, error) {
	var perms []model.Permission
	err := r.db.Order("module asc, id asc").Find(&perms).Error
	if err == nil {
		perms = deduplicatePermissions(perms)
	}
	return perms, err
}

func (r *roleRepository) GetPermissionByID(id uint) (*model.Permission, error) {
	var perm model.Permission
	err := r.db.First(&perm, id).Error
	if err != nil {
		return nil, err
	}
	return &perm, nil
}

func (r *roleRepository) CreatePermission(p *model.Permission) error {
	return r.db.Create(p).Error
}

func (r *roleRepository) UpdatePermission(p *model.Permission) error {
	return r.db.Save(p).Error
}

func (r *roleRepository) DeletePermission(id uint) error {
	return r.db.Delete(&model.Permission{}, id).Error
}

