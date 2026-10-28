# Forge — Broad Language Support & LSP Architecture

Forge is designed to support modern software development workflows across 20+ programming and configuration languages. It combines Monaco's instant browser/Chromium-native syntax highlighting and built-in TypeScript/JavaScript engine with external Language Server Protocol (LSP) daemons for full semantic intelligence (auto-completion, diagnostics, hover tooltips, definition jump, and code formatting).

---

## 1. Supported Language Registry (20+ Languages)

| Language | Default / Recommended LSP | Binary Name | Install Command | Bundled | Capabilities | License | SDK Prerequisite |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **TypeScript / JS** | Monaco built-in + `typescript-language-server` | `typescript-language-server` | `npm install -g typescript-language-server typescript` | **Yes** | Completion, Diag, Hover, Def, Format | MIT / Apache-2.0 | Node.js 18+ |
| **Go** | `gopls` | `gopls` | `go install golang.org/x/tools/gopls@latest` | No | Completion, Diag, Hover, Def, Format | BSD-3-Clause | Go 1.20+ |
| **Python** | `pyright` / `pylsp` | `pyright` | `npm install -g pyright` | No | Completion, Diag, Hover, Def, Format | MIT | Python 3.8+ or Node |
| **Rust** | `rust-analyzer` | `rust-analyzer` | `rustup component add rust-analyzer` | No | Completion, Diag, Hover, Def, Format | Apache-2.0 / MIT | Rust 1.70+ / Cargo |
| **C / C++** | `clangd` | `clangd` | `brew install llvm` / `apt install clangd` | No | Completion, Diag, Hover, Def, Format | Apache-2.0 (LLVM) | Clang / LLVM toolchain |
| **C# (.NET)** | `csharp-ls` | `csharp-ls` | `dotnet tool install --global csharp-ls` | No | Completion, Diag, Hover, Def, Format | MIT | .NET 8.0+ SDK |
| **Java** | Eclipse `jdtls` | `jdtls` | `brew install jdtls` | No | Completion, Diag, Hover, Def, Format | EPL-2.0 | JDK 17+ |
| **Swift** | `sourcekit-lsp` | `sourcekit-lsp` | Included with Xcode / Swift toolchain | No | Completion, Diag, Hover, Def, Format | Apache-2.0 | Xcode / Swift 5.9+ |
| **Kotlin** | `kotlin-language-server` | `kotlin-language-server` | `brew install kotlin-language-server` | No | Completion, Diag, Hover, Def, Format | Apache-2.0 | Java 17+ / Gradle |
| **Dart / Flutter** | Dart Analysis Server | `dart` | Bundled with Flutter / Dart SDK | No | Completion, Diag, Hover, Def, Format | BSD-3-Clause | Dart SDK 3.0+ |
| **PHP** | `intelephense` / `phpactor` | `intelephense` | `npm install -g intelephense` | No | Completion, Diag, Hover, Def, Format | Proprietary / MIT | PHP 8.0+ / Node.js |
| **Ruby** | `solargraph` | `solargraph` | `gem install solargraph` | No | Completion, Diag, Hover, Def, Format | MIT | Ruby 3.0+ |
| **HTML** | `vscode-html-language-server` | `vscode-html-language-server` | `npm install -g vscode-langservers-extracted` | **Yes** | Completion, Diag, Hover, Format | MIT | Node.js 18+ |
| **CSS / SCSS** | `vscode-css-language-server` | `vscode-css-language-server` | `npm install -g vscode-langservers-extracted` | **Yes** | Completion, Diag, Hover, Format | MIT | Node.js 18+ |
| **JSON** | `vscode-json-language-server` | `vscode-json-language-server` | `npm install -g vscode-langservers-extracted` | **Yes** | Completion, Diag, Hover, Format | MIT | Node.js 18+ |
| **YAML** | `yaml-language-server` | `yaml-language-server` | `npm install -g yaml-language-server` | No | Completion, Diag, Hover, Format | MIT | Node.js 18+ |
| **TOML** | `taplo` | `taplo` | `cargo install taplo-cli --locked` | No | Completion, Diag, Hover, Format | MIT | Cargo / Prebuilt binary |
| **SQL** | `sql-language-server` | `sql-language-server` | `npm install -g sql-language-server` | No | Completion, Diag, Format | MIT | Node.js 18+ |
| **Shell / Bash** | `bash-language-server` | `bash-language-server` | `npm install -g bash-language-server` | No | Completion, Diag, Hover, Def | MIT | Node.js 18+ |
| **Markdown** | `marksman` | `marksman` | `brew install marksman` | No | Completion, Diag, Hover, Def | MIT | Standalone binary |
| **Dockerfile** | `dockerfile-language-server-nodejs` | `docker-langserver` | `npm install -g dockerfile-language-server-nodejs` | No | Completion, Diag, Hover | MIT | Node.js 18+ |
| **Terraform** | `terraform-ls` | `terraform-ls` | `brew install hashicorp/tap/terraform-ls` | No | Completion, Diag, Hover, Def, Format | MPL-2.0 | Terraform CLI |

---

## 2. Detection & Graceful Fallback Strategy

1. **Zero Setup Startup**:
   - Web technologies (TypeScript, JavaScript, HTML, CSS, JSON) work immediately out-of-the-box using bundled Monaco workers.
2. **Environment Auto-Detection**:
   - `LspManager.getRegistry()` scans the system `PATH` via `which` (macOS/Linux) or `where` (Windows).
   - If a binary (e.g. `gopls` or `rust-analyzer`) is found, Forge automatically marks the language server as `available: true` and notes the detected binary path.
3. **Graceful Fallback**:
   - If an LSP binary is not installed, the editor automatically falls back to Monaco's built-in syntax highlighters and bracket matching, ensuring zero crashes, stalls, or missing editor functionality.
   - The IDE's Extensions and Bottom Panel display clear copy-pasteable install commands (e.g., `go install golang.org/x/tools/gopls@latest`).

---

## 3. Diagnostics Aggregation Pipeline

Forge aggregates diagnostics from three sources:
1. **Real-time Client-side Markers**: Generated directly by Monaco's Web Workers (TypeScript/JavaScript syntax errors, JSON schema violations).
2. **Background Compiler/Linter Verification**: The Go daemon and Electron `LspManager` invoke background linters (`go vet`, `python -m py_compile`, `tsc --noEmit`) when files are saved or modified, displaying compiler diagnostics with accurate file names, line numbers, and column offsets.
3. **Bottom Panel "Problems" Tab**: Displays the unified list of errors, warnings, and infos. Clicking any problem opens the file tab and jumps the cursor directly to the offending line and column.
