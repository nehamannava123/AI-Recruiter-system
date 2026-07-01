from fastapi import APIRouter
from services.trust_score import calculate_trust

router = APIRouter()

@router.get("/trust")

def trust():

    candidate = {
        "projects": ["AI Recruiter"],
        "github": True,
        "certifications": True
    }

    return {
        "trust_score": calculate_trust(candidate)
    }