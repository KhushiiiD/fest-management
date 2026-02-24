# Application Flow & File-Function Reference

## Overall Architecture

```
Browser (React SPA on :3000)
  ↕ Axios HTTP + Socket.IO WebSocket
Vite Dev Proxy (/api → :5000)
  ↕
Express.js + Socket.IO Server (:5000)
  ↕ Mongoose ODM
MongoDB (fest_management database)
```

---

## Authentication Flow

1. **Participant registers** → `POST /api/auth/register` → validates IIIT email → creates User with role=participant → returns JWT
2. **Login** → `POST /api/auth/login` → bcrypt compare → returns JWT + user object
3. **JWT stored** in localStorage → attached to all requests via Axios interceptor
4. **ProtectedRoute** component checks JWT + role on each page navigation
5. **First login** → if `onboardingCompleted === false`, redirect to `/participant/onboarding`

---

## User Flows

### Participant Flow
```
Register → Login → Onboarding (interests + follow clubs)
  → Dashboard (stats, trending, recommended, upcoming)
  → Browse Events (search, filter, trending section)
  → Event Details (register, fill custom form, buy merch)
  → My Registrations (view QR, upload payment, cancel)
  → My Teams (create team, join via invite code, accept invites)
  → Clubs (browse, follow/unfollow organizers)
  → Forum (real-time event discussion via Socket.IO)
  → Profile (edit info, change password, manage interests)
```

### Organizer Flow
```
Admin creates account → Organizer logs in
  → Dashboard (stats, events overview)
  → Create Event (form builder, merch items, hackathon settings)
  → Manage Events (publish, change status, export CSV)
  → Event Registrations (view participants, approve/reject payments)
  → Attendance Scanner (QR scan, manual entry, dashboard)
  → Pending Payments (review all pending payment proofs)
  → Profile (edit org details, change password)
  → Password Reset Request (submit to admin)
```

### Admin Flow
```
Pre-seeded login
  → Dashboard (system stats)
  → Manage Organizers (create, deactivate, reactivate, delete)
  → Password Reset Requests (approve/reject)
```

---

## Backend File-Function Reference

### Models (`backend/models/`)

| File | Schema | Key Fields |
|---|---|---|
| `User.js` | User | firstName, lastName, email, password, role (participant/organizer/admin), participantType (iiit/non-iiit), collegeName, interests[], followedClubs[], onboardingCompleted, organizerName, category, description, contactEmail, discordWebhook, isActive |
| `Event.js` | Event | eventName, eventDescription, eventType (normal/merchandise/hackathon), eligibility, eventStartDate/eventEndDate, registrationStartDate/registrationEndDate, registrationLimit/registrationFee, organizer (ref), eventTags[], status (draft/published/ongoing/completed/closed), customFormFields[], formLocked, merchandiseDetails[], hackathonDetails, trendingScore |
| `Registration.js` | Registration | ticketId (uuid), participant/event (refs), status, paymentStatus/paymentAmount/paymentProof/paymentVerificationStatus, formResponses (Map), merchandiseDetails, qrCode, attendanceMarked/attendanceTime/attendanceMethod, team (ref) |
| `Team.js` | Team | teamName, inviteCode, event/teamLeader (refs), maxTeamSize, members[{user, status, joinedAt}] |
| `ForumMessage.js` | ForumMessage | event/author (refs), content, messageType, parentMessage, isPinned, isDeleted, reactions[{emoji, user}] |
| `TeamChat.js` | TeamChat | team/sender (refs), content, messageType, attachment, readBy[] |
| `PasswordResetRequest.js` | PasswordResetRequest | organizer (ref), reason, status, processedBy, adminComment, newPassword |

### Controllers (`backend/controllers/`)

#### `authController.js`
| Function | Route | Description |
|---|---|---|
| `registerParticipant` | POST /api/auth/register | Validate IIIT email, hash password, create participant user, return JWT |
| `login` | POST /api/auth/login | Email/password auth, return JWT + user |
| `getProfile` | GET /api/auth/profile | Return authenticated user's profile |
| `changePassword` | PUT /api/auth/change-password | Verify current password, update to new |
| `logout` | POST /api/auth/logout | Simple acknowledgment (JWT is stateless) |

