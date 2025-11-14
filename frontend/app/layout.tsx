import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Link from "next/link";
import { Toaster } from "react-hot-toast";

import "../globals.css";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "QuizPoolAI — YouTube → Quiz",
  description: "Transform any YouTube video into a joyful, Duolingo-inspired quiz."
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/?tab=my-quizzes", label: "My Quizzes" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.className} bg-[#f7fbff] text-slate-800`}>
        <header className="sticky top-0 z-20 border-b border-white/70 bg-[#f7fbff]/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-2xl font-black text-primary drop-shadow-sm transition hover:scale-[1.02]"
            >
              QuizPoolAI
            </Link>
            <div className="flex gap-3 text-sm font-semibold">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-white/90 px-4 py-2 text-brandBlue shadow-sm transition hover:shadow-md"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-6xl px-6 py-10">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.95)",
              color: "#03352a",
              borderRadius: "999px",
              padding: "0.75rem 1.5rem",
              border: "1px solid #e0f4ec"
            }
          }}
        />
      </body>
    </html>
  );
}
