# Forge IDE — Prioritized Implementation Plan

**Author:** Principal Systems Architect & Lead IDE Engineer  
**Date:** 2026-10-28  
**Repository:** `https://github.com/ForgeNexa/forge-ide`  
**Current Baseline:** Version 0.2.0 (Electron 35 + React 19 + Monaco Editor + Go Daemon)  

---

## 1. Overview & Strategy

Following the comprehensive audit in `docs/PROJECT_REQUIREMENTS_AUDIT.md`, this plan outlines prioritized, reviewable engineering milestones to address all remaining, incomplete, or unverified requirements.

Every milestone follows the strict quality rules:
- Real functionality, zero mock UI.
- Direct automated test coverage with passing results.
- Zero destructive git operations; all changes committed to feature branches.
- Clear documentation of capabilities and limitations.

---

## 2. Milestone Roadmap

```
+-----------------------------------------------------------------------------------+
| Milestone 1: LSP Full-Duplex Stdio Streaming (Go & TypeScript)   [CURRENT FOCUS]  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Milestone 2: Background File Watcher (fsnotify) in Go Daemon                      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Milestone 3: Drag-and-Drop Tree Operations & Extension Contributions              |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Milestone 4: Multi-Provider AI Chat Panel (Ollama + OpenAI/Gemini)               |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Milestone 5: Cross-Platform Desktop Packaging Matrix (macOS, Windows, Linux)     |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Milestone Specifications

### Milestone 1: Full-Duplex Stdio LSP Streaming (Go & TypeScript)
- **Objective:** Upgrade the current linter-based diagnostic engine (`go vet`, `tsc --noEmit`) to full-duplex stdio Language Server Protocol streaming for `gopls` (Go) and `typescript-language-server` (TypeScript).
- **Features:**
  1. Live hover tooltips (`textDocument/hover`).
  2. Jump-to-definition (`textDocument/definition`).
  3. Document symbols for breadcrumbs and outline view (`textDocument/documentSymbol`).
  4. Real-time background diagnostics on keystroke without saving to disk.
- **Verification:** Unit tests simulating LSP JSON-RPC request/response exchange over stdio; integration test in `tests/functional_flows.test.ts`.

### Milestone 2: Go Daemon File Watcher (`fsnotify`) Event Streaming
- **Objective:** Implement real-time filesystem watching in `services/forge-daemon` using `github.com/fsnotify/fsnotify`.
- **Features:**
  1. Watch the active workspace root recursively, filtering out `.git/`, `node_modules/`, and binary build folders.
  2. Stream JSON-RPC 2.0 notifications (`workspace/fileCreated`, `workspace/fileModified`, `workspace/fileDeleted`) over stdout to Electron.
  3. Automatic tree refresh in the React UI without requiring manual re-indexing.
- **Verification:** Go unit tests in `services/forge-daemon/pkg/workspace` asserting file event dispatch within 50ms of filesystem modification.

### Milestone 3: Drag-and-Drop Tree Operations & Declarative Extensions
- **Objective:** Complete UI ergonomics for the FileTree and expand Open VSX contribution support.
- **Features:**
  1. HTML5 drag-and-drop to move files and folders between directories in the tree.
  2. Safe confirmation dialog when moving directories.
  3. Declarative TextMate syntax and code snippet loader for installed `.vsix` packages from Open VSX.
- **Verification:** Cypress or Node.js DOM simulation tests for file move operations via daemon `workspace/renameEntry`.

### Milestone 4: Multi-Provider AI Chat Panel (Ollama + OpenAI/Gemini)
- **Objective:** Add an interactive AI assistant panel in the activity bar alongside local FIM code completion.
- **Features:**
  1. Chat view in the sidebar with streaming Markdown rendering and code blocks.
  2. Provider selector: Local Ollama (default), OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), Google Gemini.
  3. Secure encrypted local credential storage using OS keychain or AES-256.
  4. "Send Selection to AI" context menu command in Monaco editor.
- **Verification:** Mock provider test verifying streaming chunk assembly and secret redaction in logs.

### Milestone 5: Cross-Platform Electron Desktop Packaging Matrix
- **Objective:** Automate production cross-platform installer generation in GitHub Actions.
- **Features:**
  1. macOS: `.dmg` and `.zip` for Apple Silicon (`arm64`) and Intel (`x64`).
  2. Linux: `.AppImage`, `.deb`, and `.tar.gz` for `x64` and `arm64`.
  3. Windows: `.exe` (NSIS installer) and portable `.zip` for `x64`.
  4. Automated SHA256 checksum generation for all release artifacts.
- **Verification:** Local dry-run of `electron-builder --dir` on macOS; CI execution on GitHub Actions.
