package database

import (
	"context"
	"log"
	"os"

	"auth-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// InitializeDB inicializa la base de datos (colecciones y usuario admin)
func InitializeDB() error {
	ctx := context.Background()

	// Crear colecciones si no existen
	collections := []string{"users", "sales", "roles"}
	for _, collName := range collections {
		err := DB.CreateCollection(ctx, collName)
		if err != nil {
			// Ignorar error si la colección ya existe
			if cmdErr, ok := err.(mongo.CommandError); ok && cmdErr.Code == 48 {
				log.Printf("✅ Colección ya existe: %s", collName)
				continue
			}
			return err
		}
		log.Printf("✅ Colección creada: %s", collName)
	}

	rolesCollection := DB.Collection("roles")
	usersCollection := DB.Collection("users")

	// Insertar roles básicos
	basicRoles := []models.Role{
		{Name: "admin", Permissions: []string{"manage_users", "view_reports", "create_sale"}},
		{Name: "vendedor", Permissions: []string{"create_sale"}},
		{Name: "consultor", Permissions: []string{"view_reports"}},
	}

	rolesMap := make(map[string]primitive.ObjectID)
	for _, role := range basicRoles {
		var existingRole models.Role
		err := rolesCollection.FindOne(ctx, bson.M{"name": role.Name}).Decode(&existingRole)

		if err == mongo.ErrNoDocuments {
			res, err := rolesCollection.InsertOne(ctx, role)
			if err != nil {
				return err
			}
			roleID := res.InsertedID.(primitive.ObjectID)
			rolesMap[role.Name] = roleID
			log.Printf("✅ Rol creado: %s", role.Name)
		} else if err != nil {
			return err
		} else {
			rolesMap[role.Name] = existingRole.ID
		}
	}

	// Crear usuario admin
	adminEmail := getEnv("ADMIN_EMAIL", "admin@system.com")
	adminPassword := getEnv("ADMIN_PASSWORD", "AdminPassword123")

	var existingUser models.User
	err := usersCollection.FindOne(ctx, bson.M{"email": adminEmail}).Decode(&existingUser)

	if err == mongo.ErrNoDocuments {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		adminUser := models.User{
			Name:     "System Admin",
			Email:    adminEmail,
			Password: string(hashedPassword),
			RoleID:   rolesMap["admin"],
		}

		_, err = usersCollection.InsertOne(ctx, adminUser)
		if err != nil {
			return err
		}
		log.Printf("✅ Usuario admin creado: %s", adminEmail)
	} else if err != nil {
		return err
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}