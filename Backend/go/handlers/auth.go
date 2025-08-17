package handlers

import (
	"auth-service/models"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	collection *mongo.Collection
}

func NewAuthHandler(collection *mongo.Collection) *AuthHandler {
	return &AuthHandler{collection: collection}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var newUser struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		RoleName string `json:"role_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Buscar el rol por nombre
	rolesCollection := h.collection.Database().Collection("roles")
	var role models.Role
	err := rolesCollection.FindOne(context.Background(), bson.M{"name": newUser.RoleName}).Decode(&role)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Invalid role", http.StatusBadRequest)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	// Check if user exists
	existingUser := models.User{}
	err = h.collection.FindOne(context.Background(), bson.M{"email": newUser.Email}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	} else if err != mongo.ErrNoDocuments {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newUser.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	// Crear objeto completo de usuario
	user := models.User{
		Name:     newUser.Name,
		Email:    newUser.Email,
		Password: string(hashedPassword),
		RoleID:   role.ID,
	}

	// Insert user
	_, err = h.collection.InsertOne(context.Background(), user)
	if err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created"})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Find user
	var user models.User
	ctx := context.Background()
	err := h.collection.FindOne(ctx, bson.M{"email": credentials.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Obtener detalles del rol
	rolesCollection := h.collection.Database().Collection("roles")
	var role models.Role
	err = rolesCollection.FindOne(ctx, bson.M{"_id": user.RoleID}).Decode(&role)
	if err != nil {
		http.Error(w, "Error retrieving role", http.StatusInternalServerError)
		return
	}
	// Registrar actividad
	activityCollection := h.collection.Database().Collection("activities")
	LogActivity(
		activityCollection,
		user.ID,
		user.Email,
		models.ActivityLogin,
	)

	// Generate JWT con nombre de rol
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.Email,
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
		"role": role.Name,
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Return token
	json.NewEncoder(w).Encode(map[string]string{
		"token": tokenString,
	})

}
