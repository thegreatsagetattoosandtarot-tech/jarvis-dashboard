#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"
ENV_FILE="$SCRIPT_DIR/.env"
LOCAL_CONFIG="$ROOT/src/config/config.local.json"

command -v node >/dev/null || { echo "node is required" >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 1; }
command -v ffmpeg >/dev/null || echo "warning: ffmpeg missing; voice transcription will be unavailable"
command -v whisper-cli >/dev/null || echo "warning: whisper-cli missing; text commands still work"

mkdir -p "$CERTS_DIR"
if [[ ! -f "$CERTS_DIR/jarvis-ca.pem" || ! -f "$CERTS_DIR/server.pem" ]]; then
  openssl genrsa -out "$CERTS_DIR/jarvis-ca-key.pem" 4096 2>/dev/null
  openssl req -x509 -new -nodes -key "$CERTS_DIR/jarvis-ca-key.pem" -sha256 -days 3650 \
    -out "$CERTS_DIR/jarvis-ca.pem" -subj "/CN=JARVIS Local CA" 2>/dev/null
  openssl genrsa -out "$CERTS_DIR/server-key.pem" 2048 2>/dev/null
  openssl req -new -key "$CERTS_DIR/server-key.pem" -out "$CERTS_DIR/server.csr" \
    -subj "/CN=jarvis-server" 2>/dev/null
  openssl x509 -req -in "$CERTS_DIR/server.csr" -CA "$CERTS_DIR/jarvis-ca.pem" \
    -CAkey "$CERTS_DIR/jarvis-ca-key.pem" -CAcreateserial -out "$CERTS_DIR/server.pem" \
    -days 730 -sha256 -extfile <(printf 'subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1') 2>/dev/null
  rm -f "$CERTS_DIR/server.csr" "$CERTS_DIR/jarvis-ca.srl"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  umask 077
  printf 'JARVIS_AUTH_TOKEN=%s\n' "$(openssl rand -hex 32)" > "$ENV_FILE"
fi

if [[ ! -f "$LOCAL_CONFIG" ]]; then
  TOKEN="$(sed -n 's/^JARVIS_AUTH_TOKEN=//p' "$ENV_FILE")"
  umask 077
  cat > "$LOCAL_CONFIG" <<EOF
{
  "network": {
    "host": "localhost",
    "token": "$TOKEN",
    "mobileTts": "server"
  }
}
EOF
fi

(cd "$SCRIPT_DIR" && npm install --silent)
chmod 600 "$ENV_FILE" "$LOCAL_CONFIG"
printf 'Linux companion configured. Start with: npm --prefix "%s" start\n' "$SCRIPT_DIR"
