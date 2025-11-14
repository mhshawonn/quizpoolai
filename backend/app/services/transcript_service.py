"""
Transcript service encapsulating all transcript retrieval logic.
"""

import os
import re
import tempfile
from typing import Optional

import yt_dlp
from fastapi import HTTPException
from youtube_transcript_api import YouTubeTranscriptApi

from ..config import Settings
from ..logger import get_logger


class TranscriptService:
    """Handles transcript retrieval with Whisper fallback."""

    YOUTUBE_PATTERNS = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"(?:embed\/)([0-9A-Za-z_-]{11})",
        r"^([0-9A-Za-z_-]{11})$",
    ]

    SUPPORTED_LANGUAGES = ["en", "bn", "hi", "es", "fr", "de", "ar", "zh"]

    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = get_logger(self.__class__.__name__)
        self._whisper_model = None

    def extract_video_id(self, url: str) -> str:
        """Extract a video ID from any supported YouTube URL pattern."""
        for pattern in self.YOUTUBE_PATTERNS:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    def get_transcript(self, video_id: str) -> str:
        """Attempt to retrieve an existing transcript, fallback to Whisper."""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(
                video_id, languages=["en"]
            )
            transcript = " ".join(entry["text"] for entry in transcript_list)
            self.logger.info("Found English transcript for %s", video_id)
            return transcript
        except Exception as english_error:
            self.logger.info("English transcript unavailable: %s", english_error)

        transcript = self._get_transcript_any_language(video_id)
        if transcript:
            return transcript

        self.logger.warning(
            "No captions available for %s, attempting audio transcription", video_id
        )
        return self._transcribe_from_audio(video_id)

    def _get_transcript_any_language(self, video_id: str) -> Optional[str]:
        try:
            transcript_obj = YouTubeTranscriptApi.list_transcripts(video_id)
        except Exception as error:
            self.logger.info("No transcripts list available: %s", error)
            return None

        for fetcher in (
            transcript_obj.find_manually_created_transcript,
            transcript_obj.find_generated_transcript,
        ):
            try:
                transcript = fetcher(self.SUPPORTED_LANGUAGES)
                data = transcript.fetch()
                result = " ".join(entry["text"] for entry in data)
                self.logger.info(
                    "Using %s transcript in %s",
                    "manual" if fetcher.__name__ == "find_manually_created_transcript" else "auto",
                    transcript.language,
                )
                return result
            except Exception:
                continue
        return None

    def _download_audio_for_transcription(self, video_id: str) -> str:
        temp_dir = tempfile.gettempdir()
        url = f"https://www.youtube.com/watch?v={video_id}"
        cookies_path = (
            self.settings.yt_cookies_path
            if self.settings.yt_cookies_path
            else "cookies.txt"
        )

        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                }
            ],
            "outtmpl": os.path.join(temp_dir, f"{video_id}.%(ext)s"),
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "referer": "https://www.youtube.com/",
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "ios", "web"],
                    "skip": ["hls", "dash", "translated_subs"],
                }
            },
            "http_headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-us,en;q=0.5",
                "Sec-Fetch-Mode": "navigate",
            },
        }

        if cookies_path and os.path.exists(cookies_path):
            ydl_opts["cookiefile"] = cookies_path

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
                return os.path.join(temp_dir, f"{video_id}.mp3")
        except Exception as error:
            self.logger.exception("Audio download failed")
            raise HTTPException(
                status_code=400,
                detail=(
                    "Failed to download audio. Video may be private or age-restricted: "
                    f"{error}"
                ),
            ) from error

    def _transcribe_from_audio(self, video_id: str) -> str:
        """Run Whisper transcription as a fallback."""
        if self._whisper_model is None:
            try:
                import whisper

                self._whisper_model = whisper.load_model(self.settings.whisper_model)
            except ImportError as error:
                raise HTTPException(
                    status_code=500,
                    detail="Whisper not installed. Run: pip install openai-whisper",
                ) from error

        audio_path = None
        try:
            audio_path = self._download_audio_for_transcription(video_id)
            result = self._whisper_model.transcribe(audio_path)
            return result["text"]
        except HTTPException:
            raise
        except Exception as error:
            self.logger.exception("Transcription failed")
            raise HTTPException(
                status_code=500, detail=f"Transcription failed: {error}"
            ) from error
        finally:
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except OSError:
                    pass
