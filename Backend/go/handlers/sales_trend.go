package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type SalesTrendHandler struct {
	collection *mongo.Collection
}

func NewSalesTrendHandler(collection *mongo.Collection) *SalesTrendHandler {
	return &SalesTrendHandler{collection: collection}
}

func (h *SalesTrendHandler) GetSalesTrend(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	// Calcular fechas: últimos 7 días
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -6) // 7 días incluyendo hoy

	pipeline := []bson.M{
		{"$match": bson.M{
			"timestamp": bson.M{
				"$gte": startDate.Unix(),
				"$lte": endDate.Unix(),
			},
			"status": "completed",
		}},
		{"$group": bson.M{
			"_id": bson.M{
				"$dateToString": bson.M{
					"format": "%Y-%m-%d",
					"date": bson.M{
						"$toDate": bson.M{
							"$multiply": []interface{}{"$timestamp", 1000},
						},
					},
				},
			},
			"totalAmount": bson.M{"$sum": "$totalAmount"},
		}},
		{"$sort": bson.M{"_id": 1}},
	}

	cursor, err := h.collection.Aggregate(ctx, pipeline)
	if err != nil {
		http.Error(w, "Error fetching sales trend: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		http.Error(w, "Error reading sales trend", http.StatusInternalServerError)
		return
	}

	// Formatear para el gráfico (asegurar 7 días)
	formattedData := make(map[string]float64)
	for _, day := range results {
		date := day["_id"].(string)
		amount := day["totalAmount"].(float64)
		formattedData[date] = amount
	}

	// Crear array de 7 días con datos (incluso si no hay ventas)
	var trendData []float64
	currentDate := startDate
	for i := 0; i < 7; i++ {
		dateStr := currentDate.Format("2006-01-02")
		amount, ok := formattedData[dateStr]
		if !ok {
			amount = 0
		}
		trendData = append(trendData, amount)
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trendData)
}