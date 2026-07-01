from fastapi import APIRouter
from services.interview_generator import generate_questions

router = APIRouter()

@router.get("/interview")

def interview():

    skills = ["Python", "FastAPI"]

    return {
        "questions": generate_questions(skills)
    }