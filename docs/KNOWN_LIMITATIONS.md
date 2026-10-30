# Known Limitations & Compatibility Roadmap: forge
**Product:** forge  
**Company:** ForgeNexa  
**Last Updated:** 2026-10-28  

---

## 1. Extension Ecosystem Compatibility

### Truthful Status
**Monaco Editor does not natively provide the VS Code extension host runtime.**

| Capability | Current Status | Supported In | Notes |
|:---|:---|:---|:---|
| **TextMate Syntax Grammars** | Supported | v0.2.0 | Standard VS Code `.tmLanguage.json` grammars can be loaded directly |
| **Color Themes** | Supported | v0.2.0 | VS Code JSON theme tokens map to Monaco Editor theme definitions |
| **Language Intelligence (LSP)** | Ready | v0.2.0 | Language Server Protocol (e.g. `gopls`, `tsserver`, `rust-analyzer`) communicates via JSON-RPC |
| **Snippet Packs** | Supported | v0.2.0 | Standard TextMate snippets supported |
| **Node.js Extension Host (`vscode.*`)**| Not Supported | Planned (Phase 5) | Extensions relying on `vscode.window`, `vscode.commands`, and arbitrary Node.js subprocesses cannot run directly without an emulation layer |
| **Microsoft Marketplace** | Prohibited | N/A | Microsoft VS Code Marketplace terms of service prohibit non-VS Code clients; forge connects to **Open VSX Registry** |

---

## 2. Debugging & DAP (Debug Adapter Protocol)

- **Status:** **In Development**
- **Current Behavior:** The editor does not simulate fake debugging sessions. Users execute and test scripts using:
  1. The integrated **Run Current File** button (`▶`) with real stdout, stderr, and exit codes.
  2. The integrated **Interactive PTY Terminal** running `dlv`, `node --inspect`, or `gdb`.
- **Roadmap:** Full DAP client integration is scheduled for Phase 5.

---

## 3. Workspaces & Multi-Root Support

- **Current Status:** Single workspace folder mode is fully supported with recursive file indexing, file watching, and Git source control.
- **Roadmap:** Multi-root workspace configuration (`.code-workspace` files) is planned for Phase 5.

---

## 4. Shell Architecture & Electrobun Evaluation

- **Evaluation Outcome:** Retained Electron desktop shell; postponed migration to Electrobun v2.0.5.
- **Root Cause & Technical Constraints:**
  1. **Terminal Emulation (PTY):** Electrobun lacks a built-in cross-platform pseudo-terminal (PTY) binding for macOS, Linux, and Windows. Forge requires stable, high-throughput interactive PTY for shells, CLI workflows, and REPLs (`node-pty`).
  2. **Monaco Editor Rendering Consistency:** Monaco's cursor positioning, font metrics, and selection rendering are tightly optimized for Chromium. In macOS `WKWebView` and Linux `WebKitGTK`, subtle kerning and IME discrepancies were observed during evaluation benchmarks.
- **Prototype Preserved:** An isolated prototype and benchmark report are maintained in `experiments/electrobun-eval/` for future reconsideration once native PTY bindings land in Electrobun.

---

## 5. Local AI Autocomplete Hardware Requirements

- **Model Profiles:**
  - **Low Memory / Battery Mode:** `qwen2.5-coder:0.5b-base` (~600 MB RAM, <80ms latency on Apple Silicon / modern CPU).
  - **Standard Mode:** `qwen2.5-coder:1.5b-base` (~1.4 GB RAM, high semantic completion quality).
- **Privacy Guarantee:** 100% local, zero cloud telemetry, zero remote code upload.
- **Offline Fallback:** When Ollama / local daemon is inactive, the IDE gracefully degrades to local deterministic bracket/block heuristics with zero UI latency or errors.

---

## 6. Platform-Specific Verifications

- **macOS (Darwin ARM64 / x86_64):** Fully verified natively (Traffic lights titlebar, native dialogs, zsh PTY, Go daemon).
- **Windows (x64 / ARM64):** Cross-compiled binary support; uses PowerShell/CMD PTY; automated via GitHub Actions CI.
- **Linux (x64 / ARM64):** Cross-compiled binary support; uses Bash PTY; automated via GitHub Actions CI.
