# 🏡 Real Estate Admin Dashboard

> 🤖 *Built with AI-assisted development using [Windsurf](https://windsurf.com)*

![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Built with AI](https://img.shields.io/badge/Built%20with-AI%20%28Windsurf%29-blueviolet?style=for-the-badge&logo=openai&logoColor=white)

A full-stack admin dashboard for managing real estate properties and owners — built with **Angular 21** on the frontend and **Node.js + Express + MongoDB** on the backend, deployed on **Vercel**.

---

## ✨ Features

- 🔐 **Admin Authentication** — JWT-based login with bcrypt password hashing (1-day token expiry)
- 🏠 **Property Management** — Full CRUD for properties with 6 types: `house`, `apartment`, `duplex`, `land`, `commercial`, `sale/rent`
- 🔍 **Advanced Filtering** — Filter properties by type, status, location (regex), owner, and price range
- 👤 **Owner Management** — Add and manage property owners linked to their listings
- 📊 **Dashboard Stats** — Live counts of total, available, sold, and rented properties
- 🖼️ **Image Uploads** — Cloudinary integration via Multer for property photo management
- 📱 **Material UI** — Angular Material components for a clean, responsive interface
- ☁️ **Vercel Deployment** — Frontend (Angular) + serverless API deployed together on Vercel

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21, Angular Material, RxJS |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| File Uploads | Multer, Cloudinary |
| Deployment | Vercel |

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
├── server/                     # Node.js backend
│   ├── controllers/            # Route handlers
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers
│   ├── middleware/             # Auth & upload middleware
│   └── config/                 # Cloudinary config
├── api/
│   └── index.js                # Vercel serverless entry
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
- Node.js ≥ 18
- MongoDB Atlas URI
- Cloudinary account

### 1. Clone & install

```bash
git clone https://github.com/Shriharsh07/real-estate-app.git
cd real-estate-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### 2. Configure environment

Create `server/.env`:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Seed the admin user

```bash
cd server
node seedAdmin.js
```

### 4. Run locally

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
npm start
```

Frontend runs at `http://localhost:4200`, backend at `http://localhost:5000`.

---

## 📦 Deployment

Deployed on **Vercel** — the Angular build is served as static files and the Express backend runs as a serverless function via `api/index.js`.

```bash
vercel --prod
```

---

## 📄 License

MIT