# ForgeNexa — Master Architecture Specification

**Organization:** ForgeNexa (`https://github.com/ForgeNexa`)  
**Ecosystem Brand:** ForgeNexa  
**Author:** Principal Software Architect & Systems Engineer  
**Date:** 2026-10-30  
**Version:** 1.0.0  
**Status:** Approved Architecture Blueprint  

---

## 1. Executive Vision & Ecosystem Strategy

**ForgeNexa** is an open-source, local-first ecosystem of independent, high-performance developer tools. Rather than creating a single bloated monolithic suite or a set of disparate toy applications, ForgeNexa standardizes on:

1. **Independent Utility:** Every tool (**Forge IDE**, **Forge API**, **Forge Terminal**, **Forge Git**) stands on its own as an independently installable, production-ready desktop/CLI application.
2. **Shared Core Foundation (`forge-core`):** Common, high-performance computational capabilities (filesystem indexing, Git plumbing, PTY process supervisors, secure credential storage, structured logging) are written in modular, concurrent Go packages with bounded worker pools, context cancellation, and zero memory leaks.
3. **Unified Design System (`forge-design-system`):** A shared visual identity featuring an authentic **2026 Dark Theme**, restrained modern typography, accessible components, and consistent ergonomics without gratuitous visual clutter.
4. **Zero-Compromise Security & Privacy:** Local execution by default, OS-level secure credential isolation (never plaintext API keys/tokens), zero secret leakage in logs or exports, and explicit user consent before any code is shared with AI providers.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FORGENEXA ECOSYSTEM                                     │
├───────────────────┬────────────────────┬─────────────────────┬─────────────────────────┤
│    Forge IDE      │     Forge API      │   Forge Terminal    │        Forge Git        │
│ (VS Code Altern.) │ (Postman Altern.)  │ (Modern PTY Shell)  │  (GitKraken Altern.)    │
│  Monaco + React   │ REST/GraphQL/WS/SSE│  xterm.js + PTY     │   Graph/Diff/Conflicts  │
└─────────┬─────────┴──────────┬─────────┴──────────┬──────────┴────────────┬────────────┘
          │                    │                    │                       │
          └────────────────────┼────────────────────┼───────────────────────┘
                               ▼                    ▼
          ┌─────────────────────────────────────────────────────────┐
          │         Forge Design System (@forgenexa/design-system)  │
          │  2026 Dark Theme · Tokens · UI Components · Icons       │
          └─────────────────────────────────────────────────────────┘
                               ▲                    ▲
          ┌────────────────────┴────────────────────┴───────────────┐
          │                    Forge Core (Go Packages)             │
          │  - pkg/workspace (In-memory FS cache, Watcher)          │
          │  - pkg/git (Porcelain Git, Diffs, Branches, Status)     │
          │  - pkg/pty (Process lifecycle, Shell session manager)   │
          │  - pkg/lsp (22-language AST symbols & diagnostics)      │
          │  - pkg/tasks (Bounded worker pool execution)            │
          │  - pkg/credentials (OS Keychain / Secret Service API)   │
          │  - pkg/settings (Atomic JSON persistence)               │
          │  - pkg/logger (Structured redact-safe logging)          │
          └─────────────────────────────────────────────────────────┘
