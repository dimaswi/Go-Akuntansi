package model

import (
	"time"

	"gorm.io/gorm"
)

type PeriodStatus string

const (
	PeriodOpen   PeriodStatus = "open"
	PeriodClosed PeriodStatus = "closed"
	PeriodLocked PeriodStatus = "locked"
)

type ClosingPeriod struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	StartDate *time.Time     `gorm:"type:date" json:"start_date"`
	EndDate   *time.Time     `gorm:"type:date;index" json:"end_date"`
	Year      int            `gorm:"not null;index" json:"year"`
	Month     int            `gorm:"not null" json:"month"`
	Status    PeriodStatus   `gorm:"size:20;default:'open'" json:"status"`
	ClosedBy  *uint          `json:"closed_by"`
	ClosedAt  *time.Time     `json:"closed_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ClosingPeriod) TableName() string {
	return "closing_periods"
}
