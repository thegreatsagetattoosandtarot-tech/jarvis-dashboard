// Optional signal bus for compatible visualizers and local companion interfaces.
// Disabled unless integrations.signalBus.enabled is true.
const fs = require("fs");
const path = require("path");

class SignalBus {
  constructor(config = {}) {
    this._dir = config.enabled && config.dir ? path.resolve(config.dir) : null;
    if (this._dir) fs.mkdirSync(this._dir, { recursive: true });
  }

  setState(state) {
    if (!this._dir) return;
    if (!["idle", "listening", "thinking", "speaking"].includes(state)) return;
    try { fs.writeFileSync(path.join(this._dir, ".voice_state"), state + "\n"); } catch {}
  }

  setWaveform(samples) {
    if (!this._dir || !Array.isArray(samples)) return;
    const safeSamples = samples.slice(0, 64).map(value => Math.max(0, Math.min(1, Number(value) || 0)));
    try {
      fs.writeFileSync(path.join(this._dir, ".voice_waveform"), JSON.stringify({ ts: Date.now(), samples: safeSamples }));
    } catch {}
  }
}

module.exports = SignalBus;
