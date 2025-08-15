package database

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	// Client es el cliente de MongoDB
	Client *mongo.Client
	// DB es la instancia de la base de datos
	DB *mongo.Database
)

// Connect establece la conexión con MongoDB Atlas
func Connect() error {
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		log.Fatal("MONGO_URI no está definido en las variables de entorno")
	}

	clientOptions := options.Client().ApplyURI(uri)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Conectar a MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	// Verificar conexión
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	Client = client
	DB = client.Database(os.Getenv("DB_NAME"))
	log.Println("✅ Conectado a MongoDB Atlas!")
	return nil
}

// Disconnect cierra la conexión con MongoDB
func Disconnect() {
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		
		if err := Client.Disconnect(ctx); err != nil {
			log.Printf("Error desconectando MongoDB: %v", err)
		} else {
			log.Println("Desconectado de MongoDB")
		}
	}
}