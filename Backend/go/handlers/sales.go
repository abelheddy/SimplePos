// raiz->handlers->sales.go
package handlers

import (
	"auth-service/models"
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SalesHandler struct {
	collection *mongo.Collection
}

func NewSalesHandler(collection *mongo.Collection) *SalesHandler {
	return &SalesHandler{collection: collection}
}

type saleRequestItem struct {
	ProductID   string  `json:"productId" bson:"productId"`
	ProductName string  `json:"productName" bson:"productName"`
	Quantity    int     `json:"quantity" bson:"quantity"`
	UnitPrice   float64 `json:"unitPrice" bson:"unitPrice"`
}

type saleRequest struct {
	Items []saleRequestItem `json:"items" bson:"items"`
}

// CreateSale maneja la creación de nuevas ventas
// Permite acceso a roles: vendedor y admin
func (h *SalesHandler) CreateSale(w http.ResponseWriter, r *http.Request) {
	// 1. Verificación de autenticación
	token := r.Context().Value("token").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)

	userRole, ok := claims["role"].(string)
	if !ok || (userRole != "vendedor" && userRole != "admin") {
		http.Error(w, "Only sellers or admins can create sales", http.StatusForbidden)
		return
	}

	sellerEmail, ok := claims["sub"].(string)
	if !ok {
		http.Error(w, "Invalid seller information", http.StatusBadRequest)
		return
	}

	// Obtener información completa del vendedor
	ctx := context.Background()
	usersCollection := h.collection.Database().Collection("users")
	var seller models.User
	err := usersCollection.FindOne(ctx, bson.M{"email": sellerEmail}).Decode(&seller)
	if err != nil {
		log.Printf("Error fetching seller: %v", err)
		http.Error(w, "Error fetching seller information", http.StatusInternalServerError)
		return
	}

	sellerName := seller.Name

	// 2. Decodificar el cuerpo de la solicitud
	var req saleRequest
	body, _ := ioutil.ReadAll(r.Body)
	log.Printf("Raw request body: %s", string(body))

	// Reset body para poder leerlo de nuevo
	r.Body = ioutil.NopCloser(bytes.NewBuffer(body))
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Parsed request: %+v", req)

	// 3. Validar los items
	if len(req.Items) == 0 {
		http.Error(w, "Sale must contain at least one item", http.StatusBadRequest)
		return
	}

	var saleItems []models.SaleItem
	totalAmount := 0.0

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			http.Error(w, "Quantity must be greater than 0", http.StatusBadRequest)
			return
		}
		if item.UnitPrice <= 0 {
			http.Error(w, "Unit price must be greater than 0", http.StatusBadRequest)
			return
		}

		subtotal := item.UnitPrice * float64(item.Quantity)
		saleItems = append(saleItems, models.SaleItem{
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Subtotal:    subtotal,
		})

		totalAmount += subtotal
	}

	// 4. Crear el documento de venta
	sale := models.Sale{
		ID:          primitive.NewObjectID(),
		Items:       saleItems,
		TotalAmount: totalAmount,
		SellerID:    sellerEmail,
		SellerName:  sellerName,
		Timestamp:   time.Now().Unix(),
		Status:      "completed",
	}

	// 5. Insertar en MongoDB
	result, err := h.collection.InsertOne(ctx, sale)
	if err != nil {
		log.Printf("Error inserting sale: %v", err)
		http.Error(w, "Error creating sale in database", http.StatusInternalServerError)
		return
	}

	// 6. Verificar el resultado
	if result.InsertedID == nil {
		log.Println("No InsertedID returned from MongoDB")
		http.Error(w, "Failed to create sale", http.StatusInternalServerError)
		return
	}

	// 7. Registrar actividad
	activityCollection := h.collection.Database().Collection("activities")
	LogActivity(
		activityCollection,
		seller.ID,
		seller.Email,
		models.ActivityNewSale,
	)

	// 8. Retornar respuesta
	sale.ID = result.InsertedID.(primitive.ObjectID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(sale); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// GetSales obtiene el listado de ventas
// Permite acceso a roles: vendedor y admin
func (h *SalesHandler) GetSales(w http.ResponseWriter, r *http.Request) {
	token := r.Context().Value("token").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	userRole := claims["role"].(string)

	if userRole != "vendedor" && userRole != "admin" {
		http.Error(w, "Only sellers or admins can view sales", http.StatusForbidden)
		return
	}

	var filter bson.M
	if userRole == "admin" {
		filter = bson.M{}
	} else {
		filter = bson.M{"sellerId": claims["sub"].(string)}
	}

	cursor, err := h.collection.Find(context.Background(), filter)
	if err != nil {
		log.Printf("Error fetching sales: %v", err)
		http.Error(w, "Error fetching sales", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var sales []models.Sale
	if err = cursor.All(context.Background(), &sales); err != nil {
		log.Printf("Error reading sales data: %v", err)
		http.Error(w, "Error reading sales data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(sales); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// GetSale obtiene los detalles de una venta específica
// Permite acceso a roles: vendedor y admin
func (h *SalesHandler) GetSale(w http.ResponseWriter, r *http.Request) {
	token := r.Context().Value("token").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	userRole := claims["role"].(string)

	if userRole != "vendedor" && userRole != "admin" {
		http.Error(w, "Only sellers or admins can view sales", http.StatusForbidden)
		return
	}

	params := mux.Vars(r)
	saleID, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid sale ID", http.StatusBadRequest)
		return
	}

	var sale models.Sale
	err = h.collection.FindOne(context.Background(), bson.M{"_id": saleID}).Decode(&sale)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Sale not found", http.StatusNotFound)
			return
		}
		log.Printf("Error fetching sale: %v", err)
		http.Error(w, "Error fetching sale", http.StatusInternalServerError)
		return
	}

	if userRole != "admin" && sale.SellerID != claims["sub"].(string) {
		http.Error(w, "Cannot access this sale", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(sale); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// UpdateSale actualiza una venta existente
// Permite acceso a roles: vendedor y admin
func (h *SalesHandler) UpdateSale(w http.ResponseWriter, r *http.Request) {
	token := r.Context().Value("token").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	userRole := claims["role"].(string)

	if userRole != "vendedor" && userRole != "admin" {
		http.Error(w, "Only sellers or admins can update sales", http.StatusForbidden)
		return
	}

	params := mux.Vars(r)
	saleID, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid sale ID", http.StatusBadRequest)
		return
	}

	var existingSale models.Sale
	err = h.collection.FindOne(context.Background(), bson.M{"_id": saleID}).Decode(&existingSale)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Sale not found", http.StatusNotFound)
			return
		}
		log.Printf("Error fetching sale: %v", err)
		http.Error(w, "Error fetching sale", http.StatusInternalServerError)
		return
	}

	if userRole != "admin" && existingSale.SellerID != claims["sub"].(string) {
		http.Error(w, "Cannot update this sale", http.StatusForbidden)
		return
	}

	var req saleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var saleItems []models.SaleItem
	totalAmount := 0.0

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			http.Error(w, "Quantity must be greater than 0", http.StatusBadRequest)
			return
		}
		if item.UnitPrice <= 0 {
			http.Error(w, "Unit price must be greater than 0", http.StatusBadRequest)
			return
		}

		subtotal := item.UnitPrice * float64(item.Quantity)
		saleItems = append(saleItems, models.SaleItem{
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Subtotal:    subtotal,
		})
		totalAmount += subtotal
	}

	update := bson.M{
		"$set": bson.M{
			"items":       saleItems,
			"totalAmount": totalAmount,
			"timestamp":   time.Now().Unix(),
		},
	}

	_, err = h.collection.UpdateOne(context.Background(), bson.M{"_id": saleID}, update)
	if err != nil {
		log.Printf("Error updating sale: %v", err)
		http.Error(w, "Error updating sale", http.StatusInternalServerError)
		return
	}

	existingSale.Items = saleItems
	existingSale.TotalAmount = totalAmount
	existingSale.Timestamp = time.Now().Unix()

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(existingSale); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// DeleteSale elimina una venta existente
// Permite acceso a roles: vendedor y admin
func (h *SalesHandler) DeleteSale(w http.ResponseWriter, r *http.Request) {
	token := r.Context().Value("token").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	userRole := claims["role"].(string)

	if userRole != "vendedor" && userRole != "admin" {
		http.Error(w, "Only sellers or admins can delete sales", http.StatusForbidden)
		return
	}

	params := mux.Vars(r)
	saleID, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid sale ID", http.StatusBadRequest)
		return
	}

	var sale models.Sale
	err = h.collection.FindOne(context.Background(), bson.M{"_id": saleID}).Decode(&sale)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Sale not found", http.StatusNotFound)
			return
		}
		log.Printf("Error fetching sale: %v", err)
		http.Error(w, "Error fetching sale", http.StatusInternalServerError)
		return
	}

	if userRole != "admin" && sale.SellerID != claims["sub"].(string) {
		http.Error(w, "Cannot delete this sale", http.StatusForbidden)
		return
	}

	_, err = h.collection.DeleteOne(context.Background(), bson.M{"_id": saleID})
	if err != nil {
		log.Printf("Error deleting sale: %v", err)
		http.Error(w, "Error deleting sale", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetSalesReport genera reportes de ventas
// Permite acceso a roles: consultor y admin
func (h *SalesHandler) GetSalesReport(w http.ResponseWriter, r *http.Request) {
	token := r.Context().Value("token").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	userRole := claims["role"].(string)

	if userRole != "consultor" && userRole != "admin" {
		http.Error(w, "Only consultants or admins can generate reports", http.StatusForbidden)
		return
	}

	startDateStr := r.URL.Query().Get("start")
	endDateStr := r.URL.Query().Get("end")

	var filter bson.M = bson.M{"status": "completed"}

	if startDateStr != "" && endDateStr != "" {
		startDate, err := time.Parse("2006-01-02", startDateStr)
		if err != nil {
			http.Error(w, "Invalid start date format (use YYYY-MM-DD)", http.StatusBadRequest)
			return
		}

		endDate, err := time.Parse("2006-01-02", endDateStr)
		if err != nil {
			http.Error(w, "Invalid end date format (use YYYY-MM-DD)", http.StatusBadRequest)
			return
		}

		endDate = endDate.Add(24 * time.Hour)

		filter["timestamp"] = bson.M{
			"$gte": startDate.Unix(),
			"$lt":  endDate.Unix(),
		}
	}

	cursor, err := h.collection.Find(context.Background(), filter)
	if err != nil {
		log.Printf("Error fetching sales for report: %v", err)
		http.Error(w, "Error fetching sales", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var sales []models.Sale
	if err = cursor.All(context.Background(), &sales); err != nil {
		log.Printf("Error reading sales data for report: %v", err)
		http.Error(w, "Error reading sales data", http.StatusInternalServerError)
		return
	}

	totalSales := len(sales)
	totalAmount := 0.0
	for _, sale := range sales {
		totalAmount += sale.TotalAmount
	}

	response := struct {
		TotalSales  int           `json:"totalSales"`
		TotalAmount float64       `json:"totalAmount"`
		Sales       []models.Sale `json:"sales"`
	}{
		TotalSales:  totalSales,
		TotalAmount: totalAmount,
		Sales:       sales,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding report response: %v", err)
	}
}