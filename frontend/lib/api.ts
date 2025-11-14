export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface QuizPayload {
  youtube_url: string;
  num_questions: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizApiResponse {
  transcript: string;
  quiz: QuizQuestion[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message = detail?.detail || response.statusText;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function generateQuiz(payload: QuizPayload): Promise<QuizApiResponse> {
  const response = await fetch(`${API_BASE}/api/generate-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse<QuizApiResponse>(response);
}

export async function fetchTranscript(videoId: string): Promise<{ transcript: string }> {
  const response = await fetch(`${API_BASE}/api/transcript/${videoId}`);
  return handleResponse<{ transcript: string }>(response);
}

export function buildYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
