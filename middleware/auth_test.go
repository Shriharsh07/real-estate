package middleware

import (
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRoleBoundaries(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	for _, tc := range []struct {
		role string
		want int
	}{{"user", 403}, {"admin", 200}, {"", 403}} {
		token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"id": "abc", "role": tc.role, "exp": time.Now().Add(time.Hour).Unix()}).SignedString([]byte("test-secret"))
		r := httptest.NewRequest("GET", "/", nil)
		r.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		AdminMiddleware(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200) })(w, r)
		if w.Code != tc.want {
			t.Fatalf("role %q: got %d want %d", tc.role, w.Code, tc.want)
		}
	}
}
func TestOptionalAuthRejectsExpiredToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"exp": time.Now().Add(-time.Hour).Unix()}).SignedString([]byte("test-secret"))
	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	OptionalAuth(func(w http.ResponseWriter, r *http.Request) { t.Fatal("expired token accepted") })(w, r)
	if w.Code != 401 {
		t.Fatalf("got %d", w.Code)
	}
}
