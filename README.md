# Bus Ticket Booking System

A full-stack web application for booking bus tickets with secure authentication, role-based access control, and a modern responsive UI.

**Status:** MVP v1.0 - Authentication Complete ✅

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Environment Setup](#environment-setup)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

### ✅ Implemented (v1.0)

- **User Authentication**

  - Email/password registration and login
  - Google OAuth 2.0 integration
  - Secure JWT token management
  - Refresh token rotation
  - Session persistence

- **Role-Based Access Control**

  - PASSENGER: Standard user with booking capabilities
  - ADMIN: Administrative access to system controls
  - Frontend route protection
  - Backend endpoint authorization

- **Responsive Dashboard**

  - Summary metrics (bookings, occupancy, revenue)
  - Activity log for system events
  - Role-specific widgets (Admin-only stats)
  - Real-time data updates

- **Security**
  - Password hashing (BCrypt)
  - HttpOnly cookies for refresh tokens
  - CORS protection
  - SQL injection prevention
  - XSS protection

### 🔄 Planned (v2.0+)

See [NEXT_STEPS.md](./NEXT_STEPS.md) for detailed roadmap

- Bus catalog and route search
- Booking management system
- Payment processing (MoMo, bank transfer, Stripe)
- Admin analytics and reporting
- Email/SMS notifications

---

## Tech Stack

### Backend

- **Framework:** Spring Boot 4.0.0
- **Language:** Java 21
- **Database:** PostgreSQL 15.15
- **Cache:** Redis 6.3.0
- **Authentication:** Spring Security 7.0.0, JWT (HS256)
- **Build:** Maven 3.8.1
- **ORM:** Hibernate 7.1.8
- **Migrations:** Flyway 10.x

### Frontend

- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4
- **Language:** TypeScript 5.6.2
- **State Management:** Zustand 5.0.8
- **Router:** React Router 7.9.6
- **UI Components:** Custom + Tailwind CSS 3.4.1
- **HTTP Client:** Axios
- **Testing:** Vitest, React Testing Library

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Java 21** (for backend)
- **Docker** & **Docker Compose** (for PostgreSQL + Redis)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/NgocAnhDo26/bus-ticket-booking-system.git
cd bus-ticket-booking-system
```

### 2. Start Infrastructure (Docker)

```bash
docker-compose up -d
# Starts PostgreSQL (port 5432) and Redis (port 6379)
```

### 3. Backend Setup

```bash
cd backend

# Copy environment file
cp application.properties.example src/main/resources/application.properties

# Edit application.properties with your settings
# ⚠️ At minimum, set:
# - spring.datasource.password
# - jwt.secret
# - google.client-id

# Run backend
./mvnw spring-boot:run
# Backend available at http://localhost:8081
```

### 4. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your settings
# ⚠️ At minimum, set:
# - VITE_API_URL=http://localhost:8081/api
# - VITE_GOOGLE_CLIENT_ID

# Install dependencies
npm install

# Start dev server
npm run dev
# Frontend available at http://localhost:5173
```

### 5. Test Login

**Test Credentials (already created in DB):**

```
Email: test4@example.com
Password: password123
Role: PASSENGER
```

**Admin Account:**

```
Email: admin@example.com
Password: admin123
Role: ADMIN
```

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────┐
│            Browser (React App)                  │
│  http://localhost:5173                          │
│  ├─ Login/Register Pages                        │
│  ├─ Protected Routes (ProtectedRoute)           │
│  └─ Dashboard (with role-based widgets)         │
└─────────────────────────────────────────────────┘
                      ↕
          (HTTP/HTTPS + CORS)
                      ↕
┌─────────────────────────────────────────────────┐
│    Spring Boot API (Java 21)                    │
│  http://localhost:8081                          │
│                                                 │
│  ├─ /api/auth/* (public)                        │
│  │  ├─ POST /register                           │
│  │  ├─ POST /login                              │
│  │  ├─ POST /google                             │
│  │  ├─ POST /refresh                            │
│  │  └─ POST /logout                             │
│  │                                              │
│  ├─ /api/users/* (authenticated)                │
│  │  ├─ GET /me (current user)                   │
│  │  └─ PUT /profile                             │
│  │                                              │
│  └─ /api/dashboard/* (role-based)               │
│     ├─ GET /summary (all authenticated)         │
│     └─ GET /admin/stats (@PreAuthorize ADMIN)   │
│                                                 │
│  [Spring Security + JWT + Method-Level Auth]    │
└─────────────────────────────────────────────────┘
          ↕                      ↕
    PostgreSQL              Redis Cache
    (Port 5432)            (Port 6379)
    - Users               - Sessions
    - Bookings            - Cache
    - Transactions
```

### Folder Structure

```
backend/
├── src/main/java/com/awad/ticketbooking/
│   ├── TicketbookingApplication.java      # Entry point
│   ├── common/
│   │   ├── config/                        # Security, JWT, CORS configs
│   │   ├── exception/                     # Global error handling
│   │   ├── model/                         # Shared models (ApiResponse, BaseEntity)
│   │   └── utils/                         # Utilities
│   └── modules/
│       ├── auth/                          # Authentication module
│       │   ├── controller/
│       │   ├── service/
│       │   ├── entity/
│       │   └── dto/
│       └── dashboard/                     # Dashboard module
│           ├── controller/
│           └── dto/
└── src/main/resources/
    ├── application.properties             # Configuration
    └── db/migration/                      # Flyway SQL migrations

frontend/
├── src/
│   ├── app/
│   │   ├── router.tsx                     # Route definitions
│   │   └── providers.tsx                  # Context providers
│   ├── features/
│   │   ├── auth/                          # Authentication UI
│   │   │   ├── pages/ (Login, Register)
│   │   │   ├── components/
│   │   │   ├── hooks.ts
│   │   │   └── api.ts
│   │   └── dashboard/
│   │       ├── pages/
│   │       ├── components/
│   │       └── api.ts
│   ├── components/
│   │   ├── common/                        # ProtectedRoute, PublicRoute
│   │   ├── layout/                        # App shell, sidebars
│   │   └── ui/                            # Reusable UI components
│   ├── store/
│   │   └── auth-store.ts                  # Zustand auth store
│   ├── lib/
│   │   └── api-client.ts                  # Axios config with JWT
│   └── hooks/
│       └── use-theme.tsx
├── .env.example                           # Environment template
└── index.html
```

---

## Authentication & Authorization

### Token Storage & Refresh Flow

**Access Token (JWT)**

- **Type:** HS256 signed JWT
- **Expiration:** 30 minutes (configurable)
- **Storage:** localStorage (Zustand store)
- **Header:** Automatically added to all requests via Axios interceptor
- **Format:** `Authorization: Bearer <token>`

**Refresh Token**

- **Type:** UUID stored in database
- **Expiration:** 7 days (configurable)
- **Storage:** HttpOnly cookie (secure, not accessible via JavaScript)
- **Purpose:** Used to obtain new access tokens without re-login

**How Refresh Works:**

1. Access token expires (401 response)
2. Axios response interceptor catches 401
3. Automatically calls `/api/auth/refresh` with refresh token cookie
4. Backend returns new access token
5. Original request retried with new token
6. If refresh fails, user redirected to login

### Role-Based Access Control

**Frontend Protection:**

```tsx
// ProtectedRoute checks user role before rendering
<ProtectedRoute allowGuests={false}>
  <AdminPanel /> // Only renders if user.role === 'ADMIN'
</ProtectedRoute>
```

**Backend Protection:**

```java
@GetMapping("/admin/stats")
@PreAuthorize("hasRole('ADMIN')")  // Enforced at method level
public ApiResponse<Map> getAdminStats() {
  // Only ADMIN users can access
}
```

**Roles:**
| Role | Permissions |
|------|------------|
| PASSENGER | View dashboard, Browse routes, Book tickets, View own bookings |
| ADMIN | All PASSENGER + view admin stats, manage users, view all bookings, handle refunds |

### Login Flow

```
1. User enters email + password on /login
   ↓
2. Frontend calls POST /api/auth/login
   ↓
3. Backend validates credentials
   ├─ ✓ Valid: Generate JWT + save refresh token
   └─ ✗ Invalid: Return 401 error
   ↓
4. Response contains:
   - status: 200
   - data: {
       accessToken: "eyJ...",
       user: { id, email, role, ... }
     }
   - Set-Cookie: refresh_token=<uuid> (HttpOnly)
   ↓
5. Frontend:
   - Calls setAuth() → saves to localStorage
   - Saves refresh token cookie (browser automatic)
   - Navigates to /dashboard
```

### Google OAuth Flow

```
1. User clicks "Sign in with Google" button
   ↓
2. Google login popup opens
   ↓
3. User authenticates with Google account
   ↓
4. Frontend receives ID token credential
   ↓
5. Frontend calls POST /api/auth/google with credential
   ↓
6. Backend:
   - Verifies token with Google
   - Finds or creates user (matches by email)
   - Generates JWT + refresh token
   ↓
7. Same response as email/password login
   ↓
8. Frontend navigates to dashboard
```

---

## Environment Setup

### Backend (`application.properties`)

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/ticket_booking
spring.datasource.username=postgres
spring.datasource.password=<your-password>

# JWT
jwt.secret=<keep-this-secure-minimum-32-bytes>
jwt.access-token-expiration-minutes=30
jwt.refresh-token-expiration-days=7

# Google OAuth
google.client-id=<get-from-google-cloud-console>

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
```

**Get Google Client ID:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 Credential (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:8081`
   - `https://yourdomain.com` (for production)
6. Copy Client ID

### Frontend (`.env.local`)

```
VITE_API_URL=http://localhost:8081/api
VITE_GOOGLE_CLIENT_ID=<same-as-backend>
```

---

## Running Tests

### Frontend Tests

```bash
cd frontend

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Backend Tests

```bash
cd backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=AuthControllerTest

# Run with coverage
./mvnw test jacoco:report
```

**Note:** Backend tests require Docker to be running for PostgreSQL/Redis.

---

## Deployment

### Frontend Deployment (Netlify)

1. **Connect GitHub Repository**

   ```bash
   # Push code to GitHub
   git push origin main
   ```

2. **Connect to Netlify**

   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Click deploy

3. **Configure Environment**

   - Go to Site settings → Environment
   - Add variables:
     - `VITE_API_URL`: Your backend URL
     - `VITE_GOOGLE_CLIENT_ID`: Your Google client ID

4. **Update Google OAuth**
   - Add `https://your-netlify-domain.netlify.app` to Google Cloud Console authorized origins

**Frontend URL:** `https://your-app.netlify.app`

### Backend Deployment (Railway)

1. **Create Railway Account**

   - Go to [Railway.app](https://railway.app)
   - Sign in with GitHub

2. **Deploy from GitHub**

   - Click "Create a new project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Configure environment variables:
     - `SPRING_DATASOURCE_URL`: Railway PostgreSQL URL
     - `SPRING_DATASOURCE_USERNAME`: `postgres`
     - `SPRING_DATASOURCE_PASSWORD`: Generated password
     - `JWT_SECRET`: Generate secure random string
     - `GOOGLE_CLIENT_ID`: Your Google OAuth ID
     - `SPRING_DATA_REDIS_HOST`: Railway Redis host
     - `SPRING_DATA_REDIS_PORT`: 6379

3. **Add PostgreSQL & Redis**

   - In Railway dashboard, click "Add service"
   - Select PostgreSQL → Add
   - Select Redis → Add
   - Variables are auto-populated

4. **Deploy**
   - Railway auto-deploys on push to main
   - Check Deployments tab for status

**Backend URL:** `https://your-app.railway.app`

### GitHub Actions Automation

The repo ships with `.github/workflows/deploy.yml` to automate production pushes:

1. **Triggers**
   - Automatic on every push to `main`.
   - Manual from the *Actions* tab (`Deploy to Production` workflow) with toggles to deploy backend and/or trigger Vercel.

2. **What happens**
   - Builds the Spring Boot JAR with Maven and uploads it as an artifact.
   - Securely copies the JAR to your EC2 box, moves it into `/opt/app`, and restarts the systemd service.
   - Calls your Vercel Deploy Hook so the latest commit is built with production env vars.

3. **Required GitHub secrets**
   - `EC2_HOST`: Public DNS or IP of the EC2 instance.
   - `EC2_USER`: SSH user with permission to restart the service (e.g. `ec2-user`).
   - `EC2_SSH_KEY`: Private key contents for the above user.
   - `EC2_DEPLOY_PATH`: Temporary upload directory on the instance (e.g. `/home/ec2-user/deploy`).
   - `EC2_SERVICE_NAME`: systemd unit name (`bus-ticket.service`).
   - `VERCEL_DEPLOY_HOOK_URL`: Deploy Hook URL from Vercel Project Settings.

   *(Optional)* Update the `JAR_NAME` value at the top of the workflow if the Maven artifact name changes.

4. **Server preparation**
   - Ensure `${EC2_DEPLOY_PATH}` exists and is writable by the SSH user.
   - `/opt/app` should contain the currently running jar and be writable by the service user.
   - `sudo systemctl restart $EC2_SERVICE_NAME` must succeed without a password.

5. **Monitoring**
   - Check the workflow run logs for SCP/SSH output.
   - Validate API health: `curl -I https://api.<domain>/api/health`.
   - Verify the Vercel deployment status from the Vercel dashboard.

---

## Troubleshooting

### Frontend can't connect to backend

**Problem:** `CORS error` or `Failed to fetch`

**Solutions:**

1. Verify backend is running on port 8081
2. Check `.env.local` has correct `VITE_API_URL`
3. Verify `SecurityConfig.java` includes `http://localhost:5173` in CORS allowed origins
4. Clear browser cache (Ctrl+Shift+Delete)

### Login returns 200 but no redirect

**Problem:** Successful response but page doesn't navigate to dashboard

**Solutions:**

1. Check browser console for errors
2. Verify token is saved to localStorage
3. Check React Router is correctly configured
4. Verify `useNavigate()` is working in login component

### "Google OAuth 403 - Origin not allowed"

**Problem:** Google login button shows error about unauthorized origin

**Solutions:**

1. Add `http://localhost:5173` to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Add to Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
5. Also add authorized redirect URIs if needed

### PostgreSQL connection refused

**Problem:** `Unable to connect to PostgreSQL`

**Solutions:**

1. Verify Docker is running: `docker ps`
2. Start containers: `docker-compose up -d`
3. Check database exists: `docker-compose exec postgres psql -U postgres -c "\l"`
4. Check port 5432 is not in use by another app

### Redis connection error

**Problem:** `Connection refused to Redis`

**Solutions:**

1. Verify Redis container is running: `docker-compose ps`
2. Restart Redis: `docker-compose restart redis`
3. Check port 6379 is free
4. View Redis logs: `docker-compose logs redis`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

---

## Project Structure Reference

See [docs/README-GA03.md](./docs/README-GA03.md) for detailed assignment requirements.

For planned features and roadmap, see [NEXT_STEPS.md](./NEXT_STEPS.md).

---

## License

This project is part of an academic assignment (Year 4, Semester 1).

**Last Updated:** November 26, 2025
