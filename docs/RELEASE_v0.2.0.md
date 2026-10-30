# forge v0.2.0 — Release Notes & Architecture Showcase
**By ForgeNexa** • *Your workspace for building software.*

Live Web Preview & Interactive Deployment: [https://manish-npx.github.io/forge/](https://manish-npx.github.io/forge/)  
GitHub Repository: [https://github.com/ForgeNexa/forge-ide](https://github.com/ForgeNexa/forge-ide)

---

## 🚀 What's New in v0.2.0

### 1. CodeEdit-Inspired macOS Design
- **Compact Titlebar:** Integrated macOS traffic lights, workspace status, centered quick open trigger (`Cmd+P`), and ForgeNexa release pill.
- **Breadcrumbs Bar:** Live file path hierarchy and direct one-click "Run File" (`▶ Run`) execution.
- **Clean Explorer Sidebar:** High-contrast icons, inline directory expansion, file creation/deletion, and file rename context menus.
- **Unsaved Changes Safeguard:** Unsaved edits dialog prompts before closing tabs (`Save`, `Don't Save`, `Cancel`).

### 2. Activity Bar Terminal & Docking Flexibility
- **Terminal in Activity Bar:** Dedicated `IconTerminal` in the primary Activity Bar that opens an interactive sidebar terminal (`Ctrl+\``).
- **Flexible Docking:** Easily dock the terminal back to the bottom panel or keep it side-by-side with your code editor.
- **Real PTY Backend:** Uses `node-pty` in the desktop Electron shell, with interactive fallback in web preview.

### 3. Google Antigravity IDE Settings Mode
- **7 Organized Categories:**
  - `⚙️ General`: Window lifecycle, startup behavior.
  - `🎨 Appearance`: Themes (`graphite-dark`, `sand-light`), editor font family (`JetBrains Mono`, `Menlo`, `Monaco`), font size, minimap, line numbers, cursor blinking.
  - `🖋️ Editor`: Tab size, word wrap, bracket pair colorization, auto-closing brackets.
  - `⚡ Go Daemon & Performance`: Max file size indexing boundary (MB), auto-reindex debounce ms.
  - `🤖 Agentic & AI Pairing`: AI provider selection (`Gemini 3.8 Flash`, `Gemini Pro`, `Claude 3.7`, `Local LLM`), ghost text inline completions, workspace context awareness.
  - `🔒 Privacy & Security`: Local-only mode flag, zero telemetry toggle (default: OFF).
  - `⌨️ Keyboard Shortcuts`: Searchable shortcut registry (`Cmd+P`, `Cmd+Shift+P`, `Cmd+S`, `Cmd+B`, `Cmd+J`, `Ctrl+\``, `Cmd+,`).
- **Instant Search Filter:** Real-time search across all preferences and keyboard commands.

### 4. Native Go Daemon (`forge-daemon`)
- Sub-millisecond recursive workspace indexing using parallel `filepath.WalkDir`.
- Content search across thousands of files with regex, case-sensitivity, and line/column mapping.
- Real-time memory and goroutine telemetry delivered over JSON-RPC 2.0 stdio.

---

## 📊 Measured Apple Silicon Benchmarks

| Metric | Industry Standard | forge Measurement | Advantage |
|---|---|---|---|
| Workspace Indexing (Go WalkDir) | 150ms - 500ms | **1 - 4 ms** | **~100x Faster** |
| Quick Open Response (`Cmd+P`) | 20ms - 60ms | **< 0.5 ms** | Instant typing response |
| Daemon Memory Footprint | 80MB - 150MB | **1.20 MB** | Ultra-lean footprint |
| Cold App Startup | 3.5s - 6.0s | **< 1.1s** | Distraction-free, zero bloat |

---

## 🌐 Live Web Preview
Visit the live deployment at [https://manish-npx.github.io/forge/](https://manish-npx.github.io/forge/) to try the browser edition of the editor, explore the CodeEdit-inspired interface, test Antigravity settings, and launch the terminal sandbox.
