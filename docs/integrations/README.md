# Optional Add-ons

These integrations extend JARVIS. They do not replace the existing Claude personality, permissions, tools, or project rules.

## Sources Reviewed

- [AI Memory Vault](https://github.com/jaredrhod/ai-memory-vault): structured Obsidian indexes, on-demand memory, AI priming, daily notes, and repeatable Jobs.
- [backtalk](https://github.com/jaredrhod/backtalk): local hold-to-talk voice loop, resumable sessions, spoken usage/session controls, and local voice fallback.
- [ai-visualizer](https://github.com/jaredrhod/ai-visualizer): browser faces driven by a small voice signal bus.
- [barehands](https://github.com/jaredrhod/barehands): optional webcam hand tracking and a localhost board protocol for cards, notes, media, and models.

## Integrated Now

The companion server includes an opt-in signal bus in `companion/modules/signal-bus.js`. It publishes:

- `.voice_state`: `idle`, `listening`, `thinking`, or `speaking`
- `.voice_waveform`: timestamped, bounded waveform samples when a producer supplies them

Enable it in `src/config/config.local.json` without changing the existing voice configuration:

```json
{
  "integrations": {
    "signalBus": {
      "enabled": true,
      "dir": "/absolute/path/to/ai-visualizer"
    }
  }
}
```

Point `ai-visualizer.json` `bus_dir` at the same directory. The bus is disabled by default and is local-only.

The registry also exposes these optional capability names for existing agents:

- `memory-priming` and `vault-indexing`: use an Obsidian index and task-specific reference notes before work.
- `visualizer-state`: publish real voice state to a compatible visualizer.
- `board-present`: present cards or media through a separately installed barehands board.

These names are capability metadata and do not replace the existing agents or silently install external repositories.

## Available as Separate Add-ons

The memory-vault and barehands projects have their own file layouts, servers, and licenses. They are intentionally not copied into this repository. Their useful contracts can be connected through Obsidian folders, the signal bus, or a localhost board client without importing their Claude rules.

The current dashboard already provides persistent mobile sessions, interactive permissions, project selection, streaming, and browser TTS. Add-on work should build on those APIs rather than replace them.