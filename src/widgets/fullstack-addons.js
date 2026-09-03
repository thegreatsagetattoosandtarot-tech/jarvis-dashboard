// Fullstack Agent Addons for JARVIS Matrix Dashboard
// Integrates: Memory Vault, Voice (Backtalk), Face (AI-Visualizer), Hands (Barehands)
// All features as addons - no replacement of existing JARVIS rules

const { el, T, isNarrow, config } = ctx;
const addonConfig = config.integrations?.fullstack || {};
if (addonConfig.enabled === false) return el("div", {});

const panel = el("section", {
  width: "100%", maxWidth: "720px", margin: isNarrow ? "4px auto 0" : "12px auto 0",
  padding: isNarrow ? "12px" : "16px", boxSizing: "border-box",
  background: `${T.panelBg}cc`, border: `1px solid ${T.panelBorder}`, borderRadius: "10px",
  position: "relative", zIndex: "2", fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
});

const heading = el("div", { color: T.accent, fontSize: "10px", letterSpacing: "2px", marginBottom: "10px" }, "FULLSTACK AGENT ADDONS");
panel.appendChild(heading);

const grid = el("div", { display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, 1fr)", gap: "10px" });
panel.appendChild(grid);

// Voice System Card
const voiceCard = createFeatureCard("VOICE SYSTEM", [
  { label: "Push-to-Talk", action: () => toggleVoiceMode("ptt") },
  { label: "Hands-Free", action: () => toggleVoiceMode("open") },
  { label: "Built-in (Kokoro)", action: () => setVoiceEngine("kokoro") },
  { label: "ElevenLabs", action: () => setVoiceEngine("elevenlabs") },
  { label: "Auto-Approve ON", action: () => setPermissionMode("bypassPermissions") },
  { label: "Ask Permission", action: () => setPermissionMode("ask") },
]);
grid.appendChild(voiceCard);

// Face/Visualizer Card
const faceCard = createFeatureCard("FACE / VISUALIZER", [
  { label: "Circuit Board", action: () => setFace("board") },
  { label: "Radial", action: () => setFace("radial") },
  { label: "Matrix Rain", action: () => setFace("rain") },
  { label: "Neural Core", action: () => setFace("neural") },
  { label: "Signal Bus Status", action: () => checkSignalBus() },
]);
grid.appendChild(faceCard);

// Hands/Barehands Card
const handsCard = createFeatureCard("HANDS / BAREHANDS", [
  { label: "Start Board", action: () => startBarehands() },
  { label: "Present Card", action: () => presentOnBoard() },
  { label: "Add Image", action: () => addImageToBoard() },
  { label: "Add 3D Model", action: () => addModelToBoard() },
  { label: "Explode Model", action: () => explodeModel() },
  { label: "Clear Board", action: () => clearBoard() },
]);
grid.appendChild(handsCard);

// Memory Vault Card
const memoryCard = createFeatureCard("MEMORY VAULT", [
  { label: "Prime AI", action: () => primeAI() },
  { label: "Create Job", action: () => createJob() },
  { label: "Daily Note", action: () => createDailyNote() },
  { label: "Active Priorities", action: () => showActivePriorities() },
  { label: "Migrate Projects", action: () => migrateProjects() },
]);
grid.appendChild(memoryCard);

// Launcher Card
const launcherCard = createFeatureCard("LAUNCHERS", [
  { label: "Chat with Agent", action: () => launchChat() },
  { label: "Talk to Agent", action: () => launchTalk() },
  { label: "Hands Mode", action: () => launchHands() },
  { label: "Update All", action: () => updateAll() },
]);
grid.appendChild(launcherCard);

// Agent Mechanic Card
const mechanicCard = createFeatureCard("AGENT MECHANIC", [
  { label: "Self-Diagnose", action: () => selfDiagnose() },
  { label: "Repair Voice", action: () => repairVoice() },
  { label: "Repair Face", action: () => repairFace() },
  { label: "Repair Hands", action: () => repairHands() },
  { label: "Repair Memory", action: () => repairMemory() },
]);
grid.appendChild(mechanicCard);

function createFeatureCard(title, buttons) {
  const card = el("div", { padding: "10px", border: `1px solid ${T.panelBorder}`, borderRadius: "7px", minWidth: "0" });
  card.appendChild(el("div", { color: T.textMuted, fontSize: "9px", letterSpacing: "1px", marginBottom: "8px" }, title));
  const btnRow = el("div", { display: "flex", flexWrap: "wrap", gap: "6px" });
  buttons.forEach(({ label, action }) => {
    btnRow.appendChild(createButton(label, action));
  });
  card.appendChild(btnRow);
  return card;
}

function createButton(label, action) {
  const btn = el("button", {
    border: `1px solid ${T.accent}55`, background: `${T.accent}0d`, color: T.accent,
    padding: "7px 10px", borderRadius: "6px", cursor: "pointer", font: "600 10px monospace",
    letterSpacing: "0.5px", minHeight: "32px", flex: "1 1 45%",
  }, label);
  btn.addEventListener("click", action);
  return btn;
}

// Action implementations
function toggleVoiceMode(mode) {
  const cfg = config.integrations?.fullstack || {};
  cfg.micMode = mode;
  saveConfig({ integrations: { fullstack: cfg } });
  new Notice(`Voice mode: ${mode === "ptt" ? "Push-to-Talk" : "Hands-Free"}`);
}

function setVoiceEngine(engine) {
  const cfg = config.integrations?.fullstack || {};
  cfg.voiceEngine = engine;
  saveConfig({ integrations: { fullstack: cfg } });
  new Notice(`Voice engine: ${engine === "kokoro" ? "Built-in (Kokoro)" : "ElevenLabs"}`);
}

function setPermissionMode(mode) {
  const cfg = config.integrations?.fullstack || {};
  cfg.permissionMode = mode;
  saveConfig({ integrations: { fullstack: cfg } });
  new Notice(`Permission mode: ${mode === "ask" ? "Ask" : "Auto-Approve"}`);
}

function setFace(face) {
  const cfg = config.integrations?.fullstack || {};
  cfg.face = face;
  saveConfig({ integrations: { fullstack: cfg } });
  new Notice(`Face: ${face}`);
}

function checkSignalBus() {
  const busDir = config.integrations?.signalBus?.dir;
  if (busDir) {
    new Notice(`Signal bus: ${busDir}`);
  } else {
    new Notice("Signal bus not configured");
  }
}

function startBarehands() {
  if (window.electronAPI) {
    window.electronAPI.startBarehands();
  } else {
    new Notice("Barehands requires native app");
  }
}

function presentOnBoard() {
  if (window.electronAPI) {
    window.electronAPI.presentOnBoard({ title: "JARVIS", body: "Presented from Matrix Dashboard" });
  }
}

function addImageToBoard() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file && window.electronAPI) {
      window.electronAPI.addImageToBoard(file);
    }
  };
  input.click();
}

