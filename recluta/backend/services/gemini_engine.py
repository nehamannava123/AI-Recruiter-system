"""Google Gemini engine for interview question generation and scoring."""

import json
import os
import re
import uuid
from typing import Any

import google.genai as genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))

SYSTEM_PROMPT = """You are a professional HR interviewer conducting a {level} {role} {interview_type} interview.
Ask realistic, behavioural interview questions. After the candidate answers,
provide: (1) a follow-up question OR signal interview completion,
(2) a JSON block with: {{"answer_score": 0-100, "star_compliance": bool,
"feedback": str, "next_question": str | null}}
Always respond with the JSON block at the end wrapped in ```json ... ```"""

FALLBACK_QUESTIONS = {
    "HR": [
        "Tell me about yourself and why you're interested in this role.",
        "Describe a time you worked effectively in a team.",
        "What are your greatest strengths and how do they apply here?",
        "Tell me about a challenge you faced at work and how you handled it.",
        "Where do you see yourself in five years?",
    ],
    "Technical": [
        "Walk me through a technical project you're most proud of.",
        "How do you approach debugging a complex issue?",
        "Explain a technical concept to a non-technical stakeholder.",
        "Describe your experience with system design or architecture.",
        "How do you stay current with technology trends?",
    ],
    "Behavioral": [
        "Tell me about a time you had to meet a tight deadline.",
        "Describe a situation where you had to influence without authority.",
        "Give an example of when you received critical feedback.",
        "Tell me about a time you failed and what you learned.",
        "Describe how you prioritize competing demands.",
    ],
}

_sessions: dict[str, dict[str, Any]] = {}


def _get_model():
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_key_here":
        return None
    try:
        return genai.GenerativeModel("gemini-flash-lite-latest")
    except Exception:
        return None


def _parse_json_block(text: str) -> dict | None:
    match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def _fallback_score(answer: str) -> dict:
    word_count = len(answer.split())
    score = min(85, 50 + word_count // 3)
    star_keywords = {"situation", "task", "action", "result", "challenge", "led", "implemented"}
    star = len(star_keywords & set(answer.lower().split())) >= 2
    return {
        "answer_score": score,
        "star_compliance": star,
        "feedback": "Good effort. Try structuring answers using the STAR method.",
        "next_question": None,
    }


def create_session(role: str, level: str, interview_type: str, resume_summary: str | None = None) -> dict:
    session_id = str(uuid.uuid4())
    questions = FALLBACK_QUESTIONS.get(interview_type, FALLBACK_QUESTIONS["HR"])
    session = {
        "id": session_id,
        "role": role,
        "level": level,
        "interview_type": interview_type,
        "resume_summary": resume_summary or "",
        "questions": questions,
        "current_index": 0,
        "history": [],
        "metrics_accum": [],
    }
    _sessions[session_id] = session
    if resume_summary:
        first_question = (
            f"I see your resume mentions: {resume_summary}. "
            f"Can you walk me through your strongest relevant experience and how it prepares you for this {interview_type.lower()} role?"
        )
    else:
        first_question = questions[0]
    return {"session_id": session_id, "first_question": first_question}


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def process_response(
    session_id: str,
    transcription: str,
    cv_metrics: dict | None = None,
) -> dict:
    session = _sessions.get(session_id)
    if not session:
        raise ValueError("Session not found")

    current_q = session["questions"][session["current_index"]]
    model = _get_model()
    api_key = os.getenv("GEMINI_API_KEY", "")

    parsed = None
    if model and api_key and api_key != "your_key_here":
        prompt = f"""Question: {current_q}
Candidate answer: {transcription}
This is question {session['current_index'] + 1} of {len(session['questions'])}.
If this is the last question, set next_question to null and indicate completion.
Respond with JSON only in a ```json block."""
        try:
            system = SYSTEM_PROMPT.format(
                level=session["level"],
                role=session["role"],
                interview_type=session["interview_type"],
            )
            if session.get("resume_summary"):
                system += (
                    "\nCandidate resume summary: "
                    + session["resume_summary"]
                )
            response = model.generate_content(
                f"{system}\n\n{prompt}",
                generation_config={"temperature": 0.7, "max_output_tokens": 1024},
            )
            parsed = _parse_json_block(response.text)
        except Exception:
            parsed = None

    if not parsed:
        parsed = _fallback_score(transcription)
        next_idx = session["current_index"] + 1
        if next_idx < len(session["questions"]):
            parsed["next_question"] = session["questions"][next_idx]
        else:
            parsed["next_question"] = None

    session["history"].append({
        "question": current_q,
        "answer": transcription,
        "answer_score": parsed.get("answer_score", 70),
        "star_compliance": parsed.get("star_compliance", False),
        "feedback": parsed.get("feedback", ""),
        "cv_metrics": cv_metrics or {},
    })

    next_idx = session["current_index"] + 1
    if next_idx >= len(session["questions"]):
        is_complete = True
        next_question = None
    else:
        is_complete = False
        session["current_index"] = next_idx
        next_question = parsed.get("next_question") or session["questions"][next_idx]

    return {
        "transcription": transcription,
        "answer_score": parsed.get("answer_score", 70),
        "star_compliance": parsed.get("star_compliance", False),
        "feedback": parsed.get("feedback", ""),
        "next_question": next_question,
        "is_complete": is_complete,
    }
