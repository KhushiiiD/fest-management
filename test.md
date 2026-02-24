# Complete Feature Testing Guide

## Before You Start

### Required: Start Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Expected output: `server running on port 5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Expected output: `Local: http://localhost:3000/`

**Terminal 3 — MongoDB (if not running as a service):**
```bash
mongod
```

### Verify Both Servers Are Up
- Frontend: http://localhost:3000 → should show login page
- Backend health: http://localhost:5000 → should return `{ "message": "fest management api is running" }`

### MongoDB Viewer (optional but helpful)
Install MongoDB Compass or use `mongosh` in a terminal:
```bash
mongosh mongodb://localhost:27017/fest_management
```
Use `db.users.find()`, `db.events.find()`, etc. to inspect data at any point.

---

## SECTION 1 — Admin Features

### 1.1 Admin Login

**Frontend (http://localhost:3000):**
1. Go to http://localhost:3000 — you're redirected to `/login`
2. Enter:
   - Email: `admin@fest.com`
   - Password: `AdminPassword123`
3. Click **Login**
4. ✅ Expected: Redirected to `/admin/dashboard`
5. ✅ Nav bar should show: Dashboard | Organizers | Resets | Logout

**Backend verify:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fest.com","password":"AdminPassword123"}'
```
✅ Expected: `{ "success": true, "token": "eyJ...", "user": { "role": "admin", ... } }`

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.users.findOne({role:'admin'})"
```

---

### 1.2 Admin Dashboard

**Frontend:**
1. Click **Dashboard** in the nav
2. ✅ Expected: Stats cards show (Total Users, Participants, Organizers, Events, Registrations, Pending Resets) — all 0 initially except "1 organizer" once you create one
3. Quick links to "Manage Organizers" and "Password Reset Requests" are visible

**Backend verify:**
```bash
# Save your admin token first from step 1.1, then:
# admin token:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTk1YmQ4ZDgyNDQzZWFiZWEyZjI5YzIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzE5MTY1NzgsImV4cCI6MTc3NDUwODU3OH0.8xXY5BTmqat6ySwUehqnOl5qtDjKqUEjQ1XFobTsHEM
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
✅ Expected: JSON with `totalUsers`, `totalOrganizers`, `totalEvents`, `totalRegistrations`, `pendingPasswordResets`, `recentEvents[]`

---

### 1.3 Create an Organizer

**Frontend:**
1. Click **Organizers** in nav → `/admin/organizers`
2. Click **+ Create Organizer**
3. Fill in:
   - Login Email: `techclub@fest.com`
   - Organization Name: `Tech Club`
   - Category: `Technical`
   - Contact Email: `techclub@fest.com`
   - Contact Number: `9876543210`
   - Description: `The official technical club of the fest`
4. Click **Create Organizer**
5. ✅ Expected: Success message appears with the generated password (e.g., `Organizer created! Password: Ab3x9Kp2`)
6. **Save this password** — you'll need it to log in as the organizer
7. The organizer should appear in the table below the form

**Backend verify:**
```bash
curl http://localhost:5000/api/admin/organizers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
✅ Expected: Array containing the new organizer with `role: "organizer"`, `isActive: true`

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.users.find({role:'organizer'}).pretty()"
```

---

### 1.4 Deactivate and Reactivate an Organizer

**Frontend:**
1. On `/admin/organizers`, click **Deactivate** next to Tech Club
2. ✅ Expected: Badge changes to "Inactive", button changes to "Reactivate"
3. Click **Reactivate**
4. ✅ Expected: Badge back to "Active"

**Backend verify (deactivate):**
```bash
# Get the organizer's ID from step 1.3's response
curl -X POST http://localhost:5000/api/admin/organizers/ORGANIZER_ID/deactivate \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 1.5 Password Reset Requests (test after organizer submits one — see Section 3.9)

Once an organizer has submitted a request:

**Frontend:**
1. Click **Resets** in nav → `/admin/password-resets`
2. ✅ Expected: Card showing the organizer's name, email, reason, date
3. Click **✅ Approve**
4. ✅ Expected: Alert shows the new generated password (also emailed if email is configured)
5. Test **❌ Reject** on another request: enter a rejection reason in the prompt

**Backend verify:**
```bash
curl http://localhost:5000/api/admin/password-reset-requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## SECTION 2 — Organizer Features

### 2.1 Organizer Login

**Frontend:**
1. Click **Logout**, then go to `/login`
2. Enter:
   - Email: `techclub@fest.com`
   - Password: (the auto-generated password from Section 1.3)
3. ✅ Expected: Redirected to `/organizer/dashboard`
4. ✅ Nav: Dashboard | Events | Create | Payments | Profile | Logout

**Backend verify:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"techclub@fest.com","password":"GENERATED_PASSWORD"}'
```

---

### 2.2 Organizer Dashboard

**Frontend:**
1. Go to `/organizer/dashboard`
2. ✅ Expected: Stats cards (Total Events, Published, Ongoing, Total Registrations)
3. Initially all zeros

---

### 2.3 Update Organizer Profile

**Frontend:**
1. Click **Profile** → `/organizer/profile`
2. Update:
   - Description: `We build cool things`
   - Category: `Technical`
   - Contact Email: `techclub@fest.com`
   - Discord Webhook: (leave blank for now)
3. Click **Save Profile**
4. ✅ Expected: "Profile updated!" success alert
5. Switch to **Password** tab, try changing password (needs the current generated password)
   - Current Password: (generated password)
   - New Password: `TechClub123`
   - Confirm: `TechClub123`
6. ✅ Expected: "Password changed!"
7. **Log out and back in** with the new password `TechClub123` to confirm it worked

**Backend verify:**
```bash
curl http://localhost:5000/api/organizers/profile \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```

---

### 2.4 Create a Normal Event

**Frontend:**
1. Click **Create** → `/organizer/create-event`
2. Fill in:
   - Event Name: `Battle of Bands`
   - Description: `Annual music competition for all genres`
   - Event Type: `Normal`
   - Eligibility: `All`
   - Event Start: (tomorrow's date, e.g., `2026-02-24T10:00`)
   - Event End: (tomorrow + 3 hours)
   - Registration Start: (today)
   - Registration End: (tomorrow)
   - Registration Limit: `100`
   - Registration Fee: `0` (free)
   - Tags: type `music` and press Enter, then `competition` and press Enter
3. **Custom Form Fields:** Click **+ Add Field**
   - Label: `Your Instrument`
   - Type: `text`
   - Required: checked
   - Click **+ Add Field** again
   - Label: `Years of Experience`
   - Type: `number`
   - Required: checked
4. Click **Create Event**
5. ✅ Expected: Success message, redirected to Manage Events

**Backend verify:**
```bash
curl http://localhost:5000/api/organizers/events \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```
✅ Expected: Array with the new event, `status: "draft"`

---

### 2.5 Create a Merchandise Event

**Frontend:**
1. Go to Create Event again
2. Fill in:
   - Event Name: `Fest Merch Store`
   - Type: `Merchandise`
   - Eligibility: `All`
   - Dates: (set future dates)
   - Fee: `0`
3. **Merchandise Items:** Click **+ Add Item** (appears for merchandise type)
   - Item Name: `Fest T-Shirt`
   - Price: `299`
   - Available Sizes: check `S`, `M`, `L`, `XL`
   - Add another item: `Fest Hoodie`, Price: `599`, sizes `M`, `L`, `XL`
4. Click **Create Event**
5. ✅ Expected: Created successfully

---

### 2.6 Create a Hackathon Event

**Frontend:**
1. Create Event again
2. Fill:
   - Event Name: `HackFest 2026`
   - Type: `Hackathon`
   - Eligibility: `IIIT Students Only`
   - Dates: (future dates)
   - Fee: `100`
3. **Hackathon Settings:** (visible for hackathon type)
   - Min Team Size: `2`
   - Max Team Size: `4`
   - Theme: `AI for Social Good`
   - Prize Pool: `50000`
4. Click **Create Event**
5. ✅ Expected: Created

---

### 2.7 Publish an Event

**Frontend:**
1. Click **Events** → `/organizer/events`
2. ✅ Expected: Table shows all 3 events with `draft` status
3. Find "Battle of Bands", click **Publish**
4. ✅ Expected: Status badge changes to `published`, form fields are now locked
5. Publish "HackFest 2026" too

**Backend verify:**
```bash
curl http://localhost:5000/api/events/browse \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```
✅ Expected: Published events visible

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.events.find({status:'published'},{eventName:1,status:1})"
```

---

### 2.8 Change Event Status (Start / Complete)

**Frontend:**
1. On Manage Events, find "Battle of Bands" (published)
2. Click **Start** → status becomes `ongoing`
3. ✅ Expected: Badge turns green "ongoing"
4. Click **Complete** → status becomes `completed`
5. ✅ Expected: Badge updates to "completed"

---

### 2.9 Request Password Reset

**Frontend (as organizer):**
1. Click **Profile** → Password tab → or go to `/organizer/password-reset`
2. Since you changed the password in 2.3, test this flow:
   - Navigate to `/organizer/password-reset`
   - Enter reason: `Testing the reset flow, forgot old generated password`
   - Click **Submit Request**
3. ✅ Expected: "Request Submitted" confirmation screen

**Backend verify:**
```bash
curl http://localhost:5000/api/admin/password-reset-requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
✅ Expected: New request with `status: "pending"`

Now go back to admin (Section 1.5) to approve/reject this request.

---

## SECTION 3 — Participant Features

Open a **new incognito/private window** or use a different browser for participant testing so you stay logged in as organizer in the main window.

### 3.1 Participant Registration

**Frontend (incognito window):**
1. Go to http://localhost:3000 → `/register`
2. Fill in:
   - First Name: `Rahul`
   - Last Name: `Sharma`
   - Email: `rahul.sharma@students.iiit.ac.in`
   - Password: `Rahul@1234`
   - Participant Type: `IIIT Student`
3. Click **Register**
4. ✅ Expected: Redirected to `/participant/onboarding`

**Test email validation:** Try registering with `rahul@gmail.com`
- ✅ Expected: Error "only iiit email addresses are allowed"

**Backend verify:**
```bash
curl http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@students.iiit.ac.in","password":"Test@1234","participantType":"iiit"}'
```

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.users.find({role:'participant'},{firstName:1,email:1,onboardingCompleted:1})"
```

---

### 3.2 Onboarding — Select Interests & Follow Clubs

**Frontend:**
1. After registration, on `/participant/onboarding`
2. ✅ Expected: Step 1 shows interest chips (Music, Technology, Sports, Art, etc.)
3. Select: `Music`, `Technology`, `Gaming`
4. Click **Next**
5. ✅ Expected: Step 2 shows clubs to follow — Tech Club should appear
6. Click **Follow** on Tech Club
7. Click **Finish / Complete Onboarding**
8. ✅ Expected: Redirected to `/participant/dashboard`

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.users.findOne({email:'rahul.sharma@students.iiit.ac.in'},{interests:1,followedClubs:1,onboardingCompleted:1})"
```
✅ Expected: `onboardingCompleted: true`, `interests: ["Music","Technology","Gaming"]`, `followedClubs: [<Tech Club ID>]`

---

### 3.3 Participant Dashboard

**Frontend:**
1. On `/participant/dashboard`
2. ✅ Expected: 
   - Stats row (Registrations, Teams, Following)
   - Trending Events section showing published events
   - Recommended Events (matching your interests)
   - Upcoming Registrations (empty for now)

---

### 3.4 Browse Events

**Frontend:**
1. Click **Events** → `/participant/events`
2. ✅ Expected: Event cards for "Battle of Bands" and "HackFest 2026" visible
3. **Search test:** Type `band` in the search box
   - ✅ Expected: Only "Battle of Bands" shows up
4. **Filter test:** Select Type = `Hackathon`
   - ✅ Expected: Only "HackFest 2026" shown
5. Clear filters

**Backend verify (public endpoint — no auth):**
```bash
curl "http://localhost:5000/api/events/browse?search=band"
```
```bash
curl "http://localhost:5000/api/events/browse?eventType=hackathon"
```

---

### 3.5 View Event Details

**Frontend:**
1. Click on "Battle of Bands" event card
2. ✅ Expected: Full event details page showing:
   - Event name, description, type badge, status
   - Dates, fee, organizer name (Tech Club)
   - Custom form fields (Your Instrument, Years of Experience)
   - Register button
   - Calendar export links

---

### 3.6 Register for a Normal Event

**Frontend:**
1. On "Battle of Bands" event details page
2. Fill in custom form:
   - Your Instrument: `Guitar`
   - Years of Experience: `5`
3. Click **Register**
4. ✅ Expected: 
   - Success message
   - QR code appears on the page
   - "Already Registered" or registration confirmation shown

**Backend verify:**
```bash
curl http://localhost:5000/api/registrations/my \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
```
✅ Expected: Array with one registration, `status: "confirmed"`, `qrCode` field (data URL), `ticketId`

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.registrations.findOne({},{ticketId:1,status:1,qrCode:1,formResponses:1})"
```

---

### 3.7 View My Registrations & QR Code

**Frontend:**
1. Click **Registrations** → `/participant/registrations`
2. ✅ Expected: Registration card for "Battle of Bands" showing:
   - Event name, status badge
   - QR code ticket
   - Ticket ID
3. ✅ The QR code should be scannable — it encodes the ticket ID

---

### 3.8 Register for Paid Event (Upload Payment Proof)

First, as organizer, set a fee on an event, or use HackFest which has fee=100.

**Frontend (participant window):**
1. Go to "HackFest 2026" event details — note: this is IIIT-only and participant is IIIT
2. Register → since it has a fee, payment proof upload section appears after registration
3. Go to **My Registrations**
4. Find the HackFest registration — it should show `paymentStatus: unpaid`
5. Click **Upload Payment Proof**
6. Select a small image file (jpeg/png) or PDF from your computer
7. Click **Upload**
8. ✅ Expected: Payment status changes to "pending verification"

**Backend verify:**
```bash
curl http://localhost:5000/api/registrations/my \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
```
✅ Expected: HackFest registration with `paymentVerificationStatus: "pending"`, `paymentProof` path set

**Check the uploaded file exists:**
```bash
ls backend/uploads/payment-proofs/
```
✅ Expected: A timestamped file (e.g., `payment-1740123456789.jpg`)

**View uploaded file directly:**
http://localhost:5000/uploads/payment-proofs/YOUR_FILENAME

---

### 3.9 Cancel a Registration

**Frontend:**
1. On `/participant/registrations`
2. Find the "Battle of Bands" registration
3. Click **Cancel**
4. Confirm in the prompt
5. ✅ Expected: Registration removed from the list (or status changes to "cancelled")

**Backend verify:**
```bash
curl http://localhost:5000/api/registrations/my \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
```

---

### 3.10 Purchase Merchandise

**Frontend:**
1. Browse to "Fest Merch Store" event (if published by organizer)
2. ✅ Expected: Merchandise items listed (T-Shirt, Hoodie) with quantity controls and size dropdowns
3. Add 1 T-Shirt (size M) and 1 Hoodie (size L)
4. Click **Purchase**
5. ✅ Expected: Order confirmation

**Backend verify:**
```bash
curl http://localhost:5000/api/registrations/my \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
```
✅ Expected: Registration with `merchandiseDetails` array

---

### 3.11 Export Event to Calendar

**Frontend:**
1. On any event details page (e.g., Battle of Bands)
2. Find the calendar export section
3. Click **Google Calendar**
   - ✅ Expected: New tab opens with Google Calendar "Add Event" pre-filled
4. Click **Outlook**
   - ✅ Expected: Outlook calendar link opens
5. Click **Download .ics**
   - ✅ Expected: A `.ics` file downloads — open it to add to any calendar app

**Backend verify:**
```bash
# .ics download
curl "http://localhost:5000/api/events/EVENT_ID/export-calendar?format=ics" \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
# Google Calendar URL
curl "http://localhost:5000/api/events/EVENT_ID/export-calendar?format=google" \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
```

---

### 3.12 Browse Clubs & Follow/Unfollow

**Frontend:**
1. Click **Clubs** → `/participant/clubs`
2. ✅ Expected: Club cards visible — Tech Club should appear with category, description
3. **Search test:** Type `tech` in the search bar
   - ✅ Expected: Tech Club appears
4. If not already following, click **Follow**
   - ✅ Expected: Button changes to "Unfollow"
5. Click **Unfollow**
   - ✅ Expected: Button back to "Follow"

**Backend verify:**
```bash
curl http://localhost:5000/api/participants/clubs \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
```

---

### 3.13 View Club Details

**Frontend:**
1. Click on **Tech Club** card
2. ✅ Expected: Organizer profile with description, contact info, and their events listed

---

### 3.14 Update Participant Profile

**Frontend:**
1. Click **Profile** → `/participant/profile`
2. Update:
   - First Name: `Rahul` (keep)
   - Contact Number: `9876543210`
   - College Name: `IIIT Hyderabad`
3. **Interests tab:** Add `Coding`, remove `Gaming`
4. Click **Save**
5. ✅ Expected: Success message

**Backend verify:**
```bash
curl http://localhost:5000/api/participants/profile \
  -H "Authorization: Bearer PARTICIPANT_TOKEN"
```

---

## SECTION 4 — Teams & Hackathon Features

### 4.1 Create a Team

Register a second participant to create a team scenario:

**Register second participant:**
1. In incognito:
   - Email: `priya.singh@students.iiit.ac.in`
   - Password: `Priya@1234`
   - Complete onboarding

**In Rahul's window:**
1. Click **Teams** → `/participant/teams`
2. Click **Create Team**
3. Fill:
   - Team Name: `Code Warriors`
   - Event: select `HackFest 2026`
4. Click **Create**
5. ✅ Expected: Team created, Rahul is the leader
6. ✅ An 8-character invite code is shown (e.g., `AB3X9KP2`)

**Backend verify:**
```bash
curl http://localhost:5000/api/teams/my \
  -H "Authorization: Bearer RAHUL_TOKEN"
```
✅ Expected: Team with `teamName: "Code Warriors"`, `inviteCode`, `teamLeader`

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.teams.findOne({},{teamName:1,inviteCode:1,members:1})"
```

---

### 4.2 Invite Member via Email

**Frontend (Rahul's window):**
1. On the team card, click **Invite Member**
2. Enter: `priya.singh@students.iiit.ac.in`
3. Click **Invite**
4. ✅ Expected: Priya added as a "pending" member

**Backend verify:**
```bash
curl http://localhost:5000/api/teams/TEAM_ID \
  -H "Authorization: Bearer RAHUL_TOKEN"
```
✅ Expected: `members` array shows Priya with `status: "pending"`

---

### 4.3 Join Team via Invite Code

**Frontend (Priya's window — alternative method):**
1. Go to Teams → click **Join by Invite Code**
2. Enter Rahul's invite code (e.g., `AB3X9KP2`)
3. Click **Join**
4. ✅ Expected: Priya joins as pending member

**Alternatively — Accept the invite sent by email invitation:**
1. In Priya's window, go to Teams
2. ✅ Expected: "Pending Invites" section shows Code Warriors invite
3. Click **Accept**
4. ✅ Expected: Priya now an active member

---

### 4.4 Register the Team for Event

**Frontend (Rahul as team leader):**
1. On Teams page, find Code Warriors, click **Register Team**
2. ✅ Expected: All accepted team members get registrations for HackFest 2026

**Backend verify:**
```bash
curl http://localhost:5000/api/registrations/my \
  -H "Authorization: Bearer RAHUL_TOKEN"
```
✅ Expected: A HackFest registration linked to the team

---

### 4.5 Leave Team / Remove Member

**Frontend (Priya's window):**
1. Go to Teams → find Code Warriors
2. Click **Leave Team**
3. ✅ Expected: Priya removed from team

**Frontend (Rahul as leader):**
1. Team page → click **Remove** next to a member
2. ✅ Expected: Member removed

---

## SECTION 5 — Forum (Real-Time)

### 5.1 Send a Forum Message

You need both windows open (Rahul and Priya both registered for the same event).

**Rahul's window:**
1. Navigate to any event details page and click **Open Forum** (or go directly to `/participant/forum/EVENT_ID`)
2. ✅ Expected: Forum view with message input at the bottom
3. Type: `Hello everyone! Ready for Battle of Bands?`
4. Press **Enter** or click **Send**
5. ✅ Expected: Message appears immediately in Rahul's window

**Priya's window (real-time test):**
1. Open the same forum URL in Priya's session
2. ✅ Expected: Rahul's message appears **instantly without refreshing** (Socket.IO)

**Priya responds:**
1. Type: `Super excited! 🎸`
2. Send
3. ✅ Expected: Both windows show Priya's message instantly

**Backend verify:**
```bash
curl http://localhost:5000/api/forum/EVENT_ID/messages \
  -H "Authorization: Bearer RAHUL_TOKEN"
```
✅ Expected: Array of messages with `author`, `content`, `createdAt`

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.forummessages.find({},{content:1,author:1,isPinned:1})"
```

---

### 5.2 Add Reaction to Message

**Frontend:**
1. Hover over a message in the forum
2. Click a reaction emoji (😂 or ❤️)
3. ✅ Expected: Reaction count updates on the message for both users in real-time
4. Click the same reaction again to remove it
5. ✅ Expected: Count decrements

---

### 5.3 Pin a Message (Organizer)

**Frontend (switch to organizer window):**
1. Log into organizer window, go to the same forum
2. Hover over a message, click **📌 Pin**
3. ✅ Expected: Message gets a highlighted/pinned style visible to all users in real-time

---

### 5.4 Delete a Message

**Frontend:**
1. In Rahul's window, hover over his own message
2. Click **🗑 Delete**
3. ✅ Expected: Message disappears for all users in real-time (soft delete)

---

## SECTION 6 — Organizer Attendance Features

### 6.1 View Event Registrations

**Frontend (organizer window):**
1. Click **Events** → click on "Battle of Bands" row (or the event ID link)
2. ✅ Expected: `/organizer/events/EVENT_ID` shows:
   - Stats: Total, Attended, Payment Pending, Payment Approved
   - Participants table with name, email, type, status, payment status

---

### 6.2 Approve a Payment

**Frontend (organizer):**
1. On Event Registrations page for HackFest
2. Find a registration with `paymentVerificationStatus: pending`
3. Click **✅ Approve**
4. ✅ Expected: Payment status updates to "approved", button disappears
5. Test **❌ Reject**: click Reject, enter reason in the prompt
6. ✅ Expected: Status updates to "rejected"

**Alternatively from Pending Payments:**
1. Click **Payments** in nav → `/organizer/pending-payments`
2. ✅ Expected: Cards for all pending payment verifications across all events
3. Click **View Payment Proof** → opens the uploaded image/PDF
4. Click **✅ Approve** or **❌ Reject**

**Backend verify:**
```bash
curl http://localhost:5000/api/organizers/pending-payments \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```

---

### 6.3 QR Code Attendance Scanning

**Frontend (organizer):**
1. Click **Events** → on an event, click **📱 Attendance Scanner** or navigate to `/organizer/attendance/EVENT_ID`
2. ✅ Expected: Three tabs: QR Scan | Manual Entry | Dashboard

**QR Scan tab:**
1. Get Rahul's QR code (log in as Rahul, go to My Registrations, note the QR code or ticketId)
2. In organizer's attendance scanner, paste the ticket ID or QR data into the input
3. Click **Mark Attendance**
4. ✅ Expected: Success message: `"Attendance marked for Rahul Sharma"`
5. Try scanning the same ticket again
6. ✅ Expected: Error `"attendance already marked"`

**Backend verify:**
```bash
curl -X POST http://localhost:5000/api/attendance/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -d '{"qrData":"TICKET_ID","eventId":"EVENT_ID"}'
```

---

### 6.4 Manual Attendance

**Frontend (organizer → Attendance Scanner → Manual Entry tab):**
1. Type: `rahul.sharma@students.iiit.ac.in`
2. Click **Mark Attendance**
3. ✅ Expected: Success (or "already marked")

**Backend verify:**
```bash
curl -X POST http://localhost:5000/api/attendance/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -d '{"email":"rahul.sharma@students.iiit.ac.in","eventId":"EVENT_ID"}'
```

---

### 6.5 Attendance Dashboard

**Frontend (organizer → Attendance Scanner → Dashboard tab):**
1. ✅ Expected: Stats: Registered=X, Attended=Y, Rate=Z%
2. Table of attendees with check-in times

**Backend verify:**
```bash
curl http://localhost:5000/api/attendance/event/EVENT_ID \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```

---

### 6.6 Export Attendance CSV

**Frontend:**
1. On Attendance Dashboard tab, click **📥 Export CSV**
2. ✅ Expected: `attendance-EVENT_ID.csv` downloads
3. Open the CSV — check columns: Name, Email, TicketID, CheckInTime, etc.

**Backend verify:**
```bash
curl "http://localhost:5000/api/attendance/event/EVENT_ID/export" \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -o test-attendance.csv
cat test-attendance.csv
```

---

### 6.7 Export Participants CSV

**Frontend:**
1. Click **Events** → on an event row, click **Export CSV** button
2. ✅ Expected: `participants-EVENT_ID.csv` downloads

**Backend verify:**
```bash
curl "http://localhost:5000/api/organizers/events/EVENT_ID/export-csv" \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -o test-participants.csv
cat test-participants.csv
```

---

## SECTION 7 — Edge Cases & Validation Tests

### 7.1 Non-IIIT Email Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"X","lastName":"Y","email":"x@gmail.com","password":"Xyz@1234","participantType":"iiit"}'
```
✅ Expected: `400 Bad Request` — "only iiit email addresses are allowed"

---

### 7.2 Duplicate Registration

Register Rahul for "Battle of Bands" again (he already registered and cancelled — re-register first, then try again):
```bash
curl -X POST http://localhost:5000/api/registrations/event/EVENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RAHUL_TOKEN" \
  -d '{"formResponses":{"Your Instrument":"Bass","Years of Experience":3}}'
# Then try the same request again
```
✅ Expected second call: `400` — "already registered"

---

### 7.3 Non-IIIT Participant Tries to Register for IIIT-Only Event

Register a non-IIIT participant:
1. Register with a non-IIIT email (won't work — all participants need IIIT email)
2. Or test by checking the eligibility filter on the browse page

---

### 7.4 File Upload Validation

Try uploading an oversized file as payment proof (> 5MB):
```bash
# Create a 6MB dummy file
dd if=/dev/zero bs=1M count=6 | base64 > /tmp/bigfile.txt
```
Then attempt to upload it as payment proof in the UI.
✅ Expected: Error "File too large" or "only jpeg, jpg, png, pdf allowed"

Try uploading a `.gif` file:
✅ Expected: "only jpeg, jpg, png, and pdf files are allowed"

---

### 7.5 Expired / Invalid JWT

```bash
curl http://localhost:5000/api/participants/dashboard \
  -H "Authorization: Bearer INVALID_TOKEN_HERE"
```
✅ Expected: `401 Unauthorized` — "invalid token"

---

### 7.6 Admin Deletes Organizer

**Frontend (admin):**
1. Go to Manage Organizers
2. Click **Delete** next to an organizer
3. Confirm in dialog
4. ✅ Expected: Organizer removed from list

**MongoDB verify:**
```bash
mongosh fest_management --eval "db.users.find({role:'organizer'},{email:1})"
```

---

## SECTION 8 — Socket.IO Real-Time Verification

### 8.1 Test Real-Time Connection

Open browser DevTools (F12) while on the forum page:
1. Go to **Network** tab, filter by `WS`
2. ✅ Expected: A WebSocket connection to `ws://localhost:3000/socket.io/...` should be open

### 8.2 Check Socket.IO Server Log

In the backend terminal, look for:
```
new client connected: SOCKET_ID
socket SOCKET_ID joined forum-EVENT_ID
```
When the second user opens the forum:
```
new client connected: ANOTHER_SOCKET_ID
socket ANOTHER_SOCKET_ID joined forum-EVENT_ID
```

---

## SECTION 9 — MongoDB Direct Inspection

At any point you can run these to see the full database state:

```bash
mongosh fest_management
```

```js
// All users by role
db.users.aggregate([{$group:{_id:"$role",count:{$sum:1}}}])

// All events with registration counts
db.events.find({},{eventName:1,status:1,eventType:1})

// All registrations with basic info
db.registrations.find({},{ticketId:1,status:1,paymentVerificationStatus:1,attendanceMarked:1})

// All forum messages
db.forummessages.find({isDeleted:false},{content:1,isPinned:1})

// All teams
db.teams.find({},{teamName:1,inviteCode:1,"members.status":1})

// Password reset requests
db.passwordresetrequests.find({},{reason:1,status:1})
```

---

## SECTION 10 — Full API Quick Reference

All endpoints: `http://localhost:5000/api/...`

Replace `TOKEN` with the appropriate JWT for the role.

```bash
# Health check
curl http://localhost:5000

# ---- AUTH ----
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"firstName":"A","lastName":"B","email":"a@students.iiit.ac.in","password":"Aa@12345","participantType":"iiit"}'
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@fest.com","password":"AdminPassword123"}'
curl http://localhost:5000/api/auth/profile -H "Authorization: Bearer TOKEN"

# ---- EVENTS ----
curl http://localhost:5000/api/events/browse
curl "http://localhost:5000/api/events/browse?search=band&eventType=normal"
curl http://localhost:5000/api/events/EVENT_ID

# ---- ADMIN ----
curl http://localhost:5000/api/admin/dashboard -H "Authorization: Bearer ADMIN_TOKEN"
curl http://localhost:5000/api/admin/organizers -H "Authorization: Bearer ADMIN_TOKEN"
curl http://localhost:5000/api/admin/password-reset-requests -H "Authorization: Bearer ADMIN_TOKEN"

# ---- ORGANIZER ----
curl http://localhost:5000/api/organizers/dashboard -H "Authorization: Bearer ORG_TOKEN"
curl http://localhost:5000/api/organizers/events -H "Authorization: Bearer ORG_TOKEN"
curl http://localhost:5000/api/organizers/pending-payments -H "Authorization: Bearer ORG_TOKEN"

# ---- PARTICIPANT ----
curl http://localhost:5000/api/participants/dashboard -H "Authorization: Bearer PART_TOKEN"
curl http://localhost:5000/api/participants/clubs -H "Authorization: Bearer PART_TOKEN"

# ---- REGISTRATIONS ----
curl http://localhost:5000/api/registrations/my -H "Authorization: Bearer PART_TOKEN"

# ---- TEAMS ----
curl http://localhost:5000/api/teams/my -H "Authorization: Bearer PART_TOKEN"

# ---- FORUM ----
curl http://localhost:5000/api/forum/EVENT_ID/messages -H "Authorization: Bearer TOKEN"

# ---- ATTENDANCE ----
curl http://localhost:5000/api/attendance/event/EVENT_ID -H "Authorization: Bearer ORG_TOKEN"
```

---

## Checklist Summary

| Feature | Tested? |
|---|---|
| Admin login | ☐ |
| Admin dashboard stats | ☐ |
| Create organizer | ☐ |
| Deactivate/Reactivate organizer | ☐ |
| Delete organizer | ☐ |
| Approve password reset | ☐ |
| Reject password reset | ☐ |
| Organizer login | ☐ |
| Organizer update profile | ☐ |
| Change password (organizer) | ☐ |
| Create normal event | ☐ |
| Create merchandise event | ☐ |
| Create hackathon event | ☐ |
| Publish event | ☐ |
| Start / Complete event status | ☐ |
| View event registrations | ☐ |
| Approve payment | ☐ |
| Reject payment | ☐ |
| QR attendance scan | ☐ |
| Manual attendance | ☐ |
| Attendance dashboard | ☐ |
| Export attendance CSV | ☐ |
| Export participants CSV | ☐ |
| Submit password reset request | ☐ |
| Participant registration (IIIT email) | ☐ |
| Reject non-IIIT email | ☐ |
| Onboarding (interests + clubs) | ☐ |
| Participant dashboard | ☐ |
| Browse events (search + filter) | ☐ |
| View event details | ☐ |
| Register for event (custom form) | ☐ |
| Upload payment proof | ☐ |
| Cancel registration | ☐ |
| Purchase merchandise | ☐ |
| Export to Google Calendar | ☐ |
| Export to Outlook / .ics download | ☐ |
| Browse clubs (search + follow) | ☐ |
| Update participant profile + interests | ☐ |
| Create team | ☐ |
| Invite member to team | ☐ |
| Join team by invite code | ☐ |
| Accept / reject team invite | ☐ |
| Register team for event | ☐ |
| Leave team | ☐ |
| Remove team member | ☐ |
| Forum post message + real-time | ☐ |
| Forum reactions (add / remove) | ☐ |
| Pin forum message (organizer) | ☐ |
| Delete forum message | ☐ |
| Invalid JWT rejection | ☐ |
| Oversized file rejection | ☐ |
| Duplicate registration rejection | ☐ |
