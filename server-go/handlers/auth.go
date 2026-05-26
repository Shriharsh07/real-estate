package handlers

import (
	"os"
	"time"

	"real-estate-api/config"
	"real-estate-api/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func Login(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}

	collection := config.MongoClient.Database("real-estate").Collection("admins")
	var admin models.Admin

	err := collection.FindOne(c.Context(), bson.M{"username": body.Username}).Decode(&admin)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid credentials"})
	}

	err = bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(body.Password))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid credentials"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id": admin.ID.Hex(),
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Error generating token"})
	}

	return c.JSON(fiber.Map{"token": tokenString})
}
