# Bus Ticket Booking System — Assignment 1 Draft README

> _Draft authored on November 25, 2025 for GA03 submission. Replace or merge into the canonical `README.md` once finalized._

## Overview

This repository contains the Assignment 1 deliverable for the Advanced Web Development course. The milestone focuses on:

- End-to-end authentication (email/password + Google OAuth) with JWT access/refresh tokens.
- Role-aware authorization enforced in both the frontend (route guards/UI) and backend (security filters).
- A reusable design system (Tailwind theme tokens, layout primitives, dark mode) and a dashboard prototype with widgets wired to live APIs.
- Developer-quality practices: ESLint + Prettier + Husky, modular backend modules (`common`, `modules/auth`, `modules/dashboard`), and Dockerized infra (Postgres + Redis).

## Project Structure

```
├── backend/                     # Spring Boot 4 (Java 21)
│   ├── src/main/java/com/awad/ticketbooking/
│   │   ├── common/              # Config, exception handling, shared models
│   │   └── modules/
│   │       ├── auth/            # Identity domain: controllers, services, repositories, entities
│   │       └── dashboard/       # Dashboard API
│   └── src/main/resources/db/   # Flyway migrations (Postgres)
├── frontend/                    # Vite + React + TS + Tailwind
│   └── src/
│       ├── app/                 # Router & Providers
│       ├── components/          # UI + layout primitives
│       ├── features/            # Auth/dashboard feature modules
│       └── store/lib/hooks      # Zustand, API client, shared hooks
├── docs/                        # Implementation plan, future design assets
└── docker-compose.yml           # Postgres + Redis services for local dev
```

## Prerequisites

- Node.js 20+
- Java 21 + Maven Wrapper (`backend/mvnw`)
- Docker (for `postgres` & `redis` services)
- Google Cloud project for OAuth (Web application client ID)

## Environment Variables

Create the following files (or use `.env.example` once added):

### `frontend/.env`

```
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### `backend/.env` (or via system props)

```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ticket_booking
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=busticketpwd
JWT_SECRET=update-with-32-byte-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

> The backend already defaults most values in `application.properties`; overriding through env vars is recommended for deployment.

## Running Locally

1. **Infra**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Frontend dev server listens on `http://localhost:5173`, backend on `http://localhost:8080`.

## Authentication & Authorization Design

- **Tokens**: Access token (JWT, 30 min) issued in response body; refresh token (UUID) stored in Postgres and delivered via HTTP-only cookie (`refresh_token`, 7 days). On access token expiry, frontend calls `/api/auth/refresh`, backend verifies refresh token, rotates it, and sends new access token + cookie.
- **Roles**: `PASSENGER` (default) and `ADMIN`. Spring Security adds `ROLE_<role>` authorities; the frontend Zustand store exposes the role for conditional UI rendering. Dashboard widgets can toggle content based on role (e.g., admin “Upcoming operations” panel).
- **Route Protection**: Frontend `PublicRoute` / `ProtectedRoute` wrappers guard the router. Backend `SecurityConfig` requires authentication for everything outside `/api/auth/**` and `/api/health`.

## Frontend Features

- **Theme system**: Tailwind configured with CSS variables (colors, typography, spacing). Dark mode toggle persists preference.
- **Reusable primitives**: `Button`, `Card`, `FormField`, `AppShell`, etc.
- **Auth pages**: Login/Register with React Hook Form + Zod validation, Google login via `@react-oauth/google`.
- **Dashboard**: Summary cards, activity feed, role widget. Data fetched via TanStack Query from `/api/dashboard/summary` (falls back to mock data if backend offline).

## Backend Features

- **Modules**
  - `modules/auth`: Controllers (`/api/auth`, `/api/users/me`), services (`AuthService`, `JwtService`, `RefreshTokenService`), JPA entities (`User`, `RefreshToken`), repositories, DTOs.
  - `modules/dashboard`: `/api/dashboard/summary` endpoint returning structured widget data.
- **Common layer**: JWT/Google configs, Redis template, Swagger (OpenAPI 3), global exception handler, response envelope + base entity.
- **Persistence**: Postgres (Flyway migrations create identity, catalog-ready tables). Redis reserved for future seat locking/session cache.

## Testing & Tooling

- **Linting**: `npm run lint` (frontend, ESLint flat config). Husky + lint-staged hooks run ESLint/Prettier on commit.
- **Backend build**: `./mvnw -DskipTests package` for CI. Full tests require Postgres; plan to add Testcontainers profile.
- **Future Work**: Add Vitest unit tests, backend integration tests, and `NEXT_STEPS.md` outlining catalog/booking/chatbot roadmap.

## Deployment Plan

| Layer    | Target Service            | Notes                                  |
|----------|---------------------------|----------------------------------------|
| Frontend | Vercel / Netlify          | `npm run build` → static deploy        |
| Backend  | Railway / Render / Fly.io | Requires Postgres + Redis add-ons      |
| Database | Managed Postgres          | Use Flyway migrations on startup       |
| Redis    | Managed Redis             | For future seat-locking/notifications  |

> Live URLs will be added once deployment is complete.

## Decisions & Trade-offs

- **Monorepo** for shared scripts and easier DevEx; backend & frontend kept separate inside repo.
- **JWT + refresh token** rather than server sessions to align with SPA requirements and future mobile clients.
- **Spring Boot Modules**: `common` + `modules/*` pattern prepares us for future microservice migration (catalog, booking, payment).
- **TanStack Query + Zustand**: Query handles caching/async states; Zustand stores only auth/session data to keep state minimal.
p-ItalicsIFE**
## Roadmap

- `/design` mockups + `NEXT_STEPS.md`
- Catalog search + seat selection UI
- Booking/payment modules (with Redis seat locks, PayOS integration)
- Notification service (email/SMS)
- Chatbot integration (LLM tool-calling over backend APIs)

