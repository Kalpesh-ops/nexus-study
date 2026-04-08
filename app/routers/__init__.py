from .auth import router as auth_router
from .jitsi import router as jitsi_router
from .matching import router as matching_router
from .study_materials import router as study_materials_router

__all__ = ["auth_router", "jitsi_router", "matching_router", "study_materials_router"]
