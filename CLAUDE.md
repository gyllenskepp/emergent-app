# CLAUDE.md — BORKA App Codebase Guide

This file provides AI assistants with the context needed to work effectively in this repository.

---

## Project Overview

**BORKA** is a mobile + web app for a Swedish board game and roleplay association. It provides event management, a news feed, calendar integration, and member profiles.

- **Stack**: FastAPI (Python) backend + React Native (Expo) frontend
- **Platforms**: iOS, Android, Web (via Expo)
- **Language**: UI strings are in Swedish (e.g., *Logga in*, *Kalender*, *Nyheter*)
- **Database**: MongoDB (async via Motor)

---

## Repository Layout

```
emergent-app/
├── backend/
│   ├── server.py           # Entire FastAPI application (~955 lines, single file)
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Backend environment variables (not committed)
│   └── runtime.txt         # Python 3.12.8
├── frontend/
│   ├── app/                # Expo Router file-based routes
│   │   ├── (tabs)/         # Bottom tab screens
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx   # Start (home) tab
│   │   │   ├── calendar.tsx
│   │   │   ├── news.tsx
│   │   │   ├── info.tsx
│   │   │   └── profile.tsx
│   │   ├── admin/          # Admin-only screens
│   │   │   ├── events.tsx
│   │   │   └── news.tsx
│   │   ├── event/[id].tsx  # Event detail (dynamic route)
│   │   ├── news/[id].tsx   # News detail (dynamic route)
│   │   ├── _layout.tsx     # Root layout
│   │   ├── login.tsx       # Login screen
│   │   └── +html.tsx       # Web HTML wrapper
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Zustand stores (authStore, dataStore)
│   │   ├── hooks/          # Custom React hooks
│   │   └── constants/      # App-wide constants
│   ├── assets/             # Images and fonts
│   ├── package.json
│   └── tsconfig.json
├── backend_test.py         # Backend API tests (HTTP requests)
├── backend_auth_test.py    # Authentication flow tests
├── test_result.md          # Agent testing communication protocol
└── tests/                  # Python test package
```

---

## Technology Stack

### Backend (Python 3.12.8)

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.110.1 | REST API framework |
| Uvicorn | 0.25.0 | ASGI server |
| Motor | 3.3.2 | Async MongoDB driver |
| PyMongo | 4.6.3 | MongoDB utilities |
| bcrypt | 4.1.3 | Password hashing |
| exponent-server-sdk | 2.2.0 | Expo push notifications |
| httpx | 0.28.1 | Async HTTP client |
| python-dotenv | 1.2.1 | Environment variable loading |
| python-multipart | 0.0.22 | Form data parsing |

### Frontend (React 19.1.0 / React Native 0.81.5)

| Package | Version | Purpose |
|---|---|---|
| Expo | 54.0.33 | React Native toolchain |
| expo-router | 6.0.22 | File-based routing |
| Zustand | 5.0.11 | State management |
| AsyncStorage | 2.2.0 | Persistent local storage |
| date-fns | 4.1.0 | Date formatting (Swedish locale `sv`) |
| expo-notifications | 0.32.16 | Push notifications |
| expo-calendar | 15.0.8 | Native calendar integration |
| TypeScript | 5.9.3 | Strict mode enabled |

**Package manager**: Yarn 1.22.22 (enforced via `packageManager` field)

---

## Development Workflows

### Running the Backend

```bash
cd backend
uvicorn server:app --reload
```

Environment variables required in `backend/.env`:
```
MONGO_URL=<MongoDB connection string>
DB_NAME=<database name>
ADMIN_EMAIL=admin@borka.se
ADMIN_PASSWORD=borka2024
ADMIN_EMAILS=admin@borka.se
```

On startup, `server.py` automatically seeds the database with:
- Default admin user (`admin@borka.se` / `borka2024`)
- 4 event categories (Öppen spelkväll, Medlemskväll, Turnering, Specialevent)
- Sample events and news items

### Running the Frontend

```bash
cd frontend
yarn install
yarn start          # Expo development server
yarn web            # Web-only dev server
yarn android        # Android emulator
yarn ios            # iOS simulator
yarn lint           # ESLint
```

Environment variables in `frontend/.env`:
```
EXPO_PUBLIC_BACKEND_URL=<API URL>
EXPO_TUNNEL_SUBDOMAIN=borka-mobile-dev
EXPO_PACKAGER_HOSTNAME=https://borka-mobile-dev.preview.emergentagent.com
EXPO_USE_FAST_RESOLVER=1
```

### Running Tests

```bash
cd /home/user/emergent-app
python backend_test.py
python backend_auth_test.py
```

Tests make direct HTTP requests against the running backend. The target URL is hardcoded to `https://borka-mobile-dev.preview.emergentagent.com/api`.

---

## API Structure

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | Email + password login |
| POST | `/auth/register` | None | Create account |
| POST | `/auth/session` | None | Emergent OAuth session exchange |
| GET | `/auth/me` | Bearer | Get current user |
| POST | `/auth/logout` | Bearer | Invalidate session |

**Auth flow**: Client sends `Authorization: Bearer <session_token>` header. Token is stored in `AsyncStorage` under key `session_token`.

### Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/events` | None | List events (optional `?category=slug`) |
| GET | `/events/{id}` | None | Single event |
| POST | `/events` | Admin | Create event |
| PUT | `/events/{id}` | Admin | Update event |
| DELETE | `/events/{id}` | Admin | Delete event |

