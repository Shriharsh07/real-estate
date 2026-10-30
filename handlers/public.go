package handlers

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"net/mail"
	"net/url"
	"os"
	"real-estate-api/config"
	"real-estate-api/middleware"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type userAccount struct {
	ID       primitive.ObjectID `bson:"_id,omitempty"`
	Email    string             `bson:"email"`
	Phone    string             `bson:"phoneNumber"`
	First    string             `bson:"firstName"`
	Last     string             `bson:"lastName"`
	Password string             `bson:"password"`
}

func Signup(w http.ResponseWriter, r *http.Request) {
	var b struct{ Email, PhoneNumber, FirstName, LastName, Password, ConfirmPassword string }
	r.Body = http.MaxBytesReader(w, r.Body, 16384)
	if json.NewDecoder(r.Body).Decode(&b) != nil {
		writeError(w, 400, "Invalid request")
		return
	}
	b.Email = strings.ToLower(strings.TrimSpace(b.Email))
	addr, err := mail.ParseAddress(b.Email)
	if err != nil || addr.Address != b.Email || strings.TrimSpace(b.FirstName) == "" || strings.TrimSpace(b.LastName) == "" || !regexp.MustCompile(`^\+?[0-9]{7,15}$`).MatchString(b.PhoneNumber) || len(b.Password) < 8 || len(b.Password) > 72 || b.Password != b.ConfirmPassword {
		writeError(w, 400, "Check your details. Passwords must match and contain 8–72 bytes.")
		return
	}
	c := config.MongoClient.Database(config.DatabaseName).Collection("users")
	if _, err = c.Indexes().CreateOne(r.Context(), mongo.IndexModel{Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetUnique(true)}); err != nil {
		writeError(w, 503, "Account setup unavailable")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(b.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, 500, "Account setup failed")
		return
	}
	u := userAccount{ID: primitive.NewObjectID(), Email: b.Email, Phone: b.PhoneNumber, First: strings.TrimSpace(b.FirstName), Last: strings.TrimSpace(b.LastName), Password: string(hash)}
	if _, err = c.InsertOne(r.Context(), u); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			writeError(w, 409, "An account with this email already exists")
		} else {
			writeError(w, 500, "Account setup failed")
		}
		return
	}
	userSession(w, u)
}
func UserLogin(w http.ResponseWriter, r *http.Request) {
	var b struct{ Email, Password string }
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 16384)).Decode(&b) != nil {
		writeError(w, 400, "Invalid request")
		return
	}
	var u userAccount
	err := config.MongoClient.Database(config.DatabaseName).Collection("users").FindOne(r.Context(), bson.M{"email": strings.ToLower(strings.TrimSpace(b.Email))}).Decode(&u)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(b.Password)) != nil {
		writeError(w, 401, "Invalid email or password")
		return
	}
	userSession(w, u)
}
func userSession(w http.ResponseWriter, u userAccount) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		writeError(w, 503, "Authentication unavailable")
		return
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"id": u.ID.Hex(), "role": "user", "exp": time.Now().Add(24 * time.Hour).Unix()}).SignedString([]byte(secret))
	if err != nil {
		writeError(w, 500, "Login failed")
		return
	}
	writeJSON(w, 200, map[string]any{"token": token, "user": map[string]any{"role": "user", "firstName": u.First}})
}
func CreateEnquiry(w http.ResponseWriter, r *http.Request) {
	var b struct{ PropertyID string }
	if json.NewDecoder(r.Body).Decode(&b) != nil {
		writeError(w, 400, "Invalid enquiry")
		return
	}
	id, err := primitive.ObjectIDFromHex(b.PropertyID)
	if err != nil {
		writeError(w, 400, "Invalid property")
		return
	}
	var p struct {
		Name string `bson:"propertyName"`
	}
	err = config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionProperties).FindOne(r.Context(), bson.M{"_id": id, "published": true, "status": bson.M{"$in": []string{"for-sale", "for-rent"}}}).Decode(&p)
	if err != nil {
		writeError(w, 404, "Property unavailable")
		return
	}
	number := os.Getenv("WHATSAPP_NUMBER")
	if !regexp.MustCompile(`^[1-9][0-9]{6,14}$`).MatchString(number) {
		writeError(w, 503, "WhatsApp contact is not configured yet")
		return
	}
	claimID, _ := middleware.Claims(r)["id"].(string)
	uid, parseErr := primitive.ObjectIDFromHex(claimID)
	if parseErr != nil {
		writeError(w, 401, "Invalid account")
		return
	}
	var u userAccount
	config.MongoClient.Database(config.DatabaseName).Collection("users").FindOne(r.Context(), bson.M{"_id": uid}).Decode(&u)
	base := strings.TrimRight(os.Getenv("PUBLIC_APP_URL"), "/")
	parsed, urlErr := url.Parse(base)
	if urlErr != nil || parsed.Host == "" || (parsed.Scheme != "https" && parsed.Scheme != "http") {
		writeError(w, 503, "Public app URL is not configured")
		return
	}
	_, err = config.MongoClient.Database(config.DatabaseName).Collection("enquiries").InsertOne(r.Context(), bson.M{"userId": uid, "firstName": u.First, "email": u.Email, "phoneNumber": u.Phone, "propertyId": id, "propertyName": p.Name, "createdAt": time.Now(), "status": "attempted"})
	if err != nil {
		writeError(w, 500, "Could not record enquiry")
		return
	}
	message := "Hi, I’m interested in " + p.Name + " (Reference: " + id.Hex() + "). Is it still available? Property: " + base + "/property/" + id.Hex()
	writeJSON(w, 200, map[string]string{"url": "https://wa.me/" + number + "?text=" + url.QueryEscape(message)})
}
func GetEnquiries(w http.ResponseWriter, r *http.Request) {
	c, err := config.MongoClient.Database(config.DatabaseName).Collection("enquiries").Find(r.Context(), bson.M{}, options.Find().SetSort(bson.M{"createdAt": -1}).SetLimit(500))
	if err != nil {
		writeError(w, 500, "Could not load enquiries")
		return
	}
	defer c.Close(context.Background())
	rows := []bson.M{}
	if c.All(r.Context(), &rows) != nil {
		writeError(w, 500, "Could not load enquiries")
		return
	}
	writeJSON(w, 200, rows)
}
func SignMedia(w http.ResponseWriter, r *http.Request) {
	if os.Getenv("API_SECRET") == "" {
		writeError(w, 503, "Media service unavailable")
		return
	}
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	params := "folder=properties&timestamp=" + timestamp
	hash := sha1.Sum([]byte(params + os.Getenv("API_SECRET")))
	writeJSON(w, 200, map[string]string{"signature": hex.EncodeToString(hash[:]), "timestamp": timestamp, "api_key": os.Getenv("API_KEY"), "cloud_name": os.Getenv("CLOUD_NAME"), "folder": "properties"})
}
