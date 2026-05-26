package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"real-estate-api/config"
	"real-estate-api/models"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("❌ Decode error: %v", err)
		WriteError(w, http.StatusBadRequest, "Invalid request")
		return
	}
	log.Printf("✅ Body decoded: username=%q", body.Username)

	collection := config.MongoClient.Database("real-estate").Collection("admins")
	var admin models.Admin

	err := collection.FindOne(context.Background(), bson.M{"username": body.Username}).Decode(&admin)
	if err != nil {
		log.Printf("❌ FindOne error: %v", err)
		WriteError(w, http.StatusBadRequest, "Invalid credentials")
		return
	}
	log.Printf("✅ Admin found: %q", admin.Username)

	err = bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(body.Password))
	if err != nil {
		log.Printf("❌ Password mismatch: %v", err)
		WriteError(w, http.StatusBadRequest, "Invalid credentials")
		return
	}
	log.Printf("✅ Password matched")
}
