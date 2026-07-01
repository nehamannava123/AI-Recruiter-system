"""Model training utilities for learned overall score prediction."""

from typing import Tuple, Optional, Any
import os
import logging
import joblib
import numpy as np

logger = logging.getLogger("recluta.training")


def _load_data_from_supabase(supabase_client) -> Tuple[Any, Any]:
    # Lightweight loader; the caller decides how to provide supabase_client.
    resp = supabase_client.table("interview_sessions").select("*").execute()
    rows = resp.data if hasattr(resp, "data") else []
    return rows


def _prepare_features(rows: list) -> Tuple[np.ndarray, np.ndarray]:
    import numpy as np

    X = []
    y = []
    for r in rows:
        try:
            eye = float(r.get("eye_contact", 50))
            wpm = float(r.get("wpm", 0))
            filler = float(r.get("filler_rate", 0))
            sentiment = float(r.get("sentiment", 0.6))
            comm = float(r.get("communication_score", 50))
            stress = float(r.get("stress_score", 50))
            overall = float(r.get("overall_score", 50))
            X.append([eye, wpm, filler, sentiment, comm, stress])
            y.append(overall)
        except Exception:
            continue
    if not X:
        return np.empty((0, 6)), np.empty((0,))
    return np.array(X), np.array(y)


def train_and_select(rows: list, model_path: str = "score_model.pkl") -> Optional[str]:
    """Train RandomForest and XGBoost (if available), pick best by cross-val score, save model."""
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.model_selection import cross_val_score
    except Exception as e:
        logger.exception("scikit-learn required for training: %s", e)
        return None

    X, y = _prepare_features(rows)
    if X.size == 0 or len(y) < 50:
        logger.info("Not enough data to train (need >=50 rows). Rows=%d", len(y))
        return None

    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    try:
        rf_score = cross_val_score(rf, X, y, cv=3, scoring="r2").mean()
    except Exception:
        rf_score = -1

    xgb_score = -1
    xgb = None
    try:
        import xgboost as xgb_mod

        xgb = xgb_mod.XGBRegressor(n_estimators=100, random_state=42)
        xgb_score = cross_val_score(xgb, X, y, cv=3, scoring="r2").mean()
    except Exception:
        xgb = None

    best = None
    if xgb and xgb_score > rf_score:
        best = xgb
    else:
        best = rf

    best.fit(X, y)
    joblib.dump(best, model_path)
    logger.info("Saved trained model to %s (rf_score=%.3f xgb_score=%.3f)", model_path, rf_score, xgb_score)
    return model_path


def load_model(path: str = "score_model.pkl"):
    try:
        if not os.path.exists(path):
            return None
        return joblib.load(path)
    except Exception as e:
        logger.exception("load_model failed: %s", e)
        return None
