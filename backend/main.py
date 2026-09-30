import os

from sqlalchemy import inspect, text
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI

from database import Base, engine
import models  # noqa: F401  (import so SQLAlchemy registers the tables below)

from routes.auth import router as auth_router
from routes.jobs import router as jobs_router
from routes.upload import router as upload_router
from routes.rank import router as rank_router
from routes.trust import router as trust_router
from routes.interview import router as interview_router
from routes.screening import router as screening_router
from routes.recruiter import router as recruiter_router
from routes.candidate import router as candidate_router

# Creates candidates.db and all tables on first run. Safe to call every startup.
Base.metadata.create_all(bind=engine)


def _sync_missing_columns():
    """Best-effort ALTER TABLE for SQLite so existing dev databases (created
    before the screening round was added) pick up the new columns without
    needing to delete candidates.db."""

    inspector = inspect(engine)
    if "applications" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("applications")}
    model_columns = models.Application.__table__.columns

    with engine.begin() as conn:
        for column in model_columns:
            if column.name in existing_columns:
                continue
            col_type = column.type.compile(engine.dialect)
            conn.execute(text(f"ALTER TABLE applications ADD COLUMN {column.name} {col_type}"))


_sync_missing_columns()

os.makedirs("uploads/interviews", exist_ok=True)

app = FastAPI(title="AI Recruiter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(upload_router)
app.include_router(rank_router)
app.include_router(trust_router)
app.include_router(interview_router)
app.include_router(screening_router)
app.include_router(recruiter_router)
app.include_router(candidate_router)

# Serves recorded interview videos so recruiters/candidates can play them back.
app.mount("/media", StaticFiles(directory="uploads"), name="media")


@app.get("/")
def home():
    return {"message": "AI Recruiter Running"}
