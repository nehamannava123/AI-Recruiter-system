"""Whisper-based speech transcription service."""

import base64
import io
import struct
import tempfile
from pathlib import Path

_whisper_model = None


def _get_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
        except Exception:
            _whisper_model = False
    return _whisper_model if _whisper_model is not False else None


def _decode_base64_audio(audio_base64: str) -> bytes:
    if "," in audio_base64:
        audio_base64 = audio_base64.split(",", 1)[1]
    return base64.b64decode(audio_base64)


def _bytes_to_wav(audio_bytes: bytes, sample_rate: int = 16000) -> bytes:
    """Wrap raw PCM or webm bytes in a minimal WAV header if needed."""
    if audio_bytes[:4] == b"RIFF":
        return audio_bytes
    if audio_bytes[:4] == b"\x1aE\xdf\xa3" or audio_bytes[:4] == b"OggS":
        return audio_bytes
    num_samples = len(audio_bytes) // 2
    buffer = io.BytesIO()
    buffer.write(b"RIFF")
    buffer.write(struct.pack("<I", 36 + num_samples * 2))
    buffer.write(b"WAVE")
    buffer.write(b"fmt ")
    buffer.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
    buffer.write(b"data")
    buffer.write(struct.pack("<I", num_samples * 2))
    buffer.write(audio_bytes)
    return buffer.getvalue()


def transcribe_audio(audio_base64: str) -> dict:
    """Transcribe base64 audio and return text with word timestamps."""
    audio_bytes = _decode_base64_audio(audio_base64)
    model = _get_model()

    if model is None:
        return {
            "transcription": "[Audio transcription unavailable — Whisper model not loaded]",
            "words": [],
            "duration": 0.0,
        }

    wav_bytes = _bytes_to_wav(audio_bytes)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(wav_bytes)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path, beam_size=1)
        words = []
        full_text_parts = []
        for segment in segments:
            full_text_parts.append(segment.text.strip())
            if hasattr(segment, "words") and segment.words:
                for w in segment.words:
                    words.append({"word": w.word, "start": w.start, "end": w.end})
        transcription = " ".join(full_text_parts).strip()
        duration = info.duration if info else 0.0
        return {
            "transcription": transcription or "",
            "words": words,
            "duration": duration,
        }
    except Exception as e:
        return {
            "transcription": f"[Transcription error: {str(e)}]",
            "words": [],
            "duration": 0.0,
        }
    finally:
        Path(tmp_path).unlink(missing_ok=True)
