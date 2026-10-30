# ADR 0001: Architecture Foundation & Process Boundaries for my-forge

- **Date:** 2026-10-28
- **Status:** Accepted
- **Author:** ForgeNexa Architecture Team
- **Product:** my-forge ("Your workspace for building software")

---

## 1. Context & Problem Statement

ForgeNexa is building **my-forge**, a modern, high-performance code editor with:
1. Fast startup (< 1.2s cold start) and responsive typing/navigation.
2. Immediate familiarity for Visual Studio Code users (Activity Bar, Explorer, Command Palette `Cmd+P`/`Cmd+Shift+P`, tabs, panels, status bar, shortcuts).
3. A clean, distraction-free visual design (Graphite Dark & Sand Light themes, restrained contrast, clear typography).
4. A Go-powered backend for performance-sensitive workspace operations (indexing, file scanning, search, watcher, metadata).
5. Cross-platform support (macOS, Windows, Linux).
6. Local-first privacy with no mandatory login, cloud dependency, or silent telemetry.

We must decide the architectural foundation: **Forking/modifying Code-OSS directly** versus **building a modular Electron + Monaco + Go daemon architecture**.

---

## 2. Options Considered

### Option A: Forking Code-OSS
- **Pros:**
  - 100% binary/API compatibility with the full `vscode` extension namespace (`vscode.window.*`, `vscode.commands.*`, etc.).
  - Existing mature workbench UI and internal extension host runtime.
- **Cons:**
  - Massive repository size (>1.5 GB, >50,000 files) with slow, fragile builds tied to specific Node/Python/yarn toolchains.
  - Deeply entangled Node.js IPC subsystems where injecting Go requires heavy patching across disparate TypeScript modules.
  - High risk of technical debt and maintenance burden when rebasing against upstream VS Code changes.
  - Legal & trademark constraints: Microsoft Marketplace terms forbid third-party clients; official VS Code branding must be scrubbed completely.

### Option B: Modular Architecture (Electron + Monaco Editor + Go Daemon)
- **Pros:**
  - **Clean process boundaries**: Frontend renderer, Electron main process, and Go backend communicate via typed, versioned IPC/JSON-RPC protocols.
  - **Go leverage**: Performance-critical operations (workspace indexing, ripgrep-style file search, Git integration, file watching) run natively in compiled Go with low memory and multi-core efficiency.
  - **Editor fidelity**: Monaco Editor provides the exact same core editor engine, syntax highlighting, text model buffer, and keybinding mechanisms as VS Code.
  - **Lightweight startup**: Cold startup under 1 second without hundreds of unused legacy modules.
  - **Customizable design**: Direct control over the sleek, restrained design system without wrestling with Code-OSS legacy CSS.
- **Cons:**
  - Monaco does not natively provide the full VS Code extension host (`vscode.*` namespace APIs).
  - Extensions requiring the full UI contribution points require an explicit shim or adopting open standards (Language Server Protocol - LSP, Debug Adapter Protocol - DAP, TextMate grammars, and Open VSX APIs).

---

## 3. Decision

We choose **Option B: Modular Architecture (Electron + Monaco Editor + Go Backend)** with a staged extension compatibility path:

1. **Desktop Shell:** Electron (Node.js runtime for main process, window management, native menus, secure preload bridge).
2. **Editor Engine:** Monaco Editor (browser-based ESM bundle of the battle-tested VS Code editor).
3. **Frontend Workbench:** React + TypeScript design system implementing the familiar VS Code layout (Activity Bar, File Explorer, Editor Tabs, Bottom Panels, Command Palette, Quick Open, Status Bar).
4. **Backend Daemon:** Go (`forge-daemon`), running as a long-lived local subprocess communicating via JSON-RPC 2.0 over standard I/O (or platform-specific private local sockets).
5. **Extension Compatibility Strategy:**
   - **Phase 1 (Core):** Native language support via Monaco + Language Server Protocol (LSP) over Go/Node bridges.
   - **Phase 2 (Themes/Grammars):** VS Code TextMate syntax grammars and JSON theme compatibility.
   - **Phase 3 (Extensions):** Modular extension runner supporting WebExtensions and Open VSX registry queries, with explicit documentation of unsupported proprietary APIs.

---

## 4. Process Boundaries and Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              Electron Shell                             |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                         Renderer Process                          |  |
|  |  [ Activity Bar ]  [ Explorer Sidebar ]  [ Monaco Editor Surface ] |  |
|  |  [ Bottom Panel: Terminal / Output / Problems ]   [ Status Bar ]   |  |
|  |  [ Command Palette / Quick Open (Cmd+P / Cmd+Shift+P) ]           |  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|                          contextBridge (preload.ts)                     |
|                                     v                                   |
|  +-------------------------------------------------------------------+  |
|  |                            Main Process                           |  |
|  |  - Window Lifecycle & Native Menus                                |  |
|  |  - IPC Router (Electron <-> Go Daemon)                            |  |
|  |  - Process Supervisor (spawns & monitors forge-daemon)            |  |
|  |  - Graceful Shutdown & Crash Recovery                             |  |
|  +-------------------------------------------------------------------+  |
+----------------------------------|--------------------------------------+
                                   | stdio / Unix Domain Socket (JSON-RPC 2.0)
                                   v
+-------------------------------------------------------------------------+
|                        Go Daemon (forge-daemon)                         |
|                                                                         |
|  - JSON-RPC 2.0 Dispatcher (typed request/response/notifications)       |
|  - Workspace File Indexer (parallel directory traversal)               |
|  - File Discovery & Metadata Provider                                   |
|  - Respects .gitignore, .forgeignore, and binary exclusions             |
|  - Memory-efficient file caching & incremental indexing                |
+-------------------------------------------------------------------------+
```

---

## 5. Security & Privacy Guarantees

- **No Mandatory Accounts:** Zero sign-up, registration, or activation locks.
- **Local-First:** All files, indices, and settings reside strictly on the local machine.
- **No Telemetry by Default:** Network calls to external telemetry services are disabled.
- **Sandboxed IPC:** Electron `nodeIntegration: false`, `contextIsolation: true`, strictly typed RPC APIs exposed via `window.myForgeAPI`.
- **Private Go Daemon:** Daemon binds only to stdio or local filesystem sockets with restricted permissions (0600), preventing unauthorized local network access.
