"""
Compatibility entrypoint that exposes the FastAPI app for uvicorn.

The real application wiring lives in `backend/app/main.py`; this module allows
developers to keep running `python backend/main.py` or point uvicorn at
`backend.main:app` without touching deployment config.
"""

from app.main import app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
