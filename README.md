# Coding Clash Arena

A real-time, AI-judged competitive coding platform. Two players join a room, write
solutions to the same problem in an in-browser Monaco editor, and OpenAI evaluates
both submissions on correctness, edge cases, readability, and efficiency. Spectators
watch the code being typed live and see AI avatar commentary on each submission.

> **Stack:** React 18 · Node.js · Express · MongoDB (Mongoose) · Socket.io · OpenAI · JWT · bcryptjs

---

## Features (implemented)

- Email + password registration and login, JWT-secured sessions (`backend/controllers/authController.js`, `backend/middleware/auth.js`).
- Three user roles — admin, player, spectator — with **route-level access control** for every protected endpoint (`backend/middleware/auth.js`, `backend/routes/roomRoutes.js`).
- Admin panel to create and delete rooms with custom problem statements and difficulty (`backend/controllers/roomController.js`, `frontend/src/pages/Admin.js`).
- 8-character unique room codes, max 2 players, unlimited spectators (`backend/models/Room.js`).
- Monaco code editor with JavaScript, Python, and Java starter templates (`frontend/src/pages/Room.js`).
- OpenAI-powered evaluation returning `accuracy` (0–100) and `feedback` (`backend/services/aiJudge.js`).
- Live spectator mode — code is broadcast as it is typed via Socket.io (`backend/server.js`, `frontend/src/pages/Room.js`).
- AI avatar commentary generated after each submission (`backend/services/aiJudge.js`).
- Final result screen with winner, accuracy scores, and per-player feedback.
- Per-user win/loss tracking persisted in MongoDB (`backend/models/User.js`).
- Input validation, request rate limiting, and bcrypt-hashed passwords (`backend/middleware/`).
- Unit tests for auth, room logic, and the AI judge service (`backend/__tests__/`).

---

## Quick Start

### Prerequisites

- Node.js v16+
- MongoDB v5+ (local or Atlas)
- OpenAI API key

### Backend

```bash
cd backend
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm install
npm test                  # runs the Jest test suite
npm run dev               # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start                 # starts on http://localhost:3000
```

The first admin account is **not** auto-created — register a normal account, then
promote it to admin in MongoDB (`db.users.updateOne({email:"..."}, {$set:{role:"admin"}})`).
This avoids shipping default credentials.

---

## Architecture

Three-tier client-server with an external AI service:

```
┌──────────────┐   HTTP + WebSocket    ┌─────────────────┐   HTTPS    ┌──────────┐
│  React SPA   │ ───────────────────▶ │  Node + Express │ ─────────▶ │  OpenAI  │
│  (Monaco,    │                       │  + Socket.io    │            └──────────┘
│  Socket.io)  │ ◀─────── events ──── │                 │
└──────────────┘                       └───────┬─────────┘
                                               │ Mongoose
                                               ▼
                                        ┌──────────────┐
                                        │   MongoDB    │
                                        └──────────────┘
```

- **Presentation:** React SPA, route-level auth gates (`frontend/src/components/ProtectedRoute.js`).
- **Application:** Express REST + Socket.io for `code-update`, `submission-received`, `match-completed`.
- **Data:** Mongoose schemas for `User` and `Room` (with embedded `submissions`).
- **AI service:** `backend/services/aiJudge.js` wraps two OpenAI calls — evaluation + commentary.

### Folder layout

```
backend/
  config/        DB connection
  controllers/   business logic (auth, rooms)
  middleware/    JWT auth, role guards, rate limit, validation
  models/        Mongoose schemas
  routes/        Express routers
  services/      AI judge (OpenAI wrapper)
  __tests__/     Jest unit tests
  server.js      entry point
frontend/
  src/
    pages/       Home, Login, Register, Dashboard, Admin, Room
    components/  Navbar, AIAvatar, ProtectedRoute
    services/    Axios + Socket.io clients
    context/     AuthContext
    styles/      dark-theme CSS
```

---

## API Reference (summary)

| Method | Path | Auth | Role |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | — |
| POST | `/api/auth/login` | — | — |
| GET | `/api/rooms` | JWT | any |
| GET | `/api/rooms/:code` | JWT | any |
| POST | `/api/rooms` | JWT | **admin** |
| DELETE | `/api/rooms/:code` | JWT | **admin** |
| POST | `/api/rooms/:code/join` | JWT | player or spectator |
| POST | `/api/rooms/:code/submit` | JWT | **player only** |

---

## Testing

```bash
cd backend && npm test
```

The Jest suite covers password hashing, JWT issuing, the role guard middleware,
the room code generator, the winner-decision logic, and the AI judge fallback path.

---

## Security notes

- Passwords hashed with bcryptjs (10 salt rounds).
- All secrets read from environment variables; `.env` is gitignored.
- CORS locked to `CLIENT_URL`.
- Express rate limiter on `/api/auth/*` and `/api/rooms/*/submit`.
- Joi validation on every mutation endpoint.
- No code execution — submissions are evaluated by AI only, never run on the server.

---

## License

MIT.
