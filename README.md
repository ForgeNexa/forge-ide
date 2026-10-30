# Forge IDE — Fast, Go-Powered Developer Workspace

[![Version](https://img.shields.io/badge/version-v0.2.1-blue?style=flat-square)](https://github.com/ForgeNexa/forge-ide/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.26.4%20%7C%201.27.3-00ADD8?style=flat-square&logo=go)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-45.1.0-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-0.52+-1F6FEB?style=flat-square)](https://microsoft.github.io/monaco-editor/)
[![Tests](https://img.shields.io/badge/tests-16%2F16%20flows%20passing%20(%2B%20Go%20--race)-brightgreen?style=flat-square)](docs/TESTING.md)
[![Security](https://img.shields.io/badge/vulnerabilities-0%20(npm%20audit)-success?style=flat-square)](docs/DEPENDENCY_UPGRADE_AUDIT.md)
[![Live Demo](https://img.shields.io/badge/Live%20Web%20IDE-Online-success?style=flat-square&logo=github)](https://manish-npx.github.io/forge/)

> **"Your workspace for building software."**  
> Built by **ForgeNexa** · An open-source, local-first code editor and IDE combining Monaco Editor ergonomics, authentic **2026 Dark Theme**, **Material Icon Theme**, an **IntelliJ-style bottom tool window**, a **Go-First concurrent backend (`forge-daemon`)**, a **22-language LSP registry**, loopback HTTP REST API, and optional **private local AI autocomplete**.

---

## 🔗 Quick Links
- **Live In-Browser IDE & Showcase:** [https://manish-npx.github.io/forge/](https://manish-npx.github.io/forge/)
- **Go-First Backend Architecture:** [docs/GO_BACKEND_ARCHITECTURE.md](docs/GO_BACKEND_ARCHITECTURE.md)
- **Concurrency & Parallelism Design:** [docs/CONCURRENCY_DESIGN.md](docs/CONCURRENCY_DESIGN.md)
- **Dependency & Toolchain Upgrade Audit:** [docs/DEPENDENCY_UPGRADE_AUDIT.md](docs/DEPENDENCY_UPGRADE_AUDIT.md)
- **Performance Benchmarks & Empirical Measurements:** [docs/PERFORMANCE_BENCHMARKS.md](docs/PERFORMANCE_BENCHMARKS.md)
- **Performance Architecture & Go SSR Report:** [docs/PERFORMANCE_AUDIT.md](docs/PERFORMANCE_AUDIT.md)
- **Settings Reference Catalog:** [docs/SETTINGS_REFERENCE.md](docs/SETTINGS_REFERENCE.md)
- **22-Language LSP Registry:** [docs/LANGUAGE_SUPPORT.md](docs/LANGUAGE_SUPPORT.md)
- **Testing & Verification Matrix:** [docs/TESTING.md](docs/TESTING.md)
- **Release Documentation:** [docs/RELEASING.md](docs/RELEASING.md)
- **Contributing Guide:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## ⚡ What Makes Forge Different?

Unlike bloated monolithic editors that ingest gigabytes of RAM before typing a single character, Forge offloads heavy computational, filesystem, Git, LSP, and task execution logic from the single-threaded Node.js main process to a concurrent Go backend daemon (`forge-daemon`):

```
┌─────────────────────────────────────────────────────────────┐
│                    Forge Desktop UI (Electron)              │
│  React 19 + Monaco Editor + Xterm.js + Design System        │
│  - Authentic 2026 Dark Theme (#121314) & Material Icons     │
│  - Multi-tab surface with Split Editor (◫ Split)            │
│  - Image Viewer (.png, .jpg, .svg) & Binary File Guard      │
│  - Live Markdown Preview (👁 Preview / ✎ Code)              │
│  - Ghost-Text Local AI Autocomplete (Tab to Accept)         │
│  - Bottom Tool Window (Terminal, Problems, Tasks, Daemon)   │
└───────────────▲─────────────────────────────┬───────────────┘
                │ IPC                         │ IPC
┌───────────────┴─────────────────────────────▼───────────────┐
│               Electron Main Process (TypeScript 7)          │
│  - Window Management & Native Shell Dialogs                 │
│  - Daemon Lifecycle Coordinator (daemonManager.ts)          │
│  - Graceful Fallback Layer & Real Interactive PTYs          │
└───────────────▲─────────────────────────────┬───────────────┘
                │ stdio (JSON-RPC 2.0)        │ Loopback HTTP
                │ & Bidirectional Notifs      │ (Bearer Auth)
┌───────────────┴─────────────────────────────▼───────────────┐
│              forge-daemon (Go 1.26.4 / 1.27.3)              │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ pkg/workspace │  │    pkg/git    │  │     pkg/lsp     │  │
│  │ In-memory FS  │  │ Status/Diff/  │  │ 22-Language AST │  │
│  │ Index & Watch │  │ Stage/Commit  │  │ & Diagnostics   │  │
│  └───────────────┘  └───────────────┘  └─────────────────┘  │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │   pkg/tasks   │  │ pkg/settings  │  │     pkg/ai      │  │
│  │ Bounded Pool  │  │ Atomic Write  │  │ FIM Tokenizer   │  │
│  │ Stream Runner │  │ LRU Workspaces│  │ Ollama Client   │  │
│  └───────────────┘  └───────────────┘  └─────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      pkg/api (Gin v1.12.0 Loopback REST Engine)       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 1. Modern Visual Hierarchy & Ergonomics
- **Authentic 2026 Dark Theme:** Based on `mrleemurray.theme-2026` (`#121314` deep charcoal background, `#BBBEBF` soft readable text, custom syntax tokens).
- **Material Icon Theme:** Crisp, recognizable file and folder icons for 50+ programming and configuration file extensions.
- **IntelliJ-Style Bottom Tool Window:** Terminal is docked strictly at the bottom.
  - Multi-session tabs (`Session 1`, `Session 2`, etc.) with double-click tab renaming.
  - Shell profile selector (`Zsh`, `Bash`, `sh`, `PowerShell`, `Command Prompt`).
  - Side-by-side terminal splitting (`◫ Split`) and clear canvas action (`⎚ Clear`).
  - Drag resizer, maximize/restore toggle (`🗖` / `🗗`), and quick reset height (`↕`).

### 2. Go-First Backend & Fearless Concurrency
- **Native Go Git Operations:** Status, staging, commits, diffs, and branch switches run in pure Go with sub-millisecond execution times and zero Node.js heap consumption.
- **22-Language Lexical LSP:** Symbol extraction, cross-workspace definition discovery, hover signature documentation, and diagnostics coordination (`go vet`, `tsc`, `py_compile`).
- **Bounded Concurrency Task Runner:** Background builds run via a Goroutine worker pool with channel semaphores (default limit: 4 tasks), streaming stdout/stderr chunks asynchronously.
- **Loopback REST Engine:** Powered by `github.com/gin-gonic/gin v1.12.0` on `127.0.0.1` secured with 16-byte random hex bearer token authentication.
- **Thread-Safety Guaranteed:** 100% clean under Go's race detector (`go test -race ./...`).

### 3. Searchable Settings Engine (Categories A to J)
- Accessible via `Cmd+,` or Activity Bar gear icon.
- Full category navigation: Appearance, Editor, Files & Autosave, Language, Formatting, Diagnostics, Terminal, Git, Extensions, and Advanced.
- Global search filter across all configuration properties.
- **Interactive JSON Settings Editor:** Raw JSON editor with real-time parse validation and apply action.
- **Atomic Persistence & Import/Export:** Writes via atomic file rename (`.tmp` -> `.json`), export to `forge-settings.json`, and one-click reset to defaults.

### 4. File Previews & Safety Safeguards
- **Interactive Image Viewer:** Common raster and vector image formats (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.ico`, `.svg`) open in a checkered canvas viewer with zoom controls (`-`, `+`, `100%`).
- **Binary File Guard:** Prevents accidental modification or corruption of `.exe`, `.dll`, `.bin`, `.wasm`, `.zip`, and `.pdf` files.
- **Markdown Live Preview:** Toggle between raw Markdown source code and rendered HTML (`👁 Preview` / `✎ Code`).
- **Split Editor:** `◫ Split` button allows editing two files side-by-side.

### 5. Non-Destructive Autosave
- Configurable modes: `afterDelay` (with customizable delay), `onFocusChange` (window blur), or `off`.
- Safe dirty-state tracking with unsaved changes safeguard modal dialog on tab close.

### 6. Local-First AI Autocomplete (FIM Architecture)
- 100% private, zero-telemetry code completion using local Ollama models (`qwen2.5-coder:0.5b-base` or `1.5b-base`).
- Fill-In-The-Middle prompt formatting: `<|fim_prefix|>...<|fim_suffix|>...<|fim_middle|>`.
- Rendered as ghost text inline in Monaco Editor and accepted via `Tab`.
- Deterministic offline heuristic completion fallback when model daemon is inactive.

---

## 📊 Measured Performance Benchmarks

*Empirical measurements captured on Apple M5 (10-core ARM64), 24 GB RAM, macOS Darwin 27.0.1:*

| Metric / Operation | Target SLA | Measured Actual | Performance Advantage |
| :--- | :--- | :--- | :--- |
| **Go Daemon Cold Startup** | < 50 ms | **9.30 ms** | **5.3x faster than SLA** |
| **Full Workspace Index (2k files)** | < 100 ms | **5.03 ms** | **19.8x faster** |
| **Incremental File Cache Update** | < 5 ms | **< 0.05 ms** | **100x faster** |
| **Regex Content Search (2k files)** | < 200 ms | **20.26 ms** | **9.8x faster** |
| **Quick Open Search Latency (`Cmd+P`)**| < 10 ms | **~1.1 ms** | **Sub-millisecond UX** |
| **Go Native Git Status Check** | < 50 ms | **~4.5 ms** | **11x faster than TS exec** |
| **Go LSP Document Symbols (22 langs)** | < 10 ms | **~0.8 ms** | **12x faster** |
| **Go Loopback HTTP REST Latency** | < 5 ms | **~0.9 ms** | **Sub-millisecond loopback** |
| **Initial Critical JS Payload** | < 500 kB | **313.65 kB** | **-57.3% bundle reduction** |
| **Go Daemon Resident Memory (Idle)** | < 15 MB | **5.61 MB** | **Ultra-low footprint** |
| **Monorepo Build Time (All Workspaces)**| < 5 s | **1.30 s** | **Instantaneous builds** |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v20.x, v22.x LTS, or v24.x (tested on v24.18.0)
- **Go:** 1.26.4+ / 1.27.3 (tested on Go 1.26.4 darwin/arm64)
- **npm:** 10.x or 11.x
- **Git**

### Installation
```bash
# 1. Clone repository
git clone https://github.com/ForgeNexa/forge-ide.git
cd forge

# 2. Install monorepo dependencies cleanly
npm install

# 3. Compile Go daemon, protocol contracts, design system, and web bundles
npm run build
```

### Running in Development Mode
```bash
# Launches Go daemon, Vite dev server, and Electron desktop shell with HMR
npm run dev
```

### Running Automated Test Suite
```bash
# Executes Go unit & race tests, TypeScript contract tests, and 16 functional flows
npm test
```

### Building Cross-Platform Release Binaries
```bash
# Generates stripped standalone daemon binaries and SHA256SUMS.txt in release-artifacts/
npm run package:daemons
```

---

## ⌨️ Essential Keyboard Shortcuts

| Command | macOS Shortcut | Windows / Linux Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Quick Open** | `Cmd + P` | `Ctrl + P` | Fuzzy search files by path or jump to `:line` |
| **Command Palette** | `Cmd + Shift + P` | `Ctrl + Shift + P` | Execute any workspace command |
| **Toggle Terminal** | `Ctrl + \`` | `Ctrl + \`` | Open/close integrated bottom terminal |
| **Toggle Bottom Panel** | `Cmd + J` | `Ctrl + J` | Toggle bottom tool window |
| **Toggle Primary Sidebar** | `Cmd + B` | `Ctrl + B` | Toggle left sidebar visibility |
| **Save Active File** | `Cmd + S` | `Ctrl + S` | Save active buffer to disk |
| **Save As** | `Cmd + Shift + S` | `Ctrl + Shift + S` | Save buffer to new file path |
| **Preferences** | `Cmd + ,` | `Ctrl + ,` | Open Forge Settings dialog |
| **Format Document** | `Shift + Alt + F` | `Shift + Alt + F` | Format active document |

---

## 👥 Community & Contributing

We welcome community contributions! Please review our guidelines before opening an issue or submitting a pull request:
- **Contributing Guidelines:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Contributor Recognition:** [CONTRIBUTORS.md](CONTRIBUTORS.md)
- **Code of Conduct:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Security Policy:** [SECURITY.md](SECURITY.md)

---

## 📄 License & Attribution

Forge IDE is open-source software licensed under the [MIT License](LICENSE).  
Copyright (c) 2026 ForgeNexa.

### Third-Party Acknowledgements
- **Monaco Editor:** Microsoft Corporation ([MIT License](https://github.com/microsoft/monaco-editor))
- **2026 Dark Theme:** Lee Murray ([MIT License](https://marketplace.visualstudio.com/items?itemName=mrleemurray.theme-2026))
- **Material Icon Theme:** Philipp Kief ([MIT License](https://github.com/PKief/vscode-material-icon-theme))
- **Go Programming Language:** Google & Go Authors ([BSD-3-Clause](https://golang.org/LICENSE))
- **Gin Web Framework:** Gin-Gonic ([MIT License](https://github.com/gin-gonic/gin))
- **fsnotify:** fsnotify Authors ([BSD-3-Clause](https://github.com/fsnotify/fsnotify))
- **node-pty & xterm.js:** Microsoft Corporation ([MIT License](https://github.com/microsoft/node-pty))
