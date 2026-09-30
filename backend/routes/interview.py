import json
import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Application, Job, User
from auth.dependencies import get_current_user, require_role
from services.interview_generator import generate_questions, score_interview

router = APIRouter()

INTERVIEW_UPLOAD_DIR = "uploads/interviews"


def _get_owned_application(application_id: int, candidate: User, db: Session) -> Application:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.candidate_id == candidate.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


def _get_application_for_viewer(application_id: int, viewer: User, db: Session) -> Application:
    """Allow either the candidate who owns the application, or the recruiter who owns the job."""

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if viewer.role == "candidate" and application.candidate_id == viewer.id:
        return application

    if viewer.role == "recruiter":
        job = db.query(Job).filter(Job.id == application.job_id, Job.recruiter_id == viewer.id).first()
        if job:
            return application

    raise HTTPException(status_code=403, detail="Not authorized to view this application")


def _interview_summary(application: Application):
    return {
        "completed": bool(application.interview_completed),
        "total": application.interview_total or 0,
        "correct": application.interview_correct or 0,
        "wrong": application.interview_wrong or 0,
        "unanswered": application.interview_unanswered or 0,
        "score": application.interview_score,
        "video_url": f"/media/interviews/{os.path.basename(application.interview_video_path)}"
        if application.interview_video_path
        else None,
    }


@router.get("/applications/{application_id}/interview")
def preview_questions(
    application_id: int,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    """Recruiter-facing preview of the kind of questions the candidate would get."""

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Not your job posting")

    skills = json.loads(application.matched_skills or "[]") or json.loads(application.resume_skills or "[]")
    questions = generate_questions(skills)
    return {"application_id": application_id, "questions": [q["question"] for q in questions]}


@router.post("/applications/{application_id}/interview/start")
def start_interview(
    application_id: int,
    db: Session = Depends(get_db),
    candidate: User = Depends(require_role("candidate")),
):
    application = _get_owned_application(application_id, candidate, db)

    if not application.screening_completed:
        raise HTTPException(
            status_code=400,
            detail="Please complete the aptitude & coding screening test before starting the video interview.",
        )

    if application.interview_completed:
        # Already completed - return the same questions/result rather than regenerating.
        questions = json.loads(application.interview_questions or "[]")
        return {
            "application_id": application.id,
            "already_completed": True,
            "questions": [{"id": q["id"], "question": q["question"]} for q in questions],
            "result": _interview_summary(application),
        }

    skills = json.loads(application.matched_skills or "[]") or json.loads(application.resume_skills or "[]")
    questions = generate_questions(skills)

    application.interview_questions = json.dumps(questions)
    application.interview_answers = None
    db.commit()

    return {
        "application_id": application.id,
        "already_completed": False,
        "questions": [{"id": q["id"], "question": q["question"]} for q in questions],
    }


class AnswerItem(BaseModel):
    question_id: int
    answer: str = ""


class SubmitInterviewRequest(BaseModel):
    answers: list[AnswerItem]


@router.post("/applications/{application_id}/interview/submit")
def submit_interview(
    application_id: int,
    payload: SubmitInterviewRequest,
    db: Session = Depends(get_db),
    candidate: User = Depends(require_role("candidate")),
):
    application = _get_owned_application(application_id, candidate, db)

    if not application.interview_questions:
        raise HTTPException(status_code=400, detail="Interview has not been started yet")

    questions = json.loads(application.interview_questions)
    answers_by_id = {a.question_id: a.answer for a in payload.answers}

    results, summary = score_interview(questions, answers_by_id)

    application.interview_answers = json.dumps(results)
    application.interview_total = summary["total"]
    application.interview_correct = summary["correct"]
    application.interview_wrong = summary["wrong"]
    application.interview_unanswered = summary["unanswered"]
    application.interview_score = summary["score"]
    application.interview_completed = 1

    db.commit()
    db.refresh(application)

    return {"application_id": application.id, "result": _interview_summary(application), "details": results}


@router.post("/applications/{application_id}/interview/video")
async def upload_interview_video(
    application_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    candidate: User = Depends(require_role("candidate")),
):
    application = _get_owned_application(application_id, candidate, db)

    os.makedirs(INTERVIEW_UPLOAD_DIR, exist_ok=True)
    extension = os.path.splitext(file.filename or "")[1] or ".webm"
    filepath = os.path.join(INTERVIEW_UPLOAD_DIR, f"{candidate.id}_{application_id}{extension}")

    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    application.interview_video_path = filepath
    db.commit()

    return {"status": "uploaded", "video_url": f"/media/interviews/{os.path.basename(filepath)}"}


@router.get("/applications/{application_id}/interview/result")
def get_interview_result(
    application_id: int,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    application = _get_application_for_viewer(application_id, viewer, db)

    details = json.loads(application.interview_answers) if application.interview_answers else []

    return {
        "application_id": application.id,
        "result": _interview_summary(application),
        "details": details,
    }
