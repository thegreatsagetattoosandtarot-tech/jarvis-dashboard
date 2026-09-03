// Browser adapter for ChromeOS. The mobile loader keeps all persistence in localStorage.
(function () {
  const files = new Map();
  const adapter = {
    platform: "chromeos",
    setBundledFile(path, content) { files.set(path, content); },
    readFile(path) { return files.get(path) || ""; },
    async readFileAsync(path) {
      if (files.has(path)) return files.get(path);
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load " + path + " (HTTP " + response.status + ")");
      const content = await response.text();
      files.set(path, content);
      return content;
    },
    vaultBasePath() { return ""; },
    showNotice(message, duration) {
      console.info("[JARVIS]", message);
      const notice = document.createElement("div");
      notice.textContent = message;
      Object.assign(notice.style, {
        position: "fixed", bottom: "18px", left: "50%", transform: "translateX(-50%)",
        zIndex: "20", maxWidth: "90vw", padding: "10px 14px", color: "#d7ffe5",
        background: "#07110b", border: "1px solid #00ff66", font: "12px monospace",
      });
      document.body.appendChild(notice);
      setTimeout(() => notice.remove(), duration || 3500);
    },
    openNote() {},
    queryRecentFiles() { return []; },
    countFiles() { return 0; },
    parseYamlFrontmatter() { return null; },
  };
  window.__browserAdapter = adapter;
}());
