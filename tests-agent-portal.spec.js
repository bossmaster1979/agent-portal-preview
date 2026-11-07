// Agent Portal — fail-able check, Playwright. Run from
// ~/workspace/projects/reel-DfWR5BWiGct/playwright-test with:
//   npx playwright test tests/agent-portal.spec.js
// Needs the app served at http://localhost:8130 (python3 -m http.server 8130
// from ~/workspace/projects/agent-portal-app).
//
// The last test ("live: claim in one context ...") also needs:
//   1. The Worker running locally: cd ~/workspace/projects/agent-portal-app/worker
//      && npx wrangler dev --local --port 8787 (after `wrangler d1 execute
//      agent-portal --local --file schema.sql` once, and test passcodes set
//      with hash-passcode.mjs — see worker/README.md. Test passcodes live
//      ONLY in the local D1 database, never in this repo: set your own
//      with `node hash-passcode.mjs <agent-id> <passcode>` and the UPDATE
//      line it prints, then use those same passcodes below.
//      The test below expects the passcodes to be "test-passcode-456"
//      for maria and "test-passcode-789" for david — set exactly those
//      two locally, or edit the two fill() lines to match yours.
//   2. A LIVE copy of the app (same files, apiBase pointed at the Worker)
//      served at http://localhost:8131:
//        rm -rf /tmp/agent-portal-live && cp -r ~/workspace/projects/agent-portal-app /tmp/agent-portal-live
//        sed -i 's#apiBase: ""#apiBase: "http://localhost:8787"#' /tmp/agent-portal-live/app.js
//        python3 -m http.server 8131 --directory /tmp/agent-portal-live
//   3. Fresh local D1 state before the run (claims from earlier runs
//      would hide buyers):
//        npx wrangler d1 execute agent-portal --local --command "UPDATE buyers SET claimed_by = NULL, claimed_at = NULL; DELETE FROM outcomes; DELETE FROM sessions; DELETE FROM failed_signins;"
// If the Worker is not reachable, the live test skips itself — the demo
// tests still run. The live test is only "passed" when it actually runs.
const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:8130";
const BASE_LIVE = "http://localhost:8131";
const WORKER = "http://localhost:8787";