#### `adminController.js`
| Function | Route | Description |
|---|---|---|
| `getDashboard` | GET /api/admin/dashboard | System stats: user/event/registration counts, recent events, pending resets |
| `createOrganizer` | POST /api/admin/organizers | Create organizer user with auto-generated password, email credentials |
| `getAllOrganizers` | GET /api/admin/organizers | List all organizer accounts |
| `deactivateOrganizer` | POST /api/admin/organizers/:id/deactivate | Set isActive=false |
| `reactivateOrganizer` | POST /api/admin/organizers/:id/reactivate | Set isActive=true |
| `deleteOrganizer` | DELETE /api/admin/organizers/:id | Remove organizer + their events + registrations |
| `getPasswordResetRequests` | GET /api/admin/password-reset-requests | List all password reset requests |
| `approvePasswordReset` | POST /api/admin/password-reset-requests/:id/approve | Generate new password, update user, email it |
| `rejectPasswordReset` | POST /api/admin/password-reset-requests/:id/reject | Reject with optional comment |

#### `eventController.js`
| Function | Route | Description |
|---|---|---|
| `browseEvents` | GET /api/events/browse | Search, filter by type/eligibility, sort by trending/date/interest-match. Params: search, eventType, eligibility, sortBy, page, limit |
| `getEventDetails` | GET /api/events/:eventId | Full event details + organizer info + registration count + user's registration status |
| `exportToCalendar` | GET /api/events/:eventId/export-calendar | Generate .ics file or Google Calendar / Outlook URL |

#### `registrationController.js`
| Function | Route | Description |
|---|---|---|
| `registerForEvent` | POST /api/registrations/event/:eventId | Check eligibility, fill form responses, generate QR + ticketId, create registration |
| `purchaseMerchandise` | POST /api/registrations/merchandise/:eventId | Merchandise purchase with items/quantities/sizes |
| `uploadPaymentProof` | POST /api/registrations/:id/payment-proof | Multer upload (5MB, jpeg/jpg/png/pdf), set paymentVerificationStatus=pending |
| `getMyRegistrations` | GET /api/registrations/my | All registrations for current user, populated with event details |
| `getRegistrationDetails` | GET /api/registrations/:id | Single registration detail |
| `cancelRegistration` | DELETE /api/registrations/:id | Cancel if status allows |

#### `participantController.js`
| Function | Route | Description |
|---|---|---|
| `getDashboard` | GET /api/participants/dashboard | Stats, trending events, interest-based recommendations, upcoming registrations |
| `getProfile` | GET /api/participants/profile | Current participant profile |
| `updateProfile` | PUT /api/participants/profile | Update firstName, lastName, contactNumber, collegeName, interests |
| `completeOnboarding` | POST /api/participants/onboarding | Save interests + followedClubs, set onboardingCompleted=true |
| `followClub` | POST /api/participants/follow/:clubId | Add organizer to followedClubs |
| `unfollowClub` | POST /api/participants/unfollow/:clubId | Remove organizer from followedClubs |
| `getAllClubs` | GET /api/participants/clubs | List all active organizers (searchable) |
| `getClubDetails` | GET /api/participants/clubs/:clubId | Organizer profile + their published events |

