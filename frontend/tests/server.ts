import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export const server = setupServer(
  http.post(`${base}/api/generate-quiz`, () =>
    HttpResponse.json({
      transcript: "Sample transcript",
      quiz: [
        {
          question: "Mock question?",
          options: ["A) 1", "B) 2", "C) 3", "D) 4"],
          correct_answer: "A) 1",
          explanation: "Because testing."
        }
      ]
    })
  )
);
