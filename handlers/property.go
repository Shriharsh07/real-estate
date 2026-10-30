package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"real-estate-api/middleware"
	"regexp"
	"strconv"
	"time"

	"real-estate-api/config"
	"real-estate-api/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var validStatusByType = map[string][]string{
	"sale":       {"for-sale", "sold"},
	"rent":       {"for-rent", "rented"},
	"house":      {"for-sale", "for-rent", "sold", "rented"},
	"apartment":  {"for-sale", "for-rent", "sold", "rented"},
	"duplex":     {"for-sale", "for-rent", "sold", "rented"},
	"land":       {"for-sale", "for-rent", "sold", "rented"},
	"commercial": {"for-sale", "for-rent", "sold", "rented"},
}

func CreateProperty(w http.ResponseWriter, r *http.Request) {
	var property models.Property
	if err := json.NewDecoder(r.Body).Decode(&property); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	validStatuses, ok := validStatusByType[property.Type]
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid type")
		return
	}

	statusValid := false
	for _, status := range validStatuses {
		if property.Status == status {
			statusValid = true
			break
		}
	}

	if !statusValid {
		writeError(w, http.StatusBadRequest, "Invalid status for type")
		return
	}

	if err := validateProperty(property); err != "" {
		writeError(w, 400, err)
		return
	}
	property.CreatedAt = primitive.NewDateTimeFromTime(time.Now())
	property.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())

	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionProperties)
	result, err := collection.InsertOne(context.Background(), property)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	property.ID = result.InsertedID.(primitive.ObjectID)
	writeJSON(w, http.StatusOK, property)
}

func GetProperties(w http.ResponseWriter, r *http.Request) {
	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionProperties)

	filter := bson.M{}

	if typeParam := r.URL.Query().Get("type"); typeParam != "" {
		filter["type"] = typeParam
	}
	if statusParam := r.URL.Query().Get("status"); statusParam != "" {
		filter["status"] = statusParam
	}
	if locationParam := r.URL.Query().Get("location"); locationParam != "" {
		filter["location"] = bson.M{"$regex": regexp.QuoteMeta(locationParam), "$options": "i"}
	}
	if ownerParam := r.URL.Query().Get("owner"); ownerParam != "" {
		ownerID, _ := primitive.ObjectIDFromHex(ownerParam)
		filter["owner"] = ownerID
	}

	minPrice := r.URL.Query().Get("minPrice")
	maxPrice := r.URL.Query().Get("maxPrice")
	if minPrice != "" || maxPrice != "" {
		priceFilter := bson.M{}
		if minPrice != "" {
			v, e := strconv.ParseFloat(minPrice, 64)
			if e != nil {
				writeError(w, 400, "Invalid price")
				return
			}
			priceFilter["$gte"] = v
		}
		if maxPrice != "" {
			v, e := strconv.ParseFloat(maxPrice, 64)
			if e != nil {
				writeError(w, 400, "Invalid price")
				return
			}
			priceFilter["$lte"] = v
		}
		filter["price"] = priceFilter
	}

	if !middleware.IsAdmin(r) || r.URL.Query().Get("public") == "true" {
		filter["published"] = true
		filter["status"] = bson.M{"$in": []string{"for-sale", "for-rent"}}
		if status := r.URL.Query().Get("status"); status == "for-sale" || status == "for-rent" {
			filter["status"] = status
		}
	}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(context.Background(), filter, opts)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	properties := []models.Property{}
	if err = cursor.All(context.Background(), &properties); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	for i := range properties {
		if middleware.IsAdmin(r) && properties[i].Owner != nil {
			ownerCollection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionOwners)
			var owner models.Owner
			err := ownerCollection.FindOne(context.Background(), bson.M{"_id": *properties[i].Owner}).Decode(&owner)
			if err == nil {
				properties[i].OwnerData = &owner
			}
		}
	}

	if !middleware.IsAdmin(r) || r.URL.Query().Get("public") == "true" {
		summaries := []any{}
		for _, p := range properties {
			summaries = append(summaries, propertySummary(p))
		}
		writeJSON(w, 200, summaries)
		return
	}
	writeJSON(w, http.StatusOK, properties)
}

