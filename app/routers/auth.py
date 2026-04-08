from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/health")
async def auth_health() -> dict[str, str]:
    return {"message": "auth router is healthy"}