#### `organizerController.js`
| Function | Route | Description |
|---|---|---|
| `getDashboard` | GET /api/organizers/dashboard | Event stats, ongoing/upcoming/draft events |
| `createEvent` | POST /api/organizers/events | Create event with all fields + custom form fields + merchandise + hackathon settings |
| `updateEvent` | PUT /api/organizers/events/:eventId | Update event (restrictions: can't edit published customFormFields if formLocked) |
| `publishEvent` | POST /api/organizers/events/:eventId/publish | Change draft → published, lock form fields, send Discord webhook |
| `updateEventStatus` | POST /api/organizers/events/:eventId/status | Transition: published→ongoing, ongoing→completed/closed |
| `getMyEvents` | GET /api/organizers/events | All events for current organizer with registration counts |
| `getEventWithParticipants` | GET /api/organizers/events/:eventId | Event + all registrations with participant details |
| `approvePayment` | POST /api/organizers/payments/:id/approve | Set paymentVerificationStatus=approved, paymentStatus=paid |
| `rejectPayment` | POST /api/organizers/payments/:id/reject | Set paymentVerificationStatus=rejected |
| `getPendingPayments` | GET /api/organizers/pending-payments | All registrations with pending payment verification across organizer's events |
| `getProfile` | GET /api/organizers/profile | Current organizer profile |
| `updateProfile` | PUT /api/organizers/profile | Update organizerName, description, contactEmail, contactNumber, category, discordWebhook |
| `requestPasswordReset` | POST /api/organizers/password-reset-request | Create PasswordResetRequest for admin to review |
| `exportParticipantsCSV` | GET /api/organizers/events/:eventId/export-csv | Download CSV of all registrations for an event |

#### `teamController.js`
| Function | Route | Description |
|---|---|---|
| `createTeam` | POST /api/teams | Create team for hackathon event, creator becomes leader |
| `inviteMember` | POST /api/teams/:id/invite | Invite user by email, adds as pending member |
| `joinByInviteCode` | POST /api/teams/join | Join team using 8-char invite code |
| `respondToInvite` | POST /api/teams/:id/respond | Accept or reject pending invite |
| `registerTeam` | POST /api/teams/:id/register | Register entire team for the event (creates registrations for all accepted members) |
| `getTeamDetails` | GET /api/teams/:id | Team details with members |
| `getMyTeams` | GET /api/teams/my | All teams where user is a member |
| `leaveTeam` | POST /api/teams/:id/leave | Leave team (non-leader) |
| `removeMember` | DELETE /api/teams/:id/members/:userId | Leader removes a member |

#### `forumController.js`
| Function | Route | Description |
|---|---|---|
| `getMessages` | GET /api/forum/:eventId/messages | Paginated messages for event, populated with author |
| `postMessage` | POST /api/forum/:eventId/messages | Create message, emit via Socket.IO to `forum-{eventId}` room |
| `pinMessage` | POST /api/forum/messages/:id/pin | Toggle pin (organizer/admin only), emit update |
| `deleteMessage` | DELETE /api/forum/messages/:id | Soft delete (author/organizer/admin), emit update |
| `addReaction` | POST /api/forum/messages/:id/react | Toggle emoji reaction, emit update |

#### `attendanceController.js`
| Function | Route | Description |
|---|---|---|
| `scanQRCode` | POST /api/attendance/scan | Parse QR data, find registration, mark attendance |
| `manualAttendance` | POST /api/attendance/manual | Find registration by email + eventId, mark attendance |
| `getAttendanceDashboard` | GET /api/attendance/event/:eventId | Stats + attendee list for event |
| `exportAttendanceCSV` | GET /api/attendance/event/:eventId/export | Download attendance CSV |

### Middleware (`backend/middleware/`)

| File | Function | Description |
|---|---|---|
| `auth.js` | `auth` | Verify JWT from Authorization header, attach user to req |
| `auth.js` | `authorize(...roles)` | Check req.user.role against allowed roles |
| `auth.js` | `optionalAuth` | Like auth but doesn't fail if no token |
| `validation.js` | `validateIIITEmail` | Check email ends with iiit.ac.in / students.iiit.ac.in / research.iiit.ac.in |
| `validation.js` | `validateParticipantRegistration` | Validate firstName, lastName, email, password, participantType fields |
| `validation.js` | `validateEventCreation` | Validate eventName, eventDescription, eventType |

### Utilities (`backend/utils/`)

| File | Exports | Description |
|---|---|---|
| `jwt.js` | `generateToken(userId)` | Create JWT with 30-day expiry |
| `email.js` | `sendEmail({to, subject, html})` | Send email via Nodemailer |
| `qrcode.js` | `generateQRCode(data)` | Generate QR code as data URL |
| `calendar.js` | `generateICS(event)`, `generateGoogleCalendarURL(event)`, `generateOutlookURL(event)` | Calendar export helpers |
| `discord.js` | `sendDiscordNotification(webhookUrl, event)` | Post to Discord webhook |

---

## Frontend File-Function Reference

### Core (`frontend/src/`)

| File | Purpose |
|---|---|
| `main.jsx` | React DOM render entry point |
| `App.jsx` | Route definitions with ProtectedRoute wrappers |
| `index.css` | Global styles (variables, components, responsive) |

### Components (`frontend/src/components/`)

| File | Component | Description |
|---|---|---|
| `Navbar.jsx` | `Navbar` | Role-based navigation bar with logout |
| `ProtectedRoute.jsx` | `ProtectedRoute` | Route guard: checks auth + role, redirects to /login or /unauthorized |

### Context (`frontend/src/contexts/`)

| File | Exports | Description |
|---|---|---|
| `AuthContext.jsx` | `AuthProvider`, `useAuth` | Auth state (user, token, login, register, logout, refreshUser) with localStorage persistence |

### Services (`frontend/src/services/`)

| File | Exports | Description |
|---|---|---|
| `api.js` | `authAPI`, `eventAPI`, `registrationAPI`, `participantAPI`, `organizerAPI`, `adminAPI`, `teamAPI`, `forumAPI`, `attendanceAPI` | Axios instance with token interceptor + all API endpoint methods |

### Pages — Auth (`frontend/src/pages/auth/`)

| File | Page | Key Functions |
|---|---|---|
| `Login.jsx` | Login | Email/password form → `authAPI.login()` → redirect by role |
| `Register.jsx` | Register | Participant registration form → `authAPI.register()` → redirect to onboarding |

### Pages — Participant (`frontend/src/pages/participant/`)

| File | Page | Key Functions |
|---|---|---|
| `Onboarding.jsx` | Onboarding | Interest chip selection + club following → `participantAPI.completeOnboarding()` |
| `Dashboard.jsx` | Dashboard | Stats, trending events, recommended events, upcoming registrations |
| `BrowseEvents.jsx` | Browse Events | Search bar + type/eligibility filters + event cards grid → `eventAPI.browse()` |
| `EventDetails.jsx` | Event Details | Full event info, custom form filling, merchandise selection, registration, QR display, calendar export links |
| `MyRegistrations.jsx` | My Registrations | Registration cards with payment proof upload, QR codes, cancel |
| `MyTeams.jsx` | My Teams | Active teams, pending invites, join-by-code form |
| `Profile.jsx` | Profile | Edit profile fields + change password + interest management |
| `Clubs.jsx` | Clubs | Browse/search clubs grid, follow/unfollow buttons |
| `Forum.jsx` | Forum | Real-time Socket.IO chat, send messages, reactions, pin/delete (organizer), auto-scroll |

### Pages — Organizer (`frontend/src/pages/organizer/`)

| File | Page | Key Functions |
|---|---|---|
| `Dashboard.jsx` | Dashboard | Stats cards, ongoing/upcoming/draft event lists, quick action links |
| `CreateEvent.jsx` | Create Event | Full event creation form: basic info, dates, custom form field builder, merchandise items, hackathon settings |
| `ManageEvents.jsx` | Manage Events | Events table with status, publish/start/complete actions, CSV export |
| `EventRegistrations.jsx` | Event Registrations | Participant table for specific event with payment approve/reject |
| `AttendanceScanner.jsx` | Attendance Scanner | Three tabs: QR scan input, manual email entry, attendance dashboard with stats |
| `PendingPayments.jsx` | Pending Payments | Cards for all pending payment proofs with approve/reject |
| `Profile.jsx` | Profile | Edit organizer details (name, category, description, contact, Discord webhook) + change password |
| `PasswordResetRequest.jsx` | Password Reset | Submit reset request form with reason text |

### Pages — Admin (`frontend/src/pages/admin/`)

| File | Page | Key Functions |
|---|---|---|
| `Dashboard.jsx` | Dashboard | System-wide stats cards + recent events table |
| `ManageOrganizers.jsx` | Manage Organizers | Create organizer form + organizers table with deactivate/reactivate/delete |
| `PasswordResetRequests.jsx` | Password Resets | Request cards with approve (generates new password) / reject actions |

### Pages — Other (`frontend/src/pages/`)

| File | Page |
|---|---|
| `NotFound.jsx` | 404 page |
| `Unauthorized.jsx` | 403 page |

---

## Socket.IO Events

| Event | Direction | Room | Description |
|---|---|---|---|
| `join-forum` | Client → Server | — | Client joins `forum-{eventId}` room |
| `join-team-chat` | Client → Server | — | Client joins `team-{teamId}` room |
| `new-message` | Server → Client | `forum-{eventId}` | New forum message posted |
| `message-pinned` | Server → Client | `forum-{eventId}` | Message pin toggled |
| `message-deleted` | Server → Client | `forum-{eventId}` | Message soft-deleted |
| `message-reaction` | Server → Client | `forum-{eventId}` | Reaction added/removed |

---

## Database Collections

| Collection | Model | Indexes |
|---|---|---|
| users | User | email (unique) |
| events | Event | organizer, status, eventTags, trendingScore |
| registrations | Registration | {participant, event} (compound unique), ticketId (unique) |
| teams | Team | inviteCode (unique), event |
| forummessages | ForumMessage | event, author |
| teamchats | TeamChat | team |
| passwordresetrequests | PasswordResetRequest | organizer, status |
