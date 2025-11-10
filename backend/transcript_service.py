from typing import List, Dict, Any
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

def fetch_transcript(video_id: str, preferred_langs: List[str]) -> List[Dict[str, Any]]:
    """
    Fetches the transcript for a given YouTube video ID in the preferred languages.
    Returns a list of transcript segments with 'text', 'start', and 'duration'.
    Raises exceptions if the transcript cannot be fetched.
    """
    try:
        transcripts = YouTubeTranscriptApi.list_transcripts(video_id)
        for lang in preferred_langs:
            try:
                if transcripts.find_manaually_created_transcript([lang]):
                    transcript = transcripts.find_manually_created_transcript([lang])
            except Exception:
                pass
            try:
                if transcripts.find_generated_transcript([lang]):
                    return transcripts.find_generated_transcript([lang]).fetch()
            except Exception:
                pass
        
        first = transcripts.find_transcript([t.language_code for t in transcripts])
        translated = first.translate(preferred_langs[0])
        return translated.fetch()
    except (NoTranscriptFound, TranscriptsDisabled):
        raise ValueError("No transcript available for this video.")
    except Exception as e:
        raise RuntimeError(f"Failed to fetch transcript: {str(e)}")
    