# my-forge — A Fast, Go-Powered Code Editor
### By Yantra Works
**"Your workspace for building software."**

---

## 1. Overview

**my-forge** is a modern, high-performance code editor that feels immediately familiar to Visual Studio Code users while delivering a cleaner, sleeker visual interface and a dedicated Go-powered backend for performance-sensitive workspace indexing, file discovery, and search.

## 2. Architecture & Process Boundaries

```
+-------------------------------------------------------------------------+
|                        Electron Desktop Shell                           |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                    Renderer Process (Web / React)                 |  |
|  |  - Activity Bar (Explorer, Search, SCM, Debug, Extensions)         |  |
|  |  - Sidebar with Explorer Tree & Instant Search                    |  |
|  |  - Monaco Editor Engine (Syntax highlighting, keybindings, tabs)  |  |
|  |  - Bottom Panel (Terminal, Output, Problems, Go Telemetry)         |  |
|  |  - Quick Open (Cmd+P) & Command Palette (Cmd+Shift+P)             |  |
|  |  - Status Bar (Branch, Ln/Col, UTF-8, Lang, Theme, Go Stats)      |  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|                        contextBridge (preload.ts)                       |
|                                     v                                   |
|  +-------------------------------------------------------------------+  |
|  |                         Main Process                              |  |
|  |  - Window Lifecycle & macOS hiddenInset titlebar                  |  |
|  |  - Process Supervisor (spawns & manages forge-daemon)             |  |
|  |  - IPC Router (Electron <-> Go Daemon)                            |  |
|  |  - Native Dialogs (Folder picker, File picker)                    |  |
|  +-------------------------------------------------------------------+  |
+----------------------------------|--------------------------------------+
                                   | stdio line-delimited JSON-RPC 2.0
                                   v
+-------------------------------------------------------------------------+
|                   Go Backend Daemon (forge-daemon)                      |
|                                                                         |
|  - JSON-RPC 2.0 Engine (typed requests, responses, structured errors)   |
|  - High-performance Workspace File Indexer (parallel WalkDir)          |
|  - Fast File Discovery & Substring Search (sub-millisecond)             |
|  - Respects .gitignore, node_modules, and binary exclusions             |
|  - Memory-efficient file caching & safe path boundary checks            |
|  - Real-time Memory & Goroutine Telemetry                               |
+-------------------------------------------------------------------------+
```

## 3. Key Accomplishments

### Phase 1 — Repository Assessment & Architecture Decision
- [x] Initialized Git repository and monorepo structure.
- [x] Evaluated Code-OSS vs Electron + Monaco + Go architecture.
- [x] Authored Architecture Decision Record ([ADR 0001](file:///Users/manishyadav/Documents/Dev/gode-oss/docs/adr/0001-foundation-choice.md)).
- [x] Documented extension compatibility strategy and risk matrix.

### Phase 2 — Runnable Application Slice
- [x] Built Go backend service (`forge-daemon`) with JSON-RPC 2.0 engine, workspace scanner, and security boundaries.
- [x] Implemented `@my-forge/shared-protocol` with strict TypeScript types for all RPC models and client APIs.
- [x] Implemented `@my-forge/design-system` featuring **Graphite Dark** and **Sand Light** themes with subtle borders and refined contrast.
- [x] Built the Electron main process and preload bridge with typed IPC router.
- [x] Implemented the React workbench with Monaco Editor, Tab Management, File Tree, Activity Bar, Status Bar, Quick Open (`Cmd+P`), and Command Palette (`Cmd+Shift+P`).
- [x] Verified full build pipeline (`npm run build`) and test suite (`npm test`).

## 4. Getting Started

### Prerequisites
- Node.js >= 18 (Tested on v24.18)
- Go >= 1.22 (Tested on go1.26.4)
- macOS, Linux, or Windows

### Building the Project
```bash
# Install dependencies
npm install

# Build all packages, renderer bundle, and Go daemon binary
npm run build
```

### Running Tests
```bash
# Runs Go unit/race tests and TypeScript protocol tests
npm test
```

### Running the Application
```bash
# Launch the desktop editor
npm start
```
