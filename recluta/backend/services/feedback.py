"""Generate actionable feedback from transcript and metrics."""

from typing import Dict, Any, List
import logging

logger = logging.getLogger("recluta.feedback")


def generate_feedback(transcript: str, metrics: Dict[str, Any]) -> Dict[str, List[str]]:
    """Return strengths, weaknesses, and suggestions based on the session."""
    try:
        strengths: List[str] = []
        weaknesses: List[str] = []
        suggestions: List[str] = []

        if metrics.get("answer_score", 0) >= 80:
            strengths.append("Strong technical correctness and completeness")
        if metrics.get("communication", 0) >= 80:
            strengths.append("Clear and effective communication")
        if metrics.get("eye_contact", 0) >= 70:
            strengths.append("Good eye contact")

        if metrics.get("filler_rate", 0) > 0.05:
            weaknesses.append("Frequent filler words detected")
            suggestions.append("Practice pausing silently instead of using fillers (um/uh/like)")
        if metrics.get("pause_count", 0) > 3:
            weaknesses.append("Multiple long pauses")
            suggestions.append("Record practice answers to smooth transitions and reduce long pauses")
        if metrics.get("stress_score", 100) > 60:
            weaknesses.append("Elevated nervousness indicators")
            suggestions.append("Breathing techniques and mock interviews help reduce stress")

        # tailor suggestions from transcript length
        words = len(transcript.split())
        if words < 30:
            suggestions.append("Expand answers with a brief context, action, and result (STAR)")
        if words > 400:
            suggestions.append("Trim overly long answers; be concise and focus on impact")

        return {"strengths": strengths, "weaknesses": weaknesses, "suggestions": suggestions}
    except Exception as e:
        logger.exception("generate_feedback failed: %s", e)
        return {"strengths": [], "weaknesses": [], "suggestions": []}
