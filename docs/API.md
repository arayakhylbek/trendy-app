# API Reference

Base URL: `/api`

All protected routes require `Authorization: Bearer <Firebase ID token>`.

Error shape: `{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }`

---

## Users

### POST /api/users/me
Creates the user document in Firestore on first sign-in (idempotent).

**Auth:** Required

**Response:**
```json
{ "uid": "abc123" }
```

### GET /api/users/me
Returns the current user's profile and tier.

**Auth:** Required

**Response:**
```json
{
  "user": {
    "uid": "abc123",
    "email": "user@example.com",
    "tier": "free",
    "generationsUsed": 3,
    "createdAt": "2026-06-18T00:00:00.000Z"
  }
}
```

---

## Templates

### GET /api/templates
Returns the template library, ordered by `createdAt` descending.

**Auth:** Not required

**Query params:**
- `cat` — filter by category: `trending`, `kdrama`, `aesthetic`, `anime`, `fantasy`, `vintage`
- `limit` — max results (default 50, max 100)

**Response:**
```json
{ "templates": [...] }
```

### GET /api/templates/:id
Returns a single template.

**Auth:** Not required

**Response:**
```json
{ "template": { "id": "24", "label": "Baseball Stadium Cam", ... } }
```

---

## Generation

### POST /api/generate
Generates an AI photo using the selected template.

**Auth:** Required  
**Rate limit:** 10 requests/minute  
**Quota:** Checks `generationsUsed < plan.monthlyLimit`

**Request:**
```json
{
  "prompt": "The full template prompt...",
  "imageBase64": "base64-encoded-jpeg-data" // optional
}
```

**Response:**
```json
{ "image": "https://replicate.delivery/...", "prompt": "Enhanced prompt..." }
```

**Errors:**
- `429 QUOTA_EXCEEDED` — Monthly limit reached
- `429 RATE_LIMITED` — Too many requests
- `502 REPLICATE_FAILED` — Generation failed
- `504 REPLICATE_TIMEOUT` — Generation timed out after 60s

---

## Billing

### POST /api/billing/checkout
Creates a Polar checkout session for plan upgrade.

**Auth:** Required  
**Rate limit:** 5 requests/minute

**Request:**
```json
{ "planId": "pro" }
```

**Response:**
```json
{ "checkoutUrl": "https://polar.sh/checkout/..." }
```

### POST /api/billing/portal
Creates a Polar customer portal session for subscription management.

**Auth:** Required

**Response:**
```json
{ "portalUrl": "https://polar.sh/portal/..." }
```

---

## Webhooks

### POST /api/webhooks/polar
Polar webhook handler. **Raw body required** (do not send pre-parsed JSON).

**Auth:** Polar HMAC signature via `POLAR_WEBHOOK_SECRET`

Handles: `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`

---

## Cron

### POST /api/cron/generate-daily
Triggered by Vercel Cron at 09:00 UTC. Generates 3 new templates from trend data.

**Auth:** `Authorization: Bearer <CRON_SECRET>`

**Response:**
```json
{ "ok": true, "date": "2026-06-18", "templatesGenerated": 3 }
```

If already run today:
```json
{ "ok": true, "skipped": true, "date": "2026-06-18" }
```

---

## Health

### GET /api/health
```json
{ "ok": true }
```
