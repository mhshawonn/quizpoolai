from typing import List, Literal, Optional
from pydantic import BaseModel, HttpUrl, Field
 
Difficulty = Literal['easy', 'medium', 'hard']

class GenerateQuizRequest(BaseModel):
    url: HttpUrl
    num_questions: int = Field(6, ge=1, le=20)
    difficulty_mix : dict = Field(default_factory=lambda: {'easy': 2, 'medium': 3, 'hard': 1})
    preffered_langs : List[str] = Field(default_factory = lambda : ['en', 'en-GB', 'en-US'])
    max_chunks_seconds: int = Field(180, ge=60, le=600)

class ChoiceQuestion(BaseModel):
    question: str
    choices: List[str]
    correct_choice: int
    difficulty: Difficulty
    time_start : float
    time_end : float
    short_explanation: str

class GenerateQuizResponse(BaseModel):
    video_id: str
    total_transcript_seconds: float
    questions: List[ChoiceQuestion]