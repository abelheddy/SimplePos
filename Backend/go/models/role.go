package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Role struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Name        string             `json:"name" bson:"name"`
    Permissions []string           `json:"permissions" bson:"permissions"`
}