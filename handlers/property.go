package handlers

import (
	"context"
	"encoding/json"
	"net/http"
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
		WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	validStatuses, ok := validStatusByType[property.Type]
	if !ok {
		WriteError(w, http.StatusBadRequest, "Invalid type")
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
		WriteError(w, http.StatusBadRequest, "Invalid status for type")
		return
	}

	property.CreatedAt = primitive.NewDateTimeFromTime(time.Now())
	property.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	result, err := collection.InsertOne(context.Background(), property)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	property.ID = result.InsertedID.(primitive.ObjectID)
	WriteJSON(w, http.StatusOK, property)
}

func GetProperties(w http.ResponseWriter, r *http.Request) {
	collection := config.MongoClient.Database("real-estate").Collection("properties")

	filter := bson.M{}

	if typeParam := r.URL.Query().Get("type"); typeParam != "" {
		filter["type"] = typeParam
	}
	if statusParam := r.URL.Query().Get("status"); statusParam != "" {
		filter["status"] = statusParam
	}
	if locationParam := r.URL.Query().Get("location"); locationParam != "" {
		filter["location"] = bson.M{"$regex": locationParam, "$options": "i"}
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
			priceFilter["$gte"] = minPrice
		}
		if maxPrice != "" {
			priceFilter["$lte"] = maxPrice
		}
		filter["price"] = priceFilter
	}

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(context.Background(), filter, opts)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var properties []models.Property
	if err = cursor.All(context.Background(), &properties); err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	for i := range properties {
		if properties[i].Owner != nil {
			ownerCollection := config.MongoClient.Database("real-estate").Collection("owners")
			var owner models.Owner
			err := ownerCollection.FindOne(context.Background(), bson.M{"_id": *properties[i].Owner}).Decode(&owner)
			if err == nil {
				properties[i].OwnerData = &owner
			}
		}
	}

	WriteJSON(w, http.StatusOK, properties)
}

func GetPropertyById(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/properties/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	var property models.Property
	err = collection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&property)
	if err != nil {
		WriteError(w, http.StatusNotFound, "Property not found")
		return
	}

	WriteJSON(w, http.StatusOK, property)
}

func UpdateProperty(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/properties/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var updateData bson.M
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if typeVal, ok := updateData["type"].(string); ok {
		if statusVal, ok := updateData["status"].(string); ok {
			validStatuses, ok := validStatusByType[typeVal]
			if !ok {
				WriteError(w, http.StatusBadRequest, "Invalid type")
				return
			}

			statusValid := false
			for _, status := range validStatuses {
				if statusVal == status {
					statusValid = true
					break
				}
			}

			if !statusValid {
				WriteError(w, http.StatusBadRequest, "Invalid status for type")
				return
			}
		}
	}

	updateData["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	update := bson.M{"$set": updateData}
	result := collection.FindOneAndUpdate(context.Background(), bson.M{"_id": objectID}, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var property models.Property
	if err := result.Decode(&property); err != nil {
		WriteError(w, http.StatusNotFound, "Property not found")
		return
	}

	WriteJSON(w, http.StatusOK, property)
}

func DeleteProperty(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/properties/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	_, err = collection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Property deleted"})
}

func GetStats(w http.ResponseWriter, r *http.Request) {
	collection := config.MongoClient.Database("real-estate").Collection("properties")

	total, _ := collection.CountDocuments(context.Background(), bson.M{})
	available, _ := collection.CountDocuments(context.Background(), bson.M{"status": "available"})
	sold, _ := collection.CountDocuments(context.Background(), bson.M{"status": "sold"})
	rented, _ := collection.CountDocuments(context.Background(), bson.M{"status": "rented"})

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"total":     total,
		"available": available,
		"sold":      sold,
		"rented":    rented,
	})
}
