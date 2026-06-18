# Architecture

## Overview

Trendy is a pnpm monorepo with three packages:

```
apps/web      — React 18 + TypeScript + Vite SPA
apps/api      — Node.js + Express serverless backend (Vercel Functions)
packages/shared — Shared types, Zod schemas, plans, error classes
```

## Data flow

```
User browser
  ↓ Firebase Auth ID token (Bearer)
apps/web (React)
  ↓ apiFetch() with Authorization header
apps/api (Express serverless)
  ├─ Firebase Admin (verify token, read/write Firestore)
  ├─ Polar SDK (checkout, portal, webhook)
  ├─ Gemini API (trend sourcing, template concept + image generation)
  ├─ Anthropic Claude API (prompt enhancement)
  └─ Replicate API (Flux Schnell image generation)
```

## Pricing tiers

Defined in `packages/shared/src/plans.ts` — **single source of truth** for both the frontend pricing UI and backend entitlement checks.

| Tier   | Price | Monthly generations | Notes                  |
|--------|-------|---------------------|------------------------|
| Free   | $0    | 5                   | No Polar product       |
| Pro    | $19   | 200                 | `POLAR_PRODUCT_PRO`    |
| Studio | $49   | ∞ (fair use)        | `POLAR_PRODUCT_STUDIO` |

## Firestore collections

| Collection              | Who writes       | Who reads        |
|-------------------------|------------------|------------------|
| `users/{uid}`           | Backend only     | Owner (Auth)     |
| `templates/{id}`        | Backend only     | Public           |
| `generationRuns/{date}` | Backend only     | Public           |
| `webhookEvents/{id}`    | Backend only     | Nobody           |
| `users/{uid}/generations/{id}` | Auth user | Owner (Auth)  |

## AI generation pipeline

### Daily cron (`POST /api/cron/generate-daily`)

```
Vercel Cron (09:00 UTC)
  → GET /api/cron/generate-daily (CRON_SECRET header)
  → GeminiTrendSource.getTrendingTopics() — asks Gemini for 5 trending aesthetic themes
  → for top 3 trends:
      GeminiProvider.generateTemplateConcept(trend) — Gemini LLM → TemplateConcept
      GeminiProvider.generateTemplateImage(concept) — gemini-2.0-flash-preview-image-generation
      Write templates/{id} to Firestore
  → Mark generationRuns/{yyyy-mm-dd} as completed (idempotent)
```

### User generation (`POST /api/generate`)

```
User uploads photo → React frontend → POST /api/generate
  → ensureAuth middleware (Firebase ID token)
  → rateLimit(10/min) middleware
  → checkQuota middleware (compares generationsUsed vs plan.monthlyLimit)
  → ClaudePromptEnhancer.enhance(prompt, imageBase64)
      — claude-opus-4-8 analyzes face features, enriches template prompt
  → ReplicateProvider.generateImage(enhancedPrompt)
      — Flux Schnell model, 3:4 aspect ratio, polls 30×2s
  → FieldValue.increment(1) on users/{uid}.generationsUsed (atomic)
  → Return { image: url, prompt: enhanced }
```

## Trend sourcing — compliance note

**We do NOT scrape Pinterest or TikTok directly.** Direct scraping violates their Terms of Service and is legally risky.

Instead, `GeminiTrendSource` asks the Gemini LLM to generate a list of currently trending aesthetic/cultural themes based on its training data and knowledge cutoff. This is a best-effort approximation of real trends, not live data.

If you want real-time trend data, the architecture is designed to swap `GeminiTrendSource` for a licensed third-party trends API (e.g., Exploding Topics API, Trendsmap, or Pinterest Trends API via official partnership) — just implement the `TrendSource` interface in `packages/shared/src/ai.ts`.

## Webhook security

The Polar webhook handler at `/api/webhooks/polar` is mounted **before** `express.json()` so it receives the raw request body (required for HMAC signature verification via `@polar-sh/sdk/webhooks`).

Idempotency is enforced by writing processed event IDs to `webhookEvents/{eventId}` before updating user state — retried webhooks are safely no-ops.

## Rate limiting

Currently in-memory (per Vercel serverless instance). This is sufficient for low traffic but can diverge across multiple instances. For multi-region production, replace with Upstash Redis (KV) — the `rateLimit` middleware in `apps/api/src/middleware/rateLimit.ts` can be swapped without changing the route handlers.
