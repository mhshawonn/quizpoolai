"""
YouTube to Quiz Generator API (Using Transcript API + Whisper Fallback)
Install: pip install fastapi uvicorn youtube-transcript-api google-generativeai pinecone-client yt-dlp openai-whisper
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
import os
import re
import tempfile
import yt_dlp
import json
from typing import List

# Pinecone import (optional)
try:
    from pinecone.grpc import PineconeGRPC as Pinecone
    from pinecone import ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

# Lazy load whisper only when needed
whisper_model = None

app = FastAPI(title="YouTube Quiz Generator")

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBLR4CKsUH-L5OQIkgt9aZKDZ3t1ekPzGU")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")

# Validate Gemini API key
if not GEMINI_API_KEY or GEMINI_API_KEY == "your-gemini-api-key":
    print("⚠ WARNING: GEMINI_API_KEY not set! Please set it as environment variable.")

# Initialize Gemini
genai.configure(api_key="AIzaSyB-AyQuIWJ3GCiFFJsUy7EMtDxI3u_0GmE")
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# Initialize Pinecone (optional)
pc = None
if PINECONE_AVAILABLE and PINECONE_API_KEY:
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        print("✓ Pinecone initialized")
    except Exception as e:
        print(f"⚠ Pinecone initialization failed: {str(e)}")
        pc = None
else:
    print("⚠ Pinecone not available or API key not set - running without vector storage")

class VideoRequest(BaseModel):
    youtube_url: str
    num_questions: int = 5
    difficulty: str = "medium"

class Quiz(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizResponse(BaseModel):
    transcript: str
    quiz: List[Quiz]

def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'^([0-9A-Za-z_-]{11})$'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    raise HTTPException(status_code=400, detail="Invalid YouTube URL")

def get_transcript(video_id: str) -> str:
    """Get transcript from YouTube video or transcribe audio"""
    try:
        # Try to get existing transcript first (default language)
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        transcript = " ".join([entry['text'] for entry in transcript_list])
        print(f"✓ Found English transcript for {video_id}")
        return transcript
    except Exception as e1:
        print(f"No English transcript: {str(e1)}")
        # Try to get any available transcript
        try:
            transcript_obj = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Try to get manually created transcripts first
            try:
                transcript = transcript_obj.find_manually_created_transcript(['en', 'bn', 'hi', 'es', 'fr', 'de', 'ar', 'zh'])
                transcript_data = transcript.fetch()
                result = " ".join([entry['text'] for entry in transcript_data])
                print(f"✓ Found manual transcript in {transcript.language}")
                return result
            except:
                pass
            
            # Try generated/auto transcripts
            try:
                transcript = transcript_obj.find_generated_transcript(['en', 'bn', 'hi', 'es', 'fr', 'de', 'ar', 'zh'])
                transcript_data = transcript.fetch()
                result = " ".join([entry['text'] for entry in transcript_data])
                print(f"✓ Found auto-generated transcript in {transcript.language}")
                return result
            except:
                pass
                
        except Exception as e2:
            print(f"No transcripts found at all: {str(e2)}")
        
        # If we get here, no captions available
        print(f"⚠ No captions available for {video_id}, attempting audio transcription...")
        return transcribe_from_audio(video_id)

def download_audio_for_transcription(video_id: str) -> str:
    """Download YouTube audio for transcription"""
    temp_dir = tempfile.gettempdir()
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Check for cookies file
    cookies_path = os.getenv('YT_COOKIES_PATH', 'cookies.txt')
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
        }],
        'outtmpl': os.path.join(temp_dir, f'{video_id}.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.youtube.com/',
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'ios', 'web'],
                'skip': ['hls', 'dash', 'translated_subs']
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Sec-Fetch-Mode': 'navigate',
        }
    }
    
    # Add cookies if file exists
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            audio_file = os.path.join(temp_dir, f'{video_id}.mp3')
            return audio_file
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to download audio. Video may be private or age-restricted: {str(e)}"
        )

def transcribe_from_audio(video_id: str) -> str:
    """Transcribe audio using Whisper"""
    global whisper_model
    
    # Lazy load whisper
    if whisper_model is None:
        try:
            import whisper
            whisper_model = whisper.load_model("base")
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="Whisper not installed. Run: pip install openai-whisper"
            )
    
    audio_path = None
    try:
        # Download audio
        audio_path = download_audio_for_transcription(video_id)
        
        # Transcribe
        result = whisper_model.transcribe(audio_path)
        return result["text"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Transcription failed: {str(e)}"
        )
    finally:
        # Clean up audio file
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except:
                pass

def get_gemini_embeddings(text: str) -> List[float]:
    """Generate embeddings using Gemini"""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embedding error: {str(e)}")
        return []

def store_in_pinecone(text: str, video_id: str):
    """Store transcript embeddings in Pinecone"""
    if not pc:
        print("⚠ Pinecone not available, skipping vector storage")
        return
    
    try:
        index_name = "youtube-transcripts"
        
        # Create index if doesn't exist
        if not pc.has_index(index_name):
            pc.create_index(
                name=index_name,
                dimension=768,  # Gemini embedding dimension
                metric='cosine',
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                ),
                deletion_protection="disabled"
            )
            print(f"✓ Created Pinecone index: {index_name}")
        
        index = pc.Index(index_name)
        
        # Split text into chunks
        chunks = [text[i:i+1000] for i in range(0, len(text), 800)]
        
        # Generate embeddings and store
        vectors_to_upsert = []
        for i, chunk in enumerate(chunks):
            embedding = get_gemini_embeddings(chunk)
            if embedding:
                vectors_to_upsert.append({
                    'id': f"{video_id}_{i}",
                    'values': embedding,
                    'metadata': {'text': chunk, 'video_id': video_id}
                })
        
        if vectors_to_upsert:
            index.upsert(vectors=vectors_to_upsert)
            print(f"✓ Stored {len(vectors_to_upsert)} chunks in Pinecone")
            
    except Exception as e:
        print(f"⚠ Pinecone storage failed: {str(e)}")

def generate_quiz(transcript: str, num_questions: int, difficulty: str) -> List[Quiz]:
    """Generate quiz using Gemini AI"""
    
    # Limit transcript length to avoid token limits
    max_chars = 30000
    if len(transcript) > max_chars:
        transcript = transcript[:max_chars] + "..."
    
    prompt = f"""Based on the following video transcript, create {num_questions} multiple-choice quiz questions at {difficulty} difficulty level.

