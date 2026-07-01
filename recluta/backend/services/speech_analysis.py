"""Speech analysis utilities: WPM, filler rate, pauses, confidence."""

from typing import Dict, Any
import re
import logging

logger = logging.getLogger("recluta.speech")

FILLERS = {"um", "uh", "like", "actually", "basically", "you know", "kind of", "sort of", "literally"}


def analyze_speech(transcript: str, duration_seconds: float = 0.0) -> Dict[str, Any]:
    """Return speech metrics computed from transcript and duration."""
    try:
        words = re.findall(r"\w+", transcript)
        word_count = len(words)
        duration = max(0.001, duration_seconds)
        wpm = round((word_count / duration) * 60, 1) if duration_seconds > 0 else 0.0

        # filler words
        found = [w for w in [t.lower().strip(".,!?;:\"'()") for t in transcript.split()] if w in FILLERS]
        filler_count = len(found)
        filler_rate = round(filler_count / word_count, 4) if word_count > 0 else 0.0

        # pauses heuristic: ellipses, dashes, or long gaps indicated by multiple spaces
        pause_marks = len(re.findall(r"(\.\.\.|—|--)", transcript))
        multi_space = len(re.findall(r"  +", transcript))
        pause_count = pause_marks + multi_space

        # speech confidence heuristic: inverse of filler_rate and pause frequency
        speech_confidence = max(0.0, min(1.0, 1.0 - filler_rate - min(0.5, pause_count * 0.02)))

        return {
            "wpm": wpm,
            "total_words": word_count,
            "filler_rate": filler_rate,
            "filler_count": filler_count,
            "pause_count": pause_count,
            "speech_confidence": round(speech_confidence, 2),
        }
    except Exception as e:
        logger.exception("analyze_speech failed: %s", e)
        return {"wpm": 0.0, "filler_rate": 0.0, "pause_count": 0, "speech_confidence": 0.0}
