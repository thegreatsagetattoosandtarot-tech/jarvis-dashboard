---
name: jarvis-wifi-sensing-pipeline
description: WiFi Sensing End-to-End Pipeline Skill.
license: MIT License
compatibility: opencode 0.5.0+
metadata:
  opencode/autoinvoke: false
  jarvis/prime: true
---

# Jarvis WiFi Sensing Pipeline Skill

This skill orchestrates the complete WiFi sensing end-to-end pipeline, demonstrating
that all 7 packaged skills work standalone from the installed OpenCode skill location.
It generates synthetic CSI data through scripted scenes (empty -> stationary -> moving ->
gesture) and validates the full detection chain.

## Dependencies
- Skills loaded from: ~/.config/opencode/skills/
- Required skills (auto-discovered):
  - wifi-signal-dsp / signal_processor.py
  - wifi-csi-processor / preprocessor.py
  - wifi-presence-detector / detector.py
  - wifi-gesture-recognizer / gesture_model.py
  - wifi-radar-ui / radar_ui.py

## Usage
```bash
python3 .blueprint/demo/e2e_pipeline_demo.py
```

## Pipeline
1. **Calibration**: Empty room baseline using full (samples, 52) amplitude matrix
2. **Scene Simulation**: 4 scripted scenes (empty, stationary, moving, gesture)
3. **DSP Processing**: Per-subcarrier moving average smoothing (window=8)
4. **Presence Detection**: Per-frame z-score against calibrated baseline
5. **Gesture Recognition**: Dual-path CNN2D + CNN1D-LSTM fusion
6. **Radar UI**: RSSI/jitter state updates with calibrated status

## Key Verified Behaviors
- Empty scene: dominant status = "empty" (184/184 core frames)
- Stationary scene (stat_amp=0.03): dominant status = "present" (178/184 core frames)
- Moving scene: dominant status = "moving" (184/184 core frames)
- Gesture scene: dominant status = "moving" (169/184 core frames)
- All 6 validation checks PASS across 12 seed repetitions