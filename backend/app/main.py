"""
FastAPI application wiring for the QuizPoolAI backend.
"""

import asyncio
import time
from collections import defaultdict
from typing import Any, Dict

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .logger import configure_logging, get_logger
from .models.schemas import (
    GenerateQuizRequest,
    QuizResponse,
    TranscriptResponse,
)
from .services.quiz_service import QuizService
from .services.transcript_service import TranscriptService
from .storage.pinecone_client import PineconeStorage


class MetricsCollector:
    """Minimal in-memory metrics helper."""

    def __init__(self):
        self.counters: Dict[str, int] = defaultdict(int)

    def increment(self, name: str) -> None:
        self.counters[name] += 1

    def export(self) -> Dict[str, int]:
        return dict(self.counters)


class SimpleRateLimiter:
    """Coarse-grained IP based rate limiter."""

    def __init__(self, settings: Settings):
        self.limit = settings.rate_limit_requests
        self.window = settings.rate_limit_window_seconds
        self.requests: Dict[str, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()
        self.logger = get_logger(self.__class__.__name__)

    async def __call__(self, request: Request, call_next):
        identifier = request.client.host if request.client else "anonymous"
        async with self.lock:
            record = self.requests.get(identifier)
            now = time.time()
            if not record or now - record["window_start"] > self.window:
                self.requests[identifier] = {"window_start": now, "count": 1}
            else:
                record["count"] += 1
                if record["count"] > self.limit:
                    self.logger.warning("Rate limit exceeded for %s", identifier)
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many requests. Slow down and try again."},
                    )
        response = await call_next(request)
        return response


def create_app() -> FastAPI:
    """Application factory used by ASGI and tests."""
    settings = get_settings()
    configure_logging(settings)

    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    metrics = MetricsCollector()
    rate_limiter = SimpleRateLimiter(settings)
    app.middleware("http")(rate_limiter)

    transcript_service = TranscriptService(settings)
    quiz_service = QuizService(settings)
    pinecone_storage = PineconeStorage(settings)

    def get_services():
        return {
            "settings": settings,
            "transcripts": transcript_service,
            "quiz": quiz_service,
            "pinecone": pinecone_storage,
            "metrics": metrics,
        }

    @app.post("/api/generate-quiz", response_model=QuizResponse)
    async def generate_quiz_endpoint(
        payload: GenerateQuizRequest, services=Depends(get_services)
    ):
        metrics = services["metrics"]
        metrics.increment("generate_quiz_requests_total")

        transcripts: TranscriptService = services["transcripts"]
        quiz_service: QuizService = services["quiz"]
        pinecone: PineconeStorage = services["pinecone"]

        video_id = transcripts.extract_video_id(payload.youtube_url)
        transcript = transcripts.get_transcript(video_id)

        if not transcript or len(transcript) < 100:
            raise HTTPException(
                status_code=400, detail="Transcript too short or unavailable."
            )

        pinecone.store_transcript(transcript, video_id, quiz_service.get_embedding_fn())

        quiz = quiz_service.generate_quiz(
            transcript=transcript,
            num_questions=payload.num_questions,
            difficulty=payload.difficulty,
        )

        return QuizResponse(transcript=transcript, quiz=quiz)

    @app.get("/api/transcript/{video_id}", response_model=TranscriptResponse)
    async def get_transcript_endpoint(video_id: str, services=Depends(get_services)):
        services["metrics"].increment("transcript_requests_total")
        transcripts: TranscriptService = services["transcripts"]
        transcript = transcripts.get_transcript(video_id)
        return TranscriptResponse(video_id=video_id, transcript=transcript)

    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    @app.get("/metrics")
    async def metrics_endpoint(services=Depends(get_services)):
        return services["metrics"].export()

    @app.get("/")
    async def root():
        return {
            "message": "YouTube Quiz Generator API",
            "endpoints": {
                "POST /api/generate-quiz": "Generate quiz from YouTube video",
                "GET /api/transcript/{video_id}": "Get transcript only",
                "GET /health": "Health check",
            },
        }

    return app


app = create_app()
