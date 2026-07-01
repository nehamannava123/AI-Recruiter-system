"""ElevenLabs-based text-to-speech for interview questions."""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]
STATIC_AUDIO_DIR = BASE_DIR / "static" / "audio"
STATIC_AUDIO_URL_PREFIX = "/static/audio"


def _get_client():
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not api_key or api_key == "your_key_here":
        return None

    try:
        from elevenlabs.client import ElevenLabs

        return ElevenLabs(api_key=api_key)
    except Exception:
        return None


def _extract_audio_bytes(payload: Any) -> bytes | None:
    if payload is None:
        return None
    if isinstance(payload, (bytes, bytearray)):
        return bytes(payload)
    if hasattr(payload, "content"):
        content = getattr(payload, "content")
        if isinstance(content, (bytes, bytearray)):
            return bytes(content)
    if hasattr(payload, "read"):
        try:
            return payload.read()
        except Exception:
            return None
    if isinstance(payload, dict):
        for key in ("audio", "data", "content", "bytes", "audio_bytes"):
            value = payload.get(key)
            if isinstance(value, (bytes, bytearray)):
                return bytes(value)
    if isinstance(payload, (list, tuple)):
        for item in payload:
            extracted = _extract_audio_bytes(item)
            if extracted:
                return extracted
    return None


def generate_speech(text: str) -> dict[str, Any]:
    """Generate an MP3 file for the supplied text and return a public URL."""
    if not text or not text.strip():
        return {"success": False, "audio_url": None, "error": "empty_text"}

    STATIC_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    client = _get_client()
    if client is None:
        return {
            "success": False,
            "audio_url": None,
            "error": "ELEVENLABS_API_KEY is not configured",
        }

    try:
        voice_id = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb").strip()
        model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2").strip()
        output_format = os.getenv("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128").strip()

        payload = None
        for attempt in (
            lambda: client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id=model_id,
                output_format=output_format,
            ),
            lambda: client.generate(text=text, voice=voice_id, model=model_id),
            lambda: client.generate(text=text, voice=voice_id),
        ):
            try:
                payload = attempt()
                break
            except (AttributeError, TypeError):
                continue
            except Exception:
                payload = None
                break

        audio_bytes = _extract_audio_bytes(payload)
        if not audio_bytes:
            return {"success": False, "audio_url": None, "error": "elevenlabs_failed"}

        filename = f"{uuid.uuid4().hex}.mp3"
        output_path = STATIC_AUDIO_DIR / filename
        output_path.write_bytes(audio_bytes)
        return {"success": True, "audio_url": f"{STATIC_AUDIO_URL_PREFIX}/{filename}", "error": None}
    except Exception as exc:
        return {"success": False, "audio_url": None, "error": str(exc)}