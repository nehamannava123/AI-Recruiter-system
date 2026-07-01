"""Interview session API routes."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field

from services import (
    gemini_engine,
    resume_service,
    tts_service,
    whisper_service,
    db as db_service,
    speech_analysis as speech_service,
    sentiment as sentiment_service,
    communication as communication_service,
    cv_analysis as cv_service,
    stress as stress_service,
    feedback as feedback_service,
)
from ml_models.scoring import (
    compute_answer_quality_score,
    compute_clarity_score,
    compute_confidence_score,
    compute_filler_rate,
    compute_wpm,
    count_filler_words,
    simple_sentiment,
    compute_overall_score,
    compute_professionalism_score,
    compute_pacing_score,
)
from ml_models import training as training_model

router = APIRouter()


class StartInterviewRequest(BaseModel):
    role: str = Field(..., min_length=1)
    level: str = Field(..., pattern="^(Intern|Junior|Mid|Senior)$")
    interview_type: str = Field(..., pattern="^(HR|Technical|Behavioral)$")
    resume_summary: str = ""


class CVMetrics(BaseModel):
    eye_contact: float = 0.0
    head_pose: dict = Field(default_factory=dict)
    smile: float = 0.0


class RespondRequest(BaseModel):
    session_id: str
    audio_base64: str = ""
    transcription: str = ""
    cv_metrics: CVMetrics = Field(default_factory=CVMetrics)


@router.post("/start")
async def start_interview(body: StartInterviewRequest):
    try:
        result = gemini_engine.create_session(
            role=body.role,
            level=body.level,
            interview_type=body.interview_type,
            resume_summary=body.resume_summary,
        )
        tts = tts_service.synthesize_speech(result["first_question"])
        return {**result, "tts": tts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        summary = resume_service.parse_resume(file.filename, content)
        return {"resume_summary": summary}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to parse resume document.")


@router.post("/respond")
async def respond_to_question(body: RespondRequest):
    session = gemini_engine.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    transcription = body.transcription
    if body.audio_base64 and not transcription:
        whisper_result = whisper_service.transcribe_audio(body.audio_base64)
        transcription = whisper_result["transcription"]

    if not transcription.strip():
        raise HTTPException(status_code=400, detail="No transcription provided")

    cv = body.cv_metrics.model_dump()
    try:
        result = gemini_engine.process_response(
            session_id=body.session_id,
            transcription=transcription,
            cv_metrics=cv,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Speech analysis (transcript + duration if available)
    try:
        speech_metrics = speech_service.analyze_speech(transcription, duration_seconds=0.0)
    except Exception:
        speech_metrics = {
            "wpm": 0.0,
            "total_words": len(transcription.split()),
            "filler_rate": 0.0,
            "filler_count": 0,
            "pause_count": 0,
            "speech_confidence": 0.0,
        }

    fillers = []
    filler_count = speech_metrics.get("filler_count", 0)
    word_count = speech_metrics.get("total_words", len(transcription.split()))
    wpm = speech_metrics.get("wpm", compute_wpm(transcription, max(word_count / 2.5, 1)))
    filler_rate = speech_metrics.get("filler_rate", compute_filler_rate(filler_count, word_count))

    # Sentiment
    sent = sentiment_service.analyze_sentiment(transcription)
    sentiment_val = sent.get("sentiment", simple_sentiment(transcription))

    # Communication analysis
    comm = communication_service.analyze_communication(transcription, {"clarity_score": None, "sentiment": sentiment_val})

    # CV / face metrics normalization
    cv_metrics_norm = cv_service.analyze_cv_metrics(cv)

    # Confidence and answer quality
    confidence = compute_confidence_score(
        cv_metrics_norm.get("eye_contact", 50),
        filler_rate,
        wpm,
        sentiment_val,
    )
    answer_quality = compute_answer_quality_score(
        result["answer_score"],
        result.get("star_compliance", False),
        word_count,
    )

    # Stress estimation
    stress = stress_service.estimate_stress({
        "filler_rate": filler_rate,
        "pause_count": speech_metrics.get("pause_count", 0),
        "sentiment": sentiment_val,
        "eye_contact": cv_metrics_norm.get("eye_contact", 50),
    })

    # Overall scoring: try learned model, otherwise deterministic
    overall_score = None
    model_used = "fallback"
    try:
        model = training_model.load_model("score_model.pkl")
        if model is not None:
            feat = [
                cv_metrics_norm.get("eye_contact", 50),
                wpm,
                filler_rate,
                sentiment_val,
                comm.get("communication", 50),
                stress.get("stress_score", 50),
            ]
            try:
                pred = model.predict([feat])
                overall_score = float(pred[0])
                model_used = "learned"
            except Exception:
                overall_score = None
    except Exception:
        overall_score = None

    if overall_score is None:
        professionalism = compute_professionalism_score(
            cv_metrics_norm.get("eye_contact", 50),
            filler_rate,
            cv_metrics_norm.get("smile", 0.0),
        )
        pacing = compute_pacing_score(wpm)
        overall_score = compute_overall_score({
            "confidence": confidence,
            "communication": comm.get("communication", 50),
            "eye_contact": cv_metrics_norm.get("eye_contact", 50),
            "professionalism": professionalism,
            "answer_quality": answer_quality,
            "pacing": pacing,
        })


    tts = None
    if result.get("next_question"):
        tts = tts_service.synthesize_speech(result["next_question"])

    # Persist the completed interaction to DB (one row per QA pair)
    try:
        record = {
            "role": session["role"],
            "level": session["level"],
            "question": session["questions"][session["current_index"]],
            "answer": transcription,
            "transcript": transcription,
            "wpm": wpm,
            "filler_rate": filler_rate,
            "sentiment": sentiment_val,
            "confidence": confidence,
            "eye_contact": cv_metrics_norm.get("eye_contact", 50),
            "answer_score": result.get("answer_score", 0),
            "communication_score": comm.get("communication", 50),
            "stress_score": stress.get("stress_score", 50),
            "overall_score": overall_score,
        }
        db_service.insert_interview_session(record)
    except Exception:
        pass

    fb = feedback_service.generate_feedback(transcription, {
        "answer_score": result.get("answer_score", 0),
        "communication": comm.get("communication", 50),
        "filler_rate": filler_rate,
        "pause_count": speech_metrics.get("pause_count", 0),
        "stress_score": stress.get("stress_score", 50),
        "eye_contact": cv_metrics_norm.get("eye_contact", 50),
    })

    return {
        **result,
        "speech_metrics": speech_metrics,
        "cv_metrics": cv_metrics_norm,
        "sentiment": sent,
        "communication": comm,
        "stress": stress,
        "feedback": fb,
        "model_used": model_used,
        "overall_score": overall_score,
        "tts": tts,
    }


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = gemini_engine.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session_id,
        "role": session["role"],
        "level": session["level"],
        "interview_type": session["interview_type"],
        "current_index": session["current_index"],
        "total_questions": len(session["questions"]),
        "history": session["history"],
    }
