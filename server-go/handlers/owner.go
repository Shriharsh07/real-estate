package handlers

import (
	"real-estate-api/config"
	"real-estate-api/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateOwner(c *fiber.Ctx) error {
	var owner models.Owner
	if err := c.BodyParser(&owner); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	owner.CreatedAt = primitive.NewDateTimeFromTime(c.Context().Time())
	owner.UpdatedAt = primitive.NewDateTimeFromTime(c.Context().Time())

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	result, err := collection.InsertOne(c.Context(), owner)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	owner.ID = result.InsertedID.(primitive.ObjectID)
	return c.Status(200).JSON(owner)
}

func GetOwners(c *fiber.Ctx) error {
	collection := config.MongoClient.Database("real-estate").Collection("owners")
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(c.Context(), bson.M{}, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var owners []models.Owner
	if err = cursor.All(c.Context(), &owners); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(owners)
}

func GetOwnerById(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	var owner models.Owner
	err = collection.FindOne(c.Context(), bson.M{"_id": objectID}).Decode(&owner)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Owner not found"})
	}

	propertyCollection := config.MongoClient.Database("real-estate").Collection("properties")
	cursor, err := propertyCollection.Find(c.Context(), bson.M{"owner": objectID})
	if err == nil {
		var properties []models.Property
		cursor.All(c.Context(), &properties)
		propertyIDs := make([]primitive.ObjectID, len(properties))
		for i, prop := range properties {
			propertyIDs[i] = prop.ID
		}
		owner.Properties = propertyIDs
	}

	return c.JSON(owner)
}

func UpdateOwner(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	var updateData bson.M
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	updateData["updatedAt"] = primitive.NewDateTimeFromTime(c.Context().Time())

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	update := bson.M{"$set": updateData}
	result := collection.FindOneAndUpdate(c.Context(), bson.M{"_id": objectID}, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var owner models.Owner
	if err := result.Decode(&owner); err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Owner not found"})
	}

	return c.JSON(owner)
}

func DeleteOwner(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	collection := config.MongoClient.Database("real-estate").Collection("owners")
	result := collection.FindOneAndDelete(c.Context(), bson.M{"_id": objectID})
	if result.Err() != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Owner not found"})
	}

	return c.JSON(fiber.Map{"message": "Owner deleted"})
}
