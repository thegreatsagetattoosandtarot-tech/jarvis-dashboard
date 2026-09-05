---
name: jarvis-esp32-firmware-skill
description: ESP32 CSI Collector Firmware Skill.
Generates and validates the ESP32 firmware for WiFi CSI collection.
license: MIT License
compatibility: opencode 0.5.0+
metadata:
  opencode/autoinvoke: false
  jarvis/prime: true
---

# Jarvis ESP32 Firmware Skill

This skill generates and validates the ESP32 firmware for WiFi CSI collection,
presence detection, and CSV output compatible with the collector.py pipeline.

## Artifacts
- Firmware: .blueprint/skills/esp32-csi-collector/firmware/wifi_presence_esp32.ino
- Deployment: .blueprint/skills/esp32-csi-collector/DEPLOYMENT.md

## Firmware Features
- CSI collection via ESP32 Arduino core (STA default, AP/passive documented)
- Moving-average + z-score detection (PRESENT_THRESH=0.3, MOVE_THRESH=0.5)
- GPIO: SOMEONE_PIN=2, MOVE_PIN=4, LED_PIN=5
- CSV output matching collector.py: timestamp,subcarrier,amplitude,phase,quality
- Calibration: auto on boot + serial 'c' command
- Serial commands: c (calibrate), l (list), d (debug)
- EMPTY_TIMEOUT_MS=5000, CSI_EMIT_DIVISOR=10

## Validation
No arduino-cli/PlatformIO available in this environment, so firmware is
structurally validated only (plan risk R1). Upload via Arduino IDE or PlatformIO
per DEPLOYMENT.md.
EOF