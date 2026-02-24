# College Fest Management System

A full-stack web application for managing college fest events, built with the MERN stack. Supports three user roles (Admin, Organizer, Participant) with real-time features, QR-based attendance, team management, and merchandise ordering.

---

## Libraries, Frameworks, and Modules

### Backend (`backend/`)

| Package | Version | Purpose & Justification |
|---|---|---|
| **express** | ^4.18.2 | Core HTTP server framework. Chosen for its minimal, unopinionated design and rich middleware ecosystem. |
| **mongoose** | ^8.0.0 | MongoDB ODM. Provides schema validation, middleware hooks, and query building — reduces boilerplate vs the raw MongoDB driver. |
| **bcryptjs** | ^2.4.3 | Password hashing. Pure-JS bcrypt implementation; no native compilation needed, making it portable across environments. |
| **jsonwebtoken** | ^9.0.2 | JWT generation and verification for stateless auth. 30-day expiry tokens stored client-side; no server-side session storage required. |
| **socket.io** | ^4.6.0 | WebSocket abstraction for real-time forum messaging, reactions, and pinning. Falls back to HTTP long-polling when WebSocket is unavailable (important for proxied environments). |
| **multer** | ^1.4.5-lts.1 | Multipart form data parsing for file uploads (payment proofs). Configured with file type filtering (jpeg/png/pdf) and a 5MB size limit. |
| **qrcode** | ^1.5.3 | Server-side QR code generation. Each registration gets a QR encoding its ticket ID, generated once and stored as a data URL in MongoDB. |
| **nodemailer** | ^6.9.7 | Transactional email (organizer credentials, registration confirmations, password resets, team invites). Silently skipped when SMTP is not configured. |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing middleware. Supports comma-separated `FRONTEND_URL` env var and wildcard mode for development. |
| **dotenv** | ^16.3.1 | Loads environment variables from `.env`. Keeps secrets out of source code. |
| **validator** | ^13.11.0 | Email and string validation utilities; used for IIIT domain checking. |
| **express-validator** | ^7.0.1 | Declarative request body validation middleware. |
| **uuid** | ^9.0.1 | Generates unique ticket IDs for registrations (e.g., `TICK-a3f8b2c1`). |
| **nodemon** | ^3.0.1 (dev) | Auto-restarts the backend server on file changes during development. |

### Frontend (`frontend/`)

| Package | Version | Purpose & Justification |
|---|---|---|
| **react** | ^18.2.0 | UI library. Component-based architecture makes it natural to build role-based dashboards with shared layout components. |
| **react-dom** | ^18.2.0 | React renderer for the browser DOM. |
| **react-router-dom** | ^6.20.0 | Client-side routing. Used for nested protected routes by role (`/participant/*`, `/organizer/*`, `/admin/*`). A `ProtectedRoute` wrapper redirects unauthenticated or wrong-role users. |
| **axios** | ^1.6.2 | HTTP client. Request interceptors automatically attach the JWT `Authorization` header; response interceptors globally handle 401 by clearing the token and redirecting to login. |
| **socket.io-client** | ^4.6.0 | Connects to the backend Socket.IO server for the real-time forum; joins and leaves event-specific rooms on mount/unmount. |
| **qrcode.react** | ^3.1.0 | React component that renders a QR code SVG from a string. Used in My Registrations to display the participant's ticket QR. |
| **date-fns** | ^3.0.0 | Date formatting utilities for displaying event dates in human-readable form. |
| **vite** | ^5.0.8 (dev) | Frontend build tool. Significantly faster HMR and build times than Create React App. Also provides an API proxy for local development. |
| **@vitejs/plugin-react** | ^4.2.1 (dev) | Vite plugin enabling JSX transform and React Fast Refresh. |

> **No external UI component library was used.** All styling is hand-written CSS in `frontend/src/index.css` using CSS custom properties for theming.

---

## Advanced Features Implemented

### Tier A — Core Features

**Role-based access control with JWT**
All API routes are protected by an `auth` middleware that verifies the JWT and an `authorize` middleware that checks the user role. Three fully separated dashboards (admin, organizer, participant) with route guards on both frontend (`ProtectedRoute`) and backend (`authorize('role')`).

**IIIT email validation**
Participant registration validates that the email domain is one of `iiit.ac.in`, `students.iiit.ac.in`, or `research.iiit.ac.in`. Non-IIIT emails are rejected at the API level with a descriptive error.

**Event lifecycle management**
Events follow a strict state machine: `draft → published → ongoing → completed/closed`. Organizers cannot edit event details after publishing (form fields are locked in the UI and updates are blocked on the backend). Status transitions are validated server-side.

**Custom registration form builder**
Organizers define per-event custom fields (text, number, select, checkbox) when creating an event. Fields are stored with the event schema and rendered dynamically on the participant's registration page. Responses are saved per-registration.

