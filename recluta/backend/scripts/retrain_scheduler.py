"""Standalone retrain scheduler script.

Use a system scheduler to run this nightly, or run as a background service.
"""
import os
import time
import logging
from datetime import datetime, timedelta

from ml_models import training as training_model
from services import db as db_service

logger = logging.getLogger("recluta.scheduler")
logging.basicConfig(level=logging.INFO)


def should_train(min_rows: int = 200) -> bool:
    count = db_service.count_sessions()
    logger.info("Found %d sessions", count)
    return count >= min_rows


def run_once(min_rows: int = 200):
    if not should_train(min_rows):
        logger.info("Not enough data to train yet (need %d)", min_rows)
        return
    rows = db_service.fetch_all_sessions()
    model_path = training_model.train_and_select(rows, model_path="score_model.pkl")
    if model_path:
        logger.info("Training complete, saved %s", model_path)
    else:
        logger.error("Training failed or no model saved")


def run_loop(interval_hours: int = 24, min_rows: int = 200):
    logger.info("Starting retrain scheduler: interval=%dh min_rows=%d", interval_hours, min_rows)
    while True:
        try:
            now = datetime.utcnow()
            # Run at midnight UTC by default
            next_run = datetime(now.year, now.month, now.day) + timedelta(days=1)
            seconds = (next_run - now).total_seconds()
            logger.info("Sleeping until next run: ~%d seconds", int(seconds))
            time.sleep(max(60, seconds))
            run_once(min_rows)
        except Exception as e:
            logger.exception("Scheduler loop error: %s", e)
            time.sleep(60 * 10)


if __name__ == "__main__":
    run_once()
