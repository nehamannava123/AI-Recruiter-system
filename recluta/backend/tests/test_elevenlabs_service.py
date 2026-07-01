import unittest

from services.elevenlabs_service import generate_speech


class ElevenLabsServiceTests(unittest.TestCase):
    def test_generate_speech_returns_fallback_without_error(self):
        result = generate_speech("Hello there")
        self.assertIn("audio_url", result)
        self.assertIn("success", result)
        self.assertIsInstance(result["success"], bool)


if __name__ == "__main__":
    unittest.main()
