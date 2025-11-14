"""
Configuration management for the QuizPoolAI backend.
"""

from functools import lru_cache
from typing import List

from dotenv import load_dotenv
from pydantic import BaseSettings, Field, validator

# Load environment variables from .env if available.
load_dotenv()


class Settings(BaseSettings):
    """Application configuration derived from environment variables."""

    app_name: str = "YouTube Quiz Generator API"
    environment: str = "development"
    log_level: str = "INFO"
    gemini_api_key: str = ""
    pinecone_api_key: str = ""
    yt_cookies_path: str = "cookies.txt"
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"])
    rate_limit_requests: int = 60
    rate_limit_window_seconds: int = 60
    min_questions: int = 1
    max_questions: int = 50
    default_questions: int = 5
    whisper_model: str = "base"
    metrics_namespace: str = "quizpoolai"

    class Config:
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("allowed_origins", pre=True)
    @classmethod
    def parse_origins(cls, value):
        if isinstance(value, str):
            parts = [origin.strip() for origin in value.split(",") if origin.strip()]
            return parts or ["*"]
        return value


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