function addModelToBoard() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".glb,.gltf";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file && window.electronAPI) {
      window.electronAPI.addModelToBoard(file);
    }
  };
  input.click();
}

function explodeModel() {
  if (window.electronAPI) {
    window.electronAPI.explodeModel();
  }
}

function clearBoard() {
  if (window.electronAPI) {
    window.electronAPI.clearBoard();
  }
}

function primeAI() {
  new Notice("AI Priming: Reading vault indexes for context...");
  // Trigger AI priming through the memory vault
  if (window.electronAPI) {
    window.electronAPI.primeAI();
  }
}

function createJob() {
  const name = prompt("Job name:");
  if (!name) return;
  const steps = prompt("Steps (comma separated):");
  if (!steps) return;
  if (window.electronAPI) {
    window.electronAPI.createJob({ name, steps: steps.split(",").map(s => s.trim()) });
  }
}

function createDailyNote() {
  if (window.electronAPI) {
    window.electronAPI.createDailyNote();
  }
}

function showActivePriorities() {
  if (window.electronAPI) {
    window.electronAPI.showActivePriorities();
  }
}

function migrateProjects() {
  if (window.electronAPI) {
    window.electronAPI.migrateProjects();
  }
}

function launchChat() {
  if (window.electronAPI) {
    window.electronAPI.launchChat();
  }
}

function launchTalk() {
  if (window.electronAPI) {
    window.electronAPI.launchTalk();
  }
}

function launchHands() {
  if (window.electronAPI) {
    window.electronAPI.launchHands();
  }
}

function updateAll() {
  if (window.electronAPI) {
    window.electronAPI.updateAll();
  }
}

function selfDiagnose() {
  new Notice("Running self-diagnosis...");
  if (window.electronAPI) {
    window.electronAPI.selfDiagnose().then(result => {
      new Notice(`Diagnosis: ${result}`);
    });
  }
}

function repairVoice() {
  new Notice("Repairing voice system...");
  if (window.electronAPI) {
    window.electronAPI.repairVoice();
  }
}

function repairFace() {
  new Notice("Repairing face/visualizer...");
  if (window.electronAPI) {
    window.electronAPI.repairFace();
  }
}

function repairHands() {
  new Notice("Repairing hands/barehands...");
  if (window.electronAPI) {
    window.electronAPI.repairHands();
  }
}

function repairMemory() {
  new Notice("Repairing memory vault...");
  if (window.electronAPI) {
    window.electronAPI.repairMemory();
  }
}

function saveConfig(patch) {
  // Merge patch into config
  Object.assign(config, patch);
  // In a real implementation, this would persist to config.local.json
  console.log("[Fullstack Addon] Config updated:", patch);
}

return panel;