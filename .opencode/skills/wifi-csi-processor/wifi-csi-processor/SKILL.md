---
name: wifi-csi-processor
description: PreprocessesWiFiChannelStateInformation(CSI)data,extractingamplitude/phasefeatures,applyingfiltering,andcomputingstatisticalfeaturesfordownstreamgesture/presencedetectionmodels.
license: MIT License
compatibility: ESP32,ESP32-S3,ESP32-C3
metadata:
  opencode/autoinvoke: false
---
name: wifi-csi-processor
description: Preprocesses WiFi Channel State Information (CSI) data, extracting amplitude/phase features, applying filtering, and computing statistical features for downstream gesture/presence detection models.
license: MIT License
compatibility: ESP32, ESP32-S3, ESP32-C3
metadata:
  opencode/autoinvoke: false

Use when: preprocessing WiFi CSI data for gesture recognition, presence detection, or radar applications
Do NOT use when: only RSSI data is available (use wifi-rssi-processor skill instead)

## Features
- CSI amplitude and phase extraction from raw ESP32 CSI frames
- Moving average filter for signal smoothing
- Variance calculation for motion detection
- Z-score deviation from calibrated baseline
- Short-Time Fourier Transform (STFT) for Doppler frequency extraction
- Statistical feature computation (mean, std, min, max per subcarrier)
- Outlier detection and removal
- Normalization to unit variance

## Input/Output
### Input
- Raw CSI data as complex-valued subcarrier measurements (amplitude + j*phase)
- Optional: calibration baseline data (empty-room reference)
- Optional: configuration parameters (filter size, window size, etc.)

### Output
- Processed feature vector containing:
  - Amplitude mean and std per subcarrier (or averaged)
  - Phase mean and std per subcarrier (or averaged)
  - Temporal differences (delta features)
  - Statistical summaries (variance, energy, entropy)
  - STFT spectrogram features (if requested)
- Calibration state (updated baseline if provided)

## Configuration Parameters
- `filter_size` (default: 5): Moving average filter window size
- `variance_threshold` (default: 0.01): Threshold for motion detection
- `z_score_threshold` (default: 0.3): Threshold for presence detection
- `stft_window` (default: 256): STFT window size in samples
- `stft_hop` (default: 128): STFT hop size in samples
- `num_subcarriers` (default: 52): Number of OFDM subcarriers (2.4GHz)

## Example Usage
```python
from wifi_csi_processor import CSIProcessor

# Initialize processor
processor = CSIProcessor(filter_size=5, variance_threshold=0.01)

# Process a CSI frame
features = processor.process(csi_frame)

# Check for motion
if processor.detect_motion(features):
    print("Motion detected!")
