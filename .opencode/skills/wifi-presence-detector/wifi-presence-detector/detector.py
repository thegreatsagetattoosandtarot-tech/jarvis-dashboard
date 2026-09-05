"""
WiFi Presence Detector - Human presence and movement detection using CSI

Detects human presence and movement in a room using WiFi Channel State Information
(CSI) amplitude/phase variations. Calibrates empty-room baseline and uses z-score
deviation for detection.

Target: ESP32-S3 with WiFi CSI capability (2.4GHz)
"""

import numpy as np
import time
from preprocessor import (
    moving_average, z_score_deviation, statistical_features,
    csi_to_features, extract_amplitude_phase
)


class PresenceDetector:
    """
    Human presence and movement detector using WiFi CSI.

    Uses z-score deviation from calibrated baseline to detect:
    - No human (Z-score <= 0.3)
    - Human stationary (Z-score > 0.3)
    - Human moving (Z-score > 0.5)
    """

    # Detection state thresholds
    NO_HUMAN_THRESH = 0.3
    STATIONARY_THRESH = 0.3
    MOVING_THRESH = 0.5

    # Default configuration
    DEFAULT_CALIBRATION_SAMPLES = 100
    DEFAULT_MOTION_THRESHOLD = 15    # RSSI units
    DEFAULT_PRESENCE_THRESH = 5      # Z-score threshold
    DEFAULT_SCAN_INTERVAL_MS = 100   # 10 Hz update rate
    DEFAULT_EMPTY_ROOM_TIMEOUT = 60  # seconds

    def __init__(self,
                 calibration_samples=DEFAULT_CALIBRATION_SAMPLES,
                 motion_threshold=DEFAULT_MOTION_THRESHOLD,
                 presence_threshold=DEFAULT_PRESENCE_THRESH,
                 scan_interval_ms=DEFAULT_SCAN_INTERVAL_MS,
                 empty_room_timeout=DEFAULT_EMPTY_ROOM_TIMEOUT,
                 someone_pin=None,
                 move_pin=None,
                 led_pin=None):
        """
        Initialize the presence detector.

        Args:
            calibration_samples: Number of samples for empty-room calibration
            motion_threshold: Variance threshold for motion detection (RSSI units)
            presence_threshold: Z-score threshold for presence detection
            scan_interval_ms: Sampling rate in milliseconds
            empty_room_timeout: Seconds after last movement to consider room empty
            someone_pin: GPIO pin for someone status output (optional)
            move_pin: GPIO pin for movement status output (optional)
            led_pin: GPIO pin for WS2812 LED status (optional)
        """
        self.calibration_samples = calibration_samples
        self.motion_threshold = motion_threshold
        self.presence_threshold = presence_threshold
        self.scan_interval_ms = scan_interval_ms
        self.empty_room_timeout = empty_room_timeout

        # GPIO pin configuration (optional)
        self.someone_pin = someone_pin
        self.move_pin = move_pin
        self.led_pin = led_pin

        # Internal state
        self.calibration_data = None      # Empty-room baseline CSI
        self.calibration_baseline = None  # Z-score baseline mean
        self.calibration_std = None       # Baseline standard deviation
        self.last_movement_time = None    # Timestamp of last movement
        self.room_empty = True            # Current room state
        self.detection_history = []       # Recent detection states

        # GPIO state (simulated if no pins configured)
        self.someone_gpio_state = 0
        self.move_gpio_state = 0

    def calibrate(self, csi_data):
        """
        Calibrate the detector with empty-room CSI data.

        Args:
            csi_data (np.ndarray or list): CSI amplitude/phase data
                for empty room. Should be shape (num_samples, 52) for
                52 subcarriers, or 1D array of amplitude values.
        """
        # Convert to numpy array if list
        if isinstance(csi_data, list):
            csi_data = np.array(csi_data)

        # Ensure 2D: (samples, subcarriers)
        if csi_data.ndim == 1:
            csi_data = csi_data.reshape(-1, 1)

        # If more than calibration_samples, randomly sample
        if len(csi_data) > self.calibration_samples:
            indices = np.random.choice(len(csi_data), self.calibration_samples, replace=False)
            cal_data = csi_data[indices]
        else:
            cal_data = csi_data

        # If only 1 subcarrier, expand to multiple if needed
        if cal_data.shape[1] < 3:
            # Use amplitude features from the data
            amplitudes = np.abs(cal_data[:, 0]) if cal_data.shape[1] > 0 else np.array([])
            if len(amplitudes) > 0:
                # Compute statistical features across what we have
                stats = statistical_features(amplitudes.flatten(), num_subcarriers=max(1, cal_data.shape[1]))
                self.calibration_baseline = stats['mean']
                self.calibration_std = np.maximum(stats['variance'], 1e-10) ** 0.5
            else:
                self.calibration_baseline = np.zeros(1)
                self.calibration_std = np.ones(1)
        else:
            # Compute per-subcarrier baseline statistics
            self.calibration_baseline = np.mean(cal_data, axis=0)
            self.calibration_std = np.std(cal_data, axis=0)
            # Avoid zero std
            self.calibration_std = np.maximum(self.calibration_std, 1e-10)

        # Record last calibration time
        self.last_movement_time = time.time()

        print(f"Calibration complete: {len(cal_data)} samples")
        print(f"  Baseline shape: {self.calibration_baseline.shape}")
        print(f"  Std shape: {self.calibration_std.shape}")

    def process(self, csi_frame):
        """
        Process a single CSI frame and update detection state.

        Args:
            csi_frame (np.ndarray): Current CSI frame data
                - Shape: (52,) for per-subcarrier amplitude, or flattened features

        Returns:
            dict: Detection results {
                'status': 'empty' | 'present' | 'moving',
                'z_score': float or np.ndarray,
                'motion_variance': float,
                'someone_detected': bool,
                'movement_detected': bool
            }
        """
        # Ensure 1D array of features
        if csi_frame.ndim == 2:
            if csi_frame.shape[1] >= 3:
                # Use first feature channel (e.g., amplitude mean)
                features = csi_frame[:, 0]
            else:
                features = csi_frame.flatten()
        else:
            features = csi_frame if csi_frame.ndim == 1 else np.array(csi_frame).flatten()

        # Apply moving average smoothing
        smoothed = moving_average(features, window_size=16)

        # Compute z-score deviation from calibrated baseline
        if self.calibration_baseline is not None:
            # Handle different shapes
            baseline = self.calibration_baseline
            std = self.calibration_std

            # Ensure same length
            if len(baseline) > len(smoothed):
                # Truncate baseline
                baseline = baseline[:len(smoothed)]
            elif len(baseline) < len(smoothed):
                # Extend baseline (repeat last value)
                reps = smoothed.shape[0] // len(baseline) + 1
                baseline = np.tile(baseline, reps)[:len(smoothed)]

            # Compute z-score
            z_scores = z_score_deviation(smoothed, baseline=baseline, std_baseline=std)

            # Use average z-score for status determination
            if isinstance(z_scores, np.ndarray):
                avg_z = np.mean(np.abs(z_scores))
            else:
                avg_z = float(np.abs(z_scores))
        else:
            # No baseline calibrated - use relative threshold
            avg_z = float(np.std(smoothed)) if len(smoothed) > 1 else 0.0
            baseline = None

        # Compute motion variance (simple variance of recent readings)
        motion_variance = float(np.var(smoothed)) if len(smoothed) > 1 else 0.0

        # Determine detection status
        if baseline is None:
            # No calibration - use motion variance only
            if motion_variance > self.motion_threshold:
                status = "moving"
                someone_detected = True
                movement_detected = True
            else:
                status = "empty"
                someone_detected = False
                movement_detected = False
        else:
            # Use z-score for determination
            if avg_z > self.MOVING_THRESH:
                status = "moving"
                someone_detected = True
                movement_detected = True
            elif avg_z > self.STATIONARY_THRESH:
                status = "present"
                someone_detected = True
                movement_detected = False
            else:
                status = "empty"
                someone_detected = False
                movement_detected = False

        # Update room state and timeout
        current_time = time.time()

        if status == "empty":
            # Check if we should timeout the room
            if self.last_movement_time is not None:
                time_since_movement = current_time - self.last_movement_time
                if time_since_movement > self.empty_room_timeout:
                    self.room_empty = True
                    self.last_movement_time = None
        elif status in ("present", "moving"):
            self.last_movement_time = current_time
            self.room_empty = False

        # Update detection history (keep last 10)
        self.detection_history.append(status)
        if len(self.detection_history) > 10:
            self.detection_history.pop(0)

        # Update GPIO states if pins configured
        if self.someone_pin is not None:
            self.someone_gpio_state = 1 if someone_detected else 0
        if self.move_pin is not None:
            self.move_gpio_state = 1 if movement_detected else 0

        return {
            'status': status,
            'z_score': avg_z,
            'motion_variance': motion_variance,
            'someone_detected': someone_detected,
            'movement_detected': movement_detected,
            'room_empty': self.room_empty,
            'gpio_someone': self.someone_gpio_state,
            'gpio_move': self.move_gpio_state
        }

    def detect(self, csi_frame):
        """
        Convenience method - returns just the status string.

        Args:
            csi_frame (np.ndarray): CSI frame data

        Returns:
            str: One of 'empty', 'present', 'moving'
        """
        result = self.process(csi_frame)
        return result['status']

    def is_empty(self):
        """Return True if room is considered empty."""
        return self.room_empty

    def is_present(self):
        """Return True if human is detected (stationary or moving)."""
        return not self.room_empty

    def is_moving(self):
        """Return True if human movement is detected."""
        # Check recent detection history for moving state
        if len(self.detection_history) > 0:
            return self.detection_history[-1] == "moving"
        return False

    def get_recent_history(self):
        """Return recent detection states."""
        return self.detection_history.copy()

    # GPIO control methods (for actual hardware)
    def set_someone_pin(self, state):
        """Set the someone GPIO pin state."""
        if self.someone_pin is not None:
            self.someone_gpio_state = state

    def set_move_pin(self, state):
        """Set the movement GPIO pin state."""
        if self.move_pin is not None:
            self.move_gpio_state = state

    def read_someone_pin(self):
        """Read the someone GPIO pin state."""
        return self.someone_gpio_state

    def read_move_pin(self):
        """Read the movement GPIO pin state."""
        return self.move_gpio_state


