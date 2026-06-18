# Trendy

AI-powered photo template platform. Fresh designs generated daily from trending aesthetics.

## Quickstart

```bash
# Install dependencies (Node 20+, pnpm 9+)
pnpm install

# Copy env template and fill in values
cp .env.example .env

# Start dev servers
pnpm dev
# → Frontend: http://localhost:5173
# → API: http://localhost:3001
```

See **[docs/SETUP.md](docs/SETUP.md)** for full local setup instructions including Firebase emulator and Polar sandbox.

## Project structure

```
apps/web      # React 18 + TypeScript + Vite SPA
apps/api      # Node.js + Express serverless backend
packages/shared  # Shared types, schemas, plan definitions
firebase/     # Firestore and Storage security rules
docs/         # Architecture, setup, API reference
```

## Stack

- **Frontend**: React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Firebase Admin SDK
- **Auth**: Firebase Auth (email/password + Google)
- **Database**: Firestore
- **Payments**: Polar (subscriptions, webhooks)
- **AI**: Gemini (trends + image gen), Claude Opus (prompt enhancement), Replicate Flux Schnell
- **Deploy**: Vercel (SPA + serverless functions + cron)

## Manual setup required

See **[docs/TO_DO.md](docs/TO_DO.md)** — Firebase, Polar, and Vercel dashboard steps that must be done by hand.

## Commands

```bash
pnpm dev          # Start all apps in parallel
pnpm build        # Build all apps
pnpm test         # Run all tests
pnpm typecheck    # TypeScript check all packages
pnpm lint         # ESLint check
```
