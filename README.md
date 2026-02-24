# College Fest Management System

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application for managing college fest events with role-based access control, real-time features, and comprehensive event management capabilities.

## Features

### Three User Roles

**Participant (Student)**
- Self-registration with IIIT email validation (iiit.ac.in / students.iiit.ac.in / research.iiit.ac.in)
- Onboarding flow: select interests + follow clubs on first login
- Browse and search events with filtering (by type, eligibility, trending)
- Register for events with custom form responses
- Purchase merchandise with quantity/size selection
- Upload payment proofs (image/PDF, max 5MB)
- View QR code tickets after registration
- Join/create teams for hackathons
- Real-time forum discussions per event (Socket.IO)
- Follow/unfollow clubs (organizers)
- Export events to Google Calendar / Outlook / .ics
- Interest-based event recommendations on dashboard
- Cancel registrations

**Organizer (Club/Organization)**
- Account created only by admin (auto-generated password emailed)
- Create and manage events with form builder (custom registration fields)
- Three event types: normal, merchandise, hackathon
- Event lifecycle: draft → published → ongoing → completed/closed
- Form locking (prevent edits after publishing)
- View registered participants with payment/attendance status
- Approve/reject payment proofs
- QR code attendance scanning + manual attendance by email
- Export participants and attendance data as CSV
- Discord webhook notifications when events are published
- Request password reset from admin
- Profile management (organization name, description, category, contact)

**Admin**
- Pre-seeded account (configurable via .env)
- Dashboard with system-wide statistics
- Create organizer accounts (auto-generates password + sends email)
- Deactivate, reactivate, or delete organizers
- Approve/reject organizer password reset requests

### Technical Features
- JWT authentication with 30-day token expiry
- Socket.IO for real-time forum and team chat
- Multer file uploads for payment proofs
- QR code generation for event tickets
- Calendar export (.ics, Google Calendar, Outlook links)
- Discord webhook integration for event notifications
- Nodemailer for transactional emails
- Trending score algorithm for events
- CSV export for participant/attendance data
- Responsive design

---

## How to Run

### Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** running locally on port 27017 (or provide a remote URI)

### 1. Clone and Setup

```bash
# Navigate to project root
cd ass1
```

### 2. Configure Environment

```bash
# Copy the example .env
cp backend/.env.example backend/.env

# Edit backend/.env with your settings:
# - MONGODB_URI (default: mongodb://localhost:27017/fest_management)
# - JWT_SECRET (change for production)
# - ADMIN_EMAIL and ADMIN_PASSWORD (auto-created on first run)
# - EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD (for sending emails)
# - FRONTEND_URL (default: http://localhost:3000)
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start the Application

Open two terminals:

**Terminal 1 — Backend (port 5000):**
```bash
cd backend
npm run dev     # uses nodemon for auto-reload
# or
npm start       # production
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd frontend
npm run dev     # Vite dev server with hot reload
```

### 5. Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Admin login:** Use credentials from `backend/.env` (default: admin@fest.com / AdminPassword123)

### First Steps
1. Log in as admin
2. Create an organizer account (admin → Manage Organizers → Create Organizer)
3. Log in as the organizer using the generated credentials
4. Create an event (organizer → Create Event), then publish it
5. Register a participant account (any @iiit.ac.in email)
6. Complete onboarding, browse events, register, etc.

---

## Project Structure

```
ass1/
├── backend/
│   ├── server.js                 # Express + Socket.IO entry point
│   ├── config/database.js        # MongoDB connection
│   ├── controllers/              # Route handlers (business logic)
│   ├── middleware/                # Auth + validation middleware
│   ├── models/                   # Mongoose schemas
│   ├── routes/                   # Express route definitions
│   ├── scripts/initAdmin.js      # Admin account seeder
│   ├── uploads/payment-proofs/   # Uploaded payment proof files
│   └── utils/                    # Helper modules
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Route definitions
│   │   ├── main.jsx              # React entry point
│   │   ├── index.css             # Global styles
│   │   ├── components/           # Navbar, ProtectedRoute
│   │   ├── contexts/AuthContext.jsx  # Auth state management
│   │   ├── pages/                # All page components by role
│   │   └── services/api.js       # Axios API client
│   └── vite.config.js            # Vite config with API proxy
├── README.md                     # This file
├── flow.md                       # Detailed flow + file-function mapping
└── req.txt                       # Original requirements
```

---

## API Endpoints

| Route Prefix | Description | Auth Required |
|---|---|---|
| `/api/auth` | Register, login, profile, change password | No (register/login), Yes (profile/password) |
| `/api/events` | Browse events, event details, calendar export | Optional (browse), Yes (export) |
| `/api/registrations` | Register for events, upload payment, cancel | Yes (participant) |
| `/api/participants` | Dashboard, profile, onboarding, clubs | Yes (participant) |
| `/api/organizers` | Events CRUD, payments, profile, CSV export | Yes (organizer) |
| `/api/admin` | Dashboard, manage organizers, password resets | Yes (admin) |
| `/api/teams` | Create, join, invite, register teams | Yes (participant) |
| `/api/forum` | Event discussion messages, reactions, pins | Yes |
| `/api/attendance` | QR scan, manual attendance, dashboard | Yes (organizer) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO |
| File Upload | Multer |
| QR Codes | qrcode (server) + qrcode.react (client) |
| Email | Nodemailer |
| Styling | Custom CSS (no framework) |
