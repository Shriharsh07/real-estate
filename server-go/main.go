package handler

import (
	"net/http"

	"real-estate-api/config"
	"real-estate-api/handlers"
	"real-estate-api/middleware"

	"github.com/joho/godotenv"
)

func init() {
	godotenv.Load()
	config.ConnectDB()
	config.InitCloudinary()
}

func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Path

	switch {
	case path == "/api/auth/login" && r.Method == "POST":
		handlers.Login(w, r)
	case path == "/api/properties/stats" && r.Method == "GET":
		middleware.AuthMiddleware(handlers.GetStats)(w, r)
	case path == "/api/properties" && r.Method == "POST":
		middleware.AuthMiddleware(handlers.CreateProperty)(w, r)
	case path == "/api/properties" && r.Method == "GET":
		handlers.GetProperties(w, r)
	case matchPath(path, "/api/properties/") && r.Method == "GET":
		middleware.AuthMiddleware(handlers.GetPropertyById)(w, r)
	case matchPath(path, "/api/properties/") && r.Method == "PUT":
		middleware.AuthMiddleware(handlers.UpdateProperty)(w, r)
	case matchPath(path, "/api/properties/") && r.Method == "DELETE":
		middleware.AuthMiddleware(handlers.DeleteProperty)(w, r)
	case path == "/api/owners" && r.Method == "POST":
		middleware.AuthMiddleware(handlers.CreateOwner)(w, r)
	case path == "/api/owners" && r.Method == "GET":
		handlers.GetOwners(w, r)
	case matchPath(path, "/api/owners/") && r.Method == "GET":
		middleware.AuthMiddleware(handlers.GetOwnerById)(w, r)
	case matchPath(path, "/api/owners/") && r.Method == "PUT":
		middleware.AuthMiddleware(handlers.UpdateOwner)(w, r)
	case matchPath(path, "/api/owners/") && r.Method == "DELETE":
		middleware.AuthMiddleware(handlers.DeleteOwner)(w, r)
	case path == "/api/upload" && r.Method == "POST":
		middleware.AuthMiddleware(handlers.UploadImages)(w, r)
	default:
		http.NotFound(w, r)
	}
}

func matchPath(path, prefix string) bool {
	return len(path) > len(prefix) && path[:len(prefix)] == prefix
}
