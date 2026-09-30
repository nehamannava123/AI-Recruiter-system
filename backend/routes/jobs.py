from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Job, User
from auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobCreateRequest(BaseModel):
    role: str = Field(min_length=2)
    description: str = Field(min_length=10)


@router.post("")
def create_job(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    job = Job(recruiter_id=recruiter.id, role=payload.role, description=payload.description)
    db.add(job)
    db.commit()
    db.refresh(job)

    return {"id": job.id, "role": job.role, "description": job.description}


@router.get("")
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Candidates see every open job. Recruiters see only the jobs they posted.
    if current_user.role == "recruiter":
        jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc()).all()
    else:
        jobs = db.query(Job).order_by(Job.created_at.desc()).all()

    return [
        {
            "id": j.id,
            "role": j.role,
            "description": j.description,
            "recruiter_username": j.recruiter.username,
            "applicant_count": len(j.applications),
            "created_at": j.created_at.isoformat() if j.created_at else None,
        }
        for j in jobs
    ]


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job.id,
        "role": job.role,
        "description": job.description,
        "recruiter_username": job.recruiter.username,
    }


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)  # cascades to delete all of this job's applications too
    db.commit()

    return {"status": "deleted", "id": job_id}
