# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release
- stdio transport proxy (reticle)
- HTTP/SSE transport support
- Real-time JSON-RPC message inspection
- Request/response correlation
- Latency profiling with color-coded indicators
- Stderr capture and display
- Multi-session support with filtering
- Request Composer for manual testing
- Session recording with timing data
- JSON export for recorded sessions
- Dark/Light theme support
- Virtualized log rendering (10k+ messages)

### Technical
- Tauri v2 desktop application
- React 18 frontend with Zustand state management
- Tokio async runtime for zero-copy I/O
- Monaco editor for JSON inspection
- React Virtuoso for performant scrolling

## [0.1.0] - 2025-12-22

### Added
- Initial development release
- Core proxy functionality
- Basic UI implementation

[Unreleased]: https://github.com/labterminal/mcp-reticle/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/labterminal/mcp-reticle/releases/tag/v0.1.0
