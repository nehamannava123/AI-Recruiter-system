"""Text-to-speech service using Coqui TTS with browser fallback."""

import base64
import io
import os
import tempfile
from pathlib import Path

_tts_model = None


def _get_tts():
    global _tts_model
    if _tts_model is None:
        try:
            from TTS.api import TTS
            _tts_model = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
        except Exception:
            _tts_model = False
    return _tts_model if _tts_model is not False else None


def synthesize_speech(text: str) -> dict:
    """Generate speech audio from text. Returns base64 WAV or empty on failure."""
    tts = _get_tts()
    if tts is None or not text.strip():
        return {"audio_base64": None, "available": False}

    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
        tts.tts_to_file(text=text, file_path=tmp_path)
        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()
        Path(tmp_path).unlink(missing_ok=True)
        encoded = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio_base64": encoded, "available": True}
    except Exception:
        return {"audio_base64": None, "available": False}


def synthesize_speech_stream(text: str):
    """Placeholder for streaming TTS — returns full synthesis."""
    return synthesize_speech(text)
