import json
from types import SimpleNamespace as Obj

import pytest

from app.config import Settings
from app.services import quiz_service as quiz_module
from app.services.quiz_service import QuizService


@pytest.fixture
def settings():
    return Settings(gemini_api_key="dummy")


@pytest.fixture(autouse=True)
def mock_genai(monkeypatch):
    class FakeModel:
        def __init__(self, *_args, **_kwargs):
            pass

        def generate_content(self, prompt):
            data = [
                {
                    "question": "What is testing?",
                    "options": ["A) One", "B) Two", "C) Three", "D) Four"],
                    "correct_answer": "A) One",
                    "explanation": "Because.",
                }
            ]
            return Obj(text=json.dumps(data))

    class FakeGenAI:
        def __init__(self):
            self.configured = False

        def configure(self, api_key):
            self.configured = True

        def GenerativeModel(self, *_args, **_kwargs):
            return FakeModel()

        def embed_content(self, **_kwargs):
            return {"embedding": [0.1, 0.2, 0.3]}

    fake = FakeGenAI()
    monkeypatch.setattr(quiz_module, "genai", fake)
    return fake


def test_generate_quiz_success(settings):
    service = QuizService(settings)
    quiz = service.generate_quiz("lorem ipsum", 1, "medium")
    assert len(quiz) == 1
    assert quiz[0].correct_answer.startswith("A)")


def test_embedding_fn_returns_vector(settings):
    service = QuizService(settings)
    embed_fn = service.get_embedding_fn()
    vector = embed_fn("hello world")
    assert isinstance(vector, list)
    assert vector
