---
name: esp32-csi-collector
description: ESP32firmwaretemplateandPythonpipelineforcollectingChannelStateInformation(CSI)datafromWiFihardware.Supportsactive(station/AP)andpassiveCSIcollectionmodes.
license: MIT License
compatibility: ESP32,ESP32-S3,ESP32-C3,ESP32-C5
metadata:
  opencode/autoinvoke: false
---
name: esp32-csi-collector
description: ESP32 firmware template and Python pipeline for collecting Channel State Information (CSI) data from WiFi hardware. Supports active (station/AP) and passive CSI collection modes.
license: MIT License
compatibility: ESP32, ESP32-S3, ESP32-C3, ESP32-C5
metadata:
  opencode/autoinvoke: false

Use when: collecting CSI data from ESP32 WiFi hardware for WiFi sensing applications
Do NOT use when: only RSSI data is needed (use wifi-rssi-collector skill instead)

## Collection Modes
### Active Station Mode (CSI-TX)
- ESP32 connects to an Access Point (router)
- Sends packet requests to trigger CSI feedback
- Typically used as the CSI transmitter
- Configurable: WiFi channel, console UART baud rate

### Active Access Point Mode (CSI-RX)
- ESP32 operates as WiFi Access Point
- Accepts connections from stations (other ESP32s, phones, laptops)
- Captures CSI from connected clients
- Typically used as the CSI receiver

### Passive Mode
- ESP32 passively listens for CSI frames on a given channel
- Default: channel 3 (2.4GHz)
- No connection required - monitors all traffic
- Best for general environment monitoring

## Firmware Features
- ESP-IDF v4.4.8 or v5.4.4+ compatible
- WiFi CSI extraction via `esp_wifi` API
- Automatic SD card CSV logging (if SD card present)
- Serial port CSV output (921600 baud recommended)
- FreeRTOS task-based architecture
- Built-in timestamp synchronization (AP mode auto-syncs)
- Configurable: sample rate, channel, subcarrier selection

## Configuration (menuconfig)
- WiFi Channel (default: 11, 2.4GHz)
- WiFi CSI Enable (Component Config > Wi-Fi > WiFi CSI)
- SHOULD_COLLECT_CSI (Enable CSI data collection)
- SEND_CSI_TO_SERIAL (Send CSI to UART port)
- Tick rate (default: 1000 Hz)
- Console UART baud rate (default: 921600)
- Channel for console output

## Python Pipeline
### Installation
```bash
# Install dependencies
pip install pyserial numpy matplotlib

# Run serial monitor
idf.py monitor -b 921600
```

### Data Format
CSI data output as CSV with columns:
- Timestamp (relative or absolute)
- Subcarrier index (0-51 for 2.4GHz)
- Amplitude (magnitude)
- Phase (in radians)
- Signal quality indicator

### Post-Processing
```python
import csv
import numpy as np

# Load CSI data from serial
with open('csi_data.csv', 'r') as f:
    reader = csv.reader(f)
    csi_data = list(reader)

# Convert to numpy array
data = np.array(csi_data, dtype=float)

# Extract amplitude and phase
amplitude = data[:, 2]  # column index for amplitude
phase = data[:, 3]      # column index for phase
