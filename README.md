<h1 align="center">RETICLE</h1>

<p align="center">
  <strong>The Wireshark for the Model Context Protocol</strong>
</p>

<p align="center">
  <a href="https://github.com/labterminal/mcp-reticle/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Compliant-00F0FF.svg" alt="MCP Compliant" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg" alt="Platform" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Rust-1.75+-orange.svg" alt="Rust 1.75+" /></a>
</p>

<p align="center">
  <em>See what your Agent sees.</em>
</p>

<p align="center">
  Reticle intercepts, visualizes, and profiles JSON-RPC traffic between your LLM and MCP servers in real-time — with zero latency overhead. Stop debugging blind. Start seeing everything.
</p>

---

## The Problem: Flying Blind

Building with MCP today feels like 1990s web development without a browser console.

| Pain Point | Reality |
|------------|---------|
| **Silent Failures** | Agents hang indefinitely when a server crashes over stdio. No error, no trace, just... nothing. |
| **Cryptic Errors** | `-32600 Invalid Request` tells you nothing about *why* the tool call failed. |
| **Context Bloat** | Connecting standard tools can waste 60k+ tokens just on definitions. Which server is the culprit? |
| **Security Anxiety** | You're running untrusted `npx` scripts that have full filesystem access. What are they *actually* doing? |

---

## The Solution: Reticle

<p align="center">
  <img src="frontend/src/styles/reticle.png" alt="Reticle Screenshot" width="800" />
</p>

### Core Features

| Feature | Description |
|---------|-------------|
| **Deep Packet Inspection** | See raw JSON-RPC messages (requests, notifications, responses) in real-time. Syntax-highlighted with Monaco editor. |
| **Request/Response Correlation** | Automatically links responses to their originating requests. Jump between correlated messages with one click. |
| **Latency Profiling** | Color-coded latency indicators. Red (>1s), Orange (>200ms), Green (<50ms). Identify slow tools instantly. |
| **Token Profiling** | Real-time token estimation for every message. See context consumption per method, identify token-heavy tools. |
| **Stderr Capture** | Server crashes, Python tracebacks, debug prints — all captured and displayed separately from JSON-RPC traffic. |
| **Multi-Session Support** | Debug 10 MCP servers simultaneously. Filter by session, method, or direction. |
| **Session Tagging** | Add custom tags to sessions for organization. Filter sessions by server name or tags. |
| **Multi-Server Identification** | Each server is identified by name. Filter logs by specific server. |
| **Session Recording** | Capture complete sessions with timing data. Export to JSON for analysis or replay. |
| **Zero-Latency Proxy** | Microsecond overhead. Your agent won't even notice Reticle is there. |

### Transports

| Transport | Status | Use Case |
|-----------|--------|----------|
| **stdio** | Production Ready | Process-based MCP servers (Claude Desktop, Cursor, Cline) |
| **Streamable HTTP** | Production Ready | Modern MCP servers (2025-03-26 spec) with bidirectional HTTP |
| **WebSocket** | Production Ready | Real-time bidirectional communication with low latency |
| **HTTP/SSE** | Production Ready | Legacy web-based MCP servers (2024-11-05 spec) |

---

## Installation

```bash
# npm
npm install -g mcp-reticle

# pip
pip install mcp-reticle

# Homebrew
brew install labterminal/mcp-reticle/mcp-reticle

# From source
git clone https://github.com/labterminal/mcp-reticle.git
cd mcp-reticle
just build
```

---

## Quick Start

### 1. Wrap your MCP server

Instead of running your MCP server directly, wrap it with `mcp-reticle run`:

**Before (Claude Desktop Config):**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/work"]
    }
  }
}
```

**After (With Reticle):**
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

### 2. Launch the GUI

```bash
mcp-reticle ui
```

All traffic from your wrapped servers appears in real-time.

---

## CLI Commands

Reticle provides a powerful CLI with multiple modes:

### `mcp-reticle run` — Wrap stdio MCP servers

```bash
# Basic usage
mcp-reticle run -- npx -y @modelcontextprotocol/server-github

# With a custom name (recommended)
mcp-reticle run --name github -- npx -y @modelcontextprotocol/server-github

# Standalone log mode (no GUI needed)
mcp-reticle run --log -- npx -y @modelcontextprotocol/server-memory

