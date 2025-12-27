# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Reticle, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email security concerns to **security@labterminal.io**
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability and its impact
- **Timeline**: We aim to address critical vulnerabilities within 7 days
- **Disclosure**: We will coordinate disclosure timing with you

### Scope

This security policy applies to:

- The Reticle desktop application
- The reticle CLI proxy
- Official releases and builds

### Out of Scope

- Third-party MCP servers being proxied
- User-configured MCP server commands
- Self-hosted or modified versions

## Implemented Security Measures

### 1. Network Binding (127.0.0.1)
All HTTP proxy servers (SSE, WebSocket, Streamable) bind to `127.0.0.1` instead of `0.0.0.0`. This prevents external network access to the proxy endpoints.

### 2. Command Allowlist
MCP server commands are validated against a configurable allowlist before execution:
- `npx`, `node` - Node.js ecosystem
- `python`, `python3` - Python ecosystem
- `uvx`, `uv` - Python uv ecosystem
- `deno`, `bun` - Alternative runtimes

Configuration: `SecurityConfig` in `src-tauri/src/config/app_config.rs`

### 3. CORS Restrictions
HTTP proxy endpoints restrict CORS origins to localhost only.

### 4. Cryptographically Secure Session IDs
Session IDs use 128 bits of cryptographic randomness to prevent prediction.

### 5. Lock Safety
Mutex locks are released before async operations to prevent deadlocks.

## Security Considerations

### MCP Proxy Security

Reticle acts as a transparent proxy between MCP clients and servers. Users should be aware that:

1. **Traffic Visibility**: All JSON-RPC messages pass through Reticle and can be logged
2. **Server Trust**: Reticle executes MCP server commands as specified by the user
3. **Local Storage**: Session recordings are stored locally on the user's machine

### Best Practices

1. Only proxy MCP servers you trust
2. Review server commands before configuration
3. Be cautious with exported session logs (may contain sensitive data)
4. Keep Reticle updated to the latest version

## Future Improvements

See code review notes for additional security hardening opportunities:
- Input validation for JSON-RPC messages
- Rate limiting on proxy endpoints
- TLS support for HTTP transports
- Replace `eprintln!` with structured `tracing` logs
- Add Dependabot for dependency updates

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve Reticle's security.
