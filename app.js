/* Agent Portal — demo-only logic. Everything is stored on this phone
   only (localStorage — a small store your browser keeps on the device).
   Nothing is sent anywhere. No real sign-in service, no passwords. */
const LS_AGENT = "agentPortal.agent";
const LS_CLAIMS = "agentPortal.claims";     // { buyerId: { agentId, agentName, claimedAt } }
const LS_OUTCOMES = "agentPortal.outcomes"; // { buyerId: "called" | "no-answer" | "closed" }

function getAgent() {
  try { return JSON.parse(localStorage.getItem(LS_AGENT) || "null"); } catch (e) { return null; }
}
function getClaims() {
  try { return JSON.parse(localStorage.getItem(LS_CLAIMS) || "{}"); } catch (e) { return {}; }
}
function getOutcomes() {
  try { return JSON.parse(localStorage.getItem(LS_OUTCOMES) || "{}"); } catch (e) { return {}; }
}
function saveClaims(c) { localStorage.setItem(LS_CLAIMS, JSON.stringify(c)); }
function saveOutcomes(o) { localStorage.setItem(LS_OUTCOMES, JSON.stringify(o)); }

function signIn(agentId) {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return;
  localStorage.setItem(LS_AGENT, JSON.stringify(agent));
  location.href = "board.html";
}
function signOut() {
  localStorage.removeItem(LS_AGENT);
  location.href = "index.html";
}

/* Claim one buyer. One buyer to one agent — if anyone already claimed
   this buyer, the claim is refused and nothing changes.
   Pass-on rule (from the plan): a buyer who said NO to being passed
   to another agent goes to Quinton only. Any other agent is refused. */
function canClaim(buyerId) {
  const agent = getAgent();
  if (!agent) return false;
  const buyer = buyerById(buyerId);
  if (!buyer) return false;
  if (getClaims()[buyerId]) return false;
  if (buyer.passOnConsent === "No" && agent.id !== "quinton") return false;
  return true;
}
function claimBuyer(buyerId) {
  const agent = getAgent();
  if (!agent) { location.href = "index.html"; return false; }
  if (!canClaim(buyerId)) return false;
  const claims = getClaims();
  claims[buyerId] = { agentId: agent.id, agentName: agent.name, claimedAt: new Date().toLocaleString() };
  saveClaims(claims);
  return true;
}

function setOutcome(buyerId, outcome) {
  const outcomes = getOutcomes();
  outcomes[buyerId] = outcome;
  saveOutcomes(outcomes);
}

function agentById(id) { return AGENTS.find(a => a.id === id) || null; }
function buyerById(id) { return BUYERS.find(b => b.id === id) || null; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* Top bar on every page: shows who is signed in, or a Sign in link. */
function renderTopbar() {
  const el = document.getElementById("whoami");
  if (!el) return;
  const agent = getAgent();
  el.textContent = agent ? ("Signed in as " + agent.name) : "";
}

/* Ask the browser about installing the app. Works on Android Chrome;
   on iPhone the install steps are shown on install.html instead. */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  const b = document.getElementById("install-btn");
  if (b) b.style.display = "inline-block";
});
async function installApp() {
  if (!deferredPrompt) { location.href = "install.html"; return; }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
