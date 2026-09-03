# ChromeOS Dashboard

The Chromebook client is a static browser app. It renders the mobile voice command interface, stores sessions in browser local storage, and connects to the companion server over WebSocket.

## Run locally

From the repository root, serve the repository over HTTP:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/chromeos/` in Chrome. Set `network.host`, `network.port`, and `network.token` in `src/config/config.local.json` to match the companion server. For a remote HTTPS host, serve this page over HTTPS so the client selects `wss://` automatically.

The Matrix palette and glyph rain are enabled in `src/config/config.example.json`. Set `dashboard.matrixRain` to `false` to disable the canvas layer.