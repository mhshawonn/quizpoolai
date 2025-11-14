"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Link as LinkIcon, RefreshCw, Sparkles, Youtube } from "lucide-react";

import { generateQuiz } from "../lib/api";
import { useGamification } from "../hooks/useGamification";
import { QuizCard } from "../components/QuizCard";
import { Loader } from "../components/Loader";
import { ErrorEmptyState } from "../components/ErrorEmptyState";
import { AnimatedMascot } from "../components/AnimatedMascot";
import { ProgressRing } from "../components/ProgressRing";
import { StreakBadge } from "../components/StreakBadge";
import { cardVariants } from "../components/variants";

const SAMPLE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const difficulties: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") === "my-quizzes" ? "my-quizzes" : "home";
  const prefill = searchParams?.get("prefill");

  const [youtubeUrl, setYoutubeUrl] = useState(prefill || "");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const { quizzes, addQuiz, xp, level, streak, xpProgress } = useGamification();

  useEffect(() => {
    if (prefill) setYoutubeUrl(prefill);
  }, [prefill]);

  const handleGenerate = () => {
    if (!youtubeUrl) {
      toast.error("Paste a YouTube link first.");
      return;
    }
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast.error("That doesn't look like a valid YouTube URL.");
      return;
    }

    setIsGenerating(true);
    (async () => {
      try {
        const payload = {
          youtube_url: youtubeUrl,
          num_questions: numQuestions,
          difficulty
        };
        const response = await generateQuiz(payload);
        const quizId = `${videoId}-${Date.now()}`;
        addQuiz({
          id: quizId,
          videoId,
          youtubeUrl,
          difficulty,
          numQuestions,
          createdAt: Date.now(),
          ...response
        });
        router.push(`/quiz/${quizId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to generate quiz. Try again.");
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  const heroDescription = useMemo(
    () => "Paste any YouTube link. The mascot reads the transcript, crafts a playful quiz, and tracks your XP.",
    []
  );

  const content =
    tab === "home" ? (
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="duo-card p-8"
        >
          <h2 className="text-2xl font-bold text-primary">Recent Quizzes</h2>
          <p className="mt-2 text-sm text-slate-600">Tap any card to continue your XP run.</p>
          <div className="mt-6 grid gap-5">
            <AnimatePresence>
              {quizzes.slice(0, 4).map((quiz) => (
                <motion.div key={quiz.id} layout variants={cardVariants} initial="hidden" animate="visible">
                  <QuizCard quiz={quiz} />
                </motion.div>
              ))}
            </AnimatePresence>
            {quizzes.length === 0 && (
              <ErrorEmptyState
                title="Nothing yet"
                description="Generate your first quiz to see it appear here."
                action={
                  <button
                    className="rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary"
                    onClick={() => setYoutubeUrl(SAMPLE_URL)}
                  >
                    Try sample video
                  </button>
                }
              />
            )}
          </div>
        </motion.div>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="duo-card p-8"
        >
          <h3 className="text-xl font-semibold text-brandBlue">Why it feels like a game</h3>
          <ul className="mt-6 space-y-4 text-sm text-slate-600">
            <li>🪙 Coin showers & streak boosts when you answer correctly.</li>
            <li>🎯 Keyboard shortcuts, mascot guidance, and animated explanations.</li>
            <li>📚 Transcript search + XP based on difficulty.</li>
            <li>🔒 Everything saved locally—quizzes never leave your device.</li>
          </ul>
        </motion.div>
      </section>
    ) : (
      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-primary">My Quizzes</h2>
          <span className="text-sm text-slate-500">{quizzes.length} saved</span>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
        {quizzes.length === 0 && (
          <ErrorEmptyState title="Your vault is empty" description="Generate quizzes to save them automatically." />
        )}
      </section>
    );

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#e9fff4] via-white to-[#e6f0ff] p-8 shadow-xl">
        <div className="grid gap-10 lg:grid-cols-[1.3fr,1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brandBlue">
              <Sparkles size={14} /> AI Quiz Studio
            </p>
            <h1 className="mt-6 text-4xl font-black text-primary md:text-5xl">
              Turn YouTube binges into XP-packed lessons.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">{heroDescription}</p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <ProgressRing progress={xpProgress} xp={xp} level={level} />
              <div className="flex flex-col gap-3">
                <StreakBadge streak={streak} />
                <p className="text-sm text-slate-500">Keep the streak for coin multipliers.</p>
              </div>
            </div>
          </div>
          <AnimatedMascot
            mood={isGenerating ? "encourage" : "idle"}
            bubbleText={isGenerating ? "Cooking up a quiz…" : "Ready when you are!"}
            className="justify-self-center"
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <motion.div
            className="rounded-3xl bg-white/90 p-6 shadow-lg"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Paste YouTube link
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3">
              <Youtube className="text-primary" />
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-slate-400"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
              />
              <button
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
                onClick={async () => {
                  const text = await navigator.clipboard.readText().catch(() => "");
                  if (text) setYoutubeUrl(text);
                }}
                aria-label="Paste from clipboard"
              >
                Paste
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-primary hover:text-primary"
                onClick={() => setYoutubeUrl(SAMPLE_URL)}
              >
                <LinkIcon size={14} /> Use sample
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-danger hover:text-danger"
                onClick={() => setYoutubeUrl("")}
              >
                <RefreshCw size={14} /> Clear
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-slate-500">Questions</label>
                <input
                  type="number"
                  value={numQuestions}
                  min={1}
                  max={50}
                  onChange={(event) => setNumQuestions(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500">Difficulty</label>
                <div className="mt-2 flex gap-2">
                  {difficulties.map((levelOption) => (
                    <button
                      key={levelOption}
                      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                        difficulty === levelOption
                          ? "bg-primary text-white shadow-lg"
                          : "border border-slate-200 text-slate-500"
                      }`}
                      onClick={() => setDifficulty(levelOption)}
                      type="button"
                    >
                      {levelOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              className="mt-8 w-full rounded-full bg-gradient-to-r from-primary to-brandBlue py-4 text-lg font-bold uppercase tracking-wide text-white shadow-xl transition hover:brightness-110 disabled:opacity-60"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Quiz"}
            </button>
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  key="generator-loader"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <Loader label="Thinking through the video..." />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div
            className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-sm uppercase tracking-wide text-brandBlue">Live preview</p>
            <p className="mt-2 text-lg text-slate-600">
              Animated cards, XP pops, and mascot reactions keep learners hooked.
            </p>
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brandBlue/10 text-brandBlue">
                    {item}
                  </span>
                  <span>Animated option {item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push("/")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "home" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
          >
            Home
          </button>
          <button
            onClick={() => router.push("/?tab=my-quizzes")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "my-quizzes" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
          >
            My Quizzes
          </button>
        </div>
      </section>
      {content}
    </>
  );
}
