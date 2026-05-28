package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	handler "real-estate-api/api"

	"github.com/joho/godotenv"
)

func main() {

	// Load .env file
	godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s...\n", port)

	http.HandleFunc("/", handler.Handler)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