test("portal: sign-in, board masked, claim, double-claim refused, handover gated, outcomes saved, SW registers", async ({ page }) => {
  const failed = [];
  page.on("response", r => { if (r.status() >= 400) failed.push(r.url() + " -> " + r.status()); });
  page.on("pageerror", e => failed.push("pageerror: " + e.message));

  // 1. Sign-in page loads; two SAMPLE agents, passcode boxes.
  // Demo mode says plainly the passcode is not checked and nothing is sent.
  await page.goto(BASE + "/index.html");
  await expect(page.locator("h1")).toHaveText("Agent Portal");
  const agentCards = page.locator("#agent-list .card");
  await expect(agentCards).toHaveCount(2);
  await expect(agentCards.nth(0)).toContainText("Maria Torres");
  await expect(agentCards.nth(0)).toContainText("SAMPLE");
  await expect(agentCards.nth(1)).toContainText("SAMPLE");
  await expect(page.locator('input[type="password"]')).toHaveCount(2);
  await expect(page.locator("#mode-note")).toContainText("Demo mode");
  await expect(page.locator("body")).toContainText("passcode is not checked");

  // 2. Sign in as Maria (passcode filled, not checked in demo mode) ->
  // board with 4 masked SAMPLE buyers, no phone/email visible.
  // The header now says the signed-in agent's own name, not anyone else's.
  await agentCards.nth(0).locator('input[type="password"]').fill("demo-passcode");
  await agentCards.nth(0).locator("button").click();
  await expect(page).toHaveURL(/board\.html/);
  await expect(page.locator("#brand")).toContainText("MARIA TORRES");
  await expect(page.locator("#brand")).toContainText("AGENT PORTAL");
  await expect(page.locator("#board .card")).toHaveCount(4);
  const boardText = await page.locator("#board").innerText();
  expect(boardText).not.toContain("(555)");
  expect(boardText).not.toContain("example.com");
  expect(boardText).not.toContain("Sam");
  expect(boardText).toContain("SAMPLE");
  expect(boardText).toContain("Checks");
  expect(boardText).toContain("Passed");

  // 3. Handover before claim is refused.
  await page.goto(BASE + "/handover.html?buyer=B");
  await expect(page.locator("#sheet")).toContainText("Not claimed yet");
  await expect(page.locator("#sheet")).not.toContain("(555) 010-1002");

  // 4. Claim buyer A -> handover sheet shows SAMPLE data.
  await page.goto(BASE + "/board.html");
  await page.locator("#board .card", { hasText: "Ready buyer A" }).locator("button").click();
  await expect(page).toHaveURL(/handover\.html\?buyer=A/);
  await expect(page.locator("#sheet")).toContainText("Sam");
  await expect(page.locator("#sheet")).toContainText("(555) 010-1001");
  await expect(page.locator("#sheet")).toContainText("sam@example.com");
  await expect(page.locator("#sheet")).toContainText("Thu Nov 6 at 6:00 PM Pacific");

  // 5. Board no longer shows buyer A (3 left).
  await page.goto(BASE + "/board.html");
  await expect(page.locator("#board .card")).toHaveCount(3);
  await expect(page.locator("#board")).not.toContainText("Ready buyer A");

  // 6. My leads shows buyer A; record "Called"; it sticks after reload.
  await page.goto(BASE + "/my-leads.html");
  await expect(page.locator("#mine .card")).toHaveCount(1);
  await expect(page.locator("#mine")).toContainText("Ready buyer A");
  await page.locator("#mine button", { hasText: "Called" }).click();
  await expect(page.locator("#mine")).toContainText("Called — spoke to the buyer");
  await page.reload();
  await expect(page.locator("#mine")).toContainText("Called — spoke to the buyer");

  // 7. Second agent cannot claim or view buyer A.
  await page.evaluate(() => localStorage.removeItem("agentPortal.agent"));
  await page.goto(BASE + "/index.html");
  await page.locator("#agent-list .card").nth(1).locator('input[type="password"]').fill("demo-passcode");
  await page.locator("#agent-list .card").nth(1).locator("button").click();
  await expect(page).toHaveURL(/board\.html/);
  // David signed in: the header says DAVID CHEN now, not Maria.
  await expect(page.locator("#brand")).toContainText("DAVID CHEN");
  await expect(page.locator("#brand")).not.toContainText("MARIA");
  await expect(page.locator("#board")).not.toContainText("Ready buyer A");
  await expect(page.locator("#board .card")).toHaveCount(3);
  await page.goto(BASE + "/handover.html?buyer=A");
  await expect(page.locator("#sheet")).toContainText("Already claimed");
  await expect(page.locator("#sheet")).toContainText("Maria Torres");
  await expect(page.locator("#sheet")).not.toContainText("(555) 010-1001");

  // 8. Other pages load: about (no names, no listings), install.
  await page.goto(BASE + "/about.html");
  await expect(page.locator("body")).toContainText("How the portal works");
  await expect(page.locator("body")).toContainText("separate project");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await page.goto(BASE + "/install.html");
  await expect(page.locator("h1")).toHaveText("Install the app");
  await expect(page.locator("body")).toContainText("Add to Home Screen");

  // 9. Manifest valid + icons load; service worker registered.
  const manifest = await page.request.get(BASE + "/manifest.json");
  expect(manifest.status()).toBe(200);
  const m = await manifest.json();
  expect(m.display).toBe("standalone");
  expect(m.icons.length).toBe(2);
  for (const icon of m.icons) {
    const r = await page.request.get(BASE + "/" + icon.src);
    expect(r.status()).toBe(200);
  }
  await page.goto(BASE + "/index.html");
  await page.waitForTimeout(1500);
  const sw = await page.evaluate(() => navigator.serviceWorker.getRegistration());
  expect(sw).toBeTruthy();

  expect(failed).toEqual([]);
});

test("portal: signed-out visitor going straight to board.html is sent to sign-in", async ({ page }) => {
  await page.goto(BASE + "/board.html");
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.locator("h1")).toHaveText("Agent Portal");
  await page.goto(BASE + "/my-leads.html");
  await expect(page).toHaveURL(/index\.html/);
  await page.goto(BASE + "/handover.html?buyer=A");
  await expect(page).toHaveURL(/index\.html/);
});

