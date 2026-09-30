from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Job, Application, User
from auth.dependencies import require_role

router = APIRouter()


@router.get("/recruiter/stats")
def recruiter_stats(
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter.id).all()
    job_ids = [j.id for j in jobs]

    applications = (
        db.query(Application).filter(Application.job_id.in_(job_ids)).all() if job_ids else []
    )

    total_jobs = len(jobs)
    applications_received = len(applications)
    shortlisted = sum(1 for a in applications if a.status == "shortlisted")
    rejected = sum(1 for a in applications if a.status == "rejected")

    scored = [a.match_score for a in applications if a.match_score is not None]
    avg_match_score = round(sum(scored) / len(scored), 1) if scored else 0

    return {
        "total_jobs": total_jobs,
        "applications_received": applications_received,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "avg_match_score": avg_match_score,
    }


class StatusUpdateRequest(BaseModel):
    status: str  # "applied" | "shortlisted" | "rejected"


@router.patch("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    if payload.status not in ("applied", "shortlisted", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Not your job posting")

    application.status = payload.status
    db.commit()

    return {"application_id": application.id, "status": application.status}
