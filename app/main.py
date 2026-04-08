from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth_router, matching_router, study_materials_router
from app.routers.matching import shutdown_matching, startup_matching

load_dotenv()

app = FastAPI(title="nexus-study API", version="0.1.0")

allowed_origins = [
    "http://localhost:3000",
    "https://your-future-app.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "nexus-study API is running"}


@app.on_event("startup")
async def on_startup() -> None:
    await startup_matching()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await shutdown_matching()


app.include_router(auth_router, prefix="/api/v1")
app.include_router(matching_router, prefix="/api/v1")
app.include_router(study_materials_router, prefix="/api/v1")
