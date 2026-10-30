package handler

import (
	"net/http"
	"sync"

	"real-estate-api/config"
	"real-estate-api/handlers"
	"real-estate-api/middleware"
)

var initOnce sync.Once

func Handler(w http.ResponseWriter, r *http.Request) {
	initOnce.Do(func() {
		config.ConnectDB()
		config.InitCloudinary()
	})

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	serveAPI(w, r)
}

func serveAPI(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	switch {
	case path == "/api/auth/signup" && r.Method == "POST":
		handlers.Signup(w, r)
	case path == "/api/auth/user-login" && r.Method == "POST":
		handlers.UserLogin(w, r)
	case path == "/api/enquiries" && r.Method == "POST":
		middleware.AuthMiddleware(handlers.CreateEnquiry)(w, r)
	case path == "/api/enquiries" && r.Method == "GET":
		middleware.AdminMiddleware(handlers.GetEnquiries)(w, r)
	case path == "/api/media/sign" && r.Method == "POST":
		middleware.AdminMiddleware(handlers.SignMedia)(w, r)

	case path == "/api/auth/login" && r.Method == "POST":
		handlers.Login(w, r)
	case path == "/api/properties/stats" && r.Method == "GET":
		middleware.AdminMiddleware(handlers.GetStats)(w, r)
	case path == "/api/properties" && r.Method == "POST":
		middleware.AdminMiddleware(handlers.CreateProperty)(w, r)
	case path == "/api/properties" && r.Method == "GET":
		middleware.OptionalAuth(handlers.GetProperties)(w, r)
	case matchPath(path, "/api/properties/") && r.Method == "GET":
		middleware.OptionalAuth(handlers.GetPropertyById)(w, r)
	case matchPath(path, "/api/properties/") && r.Method == "PUT":
		middleware.AdminMiddleware(handlers.UpdateProperty)(w, r)
	case matchPath(path, "/api/properties/") && r.Method == "DELETE":
		middleware.AdminMiddleware(handlers.DeleteProperty)(w, r)
	case path == "/api/owners" && r.Method == "POST":
		middleware.AdminMiddleware(handlers.CreateOwner)(w, r)
	case path == "/api/owners" && r.Method == "GET":
		middleware.AdminMiddleware(handlers.GetOwners)(w, r)
	case matchPath(path, "/api/owners/") && r.Method == "GET":
		middleware.AdminMiddleware(handlers.GetOwnerById)(w, r)
	case matchPath(path, "/api/owners/") && r.Method == "PUT":
		middleware.AdminMiddleware(handlers.UpdateOwner)(w, r)
	case matchPath(path, "/api/owners/") && r.Method == "DELETE":
		middleware.AdminMiddleware(handlers.DeleteOwner)(w, r)
	case path == "/api/upload" && r.Method == "POST":
		middleware.AdminMiddleware(handlers.UploadImages)(w, r)
	default:
		http.NotFound(w, r)
	}
}

func matchPath(path, prefix string) bool {
	return len(path) > len(prefix) && path[:len(prefix)] == prefix
}
