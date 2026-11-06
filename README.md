# Agent Portal App — downloadable, installable (PWA)

Owner: Bge. CEO: Baxter. Manager: Agent Portal Manager.
Built: Nov 5–6, 2026. Preview live at
https://bossmaster1979.github.io/agent-portal-preview/ (GitHub
Pages, SAMPLE data only). The Worker is NOT deployed, no live site
touched, no real buyer data, no new accounts, nothing charged.

## What it is

An app agents install on their phone (no app store — it installs
from the browser, straight to the home screen) and sign in to,
to get fresh ready buyers. A "PWA" is a web app that installs
like an app: a manifest file tells the phone its name and icon,
and a service worker (a small script that saves the app on the
phone) makes it open fast and work offline.

## What was reused, not built from zero

- Ready-buyer demo (`~/workspace/projects/ready-buyer-website/demo/`):
  the three SAMPLE buyers (A North Park, B La Jolla, C Chula Vista),
  the masked board shape, the six-question / three-consent rules.
- Parked multi-user build (`~/workspace/multi-user-build/`):
  the gate rule (a buyer only shows when the do-not-call check date
  + call/text/email consent are recorded and they did not opt out)
  and the one-buyer-to-one-agent rule. The parked stack was NOT
  booted (it needs Docker, not on this VM) — only its rules and
  logic were reused as files.
- Quinton's gold/dark luxury style from his live site.
- Playwright install at `~/workspace/projects/reel-DfWR5BWiGct/playwright-test/`
  for the browser test.

## Files

| File | What it does |
|---|---|
| `index.html` | Sign-in (pick your name + passcode) + install hint |
| `board.html` | Masked ready-buyer board — 5 SAMPLE buyers, claim buttons |
| `my-leads.html` | Buyers you claimed, with outcome buttons |
| `handover.html` | Handover sheet for one claimed buyer (SAMPLE data) |
| `billing.html` | Billing — $499/month, payment NOT switched on yet |
| `about.html` | Quinton's contact + his 10 real team listings, addresses only |
| `install.html` | How to add the app to your home screen (iPhone + Android) |
| `styles.css` | Gold/dark styling, phone first |
| `app.js` | Sign-in, claims, outcomes — demo mode (phone only) or live mode (Worker) |
| `data.js` | SAMPLE agents (Quinton first + 2 made-up) and 5 SAMPLE buyers |
| `manifest.json` | App name, icons, standalone display, gold/dark colours |
| `sw.js` | Service worker — saves the app shell on the phone (never API answers) |
| `icon-192.png`, `icon-512.png` | Gold Q on dark, drawn with PIL (free, built here) |
| `tests-agent-portal.spec.js` | The Playwright test (copy of the run copy) |
| `worker/` | Cloudflare Worker + D1 — deployable, NOT deployed (see `worker/README.md`) |
| `money-path-research.md` | The picks, limits, and drops behind this build |
| `shots/` | Phone-size screenshots: sign-in, board, handover, my-leads |

## How the rules work in the app

- **Sign-in is name + passcode.** In demo mode (the GitHub Pages
  preview) the passcode is not checked — the page says so, nothing
  is sent anywhere, and claims stay on this phone. In live mode
  (Worker address set in `app.js`) the Worker checks the passcode
  against a stored hash and hands back a one-day token. Quinton is
  first; the other two agents are marked SAMPLE.
- **Board is masked.** Area, budget range, timeline, pre-approval,
  date ready, and "Checks passed". No name, no phone, no email —
  those stay hidden until a claim.
- **Claim = one buyer, one agent.** Claiming removes the buyer from
  the board at once. A second agent who opens that buyer's handover
  sheet sees "Already claimed" and no details. In demo mode the
  claim is stored on the phone (localStorage — a small store your
  browser keeps on the device), so it survives closing the app. In
  live mode the claim is stored in the shared D1 database through
  the Worker, so every phone sees it.
