# CareSync — Hospital Appointment Management System (MERN Stack)

A complete, production-grade **Hospital Appointment Management System** built with the **MERN** stack (**Node.js**, **Express**, **MongoDB**, **React + Vite**) featuring dual-role authentication (**Doctor** & **Patient**), atomic concurrency-safe slot reservations, and real-time bidirectional synchronization with **Socket.IO**.

---

## 🌟 Key Features

### 🔐 Authentication & Role-Based Access Control (RBAC)
- **Role Isolation**: Strict separation between `doctor` and `patient` accounts at both API and frontend routing levels.
- **Token Security**: 15-minute Access Tokens stored in memory (Axios interceptor) and 7-day Refresh Tokens stored in secure `HttpOnly; SameSite=Lax` cookies. Automatic silent token refresh queue.
- **bcrypt Hashing**: Passwords encrypted with 12 salt rounds.

### 🛡️ Concurrency-Safe Slot Reservation
- **Atomic Locking**: Uses a dedicated `SlotReservation` model with a unique compound index on `{ doctorId: 1, appointmentDate: 1, startTime: 1 }`.
- **Race Condition Prevention**: Prevents double-booking when two patients attempt to book the exact same slot at the exact same millisecond. Tested with concurrent automated requests — exactly one succeeds (201) while the second receives HTTP 409 Conflict.
- **Automated Slot Release**: Cancelling or rescheduling an appointment safely drops the reservation and immediately frees the slot.

### ⚡ Real-Time Socket.IO Synchronization
- **Dynamic Slot Gray-Out**: Patients viewing a doctor's schedule are placed in the `doctor:{id}:availability` room. When a slot is booked or cancelled, `slot:taken` / `slot:released` events are broadcast to update the UI instantly without page refresh.
- **Live Doctor Queue**: When a doctor marks an appointment `completed` or `no_show`, the patient receives instant status updates and the doctor's live queue refreshes in real-time.
- **Persistent In-App Notifications**: Real-time bell badge with unread counters, stored in MongoDB with full read/unread lifecycle tracking.

### 🩺 Doctor Module
- **Interactive Dashboard**: Today's patient count, upcoming visits, completed consultations, total patients seen, and weekly appointment volume chart (Recharts).
- **Today's Queue**: Chronologically sorted list of today's patients with 1-click status actions (`Mark Completed`, `Mark No Show`).
- **Weekly Schedule Manager**: Configure day-by-day working intervals and break periods; choose consultation duration (15, 20, 30, 60 mins). Detects conflicts with existing appointments before updating.
- **Schedule Exceptions**: Block dates for leaves, vacations, or set custom consultation intervals.
- **Doctor Profile**: Specialization, medical registration number, experience, fees, qualifications, bio, and timezone.

### 🧑‍⚕️ Patient Module
- **Patient Dashboard**: Upcoming consultations, next scheduled visit highlight card, completed/cancelled stats, and quick-book doctor cards.
- **Find Doctors**: Search by doctor name and filter by medical specialization (Cardiology, Neurology, Orthopedics, etc.).
- **Doctor Profile & Live Slots**: View qualifications, fees, and inspect available time slots by calendar date.
- **4-Step Booking Wizard**: Date selection &rarr; Real-time slot picker &rarr; Visit reason &rarr; Review and confirmation.
- **My Appointments**: Tabbed view (`Upcoming`, `Completed`, `Cancelled`, `All`) with cancellation and modal-based slot rescheduling.
- **Patient Profile**: Update contact details, date of birth, gender, and blood group.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router DOM v7, TanStack Query v5, Socket.IO Client, React Hook Form, Zod, Recharts, Lucide React, React Hot Toast, Day.js |
| **Backend** | Node.js (ES Modules), Express.js 5, MongoDB / Mongoose 9, Socket.IO 4, JWT, bcryptjs, Express Validator, Helmet, CORS, Express Rate Limit |
| **Testing** | Jest, Supertest, Cross-Env |

---

## 📂 Project Structure

