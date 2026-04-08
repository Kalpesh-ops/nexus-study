import asyncio
import json
import logging
import os
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from redis.asyncio import Redis

router = APIRouter(prefix="/matching", tags=["matching"])

MATCH_EVENTS_CHANNEL = "matching:events"
SIGNALING_EVENTS_CHANNEL = "matching:signaling"
USER_SUBJECT_HASH = "matching:user_subject"
USER_ROOM_HASH = "matching:user_room"

_redis: Redis | None = None
_pubsub_task: asyncio.Task | None = None
_active_connections: dict[str, WebSocket] = {}
_connections_lock = asyncio.Lock()
_logger = logging.getLogger(__name__)


class OfferPayload(BaseModel):
    room_id: str = Field(min_length=1)
    from_user_id: str = Field(min_length=1)
    to_user_id: str = Field(min_length=1)
    sdp: dict[str, Any] | str


class AnswerPayload(BaseModel):
    room_id: str = Field(min_length=1)
    from_user_id: str = Field(min_length=1)
    to_user_id: str = Field(min_length=1)
    sdp: dict[str, Any] | str


class IceCandidatePayload(BaseModel):
    room_id: str = Field(min_length=1)
    from_user_id: str = Field(min_length=1)
    to_user_id: str = Field(min_length=1)
    candidate: dict[str, Any] | str


def _subject_queue_key(subject: str) -> str:
    normalized = subject.strip().lower()
    return f"matching:queue:{normalized}"


def _subject_set_key(subject: str) -> str:
    normalized = subject.strip().lower()
    return f"matching:queued:{normalized}"


def _subject_lock_key(subject: str) -> str:
    normalized = subject.strip().lower()
    return f"matching:lock:{normalized}"


def _room_key(room_id: str) -> str:
    return f"matching:room:{room_id}"


def _require_redis() -> Redis:
    if _redis is None:
        raise HTTPException(status_code=503, detail="Redis connection is not initialized")
    return _redis


async def _publish(channel: str, payload: dict[str, Any]) -> None:
    redis = _require_redis()
    await redis.publish(channel, json.dumps(payload))


async def _send_to_user(user_id: str, payload: dict[str, Any]) -> None:
    websocket: WebSocket | None = None
    async with _connections_lock:
        websocket = _active_connections.get(user_id)
    if websocket is None:
        return

    try:
        await websocket.send_json(payload)
    except Exception:
        async with _connections_lock:
            existing = _active_connections.get(user_id)
            if existing is websocket:
                _active_connections.pop(user_id, None)


async def _validate_room_users(room_id: str, from_user_id: str, to_user_id: str) -> None:
    redis = _require_redis()
    room_data = await redis.hgetall(_room_key(room_id))
    if not room_data:
        raise HTTPException(status_code=404, detail="Room not found")

    room_users = {room_data.get("user_a"), room_data.get("user_b")}
    if from_user_id not in room_users or to_user_id not in room_users:
        raise HTTPException(status_code=400, detail="Users do not belong to this room")


async def _enqueue_user(subject: str, user_id: str) -> None:
    redis = _require_redis()
    queued_set_key = _subject_set_key(subject)
    queue_key = _subject_queue_key(subject)

    was_added = await redis.sadd(queued_set_key, user_id)
    if was_added:
        await redis.rpush(queue_key, user_id)
    await redis.hset(USER_SUBJECT_HASH, user_id, subject)


async def _try_match_subject(subject: str) -> None:
    redis = _require_redis()
    lock_key = _subject_lock_key(subject)
    lock_token = str(uuid4())
    queue_key = _subject_queue_key(subject)
    queued_set_key = _subject_set_key(subject)

    lock_acquired = await redis.set(lock_key, lock_token, ex=5, nx=True)
    if not lock_acquired:
        return

    try:
        while True:
            user_a = await redis.lpop(queue_key)
            if user_a is None:
                return

            user_b = await redis.lpop(queue_key)
            if user_b is None:
                await redis.lpush(queue_key, user_a)
                return

            if user_a == user_b:
                await redis.srem(queued_set_key, user_a)
                continue

            room_id = str(uuid4())
            await redis.srem(queued_set_key, user_a, user_b)
            await redis.hset(_room_key(room_id), mapping={"user_a": user_a, "user_b": user_b, "subject": subject})
            await redis.expire(_room_key(room_id), 60 * 60)
            await redis.hset(USER_ROOM_HASH, mapping={user_a: room_id, user_b: room_id})

            await _publish(
                MATCH_EVENTS_CHANNEL,
                {
                    "type": "matched",
                    "user_id": user_a,
                    "peer_id": user_b,
                    "room_id": room_id,
                    "subject": subject,
                },
            )
            await _publish(
                MATCH_EVENTS_CHANNEL,
                {
                    "type": "matched",
                    "user_id": user_b,
                    "peer_id": user_a,
                    "room_id": room_id,
                    "subject": subject,
                },
            )
    finally:
        current_token = await redis.get(lock_key)
        if current_token == lock_token:
            await redis.delete(lock_key)


