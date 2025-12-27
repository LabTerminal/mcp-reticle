#!/bin/bash
set -euo pipefail

# Reticle installer
# Usage: curl -fsSL https://reticle.dev/install.sh | bash

VERSION="${RETICLE_VERSION:-latest}"
INSTALL_DIR="${RETICLE_INSTALL_DIR:-$HOME/.local/bin}"
GITHUB_REPO="labterminal/reticle"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}>${NC} $1"; }
warn() { echo -e "${YELLOW}>${NC} $1"; }
error() { echo -e "${RED}>${NC} $1" >&2; exit 1; }

# Detect platform
detect_platform() {
  local os arch

  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)

  case "$os" in
    darwin) os="darwin" ;;
    linux)  os="linux" ;;
    mingw*|msys*|cygwin*) os="windows" ;;
    *) error "Unsupported OS: $os" ;;
  esac

  case "$arch" in
    x86_64|amd64)  arch="x86_64" ;;
    arm64|aarch64) arch="aarch64" ;;
    *) error "Unsupported architecture: $arch" ;;
  esac

  echo "${os}-${arch}"
}

# Get download URL
get_download_url() {
  local platform="$1"
  local version="$2"
  local ext="tar.gz"

  [[ "$platform" == windows-* ]] && ext="zip"

  if [[ "$version" == "latest" ]]; then
    echo "https://github.com/${GITHUB_REPO}/releases/latest/download/reticle-${platform}.${ext}"
  else
    echo "https://github.com/${GITHUB_REPO}/releases/download/v${version}/reticle-${platform}.${ext}"
  fi
}

# Main installation
main() {
  info "Detecting platform..."
  local platform=$(detect_platform)
  info "Platform: $platform"

  info "Downloading Reticle ${VERSION}..."
  local url=$(get_download_url "$platform" "$VERSION")
  local tmp_dir=$(mktemp -d)
  local archive="$tmp_dir/reticle.tar.gz"

  if command -v curl &> /dev/null; then
    curl -fsSL "$url" -o "$archive" || error "Download failed: $url"
  elif command -v wget &> /dev/null; then
    wget -q "$url" -O "$archive" || error "Download failed: $url"
  else
    error "Neither curl nor wget found. Please install one."
  fi

  info "Extracting..."
  mkdir -p "$tmp_dir/extract"
  tar -xzf "$archive" -C "$tmp_dir/extract"

  info "Installing to $INSTALL_DIR..."
  mkdir -p "$INSTALL_DIR"
  mv "$tmp_dir/extract/reticle" "$INSTALL_DIR/reticle"
  chmod +x "$INSTALL_DIR/reticle"

  # Cleanup
  rm -rf "$tmp_dir"

  # Verify installation
  if [[ -x "$INSTALL_DIR/reticle" ]]; then
    info "Successfully installed Reticle!"
    echo ""
    echo "  Binary: $INSTALL_DIR/reticle"
    echo ""

    # Check if in PATH
    if ! command -v reticle &> /dev/null; then
      warn "Add to your PATH:"
      echo ""
      echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
      echo ""
      echo "  Add this to your ~/.bashrc, ~/.zshrc, or shell config."
    fi
  else
    error "Installation failed"
  fi
}

main "$@"
