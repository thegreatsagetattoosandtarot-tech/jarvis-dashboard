---
name: wifi-presence-detector
description: DetectshumanpresenceandmovementusingWiFiChannelStateInformation(CSI)amplitude/phasevariations.Calibratesempty-roombaselineandusesz-scoredeviationfordetection.
license: MIT License
compatibility: ESP32,ESP32-S3,ESP32-C3
metadata:
  opencode/autoinvoke: false
---
name: wifi-presence-detector
description: Detects human presence and movement using WiFi Channel State Information (CSI) amplitude/phase variations. Calibrates empty-room baseline and uses z-score deviation for detection.
license: MIT License
compatibility: ESP32, ESP32-S3, ESP32-C3
metadata:
  opencode/autoinvoke: false

Use when: detecting human presence or movement in a room using WiFi CSI signals
Do NOT use when: no WiFi CSI data available (fallback to PIR or other motion sensors)

## Features
- Empty-room baseline calibration (automatic or manual)
- Z-score deviation from calibrated baseline for presence detection
- Motion detection via variance threshold
- Stationary vs moving human classification
- Configurable detection thresholds
- Real-time and batch processing modes
- GPIO output support for external triggering (someone/move status)

## Detection States
| Status | Condition |
|--------|-----------|
| No human detected | Z-score <= 0.3 |
| Human detected - Stationary | Z-score > 0.3 |
| Human detected - Moving | Z-score > 0.5 |

## Configuration Parameters
- `calibration_samples` (default: 100): Number of samples for empty-room calibration
- `motion_threshold` (default: 15): Variance threshold for motion detection (RSSI units)
- `presence_threshold` (default: 5): Z-score threshold for presence detection
- `scan_interval_ms` (default: 100): Sampling rate in milliseconds
- `empty_room_timeout` (default: 60): Seconds after last movement to consider room empty
- `filter_size` (default: 16): Moving average filter size for smoothing

## GPIO Output Pins (optional)
- `someone_pin`: GPIO pin to set high when human detected
- `move_pin`: GPIO pin to set high when movement detected
- `led_pin`: GPIO pin for WS2812 NeoPixel status LED

## Example Usage
```python
from wifi_presence_detector import PresenceDetector

# Initialize detector with calibration
detector = PresenceDetector(calibration_samples=100, motion_threshold=15)

# Calibrate with empty room data
detector.calibrate(empty_room_csi_data)

# Real-time detection loop
while True:
    csi_frame = read_csi_frame()  # from ESP32
    features = detector.process(csi_frame)
    status = detector.detect(features)
    
    if status == "present":
        print("Human present in room")
    elif status == "moving":
        print("Human moving in room")
    elif status == "empty":
        print("Room empty")
    
    # Optional GPIO control
    if detector.someone_detected:
        set_gpio(detector.config.someone_pin, 1)
    else:
        set_gpio(detector.config.someone_pin, 0)
    
    time.sleep(detector.config.scan_interval_ms / 1000)
