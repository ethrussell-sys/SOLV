# TODO — a2-a3-ownership branch

## STEP 2 — VERIFIED (2026-09-01)

The purchase-recording + UTM fix (consolidated `createOrGetPurchase()`,
wired into the webhook, `/success` page, and `/api/purchase`) is
confirmed working end-to-end via a real test purchase:
`?utm_source=manualtest` → Stripe Checkout redirect → 4242 test card →
`purchases` row `83800eea-e58f-4fae-a8fa-d24b7be790dc`, `created_at`
today, `utm_source: 'manualtest'`, `utm_medium: 'browser'` both
populated. Row creation + UTM capture confirmed. (Only the Stripe
Checkout redirect path was exercised — the Apple/Google Pay wallet
path shares the same `createOrGetPurchase()` call but hasn't been
separately tested on a real device with a wallet configured.)

### Bug found + fixed: purchase confirmation email crash

Every real purchase crashed the email send with "Failed to render
React component — install @react-email/render" — the success page's
"Download link sent to {email}" message was false whenever this hit,
silently. Fixed the same way `/api/submit` was fixed (`6ebc49c`):
replaced the `react:` (React-element) prop to Resend with a plain
`html:` template literal in `lib/emails/send.ts`, dropping the
react-email dependency entirely. Re-verified with a fresh test
purchase — server log showed `[email] sent successfully, id:
081c99c2-...` with no render error.

### Bug found, NOT fixed: Resend sending domain unverified (pre-launch blocker)

Sender is still `onboarding@resend.dev` (see the commented-out FROM
line in `lib/emails/send.ts`), which can only deliver to Resend's own
test addresses (e.g. `delivered@resend.dev`) — a real customer address
(e.g. `test-manualtest@example.com`) gets rejected with a 422
`validation_error`. **Purchase confirmation emails will not reach real
customers until `solvscreen.com` is verified in Resend** (add the
domain, add the DNS records Resend gives you, wait for verification),
and the FROM address in `lib/emails/send.ts` is switched over. Not
started — needs a decision on DNS registrar access.

### Timing note: CONFIRMED — Supabase free-tier cold start, not the email, no code fix needed

One `/success` request logged 25.4s server-side against a baseline of
0.9–2.5s on other requests in the same session. **Not the email
send** — `lib/purchase.ts` already fires it via `.catch()` without
`await`, and the server log shows the `/success` response completing
before the email promise resolved.

Confirmed by warming Supabase with a throwaway query, then running 3
back-to-back test purchases against the warm DB:

- warmtest1: 2.5s
- warmtest2: 803ms
- warmtest3: 811ms

All three land well under the 25.4s cold outlier, two of three
sub-second — the delay does not recur once Supabase is awake. The
25.4s one-off was Supabase free-tier auto-pause/cold-start after an
idle gap. No code fix needed; resolves once Supabase is upgraded off
the free tier (already on the pre-launch list below).

## STEP 3 — VERIFIED (2026-09-02)

The gated download endpoint is in: `lib/download-policy.ts`'s
`assertDownloadAllowed(purchaseId, credentialKind)` is the one policy
checkpoint every path funnels through — `purchase_token` is always
allowed and never touches the counter; `download_token` and
`redemption_code` both call the atomic `increment_download_count()`
(migration `013`, already applied) and use its boolean as the
allow/deny decision. The magic-link branch (A3) is stubbed —
`assertDownloadAllowed` returns `not_implemented`, and A3 itself
(send-link + verify + session cookie) still doesn't exist beyond the
`magic_links` table from migration `012`.

`app/api/download/route.ts` is the single endpoint: GET `?token=`
handles both the A2 purchase token and the legacy `download_token`
owner-link (same URL shape already-sent confirmation emails use,
preserved byte-for-byte), POST `{code, email}` absorbs what used to be
`/api/redeem` (now deleted; `RedeemForm.tsx` repointed). Both mint a
fresh presigned S3 URL via `presignedDownloadUrl()`, which now takes
an optional `filename` and sets `ResponseContentDisposition` — sanitized
against untrusted filmmaker-submitted titles (ASCII fallback +
RFC 5987 `filename*` for Unicode; quotes/CRLF/path separators
stripped or percent-encoded either way).

The success page's `DownloadButton` now links through
`/api/download?token={purchaseToken}` instead of a raw baked-in S3
URL — this is what finally makes the A2 purchase token drive a real
download; it was minted and stashed but inert until now.

