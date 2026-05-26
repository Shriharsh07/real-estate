package handlers

import (
	"real-estate-api/config"
	"real-estate-api/models"

	"github.com/gofiber/fiber/v2"
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

func CreateProperty(c *fiber.Ctx) error {
	var property models.Property
	if err := c.BodyParser(&property); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	validStatuses, ok := validStatusByType[property.Type]
	if !ok {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid type"})
	}

	statusValid := false
	for _, status := range validStatuses {
		if property.Status == status {
			statusValid = true
			break
		}
	}

	if !statusValid {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid status for type"})
	}

	property.CreatedAt = primitive.NewDateTimeFromTime(c.Context().Time())
	property.UpdatedAt = primitive.NewDateTimeFromTime(c.Context().Time())

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	result, err := collection.InsertOne(c.Context(), property)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	property.ID = result.InsertedID.(primitive.ObjectID)
	return c.Status(200).JSON(property)
}

func GetProperties(c *fiber.Ctx) error {
	collection := config.MongoClient.Database("real-estate").Collection("properties")

	filter := bson.M{}
	
	if typeParam := c.Query("type"); typeParam != "" {
		filter["type"] = typeParam
	}
	if statusParam := c.Query("status"); statusParam != "" {
		filter["status"] = statusParam
	}
	if locationParam := c.Query("location"); locationParam != "" {
		filter["location"] = bson.M{"$regex": locationParam, "$options": "i"}
	}
	if ownerParam := c.Query("owner"); ownerParam != "" {
		ownerID, _ := primitive.ObjectIDFromHex(ownerParam)
		filter["owner"] = ownerID
	}

	minPrice := c.Query("minPrice")
	maxPrice := c.Query("maxPrice")
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
	cursor, err := collection.Find(c.Context(), filter, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var properties []models.Property
	if err = cursor.All(c.Context(), &properties); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	for i := range properties {
		if properties[i].Owner != nil {
			ownerCollection := config.MongoClient.Database("real-estate").Collection("owners")
			var owner models.Owner
			err := ownerCollection.FindOne(c.Context(), bson.M{"_id": *properties[i].Owner}).Decode(&owner)
			if err == nil {
				properties[i].OwnerData = &owner
			}
		}
	}

	return c.JSON(properties)
}

func GetPropertyById(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	var property models.Property
	err = collection.FindOne(c.Context(), bson.M{"_id": objectID}).Decode(&property)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Property not found"})
	}

	return c.JSON(property)
}

func UpdateProperty(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	var updateData bson.M
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if typeVal, ok := updateData["type"].(string); ok {
		if statusVal, ok := updateData["status"].(string); ok {
			validStatuses, ok := validStatusByType[typeVal]
			if !ok {
				return c.Status(400).JSON(fiber.Map{"message": "Invalid type"})
			}

			statusValid := false
			for _, status := range validStatuses {
				if statusVal == status {
					statusValid = true
					break
				}
			}

			if !statusValid {
				return c.Status(400).JSON(fiber.Map{"message": "Invalid status for type"})
			}
		}
	}

	updateData["updatedAt"] = primitive.NewDateTimeFromTime(c.Context().Time())

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	update := bson.M{"$set": updateData}
	result := collection.FindOneAndUpdate(c.Context(), bson.M{"_id": objectID}, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var property models.Property
	if err := result.Decode(&property); err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Property not found"})
	}

	return c.JSON(property)
}

func DeleteProperty(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	collection := config.MongoClient.Database("real-estate").Collection("properties")
	_, err = collection.DeleteOne(c.Context(), bson.M{"_id": objectID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Property deleted"})
}

func GetStats(c *fiber.Ctx) error {
	collection := config.MongoClient.Database("real-estate").Collection("properties")

	total, _ := collection.CountDocuments(c.Context(), bson.M{})
	available, _ := collection.CountDocuments(c.Context(), bson.M{"status": "available"})
	sold, _ := collection.CountDocuments(c.Context(), bson.M{"status": "sold"})
	rented, _ := collection.CountDocuments(c.Context(), bson.M{"status": "rented"})

	return c.JSON(fiber.Map{
		"total":     total,
		"available": available,
		"sold":      sold,
		"rented":    rented,
	})
}
