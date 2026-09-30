from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Application, Job, User
from auth.dependencies import require_role
from services.trust_score import calculate_trust

router = APIRouter()


@router.get("/applications/{application_id}/trust")
def trust(
    application_id: int,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Make sure this recruiter owns the job the application belongs to.
    job = db.query(Job).filter(Job.id == application.job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Not your job posting")

    trust_score = calculate_trust(application.resume_text or "")
    return {"application_id": application_id, "trust_score": trust_score}