```text
fsd/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── api/                # Axios instance & API client modules
│   │   ├── components/
│   │   │   ├── appointments/   # AppointmentCard, SlotPicker, DatePicker, BookingSteps
│   │   │   ├── common/         # Button, Input, Modal, ConfirmDialog, LoadingSkeleton
│   │   │   ├── dashboard/      # StatCard, WeeklyChart, NotificationBell
│   │   │   └── schedule/       # DayScheduleRow, ScheduleEditor
│   │   ├── contexts/           # AuthContext, SocketContext
│   │   ├── hooks/              # useAuth, useSocket, useNotifications, useAppointments
│   │   ├── layouts/            # AuthLayout, PatientLayout, DoctorLayout
│   │   ├── pages/
│   │   │   ├── auth/           # LandingPage, LoginPage, Register pages
│   │   │   ├── patient/        # Dashboard, FindDoctors, Book, MyAppointments, Profile
│   │   │   └── doctor/         # Dashboard, TodaysPatients, Schedule, Exceptions, Profile
│   │   ├── routes/             # AppRoutes, ProtectedRoute, RoleRoute
│   │   └── socket/             # Socket.IO client instance & event listeners
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── seed/
│   │   └── seed.js             # Sample database seed generator
│   ├── src/
│   │   ├── config/             # MongoDB connection, constants
│   │   ├── controllers/        # auth, doctor, patient, appointment, notification
│   │   ├── middleware/         # authenticate, requireRole, errorHandler
│   │   ├── models/             # User, DoctorProfile, PatientProfile, Schedule, Appointment, SlotReservation, Notification, RefreshSession
│   │   ├── routes/             # REST endpoint definitions
│   │   ├── services/           # Business logic & atomic database operations
│   │   ├── sockets/            # Socket.IO handshake auth & room emitters
│   │   ├── utils/              # jwt, slot generator, standard responses
│   │   ├── validators/         # Express-validator schemas
│   │   ├── app.js              # Express application factory
│   │   └── server.js           # HTTP + WebSocket server entry point
│   ├── tests/
│   │   ├── auth.test.js        # Auth, JWT, RBAC tests
│   │   ├── appointment.test.js # Booking, cancellation, reschedule, status tests
│   │   └── concurrency.test.js # Atomic parallel race condition test
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (running locally on port `27017` or a MongoDB Atlas URI)

---

### Step 1: Backend Setup

1. Open a terminal and navigate to `server/`:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hospital_db
   JWT_ACCESS_SECRET=hospital_access_secret_super_secure_key_2026_jwt
   JWT_REFRESH_SECRET=hospital_refresh_secret_super_secure_key_2026_jwt
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. Seed the database with demo doctors, patients, schedules, and appointments:
   ```bash
   npm run seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   # or: npm start
   ```
   *The server starts on `http://localhost:5000` with WebSockets enabled.*

---

### Step 2: Frontend Setup

1. Open a second terminal and navigate to `client/`:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure `client/.env` contains:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_WS_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The client will be running at `http://localhost:5173`.*

---

## 🧪 Running Automated Tests

Run the full automated test suite (including the atomic concurrency race condition test):

```bash
cd server
npm test
```

### Test Coverage Highlights:
- ✅ **Authentication**: Patient & doctor registration, duplicate detection, credential validation, token issuance, HttpOnly cookies.
- ✅ **RBAC**: Ensures patients cannot access doctor endpoints (403) and doctors cannot access patient endpoints (403).
- ✅ **Appointment Lifecycle**: Successful booking, past date prevention, double-booking prevention, patient cancellation, slot rescheduling, doctor status updates.
- ✅ **Atomic Concurrency Test**: Simulates 2 patients firing simultaneous requests for the exact same slot with `Promise.all`. Asserts that **exactly one** booking succeeds (201) and **exactly one** receives Conflict (409).

---

## 🔑 Demo Credentials

All seeded accounts use password: `Password123!`

### Doctors
| Doctor | Email | Specialization |
|---|---|---|
| **Dr. Aisha Patel** | `aisha.patel@hospital.com` | Cardiology |
| **Dr. Rahul Sharma** | `rahul.sharma@hospital.com` | Neurology |
| **Dr. Priya Nair** | `priya.nair@hospital.com` | Orthopedics |

