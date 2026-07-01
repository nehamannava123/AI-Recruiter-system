"""Combine multiple signals into a stress/nervousness estimate."""

from typing import Dict, Any
import logging

logger = logging.getLogger("recluta.stress")


def estimate_stress(metrics: Dict[str, Any]) -> Dict[str, Any]:
    """Return a stress_score 0-100 based on combined signals."""
    try:
        filler_rate = metrics.get("filler_rate", 0.0)
        pause_count = metrics.get("pause_count", 0)
        sentiment = metrics.get("sentiment", 0.6)
        eye = metrics.get("eye_contact", 50)

        # Higher filler_rate and pauses increase stress; better sentiment and eye contact reduce it.
        stress = (filler_rate * 100) * 0.45 + min(40, pause_count * 3) * 0.25 + (1 - sentiment) * 100 * 0.2 + max(0, (50 - eye)) * 0.1
        stress = round(min(100, max(0, stress)), 1)
        return {"stress_score": stress}
    except Exception as e:
        logger.exception("estimate_stress failed: %s", e)
        return {"stress_score": 50.0}
