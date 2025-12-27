# Reticle

**The Wireshark for the Model Context Protocol**

*See what your Agent sees.*

Reticle intercepts, visualizes, and profiles JSON-RPC traffic between your LLM and MCP servers in real-time — with zero latency overhead.

## Installation

```bash
pip install reticle
```

## Usage

Wrap your MCP server command with `reticle`:

```bash
reticle --port 3001 -- python -m my_mcp_server
```

### Claude Desktop Configuration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "reticle",
      "args": ["--port", "3001", "--", "python", "-m", "my_mcp_server"]
    }
  }
}
```

## Features

- **Deep Packet Inspection** — See raw JSON-RPC messages in real-time
- **Request/Response Correlation** — Automatically links responses to requests
- **Latency Profiling** — Color-coded latency indicators
- **Token Profiling** — Real-time token estimation per message
- **Multi-Session Support** — Debug multiple MCP servers simultaneously
- **Zero-Latency Proxy** — Microsecond overhead

## Documentation

Full documentation at [github.com/labterminal/reticle](https://github.com/labterminal/reticle)

## License

BSL-1.1
