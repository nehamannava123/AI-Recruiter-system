"""Recluta FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import interview, analysis, report
import os
import logging
from threading import Thread

logger = logging.getLogger("recluta.main")


def _start_background_retrainer():
    """Optional background retrainer that kicks off when ENABLE_RETRAIN_SCHED=true."""
    try:
        if os.getenv("ENABLE_RETRAIN_SCHED", "false").lower() != "true":
            return
        from ml_models import training as training_model
        from services import db as db_service

        def _loop():
            import time
            while True:
                try:
                    count = db_service.count_sessions()
                    logger.info("Background retrainer checking rows=%d", count)
                    if count >= int(os.getenv("RETRAIN_MIN_ROWS", "200")):
                        rows = db_service.fetch_all_sessions()
                        training_model.train_and_select(rows, model_path="score_model.pkl")
                    time.sleep(int(os.getenv("RETRAIN_CHECK_INTERVAL_SECONDS", "3600")))
                except Exception as e:
                    logger.exception("Background retrainer error: %s", e)
                    time.sleep(60)

        t = Thread(target=_loop, daemon=True)
        t.start()
        logger.info("Background retrainer started")
    except Exception:
        logger.exception("Failed to start background retrainer")


app = FastAPI(
    title="Recluta API",
    description="AI-powered virtual interview coaching platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(report.router, prefix="/api/report", tags=["report"])


@app.get("/")
async def root():
    return {"service": "Recluta API", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.on_event("startup")
async def _on_startup():
    _start_background_retrainer()
