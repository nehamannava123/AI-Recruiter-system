"""Computer vision metric normalization and heuristics."""

from typing import Dict, Any
import logging

logger = logging.getLogger("recluta.cv")


def analyze_cv_metrics(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize incoming CV metrics from frontend or MP pipeline.

    Expected keys: eye_contact (0-1 or 0-100), smile (0-1), head_stability (0-1)
    """
    try:
        eye = raw.get("eye_contact", raw.get("eye_contact_pct", 0))
        if eye <= 1:
            eye = eye * 100
        smile = raw.get("smile", 0.0)
        if smile > 1:
            smile = min(1.0, float(smile))
        head = raw.get("head_stability", raw.get("head_pose", 0.0))
        if head and head <= 1:
            head = head
        head = float(head or 0.0)

        return {
            "eye_contact": round(min(100.0, float(eye)), 1),
            "smile": round(min(1.0, float(smile)), 2),
            "head_stability": round(min(1.0, float(head)), 2),
        }
    except Exception as e:
        logger.exception("analyze_cv_metrics failed: %s", e)
        return {"eye_contact": 50.0, "smile": 0.0, "head_stability": 0.5}
