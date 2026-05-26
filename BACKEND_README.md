# Real Estate API - Go (Fiber)

Fast Go backend using Fiber framework for the Real Estate application.

## Features

- **Fiber Framework**: Express-inspired Go web framework
- **MongoDB**: NoSQL database with mongo-driver
- **JWT Authentication**: Secure token-based auth
- **Cloudinary**: Image upload and storage
- **CORS**: Cross-origin resource sharing enabled

## API Endpoints

### Auth
- `POST /api/auth/login` - Admin login

### Properties
- `GET /api/properties` - Get all properties (public)
- `GET /api/properties/stats` - Get property statistics (protected)
- `POST /api/properties` - Create property (protected)
- `GET /api/properties/:id` - Get property by ID (protected)
- `PUT /api/properties/:id` - Update property (protected)
- `DELETE /api/properties/:id` - Delete property (protected)

### Owners
- `GET /api/owners` - Get all owners (public)
- `POST /api/owners` - Create owner (protected)
- `GET /api/owners/:id` - Get owner by ID (protected)
- `PUT /api/owners/:id` - Update owner (protected)
- `DELETE /api/owners/:id` - Delete owner (protected)

### Upload
- `POST /api/upload` - Upload images (protected, max 5 images)

## Setup

1. Install dependencies:
```bash
go mod download
```

2. Set environment variables (copy `.env.example` to `.env`):
```bash
cp .env.example .env
```

3. Seed admin user:
```bash
go run cmd/seed/main.go
```

4. Run server:
```bash
go run main.go
```

Or build and run:
```bash
go build -o server
./server
```

## Deployment (Vercel)

This backend is configured for Vercel deployment. Vercel automatically detects Go projects and builds them using the `@vercel/go` runtime.

Environment variables must be set in Vercel dashboard:
- `MONGO_URI`
- `JWT_SECRET`
- `CLOUD_NAME`
- `API_KEY`
- `API_SECRET`
- `ADMIN_USERNAME` (optional, defaults to "admin")
- `ADMIN_PASSWORD` (optional, defaults to "admin123")

## Project Structure

```
server-go/
├── main.go              # Entry point
├── cmd/
│   └── seed/
│       └── main.go      # Admin seeding script
├── go.mod              # Go module file
├── vercel.json         # Vercel configuration
├── config/             # MongoDB and Cloudinary config
├── handlers/           # Route handlers
├── middleware/         # Auth middleware
└── models/             # Data models
```
