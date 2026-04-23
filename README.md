# 💸 Spendly — MERN Expense Tracker

A beautiful, full-stack expense tracking application built with the MERN stack (MongoDB, Express, React, Node.js).

---

## ✨ Features

- **Authentication** — JWT-based register/login with secure password hashing
- **Dashboard** — Real-time financial overview with greeting, stat cards, charts, budget progress bar
- **Transactions** — Full CRUD, pagination, filtering by type/category/date, bulk delete
- **Analytics** — Bar charts, doughnut charts, category breakdowns, 6-month trends
- **Settings** — Profile updates, currency & budget configuration
- **14+ Categories** — Food, Transport, Shopping, Healthcare, Entertainment, and more
- **Payment Methods** — Cash, Card, UPI, Net Banking
- **Recurring Transactions** — Mark expenses as recurring
- **Budget Alerts** — Visual warning when nearing monthly budget limit
- **Dark Theme** — Stunning dark UI with glassmorphism effects

---

## 🛠 Tech Stack

| Layer    | Tech                                       |
|----------|--------------------------------------------|
| Frontend | React 18, React Router v6, Chart.js, Axios |
| Backend  | Node.js, Express.js, JWT, bcryptjs         |
| Database | MongoDB with Mongoose ODM                  |
| Styling  | Custom CSS with CSS Variables              |
| Fonts    | Syne (display) + DM Sans (body)            |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone or extract the project**

2. **Install all dependencies**
```bash
npm run install-all
```

3. **Set up environment variables**
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

4. **Run in development**
```bash
# From root - runs both backend (port 5000) and frontend (port 3000)
npm run dev

# Or separately:
npm run server   # backend only
npm run client   # frontend only
```

5. **Open your browser**
```
http://localhost:3000
```

---

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT auth middleware
│   ├── models/
│   │   ├── User.js           # User schema
│   │   └── Expense.js        # Expense schema
│   ├── routes/
│   │   ├── auth.js           # Auth routes (register, login, me)
│   │   ├── expenses.js       # Expense CRUD + stats
│   │   └── categories.js     # Category list
│   ├── server.js             # Express app entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Layout.js          # Sidebar + nav layout
│       │   └── AddExpenseModal.js # Add/Edit transaction modal
│       ├── context/
│       │   └── AuthContext.js     # Auth state management
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js       # Overview + charts
│       │   ├── Transactions.js    # Full transaction list
│       │   ├── Analytics.js       # Deep analytics
│       │   └── Settings.js        # Profile settings
│       ├── api.js                 # Axios instance + all API calls
│       ├── App.js                 # Routes
│       ├── index.js
│       └── index.css              # Global design system
│
├── package.json   # Root with concurrently scripts
└── README.md
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| POST   | /api/auth/register | Create account   |
| POST   | /api/auth/login    | Login            |
| GET    | /api/auth/me       | Get current user |
| PUT    | /api/auth/update   | Update profile   |

### Expenses
| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | /api/expenses        | List (with filters)      |
| POST   | /api/expenses        | Create transaction       |
| GET    | /api/expenses/stats  | Monthly stats + trends   |
| PUT    | /api/expenses/:id    | Update transaction       |
| DELETE | /api/expenses/:id    | Delete transaction       |
| DELETE | /api/expenses        | Bulk delete              |

### Categories
| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | /api/categories   | Get all categories   |

---

## 🎨 Design

- **Color Palette**: Deep navy backgrounds with teal accent (#00d4aa)
- **Typography**: Syne (headings) + DM Sans (body)
- **Cards**: Glassmorphism with subtle borders
- **Animations**: Smooth fade-in, hover lifts, chart transitions
- **Theme**: Dark-only, optimized for long sessions

---

## 🔧 Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:3000
```

For MongoDB Atlas:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expense-tracker
```

---

## 📸 Pages

| Page | Description |
|------|-------------|
| `/dashboard` | Overview with stats, charts, recent transactions |
| `/transactions` | Full list with filters, search, bulk actions |
| `/analytics` | Bar charts, doughnut, category rankings |
| `/settings` | Profile, currency, budget configuration |

---

## 🚢 Deployment

### Backend (Railway / Render / Heroku)
- Set environment variables
- Set `npm start` as start command

### Frontend (Vercel / Netlify)
- Set `REACT_APP_API_URL=https://your-backend-url/api`
- Build command: `npm run build`
- Publish directory: `build`

---

Built with ❤️ using the MERN stack