# JSON output format
mcp-reticle run --log --format json -- python -m my_mcp_server
```

### `mcp-reticle proxy` — HTTP reverse proxy

For remote MCP servers using HTTP/SSE/WebSocket transport:

```bash
mcp-reticle proxy --name api --upstream http://localhost:8080 --listen 3001
```

### `mcp-reticle ui` — Launch the GUI

```bash
# Launch the GUI dashboard
mcp-reticle ui

# Launch in background
mcp-reticle ui --detach

# Development mode (cargo tauri dev)
mcp-reticle ui --dev
```

### `mcp-reticle daemon` — Standalone telemetry hub

For headless/server deployments without the GUI:

```bash
mcp-reticle daemon --socket /tmp/reticle.sock
```

---

## CLI vs GUI Usage

| Mode | Use Case |
|------|----------|
| **CLI + GUI** | Full debugging experience. Wrap servers with `mcp-reticle run`, view in GUI with `mcp-reticle ui`. |
| **CLI only (--log)** | Lightweight logging without GUI. Great for CI/CD or servers. |
| **CLI + Daemon** | Headless telemetry aggregation. Multiple CLI instances stream to one daemon. |

---

## Use Cases

### Debugging "Silent Failures"

Your agent tries to read a file but gives up silently. Reticle shows you the `fs.read_file` request resulted in a `Permission Denied` error that the agent swallowed.

```
[14:32:01.234] → tools/call  fs.read_file  #42
[14:32:01.289] ← error      -32602        #42  "Permission denied: /etc/shadow"
```

### Developing New MCP Servers

Don't write client code just to test your server. Use Reticle's **Request Composer** to manually send JSON-RPC payloads and verify responses.

### Multi-Server Debugging

Running Claude Desktop with 10 MCP servers? Filter by session to isolate one server's traffic. Color-coded status dots instantly show which servers are erroring.

### Security Auditing

Log every file access, shell command, and network request your AI agent attempts. Export logs to JSON for compliance auditing.

### Performance Analysis

Identify which MCP servers are slow. The latency column shows round-trip time for every request/response pair.

### Time-Travel Debugging

Record complete sessions and replay them later. Share session files with teammates to reproduce issues without re-running the agent.

---

## Client Configuration

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "mcp-reticle",
      "args": ["run", "--name", "my-server", "--", "python", "-m", "my_mcp_server"]
    }
  }
}
```

### Cursor / Cline (VS Code)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "mcp-reticle",
      "args": ["run", "--name", "my-server", "--", "node", "server.js"]
    }
  }
}
```

### Other Clients

Same pattern — wrap your server command with `mcp-reticle run --name <name> --`.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│  mcp-reticle    │────▶│   MCP Server    │
│ (Claude, Cline) │◀────│     (CLI)       │◀────│  (your tool)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │ Unix Socket
                                 ▼
                        ┌─────────────────┐
                        │  Reticle GUI    │
                        │  (Tauri + React)│
                        └─────────────────┘
```

### How It Works

1. **mcp-reticle run** wraps your MCP server process
2. All stdin/stdout traffic passes through the proxy transparently
3. Telemetry streams to the GUI via Unix socket (`/tmp/reticle.sock`)
4. Zero-copy forwarding ensures <100μs overhead
5. CLI instances can run independently (fail-open design)

### Technology Stack

**Backend (Rust)**
- Tokio — Async runtime and zero-copy I/O
- Tauri v2 — Native desktop wrapper
- Serde — High-performance JSON serialization

**Frontend (TypeScript)**
- React 18 — UI framework
- Zustand — Lightweight state management
- React Virtuoso — Handles 10k+ messages without lag
- Monaco Editor — VS Code's editor for JSON inspection
- Recharts — Real-time metrics visualization
- Tailwind CSS — Utility-first styling

---

## Performance

| Metric | Value |
|--------|-------|
| Proxy Latency | <100μs overhead |
| Throughput | 1000+ messages/second |
| Memory | ~50MB baseline |
| UI Rendering | Smooth at 10k+ messages (virtualized) |

---

## Project Structure

