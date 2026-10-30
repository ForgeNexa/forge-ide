# Forge Extension Compatibility Matrix
**Product:** Forge (by ForgeNexa)  
**Target Runtime:** Electron 35 + Monaco Editor 0.52 + Node.js 20+  

---

## 1. Architectural Model & Extension Boundaries

Forge uses Monaco Editor for editing and a compiled Go daemon for filesystem indexing. Unlike standard VS Code, Forge does **not** unconditionally embed the full internal VS Code Extension Host process.

Because of this architectural distinction, Forge categorizes extension capabilities into three tiers:

```
+-----------------------------------------------------------------------------------+
| Tier 1: Fully Native & Activated                                                 |
| - Color Themes (JSON / TextMate theme contributions)                              |
| - File & Folder Icon Themes (Material Icon Theme, minimal, custom SVG sets)       |
| - Keymaps & Shortcuts definitions                                                |
| - Language Configuration (brackets, comments, indentation rules)                 |
| - TextMate Syntaxes & Grammars (Monaco tmGrammar integration)                     |
+-----------------------------------------------------------------------------------+
| Tier 2: LSP & External Tool Adapters                                             |
| - Language Server Protocol (LSP) servers (gopls, rust-analyzer, tsserver)         |
| - External Linters & Formatters (Prettier, ESLint, gofmt, rustfmt)               |
| - Task Definitions & Process Runners                                             |
+-----------------------------------------------------------------------------------+
| Tier 3: Requires Full VS Code Extension Host (Explicitly Disclosed)              |
| - Complex Node/V8 extensions relying on vscode.* internal private APIs            |
| - Custom Webview Panels without webview bridging                                 |
| - Proprietary Debug Adapters (requiring vscode-debugadapter proprietary wrappers) |
+-----------------------------------------------------------------------------------+
```

---

## 2. Tested Extensions Compatibility Status

| Extension ID | Name | Category | Compatibility Tier | Status in Forge | Notes |
|---|---|---|---|---|---|
| `mrleemurray.theme-2026` | 2026 Dark | Theme | Tier 1 | **Native (Default)** | Bundled as default IDE theme with authentic palette. |
| `PKief.material-icon-theme` | Material Icon Theme | Icon Theme | Tier 1 | **Native (Default)** | Bundled as default file/folder icon theme. |
| `github.github-vscode-theme` | GitHub Themes | Theme | Tier 1 | **Compatible** | Full JSON color palette loaded dynamically into Monaco. |
| `golang.go` | Go Language Support | Language / LSP | Tier 2 | **LSP Ready** | Go daemon integration and `gopls` language server. |
| `rust-lang.rust-analyzer` | Rust Analyzer | Language / LSP | Tier 2 | **LSP Ready** | Rust language syntax and `rust-analyzer` execution. |
| `ms-vscode.vscode-typescript-next` | TypeScript | Language | Tier 1 | **Native** | Monaco built-in TypeScript/JavaScript compiler service. |
| `ms-python.python` | Python | Language / Debug | Tier 3 | **Partial** | Syntax and runner functional; debug adapter requires DAP server. |
| `eamodio.gitlens` | GitLens | SCM / Views | Tier 3 | **Unsupported** | Requires proprietary VS Code treeview APIs; Forge provides native Git UI instead. |

---

## 3. Extension Lifecycle & Storage

- **Installation Directory:** `~/.forge/extensions/`
- **Metadata Registry:** `~/.forge/extensions.json`
- **Marketplace Endpoints:**
  - Search: `https://open-vsx.org/api/-/search?query={q}`
  - Extension Details: `https://open-vsx.org/api/{publisher}/{name}`
  - Package Download: Direct `.vsix` download over HTTPS
- **Safety Safeguards:**
  - VSIX packages are validated for `package.json` manifest.
  - Scripts inside extensions are sandboxed and cannot bypass Electron IPC boundaries.
  - Transparent support badges inform the user whether an extension runs natively or requires external runtimes.
