# Forge IDE — Reproducible Build & Packaging Guide

**Product:** Forge IDE (by Yantra Works)  
**Version:** 0.2.0  

---

## 1. Prerequisites

To build Forge across macOS, Linux, or Windows:
- **Node.js:** v20.x or v22.x LTS (verified on v24.18.0)
- **Go:** 1.23+ (verified on Go 1.26.4 darwin/arm64)
- **Package Manager:** `npm` (npm workspaces enabled)
- **C/C++ Toolchain:** Standard Xcode Command Line Tools (macOS), `build-essential` (Linux), or Visual Studio C++ Build Tools (Windows) for native PTY compilation (`node-pty`).

---

## 2. Monorepo Structure

```
.
├── apps
│   ├── desktop              # Electron main process, IPC handlers, PTY, LSP
│   └── renderer             # React, Monaco Editor, workbench components
├── packages
│   ├── design-system        # Shared CodeEdit CSS design tokens
│   └── shared-protocol      # TypeScript interfaces, settings schema, IPC contracts
├── services
│   └── forge-daemon         # Go daemon (indexing, search, file operations)
└── experiments
    └── electrobun-eval      # Isolated Electrobun benchmark prototype
```

---

## 3. Step-by-Step Build Commands

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Compile the Go Daemon
```bash
cd services/forge-daemon
go build -ldflags="-s -w" -o bin/forge-daemon cmd/forge-daemon/main.go
cd ../..
```

### Step 3: Build Monorepo Packages
```bash
npm run build
```
This triggers:
1. `@my-forge/shared-protocol`: compiles TypeScript contracts to `dist/`.
2. `@my-forge/design-system`: packages CSS tokens.
3. `@my-forge/renderer`: bundles React application via Vite to `dist/`.
4. `@my-forge/desktop`: compiles Electron main & preload scripts via TypeScript.

### Step 4: Run the Complete Test Suite
```bash
npm test
```
Executes:
- `test:go`: Go unit tests with race detection (`go test -v -race ./...`).
- `test:ts`: Shared protocol contract tests.
- `test:flows`: End-to-end functional flows 1 through 14.

---

## 4. Running Forge in Development Mode

```bash
npm run dev
```
Launches `concurrently`:
1. Go daemon in background with stdio JSON-RPC.
2. Vite development server on `http://localhost:5173`.
3. Electron window pointing to Vite dev server with hot module replacement (HMR).

---

## 5. Desktop Application Packaging

To package the Electron desktop application for the host operating system:
```bash
npm run package --workspace=@my-forge/desktop
```
Target outputs:
- **macOS:** `.dmg` and `.app` bundle in `dist/`
- **Linux:** `.AppImage` and `.deb` in `dist/`
- **Windows:** `.exe` NSIS installer in `dist/`
