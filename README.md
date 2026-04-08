# nexus-study

## Quick local run

1. Backend env:

```powershell
Copy-Item .env.example .env
```

2. Start backend:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Frontend env:

```powershell
Copy-Item web/.env.example web/.env.local
```

4. Start frontend:

```powershell
cd web
npm install
npm run dev
```

Notes:
- `study-materials` now works even if Supabase keys are missing (no cache persistence in that case).
- `matching` needs Redis (`REDIS_URL`) to pair peers in real time.

## Redis-backed matching engine

Set Redis URL (optional, defaults to `redis://localhost:6379/0`):

```powershell
$env:REDIS_URL="redis://localhost:6379/0"
```

### WebSocket matching

- Endpoint: `ws://localhost:8000/api/v1/matching/ws`
- Client message:

```json
{
	"action": "find_match",
	"user_id": "123",
	"subject": "Data Structures"
}
```

- Queue acknowledgement:

```json
{
	"status": "queued",
	"subject": "Data Structures"
}
```

- Match event:

```json
{
	"status": "matched",
	"peer_id": "456",
	"room_id": "<uuid>",
	"subject": "Data Structures"
}
```

### WebRTC signaling endpoints

- `POST /api/v1/matching/signaling/offer`
- `POST /api/v1/matching/signaling/answer`
- `POST /api/v1/matching/signaling/ice-candidate`

Common fields:

```json
{
	"room_id": "<room-uuid>",
	"from_user_id": "123",
	"to_user_id": "456"
}
```

Offer/answer payload example:

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

ICE candidate payload example:

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

Signaling messages are delivered to the recipient's WebSocket as:

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

