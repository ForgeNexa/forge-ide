# Functional Audit: forge
**Product:** forge (formerly *my-forge*)  
**Company:** ForgeNexa  
**Audit Date:** 2026-10-28  
**Auditor:** Lead Systems Architect & Developer Tools Engineer

---

## 1. Executive Summary

This functional audit reviews the existing implementation of **forge** against the requirements of a production-ready, genuine Visual Studio Code alternative. The application currently consists of an Electron shell, React + Monaco Editor workbench, and a compiled Go daemon (`forge-daemon`) communicating over line-delimited JSON-RPC 2.0.

While the baseline foundation, Go indexer, and Monaco editor integration are cleanly architected, several critical workflows previously relied on static placeholders, simulated UI strings, or missing IPC routes. This audit catalogs every functional component, traces the data path, identifies root causes, and specifies the required fixes.

---

## 2. Component-by-Component Trace & Audit Matrix

| Feature | Current Implementation | Status | Evidence | Root Cause | Fix Implementation | Verification |
|---|---|---|---|---|---|---|
| **Terminal Integration** | `apps/renderer/src/components/BottomPanel.tsx` (lines 103-110) | **Broken (Simulated)** | Prints static text `forgenexa:~/workspace$ go version && git status` | No real PTY spawned; no IPC channel between renderer and native shell | Integrate `node-pty` in Electron main process, wire bi-directional IPC (`terminal:create`, `terminal:write`, `terminal:resize`, `terminal:data`), and render via `@xterm/xterm` in React | Run real shell commands (`pwd`, `git status`, `echo test`), verify exit code and process termination |
| **Git Status & Source Control** | `apps/renderer/src/App.tsx` (line 433: `branch="main"`), `ActivityBar.tsx` | **Broken (Hardcoded / Missing)** | Status bar always displays `"main"`; clicking Git icon opens empty sidebar | No Git CLI execution; no IPC handlers for `git status`, `git diff`, `git add`, `git commit` | Add safe `GitManager` in Electron main using `execFile` with argument arrays; implement Source Control sidebar with Staged/Unstaged lists, diff viewer, commit box, and branch switcher | Execute against test Git repo: stage files, commit changes, switch branches, verify with independent `git status` |
| **Explorer File/Folder CRUD** | `apps/renderer/src/components/FileTree.tsx`, `App.tsx` | **Partial** | Can view files and click to open, but cannot create, rename, or delete files/folders from UI | Missing UI buttons and context menus for New File, New Folder, Rename, Delete; missing IPC routes for deletion/renaming | Add New File/Folder action buttons to Explorer header; add right-click context menu; implement IPC handlers `fs:createFile`, `fs:createFolder`, `fs:rename`, `fs:delete`, `fs:showInFolder` | Create, rename, delete files and folders via UI and verify exact filesystem state |
| **Unsaved Edits Confirmation** | `apps/renderer/src/App.tsx` (lines 189-199: `handleCloseTab`) | **Missing** | Closing a tab with dirty changes immediately closes and discards edits | `handleCloseTab` directly filters out the tab without checking `isDirty` | Add confirmation modal with options: "Save", "Don't Save", "Cancel". If Cancel, keep tab open and preserve dirty buffer intact | Edit file, click close tab, select Cancel, verify edits remain; select Don't Save, verify closed; select Save, verify written |
| **Save As** | `apps/renderer/src/App.tsx` | **Missing** | Only `Cmd+S` overwrite save exists; no Save As dialog | Missing `dialog:saveFile` IPC handler and Save As UI/keyboard action | Add `dialog:saveFile` in Electron main and `saveFileAs` in renderer; wire to Command Palette and `Cmd+Shift+S` | Trigger Save As, choose new filename, verify new file written and opened in tab |
| **Workspace Content Search** | `apps/renderer/src/components/QuickOpen.tsx` (filename only) | **Missing** | Search view in sidebar is empty; Quick Open only searches file paths | Only `workspace/searchFiles` exists in Go indexer; no text search engine scanning file contents | Implement multi-threaded content search in Go daemon / main process supporting case-sensitivity, whole-word, and file matching; render matches with line numbers and preview in Search sidebar | Search unique keyword in fixture; click result; verify Monaco jumps to exact file and line |
| **Quick Open Line Jump** | `apps/renderer/src/components/QuickOpen.tsx` | **Partial** | Searches filenames, but does not parse `:line` or `:line:col` syntax | Query string passed directly to search without parsing location suffix | Parse `:line:col` in Quick Open query; when selected, open file and position Monaco cursor at target line/col | Quick open `main.go:15`, verify editor opens at line 15 |
| **Run Current File** | `apps/renderer/src/components/ActivityBar.tsx` (Debug icon), `BottomPanel.tsx` | **Missing** | Clicking Run & Debug does nothing; no run button | No runner service or child process execution for active file | Implement `runner:runFile` in main process detecting runtime (`go run`, `node`, `python3`, `bash`); stream stdout/stderr to Output panel with actual exit code | Run a test script; verify actual output and exit code appear in Output panel |
| **Debug Adapter Protocol (DAP)** | `ActivityBar.tsx` | **Missing (Honest Status Required)** | Debug view is blank | Full DAP requires language-specific debuggers (dlv, lldb, js-debug) | Accurately communicate status in Debug sidebar: "DAP integration in development. Use integrated terminal or Run Current File for execution." | Verify UI displays honest status without fake debugger controls |
| **Settings & Persistence** | `App.tsx`, `packages/design-system` | **Partial** | Theme toggle works in-memory; reverts on reload; no settings UI | Settings stored only in React state; never persisted to disk | Implement `settings:read` and `settings:write` saving to `~/.forge/settings.json` (theme, font size, minimap, tab size); build Settings panel | Change theme/settings, restart app, verify settings persisted and restored |
| **Recent Workspaces** | `apps/desktop/src/main.ts` | **Missing** | Default workspace falls back to `process.cwd()` without recent list | No recent workspace history stored | Persist list of recent workspace paths in app configuration; add "Open Recent" menu and Command Palette option | Open multiple folders; verify list updates and selecting recent folder opens it |
| **Web Demo Local Awareness** | `apps/renderer/src/App.tsx` (lines 80-97) | **Partial** | Shows mock files, but users might assume local filesystem is connected | Mock files used silently when `window.myForgeAPI` is undefined | Display prominent banner in web mode: "Web Preview Mode — Local filesystem and Go daemon available in Desktop build" | Verify banner appears on web demo and is hidden in Electron desktop app |
| **Go Daemon Health & Recovery** | `apps/desktop/src/daemonManager.ts` | **Partial** | Periodically polls health, but does not auto-restart if process dies | Daemon exit listener only logs warning without recovery | Add crash detection with auto-restart supervisor (up to 3 attempts with exponential backoff); display alert if daemon fails | Kill daemon process externally; verify supervisor restarts it and restores session |
| **Extension Compatibility** | `ActivityBar.tsx` (Extensions tab) | **Missing** | Extensions tab opens empty sidebar | VS Code extension host is not integrated | Build Extensions sidebar connecting to Open VSX registry search; label capabilities truthfully (Themes/Snippets supported; Node-based extensions require Phase 5 host) | Search Open VSX for themes/extensions; verify details and honest compatibility badges |

---

## 3. High-Priority Functional Fixes Plan

1. **P0 (Blockers):**
   - File/Folder CRUD (Create, Rename, Delete, Save As).
   - Unsaved changes confirmation modal (Save, Don't Save, Cancel).
   - Real interactive Terminal (`node-pty` + `@xterm/xterm`).
   - Real Git Source Control (branch, status, stage, unstage, commit, diff).

2. **P1 (Core Workflows):**
   - Workspace Content Search with line-matching and editor navigation.
   - Run Current File with real stdout/stderr/exit code.
   - Settings persistence to `~/.forge/settings.json`.
   - Explorer context menus & reveal in system file manager.
   - Quick Open line jumping (`file:line`).

3. **P2 (Integrations & Polish):**
   - Extensions marketplace browser (Open VSX) with honest compatibility labels.
   - Daemon auto-restart and crash recovery.
   - Web preview banner distinction.
