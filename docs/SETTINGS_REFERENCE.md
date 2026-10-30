# Forge IDE — Settings Reference Catalog

**Product:** Forge IDE (by ForgeNexa)  
**Configuration File:** `~/.forge/settings.json`  
**API:** `window.myForgeAPI.getSettings()`, `window.myForgeAPI.saveSettings()`

---

## 1. Overview & Architecture

Forge uses a typed, schema-validated configuration system defined in `@my-forge/shared-protocol`. Settings are stored on disk in JSON format under `~/.forge/settings.json`, loaded synchronously upon desktop startup, and pushed to the Monaco editor and React workbench via IPC context bridge.

If the settings file is missing or corrupted with invalid JSON, Forge automatically falls back to safe defaults without crashing.

---

## 2. Complete Settings Matrix by Category

### A. Appearance & UI
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `'2026-dark' \| 'graphite-dark' \| 'sand-light'` | `'2026-dark'` | Active color theme matching Monaco and UI tokens |
| `iconTheme` | `'material-icon-theme' \| 'minimal'` | `'material-icon-theme'` | File tree icon theme provider |
| `uiDensity` | `'comfortable' \| 'compact'` | `'comfortable'` | UI padding and control density |
| `uiFontSize` | `number` | `13` | Workbench font size in pixels |
| `uiFontFamily` | `string` | System UI font stack | Primary font family for chrome and toolbars |
| `smoothScrolling` | `boolean` | `true` | Animate editor and list scrolling smoothly |
| `breadcrumbs` | `boolean` | `true` | Display file path breadcrumbs above editor |
| `stickyScroll` | `boolean` | `true` | Pin active scope header at top during scroll |

### B. Editor & Typography
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `fontFamily` | `string` | `'JetBrains Mono, Menlo, Monaco, monospace'` | Editor monospace font family |
| `fontSize` | `number` | `13` | Code editor font size in pixels |
| `tabSize` | `number` | `2` | Number of spaces per indentation level |
| `insertSpaces` | `boolean` | `true` | Insert spaces when pressing the Tab key |
| `wordWrap` | `boolean` | `true` | Wrap long lines exceeding editor viewport |
| `lineNumbers` | `'on' \| 'off' \| 'relative'` | `'on'` | Line numbering display mode |
| `minimap` | `boolean` | `true` | Display thumbnail code minimap on right side |
| `bracketPairColorization` | `boolean` | `true` | Colorize matching bracket pairs |
| `autoClosingBrackets` | `boolean` | `true` | Automatically insert matching closing brackets |
| `autoClosingQuotes` | `boolean` | `true` | Automatically insert matching closing quotes |
| `highlightMatchingBrackets` | `boolean` | `true` | Highlight bracket pairs when cursor is adjacent |
| `highlightCurrentLine` | `boolean` | `true` | Draw subtle background highlight on active line |
| `cursorBlinking` | `'smooth' \| 'blink' \| 'solid'` | `'smooth'` | Cursor animation style |

### C. Files & Autosave
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `autoSave` | `'off' \| 'afterDelay' \| 'onFocusChange'` | `'afterDelay'` | Automatic save behavior |
| `autoSaveDelayMs` | `number` | `1000` | Delay in milliseconds before saving after typing |
| `confirmCloseUnsaved` | `boolean` | `true` | Prompt confirmation modal before closing dirty tab |
| `restorePreviousTabs` | `boolean` | `true` | Reopen open tabs upon next application launch |
| `restorePreviousWorkspace` | `boolean` | `true` | Open last active workspace folder upon restart |
| `maxFileSizeMB` | `number` | `10` | Maximum file size in MB allowed for indexer/editor |

### D. Language & IntelliSense
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `autoLanguageDetection` | `boolean` | `true` | Detect file language from filename and extension |
| `quickSuggestions` | `boolean` | `true` | Display autocomplete suggestions as you type |
| `parameterHints` | `boolean` | `true` | Show function parameter signatures in tooltip |
| `suggestionDelayMs` | `number` | `50` | Milliseconds debounce before opening suggestion widget |
| `lspEnabled` | `boolean` | `true` | Activate external Language Server Protocol processes |
| `aiEnabled` | `boolean` | `true` | Enable generative AI autocomplete assistance |
| `aiProvider` | `'local' \| 'gemini-3.8-flash' \| 'gemini-pro' \| 'claude-3.7'` | `'local'` | Active AI engine provider (Ollama FIM local-first) |
| `aiInlineCompletions` | `boolean` | `true` | Render inline ghost text suggestions accepted via Tab |
| `aiContextAwareness` | `boolean` | `true` | Pass Go-daemon indexed symbol context to AI |

### E. Formatting
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `formatOnSave` | `boolean` | `true` | Format active document automatically upon save |
| `formatOnPaste` | `boolean` | `false` | Format pasted code snippets automatically |
| `formatOnType` | `boolean` | `false` | Format active line when trigger characters are typed |
| `defaultFormatter` | `string` | `'default'` | Default code formatter identifier |
| `formattingTimeoutMs` | `number` | `2500` | Formatter execution timeout before abort |

### F. Diagnostics & Linters
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `diagnosticsEnabled` | `boolean` | `true` | Run background compilers and linters (vet, tsc) |
| `diagnosticsDebounceMs` | `number` | `250` | Debounce rate in milliseconds before running checks |
| `inlineErrors` | `boolean` | `true` | Render wavy colored squiggles under syntax errors |

### G. Terminal & Tasks
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `terminalPosition` | `'bottom'` | `'bottom'` | Terminal dock location (Strictly bottom panel) |
| `defaultShell` | `string` | `'zsh'` | Default shell profile (zsh, bash, sh, powershell) |
| `terminalFontSize` | `number` | `12` | Font size for xterm.js terminal canvas |
| `terminalScrollback` | `number` | `5000` | Number of buffer lines preserved in terminal scrollback |
| `terminalCursorStyle` | `'block' \| 'underline' \| 'bar'` | `'block'` | Terminal cursor rendering style |

### H. Git & Source Control
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `gitAutoDetect` | `boolean` | `true` | Scan workspace root for valid `.git` repository |
| `gitAutoRefresh` | `boolean` | `true` | Poll git status on file changes and focus |
| `gitConfirmDestructive` | `boolean` | `true` | Confirm before discarding changes or hard resetting |
| `gitGutterIndicators` | `boolean` | `true` | Render colored margin bars indicating diff status |

### I. Go Daemon & Performance
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `autoReindexDebounceMs` | `number` | `250` | Debounce rate before Go daemon re-indexes files |

### J. Advanced & Privacy
| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `telemetryEnabled` | `boolean` | `false` | Zero-telemetry default (no analytics or pings) |
| `localOnlyMode` | `boolean` | `true` | Strictly isolate IDE from outbound network calls |
| `logLevel` | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'` | Logging verbosity written to `~/.forge/logs/` |
| `searchMaxResults` | `number` | `500` | Maximum results returned by content search |
