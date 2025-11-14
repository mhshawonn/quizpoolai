## QuizPoolAI — YouTube ➜ Quiz platform

Full-stack app that ingests any YouTube video, extracts transcripts (with Whisper fallback), stores optional embeddings in Pinecone, and delivers an animated quiz UI built with Next.js.

### Project structure

- `backend/` — FastAPI service with modular services, rate limiting, tests, and Dockerfile.
- `frontend/` — Next.js 14 + Tailwind + Framer Motion UI, Jest/MSW tests, Dockerfile.
- `.github/workflows/ci.yaml` — GitHub Actions for linting, type-checking, and tests.
- `docker-compose.yml` — Runs both apps plus optional Pinecone stub.
- `Makefile` — convenience commands (`make dev`, `make docker-up`, etc.).

### Quick start

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:8000

### Docker

```
docker-compose up --build
```

By default spins up FastAPI + Next.js. Start Pinecone stub when needed:

```
docker-compose --profile pinecone up pinecone
```

### Testing & linting

```
make test-backend
make lint-backend
make test-frontend
make lint-frontend
```

### Highlights

- Transcript pipeline: YouTube Transcript API → manual/auto captions → Whisper fallback.
- Gemini-based quiz generation with JSON validation + optional Pinecone embedding store.
- Instagram-inspired UI: glass panels, gradients, Framer Motion animations, confetti/gift feedback, keyboard shortcuts, transcript viewer, localStorage “My Quizzes”.
- DevOps ready: Dockerfiles, env samples, GitHub Actions CI, Makefile, MSW-backed frontend tests.

### Next steps

- Add authentication & multi-user persistence.
- Replace in-memory rate limiting with Redis.
- Stream backend progress via Server-Sent Events/WebSockets.
