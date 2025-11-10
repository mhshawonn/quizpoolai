# yt_quiz/qgen_service.py
import os
import json
import time
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure DeepSeek: set DEEPSEEK_API_KEY in env; optionally DEEPSEEK_BASE_URL (default provided)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")  # or "https://api.deepseek.com/v1"
USE_DEEPSEEK = bool(DEEPSEEK_API_KEY)

# Standard libs
import requests

SYSTEM_PROMPT = (
    "You are an instructional design assistant. Given an excerpt of a lecture transcript "
    "and its time range (in seconds), generate multiple-choice questions across recall, "
    "application, and analysis. Each question must include:\n"
    "- question_text\n"
    "- choices (exactly 4 strings)\n"
    "- correct_choice (integer index 0-3)\n"
    "- difficulty (easy|medium|hard)\n"
    "- time_start, time_end (numbers)\n"
    "- short_explanation (1-2 sentences)\n"
    "Use only information present or entailed by the excerpt. Avoid trivial wording duplicates. "
    "Return a strict JSON array of question objects, with no extra commentary."
)

# Helper to extract JSON array in case the model wraps it in text
def extract_first_json_array(text: str) -> Optional[List[Any]]:
    """
    Look for the first JSON array substring in text and attempt to parse it.
    Returns parsed list on success, else None.
    """
    # naive approach: find first '[' and matching ']' (greedy)
    try:
        # try direct parse first
        data = json.loads(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "questions" in data and isinstance(data["questions"], list):
            return data["questions"]
    except Exception:
        pass

    # fallback: regex to find a JSON array block
    m = re.search(r"(\[[\s\S]*\])", text)
    if not m:
        return None
    candidate = m.group(1)
    try:
        return json.loads(candidate)
    except Exception:
        return None


def call_deepseek_for_questions(chunk_text: str, time_start: float, time_end: float, difficulty: str, n: int = 1, model: str = "deepseek-chat") -> List[Dict[str, Any]]:
    """
    Call the DeepSeek chat completion endpoint (OpenAI-compatible) to generate questions.
    - DEEPSEEK_API_KEY must be set in environment.
    - DEEPSEEK_BASE_URL can be overridden (defaults to https://api.deepseek.com)
    Returns a list of question dicts on success; raises RuntimeError on failure.
    """
    if not USE_DEEPSEEK:
        raise RuntimeError("DEEPSEEK_API_KEY not configured")

    url = DEEPSEEK_BASE_URL.rstrip("/") + "/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    system_msg = {"role": "system", "content": SYSTEM_PROMPT}
    user_msg = {
        "role": "user",
        "content": (
            f"Transcript time range: {time_start:.2f} to {time_end:.2f} (seconds)\n"
            f"Target difficulty: {difficulty}\n"
            f"Number of questions to create: {n}\n\nTranscript:\n---\n{chunk_text.strip()}\n---\n\nReturn ONLY a JSON array of question objects."
        )
    }

    payload = {
        "model": model,
        "messages": [system_msg, user_msg],
        "temperature": 0.2,
        "max_tokens": 1200,
        # you can set top_p, n, stop etc. as desired
    }

    # Do a small retry with backoff on transient errors
    last_err = None
    for attempt in range(3):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            if resp.status_code >= 500:
                last_err = RuntimeError(f"DeepSeek server error: {resp.status_code} {resp.text[:200]}")
                time.sleep(1 + attempt * 1.5)
                continue
            if resp.status_code != 200:
                # return helpful message for debugging
                raise RuntimeError(f"DeepSeek API error {resp.status_code}: {resp.text}")

            j = resp.json()
            # Expect OpenAI-compatible response shape: choices[0].message.content
            # but DeepSeek variants may differ; try a few common structures
            content = None
            if isinstance(j, dict):
                # Try standard OpenAI-compatible shape
                choices = j.get("choices")
                if choices and isinstance(choices, list) and len(choices) > 0:
                    first = choices[0]
                    # new style: first.message.content
                    if isinstance(first, dict) and first.get("message") and first["message"].get("content"):
                        content = first["message"]["content"]
                    # older style: first["text"] or first["message"]["content"]
                    elif isinstance(first, dict) and first.get("text"):
                        content = first["text"]
                    elif isinstance(first, dict) and first.get("message"):
                        # try flattening
                        try:
                            content = json.dumps(first["message"])
                        except Exception:
                            content = str(first["message"])
                # some APIs return 'output' or 'output_text'
                if content is None:
                    content = j.get("output_text") or j.get("output") or None

            if content is None:
                raise RuntimeError("DeepSeek returned unexpected response structure: " + json.dumps(j)[:1000])

            # Attempt to extract JSON array
            parsed = extract_first_json_array(content)
            if parsed is None:
                # As a last resort, try if content itself is JSON dict with questions key
                try:
                    parsed2 = json.loads(content)
                    if isinstance(parsed2, dict) and "questions" in parsed2:
                        parsed = parsed2["questions"]
                except Exception:
                    parsed = None

            if parsed is None:
                raise RuntimeError("Could not parse JSON array from DeepSeek response. Preview: " + content[:1200])

            # normalize items to dicts
            results = []
            for item in parsed:
                if isinstance(item, dict):
                    results.append(item)
            return results

        except requests.RequestException as rexc:
            last_err = rexc
            time.sleep(0.8 + attempt * 0.5)
            continue
    # if we exit loop, raise last error
    raise RuntimeError(f"DeepSeek request failed after retries: {last_err}")


def mock_questions(chunk_text: str, time_start: float, time_end: float, difficulty: str, n: int = 1) -> List[Dict[str, Any]]:
    """
    Minimal placeholder when DEEPSEEK_API_KEY is not set or the call fails.
    """
    q = {
        "question_text": "According to this segment, what is the main idea discussed?",
        "choices": [
            "A tangential topic unrelated to the segment",
            "The primary concept explained by the speaker",
            "A future topic not yet covered",
            "A contradictory idea not mentioned"
        ],
        "correct_choice": 1,
        "difficulty": difficulty,
        "time_start": time_start,
        "time_end": time_end,
        "short_explanation": "The speaker emphasizes this as the central idea in the excerpt."
    }
    return [q for _ in range(n)]


def generate_for_chunk(chunk_text: str, time_start: float, time_end: float, difficulty: str, n: int = 1) -> List[Dict[str, Any]]:
    """
    Main entry used by the rest of your app. Tries DeepSeek if configured, otherwise returns mock questions.
    """
    if USE_DEEPSEEK:
        try:
            return call_deepseek_for_questions(chunk_text, time_start, time_end, difficulty, n=n)
        except Exception as e:
            # In production log error; here we fallback to mock for resilience
            print("DeepSeek call failed, falling back to mock questions:", e)
            return mock_questions(chunk_text, time_start, time_end, difficulty, n=n)
    else:
        return mock_questions(chunk_text, time_start, time_end, difficulty, n=n)
