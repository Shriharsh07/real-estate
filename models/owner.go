package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Owner struct {
	ID            primitive.ObjectID   `bson:"_id,omitempty" json:"_id"`
	FirstName     string               `bson:"firstName" json:"firstName"`
	LastName      string               `bson:"lastName" json:"lastName"`
	ContactNumber string               `bson:"contactNumber" json:"contactNumber"`
	Email         string               `bson:"email" json:"email"`
	Properties    []primitive.ObjectID `bson:"properties,omitempty" json:"properties,omitempty"`
	CreatedAt     primitive.DateTime   `bson:"createdAt" json:"createdAt"`
	UpdatedAt     primitive.DateTime   `bson:"updatedAt" json:"updatedAt"`
}
