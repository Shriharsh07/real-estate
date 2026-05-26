package main

import (
	"log"
	"os"

	"real-estate-api/config"
	"real-estate-api/handlers"
	"real-estate-api/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	config.ConnectDB()
	config.InitCloudinary()

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/login", handlers.Login)

	properties := api.Group("/properties")
	properties.Get("/stats", middleware.AuthMiddleware, handlers.GetStats)
	properties.Post("/", middleware.AuthMiddleware, handlers.CreateProperty)
	properties.Get("/", handlers.GetProperties)
	properties.Get("/:id", middleware.AuthMiddleware, handlers.GetPropertyById)
	properties.Put("/:id", middleware.AuthMiddleware, handlers.UpdateProperty)
	properties.Delete("/:id", middleware.AuthMiddleware, handlers.DeleteProperty)

	owners := api.Group("/owners")
	owners.Post("/", middleware.AuthMiddleware, handlers.CreateOwner)
	owners.Get("/", handlers.GetOwners)
	owners.Get("/:id", middleware.AuthMiddleware, handlers.GetOwnerById)
	owners.Put("/:id", middleware.AuthMiddleware, handlers.UpdateOwner)
	owners.Delete("/:id", middleware.AuthMiddleware, handlers.DeleteOwner)

	upload := api.Group("/upload")
	upload.Post("/", middleware.AuthMiddleware, handlers.UploadImages)

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("Server running on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal(err)
	}
}
