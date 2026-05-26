package main

import (
	"context"
	"log"
	"os"

	"real-estate-api/config"
	"real-estate-api/models"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	config.ConnectDB()

	username := os.Getenv("ADMIN_USERNAME")
	password := os.Getenv("ADMIN_PASSWORD")

	if username == "" {
		username = "admin"
	}
	if password == "" {
		password = "admin123"
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionAdmins)

	var existingAdmin models.Admin
	err = collection.FindOne(context.Background(), bson.M{"username": username}).Decode(&existingAdmin)
	if err == nil {
		log.Println("Admin already exists")
		return
	}

	admin := models.Admin{
		Username: username,
		Password: string(hashedPassword),
	}

	_, err = collection.InsertOne(context.Background(), admin)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("✅ Admin created successfully")
	log.Printf("Username: %s", username)
	log.Printf("Password: %s", password)
}
