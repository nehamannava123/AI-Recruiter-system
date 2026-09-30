import json
import os
import shutil

from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Job, Application, User
from auth.dependencies import require_role

from services.resume_parser import extract_text
from services.embedding_service import create_embedding
from services.skill_extractor import extract_skills
from services.skills_matcher import compute_skills_match
from services.resume_feedback import generate_feedback

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile,
    job_id: int = Form(...),
    db: Session = Depends(get_db),
    candidate: User = Depends(require_role("candidate")),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    os.makedirs("uploads", exist_ok=True)
    filepath = f"uploads/{candidate.id}_{job_id}_{file.filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_text = extract_text(filepath)
    resume_skills = extract_skills(resume_text)
    embedding = create_embedding(resume_text)

    jd_text = f"Role: {job.role}\n\nDescription:\n{job.description}"
    match = compute_skills_match(job_description=jd_text, resume_text=resume_text)

    feedback = generate_feedback(
        resume_text=resume_text,
        match_score=match.match_score,
        matched_skills=match.matched_skills,
        missing_skills=match.missing_skills,
    )

    # A candidate can re-apply / re-upload for the same job; keep only the latest attempt.
    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.candidate_id == candidate.id)
        .first()
    )

    if existing:
        application = existing
        application.filename = file.filename
        # Reset any prior interview attempt since the resume (and therefore
        # the skill-based questions) may have changed.
        application.interview_questions = None
        application.interview_answers = None
        application.interview_total = 0
        application.interview_correct = 0
        application.interview_wrong = 0
        application.interview_unanswered = 0
        application.interview_score = None
        application.interview_completed = 0
        application.interview_video_path = None
        application.status = "applied"
    else:
        application = Application(job_id=job.id, candidate_id=candidate.id, filename=file.filename, status="applied")
        db.add(application)

    application.resume_text = resume_text
    application.resume_skills = json.dumps(resume_skills)
    application.embedding = embedding.astype("float32").tobytes()
    application.match_score = match.match_score
    application.required_skills = json.dumps(match.required_skills)
    application.matched_skills = json.dumps(match.matched_skills)
    application.missing_skills = json.dumps(match.missing_skills)
    application.ai_feedback = json.dumps(feedback)

    db.commit()
    db.refresh(application)

    return {
        "status": "uploaded",
        "application_id": application.id,
        "job_id": job.id,
        "resumePreview": resume_text[:2000],
        "resumeSkillsFound": resume_skills,
        "matchScore": match.match_score,
        "requiredSkills": match.required_skills,
        "matchedSkills": match.matched_skills,
        "missingSkills": match.missing_skills,
        "aiFeedback": feedback,
    }
