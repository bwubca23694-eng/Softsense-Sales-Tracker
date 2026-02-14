# SoftSense — Daily Sales Tracker

A full-stack sales tracking application with a mobile-first worker interface and a powerful admin dashboard.

---

## 🗂 Project Structure

```
softsense-app/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── models/           # Mongoose schemas
│   │   │   ├── Admin.js
│   │   │   ├── Worker.js
│   │   │   ├── Store.js
│   │   │   ├── Product.js
│   │   │   └── Submission.js
│   │   ├── routes/           # Express route handlers
│   │   │   ├── auth.js
│   │   │   ├── workers.js
│   │   │   ├── stores.js
│   │   │   ├── products.js
│   │   │   ├── submissions.js
│   │   │   ├── analytics.js
│   │   │   └── export.js
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT authentication
│   │   ├── utils/
│   │   │   ├── cloudinary.js # Cloudinary + Multer config
│   │   │   └── seedAdmin.js  # Seeds first admin on startup
│   │   └── server.js         # Express entry point
│   ├── .env.example          # Copy to .env and fill in values
│   └── package.json
│
└── frontend/                 # React app (Create React App)
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── admin/
    │   │       ├── SubmissionsTable.js  # Sortable/filterable data table
    │   │       ├── AnalyticsPanel.js    # Charts & KPI dashboard
    │   │       ├── ProductsManager.js   # Product CRUD + image upload
    │   │       ├── WorkersManager.js    # Worker CRUD
    │   │       └── StoresManager.js     # Store CRUD
    │   ├── context/
    │   │   ├── AuthContext.js           # Admin JWT state
    │   │   └── WorkerContext.js         # Worker session state
    │   ├── pages/
    │   │   ├── worker/
    │   │   │   ├── WorkerSelect.js      # Name selection (homepage)
    │   │   │   ├── StoreSelect.js       # Store selection
    │   │   │   ├── SalesForm.js         # Daily sales entry
    │   │   │   └── MySubmissions.js     # Worker's submission history
    │   │   └── admin/
    │   │       ├── AdminLogin.js        # Hidden admin login
    │   │       └── AdminDashboard.js    # Admin shell with sidebar
    │   ├── styles/
    │   │   └── global.css               # Design system + utility classes
    │   ├── utils/
    │   │   └── api.js                   # Axios instance with JWT interceptor
    │   ├── App.js                       # Router setup
    │   └── index.js
    └── package.json
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (see below)
npm run dev     # development (nodemon)
npm start       # production
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start       # Starts on http://localhost:3000
```

---

## ⚙️ Environment Variables (backend/.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/softsense
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Cloudinary (get from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin credentials (created automatically on first run)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

---

## 🧭 Application Flow

### Worker Flow (Mobile)
1. Open the app → **Select your name** from the list
2. **Choose your store** for today
3. **Fill in quantities** for each product (with images)
4. Hit **Submit** — one submission per worker/store/day enforced
5. View **My Submissions** to check history

### Admin Access (Hidden)
1. From the worker homepage, **click "SoftSense" heading 5 times** → redirected to `/admin/login`
2. Log in with admin credentials
3. Access the full dashboard:
   - **Submissions** — sortable table, filterable by worker/store/date, exportable
   - **Analytics** — daily trends, worker rankings, store performance, product distribution
   - **Products** — add/edit/delete with image uploads
   - **Workers** — manage the worker list
   - **Stores** — manage store locations

---

## 📡 API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workers` | List active workers |
| GET | `/api/stores` | List active stores |
| GET | `/api/products` | List active products |
| POST | `/api/submissions` | Create submission |
| GET | `/api/submissions/worker/:id` | Worker's submissions |
| GET | `/api/submissions/check` | Check duplicate for today |

### Admin (JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/verify` | Verify token |
| GET | `/api/submissions` | All submissions (paginated + filtered) |
| DELETE | `/api/submissions/:id` | Delete submission |
| GET/POST/PUT/DELETE | `/api/workers/...` | Manage workers |
| GET/POST/PUT/DELETE | `/api/stores/...` | Manage stores |
| GET/POST/PUT/DELETE | `/api/products/...` | Manage products |
| GET | `/api/analytics/overview` | KPI summary |
| GET | `/api/analytics/daily` | Daily trend data |
| GET | `/api/analytics/by-worker` | Per-worker totals |
| GET | `/api/analytics/by-store` | Per-store totals |
| GET | `/api/analytics/by-product` | Per-product totals |
| GET | `/api/export/excel` | Download XLSX |
| GET | `/api/export/csv` | Download CSV |

---

## 🏗 Tech Stack

- **Frontend**: React 18 (CRA), React Router v6, Recharts, Axios, react-hot-toast
- **Backend**: Node.js, Express 4, Mongoose
- **Database**: MongoDB Atlas
- **Images**: Cloudinary + multer-storage-cloudinary
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Export**: xlsx library

---

## 🚢 Deployment Notes

- Set `REACT_APP_API_URL` in frontend if deploying backend separately (e.g., `https://your-api.com/api`)
- Remove the `"proxy"` field from `frontend/package.json` in production
- Run `npm run build` in frontend for production build
- The `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars seed the admin on first server start
