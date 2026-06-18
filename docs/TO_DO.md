# Trendy — Manual Setup Tasks

Tasks that **you** need to do by hand (things that can't be done from code).

Last updated: 2026-06-18

---

## 🔴 Required — app won't fully work until these are done

### 1. Firebase Console (console.firebase.google.com/project/trendy-app-glimr)

- [ ] **Enable Auth providers**: Authentication → Sign-in method:
  - Enable **Email/Password**
  - Enable **Google**
  - Authentication → Settings → Authorized domains → add `trendy-app-one.vercel.app`

- [ ] **Generate Admin service account key**: Project Settings → Service Accounts → Generate new private key
  - Set `FIREBASE_PROJECT_ID=trendy-app-glimr`
  - Set `FIREBASE_CLIENT_EMAIL=<value from JSON>`
  - Set `FIREBASE_PRIVATE_KEY=<value from JSON — keep the `\n` literal newlines>`

- [ ] **Enable Firebase Storage**: Storage → Get Started → choose region (us-central1)

- [ ] **Get Web SDK config** (VITE_ vars): Project Settings → Your apps → Web app → Config

- [ ] **Deploy Firestore rules + indexes** (new production rules in `firebase/`):
  ```bash
  firebase deploy --only firestore:rules,firestore:indexes
  ```
  Note: old rules allowed unauthenticated writes — new rules fix this. Deploy before going live.

- [ ] **Deploy Storage rules**:
  ```bash
  firebase deploy --only storage
  ```

### 2. Polar Dashboard (polar.sh/dashboard)

- [ ] Create product **"Pro"** (recurring subscription, $19/month) → copy Product ID → `POLAR_PRODUCT_PRO`
- [ ] Create product **"Studio"** (recurring subscription, $49/month) → copy Product ID → `POLAR_PRODUCT_STUDIO`
- [ ] Generate **API access token** → `POLAR_ACCESS_TOKEN`
- [ ] Create **Webhook endpoint**:
  - URL: `https://trendy-app-one.vercel.app/api/webhooks/polar`
  - Subscribe to: `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`
  - Copy webhook signing secret → `POLAR_WEBHOOK_SECRET`

### 3. Vercel Dashboard (vercel.com)

- [ ] Set all env vars in Settings → Environment Variables:
  ```
  # Firebase Web (VITE_ prefix required)
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID=trendy-app-glimr
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID

  # Firebase Admin
  FIREBASE_PROJECT_ID=trendy-app-glimr
  FIREBASE_CLIENT_EMAIL
  FIREBASE_PRIVATE_KEY

  # Polar
  POLAR_ACCESS_TOKEN
  POLAR_WEBHOOK_SECRET
  POLAR_SERVER=production
  POLAR_PRODUCT_PRO
  POLAR_PRODUCT_STUDIO

  # AI
  GEMINI_API_KEY
  ANTHROPIC_API_KEY
  REPLICATE_TOKEN

  # App
  APP_BASE_URL=https://trendy-app-one.vercel.app
  CRON_SECRET=<generate: openssl rand -hex 32>
  NODE_ENV=production
  ```
- [ ] Verify Vercel Cron is enabled (Projects → Settings → Cron Jobs)

### 4. One-time scripts (run after deploying API with real env vars)

- [ ] **Seed Firestore templates** (8 MVP templates → Firestore):
  ```bash
  cd apps/api
  FIREBASE_PROJECT_ID=trendy-app-glimr FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY=... \
    pnpm tsx src/scripts/seedTemplates.ts
  ```

---

## 🟡 Recommended — for production readiness

- [ ] Replace placeholder footer links (Privacy Policy / Terms / Contact) with real pages
- [ ] Set up monitoring / error tracking (Sentry, LogRocket, or Vercel Analytics)
- [ ] Replace in-memory rate limiter with Upstash Redis for multi-region deployments
- [ ] Set git identity: `git config --global user.name "Aray Akhylbek" && git config --global user.email "araiakhylbek78@gmail.com"`

## 🟢 Local dev — webhook testing

- [ ] Install ngrok: `brew install ngrok`
- [ ] Start API: `pnpm --filter @trendy/api dev`
- [ ] Start ngrok: `ngrok http 3001`
- [ ] Add the ngrok URL as a Polar **sandbox** webhook endpoint
- [ ] Complete a Polar sandbox checkout → verify user tier updates in Firestore

---

## ✅ Already done (MVP history)

- [x] Frontend deployed to https://trendy-app-one.vercel.app
- [x] Firestore rules deployed (2026-06-15) — updated to production rules in this rebuild
- [x] Admin publishedTemplates rules deployed
- [x] Auth UI (sign in / sign out, email + Google, password reset)
- [x] AI model claude-opus-4-7 wired in `api/[...path].js` (now ported to ClaudePromptEnhancer.ts)
- [x] Gemini image generation endpoint (api/gemini-image.js → GeminiProvider.ts)
- [x] 8 template cards with preview images
