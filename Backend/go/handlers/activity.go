package handlers

import (
	"auth-service/models"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ActivityHandler struct {
	collection *mongo.Collection
}

func NewActivityHandler(collection *mongo.Collection) *ActivityHandler {
	return &ActivityHandler{collection: collection}
}

func (h *ActivityHandler) GetRecentActivity(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Obtener las últimas 10 actividades
	findOptions := options.Find().SetSort(bson.D{{"timestamp", -1}}).SetLimit(10)
	cursor, err := h.collection.Find(ctx, bson.M{}, findOptions)
	if err != nil {
		http.Error(w, "Error fetching activities", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var activities []models.Activity
	if err = cursor.All(ctx, &activities); err != nil {
		http.Error(w, "Error reading activities", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activities)
}

// Función auxiliar para registrar actividades
func LogActivity(collection *mongo.Collection, userID primitive.ObjectID, userEmail string, activityType models.ActivityType) {
	activity := models.Activity{
		UserID:    userID,
		UserEmail: userEmail,
		Type:      activityType,
		Timestamp: time.Now(),
	}

	switch activityType {
	case models.ActivityLogin:
		activity.Message = "Inició sesión"
	case models.ActivityNewSale:
		activity.Message = "Creó una nueva venta"
	case models.ActivityNewUser:
		activity.Message = "Creó un nuevo usuario"
	case models.ActivityUpdateUser:
		activity.Message = "Actualizó un usuario"
	case models.ActivityDeleteUser:
		activity.Message = "Eliminó un usuario"
	}

	_, err := collection.InsertOne(context.Background(), activity)
	if err != nil {
		log.Printf("Error registrando actividad: %v", err)
	}
}