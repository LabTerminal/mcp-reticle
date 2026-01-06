<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/labterminal/mcp-reticle/main/frontend/src/assets/logo-white.png" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/labterminal/mcp-reticle/main/frontend/src/assets/logo.png" />
    <img src="https://raw.githubusercontent.com/labterminal/mcp-reticle/main/frontend/src/assets/logo.png" alt="Reticle Logo" width="120" />
  </picture>
</p>

<h1 align="center">RETICLE</h1>

<p align="center">
  <strong>The Wireshark for the Model Context Protocol (MCP)</strong>
</p>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  </a>
  <a href="https://www.npmjs.com/package/mcp-reticle">
    <img src="https://img.shields.io/npm/v/mcp-reticle.svg" alt="npm" />
  </a>
  <a href="https://pypi.org/project/mcp-reticle/">
    <img src="https://img.shields.io/pypi/v/mcp-reticle.svg" alt="PyPI" />
  </a>
  <a href="https://github.com/labterminal/mcp-reticle/wiki">
    <img src="https://img.shields.io/badge/docs-wiki-informational" alt="Docs (Wiki)" />
  </a>
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg" alt="Platform" />
</p>

<p align="center">
  <em>See what your agent sees.</em>
</p>

<p align="center">
  Reticle intercepts, visualizes, and profiles MCP JSON-RPC traffic in real time — designed for microsecond-level overhead.
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#installation">Install</a> ·
  <a href="#documentation">Docs</a> ·
  <a href="#security--privacy">Security</a> ·
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img
    src="https://raw.githubusercontent.com/labterminal/mcp-reticle/main/frontend/src/styles/reticle.png"
    alt="Reticle Screenshot"
    width="900"
  />
</p>

---

## What is Reticle?

Reticle is a proxy + UI for debugging MCP integrations:
- inspect raw JSON-RPC messages (requests / notifications / responses)
- correlate request ↔ response instantly
- profile latency and token estimates
- capture server stderr and crashes
- record sessions and export logs

Supported transports: **stdio**, **Streamable HTTP**, **WebSocket**, **HTTP/SSE**.

---

## Quick start

### 1) Install

```bash
# npm
npm install -g mcp-reticle

# pip
pip install mcp-reticle

# Homebrew
brew install labterminal/mcp-reticle/mcp-reticle
```

### 2) Wrap your MCP server (stdio)

Replace your MCP server command with `mcp-reticle run --name <name> -- <command...>`.

Example (Claude Desktop-style config):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-reticle",
      "args": ["run", "--name", "filesystem", "--", "npx", "-y", "@modelcontextprotocol/server-filesystem", "/Users/me/work"]
    }
  }
}
```

### 3) Launch the UI

```bash
mcp-reticle ui
```

### Optional: log-only mode (no UI)

```bash
mcp-reticle run --log -- npx -y @modelcontextprotocol/server-memory
```

### Optional: proxy an HTTP-based MCP server

```bash
mcp-reticle proxy --name api --upstream http://localhost:8080 --listen 3001
```

---

## Installation

If you prefer building from source:

```bash
git clone https://github.com/labterminal/mcp-reticle.git
cd mcp-reticle
just build
```

---

## Documentation

All guides and deep dives are in the [GitHub Wiki](https://github.com/labterminal/mcp-reticle/wiki):

- [Getting started](https://github.com/labterminal/mcp-reticle/wiki/Getting-Started)
- [CLI reference](https://github.com/labterminal/mcp-reticle/wiki/CLI)
- [Client configuration](https://github.com/labterminal/mcp-reticle/wiki/Client-Configuration)
- [Troubleshooting](https://github.com/labterminal/mcp-reticle/wiki/Troubleshooting)
- [Architecture](https://github.com/labterminal/mcp-reticle/wiki/Architecture)
- [Security & privacy](https://github.com/labterminal/mcp-reticle/wiki/Security)
- [Development](https://github.com/labterminal/mcp-reticle/wiki/Development)
- [Exports](https://github.com/labterminal/mcp-reticle/wiki/Exports)

---

## CLI overview

| Command | Purpose |
|---|---|
| `mcp-reticle run` | Wrap stdio MCP servers and inspect traffic |
| `mcp-reticle proxy` | Reverse proxy HTTP/SSE/WebSocket transports |
| `mcp-reticle ui` | Launch the desktop UI |
| `mcp-reticle daemon` | Headless telemetry hub |

Full details: [CLI reference](https://github.com/labterminal/mcp-reticle/wiki/CLI)

---

## Security & privacy

Reticle can capture tool inputs/outputs and server stderr. Treat recordings and exports as **sensitive** artifacts.

Recommended reading: [Security & privacy](https://github.com/labterminal/mcp-reticle/wiki/Security)

---

## Contributing

- Repo guidelines: `CONTRIBUTING.md`
- Dev setup and commands: [Development guide](https://github.com/labterminal/mcp-reticle/wiki/Development)

---

## License

MIT — see `LICENSE`.
