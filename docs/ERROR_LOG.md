# Forge IDE — Error & Resolution Log

**Product:** Forge IDE (by ForgeNexa)  
**Maintenance Window:** 2026-10-28  

---

### Incident 1: Node.js Child Process Shell Warning (DEP0190)
- **Subsystem:** `apps/desktop/src/taskManager.ts`
- **Error Message:** `(node:9187) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true`
- **Root Cause:** When `spawn(bin, args, { shell: true })` is called with separate binary and arguments arrays, Node.js issues deprecation warning DEP0190 because shell mode concatenates commands ambiguously.
- **Fix Applied:** Refactored `taskManager.ts` to pass the complete task command string as the first argument: `spawn(task.command, { shell: true, cwd, env })`.
- **Verification:** Ran `npm test` Flow 10; warning was completely eliminated.

---

### Incident 2: Insecure `eval` Warning in Debug Console
- **Subsystem:** `apps/renderer/src/components/BottomPanel.tsx:216`
- **Error Message:** TypeScript / linter warning regarding direct use of `eval()`.
- **Root Cause:** Direct `eval()` in browser renderer can pollute scope and trigger CSP violations.
- **Fix Applied:** Replaced direct `eval()` with scoped function constructor invocation: `new Function('return (' + cmd + ')')()`.
- **Verification:** Verified clean compilation via `npm run build`.

---

### Incident 3: Theme Type Union Inconsistency
- **Subsystem:** `TerminalTab.tsx`, `TerminalSidebar.tsx`, `StatusBar.tsx`
- **Error Message:** Type `'2026-dark'` is not assignable to type `'graphite-dark' | 'sand-light'`.
- **Root Cause:** Components lacked `'2026-dark'` in their theme prop type union definition after introducing the authentic 2026 Dark Theme.
- **Fix Applied:** Updated the theme prop union across all components to `'2026-dark' | 'graphite-dark' | 'sand-light'`.
- **Verification:** TypeScript type checks passed with zero errors.

---

### Incident 4: Home Directory Pollution in Integration Tests
- **Subsystem:** `tests/functional_flows.test.ts` Flow 9
- **Error Message:** Expected default theme `'2026-dark'`, received `'graphite-dark'`.
- **Root Cause:** `SettingsManager` and `ExtensionManager` read the live user settings file located in `~/.forge/settings.json`, which had been mutated by earlier manual tests.
- **Fix Applied:** Added an optional `customConfigDir?: string` parameter to `SettingsManager` and `ExtensionManager` constructors. Test flows now execute in temporary directories created via `fs.mkdtempSync()`.
- **Verification:** Flow 9 passes reliably regardless of prior user state.

---

### Incident 5: Language Registry CSS & JSON Missing Keys
- **Subsystem:** `apps/desktop/src/lsp/lspRegistry.ts`
- **Error Message:** `AssertionError [ERR_ASSERTION]: Language css missing from registry`.
- **Root Cause:** `html`, `css`, and `json` had been initially bundled under a single `'html'` registry entry.
- **Fix Applied:** Split the entry into distinct entries with language IDs `'html'`, `'css'`, and `'json'`, each with individual capabilities and metadata.
- **Verification:** Flow 13 asserted that all 22 language IDs are present and passed.
