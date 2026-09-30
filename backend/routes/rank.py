import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Job, Application, User
from auth.dependencies import require_role

router = APIRouter()


@router.get("/jobs/{job_id}/candidates")
def rank_candidates_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    applications = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .order_by(Application.match_score.desc())
        .all()
    )

    top_candidates = [
        {
            "application_id": app.id,
            "name": app.candidate.username,
            "filename": app.filename,
            "match_score": app.match_score,
            "requiredSkills": json.loads(app.required_skills or "[]"),
            "matchedSkills": json.loads(app.matched_skills or "[]"),
            "missingSkills": json.loads(app.missing_skills or "[]"),
            "status": app.status or "applied",
            "screening": {
                "completed": bool(app.screening_completed),
                "category": app.screening_category,
                "aptitude": {
                    "total": app.aptitude_total or 0,
                    "correct": app.aptitude_correct or 0,
                    "wrong": app.aptitude_wrong or 0,
                    "unanswered": app.aptitude_unanswered or 0,
                    "score": app.aptitude_score,
                },
                "coding_question_count": len(json.loads(app.coding_questions or "[]")),
            },
            "interview": {
                "completed": bool(app.interview_completed),
                "total": app.interview_total or 0,
                "correct": app.interview_correct or 0,
                "wrong": app.interview_wrong or 0,
                "unanswered": app.interview_unanswered or 0,
                "score": app.interview_score,
            },
        }
        for app in applications
    ]

    if applications:
        top = applications[0]
        analytics = {
            "matchScore": top.match_score or 0,
            "matchedSkillsCount": len(json.loads(top.matched_skills or "[]")),
            "missingSkillsCount": len(json.loads(top.missing_skills or "[]")),
            "matchedSkills": json.loads(top.matched_skills or "[]"),
            "missingSkills": json.loads(top.missing_skills or "[]"),
        }
    else:
        analytics = {
            "matchScore": 0,
            "matchedSkillsCount": 0,
            "missingSkillsCount": 0,
            "matchedSkills": [],
            "missingSkills": [],
        }

    return {
        "job": {"id": job.id, "role": job.role, "description": job.description},
        "top_candidates": top_candidates,
        "analytics": analytics,
    }