func GetPropertyById(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/properties/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionProperties)
	var property models.Property
	err = collection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&property)
	if err != nil {
		writeError(w, http.StatusNotFound, "Property not found")
		return
	}

	if !middleware.IsAdmin(r) {
		if !publiclyAvailable(property) {
			writeError(w, 404, "Property not found")
			return
		}
		if middleware.Claims(r) == nil {
			writeJSON(w, 200, propertySummary(property))
			return
		}
		property.Owner = nil
		property.OwnerData = nil
	}
	writeJSON(w, http.StatusOK, property)
}

func UpdateProperty(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/properties/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var propertyInput models.Property
	if err := json.NewDecoder(r.Body).Decode(&propertyInput); err != nil {
		writeError(w, 400, "Invalid property")
		return
	}
	if err := validateProperty(propertyInput); err != "" {
		writeError(w, 400, err)
		return
	}
	raw, _ := bson.Marshal(propertyInput)
	var updateData bson.M
	bson.Unmarshal(raw, &updateData)
	delete(updateData, "_id")
	delete(updateData, "createdAt")
	delete(updateData, "ownerData")
	// Explicit nulls allow clearing optional fields when editing an existing listing.
	updateData["owner"] = propertyInput.Owner
	updateData["length"] = propertyInput.Length
	updateData["width"] = propertyInput.Width
	updateData["bedrooms"] = propertyInput.Bedrooms
	updateData["bathrooms"] = propertyInput.Bathrooms
	updateData["totalSqft"] = propertyInput.TotalSqft
	updateData["vegPreference"] = propertyInput.VegPreference
	updateData["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionProperties)
	update := bson.M{"$set": updateData}
	result := collection.FindOneAndUpdate(context.Background(), bson.M{"_id": objectID}, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var property models.Property
	if err := result.Decode(&property); err != nil {
		writeError(w, http.StatusNotFound, "Property not found")
		return
	}

	writeJSON(w, http.StatusOK, property)
}

func DeleteProperty(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/properties/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionProperties)
	_, err = collection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Property deleted"})
}

func GetStats(w http.ResponseWriter, r *http.Request) {
	collection := config.MongoClient.Database(config.DatabaseName).Collection(config.CollectionProperties)

	total, _ := collection.CountDocuments(context.Background(), bson.M{})
	available, _ := collection.CountDocuments(context.Background(), bson.M{"status": bson.M{"$in": []string{"for-sale", "for-rent"}}})
	sold, _ := collection.CountDocuments(context.Background(), bson.M{"status": "sold"})
	rented, _ := collection.CountDocuments(context.Background(), bson.M{"status": "rented"})

	published, _ := collection.CountDocuments(context.Background(), bson.M{"published": true})
	enquiries, _ := config.MongoClient.Database(config.DatabaseName).Collection("enquiries").CountDocuments(context.Background(), bson.M{})
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"published": published, "draft": total - published, "enquiries": enquiries,
		"total":     total,
		"available": available,
		"sold":      sold,
		"rented":    rented,
	})
}

func propertySummary(p models.Property) map[string]any {
	images := []string{}
	if len(p.Images) > 0 {
		images = append(images, p.Images[0])
	}
	return map[string]any{"_id": p.ID, "propertyName": p.PropertyName, "type": p.Type, "status": p.Status, "price": p.Price, "location": p.Location, "images": images}
}
func validateProperty(p models.Property) string {
	if p.PropertyName == "" || p.Location == "" || p.Price < 0 {
		return "Name, location and a non-negative price are required"
	}
	valid := false
	for _, s := range validStatusByType[p.Type] {
		if s == p.Status {
			valid = true
		}
	}
	if !valid {
		return "Invalid type or status"
	}
	if len(p.Images) > 15 || len(p.Videos) > 2 {
		return "Maximum 15 images and 2 videos"
	}
	return ""
}

func publiclyAvailable(p models.Property) bool {
	return p.Published && (p.Status == "for-sale" || p.Status == "for-rent")
}
