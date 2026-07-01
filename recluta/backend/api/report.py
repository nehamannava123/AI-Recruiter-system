"""PDF report generation API routes."""

import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.gemini_engine import get_session
from services.report_service import generate_pdf_report
from ml_models.scoring import (
    compute_confidence_score,
    compute_eye_contact_score,
    compute_overall_score,
    compute_pacing_score,
    compute_professionalism_score,
    simple_sentiment,
)

router = APIRouter()


class QAPair(BaseModel):
    question: str = ""
    answer: str = ""
    answer_score: float = 0
    star_compliance: bool = False
    feedback: str = ""


class MetricsPayload(BaseModel):
    confidence: float = 0
    communication: float = 0
    eye_contact: float = 0
    professionalism: float = 0
    answer_quality: float = 0
    pacing: float = 0
    clarity: float = 0
    engagement: float = 0


class ReportRequest(BaseModel):
    session_id: str = ""
    role: str = "Candidate"
    metrics: MetricsPayload = Field(default_factory=MetricsPayload)
    qa_pairs: list[QAPair] = Field(default_factory=list)
    cv_summary: dict = Field(default_factory=dict)
    speech_summary: dict = Field(default_factory=dict)


def _normalize_qa(item) -> dict:
    if hasattr(item, "model_dump"):
        return item.model_dump()
    return item if isinstance(item, dict) else {}


def _compute_metrics_from_session(session: dict, body: ReportRequest) -> dict:
    if session and session.get("history"):
        qa_list = [_normalize_qa(item) for item in session["history"]]
    elif body.qa_pairs:
        qa_list = [_normalize_qa(q) for q in body.qa_pairs]
    else:
        qa_list = []

    eye_contacts = []
    wpm_values = []
    filler_rates = []
    answer_scores = []
    smile_scores = []

    for item in qa_list:
        cv = item.get("cv_metrics", {})
        if cv.get("eye_contact"):
            eye_contacts.append(cv["eye_contact"])
        if cv.get("smile"):
            smile_scores.append(cv.get("smile", 0.5))
        answer_scores.append(item.get("answer_score", 70))

    cv_summary = body.cv_summary or {}
    speech_summary = body.speech_summary or {}

    avg_eye = sum(eye_contacts) / len(eye_contacts) if eye_contacts else cv_summary.get("eye_contact", 65)
    avg_wpm = speech_summary.get("wpm", 130)
    avg_filler = speech_summary.get("filler_rate", 3)
    avg_answer = sum(answer_scores) / len(answer_scores) if answer_scores else 70
    avg_smile = sum(smile_scores) / len(smile_scores) if smile_scores else 0.5

    all_text = " ".join(item.get("answer", "") for item in qa_list)
    sentiment = simple_sentiment(all_text)

    confidence = body.metrics.confidence or compute_confidence_score(avg_eye, avg_filler, avg_wpm, sentiment)
    eye_contact = body.metrics.eye_contact or compute_eye_contact_score(avg_eye)
    pacing = body.metrics.pacing or compute_pacing_score(avg_wpm)
    answer_quality = body.metrics.answer_quality or avg_answer
    professionalism = body.metrics.professionalism or compute_professionalism_score(avg_eye, avg_filler, avg_smile)
    communication = body.metrics.communication or (body.metrics.clarity or 75)

    metrics = {
        "confidence": round(confidence, 1),
        "communication": round(communication, 1),
        "eye_contact": round(eye_contact, 1),
        "professionalism": round(professionalism, 1),
        "answer_quality": round(answer_quality, 1),
        "pacing": round(pacing, 1),
        "clarity": round(body.metrics.clarity or communication, 1),
        "engagement": round(body.metrics.engagement or (avg_eye + avg_smile * 100) / 2, 1),
    }
    return metrics, qa_list


@router.post("/generate")
async def generate_report(body: ReportRequest):
    try:
        session = get_session(body.session_id) if body.session_id else None
        metrics, qa_list = _compute_metrics_from_session(session, body)
        overall = compute_overall_score(metrics)

        role = body.role
        if session:
            role = session.get("role", role)

        report_data = {
            "overall_score": round(overall, 1),
            "metrics": metrics,
            "qa_pairs": qa_list,
            "role": role,
        }

        pdf_bytes = generate_pdf_report(report_data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=recluta-interview-report.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
