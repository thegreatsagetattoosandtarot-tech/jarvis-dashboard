---
name: surveillance-detection
description: "surveillance-detection. name: surveillance-detection"
---

name: surveillance-detection
description: Flock camera detection ESP32-S3 promiscuous Wi-Fi OUI parts under 10 Ray Hunter stingray detection war driving Biscuit Ultra Meshtastic off-grid mesh detectable not invisible philosophy
license: MIT License
compatibility: esp32
metadata:
  opencode/autoinvoke: false
---
# surveillance-detection

## Use when
You need to detect surveillance technologies (Flock cameras, IMSI catchers/stingrays, tracking devices) using cheap hardware and want to understand the landscape of detectable vs invisible surveillance.

## Do NOT use when
You need military-grade counter-intelligence or are operating in a threat model involving state-level actors with sophisticated capabilities beyond cheap hobbyist tools.

## Flock Camera Detection
- **Tool**: ESP32-S3 development board + piezo buzzer
- **Method**: Promiscuous Wi-Fi mode to passively detect Flock camera Wi-Fi probe requests without touching the devices
- **Identification**: OUI (first 6 characters of MAC address) tells you the company; Bluetooth UUIDs provide additional info
- **Cost**: Under $10 in parts (ESP32-S3, buzzer, basic resistors/wiring)
- **Behavior**: Buzzer beeps when driving by a Flock cam; detects by OUI and Bluetooth UUIDs
- **Source**: kernelpanic.tech; PCBs available cheaper or buy individual components; wiring visible in art
- **Philosophy**: "No one is coming to save us" — surveillance is pervasive but detectable; tools built by hobbyists on shoestring budgets

## Ray Hunter Stingray Detection
- **Tool**: Mobile hotspot flashed with Ray Hunter firmware ($20-40 on eBay/Amazon)
- **Method**: Analyzes control traffic between modem and cell tower; looks for stingray signatures (fake cell tower tricking phone into connecting)
- **Alert System**: Green line = normal; red line = suspicious; then downloads PCAPs for Wireshark analysis
- **Install**: Plug into computer with USB or connect over Wi-Fi; download software and run installer
- **Outcome**: Download PCaps (packet captures); send to EFF at eff.org/rayhunter for analysis
- **Philosophy**: Open-source IMSI-catcher detection; cheap accessible counter-surveillance for everyone

## War Driving & Anti-Surveillance
- **Tool**: Biscuit Ultra (designed by "Hedge")
- **Method**: Records all devices in vicinity; detects Flock cameras, Bluetooth devices, Axon security cameras; anti-surveillance mode alerts if same device detected within certain interval (possible tail); saves to SD card
- **Features**: Scans for APs; Wi-Fi only war drive; Bluetooth and Flock; everything or anti-surveillance mode; sniffs for probe requests to see weak pleasure; clicks on trackers give more info; phone placement reveals networks
- **Purchase**: Google "Biscuit Ultra" or "Biscuit Pro"; two versions available
- **Device**: LilyGo T-Deck with Def Con 34 Meshtastic (LoRa, Laura, 915 MHz in US)

## Meshtastic Off-Grid Mesh
- **Device**: LilyGo T-Deck with Def Con 34 Meshtastic firmware
- **Network**: Operates around 915 MHz in the US; node-to-node messaging; works across hotels and different areas without cell service
- **Channels**: Web flasher to enable Bluetooth; Meshtastic app to pair with device; phone to type and send/receive messages
- **Philosophy**: Off-grid mesh means communication without cell infrastructure

## Core Philosophy
- "No one is coming to save us" — surveillance in our lives is pervasive but detectable
- The more people looking, the more empowered we can all be to protect ourselves in the digital age
- Tools like $20 hotspot flashed with Ray Hunter and $10 ESP32 that beeps when driving past a Flock camera
- A pager-sized gadget that warns you when the same car has been following you for too long
- Ludlow Institute: "teach you how to use tech that works for you, not against you"

---
Generated from DEF CON 34 video recap (transcript at /tmp/opencode/videos/defcon.txt).