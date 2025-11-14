"""
QuizPoolAI backend application package.

This module exposes helpers to create the FastAPI app.
"""

from .main import create_app

__all__ = ["create_app"]
