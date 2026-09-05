---
name: jarvis-wifi-cls-tool
description: WiFi Sensing Convenience Launch Script Skill.
Provides the cls (convenience launch script) for the WiFi sensing pipeline.
license: MIT License
compatibility: opencode 0.5.0+
metadata:
  opencode/autoinvoke: false
  jarvis/prime: true
---

# Jarvis WiFi CLS Tool Skill

This skill provides the convenience launch script (cls) for the WiFi sensing
pipeline, wrapping the demo, radar UI, and validation into single commands.

## Commands
- `jarvis-wifi-cls demo` - run the E2E pipeline demo
- `jarvis-wifi-cls radar` - start the Radar UI server
- `jarvis-wifi-cls validate` - run all validation checks
- `jarvis-wifi-cls status` - show pipeline status

## Implementation
The cls is a Python script at tools/jarvis-wifi-cls.py that:
- Configures the skill path (inserts skill dirs into sys.path)
- Runs the demo with proper environment
- Starts the Radar UI server on 0.0.0.0:8088
- Reports validation results

## Usage
```bash
python3 tools/jarvis-wifi-cls.py demo
python3 tools/jarvis-wifi-cls.py radar
python3 tools/jarvis-wifi-cls.py validate
```
EOF