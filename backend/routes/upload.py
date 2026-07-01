from fastapi import APIRouter, UploadFile
import shutil
import os

from services.resume_parser import extract_text
from services.embedding_service import create_embedding
from services.faiss_service import add_candidate

router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile):

    os.makedirs("uploads", exist_ok=True)

    filepath = f"uploads/{file.filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_text = extract_text(filepath)

    # Extract skills using our rule-based skill extractor
    from services.skill_extractor import extract_skills

    resume_skills = extract_skills(resume_text)

    embedding = create_embedding(resume_text)

    add_candidate(
        file.filename,
        embedding,
        resume_text=resume_text,
        resume_skills=resume_skills,
    )

    preview = resume_text[:2000]

    return {
        "status": "uploaded",
        "candidate": file.filename,
        "resumePreview": preview,
        "resumeSkillsFound": resume_skills,
    }
