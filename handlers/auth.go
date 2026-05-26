package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"real-estate-api/config"
	"real-estate-api/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionAdmins)
	var admin models.Admin

	err := collection.FindOne(context.Background(), bson.M{"username": body.Username}).Decode(&admin)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid credentials")
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(body.Password))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid credentials")
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":  admin.ID.Hex(),
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Error generating token")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"token":   tokenString,
		"message": "Login successful",
		"user": map[string]any{
			"id":       admin.ID,
			"username": admin.Username,
		},
	})
}
