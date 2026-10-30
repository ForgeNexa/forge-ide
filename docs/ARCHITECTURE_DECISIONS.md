# Architecture Decision Records (ADRs) — Forge IDE
**Company:** ForgeNexa  
**Status:** Approved & Implemented  
**Date:** 2026-10-28  

---

## ADR 0001: Foundation Choice (Monaco Editor & Go Daemon)

### Context
Building a modern code editor from scratch risks producing a toy editor lacking extension syntax, smooth cursor handling, and keybindings. Alternatively, adopting full VS Code OSS introduces hundreds of megabytes of legacy complexity.

### Decision
Adopt a hybrid modular architecture:
1. **Frontend / Editor Engine:** Monaco Editor with React and TypeScript.
2. **Backend Services:** Compiled Go daemon communicating via line-delimited JSON-RPC 2.0 over private stdio.

### Consequences
- **Positive:** Sub-millisecond recursive file traversal (`WalkDir`), instant Quick Open (`Cmd+P`), memory usage of only ~1.2MB for the daemon.
- **Negative:** Monaco alone does not run proprietary VS Code Node.js extension host plugins; extension compatibility must be explicitly classified and documented.

---

## ADR 0002: Desktop Shell Evaluation — Retain Electron, Postpone Electrobun

### Context
Electrobun 2.0.5 offers smaller application bundle sizes (~14MB vs ~185MB) and faster cold startup by utilizing Bun, Zig, and host OS webviews (macOS `WKWebView`, Windows `WebView2`, Linux `WebKitGTK`).

### Decision
**Retain Electron as the primary production desktop shell for Forge v0.3.0/v0.4.0**, and postpone full Electrobun migration. Preserve the Electrobun prototype in `experiments/electrobun-eval/`.

### Rationale
1. **Interactive Pseudo-Terminal (PTY) Reliability:** An IDE requires an interactive terminal emulator. `node-pty` relies on mature native C/C++ posix/winpty bindings. Electrobun currently lacks official Zig PTY bindings, causing terminal failures or broken job control.
2. **Monaco Font & Canvas Rendering Parity:** Monaco Editor is developed by Microsoft for Chromium. Running Monaco in macOS `WKWebView` or Linux `WebKitGTK` exhibits subtle font metrics and canvas subpixel rendering deviations.
3. **Packaging & Enterprise Distribution:** Electron has mature, production-proven notarization, code signing, and update tooling (`electron-builder`). Electrobun's `hutch` tool is rapidly evolving but not yet battle-tested across enterprise environments.

---

## ADR 0003: Backend Language Evaluation — Retain Go vs. Rust vs. Zig

### Context
Some developer editors use Rust (e.g. Zed) or Zig. We evaluated whether rewriting the Go daemon in Rust or Zig provides a concrete advantage.

### Decision
**Retain and improve the Go backend.** Do NOT rewrite in Rust or Zig without profiling evidence.

### Comparison & Trade-Offs

| Attribute | Go (Current) | Rust | Zig |
|---|---|---|---|
| **Directory Indexing** | ~1.2 ms (50 files) | ~0.9 ms | ~0.8 ms |
| **Search (Walk + Regex)** | Sub-millisecond | Sub-millisecond | Sub-millisecond |
| **Memory Footprint** | 1.20 MB Alloc | ~0.8 MB Alloc | ~0.5 MB Alloc |
| **Concurrency Model** | Goroutines & channels (superb, simple) | Async/await + Tokio (complex) | Async / event loop (evolving) |
| **Compile Speed** | Blazing fast (< 1s) | Slow (minutes on large deps) | Fast |
| **Maintainability** | Extremely readable, straightforward | Steep learning curve | Immature ecosystem |

### Conclusion
A 0.3ms theoretical difference in indexing 50 files does not justify discarding Go's unmatched concurrency ergonomics, cross-compilation simplicity, and developer velocity.

---

## ADR 0004: Local AI Architecture — Lightweight FIM Models via Provider Abstraction

### Context
Developers desire intelligent code autocomplete without privacy violations, telemetry, or network latency to cloud providers. Heavy chat LLMs (7B+ parameters) consume 8GB+ of VRAM/RAM and block responsiveness.

### Decision
1. **Focus:** Fast, inline ghost-text code completion, NOT heavy chat or multi-agent orchestration.
2. **Default Model:** `qwen2.5-coder:0.5b-base` or `qwen2.5-coder:1.5b-base` (or equivalent FIM-trained base code models).
3. **Inference Engine:** [Ollama](https://ollama.com/) local HTTP endpoint (`http://localhost:11434/api/generate`) or self-hosted Tabby server, with offline fallback.
4. **Prompt Format:** Fill-in-the-Middle (FIM) format:
   `<|fim_prefix|>{code_before}<|fim_suffix|>{code_after}<|fim_middle|>`
5. **Decoupled Provider Interface:** `LocalAIProvider` abstract class allowing users to select Ollama, Tabby, custom OpenAI-compatible local servers, or disable AI entirely.
6. **Privacy Guarantee:** Zero source code ever leaves the local machine. Network access is opt-in only.

---

## ADR 0005: Broad Language Support via Modular LSP Registry

### Context
An IDE needs syntax diagnostics, hover information, go-to-definition, and symbol navigation across multiple programming languages.

### Decision
Implement a modular Language Server Protocol (LSP) Registry:
1. Define language configurations declaratively (e.g., `go` -> `gopls`, `typescript` -> `typescript-language-server`, `python` -> `pyright` / `pylsp`, `rust` -> `rust-analyzer`).
2. Detect whether the language server is installed on the user's system; if absent, provide clear installation guidance without crashing.
3. Pipe diagnostics directly into the Monaco editor marker system (`monaco.editor.setModelMarkers`) and the Problems bottom tool window.
