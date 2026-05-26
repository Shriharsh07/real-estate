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

func CreateOwner(w http.ResponseWriter, r *http.Request) {
	var owner models.Owner
	if err := json.NewDecoder(r.Body).Decode(&owner); err != nil {
		WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	owner.CreatedAt = primitive.NewDateTimeFromTime(time.Now())
	owner.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	result, err := collection.InsertOne(context.Background(), owner)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	owner.ID = result.InsertedID.(primitive.ObjectID)
	WriteJSON(w, http.StatusOK, owner)
}

func GetOwners(w http.ResponseWriter, r *http.Request) {
	collection := config.MongoClient.Database("real-estate").Collection("owners")
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(context.Background(), bson.M{}, opts)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var owners []models.Owner
	if err = cursor.All(context.Background(), &owners); err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, owners)
}

func GetOwnerById(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/owners/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	var owner models.Owner
	err = collection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&owner)
	if err != nil {
		WriteError(w, http.StatusNotFound, "Owner not found")
		return
	}

	propertyCollection := config.MongoClient.Database("real-estate").Collection("properties")
	cursor, err := propertyCollection.Find(context.Background(), bson.M{"owner": objectID})
	if err == nil {
		var properties []models.Property
		cursor.All(context.Background(), &properties)
		propertyIDs := make([]primitive.ObjectID, len(properties))
		for i, prop := range properties {
			propertyIDs[i] = prop.ID
		}
		owner.Properties = propertyIDs
	}

	WriteJSON(w, http.StatusOK, owner)
}

func UpdateOwner(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/owners/"):]
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

	updateData["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	update := bson.M{"$set": updateData}
	result := collection.FindOneAndUpdate(context.Background(), bson.M{"_id": objectID}, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var owner models.Owner
	if err := result.Decode(&owner); err != nil {
		WriteError(w, http.StatusNotFound, "Owner not found")
		return
	}

	WriteJSON(w, http.StatusOK, owner)
}

func DeleteOwner(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/owners/"):]
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	result := collection.FindOneAndDelete(context.Background(), bson.M{"_id": objectID})
	if result.Err() != nil {
		WriteError(w, http.StatusNotFound, "Owner not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Owner deleted"})
}