### Patients
| Patient | Email |
|---|---|
| **Amit Kumar** | `amit.kumar@gmail.com` |
| **Sneha Gupta** | `sneha.gupta@gmail.com` |
| **Rohit Verma** | `rohit.verma@gmail.com` |
| **Meera Joshi** | `meera.joshi@gmail.com` |
| **Vikram Singh** | `vikram.singh@gmail.com` |

*(Tip: You can also use the "Demo Doctor" and "Demo Patient" one-click autofill buttons directly on the Login page!)*

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register/patient` — Register a patient
- `POST /api/auth/register/doctor` — Register a doctor with clinical credentials
- `POST /api/auth/login` — Login with email & password (returns access token & sets HttpOnly refresh cookie)
- `POST /api/auth/refresh` — Rotate refresh token & issue new access token
- `POST /api/auth/logout` — Revoke session & clear cookies
- `GET /api/auth/me` — Retrieve current authenticated user & profile

### Doctors (Public & Doctor Role)
- `GET /api/doctors` — Public search and filter doctors
- `GET /api/doctors/:id` — Public doctor profile details
- `GET /api/doctors/:id/availability?date=YYYY-MM-DD` — Public dynamic slot generator for given date
- `GET /api/doctor/dashboard` — Doctor dashboard metrics & statistics
- `GET /api/doctor/appointments/today` — Doctor's live patient queue for today
- `GET /api/doctor/appointments` — Doctor's all appointment history (paginated & filtered)
- `GET /api/doctor/schedule` — Doctor's recurring 7-day schedule
- `PUT /api/doctor/schedule` — Update recurring weekly schedule (with conflict checks)
- `POST /api/doctor/schedule/exceptions` — Add date blocks or custom hours
- `GET /api/doctor/profile` — Get doctor profile
- `PUT /api/doctor/profile` — Update doctor profile details

### Patients (Patient Role)
- `GET /api/patient/dashboard` — Patient dashboard stats & next scheduled visit
- `GET /api/patient/appointments` — Patient's appointments (filtered by tab: upcoming, completed, cancelled, all)
- `GET /api/patient/profile` — Get patient profile
- `PUT /api/patient/profile` — Update patient details (DOB, gender, blood group)

### Appointments
- `POST /api/appointments` — Patient books an appointment (concurrency-safe atomic reservation)
- `GET /api/appointments/:id` — Get appointment details (owner check enforced)
- `PATCH /api/appointments/:id/cancel` — Patient cancels future appointment (frees slot reservation)
- `PATCH /api/appointments/:id/reschedule` — Patient reschedules appointment to new date/time
- `PATCH /api/appointments/:id/status` — Doctor marks appointment `completed` or `no_show`

### Notifications
- `GET /api/notifications` — Fetch user notifications
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read

---

## ⚡ Socket.IO Events & Room Reference

| Room | Purpose | Authorized Users |
|---|---|---|
| `user:{userId}` | Private user events (notifications, booking confirmations) | Only user with matching `userId` in JWT |
| `doctor:{doctorId}:availability` | Live slot updates (`slot:taken`, `slot:released`) | Any patient browsing that doctor's schedule |

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `appointment:created` | Server &rarr; Doctor | `{ appointment }` | Alerts doctor in real-time of new booking |
| `slot:taken` | Server &rarr; Availability Room | `{ date, startTime }` | Notifies patients viewing doctor's schedule to disable slot |
| `slot:released` | Server &rarr; Availability Room | `{ date, startTime }` | Notifies patients viewing doctor's schedule to enable slot |
| `appointment:cancelled` | Server &rarr; Patient & Doctor | `{ appointment }` | Updates dashboards on cancellation |
| `appointment:statusUpdated` | Server &rarr; Patient | `{ appointment }` | Alerts patient when doctor marks completed/no-show |
| `doctor:queueUpdated` | Server &rarr; Doctor | `{ appointment }` | Re-orders and updates doctor's live queue |
| `notification:new` | Server &rarr; User | `{ notification }` | Increments notification bell badge in real-time |

---

## 🐳 Docker Containerization

The repository includes production-ready Dockerfiles for both services and a unified `docker-compose.yml` for local orchestration including MongoDB.

### 1. Run the Entire Full-Stack with Docker Compose

Ensure Docker Desktop is installed and running, then execute:

```bash
# Build and spin up MongoDB, Express Backend, and React (Nginx) Frontend
docker compose up --build