Purchase-token TTL raised from 1 hour to 24 hours (`lib/purchase-token.ts`)
so the free, uncounted download window is a full day. An expired
purchase token can't strand a buyer: the emailed owner-link
(`download_token`) and redemption code are both permanent, and share
one counted allowance — raised from 1 to 3 by migration
`014_download_limit_3.sql` (column default; existing rows backfilled
from 1 to 3, guarded by `where download_limit = 1` so any row support
had already manually bumped above 1 isn't clobbered back down).
**Applied to the live DB** — confirmed `download_limit=3` in Supabase.

The "yours forever" success-page copy was replaced with an honest,
delivery-framed version ("Your download. Ready now."; caption:
"Download didn't start? Tap to retry — or find it anytime in your
confirmation email.") — no forever/perpetual language, no hardcoded
download count or hour window baked into the copy.

### Verified end-to-end (2026-09-02), via a real test-mode purchase

Test purchase `f0ac0018-f6c0-419c-8909-01dc11ce8a7d` (`test@testing.com`,
*The Last Shore*), watching `purchases.download_count` directly in
Supabase between each step:

- **Token path (uncounted):** tapped Download from the success page
  (purchase-token GET) — `download_count` stayed **0**. (This attempt
  hit an S3 `NoSuchKey`, because the film's `file_key` is a placeholder
  — see "still to confirm" below. The gate's allow/deny decision and
  DB write happen before the S3 redirect, so this doesn't affect what
  was being verified here.)
- **Counted path (redemption code, POST):** 3 consecutive calls with
  `SOLV-3M4W-MCW3` → `download_count` went **0→1→2→3**, each returning
  200 with the correct `downloadsRemaining` (2, 1, 0).
- **4th attempt:** 403 `"You've reached the maximum number of downloads
  for this film..."`, and `download_count` **stayed at 3** — confirmed
  the atomic function's `WHERE download_count < download_limit` simply
  matches zero rows once the limit is hit, so denial and "never
  over-increments" are the same mechanism, not two separate checks.
- **Owner-link (`download_token`) GET, same purchase (limit already
  exhausted):** 403 `"Download limit reached..."`, count still 3 —
  proves `download_token` and `redemption_code` genuinely share one
  counter on the row, not separate per-credential allowances.

**Real download — VERIFIED (2026-09-02).** *The Last Shore*'s
`file_key` (`test-film.mp4`) was a placeholder never uploaded to S3, so
this last piece needed a film with a real object: checked all films'
`file_key`s with S3 `HeadObject` and found *Beaver Dam Playhouse*
(`status: live`) backed by a genuine 90,974,310-byte QuickTime file.
Bought it (test purchase `920c7623-03c5-4144-8260-e3702cc8aab5`) and
downloaded via the owner-link (`download_token`) GET path:

- `HTTP 200`, `Content-Type: video/quicktime`, `Content-Length:
  90974310` — no `NoSuchKey`, matches the S3 object exactly.
- `Content-Disposition: attachment; filename="Beaver Dam
  Playhouse.mov"; filename*=UTF-8''Beaver%20Dam%20Playhouse.mov` —
  clean title-based filename, correct extension.
- Downloaded file confirmed via `file` as a genuine `ISO Media, Apple
  QuickTime movie` — a real, playable file, not a stub.

**Bug found + fixed along the way:** the filename was hardcoded as
`${film.title}.mp4` in both branches — Beaver Dam Playhouse's real
file is `.MOV`, so it would have downloaded mislabeled. Worse, the
POST (redemption-code) branch passed no filename at all, so those
downloads got a raw S3 key, not even a wrong extension. Fixed with a
new `downloadFilename()` helper in `app/api/download/route.ts` that
derives the extension from `file_key` (lowercased) instead of
assuming `.mp4` — used by both branches now. Re-verified with a fresh
download after the fix: same clean 200/QuickTime/byte-count result,
filename now correctly `.mov`.

**STEP 3 is fully verified end-to-end:** gate logic (uncounted token
path, counted path to the limit, atomic denial, shared counter across
credentials), real file delivery, and a clean, correctly-extensioned
filename.

## STEP 4 — BUILT, NEEDS A REAL-DEVICE TEST (2026-09-02)

Wallet-pay (`BuyButton.tsx`) now routes through the same gate as the
card-checkout path, not a special case: `/api/purchase` no longer
returns a raw presigned URL at all (the `downloadUrl` field and its
underlying `presignedDownloadUrl()` call were deleted from
`createOrGetPurchase()` in `lib/purchase.ts` — this was the actual
leak, since anyone calling `POST /api/purchase` directly, not just the
UI, could previously get an ungated, uncounted, infinitely-repeatable
download URL). `BuyButton.tsx` now reads the same `purchaseToken`
`/api/purchase` already minted, and both download triggers (the
auto-download on payment success, and the "Download to device" retry
button) hit `/api/download?token={purchaseToken}` — identical
mechanism, uncounted 24h window, same as `DownloadButton.tsx` on the
success page. The client-side hardcoded `.mp4` filename hint is gone
too (`triggerDownload` now forces download via `a.download = ''` and
lets the server's `Content-Disposition` header supply the real,
correctly-extensioned name). Success overlay copy now matches the
success page's fallback line ("Download didn't start? Tap to retry —
or find it anytime in your confirmation email.").

After this, every download entry point goes through
`/api/download`/`assertDownloadAllowed`: the GET token paths, the POST
redemption-code path, the success page, `RedeemForm`, and now
wallet-pay. (A3 magic-link isn't a live bypass — it's stubbed
`not_implemented`, not a working alternate path.)

**Not yet tested:** Apple Pay/Google Pay can't be triggered in this
local/sandboxed environment (`pr.canMakePayment()` needs a real wallet
configured on a real device), so this has only been verified by
reading the code path and confirming the gate/header behavior
independently (via `/api/download` itself, already tested in step 3)
— not by an actual wallet purchase end-to-end. See the real-device
test item under "Before pushing A2/A3" below.

## A3 — VERIFIED (2026-09-03)

The email-magic-link re-download flow: a returning buyer who lost their
download link enters their email on `/purchased`, gets a one-click
link, and can re-download everything that email owns — no account, no
password.

**Send** (`app/api/magic-link/send/route.ts`) — email in, generate an
opaque single-use token (DB-backed via `magic_links`, migration `012`,
*not* a stateless HMAC token like the others, since a link that's
already been clicked has to actually be revocable), 15-minute
`expires_at`, email it via a new `sendMagicLink()` template
(`lib/emails/send.ts`, same visual style as the purchase-confirmation
email). Anti-enumeration: identical response whether or not the email
has purchases, whether or not it's been rate-limited, whether or not
the DB insert or Resend call itself failed — "did I get a link" is
only answerable by actually checking the inbox. Rate-limit guard:
skips issuing a new link if an unexpired, unused one already exists
for that email, reusing the 15-minute TTL itself as the window (caps
abuse at ~4/email/hour) rather than a separate constant.

**Verify** (`app/api/magic-link/verify/route.ts`) — atomically
consumes the link token in one conditional `UPDATE ... WHERE token = ?
AND used_at IS NULL AND expires_at > now()` (same atomicity pattern as
`increment_download_count`'s `WHERE` clause, no new Postgres function
needed), then mints a session cookie and redirects, using the same
`cookies()` + `redirect()` convention `app/api/admin/login/route.ts`
already established in this codebase.

**Session cookie** (`lib/magic-link.ts`) — stateless HMAC, mirrors
`lib/purchase-token.ts`'s `value.expires.sig` shape but signs an email
instead of a purchaseId, 24-hour TTL (so a re-download session doesn't
expire mid-task). **Bug caught before it shipped:** the mirrored
`split('.')`-into-3-parts pattern silently assumes the signed value
never contains a dot — true for a UUID `purchaseId`, false for almost
any real email address (the domain's dot, at minimum). Fixed by
popping `sig` and `expires` off the end of the split (both provably
dot-free: hex digest, decimal timestamp) and rejoining whatever
remains as the email. Verified with a standalone unit test across
multi-dot addresses.

**Gate integration** (`lib/download-policy.ts`,
`app/api/download/route.ts`) — the `magic_link_session` stub is gone;
it now shares the exact counted `increment_download_count` branch
`download_token`/`redemption_code` already use, confirmed live by the
counter moving 0→1. `/api/download` GET gained a `?purchaseId=`
branch alongside the existing `?token=` one, since a session proves
"this browser controls this email," not "this browser owns this
specific film" the way a token does by construction. **Ownership check
verified airtight, twice, independently:** a valid session for
`wallettest@example.com` successfully downloaded its own purchase
(count 0→1), then — same session, unmodified — was denied `404` when
pointed at a `purchaseId` belonging to `test@test.com`, with that
purchase's `download_count` confirmed unchanged in the DB (not just a
denied response after the fact). Missing-purchase and
email-mismatch are deliberately indistinguishable (both `404`), same
enumeration-safety principle as the POST redemption-code handler.

**The Purchased screen** (`app/purchased/page.tsx` +
`MagicLinkForm.tsx`) — server component reads the session cookie and
branches to: the email-entry form (no/invalid session, with a friendly
message when arriving from a dead link via `?error=invalid`); the
owned-films list (one Supabase query using the real
`purchases.film_id → films.id` FK to embed film titles, no second
round-trip); or an empty state (valid session, zero purchases). Each
row links to `/api/download?purchaseId=<id>` with a live "X downloads
remaining" display, or a "Download limit reached" message in place of
a dead link once exhausted. All render states verified live against
real data, not just typechecked.

## Revisit after the Backblaze + Cloudflare migration

- [ ] `download_limit=3` (migration `014`) was sized around egress cost
      on the current storage/CDN setup. Free egress on Backblaze +
      Cloudflare removes that constraint — loosen or remove the limit
      once that migration lands.
- [ ] The 24h purchase-token window (A2) is unlimited/uncounted by
      design — fine for launch, but it's a known egress exposure (no
      cap on how many times that window can be hit while the token is
      live). Revisit once egress is free.

## Before pushing A2/A3

- [ ] Deprecate `/api/resend-code` now that A3 exists — it does a
      weaker version of the same job (one most-recent purchase only,
      via `.limit(1)`, and a real enumeration leak: `404 "No purchase
      found for that email address"` reveals whether an email has
      purchased). `/purchased`'s magic-link flow covers every purchase
      for an email and doesn't leak that signal. Left untouched for
      this build — `RedeemForm.tsx`'s "Lost your code?" panel still
      points at it — but worth retiring in favor of pointing that
      panel at `/purchased` instead.
- [ ] Real-device test of the wallet-pay (Apple Pay / Google Pay)
      download gate (STEP 4) — can't trigger `pr.canMakePayment()`
      locally, so the gated download flow there has only been verified
      by reading the code path, not by an actual wallet purchase.
- [ ] Add `DOWNLOAD_TOKEN_SECRET` to Vercel env vars (currently
      local-only, in `.env.local`)
- [ ] Remove the stray unused `AWS_S3_BUCKET` env var from Vercel
      (code reads `AWS_BUCKET_NAME`, not `AWS_S3_BUCKET`) — do this
      deliberately, since removing a Vercel env var triggers a redeploy
- [ ] Check the 4 "Needs Attention" env vars flagged in the Vercel
      dashboard
- [x] Two known pre-existing `react-hooks/set-state-in-effect` issues,
      resolved on their own merits rather than the same fix for both:
      `AgeGate.tsx` had a real fail-open bug (`visible` defaulted to
      `false`, so the very first paint on every fresh visit showed the
      watch page un-gated until the effect corrected it a tick later)
      — fixed by flipping the default to fail-closed (`useState(true)`)
      and only hiding the gate once localStorage confirms the visitor
      already passed it; still trips the lint rule (any direct
      `setState` in an effect does), but the behavior is now correct
      and hydration-safe. `AddToHomeScreen.tsx`'s flagged line had no
      actual defect — moving it to a lazy `useState` initializer (the
      usual fix) would crash or hydration-mismatch on iOS Safari
      visitors, since `navigator`/`window` don't exist during this
      client component's server render. Left the behavior as-is with a
      documented `eslint-disable-next-line`, so it isn't "fixed" into a
      worse bug later.

## Pre-launch (before real traffic)

- [ ] Upgrade Supabase off the free tier (auto-pauses on inactivity)
- [ ] Upgrade Vercel off the Hobby plan
- [ ] Verify `solvscreen.com` as a sending domain in Resend, add the
      DNS records it gives you, then switch `FROM` in
      `lib/emails/send.ts` off `onboarding@resend.dev` — see STEP 2
      above. Purchase confirmation emails don't reach real customers
      until this is done.
