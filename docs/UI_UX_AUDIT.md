# Forge IDE — UI & UX Comprehensive Audit

**Product:** Forge IDE (by Yantra Works)  
**Date:** 2026-10-28  
**Auditor:** Senior IDE Architect & UI/UX Specialist  

---

## 1. Executive Summary

This UI/UX audit reviews the user interface, interaction model, visual hierarchy, layout responsiveness, and design consistency of **Forge IDE** following the CodeEdit-inspired redesign, 2026 Dark Theme integration, and bottom tool-window architecture.

The objective is to achieve the high visual polish and low-distraction ergonomics of modern IDEs (such as VS Code, IntelliJ IDEA, and CodeEdit) while eliminating simulated UI components, preserving high data density, and ensuring every interactive element performs a concrete action.

---

## 2. Layout Structure & Geometry

```
+-------------------------------------------------------------------------------+
| Window Controls | Workspace / Breadcrumbs / Run Button | Window Controls      |
+-------------------------------------------------------------------------------+
| A | PRIMARY SIDEBAR          | MAIN EDITOR WORKBENCH                          |
| C | - Explorer               | - Tab Bar (with close, dirty indicator)        |
| T | - Search & Replace       | - Breadcrumbs (with language & file path)      |
| I | - Git Source Control     | - Split Editor Support                         |
| V | - Run & Debug            | - Monaco Code Surface / Markdown / Image       |
| I | - Extensions             |------------------------------------------------|
| T |                          | BOTTOM TOOL WINDOW (IntelliJ-style)            |
| Y |                          | - Terminal (Multi-session, Shell, Split, Clear)|
| B |                          | - Problems (LSP diagnostics & compiler errors) |
| A |                          | - Output (Runner logs & task streams)          |
| R |                          | - Debug Console (JS REPL)                      |
|   |                          | - Build & Tasks (package.json / go.mod tasks)  |
|   |                          | - Test Results (Unit test runners)             |
|   |                          | - Go Daemon (Indexing stats & health)          |
+---+--------------------------+------------------------------------------------+
| STATUS BAR: Git Branch | Errors/Warns | Language | Line:Col | Indent | UTF-8 |
+-------------------------------------------------------------------------------+
```

### Key Improvements Implemented:
1. **Mandatory Bottom Tool-Window Docking:**
   - The integrated terminal now opens strictly at the bottom of the IDE, following IntelliJ IDEA's tool window paradigm.
   - The Activity Bar terminal button directly triggers the bottom tool-window to open or close on the `Terminal` tab.
   - The left sidebar is strictly reserved for Explorer, Search, Git Source Control, Run & Debug, and Extensions.
2. **Bottom Tool-Window Resizing & Maximizing:**
   - Vertical resizer handle with mouse drag responsiveness and persistence to `localStorage`.
   - Dedicated maximize / restore button (`🗖` / `🗗`) allowing the tool window to expand and fill the workbench for deep terminal/debugging sessions.
   - Quick reset button (`↕`) restoring the default 260px height.
3. **Multi-Session Terminal Strip:**
   - Tabs for `Session 1`, `Session 2`, etc., with double-click renaming.
   - Shell switcher dropdown supporting `Zsh`, `Bash`, `sh`, `PowerShell`, and `Command Prompt`.
   - Side-by-side terminal splitting (`◫ Split`) allowing simultaneous shell execution.
   - Dedicated `⎚ Clear` action.

---

## 3. Visual Themes & Typography

### Default Color Palette (2026 Dark):
- **Editor Background:** `#121314` (Neutral ultra-dark charcoal; low ocular fatigue)
- **Editor Text:** `#BBBEBF` (Soft readable silver)
- **Activity Bar & Chrome:** `#161719`
- **Sidebar Background:** `#18191B`
- **Dialog Background:** `#1A1B1E`
- **Primary Accent:** `#388BFD` (Clean vibrant blue)
- **Error Indicator:** `#F85149` (Vivid crimson)
- **Warning Indicator:** `#D29922` (Warm amber)
- **Success / Added:** `#3FB950` (Fresh emerald green)

### Typography Stack:
- **Editor & Terminal Code Font:** `JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace` with font ligatures enabled.
- **UI & Workbench Font:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- **Base UI Font Size:** 13px (Compact, readable density).
- **Editor Font Size:** 13px (Configurable from 10px to 28px in Settings).

---

## 4. File-Type Handling & Previews

1. **Text & Code Files:**
   - Handled directly by Monaco Editor with full syntax highlighting, bracket matching, code folding, and autocomplete.
2. **Image Files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.ico`, `.svg`):**
   - Automatically rendered in interactive Image Viewer with centered checkered canvas, zoom controls (`-`, `+`, `100%`), and file metadata.
3. **Binary Files (`.exe`, `.dll`, `.bin`, `.wasm`, `.zip`, `.pdf`):**
   - Protected against accidental text decoding or corruption with an informative warning card and direct "Reveal in File Manager" action.
4. **Markdown Documents (`.md`, `.markdown`):**
   - Includes live rendered preview toggle (`👁 Preview` / `✎ Code`) in the breadcrumb header, rendering headings, task lists, code blocks, and blockquotes.

---

## 5. Keyboard Navigation & Accessibility

All primary user flows can be triggered entirely from the keyboard:
- `Cmd+P` / `Ctrl+P`: Quick Open fuzzy file picker.
- `Cmd+Shift+P` / `Ctrl+Shift+P`: Command Palette.
- `Cmd+S` / `Ctrl+S`: Save active document.
- `Cmd+Shift+S` / `Ctrl+Shift+S`: Save file as.
- `Cmd+B` / `Ctrl+B`: Toggle primary sidebar.
- `Cmd+J` / `Ctrl+J`: Toggle bottom tool-window.
- `Ctrl+\``: Toggle integrated terminal.
- `Cmd+,` / `Ctrl+,`: Open Settings dialog.
- `Shift+Alt+F`: Format active document.
- `Cmd+W` / `Ctrl+W`: Close active editor tab.
