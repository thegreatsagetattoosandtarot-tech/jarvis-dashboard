#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$ROOT/src/config/config.json"

printf 'JARVIS Linux companion check\n'
printf 'Node: '; node --version
printf 'ffmpeg: '; command -v ffmpeg || printf 'missing\n'
printf 'whisper-cli: '; command -v whisper-cli || printf 'missing\n'
printf 'Claude: '; command -v claude || printf 'missing\n'
printf 'Obsidian: '; command -v obsidian || printf 'not installed\n'

if [[ -f "$CONFIG" ]]; then
  node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); console.log("config: valid JSON")' "$CONFIG"
else
  printf 'config: missing (copy src/config/config.example.json to src/config/config.json)\n'
fi

printf '\nLinux defaults use PATH-resolved ffmpeg and whisper-cli. Set companion.whisperModel to an installed model path.\n'
