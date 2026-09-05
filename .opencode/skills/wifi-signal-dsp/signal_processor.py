"""
WiFi Signal DSP - Signal processing primitives for WiFi CSI data

Provides filtering, transformation, and feature extraction functions
optimized for ESP32 constrained resources. Implements moving average,
Butterworth low-pass, variance, STFT, conjugate multiplication, Doppler
spectrum extraction, and statistical features per subcarrier.

Target: ESP32-S3 (2.4GHz WiFi CSI), also usable on ESP32-C3/C5
"""

import numpy as np
from scipy import signal as scipy_signal


class SignalProcessor:
    """
    Signal processing primitives for WiFi CSI data.

    All methods operate on 1D or 2D numpy arrays of CSI amplitude/phase
    values. Methods are designed to be memory-efficient for constrained
    ESP32-class devices while remaining fully functional on host Python.
    """

    def __init__(self, sample_rate=1000.0):
        """
        Initialize the signal processor.

        Args:
            sample_rate: CSI sampling rate in Hz (default 1000)
        """
        self.sample_rate = sample_rate

    # ============================================================
    # Filtering Primitives
    # ============================================================

    def moving_average(self, data, window_size=16):
        """
        Apply a moving average filter to smooth CSI data.

        Args:
            data (np.ndarray): 1D array of CSI amplitude or phase values
            window_size (int): Moving average filter window size (3-50)

        Returns:
            np.ndarray: Smoothed data with same length as input
        """
        if window_size < 1:
            raise ValueError("window_size must be >= 1")
        if window_size == 1:
            return data.copy()
        kernel = np.ones(window_size) / window_size
        return np.convolve(data, kernel, mode='same')

    def butterworth_lowpass(self, data, cutoff_hz=20.0, order=4):
        """
        Apply a Butterworth low-pass filter to extract low-frequency
        components and remove high-frequency noise.

        Args:
            data (np.ndarray): 1D CSI time series
            cutoff_hz (float): Cutoff frequency in Hz
            order (int): Filter order (default 4)

        Returns:
            np.ndarray: Filtered data
        """
        nyquist = self.sample_rate / 2.0
        if cutoff_hz >= nyquist:
            raise ValueError("cutoff_hz must be below Nyquist frequency")
        b, a = scipy_signal.butter(order, cutoff_hz / nyquist, btype='low')
        return scipy_signal.filtfilt(b, a, data)

    def variance_filter(self, data, window_size=16):
        """
        Compute sliding window variance for motion detection thresholding.

        Args:
            data (np.ndarray): 1D CSI time series
            window_size (int): Sliding window size

        Returns:
            np.ndarray: Variance per window position (same length as input)
        """
        if window_size < 2:
            raise ValueError("window_size must be >= 2")
        out = np.full_like(data, np.nan, dtype=float)
        for i in range(len(data) - window_size + 1):
            out[i + window_size - 1] = np.var(data[i:i + window_size])
        # Fill leading NaNs with the first valid variance
        first_valid = np.nanargmin(np.isnan(out))
        out[:first_valid] = out[first_valid]
        return out

    # ============================================================
    # Transformation Primitives
    # ============================================================

    def stft(self, data, window_size=256, hop_size=128):
        """
        Compute the Short-Time Fourier Transform (STFT) to extract
        Doppler frequency shift information.

        Args:
            data (np.ndarray): 1D CSI time series
            window_size (int): FFT window size (64-1024)
            hop_size (int): Hop between windows (32-512)

        Returns:
            tuple: (frequencies, times, magnitude_spectrogram)
        """
        if window_size < 64 or window_size > 1024:
            raise ValueError("window_size must be in [64, 1024]")
        if hop_size < 32 or hop_size > 512:
            raise ValueError("hop_size must be in [32, 512]")
        freqs, times, Zxx = scipy_signal.stft(
            data, fs=self.sample_rate, nperseg=window_size,
            noverlap=window_size - hop_size
        )
        return freqs, times, np.abs(Zxx)

    def conjugate_multiplication(self, csi_a, csi_b):
        """
        Eliminate random phase offsets between unsynchronized WiFi
        transceivers via conjugate multiplication. Essential for
        monostatic sensing (single device).

        Args:
            csi_a (np.ndarray): CSI complex values from antenna A
            csi_b (np.ndarray): CSI complex values from antenna B

        Returns:
            np.ndarray: Phase-stabilized CSI data
        """
        if csi_a.shape != csi_b.shape:
            raise ValueError("csi_a and csi_b must have the same shape")
        return csi_a * np.conj(csi_b)

    def doppler_spectrum(self, data, window_size=256, hop_size=128):
        """
        Convert CSI to the Doppler frequency domain. Filters out static
        multipath components and highlights moving target velocity.

        Args:
            data (np.ndarray): 1D CSI time series
            window_size (int): FFT window size
            hop_size (int): Hop between windows

        Returns:
            tuple: (doppler_freqs, times, doppler_spectrogram)
        """
        freqs, times, mag = self.stft(data, window_size, hop_size)
        # Remove static (DC) component: zero out the zero-frequency bin
        dc_idx = np.argmin(np.abs(freqs))
        mag[dc_idx, :] = 0.0
        return freqs, times, mag

    # ============================================================
    # Feature Extraction
    # ============================================================

    def statistical_features(self, data):
        """
        Compute statistical features per subcarrier.

        Args:
            data (np.ndarray): 1D CSI time series

        Returns:
            dict: mean, variance, std, min, max, peak-to-peak, rms
        """
        data = np.asarray(data, dtype=float)
        return {
            'mean': float(np.mean(data)),
            'variance': float(np.var(data)),
            'std': float(np.std(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'peak_to_peak': float(np.ptp(data)),
            'rms': float(np.sqrt(np.mean(data ** 2))),
        }

    def extract_amplitude_phase(self, csi_complex):
        """
        Extract amplitude and phase from complex CSI values.

        Args:
            csi_complex (np.ndarray): Complex CSI values

        Returns:
            tuple: (amplitude, phase) numpy arrays
        """
        csi_complex = np.asarray(csi_complex, dtype=complex)
        return np.abs(csi_complex), np.angle(csi_complex)

    def process_pipeline(self, csi_complex, window_size=16, cutoff_hz=20.0):
        """
        Run the full DSP pipeline: amplitude/phase extraction, moving
        average smoothing, low-pass filtering, and feature extraction.

        Args:
            csi_complex (np.ndarray): Complex CSI values
            window_size (int): Moving average window
            cutoff_hz (float): Low-pass cutoff frequency

        Returns:
            dict: amplitude, phase, filtered_amplitude, features
        """
        amplitude, phase = self.extract_amplitude_phase(csi_complex)
        smoothed = self.moving_average(amplitude, window_size)
        filtered = self.butterworth_lowpass(smoothed, cutoff_hz)
        features = self.statistical_features(filtered)
        return {
            'amplitude': amplitude,
            'phase': phase,
            'smoothed_amplitude': smoothed,
            'filtered_amplitude': filtered,
            'features': features,
        }