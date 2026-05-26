package config

import (
	"log"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
)

var CloudinaryClient *cloudinary.Cloudinary

func InitCloudinary() {
	cloudName := os.Getenv("CLOUD_NAME")
	apiKey := os.Getenv("API_KEY")
	apiSecret := os.Getenv("API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		log.Fatal("Cloudinary environment variables not set")
	}

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		log.Fatal(err)
	}

	CloudinaryClient = cld
	log.Println("✅ Cloudinary Initialized")
}
