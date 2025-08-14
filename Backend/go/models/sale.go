package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type SaleItem struct {
    ProductID   string  `json:"productId" bson:"productId"`
    ProductName string  `json:"productName" bson:"productName"`
    Quantity    int     `json:"quantity" bson:"quantity"`
    UnitPrice   float64 `json:"unitPrice" bson:"unitPrice"`
    Subtotal    float64 `json:"subtotal" bson:"subtotal"`
}

type Sale struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Items       []SaleItem         `json:"items" bson:"items"`
    TotalAmount float64            `json:"totalAmount" bson:"totalAmount"`
    SellerID    string             `json:"sellerId" bson:"sellerId"`
    SellerName  string             `json:"sellerName" bson:"sellerName"`
    Timestamp   int64              `json:"timestamp" bson:"timestamp"`
    Status      string             `json:"status" bson:"status"` // "completed", "canceled", etc.
}