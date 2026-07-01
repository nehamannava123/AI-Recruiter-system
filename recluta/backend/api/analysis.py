"""Speech analysis API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.whisper_service import transcribe_audio
from ml_models.scoring import (
    compute_clarity_score,
    compute_filler_rate,
    compute_wpm,
    count_filler_words,
)
from services import db as db_service
from ml_models import training as training_model
from fastapi import Query
from typing import Optional
import statistics

router = APIRouter()


class SpeechAnalysisRequest(BaseModel):
    audio_base64: str
    duration_seconds: float = 0.0


@router.post("/speech")
async def analyze_speech(body: SpeechAnalysisRequest):
    if not body.audio_base64:
        raise HTTPException(status_code=400, detail="audio_base64 is required")

    try:
        result = transcribe_audio(body.audio_base64)
        transcription = result["transcription"]
        duration = body.duration_seconds or result.get("duration", 0) or max(len(transcription.split()) / 2.5, 1)

        fillers, filler_count = count_filler_words(transcription)
        word_count = len(transcription.split())
        wpm = compute_wpm(transcription, duration)
        filler_rate = compute_filler_rate(filler_count, word_count)
        clarity_score = compute_clarity_score(wpm, filler_rate)

        return {
            "transcription": transcription,
            "wpm": wpm,
            "filler_words": fillers,
            "filler_count": filler_count,
            "filler_rate": filler_rate,
            "clarity_score": clarity_score,
            "word_count": word_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/retrain")
async def retrain_model(min_rows: int = 200):
    """Trigger retraining of the score model if enough sessions exist."""
    client = db_service._get_client() if hasattr(db_service, "_get_client") else None
    if client is None:
        return {"status": "no_supabase", "detail": "Supabase client unavailable"}
    try:
        resp = client.table("interview_sessions").select("*").execute()
        rows = resp.data if hasattr(resp, "data") else []
        if len(rows) < min_rows:
            return {"status": "not_enough_data", "rows": len(rows), "required": min_rows}
        path = training_model.train_and_select(rows, model_path="score_model.pkl")
        return {"status": "trained" if path else "failed", "model_path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/history")
async def get_history(limit: int = 100, role: Optional[str] = Query(None)):
    """Return recent interview session rows (most recent first).

    If Supabase is unavailable, returns the fallback file contents.
    """
    try:
        rows = db_service.fetch_all_sessions()
        if role:
            rows = [r for r in rows if r.get("role") == role]
        # sort by timestamp if available
        rows_sorted = sorted(rows, key=lambda r: r.get("timestamp", r.get("_saved_at", "")), reverse=True)
        return {"rows": rows_sorted[:limit], "count": len(rows_sorted)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def get_trends(metric: str = "overall_score", limit: int = 100):
    """Return simple trend data for a metric across stored sessions."""
    try:
        rows = db_service.fetch_all_sessions()
        values = [float(r.get(metric, 0)) for r in rows if r.get(metric) is not None]
        if not values:
            return {"metric": metric, "values": [], "summary": {"count": 0}}
        # simple rolling average trend
        window = max(1, min(10, int(len(values) / 10)))
        moving = [round(statistics.mean(values[max(0, i - window + 1) : i + 1]), 2) for i in range(len(values))]
        return {"metric": metric, "values": values[-limit:], "moving_average": moving[-limit:], "summary": {"count": len(values), "min": min(values), "max": max(values), "mean": round(statistics.mean(values),2)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
