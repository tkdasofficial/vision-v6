# Settings Refinement + Research Web Search

Delivered in two stages so each can be tested before the next.

## Stage 1 — Settings (Part A/B)

Main `/app/settings` becomes a directory of 9 categories (icon, name, one-line description), each opening its own page with the page name in the top-left header:

- **Appearance** — theme (System / Light / Dark, actually applied), a small set of accessible accent colors, font size.
- **Language** — interface language; only English listed until translations exist (others shown as "coming soon" is avoided — just English + note).
- **AI Preferences** — default mode (Default / Deep Thinking / Research / Coding), response length & tone, custom instructions (length-limited, sent to the AI), web search preference (Auto / Always / Off, with an "unavailable" notice when no source works), coding preferences (comments, explanation level).
- **Chat & History** — clear all chats, delete incognito-free history, export chats; confirmation dialogs; ownership enforced on the server.
- **Privacy & Data** — full data export, research documents list with delete, delete-all-data.
- **Security** — change password (only for email/password accounts; hidden for Google/GitHub-only), reset link, 2FA: authenticator app (TOTP with QR + recovery codes) and email codes, each enabled separately; login enforces the second step.
- **Accessibility** — reduce motion, high contrast, larger tap targets.
- **Notifications** — browser notifications on/off and per-type toggles (only channels that really work).
- **About VISION** — version, help/support, Terms of Service, Privacy Policy.

Account page keeps profile, email, connected accounts, sign out, delete account; nothing duplicated in Settings.

All preferences are saved in the existing `user_settings` table (new columns added), applied immediately for simple toggles, with Save/Cancel for forms; success shown only after the server confirms.

## Stage 2 — Research web search (Part C)

A server-side search layer with providers tried in order, results normalized, de-duplicated, cached and rate-limited:

1. **Wikipedia** (official API, free, no key) — background facts.
2. **DuckDuckGo Instant Answer** (free, no key) — labelled as quick answers only, not full web search.
3. **SearXNG** — used only if you give me an instance address you control; otherwise marked unavailable.
4. **Reddit** — only with official API keys from you; otherwise skipped.
5. Optional paid/free-tier general search (e.g. Brave or Tavily) — if you provide a key; this is the only way to get broad real web results reliably.

Research reports then cite numbered sources with links, and say clearly when live search was unavailable.

## Technical details

- Routes: `src/routes/app.settings.{index,appearance,language,ai-preferences,chat-history,privacy-data,security,accessibility,notifications,about}.tsx`; `app.settings.tsx` becomes an `<Outlet />` layout; views in `src/views/settings/*`.
- Shared `SettingsRow`, `SettingsToggle`, `SettingsSelect`, `ConfirmDialog` components.
- D1 migration: extra `user_settings` columns; `user_2fa` (encrypted TOTP secret, hashed recovery codes, email_2fa flag); `search_cache`.
- TOTP verified server-side (RFC 6238, Web Crypto); login returns a "second step required" state with a short-lived HttpOnly challenge cookie.
- Search in `src/lib/search/*.server.ts` with a provider interface, per-provider timeout, fallback chain, and keys stored as Cloudflare secrets.
