package handlers

import (
	"context"
	"io"
	"real-estate-api/config"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
)

func UploadImages(c *fiber.Ctx) error {
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	files := form.File["images"]
	if len(files) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No files uploaded"})
	}

	if len(files) > 5 {
		return c.Status(400).JSON(fiber.Map{"error": "Maximum 5 images allowed"})
	}

	var imageUrls []string

	for _, file := range files {
		fileContent, err := file.Open()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		defer fileContent.Close()

		bytes, err := io.ReadAll(fileContent)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		uploadParams := uploader.UploadParams{
			Folder: "properties",
		}

		uploadResult, err := config.CloudinaryClient.Upload.Upload(context.Background(), bytes, uploadParams)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		imageUrls = append(imageUrls, uploadResult.SecureURL)
	}

	return c.JSON(imageUrls)
}
