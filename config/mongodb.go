package config

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client
var MongoCollection *mongo.Collection
var mongoOnce sync.Once

func ConnectDB() *mongo.Client {
	mongoOnce.Do(func() {
		mongoURI := os.Getenv("MONGO_URI")
		if mongoURI == "" {
			log.Fatal("MONGO_URI environment variable not set")
		}

		clientOptions := options.Client().ApplyURI(mongoURI)
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, clientOptions)
		if err != nil {
			log.Fatal("MongoDB connect error:", err)
		}

		err = client.Ping(ctx, nil)
		if err != nil {
			log.Fatal("MongoDB ping error:", err)
		}

		log.Println("✅ MongoDB Atlas Connected")
		MongoClient = client
	})

	return MongoClient
}
	