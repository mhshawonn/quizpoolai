from fastapi import FastAPI, HTTPException
from models import GenerateQuizRequest, GenerateQuizResponse, ChoiceQuestion
from utlis import extract_youtube_id, chunk_transcript, normalize_mix
from transcript_service import fetch_transcript
from qgen_service import generate_for_chunk
from typing import List

app = FastAPI(title="YT Quiz Generator (modular)", version="0.1.0")

@app.post("/generate-quiz", response_model=GenerateQuizResponse)
def generate_quiz(payload: GenerateQuizRequest):
    # 1) extract id
    try:
        video_id = extract_youtube_id(str(payload.url))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2) fetch transcript (assumes captions exist)
    try:
        segments = fetch_transcript(video_id, payload.preferred_langs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not segments:
        raise HTTPException(status_code=404, detail="Transcript is empty.")

    # 3) determine total seconds and chunk
    total_seconds = float(segments[-1].get("start", 0.0)) + float(segments[-1].get("duration", 0.0))
    chunks = chunk_transcript(segments, payload.max_chunk_seconds)

    if not chunks:
        raise HTTPException(status_code=500, detail="Failed to build transcript chunks.")

    # 4) distribute difficulties
    target_difficulties: List[str] = normalize_mix(payload.num_questions, payload.difficulty_mix)

    # 5) generate questions across chunks (round-robin)
    questions = []
    cidx = 0
    for diff in target_difficulties:
        ch = chunks[cidx % len(chunks)]
        ts = float(ch["start"])
        te = float(ch["end"])
        qitems = generate_for_chunk(ch["text"], ts, te, diff, n=1)
        # ensure structure fits ChoiceQuestion model; skip invalid
        for qi in qitems:
            try:
                cq = ChoiceQuestion(**qi)
                questions.append(cq)
            except Exception:
                # skip malformed question JSON
                continue
        cidx += 1

    if len(questions) == 0:
        raise HTTPException(status_code=502, detail="Question generation failed; returned no valid questions.")

    return GenerateQuizResponse(video_id=video_id, total_transcript_seconds=total_seconds, questions=questions)
