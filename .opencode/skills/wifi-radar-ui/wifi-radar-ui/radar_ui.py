"""
WiFi Radar UI - Python server for the WiFi radar visualization interface

Serves the radar_ui.html dashboard and provides a JSON API for live
RSSI/jitter data, calibration state, and presence/movement status.
Runs standalone (no ESP32 required) for development and testing.

Target: Python 3.8+, works alongside ESP32 LittleFS deployment
"""

import json
import os
import time
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import numpy as np


class RadarUI:
    """
    WiFi Radar UI server.

    Serves the HTML dashboard and exposes a /api/status JSON endpoint
    that reports presence, movement, RSSI, and calibration state.
    """

    def __init__(self, host='0.0.0.0', port=8088,
                 html_path=None, sensitivity=50):
        """
        Initialize the radar UI server.

        Args:
            host: Bind address (default 0.0.0.0)
            port: HTTP port (default 8088)
            html_path: Path to radar_ui.html (defaults to sibling file)
            sensitivity: Detection sensitivity 0-100 (default 50)
        """
        self.host = host
        self.port = port
        self.sensitivity = sensitivity
        self.html_path = html_path or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 'radar_ui.html'
        )

        # Runtime state
        self.rssi_history = []
        self.jitter_history = []
        self.someone_present = False
        self.movement_detected = False
        self.calibrated = False
        self.calibration_progress = 0.0
        self._lock = threading.Lock()

        self._server = None
        self._thread = None

    # ============================================================
    # Data Ingestion
    # ============================================================

    def update(self, rssi_dbm, jitter=0.0):
        """
        Update the radar state with a new RSSI measurement.

        Args:
            rssi_dbm (float): Received signal strength in dBm
            jitter (float): Signal jitter/variance value
        """
        with self._lock:
            self.rssi_history.append(float(rssi_dbm))
            self.jitter_history.append(float(jitter))
            # Keep rolling window of 100 samples
            if len(self.rssi_history) > 100:
                self.rssi_history.pop(0)
                self.jitter_history.pop(0)

            # Movement detection: jitter above sensitivity-scaled threshold
            threshold = max(1.0, 15.0 * (1.0 - self.sensitivity / 100.0))
            self.movement_detected = jitter > threshold
            if self.movement_detected:
                self.someone_present = True

    def calibrate(self, samples):
        """
        Run calibration over a set of empty-room samples.

        Args:
            samples (list): List of RSSI values during calibration
        """
        with self._lock:
            if not samples:
                return
            arr = np.array(samples, dtype=float)
            self.calibration_baseline = float(np.mean(arr))
            self.calibration_std = float(np.std(arr))
            self.calibrated = True
            self.calibration_progress = 1.0

    # ============================================================
    # State Serialization
    # ============================================================

    def status_json(self):
        """Return the current radar state as a JSON-serializable dict."""
        with self._lock:
            rssi = self.rssi_history[-1] if self.rssi_history else None
            return {
                'someone': self.someone_present,
                'movement': self.movement_detected,
                'rssi': rssi,
                'rssi_history': self.rssi_history[-50:],
                'jitter_history': self.jitter_history[-50:],
                'calibrated': self.calibrated,
                'calibration_progress': self.calibration_progress,
                'sensitivity': self.sensitivity,
            }

    def calibrate(self, samples):
        """Calibrate the radar with empty-room RSSI samples.

        Args:
            samples (list): List of RSSI values during empty-room calibration
        """
        with self._lock:
            if not samples:
                return
            arr = np.array(samples, dtype=float)
            self.calibration_baseline = float(np.mean(arr))
            self.calibration_std = float(np.std(arr))
            self.calibrated = True
            self.calibration_progress = 1.0

    # ============================================================
    # HTTP Server
    # ============================================================

    def _make_handler(self):
        """Create an HTTP request handler bound to this RadarUI instance."""
        ui = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/api/status':
                    body = json.dumps(ui.status_json()).encode()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                elif self.path in ('/', '/index.html'):
                    self._serve_html()
                else:
                    self.send_response(404)
                    self.end_headers()

            def do_POST(self):
                if self.path == '/api/calibrate':
                    content_length = int(self.headers.get('Content-Length', 0))
                    body = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'
                    try:
                        data = json.loads(body) if body else {}
                        samples = data.get('samples', [])
                        if samples:
                            ui.calibrate(samples)
                            response = json.dumps({
                                'success': True,
                                'calibrated': ui.calibrated,
                                'baseline': ui.calibration_baseline,
                                'progress': ui.calibration_progress
                            })
                        else:
                            response = json.dumps({
                                'success': False,
                                'error': 'no samples provided'
                            })
                    except Exception as e:
                        response = json.dumps({
                            'success': False,
                            'error': str(e)
                        })
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(response.encode())))
                    self.end_headers()
                    self.wfile.write(response.encode())
                else:
                    self.send_response(404)
                    self.end_headers()

            def _serve_html(self):
                try:
                    with open(ui.html_path, 'rb') as f:
                        body = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                except FileNotFoundError:
                    self.send_response(404)
                    self.end_headers()

            def log_message(self, fmt, *args):
                # Quiet logging
                pass

        return Handler

    def start(self):
        """Start the HTTP server in a background thread."""
        handler = self._make_handler()
        self._server = HTTPServer((self.host, self.port), handler)
        self._thread = threading.Thread(
            target=self._server.serve_forever, daemon=True
        )
        self._thread.start()
        return self._server.server_address

    def stop(self):
        """Stop the HTTP server."""
        if self._server is not None:
            self._server.shutdown()
            self._server.server_close()
            self._server = None

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *exc):
        self.stop()