# Architecture Decision Record (ADR): Desktop Shell & Backend Engine

**Status:** APPROVED (v0.2.0 Production Baseline)  
**Date:** 2026-10-28  
**Subject:** Desktop Shell Framework Evaluation (Electron vs. Electrobun vs. Wails) & Go Daemon Boundary  
**Context:** Forge IDE (`my-forge`), by **ForgeNexa**  

---

## 1. Context & Problem Statement

Forge IDE is designed to be a fast, distraction-free, cross-platform code editor and IDE. The user's original requirements call for:
1. High editing performance and memory efficiency.
2. A native **Go backend daemon** for workspace indexing, search, and file operations.
3. An objective architectural evaluation of **Electrobun vs. Electron**, with **Wails** evaluated as an additional candidate.
4. Guaranteed stability for interactive pseudo-terminals (PTY), Monaco Editor canvas rendering, language server protocols (LSP), and extensions.
5. Preservation of all existing user work and features.

A critical principle to establish upfront:
> **A Go backend daemon does not require Wails.** The choice of Go as a high-performance workspace indexing engine is completely independent of the desktop window manager shell. The Go daemon communicates cleanly over standard input/output using line-delimited JSON-RPC 2.0, allowing any desktop shell (Electron, Electrobun, Wails, or Tauri) to consume its services.

---

## 2. Evaluation Candidates

### Candidate A: Electron 35 (Current Baseline)
- **Architecture:** Node.js 22+ runtime bundled with Chromium webview.
- **Process Model:** Multi-process (Main process, Renderer process, Utility processes).
- **PTY Terminal:** Native bindings via `node-pty` (POSIX `openpty`/`forkpty` on macOS/Linux, ConPTY on Windows).
- **Editor Integration:** Monaco Editor runs on its native Chromium engine, guaranteeing pixel-perfect text metrics, font ligatures, and canvas rendering.
- **IPC Mechanism:** `ipcRenderer` / `ipcMain` with secure `contextBridge` isolation.

### Candidate B: Electrobun 2.0.5 (Experimental Prototype)
- **Architecture:** Bun JavaScript runtime paired with a Zig native layer, using the host operating system's native webview (macOS `WKWebView`, Windows `WebView2`, Linux `WebKitGTK`).
- **Disk Footprint:** Extremely small framework bundle (~14 MB vs. ~185-250 MB).
- **Startup:** Instant cold boot (~300-350 ms).
- **Current Limitations in v2.0:**
  1. **No Native PTY Support:** Electrobun lacks a native PTY binding library equivalent to `node-pty`. `Bun.spawn` cannot allocate pseudo-terminals with window resize signals (`SIGWINCH`), breaking interactive shells (zsh/bash/fish/PowerShell) and terminal programs (`vim`, `top`, `git log`).
  2. **WKWebView / Monaco Rendering Quirks:** Monaco Editor has documented rendering inconsistencies under macOS `WKWebView`, including subpixel font layout jitter, keydown event composition bugs with dead keys, and soft undo stack drops.
  3. **Development Toolchain Requirement:** Requires `bun` and `zig` installed on every developer machine and CI runner. (Neither `bun` nor `zig` is pre-installed on standard Linux distributions or this evaluation machine).

### Candidate C: Wails v2 (Go + System Webview)
- **Architecture:** Go desktop framework wrapping host OS webviews (macOS `WebKit`, Windows `WebView2`, Linux `WebKitGTK`) via CGO.
- **Promise:** Unified Go binary with embedded web frontend.
- **Current Limitations for a Professional IDE:**
  1. **Not a VS Code Drop-In:** Embedding the full VS Code Web workbench in Wails is not officially supported by Microsoft, requires maintaining a massive multi-gigabyte fork of `microsoft/vscode`, and violates Microsoft Marketplace terms.
  2. **Terminal Emulation Complexity:** Handling cross-platform PTY terminals in Go requires CGO bindings to `creack/pty` on Unix and complex Win32 ConPTY APIs on Windows. Electron's `node-pty` is far more mature.
  3. **Heavy Webview Fragmentation:** Linux distributions often package outdated `webkit2gtk` libraries that suffer from missing WebGL2 support, canvas font rendering bugs, and high memory leaks under long-running sessions.
  4. **Toolchain Availability:** Requires the `wails` CLI and webview headers, which are not currently installed on this environment.

---

## 3. Head-to-Head Architectural Comparison

| Dimension | Electron 35 (Production) | Electrobun 2.0 (Prototype) | Wails v2 (Evaluated) |
|---|---|---|---|
| **Primary Language** | TypeScript / Node.js | TypeScript / Bun / Zig | Go / CGO |
| **Web Engine** | Bundled Chromium | System Webview (WKWebView / WebView2 / WebKitGTK) | System Webview (WebKit / WebView2 / WebKitGTK) |
| **Monaco Compatibility** | **100% Native (Pixel-Perfect)** | Minor WebKit text metric quirks | Minor WebKit text metric quirks |
| **Interactive PTY Terminal** | **Production Ready (`node-pty`)** | **Blocked (No PTY Zig bindings)** | Complex (Requires manual CGO/ConPTY) |
| **Workspace Daemon Interop** | Stdio JSON-RPC 2.0 (`spawn`) | Stdio JSON-RPC 2.0 (`Bun.spawn`) | In-process Go calls or RPC |
| **Disk Size (Framework)** | ~257 MB | ~14 MB | ~18 MB |
| **Idle Memory (Workbench)** | ~140 - 170 MB | ~65 - 85 MB (Estimated) | ~80 - 110 MB (Estimated) |
| **Cold Startup Latency** | ~1,000 - 1,200 ms | ~300 - 350 ms (Estimated) | ~400 - 500 ms (Estimated) |
| **Linux Ecosystem Stability** | **Rock Solid (Chromium)** | Variable (host `webkit2gtk`) | Variable (host `webkit2gtk`) |
| **Packaging & Code Signing** | **Mature (`electron-builder`)** | Emerging (`hutch`) | Mature (`wails build`) |
| **Developer Toolchains Needed** | Node.js 18+, npm | Bun, Zig, native compilers | Go 1.22+, Wails CLI, webview dev headers |

