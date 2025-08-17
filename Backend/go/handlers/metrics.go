package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type MetricsHandler struct {
	usersCollection  *mongo.Collection
	salesCollection  *mongo.Collection
}

func NewMetricsHandler(usersColl, salesColl *mongo.Collection) *MetricsHandler {
	return &MetricsHandler{
		usersCollection: usersColl,
		salesCollection: salesColl,
	}
}

func (h *MetricsHandler) GetDashboardMetrics(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	results := make(chan metricsResult, 3) // Buffer para 3 resultados

	// Total de usuarios
	go func() {
		count, err := h.usersCollection.CountDocuments(ctx, bson.M{})
		results <- metricsResult{name: "users", value: count, err: err}
	}()

	// Ventas de hoy (corregido)
	go func() {
		// Usar zona horaria local
		loc, _ := time.LoadLocation("America/Mexico_City")
		now := time.Now().In(loc)
		
		startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		endOfDay := startOfDay.Add(24 * time.Hour)
		
		pipeline := []bson.M{
			{"$match": bson.M{
				"timestamp": bson.M{
					"$gte": startOfDay.Unix(),
					"$lt":  endOfDay.Unix(),
				},
				"status": "completed", // Solo ventas completadas
			}},
			{"$group": bson.M{
				"_id": nil,
				"totalAmount": bson.M{"$sum": "$totalAmount"},
			}},
		}

		cursor, err := h.salesCollection.Aggregate(ctx, pipeline)
		if err != nil {
			results <- metricsResult{"sales", 0.0, err}
			return
		}
		defer cursor.Close(ctx)

		var result []bson.M
		if err = cursor.All(ctx, &result); err != nil {
			results <- metricsResult{"sales", 0.0, err}
			return
		}

		total := 0.0
		if len(result) > 0 {
			// Manejar diferentes tipos numéricos
			switch v := result[0]["totalAmount"].(type) {
			case float64:
				total = v
			case int32:
				total = float64(v)
			case int64:
				total = float64(v)
			case int:
				total = float64(v)
			}
		}

		results <- metricsResult{"sales", total, nil}
	}()

	// Productos (placeholder - se actualiza desde frontend)
	go func() {
		results <- metricsResult{"products", 0, nil}
	}()

	// Recoger resultados
	metrics := make(map[string]interface{})
	for i := 0; i < 3; i++ {
		res := <-results
		if res.err != nil {
			http.Error(w, "Error obteniendo métricas: "+res.err.Error(), http.StatusInternalServerError)
			return
		}
		metrics[res.name] = res.value
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

type metricsResult struct {
	name  string
	value interface{}
	err   error
}