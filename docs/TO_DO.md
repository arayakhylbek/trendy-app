# Glimr — Manual To-Do

Tasks that **you** need to do by hand (things I can't do from code).
I'll keep adding new manual tasks here as they come up.

Last updated: 2026-06-15

---

## 🔴 Required — app won't fully work until these are done

### 1. Add environment variables on Vercel
Project → Settings → Environment Variables. Add both, then redeploy.

- [ ] `ANTHROPIC_API_KEY` — your Anthropic API key (for claude-opus-4-7 prompt enhancement)
- [ ] `REPLICATE_TOKEN` — a **new** Replicate token (the old one was revoked). Create at https://replicate.com/account/api-tokens
- [ ] After adding, trigger a redeploy so the variables load (`vercel --prod` or push to GitHub)

### 2. Enable Firebase Auth providers
https://console.firebase.google.com/project/trendy-app-glimr/authentication/providers

- [ ] Enable **Email/Password**
- [ ] Enable **Google**
- [ ] Authentication → Settings → Authorized domains → add `trendy-app-one.vercel.app`

### 3. Publish Firestore security rules
The repo has `firestore.rules` (includes the `users/{uid}` collection **and** the new
`users/{uid}/generations/{genId}` subcollection that powers the personal Gallery).

- [x] Deploy rules: `firebase deploy --only firestore:rules`
  (deployed 2026-06-15 to project trendy-app-glimr)
- [x] **Gallery rules published** — personal generations subcollection now readable/writable by its owner.

---

## 🟡 Recommended — for production readiness

- [ ] Connect Vercel GitHub App for auto-deploy on push: https://github.com/apps/vercel
- [ ] Set up real payment processing (Stripe) — right now "Upgrade" just flips the plan locally/in Firestore, no charge happens
- [ ] Replace placeholder legal links in the footer (Privacy Policy / Terms / Contact) with real pages
- [ ] Set git identity so commits aren't attributed to the local machine name:
  - `git config --global user.name "Aray Akhylbek"`
  - `git config --global user.email "araiakhylbek78@gmail.com"`

---

## ✅ Done

- [x] Top navigation bar (logo + Templates/Pricing links)
- [x] Footer with copyright + legal links
- [x] Pricing section: Free (2) / Lite $2.99 (10/mo) / Pro $4.99 (30/mo)
- [x] Auth UI (sign in / sign out, email + Google, password reset, validation)
- [x] Generation gate: badge appears after sign-in, per-account limits tracked in Firestore
- [x] AI model switched to `claude-opus-4-7` in `api/[...path].js`
- [x] Deployed to https://trendy-app-one.vercel.app
