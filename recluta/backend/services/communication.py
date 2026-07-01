"""Communication quality analysis: grammar, clarity, vocabulary."""

from typing import Dict, Any
import logging
import statistics
import re

logger = logging.getLogger("recluta.communication")


def analyze_communication(transcript: str, metrics: Dict[str, Any]) -> Dict[str, Any]:
    """Return communication scores (0-100) for grammar, clarity, vocabulary, relevance."""
    try:
        sentences = re.split(r"[\.!?]+", transcript)
        sentences = [s.strip() for s in sentences if s.strip()]
        words = re.findall(r"\w+", transcript)
        word_count = len(words)
        avg_sentence_len = statistics.mean([len(s.split()) for s in sentences]) if sentences else 0

        # Grammar heuristic: penalize very short/very long sentences
        grammar_score = max(30, min(100, 100 - abs(avg_sentence_len - 14) * 4))

        # Clarity: combine clarity from ml_models if provided else use pace/filler
        clarity = metrics.get("clarity_score") or 60

        # Vocabulary diversity: unique words ratio
        vocab_diversity = (len(set(w.lower() for w in words)) / max(1, word_count)) * 100

        # Relevance: placeholder uses sentiment as proxy
        relevance = (metrics.get("sentiment", 0.6) * 100)

        communication = round((grammar_score * 0.4 + clarity * 0.35 + vocab_diversity * 0.25), 1)

        return {
            "grammar": round(grammar_score, 1),
            "clarity": round(float(clarity), 1),
            "vocabulary": round(min(100, vocab_diversity), 1),
            "relevance": round(relevance, 1),
            "communication": round(min(100, communication), 1),
        }
    except Exception as e:
        logger.exception("analyze_communication failed: %s", e)
        return {"grammar": 60.0, "clarity": 60.0, "vocabulary": 50.0, "relevance": 60.0, "communication": 60.0}
