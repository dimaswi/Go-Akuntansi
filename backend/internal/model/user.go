package model

import (
	"time"
)

type User struct {
	ID            uint       `gorm:"primaryKey;column:id" json:"id"`
	Name          string     `gorm:"column:name;size:255;not null" json:"name"`
	NIP           string     `gorm:"column:nip;size:50;uniqueIndex;not null" json:"nip"`
	Password      string     `gorm:"column:password;size:255;not null" json:"-"`
	RoleID        *uint       `gorm:"column:role_id" json:"role_id"`
	Role          *Role       `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	DepartmentID  *uint       `gorm:"column:department_id" json:"department_id"`
	Department    *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	RememberToken string      `gorm:"column:remember_token;size:100" json:"-"`
	CreatedAt     *time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     *time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

type Department struct {
	ID       uint        `gorm:"primaryKey;column:id" json:"id"`
	Code     string      `gorm:"column:code;size:50" json:"code"`
	Name     string      `gorm:"column:name;size:255" json:"name"`
	Level    int         `gorm:"column:level" json:"level"`
	ParentID *uint       `gorm:"column:parent_id" json:"parent_id"`
	Parent   *Department `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	IsActive bool        `gorm:"column:is_active" json:"is_active"`
}

func (Department) TableName() string {
	return "departments"
}

type Role struct {
	ID                   uint         `gorm:"primaryKey;column:id" json:"id"`
	Name                 string       `gorm:"column:name;size:100;uniqueIndex;not null" json:"name"`
	DisplayName          string       `gorm:"column:display_name;size:150" json:"display_name"`
	Description          string       `gorm:"column:description;type:text" json:"description"`
	NotificationSettings string       `gorm:"column:notification_settings;type:text" json:"notification_settings,omitempty"`
	Permissions          []Permission `gorm:"many2many:role_permission;foreignKey:ID;joinForeignKey:role_id;References:ID;joinReferences:permission_id;" json:"permissions,omitempty"`
	CreatedAt            *time.Time   `gorm:"column:created_at" json:"created_at"`
	UpdatedAt            *time.Time   `gorm:"column:updated_at" json:"updated_at"`
}

func (Role) TableName() string {
	return "roles"
}

type Permission struct {
	ID          uint       `gorm:"primaryKey;column:id" json:"id"`
	Name        string     `gorm:"column:name;size:100;uniqueIndex;not null" json:"name"`
	DisplayName string     `gorm:"column:display_name;size:150" json:"display_name"`
	Description string     `gorm:"column:description;type:text" json:"description"`
	Module      string     `gorm:"column:module;size:100" json:"module"`
	CreatedAt   *time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   *time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Permission) TableName() string {
	return "permissions"
}

type RolePermission struct {
	ID           uint `gorm:"primaryKey" json:"id"`
	RoleID       uint `json:"role_id"`
	PermissionID uint `json:"permission_id"`
}

func (RolePermission) TableName() string {
	return "role_permission"
}

