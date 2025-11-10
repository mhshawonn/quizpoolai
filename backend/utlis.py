import re
from datetime import timedelta
from typing import List, Dict, Any

YOUTUBE_ID_REGEX = re.compile(
    r'(?:v=|\/)([0-9A-Za-z_-]{11}).*'
)

def extract_youtube_id(url: str) -> str:
    """Extracts the YouTube video ID from a given URL.
     Raises ValueError if the URL is invalid or the ID cannot be found."""
    
    match = YOUTUBE_ID_REGEX.search(url)
    if not match:
        raise ValueError("Invalid YouTube URL")
    return match.group(1)

def seconds_to_hms(seconds: float) -> str:
    """Converts seconds to a string in HH:MM:SS format."""
    
    td = timedelta(seconds=float(seconds))
    total_seconds = int(td.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}:{secs:02}"

def chunk_transcript(segments: List[Dict[str, Any]], max_chunk_seconds: int = 180):
    """
    Combine adjacent transcript segments into chunks about max_chunk_seconds long.
    segments expected to be list of dicts {'text','start','duration'}
    Returns list of {"text", "start", "end"}.
    """
    chunks = []
    cur = []
    cur_start = None
    cur_end = None

    def flush():
        nonlocal cur, cur_start, cur_end
        if not cur:
            return
        text = " ".join([c.get("text","").strip() for c in cur])
        chunks.append({"text": text, "start": cur_start, "end": cur_end})
        cur = []
        cur_start = None
        cur_end = None

    for seg in segments:
        start = float(seg.get("start", 0.0))
        dur = float(seg.get("duration", 0.0))
        end = start + dur
        if cur_start is None:
            cur_start = start
        cur.append(seg)
        cur_end = end
        if (cur_end - cur_start) >= max_chunk_seconds:
            flush()

    flush()
    return chunks


def normalize_mix(total: int, mix: Dict[str, int]):
    """
    Convert difficulty mix dict into a list of difficulty strings length `total`.
    """
    order = ["easy", "medium", "hard"]
    counts = {k: max(0, int(mix.get(k, 0))) for k in order}
    s = sum(counts.values())
    if s == 0:
        counts["medium"] = total
        s = total
    if s != total:
        # scale proportionally
        scaled = {k: int(round(counts[k] * total / s)) for k in order}
        # fix rounding drift
        while sum(scaled.values()) < total:
            for k in order:
                if sum(scaled.values()) == total:
                    break
                scaled[k] += 1
        while sum(scaled.values()) > total:
            for k in reversed(order):
                if sum(scaled.values()) == total:
                    break
                if scaled[k] > 0:
                    scaled[k] -= 1
        counts = scaled
    result = []
    for k in order:
        result += [k] * counts[k]
    return result

