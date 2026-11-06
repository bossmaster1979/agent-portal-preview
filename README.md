# Agent Portal App — downloadable, installable (PWA)

Owner: Bge. CEO: Baxter. Manager: Agent Portal Manager.
Built: Nov 5–6, 2026. Local only. NOT published, NOT deployed,
no live site touched, no real buyer data, no new accounts.

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
| `index.html` | Sign-in (pick your name, no password) + install hint |
| `board.html` | Masked ready-buyer board — 5 SAMPLE buyers, claim buttons |
| `my-leads.html` | Buyers you claimed, with outcome buttons |
| `handover.html` | Handover sheet for one claimed buyer (SAMPLE data) |
| `about.html` | Quinton's contact + his 10 real team listings, addresses only |
| `install.html` | How to add the app to your home screen (iPhone + Android) |
| `styles.css` | Gold/dark styling, phone first |
| `app.js` | Sign-in, claims, outcomes — stored on the phone only |
| `data.js` | SAMPLE agents (Quinton first + 2 made-up) and 5 SAMPLE buyers |
| `manifest.json` | App name, icons, standalone display, gold/dark colours |
| `sw.js` | Service worker — saves the app shell on the phone |
| `icon-192.png`, `icon-512.png` | Gold Q on dark, drawn with PIL (free, built here) |
| `tests-agent-portal.spec.js` | The Playwright test (copy of the run copy) |
| `shots/` | Phone-size screenshots: sign-in, board, handover, my-leads |

## How the rules work in the app

- **Sign-in is demo-only.** Tap your name. No password, no account,
  nothing sent anywhere. Quinton is first; the other two agents are
  marked SAMPLE.
- **Board is masked.** Area, budget range, timeline, pre-approval,
  date ready, and "Checks passed". No name, no phone, no email —
  those stay hidden until a claim.
- **Claim = one buyer, one agent.** Claiming removes the buyer from
  the board at once. A second agent who opens that buyer's handover
  sheet sees "Already claimed" and no details. The claim is stored
  on the phone (localStorage — a small store your browser keeps on
  the device), so it survives closing the app.
- **Pass-on rule.** Buyer C (Ana) said NO to being passed to another
  agent, so only Quinton can claim her — other agents see
  "Quinton only" instead of a claim button, and the claim is refused
  in the code as well. Fixed Nov 6, 2026 after the scrubber flagged
  it; covered by the Playwright test.
- **Handover sheet only after a claim.** It follows the template at
  `~/workspace/goals/buyer-finder-service-for-real-estate-agents/files/buyer-handoff-sheet.md`,
  filled with SAMPLE data: fictional first name, (555) 010-xxxx
  number, firstname@example.com email, booked call time, what was
  NOT done, and the three consent records + do-not-call check date.
- **My leads.** Outcome buttons: Called / No answer / Deal closed,
  saved on the phone only.
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

To try it: sign in as Quinton → claim buyer A → see the handover
sheet → My leads → tap Called. Sign out, sign in as Maria, open
buyer A's handover sheet → "Already claimed". To reset the demo,
clear the site's data in the browser (or run the test, which uses
a fresh browser each time).

## Fail-able check — run Nov 6, 2026, all passed

Playwright test `tests-agent-portal.spec.js` (1 test, 3.7s):
sign-in page (3 agents, Quinton first, no password field) →
board (5 masked SAMPLE buyers, no phone/email/name visible) →
handover before claim refused ("Not claimed yet") →
claim buyer A → handover shows Sam, (555) 010-1001,
sam@example.com, Thu Nov 6 at 6:00 PM Pacific →
board drops to 4, buyer A gone →
My leads shows buyer A, "Called" recorded and still there after
reload → second agent (Maria) sees no buyer A and gets
"Already claimed" with no details →
about page shows all 10 real listings, install page shows the
iPhone steps → manifest valid, standalone, both icons load (200),
service worker registered. Zero failed requests, zero page errors.

Static greps: no real phone number anywhere except Quinton's own
published contact on about.html; no real buyer emails; no farm-lead
data; only the five (555) 010-xxxx fiction numbers.

## What is NOT done (honest gaps)

- This is a demo on one phone. Claims and outcomes live in that
  phone's browser only — two real phones would not see each
  other's claims yet. A real shared version needs a small server
  or shared store (a later build decision, free-only).
- No real sign-in service: anyone with the demo can tap any agent
  name. Real agent accounts come with the real version.
- No payment step: the $599 ready-buyer fee is not charged here.
  Payment stays Bge's tap, by bank transfer, as in the plan.
- Not published or deployed. Putting it on a real address is the
  owner's tap only.
