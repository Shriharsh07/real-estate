package handler

import (
	"github.com/golang-jwt/jwt/v5"
	"net/http/httptest"
	"testing"
	"time"
)

func TestAdminEndpointsRejectPublicUsers(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	for _, route := range []struct{ method, path string }{{"GET", "/api/owners"}, {"GET", "/api/properties/stats"}, {"GET", "/api/enquiries"}, {"POST", "/api/media/sign"}, {"POST", "/api/upload"}, {"POST", "/api/properties"}, {"PUT", "/api/properties/012345678901234567890123"}, {"DELETE", "/api/properties/012345678901234567890123"}} {
		for _, authenticated := range []bool{false, true} {
			r := httptest.NewRequest(route.method, route.path, nil)
			want := 401
			if authenticated {
				want = 403
				token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"role": "user", "exp": time.Now().Add(time.Hour).Unix()}).SignedString([]byte("test-secret"))
				r.Header.Set("Authorization", "Bearer "+token)
			}
			w := httptest.NewRecorder()
			serveAPI(w, r)
			if w.Code != want {
				t.Fatalf("%s %s authenticated=%v got %d want %d", route.method, route.path, authenticated, w.Code, want)
			}
		}
	}
}
