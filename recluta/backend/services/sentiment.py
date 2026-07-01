"""Sentiment analysis helpers with fallbacks."""

from typing import Dict, Any
import logging

logger = logging.getLogger("recluta.sentiment")

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Return sentiment and confidence. Try VADER/TextBlob if available, else fallback."""
    try:
        # Prefer NLTK VADER if installed
        try:
            from nltk.sentiment import SentimentIntensityAnalyzer

            sia = SentimentIntensityAnalyzer()
            scores = sia.polarity_scores(text)
            sentiment = round((scores.get("compound", 0.0) + 1) / 2, 2)
            confidence = int((abs(scores.get("compound", 0.0)) * 100))
            return {"sentiment": sentiment, "confidence_score": confidence}
        except Exception:
            pass

        # Try TextBlob
        try:
            from textblob import TextBlob

            tb = TextBlob(text)
            polarity = tb.sentiment.polarity
            sentiment = round((polarity + 1) / 2, 2)
            confidence = int(min(100, abs(polarity) * 100 + 30))
            return {"sentiment": sentiment, "confidence_score": confidence}
        except Exception:
            pass

        # Fallback simple scoring
        from ml_models.scoring import simple_sentiment

        s = simple_sentiment(text)
        return {"sentiment": s, "confidence_score": int(s * 100)}
    except Exception as e:
        logger.exception("analyze_sentiment failed: %s", e)
        return {"sentiment": 0.6, "confidence_score": 60}
