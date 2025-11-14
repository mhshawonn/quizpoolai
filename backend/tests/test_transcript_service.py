import pytest

from app.config import Settings
from app.services import transcript_service as transcript_module
from app.services.transcript_service import TranscriptService


@pytest.fixture
def settings():
    return Settings(gemini_api_key="test-key")


def test_extract_video_id(settings):
    service = TranscriptService(settings)
    video_id = service.extract_video_id("https://youtu.be/dQw4w9WgXcQ")
    assert video_id == "dQw4w9WgXcQ"


def test_invalid_video_id(settings):
    service = TranscriptService(settings)
    with pytest.raises(Exception):
        service.extract_video_id("https://example.com")


def test_get_transcript_manual_fallback(monkeypatch, settings):
    service = TranscriptService(settings)

    def fake_get_transcript(video_id, languages):
        raise RuntimeError("no english")

    class DummyTranscript:
        language = "fr"

        def fetch(self):
            return [{"text": "bonjour"}, {"text": "le monde"}]

    class DummyTranscripts:
        def find_manually_created_transcript(self, langs):
            return DummyTranscript()

        def find_generated_transcript(self, langs):
            raise RuntimeError("no auto")

    def fake_list_transcripts(video_id):
        return DummyTranscripts()

    monkeypatch.setattr(
        transcript_module.YouTubeTranscriptApi, "get_transcript", staticmethod(fake_get_transcript)
    )
    monkeypatch.setattr(
        transcript_module.YouTubeTranscriptApi, "list_transcripts", staticmethod(fake_list_transcripts)
    )

    transcript = service.get_transcript("abcdefghijk")
    assert "bonjour" in transcript
