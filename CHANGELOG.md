# Changelog

All notable changes to **Forge IDE** (by ForgeNexa) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.1] - 2026-10-28

### Added
- **Go-First Backend Architecture (`services/forge-daemon`):**
  - Modularized backend logic from Electron TypeScript into pure, concurrent Go packages:
    - `pkg/git`: Full Git operations (`GetStatus`, `StageFile`, `Commit`, `GetDiff`, `Branches`, etc.) with zero Node.js heap overhead.
    - `pkg/lsp`: 22-language symbol extraction, cross-workspace definition discovery, hover signature documentation, and toolchain diagnostics.
    - `pkg/tasks`: Project task detection (`package.json`, `go.mod`, `Makefile`, etc.) and bounded concurrency runner streaming stdout/stderr chunks.
    - `pkg/settings`: Atomic JSON persistence (`.tmp` write + rename), defaults validator, and LRU recent workspaces history.
    - `pkg/ai`: Fill-In-The-Middle (FIM) tokenizer (DeepSeek, StarCoder, Qwen) and Ollama HTTP client with streaming context cancellation.
    - `pkg/api`: High-performance loopback HTTP REST service (`github.com/gin-gonic/gin v1.12.0`) bound to `127.0.0.1` with 16-byte random hex bearer token authentication.
    - `pkg/server`: Line-delimited JSON-RPC 2.0 stdio server handling bidirectional requests and notifications.
  - **Thread-Safety & Race Detector:** 100% verified clean with `go test -v -race ./...`.
  - **Desktop Integration:** `apps/desktop/src/daemonManager.ts` and `apps/desktop/src/main.ts` wired to call the Go daemon with transparent TypeScript fallback.
- **Documentation Deliverables:**
  - `docs/GO_BACKEND_ARCHITECTURE.md`: Complete package breakdown, Goroutine concurrency model, Gin loopback API spec, and IPC bridge.
  - `docs/CONCURRENCY_DESIGN.md`: Concurrency patterns, bounded semaphore worker pool, context cancellation, and mutex synchronization.
- **Requirements Audit & Architecture Reconciliation:**
  - Comprehensive 15-area requirements audit matrix in `docs/PROJECT_REQUIREMENTS_AUDIT.md`.
  - Architecture Decision Record (ADR) in `docs/ARCHITECTURE_DECISION.md` objectively evaluating Electron 35 vs Electrobun 2.0 vs Wails v2.
  - Empirical benchmark suite in `docs/BENCHMARKS.md` documenting live measurements on Apple M5 host vs unverified external estimates.
  - Prioritized engineering implementation plan in `docs/PROJECT_IMPLEMENTATION_PLAN.md`.
- **Milestone 1 — LSP Symbol Intelligence & Navigation:**
  - `getDocumentSymbols` extracting functions, classes, structs, interfaces, and types across Go, TypeScript, JavaScript, Python, and Rust.
  - `findDefinition` resolving symbol declarations within the file and across workspace paths.
  - `getHover` returning declaration signatures and doc comments for inspected identifiers.
  - Added automated test Flow 15 in `tests/functional_flows.test.ts` (16/16 passing).

---

## [0.2.0] - 2026-10-28

### Added
- **IntelliJ-Style Bottom Tool Window:**
  - Integrated terminal strictly docked at the bottom of the workbench (eliminated sidebar terminal).
  - Terminal session strip supporting multiple sessions (`Session 1`, `Session 2`, etc.) with double-click renaming.
  - Shell profile selector supporting `Zsh`, `Bash`, `sh`, `PowerShell`, and `Command Prompt`.
  - Side-by-side terminal splitting (`◫ Split`) for running simultaneous terminal tasks.
  - Dedicated `⎚ Clear` terminal action.
  - Vertical drag resizer, default height reset (`↕`), and maximize/restore toggle button (`🗖` / `🗗`).
  - Tool-window tabs: Terminal, Problems, Output, Debug Console, Build & Tasks, Test Results, and Go Daemon.
- **Searchable Settings Engine:**
  - Dedicated full-featured Settings page with categories A through J: Appearance, Editor, Files, Language, Formatting, Diagnostics, Terminal, Git, Extensions, and Advanced.
  - Interactive JSON Settings Editor with instant syntax validation and apply action.
  - Reset to Defaults, Export Settings (`forge-settings.json`), and Import Settings actions.
  - Keyboard shortcuts reference viewer.
- **File Previews & Safety Safeguards:**
  - Interactive image preview for `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.ico`, and `.svg` with checkered canvas and zoom controls.
  - Binary file safety guard preventing accidental text editing and corruption of `.exe`, `.dll`, `.bin`, `.wasm`, `.zip`, and `.pdf` files.
  - Live rendered Markdown preview (`👁 Preview` / `✎ Code`) with GitHub Flavored Markdown headings, task lists, blockquotes, and tables.
  - Split Editor side-by-side view (`◫ Split`).
- **Autosave Engine:**
  - Configurable modes: `afterDelay` (with customizable delay in ms), `onFocusChange` (window blur), or `off`.
  - Non-destructive dirty buffer tracking and safe file write persistence.
- **Language Intelligence & LSP (22 Languages):**
  - LSP registry covering TypeScript/JS, Go, Python, Rust, C/C++, C#, Java, Swift, Kotlin, Dart, PHP, Ruby, HTML, CSS, JSON, YAML, TOML, SQL, Shell, Markdown, Dockerfile, Terraform.
  - PATH binary auto-detection via `which` / `where`.
  - Real-time compiler diagnostics collection (`go vet`, `tsc`, `python -m py_compile`).
- **Local-First AI FIM Autocomplete:**
  - Zero-telemetry local Fill-In-The-Middle (FIM) provider using Ollama (`qwen2.5-coder:0.5b-base` / `1.5b-base`).
  - Monaco inline ghost text completion accepted via `Tab`.
  - Deterministic offline heuristic completion fallback when model daemon is inactive.
- **Structured Application Logging:**
  - Structured logging utility in `apps/desktop/src/logger.ts` with severity levels (`DEBUG`, `INFO`, `WARN`, `ERROR`), 5 MB log rotation, and token redaction.
  - Safe diagnostic export and log folder revelation.
- **Brand Identity & Application Icon:**
  - Master vector logo `assets/icons/forge.svg` featuring anvil and generative spark.
  - Linux desktop entry `assets/forge.desktop`.
- **CI/CD Automation:**
  - Cross-platform verification on `ubuntu-latest`, `macos-latest`, and `windows-latest` via GitHub Actions (`.github/workflows/ci.yml`).
  - Automated release workflow with Go daemon cross-compilation and SHA256 checksum generation (`.github/workflows/release.yml`).

### Changed
- Refactored `taskManager.ts` to pass raw command strings to `child_process.spawn({ shell: true })` eliminating Node.js `DEP0190` deprecation warning.
- Replaced dangerous `eval` in Debug Console with scoped function constructor evaluation.
- Standardized theme union across all components to `'2026-dark' | 'graphite-dark' | 'sand-light'`.
- Isolated functional unit tests from user home directory by adding optional `customConfigDir` parameter to `SettingsManager` and `ExtensionManager`.

### Fixed
- Fixed unhandled terminal dock location by removing sidebar terminal and binding Activity Bar terminal button to bottom panel.
- Fixed missing `css` and `json` language entries in `lspRegistry.ts`.
- Fixed potential data loss on unsaved tab close with confirmation modal dialog.

---

## [0.1.0] - 2026-10-28
- Initial functional baseline and Go daemon integration.