test("portal: billing page shows $499/mo by Zelle, address never on page, charges nothing on its own", async ({ page }) => {
  const failed = [];
  page.on("response", r => { if (r.status() >= 400) failed.push(r.url() + " -> " + r.status()); });
  await page.goto(BASE + "/billing.html");
  await expect(page.locator("h1")).toHaveText("Billing");
  await expect(page.locator("body")).toContainText("$499 a month");
  await expect(page.locator("body")).toContainText("Pay by Zelle");
  await expect(page.locator("body")).toContainText("never shown on this page");
  await expect(page.locator("body")).toContainText("no card form on this page");
  await expect(page.locator("body")).toContainText("Cancel anytime");
  await expect(page.locator("body")).toContainText("handover sheet");
  // No payment link anywhere on the page — nothing to tap, nothing charged.
  await expect(page.locator('a[href*="stripe"], a[href*="buy.stripe"], a[href*="checkout"]')).toHaveCount(0);
  // Linked from the board nav and the sign-in page.
  await page.goto(BASE + "/index.html");
  await expect(page.locator('a[href="billing.html"]')).toHaveCount(2); // nav + footer link
  await page.locator("#agent-list .card").nth(0).locator("button").click();
  await expect(page).toHaveURL(/board\.html/);
  await expect(page.locator('nav a[href="billing.html"]')).toHaveCount(1);
  expect(failed).toEqual([]);
});

test("live: claim in one browser context is visible as claimed in a second (Worker + local D1)", async ({ browser }) => {
  // Skip (don't fake a pass) if the local Worker or live copy is not up.
  const health = await fetch(WORKER + "/api/health").then(r => r.ok).catch(() => false);
  const liveUp = await fetch(BASE_LIVE + "/index.html").then(r => r.ok).catch(() => false);
  test.skip(!health || !liveUp, "local Worker (8787) or live app copy (8131) not running — see the header comment");

  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();
  const failed = [];
  for (const p of [p1, p2]) {
    // 401 on a wrong passcode and 403 on a refused handover sheet are
    // expected answers in this test, not failures — skip those two.
    p.on("response", r => {
      if (r.status() >= 400 &&
        !(r.url().endsWith("/api/signin") && r.status() === 401) &&
        !(r.url().includes("/api/handover") && r.status() === 403)) {
        failed.push(r.url() + " -> " + r.status());
      }
    });
    p.on("pageerror", e => failed.push("pageerror: " + e.message));
  }

  // Wrong passcode is refused, with a plain-words message, no redirect.
  await p1.goto(BASE_LIVE + "/index.html");
  await expect(p1.locator("#mode-note")).toContainText("Live mode");
  await p1.locator("#agent-list .card").nth(0).locator('input[type="password"]').fill("wrong-wrong-wrong");
  await p1.locator("#agent-list .card").nth(0).locator("button").click();
  await expect(p1.locator("#signin-error")).toContainText("Wrong passcode");
  await expect(p1).toHaveURL(/index\.html/);

  // Context 1 signs in as Maria (real passcode check), sees 4 buyers.
  await p1.locator("#agent-list .card").nth(0).locator('input[type="password"]').fill("test-passcode-456");
  await p1.locator("#agent-list .card").nth(0).locator("button").click();
  await expect(p1).toHaveURL(/board\.html/);
  await expect(p1.locator("#board .card")).toHaveCount(4);

  // Context 2 signs in as David, also sees 4 buyers.
  await p2.goto(BASE_LIVE + "/index.html");
  await p2.locator("#agent-list .card").nth(1).locator('input[type="password"]').fill("test-passcode-789");
  await p2.locator("#agent-list .card").nth(1).locator("button").click();
  await expect(p2).toHaveURL(/board\.html/);
  await expect(p2.locator("#board .card")).toHaveCount(4);

  // Context 1 claims buyer A through the Worker -> handover sheet.
  await p1.locator("#board .card", { hasText: "Ready buyer A" }).locator("button").click();
  await expect(p1).toHaveURL(/handover\.html\?buyer=A/);
  await expect(p1.locator("#sheet")).toContainText("Sam");

  // Context 2 re-reads the board: buyer A is gone — the claim crossed
  // contexts through the shared store, not this phone's localStorage.
  await p2.goto(BASE_LIVE + "/board.html");
  await expect(p2.locator("#board .card")).toHaveCount(3);
  await expect(p2.locator("#board")).not.toContainText("Ready buyer A");

  // Context 2 cannot see buyer A's handover sheet either.
  await p2.goto(BASE_LIVE + "/handover.html?buyer=A");
  await expect(p2.locator("#sheet")).toContainText("Already claimed");
  await expect(p2.locator("#sheet")).toContainText("Maria Torres");

  // Context 1 records an outcome through the Worker; it sticks.
  await p1.goto(BASE_LIVE + "/my-leads.html");
  await expect(p1.locator("#mine .card")).toHaveCount(1);
  await p1.locator("#mine button", { hasText: "Called" }).click();
  await expect(p1.locator("#mine")).toContainText("Called — spoke to the buyer");
  await p1.reload();
  await expect(p1.locator("#mine")).toContainText("Called — spoke to the buyer");

  await ctx1.close();
  await ctx2.close();
  expect(failed).toEqual([]);
});