# Run in background (detached mode)
docker compose up -d --build

# View running container logs
docker compose logs -f

# Stop all containers
docker compose down

# Stop and remove volumes (resets database)
docker compose down -v
```

Once started:
- **Frontend (Web App)**: `http://localhost`
- **Backend REST API**: `http://localhost:5000`
- **MongoDB**: `localhost:27017`

### 2. Build and Run Individual Images

**Backend Server:**
```bash
cd server
docker build -t care-sync-server .
docker run -p 5000:5000 --env-file .env care-sync-server
```

**Frontend Client:**
```bash
cd client
docker build \
  --build-arg VITE_API_URL=http://localhost:5000/api \
  --build-arg VITE_WS_URL=http://localhost:5000 \
  -t care-sync-client .
docker run -p 80:80 care-sync-client
```

---

## 🚀 Deploy to Render

### Prerequisites
1. **GitHub Repository**: Push this code to a GitHub/GitLab repository.
2. **MongoDB Atlas Account**: Render does not offer managed MongoDB; create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) and get your connection string (`mongodb+srv://<user>:<password>@cluster0.../care_sync?retryWrites=true&w=majority`). Make sure to allow network access from anywhere (`0.0.0.0/0`).

---

### Option 1: 1-Click Blueprint Deployment (Recommended)

This repository includes a `render.yaml` blueprint that deploys:
1. **Backend Web Service** (Dockerized Express container on Render free plan)
2. **Frontend Static Site** (Fast CDN-backed React SPA with free SSL and automatic routing)

**Steps:**
1. Commit and push your code to your GitHub repo.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** &rarr; **Blueprint**.
3. Select your repository.
4. Render will parse `render.yaml` and configure both services automatically.
5. In the configuration screen, supply your **`MONGODB_URI`** from MongoDB Atlas.
6. Click **Apply**. Render will automatically build the backend Docker container, build the frontend SPA, and interconnect their URLs!

---

### Option 2: Manual Step-by-Step Render Deployment

#### Step A: Deploy Backend (Docker Web Service)
1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `hospital-backend`
   - **Language**: `Docker`
   - **Dockerfile Path**: `./server/Dockerfile`
   - **Docker Context**: `./server`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`
4. Add **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `5000` (Render will inject its own port dynamically or use 5000)
   - `MONGODB_URI` = `<your-mongodb-atlas-connection-string>`
   - `JWT_ACCESS_SECRET` = `<generate-secure-random-32-char-string>`
   - `JWT_REFRESH_SECRET` = `<generate-secure-random-32-char-string>`
   - `JWT_ACCESS_EXPIRES_IN` = `15m`
   - `JWT_REFRESH_EXPIRES_IN` = `7d`
   - `FRONTEND_URL` = `https://<your-frontend-subdomain>.onrender.com` *(update after creating frontend)*
5. Click **Create Web Service**. Note the deployed URL (e.g., `https://hospital-backend.onrender.com`).

#### Step B: Deploy Frontend (Static Site - 100% Free & No Sleep)
1. In Render Dashboard, click **New +** &rarr; **Static Site**.
2. Connect the same repository.
3. Configure settings:
   - **Name**: `hospital-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL` = `https://hospital-backend.onrender.com/api`
   - `VITE_WS_URL` = `https://hospital-backend.onrender.com`
5. In **Redirects / Rewrites** tab:
   - Add Rewrite Rule: `/*` &rarr; `/index.html` (Status: `Rewrite`). This enables client-side React Router navigation without 404s.
6. Click **Create Static Site**.
7. Copy the frontend URL (e.g. `https://hospital-frontend.onrender.com`), go back to your **Backend Web Service** environment variables, set `FRONTEND_URL` to this URL, and click **Save Changes**.

---

## 📄 License
ISC
