# Functional Test Matrix: forge
**Date:** 2026-10-28  
**Release Target:** v0.2.0 Functional Verification  
**Author:** ForgeNexa Quality & Systems Engineering  

---

## Priority Classifications

- **P0 — Release Blockers:** Basic file editing, saving, data-loss protection, terminal, and git operations.
- **P1 — Core Developer Workflows:** Content search, file/folder CRUD, settings persistence, file execution.
- **P2 — Developer Integrations:** Extension marketplace browsing, daemon crash recovery, platform polish.

---

## Test Execution Matrix & Verified Results

| ID | Priority | Feature / Flow | Test Case Description | Expected Result | Actual Result | Verification Method | Status |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **TC-01** | **P0** | **File Opening & Monaco Editing** | Open existing file from workspace, modify text buffer, verify cursor line/col | File opens with correct syntax mode; typing updates buffer and marks tab dirty | Passed. File opens, cursor tracked, tab marked dirty | Automated Flow 1 + Monaco | **PASSED** |
| **TC-02** | **P0** | **File Save Overwrite** | Press `Cmd+S` / `Ctrl+S` on dirty tab | Writes content to disk via Go daemon; clears dirty state | Passed. Buffer written to disk; tab dirty dot cleared | Automated Flow 1 | **PASSED** |
| **TC-03** | **P0** | **Unsaved Changes Safeguard** | Make unsaved edits, click tab close button, click "Cancel" | Tab stays open, buffer and unsaved changes are preserved | Passed. Unsaved buffer preserved intact on Cancel | Automated Flow 3 | **PASSED** |
| **TC-04** | **P0** | **Interactive Terminal** | Launch terminal, run shell command, verify output and cleanup | Interactive shell prompt responds to input; returns true stdout | Passed. Shell spawned; input/output streamed over IPC | Automated Flow 6 + PTY | **PASSED** |
| **TC-05** | **P0** | **Real Git Status & Branch** | Open git repository workspace; check branch indicator and changed files list | Actual git branch shown in status bar; modified and untracked files listed | Passed. Real branch & porcelain status returned | Automated Flow 5 | **PASSED** |
| **TC-06** | **P0** | **Git Stage & Commit** | Stage modified file, enter commit message, click Commit | File staged (`git add`); commit created (`git commit`); status refreshed | Passed. File staged; commit created with commit hash | Automated Flow 5 | **PASSED** |
| **TC-07** | **P1** | **Explorer CRUD: New File** | Click "New File" button, enter `test_new.ts`, save content | File created on disk within workspace; opens in tab; visible in tree | Passed. File created on filesystem and in tree | Automated Flow 2 | **PASSED** |
| **TC-08** | **P1** | **Explorer CRUD: Rename** | Right-click file, select Rename, change to `constants.ts` | File renamed on disk; active tab title and path update seamlessly | Passed. File renamed on disk; old path removed | Automated Flow 2 | **PASSED** |
| **TC-09** | **P1** | **Explorer CRUD: Delete** | Right-click file, select Delete, confirm prompt | File removed from disk; closed in tabs if open; removed from Explorer | Passed. Entry deleted from disk; tree refreshed | Automated Flow 2 | **PASSED** |
| **TC-10** | **P1** | **Workspace Content Search** | Enter search query in Search sidebar with case and word filters | Returns list of matching files, line numbers, and matching line previews | Passed. Sub-millisecond Go content search returned exact line & col | Automated Flow 4 | **PASSED** |
| **TC-11** | **P1** | **Run Current File** | Click "Run File" on a `.go` or `.ts` script | Spawns detected runtime (`go run` / `node`); outputs stdout/stderr to Output panel | Passed. Script executed; stdout captured, exit code 0 | Automated Flow 6 | **PASSED** |
| **TC-12** | **P1** | **Settings Persistence** | Update theme or font size in Settings; restart application | Preferences stored in `~/.forge/settings.json`; restored on launch | Passed. Settings persisted and restored from disk | Automated Flow 7 | **PASSED** |
| **TC-13** | **P1** | **Reveal in System File Manager** | Right-click file, click "Reveal in Finder / Explorer" | Triggers native `shell.showItemInFolder` | Passed. Native file manager opens to item | Electron shell API | **PASSED** |
| **TC-14** | **P2** | **Daemon Process IPC & Race Safety** | Send concurrent JSON-RPC requests under `-race` detector | No data races; structured errors on invalid params | Passed. `go test -race` passes 100% | Go test suite | **PASSED** |
| **TC-15** | **P2** | **Extensions Registry Browser** | Open Extensions sidebar, search Open VSX for a theme or language | Shows real extension name, publisher, version, and description with honest capability tags | Passed. Extensions listed with truthful capability tags | Flow 8 + UI verification | **PASSED** |
