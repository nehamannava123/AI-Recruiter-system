"""Deterministic scoring functions for interview metrics."""

FILLER_WORDS = {
    "um", "uh", "like", "you know", "so", "actually", "basically",
    "literally", "right", "okay", "well", "kind of", "sort of",
}


def count_filler_words(text: str) -> tuple[list[str], int]:
    """Return list of filler words found and total count."""
    words = text.lower().split()
    found = []
    for word in words:
        cleaned = word.strip(".,!?;:'\"")
        if cleaned in FILLER_WORDS:
            found.append(cleaned)
    return found, len(found)


def compute_wpm(text: str, duration_seconds: float) -> float:
    """Words per minute from transcript and duration."""
    if duration_seconds <= 0:
        return 0.0
    word_count = len(text.split())
    return round((word_count / duration_seconds) * 60, 1)


def compute_filler_rate(filler_count: int, word_count: int) -> float:
    """Filler words per 100 words."""
    if word_count <= 0:
        return 0.0
    return round((filler_count / word_count) * 100, 2)


def compute_clarity_score(wpm: float, filler_rate: float) -> float:
    """Clarity score 0-100 based on pace and filler usage."""
    pace_score = 100 - abs(wpm - 140) * 0.5 if wpm > 0 else 50
    pace_score = max(0, min(100, pace_score))
    filler_penalty = min(filler_rate * 8, 60)
    return round(max(0, min(100, pace_score - filler_penalty + 20)), 1)


def compute_confidence_score(
    eye_contact_pct: float,
    filler_rate: float,
    wpm: float,
    sentiment_score: float,
) -> float:
    """Weighted confidence score 0-100."""
    score = (
        eye_contact_pct * 0.30
        + max(0, 100 - filler_rate * 10) * 0.25
        + (min(wpm, 160) / 160 * 100) * 0.25
        + sentiment_score * 100 * 0.20
    )
    return round(min(score, 100), 1)


def compute_overall_score(metrics: dict) -> float:
    """Aggregate overall score from individual metrics."""
    weights = {
        "confidence": 0.20,
        "communication": 0.15,
        "eye_contact": 0.15,
        "professionalism": 0.15,
        "answer_quality": 0.20,
        "pacing": 0.15,
    }
    total = 0.0
    for key, weight in weights.items():
        total += metrics.get(key, 50) * weight
    return round(min(total, 100), 1)


def compute_answer_quality_score(
    answer_score: float,
    star_compliance: bool,
    word_count: int,
) -> float:
    """Combine AI answer score with STAR compliance."""
    base = answer_score
    if star_compliance:
        base = min(100, base + 10)
    if word_count < 20:
        base = max(0, base - 15)
    elif word_count > 300:
        base = max(0, base - 5)
    return round(min(base, 100), 1)


def compute_eye_contact_score(eye_contact_pct: float) -> float:
    return round(min(eye_contact_pct, 100), 1)


def compute_pacing_score(wpm: float) -> float:
    """Optimal WPM range 120-160."""
    if wpm <= 0:
        return 50.0
    if 120 <= wpm <= 160:
        return 100.0
    if wpm < 120:
        return round(max(40, 100 - (120 - wpm) * 1.5), 1)
    return round(max(40, 100 - (wpm - 160) * 1.2), 1)


def compute_professionalism_score(
    eye_contact_pct: float,
    filler_rate: float,
    smile_score: float,
) -> float:
    score = (
        eye_contact_pct * 0.40
        + max(0, 100 - filler_rate * 12) * 0.35
        + smile_score * 100 * 0.25
    )
    return round(min(score, 100), 1)


def simple_sentiment(text: str) -> float:
    """Simple keyword-based sentiment 0-1."""
    positive = {
        "confident", "success", "achieve", "lead", "team", "improve",
        "learn", "passion", "excited", "proud", "deliver", "result",
        "collaborate", "innovate", "solve", "growth", "impact",
    }
    negative = {
        "fail", "hate", "bad", "worst", "never", "can't", "dont",
        "problem", "difficult", "struggle", "lazy", "boring",
    }
    words = set(text.lower().split())
    pos = len(words & positive)
    neg = len(words & negative)
    if pos + neg == 0:
        return 0.6
    return round(max(0.2, min(1.0, 0.5 + (pos - neg) * 0.1)), 2)
