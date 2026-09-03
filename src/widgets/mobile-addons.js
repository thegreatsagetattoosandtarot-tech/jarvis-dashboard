// Mobile add-ons: local focus timer, capture queue, and optional visual integrations.
// Shared by iOS and ChromeOS; it never replaces the voice command widget.
const { el, T, isNarrow } = ctx;
const config = ctx.config || {};
const addonConfig = config.integrations?.mobileAddons || {};
if (addonConfig.enabled === false) return el("div", {});

const storageKey = "JARVIS-mobile-addons";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch {}

const panel = el("section", {
  width: "100%", maxWidth: "720px", margin: isNarrow ? "4px auto 0" : "12px auto 0",
  padding: isNarrow ? "12px" : "16px", boxSizing: "border-box",
  background: `${T.panelBg}cc`, border: `1px solid ${T.panelBorder}`, borderRadius: "10px",
  position: "relative", zIndex: "2", fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
});

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
}
function button(label, onClick) {
  const item = el("button", {
    border: `1px solid ${T.accent}55`, background: `${T.accent}0d`, color: T.accent,
    padding: "7px 10px", borderRadius: "6px", cursor: "pointer", font: "600 10px monospace",
    letterSpacing: "0.5px", minHeight: "32px",
  }, label);
  item.addEventListener("click", onClick);
  return item;
}

const heading = el("div", { color: T.accent, fontSize: "10px", letterSpacing: "2px", marginBottom: "10px" }, "MOBILE SYSTEMS");
panel.appendChild(heading);
const grid = el("div", { display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, 1fr)", gap: "10px" });
panel.appendChild(grid);

// Focus timer: survives refreshes and platform handoffs through localStorage.
const timerCard = el("div", { padding: "10px", border: `1px solid ${T.panelBorder}`, borderRadius: "7px", minWidth: "0" });
const timerLabel = el("div", { color: T.textMuted, fontSize: "9px", letterSpacing: "1px" }, "FOCUS TIMER");
const timerReadout = el("div", { color: T.text, fontSize: "24px", margin: "8px 0", letterSpacing: "2px" }, "25:00");
const timerControls = el("div", { display: "flex", gap: "6px", flexWrap: "wrap" });
timerCard.append(timerLabel, timerReadout, timerControls);
grid.appendChild(timerCard);
let remaining = Number(saved.timerRemaining) || 25 * 60;
let timerRunning = false;
let timerId = null;
function renderTimer() {
  timerReadout.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; timerRunning = false; }
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerId = setInterval(() => {
    remaining = Math.max(0, remaining - 1); saved.timerRemaining = remaining; persist(); renderTimer();
    if (!remaining) { stopTimer(); new Notice("Focus session complete"); }
  }, 1000);
}
timerControls.append(button("START", startTimer), button("PAUSE", stopTimer), button("RESET", () => { stopTimer(); remaining = 25 * 60; saved.timerRemaining = remaining; persist(); renderTimer(); }));
renderTimer();
ctx.cleanups.push(stopTimer);

// Capture queue: local-first so iOS and ChromeOS work without filesystem assumptions.
const captureCard = el("div", { padding: "10px", border: `1px solid ${T.panelBorder}`, borderRadius: "7px", minWidth: "0" });
captureCard.appendChild(el("div", { color: T.textMuted, fontSize: "9px", letterSpacing: "1px", marginBottom: "8px" }, "QUICK CAPTURE"));
const captureInput = el("textarea", {
  width: "100%", minHeight: "54px", resize: "vertical", boxSizing: "border-box",
  padding: "8px", background: T.bg, color: T.text, border: `1px solid ${T.panelBorder}`,
  borderRadius: "5px", font: "12px monospace", outline: "none",
});
captureInput.placeholder = "Capture an idea or note...";
const captureActions = el("div", { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", marginTop: "7px" });
const captureStatus = el("span", { color: T.textMuted, fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, `${(saved.captures || []).length} saved`);
captureActions.append(captureStatus, button("SAVE", () => {
  const text = captureInput.value.trim();
  if (!text) return;
  saved.captures = [...(saved.captures || []), { text, createdAt: Date.now() }].slice(-50);
  captureInput.value = ""; captureStatus.textContent = `${saved.captures.length} saved`; persist();
}));
captureCard.append(captureInput, captureActions);
grid.appendChild(captureCard);

const links = addonConfig.links || {
  visualizer: "https://github.com/jaredrhod/ai-visualizer",
  board: "https://github.com/jaredrhod/barehands",
  memory: "https://github.com/jaredrhod/ai-memory-vault",
};
const linkRow = el("div", { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" });
Object.entries({ "VISUALIZER": links.visualizer, "BOARD": links.board, "MEMORY": links.memory }).forEach(([label, href]) => {
  if (!href) return;
  linkRow.appendChild(button(label, () => window.open(href, "_blank", "noopener,noreferrer")));
});
panel.appendChild(linkRow);

return panel;
