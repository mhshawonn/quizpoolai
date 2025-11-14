"""
Pydantic schemas for API requests and responses.
"""

import re
from typing import List

from pydantic import BaseModel, Field, validator


YOUTUBE_ID_PATTERN = re.compile(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*|^([0-9A-Za-z_-]{11})$")


class GenerateQuizRequest(BaseModel):
    youtube_url: str = Field(..., description="Full YouTube video URL")
    num_questions: int = Field(5, ge=1, le=50)
    difficulty: str = Field("medium", regex=r"^(easy|medium|hard)$")

    @validator("youtube_url")
    @classmethod
    def validate_youtube_url(cls, value: str) -> str:
        if not value:
            raise ValueError("YouTube URL is required")
        if "youtube" not in value and "youtu.be" not in value:
            raise ValueError("Provide a valid YouTube URL")
        if not re.search(YOUTUBE_ID_PATTERN, value):
            raise ValueError("YouTube URL must contain a valid video ID")
        return value.strip()


class Quiz(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str


class QuizResponse(BaseModel):
    transcript: str
    quiz: List[Quiz]


class TranscriptResponse(BaseModel):
    video_id: str
    transcript: str