```

---

## 2. Product Portfolio Specifications

### 2.1 Forge IDE (`forge`)
- **Foundation:** Electron 45.1.0 + React 19 + TypeScript 7.0.2 + Monaco Editor 0.52+ + Go Daemon.
- **Key Capabilities:**
  - Multi-tab editor with side-by-side splitting (`◫ Split`).
  - IntelliJ-style docked bottom tool window (Terminal, Problems, Tasks, Output, Daemon Health).
  - 22-language LSP registry and real-time compiler diagnostics (`go vet`, `tsc`, `py_compile`).
  - AST symbol extraction and definition navigation.
  - Image viewer (`.png`, `.svg`, `.webp`), binary file safety guard, and live Markdown preview.
  - Local AI code completion via Ollama FIM models with deterministic offline fallback.
  - Non-destructive autosave engine with dirty buffer protection.

### 2.2 Forge API (`forge-api` / Postman Alternative)
- **Protocol Support:** REST/HTTP (1.1, 2), GraphQL, WebSockets, Server-Sent Events (SSE), and gRPC.
- **Request Engine:**
  - Method selector, dynamic URL interpolator (`{{base_url}}`), query/path params.
  - Body modes: JSON, form-data, multipart with file uploads, raw binary, and x-www-form-urlencoded.
  - Authentication: None, Basic Auth, Bearer Token, API Key, OAuth 2.0 PKCE.
  - Dynamic cancellation with `context.Context` abort signals.
- **Response Visualizer:**
  - Real-time response time, HTTP status, payload size.
  - Syntax-highlighted JSON tree viewer, raw view, headers inspector.
  - Response search, copy, and export.
- **Collections & Test Runner:**
  - Multi-level nested folder structure.
  - Environment variables (Development, Staging, Production) with secret masking.
  - Pre-request script execution and post-response assertion sandbox.
  - OpenAPI 3.0 / Postman v2.1 collection import and export.
  - cURL one-click import and export.

### 2.3 Forge Terminal (`forge-terminal` / Modern Terminal Application)
- **Engine:** `node-pty` / Go PTY supervisor + `@xterm/xterm` v6.0.
- **Shell Support:** Native Zsh, Bash, sh on Unix/macOS; PowerShell and cmd.exe on Windows.
- **Multi-Pane Workspace:**
  - Horizontal and vertical split panes with dynamic keyboard navigation.
  - Session strip with tab renaming, color accents, and active process tracking.
- **Advanced Features:**
  - Built-in SSH profile manager with secure key storage.
  - Searchable scrollback buffer (up to 100,000 lines).
  - Configurable font rendering (Ligatures, JetBrains Mono, Fira Code).
  - Clean signal propagation (`SIGINT`, `SIGTERM`, `SIGHUP`) preventing zombie processes.

### 2.4 Forge Git (`forge-git` / GitKraken Alternative)
- **Engine:** Native installed Git binary wrapper via Go `pkg/git` with structured JSON output.
- **Interactive Graph:**
  - Topological branch and commit history visualizer with color-coded branch lanes.
  - Commit detail viewer showing author, GPG signature status, and affected files.
- **Staging & Worktree:**
  - File-level and hunk-level staging/unstaging.
  - Unified and split side-by-side diff viewers.
  - Safe discard actions with confirmation dialogs.
- **Merge & Conflict Resolution:**
  - Three-way visual merge conflict editor (Ours, Base, Theirs, Result).
  - Branch create, rename, delete, switch, merge, rebase, and cherry-pick.
  - Safety checks preventing force-pushes or destructive resets without explicit user confirmation.

### 2.5 Forge Core (`forge-core`)
- Independent Go module reusable across all ForgeNexa desktop applications and CLI tools.
- Strict standard library preference; external dependencies introduced only when strictly evaluated (e.g. `fsnotify`, `gin`).
- Goroutine safety guaranteed under the Go race detector (`-race`).

---

## 3. Technology Stack & Toolchain Constraints

| Layer | Standard Selection | Target Version | Selection Invariant |
|---|---|---|---|
| **Language Runtime** | Node.js LTS | `v20.x` / `v22.x` / `v24.x` | Active LTS / Latest stable |
| **Compiler** | TypeScript | `7.0.2` | Latest verified npm stable release |
| **Frontend Framework** | React + React DOM | `19.0.0` | React 19 concurrent compiler architecture |
| **Bundler / Tooling** | Vite + Rollup | `Vite 6.4.5` | Code splitting, sub-second HMR |
| **Editor Canvas** | Monaco Editor | `^0.52.2` | VS Code editing engine |
| **Terminal Canvas** | xterm.js | `^6.0.0` | High-performance canvas / WebGL terminal |
| **Desktop Shell** | Electron | `45.1.0` | Latest secure Chromium & Node runtime |
| **Backend Language** | Go | `1.26.4` / `1.27.3` | Pure Go concurrency, low memory footprint |
| **Local Persistence** | Atomic JSON / SQLite | SQLite 3 | Zero-corruption local ACID storage |

---

## 4. Security Architecture & Privacy Safeguards

1. **Context Isolation:** Electron `contextIsolation: true`, `nodeIntegration: false`, and strict `contextBridge` whitelist boundaries.
2. **Path Traversal Protection:** All filesystem access is normalized and bound to the workspace root (`ErrPathTraversalDenied`).
3. **Credential Storage:** Secrets, API tokens, and private SSH keys are stored in OS-level credential managers (macOS Keychain, Windows Credential Manager, Linux Secret Service) and never persisted in plaintext.
4. **Log Redaction:** All application loggers automatically mask authorization headers, bearer tokens, passwords, and private keys.
5. **AI Privacy Guarantee:** Telemetry is disabled by default. Source code is never uploaded to remote servers without explicit user-initiated requests.