Transcript:
{transcript}

Requirements:
1. Create {num_questions} questions that test understanding of key concepts
2. Each question should have 4 options (A, B, C, D)
3. Difficulty level: {difficulty}
4. Include a brief explanation for the correct answer

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {{
    "question": "What is the main topic discussed?",
    "options": ["A) Topic 1", "B) Topic 2", "C) Topic 3", "D) Topic 4"],
    "correct_answer": "A) Topic 1",
    "explanation": "The transcript clearly states..."
  }}
]"""

    try:
        response = gemini_model.generate_content(prompt)
        quiz_text = response.text.strip()
        
        # Extract JSON from response
        if "```json" in quiz_text:
            quiz_text = quiz_text.split("```json")[1].split("```")[0].strip()
        elif "```" in quiz_text:
            quiz_text = quiz_text.split("```")[1].split("```")[0].strip()
        
        quiz_data = json.loads(quiz_text)
        
        return [Quiz(**q) for q in quiz_data]
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse quiz JSON: {str(e)}. Response: {quiz_text[:200]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz_endpoint(request: VideoRequest):
    """
    Main endpoint: YouTube URL -> Transcript API -> Pinecone -> Gemini -> Quiz
    """
    try:
        # Step 1: Extract video ID
        video_id = extract_video_id(request.youtube_url)
        
        # Step 2: Get transcript from YouTube
        transcript = get_transcript(video_id)
        
        if not transcript or len(transcript) < 100:
            raise HTTPException(
                status_code=400, 
                detail="Transcript too short or empty"
            )
        
        # Step 3: Store in Pinecone (optional, for future features)
        store_in_pinecone(transcript, video_id)
        
        # Step 4: Generate quiz using Gemini
        quiz = generate_quiz(transcript, request.num_questions, request.difficulty)
        
        return QuizResponse(transcript=transcript, quiz=quiz)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/transcript/{video_id}")
async def get_transcript_only(video_id: str):
    """Get transcript only"""
    try:
        transcript = get_transcript(video_id)
        return {"video_id": video_id, "transcript": transcript}
    except HTTPException:
        raise

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {
        "message": "YouTube Quiz Generator API",
        "endpoints": {
            "POST /generate-quiz": "Generate quiz from YouTube video",
            "GET /transcript/{video_id}": "Get transcript only",
            "GET /health": "Health check"
        },
        "example": {
            "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
            "num_questions": 5,
            "difficulty": "medium"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
