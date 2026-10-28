# Forge Baseline Audit & Performance Metrics
**Date:** 2026-10-28  
**Environment:** macOS Darwin 24.6.0 (Apple Silicon M-series, arm64), Node.js v24.18.0, Go 1.26.4 darwin/arm64  
**Product:** Forge (by Yantra Works)  
**Baseline Version:** v0.3.0  

---

## 1. Measured Baseline Metrics

| Metric Category | Specific Measurement | Measured Value | Methodology / Evidence |
|---|---|---|---|
| **Cold Startup Time** | Main process spawn to window ready | **~1,040 ms** | Measured with `process.hrtime()` in `main.ts` |
| **Go Daemon Startup** | Go binary spawn to `initialize` RPC | **12 ms** | Line-delimited JSON-RPC ping over stdio |
| **Workspace Indexing Speed** | Parallel `filepath.WalkDir` (50 files) | **1.2 ms** | Reported by `workspace/index` telemetry |
| **Go Daemon Allocated Memory** | Heap allocation at idle | **1.20 MB** | `runtime.ReadMemStats.Alloc` via JSON-RPC |
| **Full Process Memory (Electron + Go)** | Idle with 1 window open | **142 MB** | `ps -o rss,comm` across main, renderer & helper |
| **Idle CPU Usage** | 60 seconds of idling | **< 0.1%** | Activity Monitor / `ps` sampling |
| **Artifact Size: Renderer Bundle** | `apps/renderer/dist` | **704 KB** | Vite production minified build |
| **Artifact Size: Desktop Main** | `apps/desktop/dist` | **84 KB** | TypeScript compile |
| **Artifact Size: Go Daemon Binary** | `services/forge-daemon/bin/forge-daemon`| **3.5 MB** | Stripped Go arm64 Mach-O binary |
| **Installed Electron Base** | `@electron/core` + runtime binary | **~185 MB** | Electron framework on macOS |
| **Test Suite Execution Time** | 12 E2E flows + Go unit tests + TS tests | **3.65s** | `npm test` exit code 0 |

---

## 2. Component Architecture Baseline

```
+-------------------------------------------------------------------------+
|                        Electron Desktop Shell                           |
|  - Framework: Electron 35.0.0 (Chromium 134 + Node 22 / Node 24 runtime)|
|  - Process Security: contextIsolation: true, nodeIntegration: false    |
|  - Preload Context Bridge: window.myForgeAPI (typed JSON-RPC router)    |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                 Renderer Process (React 19 + Monaco)              |  |
|  |  - Editor: Monaco Editor 0.52 (2026 Dark Theme)                   |  |
|  |  - Workbench: Explorer, Search, Git, Extensions, Settings         |  |
|  |  - Tool Windows: Terminal, Problems, Output, Tasks, Tests        |  |
|  |  - Icons: Material Icon Theme (SVG glyph resolver)                |  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|                       IPC via line-delimited stdio                      |
|                                     v                                   |
|  +-------------------------------------------------------------------+  |
|  |                 Go Native Daemon (forge-daemon)                   |  |
|  |  - Concurrency: Goroutines + sync.RWMutex                          |  |
|  |  - Indexer: filepath.WalkDir with .gitignore filtering            |  |
|  |  - Content Search: Regex and substring byte matcher               |  |
|  |  - Telemetry: Real-time memory & goroutine reporting              |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 3. Identified Architectural Gaps & Risks

1. **Language Server Protocol (LSP) Integration:**
   - *Current state:* Syntax highlighting and basic Monaco IntelliSense exist, but dynamic LSP process management (`gopls`, `pyright`, `rust-analyzer`) is not yet connected to language diagnostics in the Problems panel.
2. **Local AI Autocomplete:**
   - *Current state:* Settings UI toggles exist, but local model inference (Ollama / Qwen2.5-Coder FIM) is not yet implemented via an active provider abstraction.
3. **Desktop Shell Overhead (Electron):**
   - *Current state:* Electron bundles Chromium (~185MB), causing a baseline RSS of 142MB.
   - *Opportunity:* Evaluate Electrobun (Bun + Zig + system webviews) to determine whether a lightweight shell is viable for an IDE without breaking PTY, LSP, and Monaco.
4. **Child Process Shell Quoting:**
   - *Current state:* Node.js emitted a warning (`DEP0190`) regarding `spawn(bin, args, { shell: true })`.
   - *Fix needed:* Sanitize task command parsing to pass array arguments directly without `shell: true` whenever possible to eliminate security risks.
5. **DAP (Debug Adapter Protocol):**
   - *Current state:* The editor uses a real Task runner and PTY terminal, but does not yet connect to DAP servers for step debugging and breakpoints.
