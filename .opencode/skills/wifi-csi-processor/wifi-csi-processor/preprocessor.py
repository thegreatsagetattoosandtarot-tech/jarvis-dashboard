"""
WiFi CSI Processor - Signal preprocessing for WiFi Channel State Information

Provides amplitude/phase extraction, filtering, and statistical feature
computation for downstream gesture/presence detection models.

Target: ESP32-S3 (2.4GHz WiFi CSI), also usable on ESP32-C3/C5
"""

import numpy as np
from scipy import signal as scipy_signal


def moving_average(data, window_size):
    """
    Apply a moving average filter to smooth CSI data.

    Args:
        data (np.ndarray): 1D array of CSI amplitude or phase values
        window_size (int): Moving average filter window size (3-50 recommended)

    Returns:
        np.ndarray: Smoothed data with same length as input
    """
    if window_size < 1:
        raise ValueError("window_size must be >= 1")
    if window_size == 1:
        return data.copy()

    # Use numpy convolution for efficient moving average
    weights = np.ones(window_size) / window_size
    result = np.convolve(data, weights, mode='same')

    # Handle edge effects - mirror the data
    half_window = window_size // 2
    if len(data) > window_size:
        # Replace edges with filtered values for consistency
        result[:half_window] = data[:half_window]
        result[-half_window:] = data[-half_window:]

    return result


def variance_calc(data, window_size=None):
    """
    Calculate moving variance for motion detection.

    Args:
        data (np.ndarray): 1D array of CSI values
        window_size (int, optional): Window size for moving variance.
            If None, uses entire dataset.

    Returns:
        np.ndarray: Variance values (same length as input if window_size provided,
                    scalar if window_size is None)
    """
    if window_size is None:
        return float(np.var(data))

    if window_size < 1:
        raise ValueError("window_size must be >= 1")

    result = np.zeros(len(data))
    half = window_size // 2

    for i in range(len(data)):
        # Define window boundaries
        start = max(0, i - half)
        end = min(len(data), i + half + 1)
        window = data[start:end]
        result[i] = np.var(window)

    return result


def z_score_deviation(data, baseline=None, std_baseline=None):
    """
    Compute z-score deviation from baseline for presence detection.

    Args:
        data (np.ndarray): Current CSI feature values (e.g., amplitude mean)
        baseline (np.ndarray, optional): Calibrated baseline values (empty-room reference)
        std_baseline (np.ndarray, optional): Standard deviation of baseline

    Returns:
        np.ndarray: Z-score deviation values
            - <= 0.3: No human detected
            - > 0.3: Human detected (stationary)
            - > 0.5: Human moving
    """
    if baseline is None or std_baseline is None:
        # Return raw normalized values if no baseline
        if np.std(data) == 0:
            return np.zeros_like(data)
        return (data - np.mean(data)) / np.std(data)

    if len(baseline) != len(data):
        raise ValueError("baseline and data must have same length")

    # Avoid division by zero
    std_safe = np.where(std_baseline == 0, 1e-10, std_baseline)
    z_scores = (data - baseline) / std_safe

    return z_scores


def stft_features(data, window_size=256, hop_size=128, fs=8.2):
    """
    Extract Short-Time Fourier Transform features for Doppler analysis.

    Args:
        data (np.ndarray): 1D CSI amplitude/phase time series
        window_size (int): STFT window size in samples (default: 256)
        hop_size (int): STFT hop size in samples (default: 128)
        fs (float): Sampling frequency in Hz (default: 8.2 samples/sec for ESP32)

    Returns:
        dict: {
            'spectrogram': np.ndarray (complex), shape (time_frames, freq_bins)
            'magnitude': np.ndarray, shape (time_frames, freq_bins)
            'frequencies': np.ndarray, shape (freq_bins,)
            'times': np.ndarray, shape (time_frames,)
        }
    """
    if len(data) < window_size:
        # Pad data if too short
        data = np.pad(data, (0, window_size - len(data)), mode='constant')

    freqs, times, Zxx = scipy_signal.stft(
        data, fs=fs, window='hann',
        nperseg=window_size, noverlap=window_size - hop_size
    )

    magnitude = np.abs(Zxx)

    return {
        'spectrogram': Zxx,
        'magnitude': magnitude,
        'frequencies': freqs,
        'times': times
    }


