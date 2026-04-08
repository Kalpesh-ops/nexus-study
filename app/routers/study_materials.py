from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import get_supabase_client
from app.core.study_materials_generation import (
    generate_mock_study_materials,
    StudyMaterials,
)


class GenerateRequest(BaseModel):
    subject: str


class GenerateResponse(BaseModel):
    subject: str
    flashcards: list[dict]
    quiz_questions: list[dict]
    from_cache: bool


router = APIRouter(prefix="/study-materials", tags=["study_materials"])


@router.get("/health")
async def study_materials_health() -> dict[str, str]:
    return {"message": "study_materials router is healthy"}


@router.post("/generate", response_model=GenerateResponse)
async def generate_study_materials(request: GenerateRequest) -> GenerateResponse:
    """
    Generate or retrieve cached study materials for a given subject.
    
    First checks Supabase for existing materials. If found, returns cached data.
    Otherwise, generates new materials using mock AI function, saves to Supabase, and returns.
    """
    subject = request.subject.strip()
    
    if not subject:
        raise HTTPException(status_code=400, detail="Subject cannot be empty")
    
    try:
        supabase = get_supabase_client()
        
        # Query Supabase to check if materials exist for this subject
        response = supabase.table("study_materials").select("*").eq("subject", subject).execute()
        
        if response.data and len(response.data) > 0:
            # Materials exist in cache, return them
            cached_material = response.data[0]
            return GenerateResponse(
                subject=subject,
                flashcards=cached_material.get("flashcards", []),
                quiz_questions=cached_material.get("quiz_questions", []),
                from_cache=True
            )
        
        # Materials don't exist, generate new ones using mock function
        generated_materials: StudyMaterials = generate_mock_study_materials(subject)
        
        # Save generated materials to Supabase
        material_data = {
            "subject": subject,
            "flashcards": generated_materials["flashcards"],
            "quiz_questions": generated_materials["quiz_questions"],
        }
        
        supabase.table("study_materials").insert(material_data).execute()
        
        return GenerateResponse(
            subject=subject,
            flashcards=generated_materials["flashcards"],
            quiz_questions=generated_materials["quiz_questions"],
            from_cache=False
        )
        
    except Exception as e:
        # Handle Supabase connection or other errors
        raise HTTPException(status_code=500, detail=f"Error processing study materials: {str(e)}")
