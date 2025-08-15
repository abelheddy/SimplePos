package main

import (
	"auth-service/database"
	"auth-service/handlers"
	"auth-service/middleware"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Get server configuration
	host := getEnv("SERVER_HOST", "localhost")
	port := getEnv("SERVER_PORT", "8080")
	serverAddress := host + ":" + port

	// Connect to MongoDB using the new database package
	if err := database.Connect(); err != nil {
		log.Fatalf("MongoDB connection error: %v", err)
	}
	defer database.Disconnect()

	// Initialize database (create collections and admin user)
	if err := database.InitializeDB(); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Initialize handlers using the database package
	authHandler := handlers.NewAuthHandler(database.DB.Collection("users"))
	salesHandler := handlers.NewSalesHandler(database.DB.Collection("sales"))
	roleHandler := handlers.NewRoleHandler(database.DB.Collection("roles"))
	userHandler := handlers.NewUserHandler(database.DB.Collection("users"))

	// Setup router
	router := mux.NewRouter()

	// Public routes
	router.HandleFunc("/login", authHandler.Login).Methods("POST", "OPTIONS")
	router.HandleFunc("/register", authHandler.Register).Methods("POST", "OPTIONS")

	// Protected routes
	authRouter := router.PathPrefix("/").Subrouter()
	authRouter.Use(middleware.AuthMiddleware)

	// Sales routes
	authRouter.HandleFunc("/sales", salesHandler.CreateSale).Methods("POST", "OPTIONS")
	authRouter.HandleFunc("/sales", salesHandler.GetSales).Methods("GET", "OPTIONS")
	authRouter.HandleFunc("/sales/{id}", salesHandler.GetSale).Methods("GET", "OPTIONS")
	authRouter.HandleFunc("/sales/{id}", salesHandler.UpdateSale).Methods("PUT", "OPTIONS")
	authRouter.HandleFunc("/sales/{id}", salesHandler.DeleteSale).Methods("DELETE", "OPTIONS")
	authRouter.HandleFunc("/reports/sales", salesHandler.GetSalesReport).Methods("GET", "OPTIONS")

	// Admin routes
	adminRouter := authRouter.PathPrefix("/admin").Subrouter()
	adminRouter.Use(middleware.RoleMiddleware("admin"))

	// User management endpoints
	adminRouter.HandleFunc("/users", userHandler.ListUsers).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/users", userHandler.CreateUser).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/users/{id}", userHandler.GetUser).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/users/{id}", userHandler.UpdateUser).Methods("PUT", "OPTIONS")
	adminRouter.HandleFunc("/users/{id}", userHandler.DeleteUser).Methods("DELETE", "OPTIONS")

	// Role management endpoints
	adminRouter.HandleFunc("/roles", roleHandler.CreateRole).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/roles", roleHandler.GetRoles).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/roles/{id}", roleHandler.UpdateRole).Methods("PUT", "OPTIONS")
	adminRouter.HandleFunc("/roles/{id}", roleHandler.DeleteRole).Methods("DELETE", "OPTIONS")

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		Debug:            true,
	})

	// Wrap the router with the CORS middleware
	handler := c.Handler(router)

	// Start server with clear URL information
	log.Println("🚀 Server starting at http://" + serverAddress)
	log.Printf("📌 Available endpoints:")
	log.Printf("   - POST   http://%s/register", serverAddress)
	log.Printf("   - POST   http://%s/login", serverAddress)
	log.Printf("   - POST   http://%s/sales (Requires VENDEDOR role)", serverAddress)
	log.Printf("   - GET    http://%s/sales (Requires VENDEDOR role)", serverAddress)
	log.Printf("   - GET    http://%s/sales/{id} (Requires VENDEDOR role)", serverAddress)
	log.Printf("   - PUT    http://%s/sales/{id} (Requires VENDEDOR role)", serverAddress)
	log.Printf("   - DELETE http://%s/sales/{id} (Requires VENDEDOR role)", serverAddress)
	log.Printf("   - GET    http://%s/reports/sales (Requires CONSULTOR role)", serverAddress)
	log.Printf("   - GET    http://%s/admin/users (Requires ADMIN role)", serverAddress)
	log.Printf("   - POST   http://%s/admin/roles (Requires ADMIN role)", serverAddress)
	log.Printf("   - GET    http://%s/admin/roles (Requires ADMIN role)", serverAddress)
	log.Printf("   - PUT    http://%s/admin/roles/{id} (Requires ADMIN role)", serverAddress)
	log.Printf("   - DELETE http://%s/admin/roles/{id} (Requires ADMIN role)", serverAddress)
	log.Println("🔒 Protected endpoints require JWT in Authorization header")

	if err := http.ListenAndServe(serverAddress, handler); err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}

// Helper function to get environment variables with default values
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}