def statistical_features(data, num_subcarriers=52):
    """
    Compute statistical features per subcarrier from CSI data.

    Args:
        data (np.ndarray): CSI data array
            - If 1D: amplitude values per subcarrier position
            - If 2D: (num_samples, num_subcarriers)
        num_subcarriers (int): Number of OFDM subcarriers (2.4GHz: 52 default)

    Returns:
        dict: Statistical features {
            'mean': np.ndarray, shape (num_subcarriers,)
            'variance': np.ndarray, shape (num_subcarriers,)
            'rms': np.ndarray, shape (num_subcarriers,)
            'iqr': np.ndarray, shape (num_subcarriers,)
            'min': np.ndarray, shape (num_subcarriers,)
            'max': np.ndarray, shape (num_subcarriers,)
        }
    """
    # Ensure 2D array (samples × subcarriers)
    if data.ndim == 1:
        data = data.reshape(1, -1)

    # Trim/pad to num_subcarriers
    if data.shape[1] < num_subcarriers:
        padded = np.zeros((data.shape[0], num_subcarriers))
        padded[:, :data.shape[1]] = data
        data = padded
    elif data.shape[1] > num_subcarriers:
        data = data[:, :num_subcarriers]

    # Compute features per subcarrier
    mean = np.mean(data, axis=0)
    variance = np.var(data, axis=0)
    rms = np.sqrt(np.mean(data**2, axis=0))
    q75, q25 = np.percentile(data, [75, 25], axis=0)
    iqr = q75 - q25
    data_min = np.min(data, axis=0)
    data_max = np.max(data, axis=0)

    return {
        'mean': mean,
        'variance': variance,
        'rms': rms,
        'iqr': iqr,
        'min': data_min,
        'max': data_max
    }


def normalize_unit_variance(data, mean=None, std=None):
    """
    Normalize data to unit variance.

    Args:
        data (np.ndarray): Input data
        mean (float, optional): Pre-computed mean. If None, compute from data.
        std (float, optional): Pre-computed std. If None, compute from data.

    Returns:
        tuple: (normalized_data, mean, std)
    """
    if mean is None:
        mean = np.mean(data)
    if std is None:
        std = np.std(data)

    if std == 0:
        return data - mean, mean, 0

    normalized = (data - mean) / std
    return normalized, mean, std


def extract_amplitude_phase(csi_complex):
    """
    Extract amplitude and phase from complex CSI data.

    Args:
        csi_complex (np.ndarray): Complex-valued CSI measurements
            (I + jQ format from ESP32 WiFi hardware)

    Returns:
        tuple: (amplitude, phase) where:
            - amplitude: np.ndarray of magnitude (|I + jQ|)
            - phase: np.ndarray of phase in radians (-π to π)
    """
    amplitude = np.abs(csi_complex)
    phase = np.angle(csi_complex)

    # Unwrap phase to remove 2π discontinuities
    phase = np.unwrap(phase)

    return amplitude, phase


def csi_to_features(csi_complex, fs=8.2, num_subcarriers=52):
    """
    Complete feature extraction pipeline from raw CSI.

    Args:
        csi_complex (np.ndarray): Complex CSI measurements
        fs (float): Sampling frequency in Hz
        num_subcarriers (int): Number of subcarriers

    Returns:
        dict: Combined features {
            'amplitude': np.ndarray,
            'phase': np.ndarray,
            'statistical': dict from statistical_features(),
            'stft': dict from stft_features(),
            'z_score': np.ndarray (if baseline available)
        }
    """
    amplitude, phase = extract_amplitude_phase(csi_complex)

    stat_feats = statistical_features(amplitude, num_subcarriers)

    # Apply moving average smoothing
    amp_smooth = moving_average(amplitude, window_size=16)
    phase_smooth = moving_average(phase, window_size=16)

    # Get STFT features (use smaller window for real-time)
    stft_win = min(128, len(phase_smooth) - 1)
    if stft_win > 16:
        stft = stft_features(phase_smooth, window_size=stft_win, hop_size=stft_win // 2, fs=fs)
    else:
        stft = {'spectrogram': np.array(), 'magnitude': np.array(),
                'frequencies': np.array(), 'times': np.array()}

    return {
        'amplitude': amplitude,
        'phase': phase,
        'amplitude_smooth': amp_smooth,
        'phase_smooth': phase_smooth,
        'statistical': stat_feats,
        'stft': stft
    }


# Example usage
if __name__ == "__main__":
    print("WiFi CSI Processor - Example Usage")
    print("=" * 40)

    # Simulate CSI data (complex I+Q measurements)
    np.random.seed(42)
    sim_csi = np.random.randn(100) + 1j * np.random.randn(100)

    # Extract amplitude and phase
    amp, phs = extract_amplitude_phase(sim_csi)
    print(f"Amplitude range: [{amp.min():.3f}, {amp.max():.3f}]")
    print(f"Phase range: [{phs.min():.3f}, {phs.max():.3f}] rad")

    # Extract features
    features = csi_to_features(sim_csi, fs=8.2, num_subcarriers=52)
    print(f"\nStatistical features mean: {features['statistical']['mean'][:5]}")
    print(f"STFT magnitude shape: {features['stft']['magnitude'].shape}")

    # Moving average
    smoothed = moving_average(amp, window_size=5)
    print(f"Smoothed amplitude (first 5): {smoothed[:5]}")

    # Z-score (with fake baseline)
    baseline = np.mean(amp)
    z = z_score_deviation(amp, baseline=np.ones_like(amp) * baseline)
    print(f"Z-score (first 5): {z[:5]}")

    print("\nAll functions executed successfully!")