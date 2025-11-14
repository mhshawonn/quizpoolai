"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, RefreshCw, Star } from "lucide-react";

import { buildYouTubeThumbnail } from "../lib/api";
import type { StoredQuiz } from "../hooks/useLocalQuizzes";

interface Props {
  quiz: StoredQuiz;
}

export function QuizCard({ quiz }: Props) {
  const thumbnail = buildYouTubeThumbnail(quiz.videoId);
  return (
    <motion.article
      className="duo-card flex flex-col overflow-hidden"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 25 }}
    >
      <div className="relative h-48 w-full overflow-hidden bg-brandBlue/10">
        <Image src={thumbnail} alt="Video thumbnail" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-white drop-shadow">
          <span className="rounded-full bg-primary/90 px-3 py-1 text-xs uppercase tracking-wide">
            {quiz.difficulty}
          </span>
          <span className="text-xl font-semibold leading-tight">
            {quiz.quiz[0]?.question.slice(0, 30)}…
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 text-slate-700">
        <div className="flex flex-wrap gap-3 text-sm">
          <span>Questions: {quiz.numQuestions}</span>
          {quiz.score !== undefined && (
            <span className="flex items-center gap-1 text-primary">
              <Star size={16} /> Score: {quiz.score}
            </span>
          )}
          <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="mt-auto flex gap-3">
          <Link
            href={`/quiz/${quiz.id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-white transition hover:brightness-105"
          >
            <Play size={18} /> Play
          </Link>
          <Link
            href={`/?prefill=${encodeURIComponent(quiz.youtubeUrl)}`}
            className="rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-brandBlue transition hover:border-brandBlue/60"
            aria-label="Regenerate quiz"
          >
            <RefreshCw size={16} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
