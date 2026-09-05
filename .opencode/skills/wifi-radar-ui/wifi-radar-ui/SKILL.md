---
name: wifi-radar-ui
description: Web-based radar visualization interface for WiFi CSI data. Provides live RSSI/jitter charts using HTML5 canvas, calibration controls, and status tiles for presence/movement detection. Runs on ESP32 LittleFS or standalone Python server.
license: MIT License
compatibility: ESP32, ESP32-S3, Python3.8+
metadata:
  opencode/autoinvoke: false
---

name: wifi-radar-ui
description: Web-based radar visualization interface for WiFi CSI data. Provides live RSSI/jitter charts using HTML5 canvas, calibration controls, and status tiles for presence/movement detection. Runs on ESP32 LittleFS or standalone Python server.
license: MIT License
compatibility: ESP32, ESP32-S3, Python 3.8+
metadata:
  opencode/autoinvoke: false

Use when: visualizing WiFi CSI data in real-time radar format
Do NOT use: when only raw data output needed (use wifi-csi-processor skill instead)

## Features
- Live RSSI and Jitter graphs with rolling charts using HTML5 canvas
- Status tiles: someone presence, movement detection, RSSI value, calibration state
- Full settings control: WiFi connection, radar parameters, pin configuration, LED toggle
- Responsive design: works on desktop, tablet, and mobile
- Auto-calibration: learns empty-room threshold automatically (~60s)
- Two modes: STA (connect to router) and SoftAP (configuration hotspot)

## User Interface Components
### Dashboard Tiles
- **Someone**: Presence status (green/red indicator)
- **Movement**: Motion detection status (yellow/green)
- **RSSI**: Current received signal strength (dBm)
- **Calibration**: Status and remaining calibration time

### Settings Controls
- **WiFi Connection**: SSID/password input, connect/disconnect
- **Radar Parameters**: Someone timeout, move threshold, filter window/count
- **Pin Configuration**: GPIO pins for WS2812 LED, someone output, movement output
- **LED Toggle**: On/off control for status LED

### Visualization Modes
- **Radar Mode**: Classic rotating radar sweep with motion blips
- **Waterfall Mode**: Frequency-over-time waterfall display
- **Proximity Mode**: Distance-based proximity visualization
- **Vitals Mode**: Breathing rate and heart rate estimation (experimental)

## Configuration Persistence
- Settings stored in LittleFS (ESP32) or JSON file (Python server)
- Auto-save on parameter changes
- Restore on startup from last saved configuration

## Deployment Options
### ESP32 LittleFS (Standalone)
```bash
# Upload web interface files to ESP32 LittleFS
arduino-esp32littlefs-tool upload data/ folder

# Access via WiFi IP address
# Browser: http://<ESP32_IP>
```

### Python Standalone Server
```bash
# Run Python server with radar UI
python -m wifi_radar_ui.server

# Access via: http://<server-ip>:8088
```

## Example Usage (ESP32)
```cpp
#include <wifi_radar_ui.h>

// Initialize radar UI
WiFiRadarUI radar;

void setup() {
  radar.init(
    ssid="my-wifi",
    password="my-password",
    someone_pin=4,
    move_pin=5,
    led_pin=6
  );
}

void loop() {
  radar.handle();
  
  // Check status
  if (radar.is_someone_present()) {
    // Someone detected
  }
  
  if (radar.is_movement_detected()) {
    // Movement detected
  }
  
  delay(10);
```
