// ChromeOS bootstrap: preload shared mobile modules so the dashboard works from a static host.
window.__chromeosBootstrap = async function () {
  const adapter = window.__browserAdapter;
  const moduleFiles = [
    "src/config/config.example.json", "src/config/config.json", "src/config/config.local.json",
    "src/core/theme.js", "src/core/styles.js", "src/core/helpers.js", "src/core/markdown-renderer.js",
    "src/services/network-client.js", "src/services/session-manager-core.js", "src/services/session-manager-mobile.js",
    "src/widgets/voice-command/mobile.js", "src/widgets/voice-command/core/utilities.js",
    "src/widgets/voice-command/core/state-machine.js", "src/widgets/voice-command/core/arc-reactor.js",
    "src/widgets/voice-command/core/text-input.js", "src/widgets/voice-command/core/connection-bar.js",
    "src/widgets/voice-command/core/terminal-panel.js", "src/widgets/voice-command/core/interaction-cards.js",
    "src/widgets/voice-command/core/reconnect-manager.js", "src/widgets/voice-command/adapters/storage-adapter.js",
    "src/widgets/voice-command/adapters/recorder-adapter.js", "src/widgets/voice-command/adapters/tts-adapter.js",
    "src/widgets/voice-command/core/session-tabs.js", "src/widgets/voice-command/core/project-selector.js",
    "src/widgets/mobile-addons.js",
    "src/widgets/fullstack-addons.js",
  ];
  await Promise.all(moduleFiles.map(async (path) => {
    try { await adapter.readFileAsync("../" + path); }
    catch (error) {
      if (!path.endsWith("config.json") && !path.endsWith("config.local.json")) throw error;
    }
  }));

  window.app = { vault: { adapter: { basePath: "", read: async (path) => adapter.readFile(path) || "", write: async () => {} } } };
  window.dv = { current: () => ({ file: { path: "chromeos/index.html" } }), page: () => null, pages: () => ({ length: 0, sort: () => ({ slice: () => [] }) }) };
  window.Notice = class Notice { constructor(message) { adapter.showNotice(message); } };

  document.getElementById("loading").classList.add("hidden");
  return window.loadDashboard(adapter, { mode: "mobile", container: document.getElementById("dashboard"), srcBase: "../src/" });
};
