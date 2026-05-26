package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Property struct {
	ID             primitive.ObjectID   `bson:"_id,omitempty" json:"_id"`
	PropertyName   string               `bson:"propertyName" json:"propertyName"`
	Description    string               `bson:"description" json:"description"`
	Location       string               `bson:"location" json:"location"`
	Pincode        string               `bson:"pincode" json:"pincode"`
	Type           string               `bson:"type" json:"type"`
	Status         string               `bson:"status" json:"status"`
	Price          float64              `bson:"price" json:"price"`
	Images         []string             `bson:"images" json:"images"`
	Length         *float64             `bson:"length,omitempty" json:"length,omitempty"`
	Width          *float64             `bson:"width,omitempty" json:"width,omitempty"`
	Bedrooms       *int                 `bson:"bedrooms,omitempty" json:"bedrooms,omitempty"`
	Bathrooms      *int                 `bson:"bathrooms,omitempty" json:"bathrooms,omitempty"`
	TotalSqft      *float64             `bson:"totalSqft,omitempty" json:"totalSqft,omitempty"`
	VegPreference  *string              `bson:"vegPreference,omitempty" json:"vegPreference,omitempty"`
	Owner          *primitive.ObjectID  `bson:"owner,omitempty" json:"owner,omitempty"`
	OwnerData      *Owner               `bson:"ownerData,omitempty" json:"ownerData,omitempty"`
	CreatedAt      primitive.DateTime   `bson:"createdAt" json:"createdAt"`
	UpdatedAt      primitive.DateTime   `bson:"updatedAt" json:"updatedAt"`
}