```
mcp-reticle/
├── crates/
│   ├── reticle-core/       # Shared library (protocol, token counting, events)
│   └── reticle-cli/        # CLI binary (mcp-reticle)
├── src-tauri/              # Tauri desktop app (reticle-app)
│   ├── src/
│   │   ├── core/           # Proxy implementations, socket bridge
│   │   ├── commands/       # Tauri IPC commands
│   │   └── main.rs
│   └── Cargo.toml
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # LogStream, Inspector, Sidebar, etc.
│   │   ├── store/          # Zustand state management
│   │   └── App.tsx
│   └── package.json
├── packages/               # Distribution packages
│   ├── npm/                # npm: mcp-reticle
│   ├── npm-binaries/       # npm: @mcp-reticle/darwin-arm64, etc.
│   └── python/             # PyPI: mcp-reticle
├── Formula/                # Homebrew formula
├── scripts/                # Test utilities
└── justfile
```

---

## Development

### Prerequisites

- Rust 1.75+
- Node.js 18+
- Python 3.8+ (for test scripts)
- [just](https://github.com/casey/just) (task runner)

### Available Commands

```bash
just          # Show all available commands
just setup    # Install dependencies
just dev      # Start development server
just build    # Build for production
just build-cli # Build CLI only
just test     # Run all tests
just check    # Check Rust code
just lint     # Run clippy lints
just fmt      # Format code
```

### Testing

```bash
just test-direct   # Test MCP server directly
just test-proxy    # Test with proxy
just test-stress   # Stress test (100 requests)
just mock-server   # Run mock MCP server
just sse-server    # Run mock SSE server
```

### Build for Production

```bash
just build    # Desktop app (macOS/Linux/Windows)
```

---

## Roadmap

### Completed
- [x] stdio transport (production ready)
- [x] Streamable HTTP transport (MCP 2025-03-26 spec)
- [x] WebSocket transport for real-time bidirectional communication
- [x] HTTP/SSE transport for web-based MCP servers (legacy)
- [x] Real-time message interception with zero-latency proxy
- [x] JSON-RPC parsing and syntax-highlighted display
- [x] Request/response correlation with one-click navigation
- [x] Latency profiling with color-coded indicators (>50ms, >200ms, >1s thresholds)
- [x] Latency filtering to surface slow requests
- [x] Virtualized rendering (handles 10k+ messages)
- [x] Stderr and raw output capture
- [x] Multi-session support with filtering
- [x] Session aliases/nicknames for easier identification
- [x] Request Composer for manual JSON-RPC testing
- [x] Dark/Light theme with premium UI
- [x] Session recording (capture messages with timing)
- [x] Log export (JSON format)
- [x] Context token profiling per message and method
- [x] Session tagging for organization and filtering
- [x] Multi-server identification and filtering
- [x] Keyboard shortcuts help modal (press ? to view)
- [x] Confirmation dialogs for destructive actions (Clear Logs, Delete Session)
- [x] Transport type toggle surfaced in control bar
- [x] Improved empty state messaging with getting-started hints
- [x] Log export (JSON/CSV/HAR formats)
- [x] Distribution packages (npm, PyPI, Homebrew)

### Planned
- [ ] Security firewall (block/allow specific methods)
- [ ] Traffic replay and request modification
- [ ] Session playback (replay recorded sessions)
- [ ] Multi-agent topology view
- [ ] First-time user onboarding tour

---

## Troubleshooting

### No messages appearing?

1. Verify reticle is wrapping your server correctly
2. Check that the Reticle GUI is running and connected
3. Look at the terminal for error messages
4. See [TESTING.md](TESTING.md) for detailed debugging

### Proxy won't start?

1. Check if the port is already in use
2. Verify the command path is correct
3. Ensure the MCP server starts correctly when run directly

### UI not updating?

1. Open browser DevTools (F12) and check for errors
2. Verify Tauri event listeners are registered
3. Check that backend is emitting `log-event` events

---

## Contributing

Reticle is under active development. Key areas for contribution:

- Security firewall policies
- Traffic replay and session playback
- Log export formats (CSV/HAR)
- Token analytics and context profiling
- Multi-agent topology visualization
- Documentation and examples

---

## Acknowledgments

Built with [Tauri](https://tauri.app), [Tokio](https://tokio.rs), [React](https://react.dev), and the [Model Context Protocol](https://modelcontextprotocol.io) community.

---

<p align="center">
  <strong>Stop flying blind. See what your agents are doing.</strong>
</p>
