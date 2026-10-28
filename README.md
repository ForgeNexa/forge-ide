# forge — A Fast, Go-Powered Code Editor
### By Yantra Works
**"Your workspace for building software."**

[![Go](https://img.shields.io/badge/Go-1.26+-00ADD8?style=flat-square&logo=go)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-35.0-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 📖 Summary & Description

**forge** (formerly *my-forge*) is a modern, high-performance desktop code editor built by **Yantra Works**. It combines the immediate familiarity and ergonomics of Visual Studio Code with a cleaner, sleeker visual interface and a dedicated **Go-powered native backend daemon** (`forge-daemon`). 

Unlike heavy monolithic editors, **forge** is local-first, privacy-respecting, and engineered with clean process boundaries. The TypeScript frontend and Monaco editor surface handle fluid typing and UI interactions, while the compiled Go service handles performance-critical operations—such as multi-threaded workspace indexing, lightning-fast file discovery, and sub-millisecond search—over a private, typed JSON-RPC 2.0 communication channel.

---

## ⚡ Key Highlights & Features

- **VS Code Familiarity:** 
  - Full Activity Bar with Explorer, Search, Source Control, Run & Debug, and Extensions views.
  - Multi-tab editor with dirty state tracking, close actions, and smooth keyboard navigation.
  - **Quick Open (`Cmd+P` / `Ctrl+P`)** with sub-millisecond fuzzy search powered by Go.
  - **Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)** for instant workspace actions.
  - Integrated bottom panel for Terminal, Output logs, Problems, and live Go Daemon telemetry.
  - Status bar tracking Git branch, Cursor Ln/Col, File Encoding (UTF-8), Language mode, and Go indexing speed.
- **Go-Powered Backend Daemon:**
  - Standalone compiled Go binary (`forge-daemon`) communicating over private stdio/IPC using line-delimited JSON-RPC 2.0.
  - Parallel directory traversal (`WalkDir`) automatically respecting `.gitignore`, `node_modules`, and binary file exclusions.
  - Path traversal security boundaries (`ErrPathTraversalDenied`) preventing access outside the authorized workspace root.
  - Live memory and goroutine telemetry reported in real-time to the developer status bar.
- **Sleek, Distraction-Free Visual Design:**
  - **Graphite Dark Theme:** Restrained dark graphite surface (`#141619`) with crisp typography and subtle borders (`#22262d`).
  - **Sand Light Theme:** Polished high-contrast light theme (`#f6f8fa`) for daylight coding.
  - Smooth native macOS `hiddenInset` traffic light integration.
- **Local-First & Privacy Guaranteed:**
  - Zero mandatory accounts, sign-ins, or cloud dependencies.
  - No silent telemetry or tracking; your source code never leaves your local machine.

---

## 🏗️ Architecture & Process Boundaries

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

---

## 📊 Performance Benchmarks (macOS ARM64)

| Metric | Target | Actual Measurement |
| :--- | :--- | :--- |
| **Workspace Indexing** | < 50ms | **1 millisecond** (40 files / 23 directories) |
| **Quick Open Search Latency** | < 10ms | **< 0.5 milliseconds** via Go daemon |
| **Go Daemon Memory (Alloc)** | < 20 MB | **1.20 MB** resident allocation |
| **Vite Bundle Build** | < 2s | **338 milliseconds** |
| **Test Suite Execution** | < 5s | **1.6 seconds** (with Go race detector) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18 (Tested on v24.18)
- **Go** >= 1.22 (Tested on go1.26.4 darwin/arm64)
- **macOS, Linux, or Windows**

### Installation & Build
```bash
# 1. Clone the repository
git clone https://github.com/manish-npx/forge.git
cd forge

# 2. Install workspace dependencies
npm install

# 3. Build all TypeScript packages, renderer bundle, and Go binary
npm run build
```

### Running Tests
```bash
# Runs Go unit tests with race detection and TypeScript protocol tests
npm test
```

### Launching the Desktop Application
```bash
# Launch the forge desktop editor
npm start
```

---

## 🏷️ Tags & Keywords

`code-editor` • `developer-tools` • `golang` • `electron` • `monaco-editor` • `react` • `typescript` • `json-rpc` • `desktop-app` • `yantra-works` • `performance` • `local-first` • `vscode-alternative`

---

## 💬 Social Hashtags

`#forge` `#CodeEditor` `#GoLang` `#ElectronJS` `#TypeScript` `#MonacoEditor` `#DeveloperTools` `#OpenSource` `#YantraWorks` `#DevTools` `#SoftwareEngineering`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
