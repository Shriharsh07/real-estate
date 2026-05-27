# 🏡 Real Estate Admin Dashboard

> 🤖 *Built with AI-assisted development using [Windsurf](https://windsurf.com)*

![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Built with AI](https://img.shields.io/badge/Built%20with-AI%20%28Windsurf%29-blueviolet?style=for-the-badge&logo=openai&logoColor=white)

A full-stack admin dashboard for managing real estate properties and owners — built with **Angular 21** on the frontend and **Go + MongoDB** on the backend, deployed on **Vercel**.

---

## ✨ Features

- 🔐 **Admin Authentication** — JWT-based login with bcrypt password hashing (1-day token expiry)
- 🏠 **Property Management** — Full CRUD for properties with 6 types: `house`, `apartment`, `duplex`, `land`, `commercial`, `sale/rent`
- 🔍 **Advanced Filtering** — Filter properties by type, status, location (regex), owner, and price range
- 👤 **Owner Management** — Add and manage property owners linked to their listings
- 📊 **Dashboard Stats** — Live counts of total, available, sold, and rented properties
- 🖼️ **Image Uploads** — Cloudinary integration for property photo management (up to 5 images per upload)
- 📱 **Material UI** — Angular Material components for a clean, responsive interface
- ☁️ **Vercel Deployment** — Frontend (Angular) + serverless API deployed together on Vercel

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21, Angular Material, RxJS |
| Backend | Go 1.21, net/http |
| Database | MongoDB Atlas, Go MongoDB Driver |
| Auth | golang-jwt/jwt v5, bcrypt (x/crypto) |
| File Uploads | Cloudinary Go SDK v2 |
| Deployment | Vercel (static + Go serverless) |

---

## 📁 Project Structure

```
real-estate-app/
├── src/                        # Angular frontend
│   └── app/
│       └── features/
│           ├── dashboard/      # Stats overview
│           ├── login/          # Admin login
│           ├── property-list/  # List & filter properties
│           ├── property-form/  # Create / edit property
│           ├── property-detail/
│           ├── owner-list/     # List owners
│           └── owner-form/     # Add / edit owner
├── handlers/                   # Go HTTP handler functions
├── models/                     # MongoDB document models
├── middleware/                 # JWT auth middleware
├── config/                     # MongoDB & Cloudinary config
├── cmd/
│   └── seed/
│       └── main.go             # Admin user seeding script
├── api/
│   └── index.go                # Vercel Go serverless entry
├── go.mod
└── vercel.json                 # Vercel deployment config
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |

### Properties
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/properties` | Public |
| GET | `/api/properties/stats` | Protected |
| GET | `/api/properties/:id` | Protected |
| POST | `/api/properties` | Protected |
| PUT | `/api/properties/:id` | Protected |
| DELETE | `/api/properties/:id` | Protected |

### Owners
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/owners` | Protected |
| POST | `/api/owners` | Protected |
| PUT | `/api/owners/:id` | Protected |
| DELETE | `/api/owners/:id` | Protected |

### Upload
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/upload` | Protected |

---

## 🚀 Getting Started

### Prerequisites
- Go 1.21+
- Node.js ≥ 18
- MongoDB Atlas URI
- Cloudinary account

### 1. Clone & install

```bash
git clone https://github.com/Shriharsh07/real-estate-app.git
cd real-estate-app

# Install frontend dependencies
npm install

# Install Go backend dependencies
go mod download
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Seed the admin user

```bash
go run cmd/seed/main.go
```

### 4. Run locally

```bash
# Terminal 1 — Frontend
npm start
```

Frontend runs at `http://localhost:4200`. API routes are proxied to the Go serverless function on Vercel in production.

---

## 📦 Deployment

Deployed on **Vercel** — the Angular build is served as static files and the Go backend runs as a serverless function via `api/index.go` using the `@vercel/go` runtime.

```bash
vercel --prod
```

---

## 📄 License

MIT