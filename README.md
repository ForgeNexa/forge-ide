# Forge IDE — Fast, Go-Powered Developer Workspace

[![Version](https://img.shields.io/badge/version-v0.2.0-blue?style=flat-square)](https://github.com/manish-npx/forge/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=flat-square&logo=go)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-0.52-1F6FEB?style=flat-square)](https://microsoft.github.io/monaco-editor/)
[![Electron](https://img.shields.io/badge/Electron-35.0-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Tests](https://img.shields.io/badge/tests-14%2F14%20passing-brightgreen?style=flat-square)](docs/TESTING.md)
[![Live Demo](https://img.shields.io/badge/Live%20Web%20IDE-Online-success?style=flat-square&logo=github)](https://manish-npx.github.io/forge/)

> **"Your workspace for building software."**  
> Built by **Yantra Works** · An open-source, local-first code editor and IDE combining Monaco Editor ergonomics, authentic **2026 Dark Theme**, **Material Icon Theme**, an **IntelliJ-style bottom tool window**, a **22-language LSP registry**, and optional **private local AI autocomplete**.

---

## 🔗 Quick Links
- **Live In-Browser IDE & Showcase:** [https://manish-npx.github.io/forge/](https://manish-npx.github.io/forge/)
- **Release Documentation:** [docs/RELEASING.md](docs/RELEASING.md)
- **Settings Reference Catalog:** [docs/SETTINGS_REFERENCE.md](docs/SETTINGS_REFERENCE.md)
- **22-Language LSP Registry:** [docs/LANGUAGE_SUPPORT.md](docs/LANGUAGE_SUPPORT.md)
- **Testing & Verification Matrix:** [docs/TESTING.md](docs/TESTING.md)
- **Contributing Guide:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## ⚡ What Makes Forge Different?

Unlike bloated monolithic editors that ingest gigabytes of RAM before typing a single character, Forge separates interface responsiveness from system operations:

```
+-------------------------------------------------------------------------+
|                  Electron Desktop Shell (Chromium Native)               |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                 Renderer (React 19 + Monaco Editor)               |  |
|  |  - 2026 Dark Theme (#121314) & Material Icon Theme                |  |
|  |  - Multi-tab surface with Split Editor (◫ Split)                  |  |
|  |  - Image Viewer (.png, .jpg, .svg) & Binary File Protection       |  |
|  |  - Live Markdown Preview (👁 Preview / ✎ Code)                    |  |
|  |  - Ghost-Text Local AI Autocomplete (Tab to Accept)               |  |
|  |  - Bottom Tool Window (Terminal, Problems, Output, Debug, Tasks)  |  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|                        contextBridge (preload.ts)                       |
|                                     v                                   |
|  +-------------------------------------------------------------------+  |
|  |                 Electron Main Process (Node.js PTY)               |  |
|  |  - Real interactive PTY terminals (node-pty, zsh, bash, powershell)|  |
|  |  - Language Server Protocol Manager (22 language daemons)         |  |
|  |  - Local AI Provider (Ollama / Qwen2.5-Coder FIM)                 |  |
|  |  - Structured Logging with secret redaction (~/.forge/logs)       |  |
|  |  - Settings persistence (~/.forge/settings.json)                  |  |
|  +-------------------------------------------------------------------+  |
+----------------------------------|--------------------------------------+
                                   | Line-delimited JSON-RPC 2.0 (stdio)
                                   v
+-------------------------------------------------------------------------+
|                    Go Backend Daemon (forge-daemon)                     |
|                                                                         |
|  - Sub-millisecond recursive file indexer (parallel WalkDir)            |
|  - Substring & full-text content search across 50,000+ files            |
|  - Respects .gitignore, node_modules, and binary exclusions             |
|  - Ultra-low memory footprint: ~1.20 MB resident allocation             |
|  - Path boundary enforcement (ErrPathTraversalDenied)                   |
+-------------------------------------------------------------------------+
```

---

## 🌟 Key Features

### 1. Modern Visual Hierarchy & Ergonomics
- **Authentic 2026 Dark Theme:** Based on `mrleemurray.theme-2026` (`#121314` deep charcoal background, `#BBBEBF` soft readable text, custom syntax tokens).
- **Material Icon Theme:** Crisp, recognizable file and folder icons for 50+ programming and configuration file extensions.
- **IntelliJ-Style Bottom Tool Window:** Terminal is docked strictly at the bottom. The Activity Bar terminal button directly triggers the bottom tool-window.
  - Multi-session tabs (`Session 1`, `Session 2`, etc.) with double-click tab renaming.
  - Shell profile selector (`Zsh`, `Bash`, `sh`, `PowerShell`, `Command Prompt`).
  - Side-by-side terminal splitting (`◫ Split`) and clear canvas action (`⎚ Clear`).
  - Drag resizer, maximize/restore toggle (`🗖` / `🗗`), and quick reset height (`↕`).

### 2. Searchable Settings Engine (Categories A to J)
- Accessible via `Cmd+,` or Activity Bar gear icon.
- Full category navigation: Appearance, Editor, Files & Autosave, Language, Formatting, Diagnostics, Terminal, Git, Extensions, and Advanced.
- Global search filter across all configuration properties.
- **Interactive JSON Settings Editor:** Raw JSON editor with real-time parse validation and apply action.
- **Reset to Defaults & Import/Export:** One-click reset, export to `forge-settings.json`, and import parsing.

### 3. File Previews & Safety Safeguards
- **Interactive Image Viewer:** Common raster and vector image formats (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.ico`, `.svg`) open in a checkered canvas viewer with zoom controls (`-`, `+`, `100%`).
- **Binary File Guard:** Prevents accidental modification or corruption of `.exe`, `.dll`, `.bin`, `.wasm`, `.zip`, and `.pdf` files.
- **Markdown Live Preview:** Toggle between raw Markdown source code and rendered HTML (`👁 Preview` / `✎ Code`).
- **Split Editor:** `◫ Split` button allows editing two files side-by-side.

### 4. Non-Destructive Autosave
- Configurable modes: `afterDelay` (with customizable delay), `onFocusChange` (window blur), or `off`.
- Safe dirty-state tracking with unsaved changes safeguard modal dialog on tab close.

### 5. 22-Language LSP Registry & Real Diagnostics
- Supports TypeScript/JS, Go, Python, Rust, C/C++, C#, Java, Swift, Kotlin, Dart, PHP, Ruby, HTML, CSS, JSON, YAML, TOML, SQL, Shell, Markdown, Dockerfile, and Terraform.
- Automatically detects installed language server binaries in system `PATH`.
- Aggregates real compiler diagnostics (`go vet`, `tsc`, `python -m py_compile`) into the **Problems** tool window.

### 6. Local-First AI Autocomplete (FIM Architecture)
- 100% private, zero-telemetry code completion using local Ollama models (`qwen2.5-coder:0.5b-base` or `1.5b-base`).
- Fill-In-The-Middle prompt formatting: `<|fim_prefix|>...<|fim_suffix|>...<|fim_middle|>`.
- Rendered as ghost text inline in Monaco Editor and accepted via `Tab`.
- Deterministic offline heuristic completion fallback when model daemon is inactive.

---

## 📊 Measured Performance Benchmarks

| Metric | Target | Actual Measurement (macOS ARM64) |
| :--- | :--- | :--- |
| **Go Daemon Cold Startup** | < 50ms | **12 milliseconds** |
| **Workspace Indexing (50 files)** | < 20ms | **1.2 milliseconds** |
| **Quick Open Search Latency** | < 5ms | **< 0.5 milliseconds** |
| **Go Daemon Resident Memory** | < 15 MB | **1.20 MB** resident heap |
| **Vite Production Bundle Build** | < 2s | **573 milliseconds** |
| **Full Monorepo Test Suite** | < 6s | **3.57 seconds** (14 automated flows) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v20.x or v22.x LTS (tested on v24.18.0)
- **Go:** 1.23+ (tested on Go 1.26.4 darwin/arm64)
- **Git**

### Installation
```bash
# 1. Clone repository
git clone https://github.com/manish-npx/forge.git
cd forge

# 2. Install monorepo dependencies
npm install

# 3. Compile Go daemon, protocol contracts, and web bundles
npm run build
```

### Running in Development Mode
```bash
# Launches Go daemon, Vite dev server, and Electron with Hot Module Replacement
npm run dev
```

### Running Automated Test Suite
```bash
# Executes Go race tests, TypeScript contract tests, and 14 functional flows
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
Copyright (c) 2026 Yantra Works.

### Third-Party Acknowledgements
- **Monaco Editor:** Microsoft Corporation ([MIT License](https://github.com/microsoft/monaco-editor))
- **2026 Dark Theme:** Lee Murray ([MIT License](https://marketplace.visualstudio.com/items?itemName=mrleemurray.theme-2026))
- **Material Icon Theme:** Philipp Kief ([MIT License](https://github.com/PKief/vscode-material-icon-theme))
- **Go Programming Language:** Google & Go Authors ([BSD-3-Clause](https://golang.org/LICENSE))
- **node-pty & xterm.js:** Microsoft Corporation ([MIT License](https://github.com/microsoft/node-pty))
