package handlers

import (
	"encoding/json"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"real-estate-api/models"
	"strings"
	"testing"
)

func TestAnonymousSummaryExcludesRestrictedFields(t *testing.T) {
	p := models.Property{ID: primitive.NewObjectID(), PropertyName: "A home", Description: "PRIVATE DESCRIPTION", Images: []string{"cover.jpg", "PRIVATE.jpg"}, Videos: []string{"PRIVATE.mp4"}, OwnerData: &models.Owner{Email: "PRIVATE@example.com"}, Pincode: "123456"}
	raw, _ := json.Marshal(propertySummary(p))
	for _, field := range []string{"description", "videos", "owner", "pincode", "PRIVATE"} {
		if strings.Contains(string(raw), field) {
			t.Fatalf("summary leaked %s: %s", field, raw)
		}
	}
	if !strings.Contains(string(raw), "cover.jpg") {
		t.Fatal("cover missing")
	}
}
func TestPropertyValidation(t *testing.T) {
	p := models.Property{PropertyName: "Plot", Location: "Chennai", Type: "land", Status: "for-sale", Price: 10}
	if validateProperty(p) != "" {
		t.Fatal("valid property rejected")
	}
	p.Videos = make([]string, 3)
	if validateProperty(p) == "" {
		t.Fatal("video limit not enforced")
	}
	p.Videos = nil
	p.Images = make([]string, 16)
	if validateProperty(p) == "" {
		t.Fatal("image limit not enforced")
	}
	p.Images = nil
	p.Status = "invalid"
	if validateProperty(p) == "" {
		t.Fatal("invalid status accepted")
	}
}

func TestOnlyPublishedActivePropertiesArePublic(t *testing.T) {
	for _, tc := range []struct {
		published bool
		status    string
		want      bool
	}{{false, "for-sale", false}, {true, "for-sale", true}, {true, "for-rent", true}, {true, "sold", false}, {true, "rented", false}} {
		if publiclyAvailable(models.Property{Published: tc.published, Status: tc.status}) != tc.want {
			t.Fatalf("unexpected availability for %+v", tc)
		}
	}
}
