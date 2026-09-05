"""
ESP32 CSI Collector - Python pipeline for collecting CSI data from ESP32

Reads Channel State Information (CSI) data from an ESP32 over serial (UART)
or from a CSV log file. Supports active (station/AP) and passive collection
modes. Parses the CSV data format emitted by the ESP32 firmware.

Target: ESP32-S3 (2.4GHz WiFi CSI), also usable on ESP32-C3/C5
"""

import csv
import io
import time
import numpy as np


class CSICollector:
    """
    Collect and parse CSI data from ESP32 hardware.

    Reads CSI frames from a serial port (pyserial) or a CSV file and
    converts them into numpy arrays of amplitude/phase per subcarrier.
    """

    # Expected CSV columns from ESP32 firmware
    COLUMNS = ['timestamp', 'subcarrier', 'amplitude', 'phase', 'quality']

    def __init__(self, port=None, baudrate=921600, channel=11):
        """
        Initialize the CSI collector.

        Args:
            port: Serial port device (e.g. '/dev/ttyUSB0'). None for file mode.
            baudrate: Serial baud rate (default 921600, matches firmware)
            channel: WiFi channel being monitored (default 11)
        """
        self.port = port
        self.baudrate = baudrate
        self.channel = channel
        self._serial = None

    # ============================================================
    # Serial Connection
    # ============================================================

    def connect(self):
        """
        Open the serial connection to the ESP32.

        Returns:
            bool: True if connected successfully
        """
        if self.port is None:
            raise ValueError("No serial port specified")
        try:
            import serial
            self._serial = serial.Serial(
                self.port, self.baudrate, timeout=1.0
            )
            return self._serial.is_open
        except ImportError:
            raise ImportError(
                "pyserial not installed. Run: pip install pyserial"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to open serial port {self.port}: {e}")

    def disconnect(self):
        """Close the serial connection."""
        if self._serial is not None and self._serial.is_open:
            self._serial.close()
        self._serial = None

    def read_serial_line(self, timeout=5.0):
        """
        Read a single line of CSI data from the serial port.

        Args:
            timeout: Seconds to wait for a line

        Returns:
            str: Raw CSV line, or None on timeout
        """
        if self._serial is None:
            raise RuntimeError("Not connected. Call connect() first.")
        deadline = time.time() + timeout
        line = b''
        while time.time() < deadline:
            byte = self._serial.read(1)
            if byte == b'\n':
                return line.decode('utf-8', errors='replace').strip()
            if byte:
                line += byte
        return None

    # ============================================================
    # CSV Parsing
    # ============================================================

    def parse_csv_line(self, line):
        """
        Parse a single CSV line into a CSI sample dict.

        Args:
            line (str): Raw CSV line from ESP32

        Returns:
            dict: Parsed sample with timestamp, subcarrier, amplitude,
                  phase, quality keys
        """
        parts = line.strip().split(',')
        if len(parts) < 4:
            raise ValueError(f"Malformed CSI line: {line!r}")
        return {
            'timestamp': float(parts[0]),
            'subcarrier': int(parts[1]),
            'amplitude': float(parts[2]),
            'phase': float(parts[3]),
            'quality': float(parts[4]) if len(parts) > 4 else 0.0,
        }

    def parse_csv_file(self, filepath):
        """
        Parse a CSI CSV log file into structured numpy arrays.

        Args:
            filepath (str): Path to the CSV file

        Returns:
            dict: timestamps, subcarriers, amplitudes, phases, quality
        """
        timestamps, subcarriers = [], []
        amplitudes, phases, quality = [], [], []

        with open(filepath, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 4:
                    continue
                try:
                    timestamps.append(float(row[0]))
                    subcarriers.append(int(row[1]))
                    amplitudes.append(float(row[2]))
                    phases.append(float(row[3]))
                    quality.append(float(row[4]) if len(row) > 4 else 0.0)
                except (ValueError, IndexError):
                    continue  # skip malformed rows

        return {
            'timestamps': np.array(timestamps),
            'subcarriers': np.array(subcarriers),
            'amplitudes': np.array(amplitudes),
            'phases': np.array(phases),
            'quality': np.array(quality),
        }

    def reshape_by_subcarrier(self, parsed):
        """
        Reshape flat CSI samples into a (time, subcarrier) matrix.

        Args:
            parsed (dict): Output of parse_csv_file

        Returns:
            tuple: (amplitude_matrix, phase_matrix) shaped (n_time, n_subcarriers)
        """
        subcarriers = np.unique(parsed['subcarriers'])
        n_sub = len(subcarriers)
        n_time = len(parsed['timestamps']) // n_sub

        amp = parsed['amplitudes'][:n_time * n_sub].reshape(n_time, n_sub)
        pha = parsed['phases'][:n_time * n_sub].reshape(n_time, n_sub)
        return amp, pha

    # ============================================================
    # Live Collection
    # ============================================================

    def collect(self, num_samples=100, timeout=10.0):
        """
        Collect a fixed number of CSI samples from the serial port.

        Args:
            num_samples (int): Number of samples to collect
            timeout (float): Per-line timeout in seconds

        Returns:
            dict: Parsed samples as numpy arrays
        """
        if self._serial is None:
            self.connect()

        timestamps, subcarriers = [], []
        amplitudes, phases, quality = [], [], []

        while len(timestamps) < num_samples:
            line = self.read_serial_line(timeout)
            if line is None:
                break
            try:
                sample = self.parse_csv_line(line)
            except ValueError:
                continue
            timestamps.append(sample['timestamp'])
            subcarriers.append(sample['subcarrier'])
            amplitudes.append(sample['amplitude'])
            phases.append(sample['phase'])
            quality.append(sample['quality'])

        return {
            'timestamps': np.array(timestamps),
            'subcarriers': np.array(subcarriers),
            'amplitudes': np.array(amplitudes),
            'phases': np.array(phases),
            'quality': np.array(quality),
        }

    def save_csv(self, parsed, filepath):
        """
        Save collected CSI data to a CSV file.

        Args:
            parsed (dict): CSI data dict from collect() or parse_csv_file()
            filepath (str): Output CSV path
        """
        n = len(parsed['timestamps'])
        with open(filepath, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(self.COLUMNS)
            for i in range(n):
                writer.writerow([
                    parsed['timestamps'][i],
                    parsed['subcarriers'][i],
                    parsed['amplitudes'][i],
                    parsed['phases'][i],
                    parsed['quality'][i],
                ])