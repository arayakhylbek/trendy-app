# Local Development Setup

## Prerequisites

- Node.js 20+
- pnpm 9+: `npm install -g pnpm`
- Firebase CLI: `npm install -g firebase-tools`
- ngrok (for webhook testing): `brew install ngrok`

## Quick start

```bash
# 1. Clone and install
git clone <repo-url> && cd trendy-app
pnpm install

# 2. Copy env template and fill in values
cp .env.example .env
# Edit .env with your Firebase, Polar, and AI API keys (see docs/TO_DO.md for how to get them)

# 3. Start both frontend and backend in dev mode
pnpm dev

# Frontend: http://localhost:5173
# API: http://localhost:3001
```

## Environment variables

See `.env.example` for all required variables. You need:

- **Firebase Web SDK config** (from Firebase Console → Project Settings → Your apps)
- **Firebase Admin SDK** (from Firebase Console → Service Accounts → Generate key)
- **Polar sandbox tokens** (from polar.sh/dashboard → Sandbox)
- **AI keys**: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `REPLICATE_TOKEN`

## Seed the template database

After configuring Firebase Admin credentials:

```bash
pnpm --filter @trendy/api tsx src/scripts/seedTemplates.ts
```

This writes the 8 original MVP templates to Firestore.

## Run tests

```bash
pnpm test
```

## Firebase Emulator (optional, for offline development)

```bash
firebase emulators:start --only firestore,auth,storage
```

Then set in `.env`:
```
FIREBASE_EMULATOR_HOST=127.0.0.1
```

## Testing Polar webhooks locally

1. Start the API: `pnpm --filter @trendy/api dev`
2. Start ngrok: `ngrok http 3001`
3. In Polar sandbox dashboard, set webhook URL to `https://<ngrok-id>.ngrok.io/api/webhooks/polar`
4. Create a test checkout and complete it — watch the Firestore `users` doc update

## Type checking and linting

```bash
pnpm typecheck
pnpm lint
pnpm lint:fix
```
