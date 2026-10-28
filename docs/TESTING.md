# Testing & Quality Assurance Guide: forge
**Product:** forge (by Yantra Works)  
**Date:** 2026-10-28  

---

## 1. Test Architecture Overview

forge uses a layered verification strategy to ensure both frontend interactions, Electron IPC, and compiled Go daemon services are rock-solid:

```
+-------------------------------------------------------------------+
|                        End-to-End Flow Tests                      |
|  - tests/functional_flows.test.ts (Flows 1 through 8)             |
+-------------------------------------------------------------------+
        |                                           |
        v                                           v
+-------------------------------+   +-------------------------------+
|     TypeScript Protocol       |   |       Go Daemon Tests         |
|  - @my-forge/shared-protocol  |   |  - Go race detector (-race)   |
|  - Type contracts & schemas   |   |  - JSON-RPC stdio streaming   |
+-------------------------------+   |  - File indexer & traversal   |
                                    |  - Content search engine      |
                                    |  - File CRUD operations       |
                                    +-------------------------------+
```

---

## 2. Running Automated Tests

### Run the Complete Test Suite
```bash
npm test
```
This single command executes:
1. `npm run test:go` — Go unit and race tests across all daemon packages.
2. `npm run test:ts` — Shared protocol type and schema tests.
3. `npm run test:flows` — Automated integration flows 1 through 8.

### Run Go Unit & Integration Tests Only
```bash
npm run test:go
```
Or directly inside the Go module:
```bash
cd services/forge-daemon && go test -v -race ./...
```

### Run Functional Integration Flows
```bash
npm run test:flows
```

---

## 3. End-to-End Flows Automated in `tests/functional_flows.test.ts`

- **Flow 1: Open and Edit a Project**
  - Spawns daemon, sets root, traverses tree, reads file into buffer, writes edits, verifies on-disk persistence.
- **Flow 2: File and Folder CRUD**
  - Creates nested directories, writes files, renames entries without data loss, and verifies clean deletion.
- **Flow 3: Unsaved Changes Buffer Safeguard**
  - Verifies that dirty buffers are tracked and that cancelling a close action preserves the unsaved buffer.
- **Flow 4: Quick Open & Content Search**
  - Indexes temporary fixture; verifies fuzzy filename search (`math` -> `math.ts`) and line-level text content search with matching line numbers.
- **Flow 5: Real Git Operations**
  - Initializes a temporary Git repo, tracks untracked files, stages files, commits changes, creates and switches branches, and verifies branch HEAD.
- **Flow 6: Real Runner & PTY Shell Execution**
  - Executes scripts via detected runtimes (`node`, `go`, `python3`, `bash`), captures real stdout, stderr, and exit codes.
- **Flow 7: Preferences & Settings Persistence**
  - Writes and reads user configuration from `~/.forge/settings.json`.
- **Flow 8: Extensions Transparency Check**
  - Asserts that unsupported extensions are clearly marked with their exact requirement note.
- **Flow 9: 2026 Dark Theme & Material Icon Theme Resolution**
  - Verifies that new installations default to `2026-dark` and `material-icon-theme`, and that switching themes persists.
- **Flow 10: Task Detection & Task Execution**
  - Detects project tasks from `package.json`, runs tasks with child_process streaming, and verifies exit code 0.
- **Flow 11: Extension Manager Lifecycle & Persistence**
  - Searches Open VSX / marketplace, installs extension into `~/.forge/extensions`, toggles enable/disable state, and uninstalls cleanly.
- **Flow 12: Website vs Web IDE Route Separation**
  - Verifies that root URL loads product & documentation website by default, and `#/web-ide` activates the in-browser IDE.
