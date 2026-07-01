"""Supabase DB helper for persisting interview sessions."""

import os
import logging
from typing import Any, Dict, Optional

try:
    from supabase import create_client  # type: ignore
except Exception:
    create_client = None

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

logger = logging.getLogger("recluta.db")


def _get_client():
    if not create_client or not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase client unavailable; falling back to local storage")
        return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.exception("Failed to create supabase client: %s", e)
        return None


def insert_interview_session(record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Insert a record into the `interview_sessions` table.

    If Supabase is unavailable, append to a local JSONL file as a fallback.
    """
    client = _get_client()
    try:
        if client:
            res = client.table("interview_sessions").insert(record).execute()
            logger.info("Inserted interview session to Supabase")
            return res.data if hasattr(res, "data") else None
        # Fallback: write to local file
        import json
        from datetime import datetime

        path = os.path.join(os.getcwd(), "interview_sessions_fallback.jsonl")
        record_copy = dict(record)
        record_copy.setdefault("_saved_at", datetime.utcnow().isoformat())
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record_copy, ensure_ascii=False) + "\n")
        logger.info("Appended interview session to %s", path)
        return record_copy
    except Exception as e:
        logger.exception("Failed to persist interview session: %s", e)
        return None


def fetch_all_sessions() -> list:
    """Return all sessions from Supabase or from local fallback JSONL."""
    client = _get_client()
    try:
        if client:
            res = client.table("interview_sessions").select("*").execute()
            return res.data if hasattr(res, "data") else []
        # Local fallback
        import json
        path = os.path.join(os.getcwd(), "interview_sessions_fallback.jsonl")
        if not os.path.exists(path):
            return []
        rows = []
        with open(path, "r", encoding="utf-8") as fh:
            for line in fh:
                try:
                    rows.append(json.loads(line))
                except Exception:
                    continue
        return rows
    except Exception as e:
        logger.exception("fetch_all_sessions failed: %s", e)
        return []


def count_sessions() -> int:
    client = _get_client()
    try:
        if client:
            res = client.table("interview_sessions").select("id", count="exact").execute()
            # supabase-py returns data; this is best-effort
            return len(res.data) if hasattr(res, "data") and res.data else 0
        return len(fetch_all_sessions())
    except Exception as e:
        logger.exception("count_sessions failed: %s", e)
        return 0