- **Pass-on rule.** Buyer C (Ana) said NO to being passed to another
  agent, so only Quinton can claim her — other agents see
  "Quinton only" instead of a claim button, and the claim is refused
  in the code as well (and in the Worker, in live mode). Fixed Nov 6,
  2026 after the scrubber flagged it; covered by the Playwright test.
- **Handover sheet only after a claim.** It follows the template at
  `~/workspace/goals/buyer-finder-service-for-real-estate-agents/files/buyer-handoff-sheet.md`,
  filled with SAMPLE data: fictional first name, (555) 010-xxxx
  number, firstname@example.com email, booked call time, what was
  NOT done, and the three consent records + do-not-call check date.
- **My leads.** Outcome buttons: Called / No answer / Deal closed,
  saved on the phone only in demo mode, shared through the Worker
  in live mode.
- **SAMPLE data only.** Buyers A–C are the plan's three; D (Pacific
  Beach) and E (Escondido) are extra made-up examples in the same
  shape. All phones are (555) 010-xxxx (set aside for fiction),
  all emails are firstname@example.com. No farm leads — they are
  sellers, locked, and never go in this app.

## Run it (local only)

```sh
cd ~/workspace/projects/agent-portal-app
python3 -m http.server 8130
# open http://localhost:8130/index.html on this machine,
# or the machine's address on the same Wi-Fi from a phone
```

To try it: sign in as Quinton (type any passcode — demo mode does
not check it) → claim buyer A → see the handover sheet → My leads
→ tap Called. Sign out, sign in as Maria, open buyer A's handover
sheet → "Already claimed". To reset the demo, clear the site's data
in the browser (or run the test, which uses a fresh browser each time).

## Fail-able check — run Nov 6, 2026, all passed

Playwright test `tests-agent-portal.spec.js` (4 tests, 10.0s):
sign-in page (3 agents, Quinton first, passcode boxes, demo-mode
note) →
board (5 masked SAMPLE buyers, no phone/email/name visible) →
handover before claim refused ("Not claimed yet") →
claim buyer A → handover shows Sam, (555) 010-1001,
sam@example.com, Thu Nov 6 at 6:00 PM Pacific →
board drops to 4, buyer A gone →
My leads shows buyer A, "Called" recorded and still there after
reload → second agent (Maria) sees no buyer A and gets
"Already claimed" with no details →
signed-out visitor to board/my-leads/handover is sent to sign-in →
billing page shows $499/mo and "payment is NOT switched on" →
live cross-context claim (local Worker + D1): wrong passcode
refused, Quinton claims buyer A in one context, Maria's second
context re-reads the board and buyer A is gone, her handover sheet
is refused, Quinton's "Called" outcome sticks after reload →
about page shows all 10 real listings, install page shows the
iPhone steps → manifest valid, standalone, both icons load (200),
service worker registered. Zero failed requests, zero page errors.

Static greps: no real phone number anywhere except Quinton's own
published contact on about.html; no real buyer emails; no farm-lead
data; only the five (555) 010-xxxx fiction numbers.

## What changed — Nov 6, 2026 (money path, part 1)

- **Sign-in asks for a passcode now**, as well as a name. In the
  GitHub Pages preview the app still runs in **demo mode** (no server
  connected): the passcode is not checked, the page says so in plain
  words, and claims stay on this phone only.
- **Worker (deployable, NOT deployed)** in `worker/`: Cloudflare
  Worker + D1 — passcode check against a stored PBKDF2 hash (never
  the passcode itself), masked board, one-winner claim via a single
  conditional UPDATE, outcomes, and lockout after 5 wrong guesses.
  Deploy steps in `worker/README.md`. Going live is the owner's tap.
- **Billing page** (`billing.html`, linked from the board nav and
  the sign-in page): $499 a month per agent, what it includes,
  cancel anytime — and a clear line that payment is NOT switched on
  yet. No Stripe link exists, no charge is made, no subscription
  exists. Nothing was created in Stripe.