# Example usage
if __name__ == "__main__":
    print("WiFi Presence Detector - Example Usage")
    print("=" * 50)

    # Initialize detector
    detector = PresenceDetector(
        calibration_samples=50,
        motion_threshold=15,
        presence_threshold=3,
        scan_interval_ms=100
    )

    # Simulate calibration with empty room data
    print("\n1. Calibrating with empty room data...")
    np.random.seed(42)
    empty_data = np.random.randn(50, 52) * 0.1  # Small values for empty room
    detector.calibrate(empty_data)

    # Simulate detection scenarios
    print("\n2. Testing detection scenarios...")

    # Scenario A: Empty room
    print("\n   A. Empty room detection:")
    empty_frame = np.random.randn(52) * 0.1
    status = detector.detect(empty_frame)
    result = detector.process(empty_frame)
    print(f"      Status: {status}")
    print(f"      Someone detected: {result['someone_detected']}")
    print(f"      Movement detected: {result['movement_detected']}")
    print(f"      Room empty: {detector.is_empty()}")

    # Scenario B: Human present (stationary)
    print("\n   B. Human present (stationary):")
    np.random.seed(99)
    human_stationary = np.random.randn(52) * 0.5  # Larger amplitude variations
    status = detector.detect(human_stationary)
    result = detector.process(human_stationary)
    print(f"      Status: {status}")
    print(f"      Someone detected: {result['someone_detected']}")
    print(f"      Movement detected: {result['movement_detected']}")
    print(f"      Room empty: {detector.is_empty()}")
    print(f"      Is present: {detector.is_present()}")
    print(f"      Is moving: {detector.is_moving()}")

    # Scenario C: Human moving
    print("\n   C. Human moving:")
    np.random.seed(111)
    human_moving = np.random.randn(52) * 0.8  # Even larger variations
    status = detector.detect(human_moving)
    result = detector.process(human_moving)
    print(f"      Status: {status}")
    print(f"      Someone detected: {result['someone_detected']}")
    print(f"      Movement detected: {result['movement_detected']}")
    print(f"      Room empty: {detector.is_empty()}")
    print(f"      Is present: {detector.is_present()}")
    print(f"      Is moving: {detector.is_moving()}")

    # Scenario D: Return to empty
    print("\n   D. Return to empty room:")
    status = detector.detect(empty_frame)
    result = detector.process(empty_frame)
    print(f"      Status: {status}")
    print(f"      Room empty after timeout: {detector.is_empty()}")

    print("\n✓ All example scenarios completed!")