### News

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/news` | None | List news |
| GET | `/news/{id}` | None | Single news item |
| POST | `/news` | Admin | Create news |
| PUT | `/news/{id}` | Admin | Update news |
| DELETE | `/news/{id}` | Admin | Delete news |

### Other Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/categories` | None | List event categories |
| GET | `/calendar/ics` | None | Full calendar as ICS file |
| GET | `/calendar/event/{id}/ics` | None | Single event as ICS |
| GET | `/users/me` | Bearer | Get user profile |
| PUT | `/users/me` | Bearer | Update user profile |
| PUT | `/users/me/push-token` | Bearer | Update push token |
| POST | `/admin/users` | Admin | Create user |

---

## Data Models

### User

```python
{
  "user_id": "user_<uuid>",
  "email": "user@example.com",
  "name": "Full Name",
  "role": "admin" | "member" | "guest",
  "phone": null,
  "notification_preferences": {
    "enabled": false,
    "categories": {
      "open_game_night": false,
      "member_night": false,
      "tournament": false,
      "special_event": false,
      "news": false
    },
    "reminder_times": ["24h"]  # "24h", "3h", "1h"
  },
  "push_token": null,
  "created_at": "<ISO 8601 UTC>"
}
```

### Event

```python
{
  "id": "<uuid>",
  "title": "Event Title",
  "description": "...",
  "start_time": "<ISO 8601 UTC>",
  "end_time": "<ISO 8601 UTC>",
  "location": "Location Name",
  "category_id": "<uuid>",
  "category_slug": "open_game_night",
  "created_at": "<ISO 8601 UTC>"
}
```

### Event Category Slugs (fixed)

- `open_game_night` — Öppen spelkväll
- `member_night` — Medlemskväll
- `tournament` — Turnering
- `special_event` — Specialevent

---

## Database (MongoDB)

### Collections

| Collection | Description |
|---|---|
| `users` | User accounts |
| `events` | Events with times and categories |
| `news` | News articles |
| `categories` | Event category definitions |
| `user_sessions` | Session tokens (7-day TTL) |

### ID Conventions

- All IDs are UUID strings (not MongoDB `_id` ObjectIds)
- Pattern: `user_<uuid>`, `session_<uuid>`, `event_<uuid>`, `news_<uuid>`, `cat_<uuid>`
- MongoDB `_id` is always excluded from responses

### Timestamps

All timestamps are ISO 8601 strings in UTC timezone.

---

## Frontend Architecture

### State Management (Zustand)

Two stores in `frontend/src/stores/`:

- **`authStore`**: Authentication state — current user, session token, login/logout methods
- **`dataStore`**: App data — events list, news list, categories, fetch methods

### Routing (Expo Router)

File-based routing under `frontend/app/`:
- `(tabs)/` — Tab group: index, calendar, news, info, profile
- `admin/` — Protected admin screens
- `event/[id].tsx` — Dynamic event detail
- `news/[id].tsx` — Dynamic news detail
- `_layout.tsx` files define navigation wrappers

### Authentication Guard

Admin routes require `role === "admin"`. Unauthenticated users are redirected to the login screen. Session token is persisted in `AsyncStorage` under key `session_token`.

---

## Code Conventions

### Naming

| Item | Convention | Example |
|---|---|---|
| React components | PascalCase | `EventCard`, `FilterChips` |
| Component files | kebab-case | `event-card.tsx` |
| Python files | snake_case | `server.py` |
| Category slugs | snake_case | `open_game_night` |
| TypeScript interfaces | PascalCase | `Event`, `User`, `NewsItem` |

### Backend Patterns

- All handlers use `async/await`
- Pydantic models for request/response validation
- Section comments mark logical areas in `server.py`: `# ==================== MODELS ====================`
- Error messages are written in **Swedish** (e.g., `"Felaktigt lösenord"`)
- Passwords hashed with bcrypt; never stored in plaintext
- CORS is whitelist-based (Vercel + localhost origins)

### Frontend Patterns

- Optional chaining (`?.`) for safe property access
- Ternary expressions for conditional rendering
- `date-fns` with Swedish locale (`sv`) for all date formatting
- API base URL read from `EXPO_PUBLIC_BACKEND_URL` env var
- Error handling via try-catch in store methods, with console logging

### TypeScript

- Strict mode enabled in `tsconfig.json`
- Path alias `@/*` maps to the repo root
- All data structures have TypeScript interfaces

---

## Testing Protocol

This repo uses a structured agent communication protocol via `test_result.md`. When a main agent implements a feature:

1. Update `test_result.md` with implementation details and `needs_retesting: true`
2. Delegate testing to the testing sub-agent
3. Testing agent updates `working: true/false` and appends to `status_history`

Do not modify the header block in `test_result.md` (lines 1–97 are protected).

---

## Security Notes

- Passwords are hashed with bcrypt before storage
- Sessions expire after 7 days
- CORS origins are explicitly whitelisted — do not use `allow_origins=["*"]`
- Bearer token auth via `Authorization` header
- Admin-only endpoints check `user.role == "admin"` on every request
- Do not commit `.env` files

---

## Deployment

- **Preview URL**: `https://borka-mobile-dev.preview.emergentagent.com`
- **Docker image**: `expo_mongo_base_image_cloud_arm:release-13022026-1`
- **Config**: `.emergent/emergent.yml`
- Frontend is deployable to Web via Expo Web, and to stores via Expo build
- No GitHub Actions CI/CD is configured

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `backend/server.py` | Entire backend (FastAPI, models, routes, seeding) |
| `backend/requirements.txt` | Python dependencies |
| `frontend/app/(tabs)/_layout.tsx` | Bottom tab navigation layout |
| `frontend/app/(tabs)/index.tsx` | Home (Start) screen |
| `frontend/app/(tabs)/calendar.tsx` | Calendar screen |
| `frontend/src/stores/authStore.ts` | Authentication state |
| `frontend/src/stores/dataStore.ts` | Events/news/categories state |
| `frontend/package.json` | Node dependencies and scripts |
| `test_result.md` | Agent testing state and communication |