---

## 4. The Decision: Electron + Go Daemon (Decoupled Architecture)

### Core Ruling
1. **Retain Electron 35 as the primary production desktop shell for Forge IDE.**
2. **Retain the Go daemon (`forge-daemon`) as the dedicated, high-performance workspace backend.**
3. **Preserve Electrobun as an experimental lightweight shell in `experiments/electrobun-eval/`.**
4. **Reject Wails as an IDE shell replacement at this time.**

### Justification
1. **Interactive Terminal is a Non-Negotiable IDE Feature:** A developer IDE without a 100% reliable interactive terminal with `zsh`, `bash`, and `powershell` PTY streaming is unusable. Electron provides battle-tested PTY support through `node-pty`. Electrobun does not yet have PTY primitives.
2. **Monaco Editor Stability:** Monaco Editor was created by Microsoft specifically for Chromium. Running it on Chromium guarantees identical behavior across macOS, Windows, and Linux without WebKit rendering divergences.
3. **Optimal Separation of Concerns:**
   - **Electron** handles what it does best: window management, cross-platform display, menu bars, traffic lights, and PTY processes.
   - **Go Daemon** handles what it does best: sub-millisecond recursive file-tree scanning (5.03ms for 2,000 files), parallel regex content search, and filesystem operations without blocking the JavaScript UI thread.
   - **React & Monaco** handle what they do best: fast, modular user interface and state-of-the-art code editing.

---

## 5. Future Migration Path (Electrobun & Wails)

Because all workspace operations, Git commands, and file operations communicate via standard line-delimited JSON-RPC 2.0 over standard I/O (defined in `packages/shared-protocol`), **the UI and Go daemon are 100% decoupled from Electron**:

```
+-------------------------------------------------------------+
|                      React 19 Renderer                      |
|                  (Monaco Editor + CodeEdit UI)               |
+-------------------------------------------------------------+
                              |
                              | Window IPC Boundary
                              v
+-------------------------------------------------------------+
|              Desktop Shell Layer (Swappable)                |
|  Current: Electron 35  |  Future Option: Electrobun / Wails |
+-------------------------------------------------------------+
                              |
                              | Standard Input/Output JSON-RPC 2.0
                              v
+-------------------------------------------------------------+
|               services/forge-daemon (Pure Go)               |
|      (WalkDir, Regex Search, CRUD, File Classification)      |
+-------------------------------------------------------------+
```

When Electrobun releases native PTY support (via Zig) and stabilizes Linux WebKitGTK bindings, Forge can transition its desktop shell without altering a single line of React UI or Go daemon code.

---

## 6. Evaluation: Go Server-Side Rendering (SSR) vs. Go-First Hybrid Backend

### Problem Evaluation
*Should Forge adopt Go Server-Side Rendering (SSR) with Go HTML templates to reduce frontend loading time and memory consumption?*

### Architectural Findings
1. **Desktop IDE Interactivity Bottleneck:** An IDE is not a static web document. The primary startup cost is initializing the Monaco Editor (canvas context, syntax tokenization Web Workers, text buffer allocation, line wrapping, and keyboard event loops). Go SSR cannot pre-render an interactive Monaco instance; the client-side JavaScript engine must still download, parse, and initialize Monaco regardless of whether the initial container HTML was served by Go or bundled locally.
2. **Local HTTP Overhead:** Implementing Go SSR in a desktop application introduces an unnecessary local loopback HTTP server in Go. The webview must make network requests over HTTP instead of loading pre-compiled assets directly from disk (`file://`).
3. **Hydration Penalty:** React cannot attach event handlers to server-rendered DOM nodes without executing a hydration pass that re-evaluates the client-side bundle, neutralizing any hypothetical startup gain.
4. **Website vs. Desktop IDE Distinction:**
   - **Public Website (`https://manish-npx.github.io/forge/`):** Pre-rendered HTML and SSR provide genuine SEO and First Contentful Paint (FCP) benefits for crawlers and initial visitors.
   - **Desktop Application:** Statically bundled React + Monaco loaded from local disk is strictly faster, more reliable, and completely offline-safe.

### Decision
- **Reject Go SSR for the Desktop IDE UI.**
- **Adopt the Go-First Hybrid Architecture:**
  - Keep **TypeScript / React 19** for the interactive IDE interface, optimized via code splitting and lazy loading.
  - Utilize **Go (`forge-daemon`)** aggressively for all computational, indexing, search, caching, and filesystem operations.

