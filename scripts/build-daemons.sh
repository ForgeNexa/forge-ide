#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/release-artifacts"
DAEMON_DIR="${ROOT_DIR}/services/forge-daemon"

mkdir -p "${OUTPUT_DIR}"

echo "==> Building cross-platform forge-daemon binaries..."

TARGETS=(
  "darwin/arm64/forge-daemon-darwin-arm64"
  "darwin/amd64/forge-daemon-darwin-amd64"
  "linux/amd64/forge-daemon-linux-amd64"
  "linux/arm64/forge-daemon-linux-arm64"
  "windows/amd64/forge-daemon-windows-amd64.exe"
)

cd "${DAEMON_DIR}"

for target in "${TARGETS[@]}"; do
  IFS="/" read -r GOOS GOARCH OUT_FILE <<< "${target}"
  DEST="${OUTPUT_DIR}/${OUT_FILE}"
  echo "    Building ${GOOS}/${GOARCH} -> ${OUT_FILE}..."
  GOOS="${GOOS}" GOARCH="${GOARCH}" CGO_ENABLED=0 go build -ldflags="-s -w" -o "${DEST}" ./cmd/forge-daemon
done

echo "==> Generating SHA-256 Checksums..."
cd "${OUTPUT_DIR}"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum forge-daemon-* > SHA256SUMS.txt
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 forge-daemon-* > SHA256SUMS.txt
fi

echo "==> Done! Release artifacts in ${OUTPUT_DIR}:"
ls -la "${OUTPUT_DIR}"
cat "${OUTPUT_DIR}/SHA256SUMS.txt"
