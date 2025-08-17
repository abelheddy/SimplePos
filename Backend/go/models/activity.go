package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type ActivityType string

const (
	ActivityLogin      ActivityType = "login"
	ActivityNewSale    ActivityType = "new_sale"
	ActivityNewUser    ActivityType = "new_user"
	ActivityUpdateUser ActivityType = "update_user"
	ActivityDeleteUser ActivityType = "delete_user"
)

type Activity struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	UserEmail string             `json:"user_email" bson:"user_email"`
	Type      ActivityType       `json:"type" bson:"type"`
	Message   string             `json:"message" bson:"message"`
	Timestamp time.Time          `json:"timestamp" bson:"timestamp"`
}