async def _pubsub_listener() -> None:
    redis = _require_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(MATCH_EVENTS_CHANNEL, SIGNALING_EVENTS_CHANNEL)

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if not message:
                await asyncio.sleep(0.05)
                continue

            data = message.get("data")
            if not data:
                continue

            payload = json.loads(data)
            channel = message.get("channel")

            if channel == MATCH_EVENTS_CHANNEL and payload.get("type") == "matched":
                await _send_to_user(
                    payload["user_id"],
                    {
                        "status": "matched",
                        "peer_id": payload["peer_id"],
                        "room_id": payload["room_id"],
                        "subject": payload.get("subject"),
                    },
                )

            if channel == SIGNALING_EVENTS_CHANNEL and payload.get("type") == "signal":
                await _send_to_user(
                    payload["to_user_id"],
                    {
                        "status": "signal",
                        "signal_type": payload["signal_type"],
                        "room_id": payload["room_id"],
                        "from_user_id": payload["from_user_id"],
                        "payload": payload["payload"],
                    },
                )
    except asyncio.CancelledError:
        raise
    finally:
        await pubsub.unsubscribe(MATCH_EVENTS_CHANNEL, SIGNALING_EVENTS_CHANNEL)
        await pubsub.close()


async def startup_matching() -> None:
    global _redis, _pubsub_task
    if _redis is not None:
        return

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = Redis.from_url(redis_url, decode_responses=True)
    try:
        await redis_client.ping()
        _redis = redis_client
        _pubsub_task = asyncio.create_task(_pubsub_listener())
    except Exception as exc:
        _logger.warning("Redis unavailable at startup. Matching disabled until Redis is reachable: %s", exc)
        await redis_client.close()
        _redis = None
        _pubsub_task = None


async def shutdown_matching() -> None:
    global _redis, _pubsub_task

    if _pubsub_task is not None:
        _pubsub_task.cancel()
        try:
            await _pubsub_task
        except asyncio.CancelledError:
            pass
        _pubsub_task = None

    if _redis is not None:
        await _redis.close()
        _redis = None


@router.websocket("/ws")
async def matching_websocket(websocket: WebSocket) -> None:
    await websocket.accept()
    current_user_id: str | None = None

    try:
        while True:
            message = await websocket.receive_json()
            action = message.get("action")

            if action == "find_match":
                user_id = str(message.get("user_id", "")).strip()
                subject = str(message.get("subject", "")).strip()
                if not user_id or not subject:
                    await websocket.send_json({"status": "error", "message": "user_id and subject are required"})
                    continue

                current_user_id = user_id
                async with _connections_lock:
                    _active_connections[user_id] = websocket

                try:
                    await _enqueue_user(subject, user_id)
                    await websocket.send_json({"status": "queued", "subject": subject})
                    await _try_match_subject(subject)
                except HTTPException as exc:
                    await websocket.send_json({"status": "error", "message": exc.detail})
                continue

            await websocket.send_json({"status": "error", "message": "Unsupported action"})
    except WebSocketDisconnect:
        pass
    finally:
        if current_user_id:
            async with _connections_lock:
                existing = _active_connections.get(current_user_id)
                if existing is websocket:
                    _active_connections.pop(current_user_id, None)

            redis = _redis
            if redis is not None:
                subject = await redis.hget(USER_SUBJECT_HASH, current_user_id)
                if subject:
                    await redis.lrem(_subject_queue_key(subject), 0, current_user_id)
                    await redis.srem(_subject_set_key(subject), current_user_id)
                await redis.hdel(USER_SUBJECT_HASH, current_user_id)


@router.post("/signaling/offer")
async def signaling_offer(payload: OfferPayload) -> dict[str, str]:
    await _validate_room_users(payload.room_id, payload.from_user_id, payload.to_user_id)
    await _publish(
        SIGNALING_EVENTS_CHANNEL,
        {
            "type": "signal",
            "signal_type": "offer",
            "room_id": payload.room_id,
            "from_user_id": payload.from_user_id,
            "to_user_id": payload.to_user_id,
            "payload": {"sdp": payload.sdp},
        },
    )
    return {"status": "sent"}


@router.post("/signaling/answer")
async def signaling_answer(payload: AnswerPayload) -> dict[str, str]:
    await _validate_room_users(payload.room_id, payload.from_user_id, payload.to_user_id)
    await _publish(
        SIGNALING_EVENTS_CHANNEL,
        {
            "type": "signal",
            "signal_type": "answer",
            "room_id": payload.room_id,
            "from_user_id": payload.from_user_id,
            "to_user_id": payload.to_user_id,
            "payload": {"sdp": payload.sdp},
        },
    )
    return {"status": "sent"}


@router.post("/signaling/ice-candidate")
async def signaling_ice_candidate(payload: IceCandidatePayload) -> dict[str, str]:
    await _validate_room_users(payload.room_id, payload.from_user_id, payload.to_user_id)
    await _publish(
        SIGNALING_EVENTS_CHANNEL,
        {
            "type": "signal",
            "signal_type": "ice-candidate",
            "room_id": payload.room_id,
            "from_user_id": payload.from_user_id,
            "to_user_id": payload.to_user_id,
            "payload": {"candidate": payload.candidate},
        },
    )
    return {"status": "sent"}


@router.get("/health")
async def matching_health() -> dict[str, str]:
    return {
        "message": "matching router is healthy",
        "redis": "connected" if _redis is not None else "disconnected",
    }
