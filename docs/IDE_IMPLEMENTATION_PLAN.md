# Forge IDE Implementation Plan
**Product:** Forge — A Fast, Go-Powered Developer IDE  
**Company:** ForgeNexa  
**Target Version:** v0.3.0  
**Status:** In Progress  

---

## 1. Architectural Baseline & Gaps Identified

### Current Baseline
- **Desktop Shell:** Electron 35 with secure `contextIsolation: true`, `nodeIntegration: false`, and typed `contextBridge` (`preload.ts`).
- **Editor Engine:** Monaco Editor (`@monaco-editor/react` / `monaco-editor`).
- **Backend Service:** Compiled Go binary (`services/forge-daemon/bin/forge-daemon`) communicating via JSON-RPC 2.0 stdio with parallel `WalkDir` file indexing and regex content search.
- **Terminal:** `node-pty` native PTY shell connected to `@xterm/xterm` in desktop, sandbox shell in web preview.
- **Git:** Native CLI executor with branch switcher, diff editor, stage/unstage, and commit authoring.

### Gaps to Address
1. **Default Theme:** Currently defaulted to `graphite-dark`. Must be updated to **2026 Dark** (`mrleemurray.theme-2026` / `2026-dark.json`) with authentic neutral tones (`#121314` background, `#2A2B2C` borders, `#297AA0` primary accents) and custom Monaco token rules.
2. **Icon Theme:** Currently uses basic unicode/SVG icons. Must provide **Material Icon Theme** (`PKief.material-icon-theme`) with recognizable SVG glyphs for `go.mod`, `package.json`, `tsconfig.json`, `Dockerfile`, `.gitignore`, `README.md`, nested directories, and open/closed folder states.
3. **Tool Window Layout:** Bottom panel currently only had Terminal, Output, Problems (static), and Daemon Health. Needs an IntelliJ-style tool window layout with resizable drag handle, and functional tabs for:
   - Terminal (multi-session management)
   - Problems (live diagnostics markers)
   - Output (channel switcher: Go Daemon, Tasks, Git, Extensions)
   - Debug Console (REPL output)
   - Build / Tasks (real project tasks runner detecting `package.json`, `Makefile`, `go build`)
   - Test Results (test suite runner with pass/fail telemetry)
4. **Marketplace & Extensions:** Currently had a static list of 5 mock extensions. Needs a real Marketplace client (querying Open VSX / VS Code Gallery API), VSIX download/unpack, local persistence in `~/.forge/extensions`, enable/disable states, and explicit compatibility taxonomy.
5. **Website Separation:** GitHub Pages root was defaulting to the app. Root URL MUST be a dedicated product and documentation website, with an explicit route `#/web-ide` for the browser IDE.

---

## 2. Priority Implementation Roadmap

```
+-----------------------------------------------------------------------------------+
| Phase 1: Core Themes & Icons (P0/P1)                                              |
| - 2026 Dark theme token registration in design-system and Monaco engine           |
| - Material Icon Theme provider with comprehensive file/folder mapping             |
| - Settings persistence & theme switcher                                           |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 2: IntelliJ-Style Bottom Tool Window Layout (P1)                            |
| - Draggable panel resize handle with height memory                                |
| - Terminal multi-session management (+ New, switch, close)                        |
| - Build / Tasks real runner (package.json scripts, Makefile, go)                  |
| - Test Results runner with structured output                                      |
| - Problems panel hooked to Monaco markers                                         |
| - Multi-channel Output selector                                                   |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 3: Real Marketplace & Extension Management (P2)                             |
| - ExtensionManager in Electron main process                                       |
| - Open VSX / Marketplace API search and details query                             |
| - Local disk install/uninstall in ~/.forge/extensions                             |
| - Enabled/disabled toggle and persistence                                         |
| - Documentation of extension runtime boundaries                                   |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 4: Website Separation & Dedicated Web IDE (P1)                              |
| - Root landing page: Forge product website, docs, architecture, download links    |
| - Dedicated Web IDE route: #/web-ide with browser file storage & sandbox notices  |
| - GitHub Pages deployment verification                                            |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| Phase 5: Test Automation & Verification (P0)                                      |
| - Automated end-to-end flows in tests/functional_flows.test.ts                    |
| - TypeScript & Go test suites verification                                        |
| - Deployment to GitHub main and gh-pages                                          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Architecture

### Theme System (2026 Dark)
- Design tokens:
  - App & Editor Background: `#121314`
  - Sidebar & Activity Bar: `#191A1B`
  - Panels & Tool Windows: `#191A1B`
  - Borders: `#2A2B2C`
  - Accent / Buttons: `#297AA0`
  - Primary Selection: `#276782dd`
  - Focus Border: `#3994BCB3`
- Monaco syntax tokens:
  - Keywords & Storage: `#ff7b72`
  - Constants & Types: `#79c0ff`
  - Variables & Properties: `#ffa657`
  - Functions: `#d2a8ff`
  - Strings: `#a5d6ff`
  - Comments: `#8b949e`
  - Tags: `#7ee787`

### Material Icon Theme Adapter
- SVG icon definitions for:
  - Languages: Go, TypeScript, JavaScript, Python, Rust, HTML, CSS, C/C++, Java, Shell, Markdown.
  - Configs & Manifests: `package.json`, `tsconfig.json`, `go.mod`, `go.sum`, `Dockerfile`, `docker-compose.yml`, `.gitignore`, `.env`, `Makefile`, `README.md`, `LICENSE`.
  - Directories: Closed folder, Open folder, `src`, `test` / `tests`, `docs`, `cmd`, `pkg`, `dist` / `build`, `node_modules`, `.git`.

### Task & Test Runner Engine
- Reads `package.json` `scripts`, `Makefile` targets, or standard `go test` / `npm test` commands.
- Executes via child_process `spawn` with real-time stdout/stderr streaming to the Output and Tasks panels.
- Captures exit codes without shell-injection vulnerabilities.

### Extension System Architecture
- Endpoint: Open VSX API (`https://open-vsx.org/api/-/search`) with fallback to VS Code marketplace metadata.
- Storage: `~/.forge/extensions/`
- Manifest: `~/.forge/extensions.json` tracking enabled/disabled state and version metadata.