**Onboarding flow**
First-time participants are redirected to a two-step onboarding: (1) select interests from a chip grid, (2) follow clubs/organizers. This data drives interest-based recommendations on the dashboard.

---

### Tier B — Intermediate Features

**Real-time forum with Socket.IO**
Each published event has a dedicated Socket.IO room (`forum-<eventId>`). New messages, emoji reactions (add/remove), pin/unpin, and soft-deletes are all broadcast in real-time to every connected client in the room. Organizers can pin messages; message authors and organizers can delete them.

**QR code ticket generation**
On successful registration, the backend generates a QR code (via the `qrcode` library) encoding the unique ticket ID. The resulting data URL is stored in the registration document. Organizers scan QR codes at the Attendance Scanner to mark attendance; duplicate scans are rejected with an error.

**Payment proof upload and verification**
For paid events, participants upload payment proof (JPEG/PNG/PDF, max 5MB) after registering. Multer validates file type and size. Organizers review proofs from the Pending Payments page and approve or reject with a reason. The uploaded file is served as a static asset.

**Team management for hackathon events**
Participants can create teams for hackathon events, receive a unique 8-character invite code, invite members by email, or join any team via its invite code. Team leaders register the whole team at once; all accepted members receive individual registration records. Min/max team size constraints are set by the organizer when creating the event.

**Trending score algorithm**
Events are ranked by a composite score: `registrations × 2 + views × 0.5 + recency factor`. The participant dashboard shows top-trending events; the browse page also supports trending-based sorting.

**CSV export**
Organizers can download participant lists and attendance records as CSV files directly from the dashboard. The backend builds the CSV in-memory and streams it with `Content-Disposition: attachment`.

---

### Tier C — Advanced Features

**Calendar export (Google Calendar, Outlook, .ics)**
Each event details page offers three calendar export options:
- **Google Calendar** — constructs a `calendar.google.com/calendar/render?action=TEMPLATE&...` URL with event name, description, start/end times, and opens in a new tab.
- **Outlook** — constructs an `outlook.live.com/calendar/0/deeplink/compose?...` URL similarly.
- **.ics download** — the endpoint `GET /api/events/:id/export-calendar?format=ics` generates a standards-compliant iCalendar file and responds with `Content-Type: text/calendar`, which any calendar application can import.

**Discord webhook integration**
Organizers can configure a Discord webhook URL on their profile. When an event is published, the backend sends a rich notification to the configured Discord channel including the event name, type, dates, fee, and a registration link — implemented with a plain HTTPS POST to the webhook URL (no Discord SDK required).

**Auto-generated organizer login email**
When the admin creates an organizer account, the login email is automatically derived from the club/organization name (e.g., "Tech Club" → `tech.club@organizer.fest.com`). This removes ambiguity and prevents the admin from needing to choose a separate login email.

**Interest-based event recommendations**
The participant dashboard fetches events whose `tags` array overlaps with the participant's stored `interests`. The recommendation query is computed entirely on the backend with a MongoDB `$in` filter, sorted by trending score.

**Transactional email (silently optional)**
Nodemailer sends emails for: new organizer credentials, registration confirmation with QR code, password reset approval with new credentials, and team invitations. An `isEmailConfigured()` guard checks for real SMTP credentials before attempting to connect — the application runs fully without email configured (no crash, no error).

---

## Design Choices and Technical Decisions

**No UI framework** — All CSS is hand-written. This keeps the bundle small and avoids the overhead of learning a component library's API. CSS custom properties (`--primary`, `--danger`, etc.) provide consistent theming across all pages.

**JWT over sessions** — Stateless JWTs avoid requiring a session store. 30-day expiry means participants stay logged in for the duration of the fest without re-authentication.

**MongoDB over SQL** — The schema differs significantly across event types (hackathon has team size settings, merchandise has an item array, normal events have custom form fields). MongoDB's flexible document model handles polymorphic schemas without complex joins.

**Socket.IO over raw WebSockets** — Automatic reconnection, built-in room management (`socket.join('forum-<id>')`), and HTTP long-poll fallback make Socket.IO more robust in environments where WebSocket proxying isn't guaranteed.

**`vercel.json` rewrite rule** — A single rewrite `{ "source": "/(.*)", "destination": "/index.html" }` ensures all URL paths are served by `index.html`, allowing React Router to handle client-side navigation. Without this, refreshing or directly visiting any path returns a 404 from Vercel.

**Vite proxy for local development** — `vite.config.js` proxies `/api` requests to `http://localhost:5000` during development, removing the need to configure CORS for local dev. In production, `VITE_API_URL` overrides the base URL.

---

## Setup and Installation

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017 (or provide an Atlas URI)

