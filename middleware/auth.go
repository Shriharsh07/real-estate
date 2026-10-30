package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type HandlerFunc func(http.ResponseWriter, *http.Request)

func AuthMiddleware(next HandlerFunc) HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeError(w, http.StatusUnauthorized, "No token")
			return
		}

		if os.Getenv("JWT_SECRET") == "" {
			writeError(w, 503, "Authentication unavailable")
			return
		}
		tokenString := authHeader
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = authHeader[7:]
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())

		if err != nil || !token.Valid {
			writeError(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			writeError(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		ctx := contextWithUser(r.Context(), claims)
		next(w, r.WithContext(ctx))
	}
}

func contextWithUser(ctx context.Context, claims jwt.MapClaims) context.Context {
	return context.WithValue(ctx, "user", claims)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func Claims(r *http.Request) jwt.MapClaims {
	c, _ := r.Context().Value("user").(jwt.MapClaims)
	return c
}
func IsAdmin(r *http.Request) bool { return Claims(r)["role"] == "admin" }
func AdminMiddleware(next HandlerFunc) HandlerFunc {
	return AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if !IsAdmin(r) {
			writeError(w, 403, "Admin access required")
			return
		}
		next(w, r)
	})
}
func OptionalAuth(next HandlerFunc) HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "" {
			AuthMiddleware(next)(w, r)
			return
		}
		next(w, r)
	}
}
