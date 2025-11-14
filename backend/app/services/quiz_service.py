"""
Quiz generation service built on top of Google Gemini.
"""

import json
from typing import Callable, List, Optional

import google.generativeai as genai
from fastapi import HTTPException

from ..config import Settings
from ..logger import get_logger
from ..models.schemas import Quiz


class QuizService:
    """Handles quiz generation and embedding requests."""

    QUIZ_PROMPT_TEMPLATE = """Based on the following video transcript, create {num_questions} multiple-choice quiz questions at {difficulty} difficulty level.

Transcript:
{transcript}

Requirements:
1. Create {num_questions} questions that test understanding of key concepts
2. Each question should have 4 options (A, B, C, D)
3. Difficulty level: {difficulty}
4. Include a brief explanation for the correct answer

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {{
    "question": "What is the main topic discussed?",
    "options": ["A) Topic 1", "B) Topic 2", "C) Topic 3", "D) Topic 4"],
    "correct_answer": "A) Topic 1",
    "explanation": "The transcript clearly states..."
  }}
]"""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = get_logger(self.__class__.__name__)
        self._gemini_model = None
        self._configure_gemini()

    def _configure_gemini(self) -> None:
        if not self.settings.gemini_api_key:
            self.logger.warning("GEMINI_API_KEY not set. Quiz generation will fail.")
            return
        genai.configure(api_key=self.settings.gemini_api_key)
        self._gemini_model = genai.GenerativeModel("gemini-2.5-flash")

    def generate_quiz(
        self, transcript: str, num_questions: int, difficulty: str
    ) -> List[Quiz]:
        if not self._gemini_model:
            raise HTTPException(
                status_code=500,
                detail="Gemini model is not configured. Set GEMINI_API_KEY.",
            )

        transcript = self._trim_transcript(transcript)
        prompt = self.QUIZ_PROMPT_TEMPLATE.format(
            num_questions=num_questions, difficulty=difficulty, transcript=transcript
        )

        try:
            response = self._gemini_model.generate_content(prompt)
            quiz_text = response.text.strip()
            quiz_data = self._parse_quiz_json(quiz_text)
            return [Quiz(**item) for item in quiz_data]
        except HTTPException:
            raise
        except json.JSONDecodeError as error:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse quiz JSON: {error}. Response: {quiz_text[:200]}",
            ) from error
        except Exception as error:
            self.logger.exception("Quiz generation failed")
            raise HTTPException(
                status_code=500, detail=f"Quiz generation failed: {error}"
            ) from error

    def _trim_transcript(self, transcript: str, max_chars: int = 30000) -> str:
        if len(transcript) > max_chars:
            return transcript[:max_chars] + "..."
        return transcript

    def _parse_quiz_json(self, quiz_text: str) -> List[dict]:
        if "```json" in quiz_text:
            quiz_text = quiz_text.split("```json")[1].split("```")[0].strip()
        elif "```" in quiz_text:
            quiz_text = quiz_text.split("```")[1].split("```")[0].strip()
        return json.loads(quiz_text)

    def get_embedding_fn(self) -> Callable[[str], List[float]]:
        def embed(text: str) -> List[float]:
            try:
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text,
                    task_type="retrieval_document",
                )
                return result.get("embedding", [])
            except Exception as error:
                self.logger.warning("Embedding error: %s", error)
                return []

        return embed