### Steps

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Configure backend environment
cp .env.example .env
# Edit backend/.env — minimum required keys:
#   MONGODB_URI=mongodb://localhost:27017/fest_management
#   JWT_SECRET=change_this_to_a_long_random_string
#   ADMIN_EMAIL=admin@fest.com
#   ADMIN_PASSWORD=AdminPassword123
#   FRONTEND_URL=http://localhost:3000
#   PORT=5000
# (EMAIL_* fields are optional — the app works fully without them)

# 3. Start the backend (port 5000)
npm run dev

# 4. In a separate terminal, install frontend dependencies
cd ../frontend
npm install

# 5. Start the frontend (port 3000)
npm run dev
```

Open **http://localhost:3000** — you will be redirected to `/login`.

**Default admin:** `admin@fest.com` / `AdminPassword123` (or whatever you set in `.env`)

### Quick Start Walkthrough
1. Log in as **admin** → Manage Organizers → **+ Create Organizer** → note the generated email and password
2. Log out → log in as the **organizer** with those credentials
3. Create an event (Create tab) → fill details → **Create Event (Draft)** → then **Publish**
4. Open an **incognito window** → register a participant using an `@students.iiit.ac.in` email
5. Complete onboarding → browse events → register → view QR code ticket in My Registrations

---

## Project Structure

```
<roll_no>/
├── backend/
│   ├── server.js                     # Express app + Socket.IO setup + route mounting
│   ├── config/database.js            # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js        # Organizer management, password resets
│   │   ├── attendanceController.js   # QR scan, manual attendance, CSV export
│   │   ├── authController.js         # Register, login, profile, change password
│   │   ├── eventController.js        # Browse events, details, calendar export
│   │   ├── forumController.js        # Forum CRUD, reactions, pin, delete
│   │   ├── organizerController.js    # Event CRUD, participant list, payment approval
│   │   ├── participantController.js  # Dashboard, profile, clubs, onboarding
│   │   ├── registrationController.js # Register, merchandise, payment proof, cancel
│   │   └── teamController.js         # Team create, invite, join, register, leave
│   ├── middleware/
│   │   ├── auth.js                   # JWT verify + role authorize
│   │   └── validation.js             # express-validator rules
│   ├── models/
│   │   ├── Event.js                  # Event schema (normal/hackathon/merchandise)
│   │   ├── ForumMessage.js           # Forum message schema with reactions
│   │   ├── PasswordResetRequest.js   # Organizer password reset request
│   │   ├── Registration.js           # Registration with QR, payment, attendance
│   │   ├── Team.js                   # Team schema with members and invite code
│   │   └── User.js                   # Unified user schema for all three roles
│   ├── routes/                       # Express routers (one per controller)
│   ├── scripts/initAdmin.js          # Seeds the admin account on first startup
│   ├── uploads/payment-proofs/       # Uploaded payment proof files
│   └── utils/
│       ├── calendar.js               # .ics / Google / Outlook URL generation
│       ├── discord.js                # Discord webhook POST
│       ├── email.js                  # Nodemailer transactional emails
│       ├── jwt.js                    # Token generation helper
│       └── qrcode.js                 # QR code data URL generation
├── frontend/
│   ├── vercel.json                   # Rewrite rule for React Router on Vercel
│   ├── vite.config.js                # Vite config with /api proxy for local dev
│   └── src/
│       ├── App.jsx                   # All routes with ProtectedRoute wrappers
│       ├── index.css                 # Global styles (custom CSS, no framework)
│       ├── components/
│       │   ├── Navbar.jsx            # Role-aware navigation bar
│       │   └── ProtectedRoute.jsx    # Route guard by role
│       ├── contexts/AuthContext.jsx  # Global auth state (token, user, login/logout)
│       ├── pages/
│       │   ├── admin/               # Dashboard, ManageOrganizers, PasswordResetRequests
│       │   ├── auth/                # Login, Register
│       │   ├── organizer/           # Dashboard, CreateEvent, ManageEvents, etc.
│       │   └── participant/         # Dashboard, BrowseEvents, Forum, Teams, Clubs, etc.
│       └── services/api.js          # Axios instance + all API call functions by module
├── README.md
└── deployment.txt
```

---

## API Overview

| Route Prefix | Description | Auth Required |
|---|---|---|
| `/api/auth` | Register, login, profile, change password | No (register/login) |
| `/api/events` | Browse events, details, calendar export | Optional |
| `/api/registrations` | Register for events, upload payment, cancel | Yes (participant) |
| `/api/participants` | Dashboard, profile, onboarding, clubs | Yes (participant) |
| `/api/organizers` | Events CRUD, payments, profile, CSV export | Yes (organizer) |
| `/api/admin` | Dashboard, manage organizers, password resets | Yes (admin) |
| `/api/teams` | Create, join, invite, register teams | Yes (participant) |
| `/api/forum` | Event discussion, reactions, pins, deletes | Yes |
| `/api/attendance` | QR scan, manual attendance, dashboard, CSV | Yes (organizer) |
