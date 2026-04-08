import os
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/jitsi", tags=["jitsi"])


class CreateRoomRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=120)


class CreateRoomResponse(BaseModel):
    room_name: str
    room_url: str
    display_name: str


@router.get("/health")
async def jitsi_health() -> dict[str, str]:
    return {"message": "jitsi router is healthy"}


@router.post("/create-room", response_model=CreateRoomResponse)
async def create_room(payload: CreateRoomRequest) -> CreateRoomResponse:
    base_url = os.getenv("JITSI_BASE_URL", "https://meet.jit.si").rstrip("/")
    display_name = os.getenv("JITSI_DEFAULT_DISPLAY_NAME", "Nexus Study User")

    normalized_subject = "-".join(payload.subject.strip().lower().split())[:40]
    unique_suffix = str(uuid4())[:8]
    room_name = f"nexus-{normalized_subject}-{unique_suffix}"
    room_url = f"{base_url}/{room_name}"

    return CreateRoomResponse(
        room_name=room_name,
        room_url=room_url,
        display_name=display_name,
    )
