SHELL := /bin/bash

.PHONY: dev docker-up test-backend test-frontend lint-backend lint-frontend

dev:
	@echo "Starting backend and frontend..."
	@bash -c "trap 'kill 0' EXIT; \
		(cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) & \
		(cd frontend && npm run dev) & \
		wait"

docker-up:
	docker-compose up --build

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm test

lint-backend:
	cd backend && ruff check .

lint-frontend:
	cd frontend && npm run lint
