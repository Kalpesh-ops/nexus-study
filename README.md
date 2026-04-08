# Nexus Study

A full-stack peer-learning platform for students to:
- Sign in with Google (Supabase Auth)
- Find a real-time study partner by subject (Redis-backed matching)
- Connect over WebRTC video/audio signaling
- Generate subject-wise study material (flashcards + quiz)

This repository is a monorepo with:
- FastAPI backend in `app/`
- Next.js frontend in `web/`

## Table of Contents

1. [What This Project Includes](#what-this-project-includes)
2. [Architecture at a Glance](#architecture-at-a-glance)
3. [Tech Stack](#tech-stack)
4. [Repository Structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Local Setup (Recommended)](#local-setup-recommended)
7. [Environment Variables](#environment-variables)
8. [Run Commands](#run-commands)
9. [API Reference](#api-reference)
10. [WebSocket + Signaling Flow](#websocket--signaling-flow)
11. [Supabase Setup](#supabase-setup)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Current Limitations](#current-limitations)

## What This Project Includes

### 1) Google OAuth Login
- Frontend uses Supabase auth with Google provider.
- Optional domain restriction can enforce institutional emails.

### 2) Redis-backed Subject Matching
- Students join queue by subject over WebSocket.
- Matching engine pairs users and creates a room UUID.
- Events are distributed through Redis Pub/Sub.

### 3) WebRTC Signaling APIs
- Offer, answer, and ICE candidate routes are provided by backend.
- Signaling messages are pushed to recipient through active WebSocket.

### 4) Study Material Generation + Cache
- API returns flashcards and quiz questions by subject.
- If Supabase is configured, generated content is persisted/reused.
- If Supabase is missing, generation still works (without persistence).

## Architecture at a Glance

1. User signs in on Next.js frontend using Supabase OAuth.
2. User enters a subject and clicks Find Partner.
3. Frontend opens WebSocket to backend matching endpoint.
4. Backend enqueues user in Redis per normalized subject queue.
5. When two users are available, backend creates room and emits match events.
6. Frontend peers exchange offer/answer/ICE via REST signaling endpoints.
7. Backend relays signaling payloads to recipient via WebSocket.
8. Study Hub requests study materials for the selected subject.

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- Uvicorn
- Redis (asyncio client)
- Supabase Python SDK
- HTTPX

### Frontend
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Supabase SSR client

## Repository Structure

```text
.
├─ app/
│  ├─ main.py                      # FastAPI app bootstrap + router mounting
│  ├─ core/
│  │  ├─ config.py                 # Supabase client initialization
│  │  ├─ study_materials_generation.py
│  │  └─ safe_browsing.py          # Optional URL safety checks utility
│  └─ routers/
│     ├─ auth.py
│     ├─ jitsi.py
│     ├─ matching.py
│     └─ study_materials.py
├─ web/
│  ├─ src/app/                     # Next.js pages/routes
│  ├─ src/components/              # UI components
│  ├─ src/lib/                     # WebRTC hook + Supabase helpers
│  └─ src/actions/                 # Server actions (auth)
├─ DEPLOY_30MIN.md                 # Fast deployment checklist
├─ pyproject.toml                  # Backend dependencies
└─ package.json                    # Monorepo scripts (frontend proxy)
```

## Prerequisites

- Python 3.11+
- Node.js 18+ (recommended 18 or 20)
- npm 9+
- Redis (local, Docker, Upstash, or Redis Cloud)
- Supabase project (optional for local demo, required for full auth/cache)

## Local Setup (Recommended)

### 1) Clone and install backend deps

```powershell
git clone <your-repo-url>
cd nexus-study
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
```

### 2) Configure backend env

```powershell
Copy-Item .env.example .env
```

Fill values in `.env` (see environment section below).

### 3) Install frontend deps and configure frontend env

```powershell
npm install
Copy-Item web/.env.example web/.env.local
npm --prefix web install
```

### 4) Start backend

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5) Start frontend (new terminal)

```powershell
npm --prefix web run dev
```

App URLs:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Environment Variables

## Backend (`.env`)

Start from `.env.example`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_KEY=
REDIS_URL=redis://localhost:6379/0
GOOGLE_SAFE_BROWSING_API_KEY=
CORS_ORIGINS=http://localhost:3000
JITSI_BASE_URL=https://meet.jit.si
JITSI_DEFAULT_DISPLAY_NAME=Nexus Study User
```

Variable notes:
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Preferred backend key for DB access.
- `SUPABASE_KEY`: Legacy fallback key if service role is not provided.
- `REDIS_URL`: Matching engine storage + pub/sub endpoint.
- `GOOGLE_SAFE_BROWSING_API_KEY`: Optional; currently utility-level support.
- `CORS_ORIGINS`: Comma-separated allowed origins.
- `JITSI_BASE_URL`: Base URL used to generate Jitsi room links.
- `JITSI_DEFAULT_DISPLAY_NAME`: Display name returned by room API.

## Frontend (`web/.env.local`)

Start from `web/.env.example`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MATCHING_WS_URL=ws://localhost:8000/api/v1/matching/ws
ENFORCE_DOMAIN_RESTRICTION=true
ALLOWED_EMAIL_DOMAIN=@vitbhopal.ac.in
NEXT_PUBLIC_DEV_MODE=false
```

Variable notes:
- `NEXT_PUBLIC_SITE_URL`: Used for OAuth redirect URL composition.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase public URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Preferred public key.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Legacy fallback public key.
- `NEXT_PUBLIC_API_BASE_URL`: Backend API base.
- `NEXT_PUBLIC_MATCHING_WS_URL`: Optional explicit WS URL override.
- `ENFORCE_DOMAIN_RESTRICTION`: `true` to allow only configured email domain.
- `ALLOWED_EMAIL_DOMAIN`: Required suffix when enforcement is enabled.
- `NEXT_PUBLIC_DEV_MODE`: UI-only shortcut toggle.

## Run Commands

From project root:

```powershell
npm run dev      # Frontend dev (proxy to web)
npm run build    # Frontend production build
npm run start    # Frontend production start
npm run lint     # Frontend lint
```

Backend direct commands:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest
```

## API Reference

Base URL: `http://localhost:8000/api/v1`

## Health Routes

- `GET /` -> API root
- `GET /api/v1/auth/health`
- `GET /api/v1/jitsi/health`
- `GET /api/v1/matching/health`
- `GET /api/v1/study-materials/health`

## Jitsi

### Create Room
- Endpoint: `POST /api/v1/jitsi/create-room`
- Body:

```json
{
  "subject": "Data Structures"
}
```

- Response:

```json
{
  "room_name": "nexus-data-structures-a1b2c3d4",
  "room_url": "https://meet.jit.si/nexus-data-structures-a1b2c3d4",
  "display_name": "Nexus Study User"
}
```

## Study Materials

### Generate/Fetch by Subject
- Endpoint: `POST /api/v1/study-materials/generate`
- Body:

```json
{
  "subject": "Operating Systems"
}
```

- Response:

```json
{
  "subject": "Operating Systems",
  "flashcards": [
    {
      "question": "What is the first key concept of Operating Systems?",
      "answer": "This is a mock answer for the first concept of Operating Systems."
    }
  ],
  "quiz_questions": [
    {
      "question": "Which of the following best defines Operating Systems?",
      "options": [
        "Definition A of Operating Systems",
        "Definition B of Operating Systems",
        "Definition C of Operating Systems",
        "Definition D of Operating Systems"
      ],
      "correct_answer": "Definition A of Operating Systems"
    }
  ],
  "from_cache": false
}
```

## Matching (WebSocket)

### Connect
- Endpoint: `ws://localhost:8000/api/v1/matching/ws`

### Client -> Server: find match

```json
{
  "action": "find_match",
  "user_id": "123",
  "subject": "Data Structures"
}
```

### Server -> Client: queued

```json
{
  "status": "queued",
  "subject": "Data Structures"
}
```

### Server -> Client: matched

```json
{
  "status": "matched",
  "peer_id": "456",
  "room_id": "<uuid>",
  "subject": "Data Structures"
}
```

## Signaling (REST)

- `POST /api/v1/matching/signaling/offer`
- `POST /api/v1/matching/signaling/answer`
- `POST /api/v1/matching/signaling/ice-candidate`

Common envelope:

```json
{
  "room_id": "<room-uuid>",
  "from_user_id": "123",
  "to_user_id": "456"
}
```

Offer/Answer payload:

```json
{
  "room_id": "<room-uuid>",
  "from_user_id": "123",
  "to_user_id": "456",
  "sdp": {
    "type": "offer",
    "sdp": "v=0..."
  }
}
```

ICE payload:

```json
{
  "room_id": "<room-uuid>",
  "from_user_id": "123",
  "to_user_id": "456",
  "candidate": {
    "candidate": "candidate:...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

Signaling delivery event on recipient socket:

```json
{
  "status": "signal",
  "signal_type": "offer",
  "room_id": "<room-uuid>",
  "from_user_id": "123",
  "payload": {
    "sdp": {
      "type": "offer",
      "sdp": "v=0..."
    }
  }
}
```

## WebSocket + Signaling Flow

1. User A and User B call `find_match` for same subject.
2. Backend matches users and sends `matched` to both.
3. Initiator creates SDP offer and posts `/signaling/offer`.
4. Receiver gets WebSocket `signal` event and posts `/signaling/answer`.
5. Both peers exchange ICE through `/signaling/ice-candidate`.
6. When ICE/SDP settle, peer connection transitions to connected.

## Supabase Setup

### Auth setup

In Supabase dashboard:
- Enable Google provider.
- Configure Site URL and redirect URLs:
  - `http://localhost:3000`
  - `http://localhost:3000/auth/callback`

### Optional table for study materials cache

```sql
create table if not exists public.study_materials (
  id bigint generated by default as identity primary key,
  subject text not null unique,
  flashcards jsonb not null default '[]'::jsonb,
  quiz_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
```

## Deployment

Quick deployment checklist is available in `DEPLOY_30MIN.md`.

### Frontend (Vercel)
- Root directory: `web`
- Build command: `npm run build`
- Start command: `npm run start`
- Add all frontend env variables in project settings.

### Backend (Railway / Render / Fly)
- Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- Add backend env variables.
- Ensure Redis is reachable from backend network.

## Troubleshooting

### 1) OAuth redirects back with error
- Verify `NEXT_PUBLIC_SITE_URL`.
- Verify Supabase Site URL and callback URL exactly match.
- Check `ENFORCE_DOMAIN_RESTRICTION` and `ALLOWED_EMAIL_DOMAIN`.

### 2) Matching health says Redis disconnected
- Confirm `REDIS_URL` is valid and reachable.
- Restart backend after changing env.

### 3) Study materials fail with 500
- Check Supabase URL/key correctness.
- If Supabase is intentionally unset, generation still works but no persistence.

### 4) CORS errors from frontend
- Ensure frontend origin is included in `CORS_ORIGINS`.
- Use comma-separated values for multiple origins.

### 5) WebRTC connects but no media
- Verify camera/mic permissions in browser.
- Confirm local network/firewall allows WebRTC traffic.
- Consider TURN server for restrictive NAT scenarios (not included by default).

## Current Limitations

- Study materials are mock-generated (LLM integration not wired yet).
- Safe Browsing utility exists but is not fully integrated across all chat/message paths.
- TURN server configuration is not included; only public STUN servers are configured.

---

If you are preparing this for a hackathon demo, prioritize showing:
- OAuth login flow
- Real-time matching and signaling
- Study material generation + cache behavior
- Clear fallback behavior when optional services are missing
