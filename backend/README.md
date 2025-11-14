# Backend — QuizPoolAI

FastAPI service that fetches YouTube transcripts (with Whisper fallback), stores optional embeddings in Pinecone, and generates quizzes via Google Gemini.

## Requirements

- Python 3.11+
- `ffmpeg` binary (for `yt-dlp` + Whisper)
- Google Gemini + optional Pinecone credentials

Install deps:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

Copy `.env.example` to `.env` and populate:

```
GEMINI_API_KEY=your-key
PINECONE_API_KEY=optional
YT_COOKIES_PATH=cookies.txt
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW_SECONDS=60
WHISPER_MODEL=base
```

## Run locally

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Endpoints:

- `POST /api/generate-quiz`
- `GET /api/transcript/{video_id}`
- `GET /health`
- `GET /metrics`

## Tests & lint

```
pytest
ruff check .
```

## Docker

```
docker build -t quizpoolai-backend .
docker run -p 8000:8000 --env-file .env quizpoolai-backend
```
