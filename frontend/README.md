# Frontend — QuizPoolAI

Next.js 14 + Tailwind CSS app that turns YouTube links into animated quiz experiences.

The UI now follows a Duolingo-inspired system with springy motions (Framer Motion), Lottie mascots, and Tailwind tokens (`primary`, `accent`, `brandBlue`, `danger`). Global glassmorphism + gradients live in `globals.css`, and reusable animation snippets are in `components/variants.ts`.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Environment variables:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## Scripts

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run built app
- `npm run lint` — ESLint
- `npm test` — Jest + React Testing Library

## Testing with MSW

Tests automatically spin up an MSW server (`tests/server.ts`) so API calls are mocked without touching the real backend.

## Assets & theming

- Mascot placeholder lives at `public/lottie/mascot.json`. Replace it with your production Lottie file (same path) to instantly update the AnimatedMascot component. Add sounds for the correct-answer chime by wiring an `<audio>` tag inside `CorrectAnimation`.
- Coin + sad-face fallbacks sit under `public/svgs`. They are referenced by `CoinShower`/`WrongAnimation`.
- Theme tokens (colors, spacing, keyframes) are configured in `tailwind.config.js`, while additional global utility classes live in `globals.css`.

## Running the frontend

```
cd frontend && npm install && npm run dev
```
