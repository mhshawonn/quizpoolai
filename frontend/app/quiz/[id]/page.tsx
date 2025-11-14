"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Download, RotateCcw, Share2, Shuffle } from "lucide-react";
import { toast } from "react-hot-toast";

import { AnswerButton } from "../../../components/AnswerButton";
import { AnimatedMascot } from "../../../components/AnimatedMascot";
import { ProgressRing } from "../../../components/ProgressRing";
import { XPToast } from "../../../components/XPToast";
import { CoinShower } from "../../../components/CoinShower";
import { LevelUpModal } from "../../../components/LevelUpModal";
import { CorrectAnimation } from "../../../components/CorrectAnimation";
import { WrongAnimation } from "../../../components/WrongAnimation";
import { StreakBadge } from "../../../components/StreakBadge";
import { ErrorEmptyState } from "../../../components/ErrorEmptyState";
import { YouTubePreview } from "../../../components/YouTubePreview";
import { Loader } from "../../../components/Loader";
import { useGamification, XP_PER_CORRECT } from "../../../hooks/useGamification";
import type { StoredQuiz } from "../../../hooks/useLocalQuizzes";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function QuizPlayerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    quizzes,
    updateScore,
    xp,
    level,
    xpProgress,
    streak,
    addXp,
    completeQuiz,
    levelUpVisible,
    closeLevelUpModal
  } = useGamification();
  const quiz = useMemo<StoredQuiz | undefined>(
    () => quizzes.find((q) => q.id === params.id),
    [quizzes, params.id]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(quiz?.score ?? 0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [mascotMood, setMascotMood] = useState<"idle" | "celebrate" | "encourage" | "sad">("idle");
  const [xpToastVisible, setXpToastVisible] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const completionLogged = useRef(false);

  useEffect(() => {
    if (quiz) {
      setScore(quiz.score ?? 0);
    }
  }, [quiz]);

  useEffect(() => {
    if (completionLogged.current || !quiz) return;
    if (currentIndex >= quiz.quiz.length) {
      completionLogged.current = true;
      completeQuiz(score);
    }
  }, [completeQuiz, currentIndex, quiz, score]);

  const transcriptPreview = useMemo(() => {
    if (!quiz) return "";
    return showTranscript ? quiz.transcript.slice(0, 2000) : quiz.transcript.slice(0, 320);
  }, [quiz, showTranscript]);

  const transcriptSegments = useMemo(() => {
    if (!transcriptPreview) return [""];
    if (!transcriptQuery) return [transcriptPreview];
    const regex = new RegExp(`(${escapeRegExp(transcriptQuery)})`, "gi");
    return transcriptPreview.split(regex);
  }, [transcriptPreview, transcriptQuery]);

  const quizLength = quiz?.quiz.length ?? 0;
  const isComplete = quiz ? currentIndex >= quizLength : false;
  const question = quiz && !isComplete ? quiz.quiz[currentIndex] : null;
  const mascotMessage = useMemo(() => {
    if (feedback === "correct") return "Correct! +XP";
    if (feedback === "wrong") return "Let's review it.";
    if (mascotMood === "encourage") return "You got this!";
    return "Choose wisely!";
  }, [feedback, mascotMood]);

  const handleSelect = useCallback(
    (index: number) => {
      if (selected !== null || !question) return;
      setSelected(index);
      const option = question.options[index];
      const isCorrect = option.trim() === question.correct_answer.trim();
      setFeedback(isCorrect ? "correct" : "wrong");
      if (isCorrect) {
        const nextScore = score + 1;
        setScore(nextScore);
        updateScore(quiz.id, nextScore);
        addXp(XP_PER_CORRECT);
        setMascotMood("celebrate");
        setXpToastVisible(true);
        setAnnouncement(`Correct! +${XP_PER_CORRECT} XP`);
        setCoinTrigger(Date.now());
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setXpToastVisible(false), 1500);
      } else {
        setAnnouncement("Incorrect. The mascot will show the correct answer.");
        setMascotMood("sad");
      }
    },
    [addXp, question, quiz?.id, score, selected, updateScore]
  );

  const handleNext = useCallback(() => {
    if (!quiz) return;
    if (currentIndex >= quiz.quiz.length - 1) {
      setCurrentIndex(quiz.quiz.length);
    } else if (selected !== null) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setFeedback(null);
      setMascotMood("encourage");
    }
  }, [currentIndex, quiz, selected]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelected(null);
    setFeedback(null);
    setScore(0);
    setMascotMood("idle");
    completionLogged.current = false;
    if (quiz) {
      updateScore(quiz.id, 0);
    }
  }, [quiz, updateScore]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!quiz) return;
      const number = Number(event.key);
      if (number >= 1 && number <= 4) {
        handleSelect(number - 1);
      }
      if (event.key === "Enter") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quiz, handleNext, handleSelect]);

  function handleDownload() {
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quiz.videoId}-quiz.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    const shareUrl = `${window.location.origin}/quiz/${quiz.id}`;
    const text = `I just scored ${score}/${quiz.quiz.length} on QuizPoolAI!`;
    if (navigator.share) {
      navigator
        .share({
          title: "QuizPoolAI Results",
          text,
          url: shareUrl
        })
        .catch(() => undefined);
    } else {
      navigator.clipboard.writeText(`${text} ${shareUrl}`).then(
        () => toast.success("Link copied to clipboard!"),
        () => toast.error("Failed to copy link")
      );
    }
  }

  const optionsList = question ? (
    <motion.div
      key={question.question}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 700, damping: 30 }}
      className="space-y-4"
      role="list"
      aria-label="Answer choices"
    >
      {question.options.map((option, index) => {
        const isCorrect = option.trim() === question.correct_answer.trim();
        let state: "idle" | "correct" | "wrong" | "revealed" = "idle";
        if (selected !== null) {
          if (index === selected) {
            state = feedback === "correct" && isCorrect ? "correct" : "wrong";
          } else if (isCorrect) {
            state = "revealed";
          }
        }
        return (
          <AnswerButton
            key={`${option}-${index}`}
            option={option}
            index={index}
            onSelect={() => handleSelect(index)}
            disabled={selected !== null}
            state={state}
          />
        );
      })}
    </motion.div>
  ) : null;

  if (!quiz) {
    return (
      <div className="py-16">
        {quizzes.length === 0 ? (
          <Loader label="Loading quiz..." />
        ) : (
          <ErrorEmptyState
            title="Quiz not found"
            description="It may have been removed from local storage."
            action={
              <button
                className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary"
                onClick={() => router.push("/")}
              >
                Back home
              </button>
            }
          />
        )}
      </div>
    );
  }

  if (isComplete) {
    return (
      <section className="space-y-8">
        <button className="flex items-center gap-2 text-brandBlue" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="rounded-[32px] bg-white p-10 text-center shadow-2xl">
          <AnimatedMascot mood="celebrate" bubbleText="Quiz complete!" />
          <h1 className="text-4xl font-black text-primary">Results</h1>
          <p className="mt-2 text-slate-600">
            You scored {score} / {quiz.quiz.length}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-brandBlue"
              onClick={handleRestart}
            >
              <RotateCcw className="mr-2 inline-block" size={16} />
              Replay
            </button>
            <button
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-brandBlue"
              onClick={() => router.push(`/?prefill=${encodeURIComponent(quiz.youtubeUrl)}`)}
            >
              <Shuffle className="mr-2 inline-block" size={16} />
              Regenerate
            </button>
            <button
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-brandBlue"
              onClick={handleShare}
            >
              <Share2 className="mr-2 inline-block" size={16} />
              Share
            </button>
            <button
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white"
              onClick={handleDownload}
            >
              <Download className="mr-2 inline-block" size={16} />
              Download JSON
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!question) return null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button className="flex items-center gap-2 text-brandBlue" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex flex-wrap items-center gap-4">
          <StreakBadge streak={streak} />
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow">
            Score {score}/{quiz.quiz.length}
          </div>
        </div>
      </div>

      <div className="rounded-[32px] bg-gradient-to-br from-white via-[#f7fbff] to-[#e0f3ff] p-6 shadow-xl">
        <div className="grid gap-6 lg:grid-cols-[auto,1fr,auto]">
          <AnimatedMascot mood={mascotMood} bubbleText={mascotMessage} className="max-lg:hidden" />
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-sm uppercase tracking-wide text-brandBlue">
              Question {currentIndex + 1} / {quiz.quiz.length}
            </p>
            <h2 className="text-2xl font-bold text-primary">{question.question}</h2>
          </div>
          <ProgressRing progress={xpProgress} xp={xp} level={level} />
        </div>

        <div className="mt-8">{optionsList}</div>

        <AnimatePresence>
          {feedback && (
            <div className="mt-6">
              {feedback === "correct" ? (
                <CorrectAnimation explanation={question.explanation} />
              ) : (
                <WrongAnimation
                  correctAnswer={question.correct_answer}
                  explanation={question.explanation}
                />
              )}
              <button
                className="mt-6 w-full rounded-2xl bg-brandBlue px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:brightness-110"
                onClick={handleNext}
              >
                {currentIndex === quiz.quiz.length - 1 ? "See Results" : "Next Question"}
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="text-sm uppercase tracking-wide text-slate-500">Video preview</p>
          <YouTubePreview url={quiz.youtubeUrl} />
          <div className="mt-4 flex gap-4">
            <button
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brandBlue"
              onClick={handleRestart}
            >
              Restart
            </button>
            <button
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brandBlue"
              onClick={() => router.push(`/?prefill=${encodeURIComponent(quiz.youtubeUrl)}`)}
            >
              Regenerate
            </button>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-wide text-slate-500">Transcript</p>
            <button
              className="text-xs font-semibold uppercase tracking-wide text-brandBlue"
              onClick={() => setShowTranscript((prev) => !prev)}
            >
              {showTranscript ? "Collapse" : "Expand"}
            </button>
          </div>
          <input
            type="text"
            value={transcriptQuery}
            placeholder="Search within transcript"
            onChange={(event) => setTranscriptQuery(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <p className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-600">
            {transcriptSegments.map((segment, idx) =>
              idx % 2 === 1 ? (
                <mark key={`${segment}-${idx}`} className="rounded bg-accent/60 px-1 text-slate-900">
                  {segment}
                </mark>
              ) : (
                <span key={`${segment}-${idx}`}>{segment}</span>
              )
            )}
            {!showTranscript && quiz.transcript.length > transcriptPreview.length && "…"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 text-center shadow">
        <p className="text-sm text-slate-500">
          Need the JSON? Download it anytime to remix this quiz.
        </p>
        <button
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-brandBlue"
          onClick={handleDownload}
        >
          <Download className="text-brandBlue" size={16} />
          Download Quiz JSON
        </button>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <XPToast amount={XP_PER_CORRECT} isVisible={xpToastVisible} />
      <CoinShower trigger={coinTrigger} />
      <LevelUpModal isOpen={levelUpVisible} level={level} onClose={closeLevelUpModal} />
    </section>
  );
}
