import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Application, User
from auth.dependencies import require_role

router = APIRouter()


@router.get("/candidate/applications")
def list_my_applications(
    db: Session = Depends(get_db),
    candidate: User = Depends(require_role("candidate")),
):
    applications = (
        db.query(Application)
        .filter(Application.candidate_id == candidate.id)
        .order_by(Application.uploaded_at.desc())
        .all()
    )

    return [
        {
            "application_id": a.id,
            "job_id": a.job_id,
            "job_role": a.job.role,
            "recruiter_username": a.job.recruiter.username,
            "status": a.status or "applied",
            "match_score": a.match_score,
            "matchedSkills": json.loads(a.matched_skills or "[]"),
            "missingSkills": json.loads(a.missing_skills or "[]"),
            "aiFeedback": json.loads(a.ai_feedback) if a.ai_feedback else [],
            "screening": {
                "completed": bool(a.screening_completed),
                "category": a.screening_category,
                "aptitude": {
                    "total": a.aptitude_total or 0,
                    "correct": a.aptitude_correct or 0,
                    "wrong": a.aptitude_wrong or 0,
                    "unanswered": a.aptitude_unanswered or 0,
                    "score": a.aptitude_score,
                },
                "coding_question_count": len(json.loads(a.coding_questions or "[]")),
            },
            "interview": {
                "completed": bool(a.interview_completed),
                "total": a.interview_total or 0,
                "correct": a.interview_correct or 0,
                "wrong": a.interview_wrong or 0,
                "unanswered": a.interview_unanswered or 0,
                "score": a.interview_score,
            },
        }
        for a in applications
    ]
