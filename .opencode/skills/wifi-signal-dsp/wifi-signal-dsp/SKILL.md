---
name: wifi-signal-dsp
description: SignalprocessingprimitivesforWiFiCSIdata.Providesfiltering,transformation,andfeatureextractionfunctionsoptimizedforESP32constrainedresources.
license: MIT License
compatibility: ESP32,ESP32-S3,ESP32-C3
metadata:
  opencode/autoinvoke: false
---
name: wifi-signal-dsp
description: Signal processing primitives for WiFi CSI data. Provides filtering, transformation, and feature extraction functions optimized for ESP32 constrained resources.
license: MIT License
compatibility: ESP32, ESP32-S3, ESP32-C3
metadata:
  opencode/autoinvoke: false

Use when: processing WiFi CSI signals with DSP techniques
Do NOT use when: raw CSI data visualization only (use wifi-csi-processor skill instead)

## Filtering Primitives
### Moving Average Filter
- Simple FIR filter for signal smoothing
- Configurable window size (3-50 samples)
- Memory complexity: O(N) where N = window size
- Time complexity: O(1) per sample (using circular buffer)

### Butterworth Low-Pass Filter
- Butterworth filter frequency response for extracting low-frequency components
- Removes high-frequency noise from CSI phase/amplitude
- Order: 4 (default) - Butterworth type for maximally flat response
- Applies to: CSI amplitude or phase time series

### Variance Filter
- Sliding window variance calculation
- Used for motion detection thresholding
- Configurable window size
- Output: variance per window position

## Transformation Primitives
### Short-Time Fourier Transform (STFT)
- Extracts Doppler frequency shift information
- Configurable window size (64-1024 samples)
- Configurable hop size (32-512 samples)
- Output: complex-valued spectrogram
- Magnitude spectrum for feature extraction

### Conjugate Multiplication
- Eliminates random phase offsets between unsynchronized WiFi transceivers
- Essential for monostatic sensing (single device)
- Output: phase-stabilized CSI data

### Doppler Spectrum Extraction
- Converts CSI to Doppler frequency domain
- Filters out static multipath components
- Highlights moving target velocity information
- Resolution: depends on CSI sampling rate

## Feature Extraction
### Statistical Features per Subcarrier
- Mean amplitude/phase
- Variance (motion sensitivity)
- Root Mean Square (RMS)
- Interquartile Range (IQR)
- Energy Entropy (EE)
- Power Spectral Entropy (PSE)

### Subcarrier Averaging
- Averages features across adjacent subcarriers
- Reduces dimensionality (52 → fewer features)
- Preserves essential signal characteristics

### Phase Unwrapping
- Removes 2π phase discontinuities
- Essential for accurate phase-based features
- Uses cumulative sum of phase differences

## ESP32 Optimization
- Fixed-point arithmetic where possible
- Fixed buffer sizes (no dynamic allocation in ISR)
- Interrupt-safe implementations
- Memory: < 64KB RAM for typical processing
- CPU: < 5ms per CSI frame processing (at 8.2 samples/sec)

## Example Usage (Python)
```python
from wifi_signal_dsp import (
    moving_average, butterworth_lowpass, 
    stft, conjugate_multiplication, statistical_features
)

# Load CSI data
csi_data = load_csi_from_file('csi.csv')

# Apply moving average filter
smoothed = moving_average(csi_data, window_size=16)

# Apply Butterworth low-pass filter
filtered = butterworth_lowpass(smoothed, cutoff_hz=5.0, order=4)

# Extract STFT features
spectrogram, frequencies, times = stft(filtered, window_size=256, hop_size=128)

# Compute statistical features
features = statistical_features(filtered, subcarriers=52)

print(f"Features: mean={features['mean']:.3f}, var={features['var']:.3f}")
print(f"STFT shape: {spectrogram.shape}")
```

## Example Usage (ESP32 Arduino)
```cpp
#include <wifi_signal_dsp.h>

// Initialize filters
MovingAverageFilter avg_filter(16);
ButterworthFilter butterworth(4, 5.0);  // 4th order, 5Hz cutoff

void loop() {
  // Read CSI frame
  csi_frame_t frame = read_csi();
  
  // Apply filtering
  frame.amplitude = avg_filter.process(frame.amplitude);
  frame.phase = butterworth.process(frame.phase);
  
  // Process for sensing
  process_for_sensing(frame);
  
  delay(120);  // ~8.2 Hz sampling
}
```
