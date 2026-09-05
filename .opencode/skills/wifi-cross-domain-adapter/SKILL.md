---
name: wifi-cross-domain-adapter
description: AdaptsWiFiCSIgesture/presencemodelstonewenvironmentswithminimallabeleddata.Implementsfew-shotlearningandphysics-informeddataaugmentationforcross-domaingeneralization.
license: MIT License
compatibility: ESP32,ESP32-S3,Python3.8+
metadata:
  opencode/autoinvoke: false
---
name: wifi-cross-domain-adapter
description: Adapts WiFi CSI gesture/presence models to new environments with minimal labeled data. Implements few-shot learning and physics-informed data augmentation for cross-domain generalization.
license: MIT License
compatibility: ESP32, ESP32-S3, Python 3.8+
metadata:
  opencode/autoinvoke: false

Use when: deploying trained WiFi sensing model to a new environment/room
Do NOT use when: same environment with identical setup (no adaptation needed)

## Problem Addressed
WiFi CSI models trained in one environment typically degrade significantly when moved to another room or even different positions within the same room. This is due to:
- Different room dimensions and furnishings
- Varying multipath propagation characteristics
- Different noise floors and interference patterns
- Transmitter/receiver position changes

## Adaptation Strategies
### Few-Shot Learning
- Requires only 5-10 labeled samples from new environment
- Uses prototype-based metric learning (similar to ProFi-Net)
- Adapts model weights via gradient descent on support set

### Physics-Informed Data Augmentation (ARC - Antenna Response Consistency)
- Exploits intrinsic spatial diversity of multi-antenna systems
- Treats signals from different antennas as naturally augmented views
- Generates augmented samples by combining antenna responses
- Mitigates learning of superficial shortcuts

### Domain Randomization
- Randomizes subcarrier selection during training
- Adds simulated noise and phase offsets
- Varies transmitter/receiver positions synthetically
- Improves robustness to environment changes

## Adaptation Workflow
1. **Collect calibration data**: 10-20 CSI frames from new environment
2. **Run adaptation**: Apply few-shot adaptation algorithm
3. **Validate**: Test adapted model on held-out new environment data
4. **Deploy**: Use adapted model for real-time sensing

## Configuration Parameters
- `num_calibration_samples` (default: 10): Number of samples for few-shot adaptation
- `adaptation_lr` (default: 0.001): Learning rate for weight adaptation
- `num_adaptation_steps` (default: 50): Number of gradient steps
- `augmentation_strength` (default: 0.1): Strength of physics-informed augmentation
- `use_arc` (default: true): Enable Antenna Response Consistency augmentation
- `use_domain_randomization` (default: true): Enable domain randomization

## Example Usage
```python
from wifi_cross_domain_adapter import CrossDomainAdapter

# Initialize adapter with base model
adapter = CrossDomainAdapter(
    base_model='gesture_recognizer.h5',
    num_classes=3
)

# Collect calibration data from new environment
calibration_data = collect_csi_samples(n=10, environment='new_room')

# Adapt model to new environment
adapted_model = adapter.adapt(calibration_data)

# Test adaptation performance
accuracy = adapter.validate(adapted_model, test_data)
print(f"Adaptation accuracy: {accuracy:.1%}")

# Deploy adapted model
adapter.save(adapted_model, 'gesture_adapted.h5')
