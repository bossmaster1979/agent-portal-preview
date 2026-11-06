// Agent Portal — fail-able check, Playwright. Run from
// ~/workspace/projects/reel-DfWR5BWiGct/playwright-test with:
//   npx playwright test tests/agent-portal.spec.js
// Needs the app served at http://localhost:8130 (python3 -m http.server 8130
// from ~/workspace/projects/agent-portal-app).
const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:8130";

test("portal: sign-in, board masked, claim, double-claim refused, handover gated, outcomes saved, SW registers", async ({ page }) => {
  const failed = [];
  page.on("response", r => { if (r.status() >= 400) failed.push(r.url() + " -> " + r.status()); });
  page.on("pageerror", e => failed.push("pageerror: " + e.message));

  // 1. Sign-in page loads; Quinton first, two SAMPLE agents, no passwords.
  await page.goto(BASE + "/index.html");
  await expect(page.locator("h1")).toHaveText("Agent Portal");
  const agentCards = page.locator("#agent-list .card");
  await expect(agentCards).toHaveCount(3);
  await expect(agentCards.nth(0)).toContainText("Quinton Sanchez");
  await expect(agentCards.nth(1)).toContainText("SAMPLE");
  await expect(agentCards.nth(2)).toContainText("SAMPLE");
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator("body")).toContainText("no password in this demo");

  // 2. Sign in as Quinton -> board with 5 masked SAMPLE buyers, no phone/email visible.
  // The header now says the signed-in agent's own name, not anyone else's.
  await agentCards.nth(0).locator("button").click();
  await expect(page).toHaveURL(/board\.html/);
  await expect(page.locator("#brand")).toContainText("QUINTON SANCHEZ");
  await expect(page.locator("#brand")).toContainText("AGENT PORTAL");
  await expect(page.locator("#board .card")).toHaveCount(5);
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

  // 5. Board no longer shows buyer A (4 left).
  await page.goto(BASE + "/board.html");
  await expect(page.locator("#board .card")).toHaveCount(4);
  await expect(page.locator("#board")).not.toContainText("Ready buyer A");

  // 6. My leads shows buyer A; record "Called"; it sticks after reload.
  await page.goto(BASE + "/my-leads.html");
  await expect(page.locator("#mine .card")).toHaveCount(1);
  await expect(page.locator("#mine")).toContainText("Ready buyer A");
  await page.locator("#mine button", { hasText: "Called" }).click();
  await expect(page.locator("#mine")).toContainText("Called — spoke to the buyer");
  await page.reload();
  await expect(page.locator("#mine")).toContainText("Called — spoke to the buyer");

  // 7. Second agent cannot claim or view buyer A. Buyer C said no to
  // pass-on, so only Quinton can claim her — Maria sees no claim button.
  await page.evaluate(() => localStorage.removeItem("agentPortal.agent"));
  await page.goto(BASE + "/index.html");
  await page.locator("#agent-list .card").nth(1).locator("button").click();
  await expect(page).toHaveURL(/board\.html/);
  // Maria signed in: the header says MARIA TORRES now, not Quinton.
  await expect(page.locator("#brand")).toContainText("MARIA TORRES");
  await expect(page.locator("#brand")).not.toContainText("QUINTON");
  await expect(page.locator("#board")).not.toContainText("Ready buyer A");
  await expect(page.locator("#board .card", { hasText: "Ready buyer C" })).toContainText("Quinton only");
  await expect(page.locator("#board .card", { hasText: "Ready buyer C" }).locator("button")).toHaveCount(0);
  expect(await page.evaluate(() => claimBuyer("C"))).toBe(false);
  await page.goto(BASE + "/handover.html?buyer=A");
  await expect(page.locator("#sheet")).toContainText("Already claimed");
  await expect(page.locator("#sheet")).toContainText("Quinton Sanchez");
  await expect(page.locator("#sheet")).not.toContainText("(555) 010-1001");

  // 8. Other pages load: about (10 real listings, addresses only), install.
  await page.goto(BASE + "/about.html");
  await expect(page.locator("body")).toContainText("4411 Carib Ct, San Diego, CA 92117");
  await expect(page.locator("body")).toContainText("3476 Butler Pl, Escondido, CA 92027");
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
