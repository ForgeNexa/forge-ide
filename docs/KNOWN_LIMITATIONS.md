# Known Limitations & Compatibility Roadmap: forge
**Product:** forge  
**Company:** Yantra Works  
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

## 4. Platform-Specific Verifications

- **macOS (Darwin ARM64 / x86_64):** Fully verified natively (Traffic lights titlebar, native dialogs, zsh PTY, Go daemon).
- **Windows (x64 / ARM64):** Cross-compiled binary support; uses PowerShell/CMD PTY; automated via GitHub Actions CI.
- **Linux (x64 / ARM64):** Cross-compiled binary support; uses Bash PTY; automated via GitHub Actions CI.
