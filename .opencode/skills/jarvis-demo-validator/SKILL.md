---
name: jarvis-demo-validator
description: E2E Demo Validator Skill.
Runs and validates the WiFi sensing end-to-end pipeline demo.
license: MIT License
compatibility: opencode 0.5.0+
metadata:
  opencode/autoinvoke: false
  jarvis/prime: true
---

# Jarvis Demo Validator Skill

This skill runs and validates the WiFi sensing end-to-end pipeline demo,
checking all 6 validation criteria across the 4 scripted scenes.

## Usage
```bash
python3 .blueprint/demo/e2e_pipeline_demo.py
```

## Validation Checks
1. Empty scene: person NOT present
2. Stationary scene: person present
3. Moving scene: person present
4. Gesture scene: person present
5. Moving scene: movement detected
6. Radar UI: someone present after movement

## Expected Output
- All 6 checks PASS
- Exit code 0
- Radar calibrated=True

## Key Parameters (verified stable across 12 seeds)
- Empty: noise=0.05
- Stationary: stat_amp=0.03
- Moving: amp=0.5 @ 0.5Hz
- Gesture: 0.8 @ 1.5Hz + 0.3 @ 3Hz
- Radar: sensitivity=100, jitter = std(mean amp)*50
EOF