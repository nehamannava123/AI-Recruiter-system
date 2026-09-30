import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Application, Job, User
from auth.dependencies import get_current_user, require_role
from services.screening_generator import (
    detect_category,
    generate_aptitude_questions,
    generate_coding_questions,
    public_aptitude_questions,
    score_aptitude,
)

router = APIRouter()


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


def _screening_summary(application: Application):
    return {
        "completed": bool(application.screening_completed),
        "category": application.screening_category,
        "aptitude": {
            "total": application.aptitude_total or 0,
            "correct": application.aptitude_correct or 0,
            "wrong": application.aptitude_wrong or 0,
            "unanswered": application.aptitude_unanswered or 0,
            "score": application.aptitude_score,
        },
        "coding_question_count": len(json.loads(application.coding_questions or "[]")),
    }


@router.get("/applications/{application_id}/screening")
def preview_screening(
    application_id: int,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_role("recruiter")),
):
    """Recruiter-facing preview of the kind of screening round the candidate would get."""

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Not your job posting")

    category = detect_category(job.role, job.description)
    aptitude = generate_aptitude_questions(category)
    coding = generate_coding_questions(category)

    return {
        "application_id": application_id,
        "category": category,
        "aptitude_questions": [q["question"] for q in aptitude],
        "coding_questions": [{"title": q["title"], "prompt": q["prompt"]} for q in coding],
    }


@router.post("/applications/{application_id}/screening/start")
def start_screening(
    application_id: int,
    db: Session = Depends(get_db),
    candidate: User = Depends(require_role("candidate")),
):
    application = _get_owned_application(application_id, candidate, db)

    if application.screening_completed:
        aptitude_questions = json.loads(application.aptitude_questions or "[]")
        coding_questions = json.loads(application.coding_questions or "[]")
        return {
            "application_id": application.id,
            "already_completed": True,
            "category": application.screening_category,
            "aptitude_questions": public_aptitude_questions(aptitude_questions),
            "coding_questions": coding_questions,
            "result": _screening_summary(application),
        }

    job = db.query(Job).filter(Job.id == application.job_id).first()
    category = detect_category(job.role, job.description)

    aptitude_questions = generate_aptitude_questions(category)
    coding_questions = generate_coding_questions(category)

    application.screening_category = category
    application.aptitude_questions = json.dumps(aptitude_questions)
    application.aptitude_results = None
    application.coding_questions = json.dumps(coding_questions)
    application.coding_answers = None
    db.commit()

    return {
        "application_id": application.id,
        "already_completed": False,
        "category": category,
        "aptitude_questions": public_aptitude_questions(aptitude_questions),
        "coding_questions": coding_questions,
    }


class AptitudeAnswerItem(BaseModel):
    question_id: int
    selected_index: int | None = None


class CodingAnswerItem(BaseModel):
    question_id: int
    answer: str = ""


class SubmitScreeningRequest(BaseModel):
    aptitude_answers: list[AptitudeAnswerItem] = []
    coding_answers: list[CodingAnswerItem] = []


@router.post("/applications/{application_id}/screening/submit")
def submit_screening(
    application_id: int,
    payload: SubmitScreeningRequest,
    db: Session = Depends(get_db),
    candidate: User = Depends(require_role("candidate")),
):
    application = _get_owned_application(application_id, candidate, db)

    if not application.aptitude_questions:
        raise HTTPException(status_code=400, detail="Screening has not been started yet")

    if application.screening_completed:
        raise HTTPException(status_code=400, detail="Screening has already been submitted")

    aptitude_questions = json.loads(application.aptitude_questions)
    coding_questions = json.loads(application.coding_questions or "[]")

    answers_by_id = {a.question_id: a.selected_index for a in payload.aptitude_answers}
    results, summary = score_aptitude(aptitude_questions, answers_by_id)

    coding_answer_text = {a.question_id: a.answer for a in payload.coding_answers}
    coding_saved = [
        {
            "question_id": q["id"],
            "title": q["title"],
            "prompt": q["prompt"],
            "answer": coding_answer_text.get(q["id"], ""),
        }
        for q in coding_questions
    ]

    application.aptitude_results = json.dumps(results)
    application.aptitude_total = summary["total"]
    application.aptitude_correct = summary["correct"]
    application.aptitude_wrong = summary["wrong"]
    application.aptitude_unanswered = summary["unanswered"]
    application.aptitude_score = summary["score"]
    application.coding_answers = json.dumps(coding_saved)
    application.screening_completed = 1

    db.commit()
    db.refresh(application)

    return {
        "application_id": application.id,
        "result": _screening_summary(application),
        "aptitude_details": results,
        "coding_details": coding_saved,
    }


@router.get("/applications/{application_id}/screening/result")
def get_screening_result(
    application_id: int,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    application = _get_application_for_viewer(application_id, viewer, db)

    aptitude_details = json.loads(application.aptitude_results) if application.aptitude_results else []
    coding_details = json.loads(application.coding_answers) if application.coding_answers else []

    return {
        "application_id": application.id,
        "result": _screening_summary(application),
        "aptitude_details": aptitude_details,
        "coding_details": coding_details,
    }