- **Service worker fix:** it used to cache every GET answer,
  including the Worker's board answers, so a second phone kept
  seeing a buyer as free after it was claimed. It now only caches
  the app's own shell files, never API answers (cache `agent-portal-v2`).
- **Board re-reads:** in live mode the board re-reads every 25
  seconds (polling). No instant push — see the honest limits below.
- Playwright test extended to 4 tests (see below); all pass.

## The shared store + real sign-in (Worker, not deployed yet)

`worker/` holds `worker.js` (all endpoints), `wrangler.toml`
(D1 binding; the database id is a placeholder until deploy),
`schema.sql` (tables + the 5 SAMPLE buyers + the 3 agents, passcodes
seeded as `NOT-SET` so nothing can sign in until Bge sets a real
passcode), `hash-passcode.mjs` (makes a salt + hash for one agent),
and `README.md` with the deploy steps. Nothing in `worker/` has
been deployed, and no Cloudflare account was touched.

How it works, in plain words: Bge hands each approved agent their
own passcode (by call or text, never in the app). The Worker stores
only a scrambled form of it (PBKDF2 hash, 100,000 rounds — slow on
purpose, so guessing is expensive). The agent signs in once and gets
a token good for one day. Claims go through one conditional UPDATE
("mark claimed only if nobody claimed it yet"), so exactly one agent
wins even if two tap Claim at the same second. D1 has no
BEGIN/COMMIT transactions, so that single step is the safe way.
After 5 wrong passcode guesses an agent is locked out for 15 minutes.

To go live later (owner's tap only): follow `worker/README.md`,
then set the Worker address as `APP_CONFIG.apiBase` at the top of
`app.js` and redeploy the app. Until then the app stays in demo mode.

## Billing — $499 a month, payment NOT switched on

See `billing.html`. $499/month per agent: ready buyers, one buyer to
one agent, handover sheet, booked call. Cancel anytime. Payment is
NOT switched on yet — no Stripe link was created, no charge made, no
subscription exists. When it opens, Bge makes one Stripe Payment
Link in the Dashboard (no code) and sends it to the agent himself.
The app does NOT check Stripe: Bge looks in the Dashboard, sees an
active subscription, and only then hands over a passcode. If a
payment fails or an agent cancels, Bge switches the agent off by
hand in D1 (see `worker/README.md`).

## What is NOT done (honest gaps)

- **Shared store is built but not live.** The Worker + D1 code is
  written and tested locally (`wrangler dev`, local D1), but it is
  NOT deployed and the app still runs in demo mode (claims on one
  phone only) until the owner says go. The cross-phone claim test
  ran against the local Worker, not a deployed one.
- **Polling, not instant.** In live mode phones re-read the board
  every 25 seconds. A claim shows on another phone a few seconds
  later, not the same instant. D1 read-after-write delay is
  unverified: a second phone might briefly show a buyer as free
  after it was claimed. The claim itself is safe (one winner), and
  the app handles "sorry, just claimed".
- **Passcodes are shared secrets, not full accounts.** If one leaks,
  Bge changes it fast. No "forgot my passcode" button — the agent
  asks Bge. Past ~20 agents, switch to Firebase Auth (see
  money-path-research.md).
- **The app does not check Stripe.** Bge matches payments to agents
  by hand in the Stripe Dashboard. If nobody watches it, a cancelled
  agent keeps access.
- **Free tier has no uptime promise**, community support only.
  Cloudflare is a company service, not open-source software — the
  code here is Bge's own and the data is plain SQL that can move.
  Re-check the Workers/D1 pricing page on the day of the deploy.
- Demo mode on one phone: claims and outcomes live in that phone's
  browser only. Anyone with the demo can sign in as any agent name
  (passcode not checked in demo mode).
- No payment step: the $599 ready-buyer fee is not charged here.
  Payment stays Bge's tap, by bank transfer, as in the plan.
- Not published or deployed beyond the approved GitHub Pages
  preview. Going live with the Worker is the owner's tap only.
