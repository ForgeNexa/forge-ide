# Forge Migration Plan & Roadmap
**Version:** v0.3.0 to v0.5.0  
**Company:** Yantra Works  
**Status:** In Execution  

---

## 1. Migration Goals & Strategic Principles

1. **Lightweight & High-Performance:** Keep cold startup < 1.2s, idle RAM < 160MB, and indexing sub-millisecond.
2. **Reliable Tooling First:** A dependable editor with real PTY terminal, accurate Git diffs, and authentic language diagnostics is prioritized over flashy but broken mockups.
3. **Decoupled Architecture:** Maintain strict process isolation between the desktop shell (Electron), the web renderer (React + Monaco), the Go daemon, the LSP layer, and the Local AI provider.

---

## 2. Phase-by-Phase Execution Roadmap

```
+-----------------------------------------------------------------------------------+
| Phase 1: Baseline Audit & Framework Evaluation (Completed)                         |
| - Full audit of codebase, package scripts, Go daemon, and tests                   |
| - Baseline performance measurements (cold startup, memory, sizes)                 |
| - Electrobun evaluation and architectural decision (Retain Electron, Postpone EB) |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 2: Go Backend Hardening & Tooling (Milestone 3)                             |
| - Verify Go 1.26+ compatibility and run gofmt / go vet / race tests               |
| - Fix child_process spawn command sanitization (eliminate DEP0190)                |
| - Add structured JSON-RPC error handling & graceful process recovery              |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 3: Broad Language Support via Modular LSP Registry (Milestone 4)            |
| - Create language registry supporting TypeScript, Go, Python, Rust, C/C++, etc.  |
| - Language server lifecycle management (detect, spawn, pipe stdio)                |
| - Bridge diagnostics into Monaco markers and Bottom Tool Window Problems panel   |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 4: Lightweight Local-First AI Autocomplete (Milestone 5)                    |
| - Provider abstraction: Ollama / Tabby / Custom Local API / Offline Fallback      |
| - Support small FIM models (Qwen2.5-Coder 0.5B / 1.5B)                            |
| - Ghost-text Monaco inline completions provider (Tab to accept)                   |
| - Debounce, cancellation of stale requests, privacy controls (zero telemetry)     |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 5: CI/CD & Cross-Platform Release Packaging (Milestone 7)                   |
| - GitHub Actions CI workflow for macOS, Windows, Linux                            |
| - Artifact packaging, checksums, and release tagging automation                   |
| - Documentation, user verification, and gh-pages deployment                       |
+-----------------------------------------------------------------------------------+
```
