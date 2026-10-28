import { useState, useEffect, useCallback, type FC, type MouseEvent } from 'react';
import {
  FileEntry,
  IndexStats,
  SystemHealth,
  DaemonInfo,
  GitRepositoryStatus,
  GitFileStatus,
  ForgeSettings,
  ContentSearchResult,
} from '@my-forge/shared-protocol';
import { ActivityBar, ActivityView } from './components/ActivityBar';
import { FileTree } from './components/FileTree';
import { EditorArea, EditorTab } from './components/EditorArea';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { QuickOpen } from './components/QuickOpen';
import { GitSidebar } from './components/GitSidebar';
import { SearchSidebar } from './components/SearchSidebar';
import { ExtensionsSidebar } from './components/ExtensionsSidebar';
import { TerminalSidebar } from './components/TerminalSidebar';
import { ProductLandingPage } from './components/ProductLandingPage';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { SettingsModal } from './components/SettingsModal';
import './styles/app.css';

const defaultSettings: ForgeSettings = {
  theme: '2026-dark',
  iconTheme: 'material-icon-theme',
  fontSize: 13,
  fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  lineNumbers: 'on',
  bracketPairColorization: true,
  autoClosingBrackets: true,
  cursorBlinking: 'smooth',
  maxFileSizeMB: 10,
  autoReindexDebounceMs: 250,
  aiEnabled: true,
  aiProvider: 'gemini-3.8-flash',
  aiInlineCompletions: true,
  aiContextAwareness: true,
  telemetryEnabled: false,
  localOnlyMode: true,
  terminalPosition: 'bottom',
};

export const App: FC = () => {
  // Settings & Theme
  const [settings, setSettings] = useState<ForgeSettings>(defaultSettings);

  // Workspace
  const [workspaceRoot, setWorkspaceRoot] = useState<string>('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);

  // Git State
  const [gitStatus, setGitStatus] = useState<GitRepositoryStatus | null>(null);
  const [branches, setBranches] = useState<string[]>([]);

  // Daemon telemetry & logs
  const [daemonInfo, setDaemonInfo] = useState<DaemonInfo | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Editor tabs
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Unsaved changes confirmation
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);

  // Layout states
  const [activeView, setActiveView] = useState<ActivityView | null>('explorer');
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const isWebPreview = !window.myForgeAPI;

  const [showProductWebsite, setShowProductWebsite] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (!window.myForgeAPI) {
        // On Web (GitHub Pages / browser): show Product Website by default unless #/web-ide is in URL
        return (
          !window.location.hash.includes('web-ide') &&
          !window.location.pathname.includes('/web-ide')
        );
      }
      return (
        window.location.hash.includes('showcase') ||
        window.location.hash.includes('release') ||
        window.location.hash.includes('docs')
      );
    }
    return false;
  });

  // Listen to hash changes for smooth navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (!window.myForgeAPI) {
        setShowProductWebsite(
          !window.location.hash.includes('web-ide') &&
          !window.location.pathname.includes('/web-ide')
        );
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modals
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Runner
  const [isRunningFile, setIsRunningFile] = useState(false);

  // Cursor indicator
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const appendLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`].slice(-300));
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Load settings on startup
  useEffect(() => {
    if (window.myForgeAPI) {
      window.myForgeAPI.getSettings().then((s) => {
        if (s) setSettings(s);
      });
    }
  }, []);

  // Refresh Git Status
  const refreshGit = useCallback(async () => {
    if (!window.myForgeAPI) return;
    try {
      const status = await window.myForgeAPI.gitGetStatus();
      setGitStatus(status);
      if (status.isRepo) {
        const b = await window.myForgeAPI.gitGetBranches();
        setBranches(b);
      }
    } catch {
      // ignore
    }
  }, []);

  // Rescan workspace with Go daemon
  const refreshWorkspace = useCallback(async () => {
    if (!window.myForgeAPI) return;
    setIsLoading(true);
    appendLog('Scanning workspace files via Go daemon...');
    try {
      const stats = await window.myForgeAPI.indexWorkspace();
      setIndexStats(stats);
      const entries = await window.myForgeAPI.listDirectory('');
      setFiles(entries);
      appendLog(`Indexed: ${stats.totalFiles} files, ${stats.totalDirs} dirs in ${stats.durationMs}ms`);
      await refreshGit();
    } catch (err: any) {
      appendLog(`Indexing error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [appendLog, refreshGit]);

  // Initial connect
  useEffect(() => {
    const initApp = async () => {
      appendLog('Initializing forge...');
      if (window.myForgeAPI) {
        try {
          const info = await window.myForgeAPI.getDaemonInfo();
          setDaemonInfo(info);
          appendLog(`Connected to Go daemon (${info.server} v${info.version}, Go ${info.go})`);

          const wsFolder = await window.myForgeAPI.getWorkspaceFolder();
          if (wsFolder?.root) {
            setWorkspaceRoot(wsFolder.root);
            appendLog(`Workspace: ${wsFolder.root}`);
            await refreshWorkspace();
          }

          const h = await window.myForgeAPI.getDaemonHealth();
          setHealth(h);
        } catch (err: any) {
          appendLog(`Startup error: ${err.message}`);
        }
      } else {
        // Web preview mode
        appendLog('Running in Web Preview Mode (browser sandbox).');
        setWorkspaceRoot('/sample/forge-project');
        setFiles([
          { relativePath: 'src/main.go', absolutePath: '/sample/src/main.go', name: 'main.go', isDir: false, size: 280, modTime: '', languageId: 'go' },
          { relativePath: 'src/server.ts', absolutePath: '/sample/src/server.ts', name: 'server.ts', isDir: false, size: 450, modTime: '', languageId: 'typescript' },
          { relativePath: 'README.md', absolutePath: '/sample/README.md', name: 'README.md', isDir: false, size: 820, modTime: '', languageId: 'markdown' },
          { relativePath: 'package.json', absolutePath: '/sample/package.json', name: 'package.json', isDir: false, size: 650, modTime: '', languageId: 'json' },
        ]);
        setIndexStats({
          totalFiles: 4,
          totalDirs: 1,
          durationMs: 1,
          lastIndexedAt: new Date().toISOString(),
          workspaceRoot: '/sample/forge-project',
        });
        setGitStatus({
          isRepo: true,
          branch: 'main',
          files: [
            { path: 'src/main.go', status: 'modified', staged: false, workingTreeStatus: 'M', indexStatus: ' ' },
            { path: 'README.md', status: 'staged', staged: true, workingTreeStatus: ' ', indexStatus: 'M' },
          ],
          ahead: 0,
          behind: 0,
        });
        setBranches(['main', 'feat/codeedit-ui']);
      }
    };

    initApp();
  }, [appendLog, refreshWorkspace]);

  // Poll daemon health
  useEffect(() => {
    if (!window.myForgeAPI) return;
    const interval = setInterval(async () => {
      try {
        const h = await window.myForgeAPI!.getDaemonHealth();
        setHealth(h);
      } catch {
        // Ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update Settings
  const handleUpdateSettings = async (patch: Partial<ForgeSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    if (window.myForgeAPI) {
      await window.myForgeAPI.saveSettings(patch);
    }
  };

  // Open Folder Dialog
  const handleOpenFolder = async () => {
    if (window.myForgeAPI) {
      try {
        const chosen = await window.myForgeAPI.openFolderDialog();
        if (chosen) {
          setWorkspaceRoot(chosen);
          appendLog(`Opened folder: ${chosen}`);
          setTabs([]);
          setActiveTabId(null);
          await refreshWorkspace();
        }
      } catch (err: any) {
        appendLog(`Open folder error: ${err.message}`);
      }
    }
  };

  // Open File Dialog
  const handleOpenFile = async () => {
    if (window.myForgeAPI) {
      try {
        const chosen = await window.myForgeAPI.openFileDialog();
        if (chosen) {
          const name = chosen.split('/').pop() || chosen;
          handleSelectFile({
            relativePath: chosen,
            absolutePath: chosen,
            name,
            isDir: false,
            size: 0,
            modTime: '',
          });
        }
      } catch (err: any) {
        appendLog(`Open file error: ${err.message}`);
      }
    }
  };

  // Select/Open File in Tab
  const handleSelectFile = async (file: FileEntry, jumpLine?: number, jumpCol?: number) => {
    if (file.isDir) return;

    const existing = tabs.find((t) => t.relativePath === file.relativePath);
    if (existing) {
      setActiveTabId(existing.id);
      if (jumpLine) setCursorPos({ line: jumpLine, col: jumpCol || 1 });
      return;
    }

    let content = '// File content';
    if (window.myForgeAPI) {
      try {
        const res = await window.myForgeAPI.readFile(file.relativePath);
        content = res.content;
      } catch (err: any) {
        appendLog(`Failed to read file ${file.relativePath}: ${err.message}`);
        content = `// Error reading file: ${err.message}`;
      }
    } else {
      content = `// forge Web Preview\n// File: ${file.relativePath}\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Welcome to forge by Yantra Works!")\n}\n`;
    }

    const newTab: EditorTab = {
      id: file.relativePath,
      relativePath: file.relativePath,
      title: file.name,
      content,
      originalContent: content,
      languageId: file.languageId || 'plaintext',
      isDirty: false,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    if (jumpLine) setCursorPos({ line: jumpLine, col: jumpCol || 1 });
    appendLog(`Opened: ${file.relativePath}`);
  };

  // Tab Close with Unsaved Safeguard (Part B & Flow 3)
  const handleCloseTabRequest = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose?.isDirty) {
      setPendingCloseTabId(id);
    } else {
      executeCloseTab(id);
    }
  };

  const executeCloseTab = (id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        const nextActive = filtered[filtered.length - 1]?.id || null;
        setActiveTabId(nextActive);
      }
      return filtered;
    });
    setPendingCloseTabId(null);
  };

  const handleCloseOthers = (keepId: string) => {
    setTabs((prev) => prev.filter((t) => t.id === keepId));
    setActiveTabId(keepId);
  };

  const handleCloseAll = () => {
    const hasDirty = tabs.some((t) => t.isDirty);
    if (hasDirty) {
      if (!confirm('You have unsaved changes. Close all tabs anyway?')) return;
    }
    setTabs([]);
    setActiveTabId(null);
  };

  const handleContentChange = (id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            content,
            isDirty: content !== t.originalContent,
          };
        }
        return t;
      })
    );
  };

  // Overwrite Save
  const handleSave = async () => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || !activeTab.isDirty) return;

    if (window.myForgeAPI) {
      try {
        await window.myForgeAPI.writeFile(activeTab.relativePath, activeTab.content);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTab.id ? { ...t, isDirty: false, originalContent: t.content } : t
          )
        );
        appendLog(`Saved: ${activeTab.relativePath}`);
        await refreshGit();
      } catch (err: any) {
        appendLog(`Error saving ${activeTab.relativePath}: ${err.message}`);
      }
    } else {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id ? { ...t, isDirty: false, originalContent: t.content } : t
        )
      );
      appendLog(`Saved (preview): ${activeTab.relativePath}`);
    }
  };

  // Save As
  const handleSaveAs = async () => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    if (window.myForgeAPI) {
      try {
        const newPath = await window.myForgeAPI.saveFileDialog(activeTab.title);
        if (newPath) {
          await window.myForgeAPI.writeFile(newPath, activeTab.content);
          appendLog(`Saved As: ${newPath}`);
          await refreshWorkspace();
          const name = newPath.split('/').pop() || newPath;
          handleSelectFile({
            relativePath: newPath,
            absolutePath: newPath,
            name,
            isDir: false,
            size: activeTab.content.length,
            modTime: '',
          });
        }
      } catch (err: any) {
        appendLog(`Save As error: ${err.message}`);
      }
    }
  };

  // File CRUD operations
  const handleCreateFile = async (parentRel: string, name: string) => {
    const fullRel = parentRel ? `${parentRel}/${name}` : name;
    if (window.myForgeAPI) {
      try {
        await window.myForgeAPI.createFile(fullRel, '');
        appendLog(`Created file: ${fullRel}`);
        await refreshWorkspace();
        handleSelectFile({
          relativePath: fullRel,
          absolutePath: fullRel,
          name,
          isDir: false,
          size: 0,
          modTime: '',
        });
      } catch (err: any) {
        appendLog(`Create file failed: ${err.message}`);
        alert(`Failed to create file: ${err.message}`);
      }
    } else {
      setFiles((prev) => [
        ...prev,
        { relativePath: fullRel, absolutePath: fullRel, name, isDir: false, size: 0, modTime: '' },
      ]);
    }
  };

  const handleCreateFolder = async (parentRel: string, name: string) => {
    const fullRel = parentRel ? `${parentRel}/${name}` : name;
    if (window.myForgeAPI) {
      try {
        await window.myForgeAPI.createFolder(fullRel);
        appendLog(`Created folder: ${fullRel}`);
        await refreshWorkspace();
      } catch (err: any) {
        appendLog(`Create folder failed: ${err.message}`);
        alert(`Failed to create folder: ${err.message}`);
      }
    } else {
      setFiles((prev) => [
        ...prev,
        { relativePath: fullRel, absolutePath: fullRel, name, isDir: true, size: 0, modTime: '' },
      ]);
    }
  };

  const handleRenameEntry = async (oldRel: string, newRel: string) => {
    if (window.myForgeAPI) {
      try {
        await window.myForgeAPI.renameEntry(oldRel, newRel);
        appendLog(`Renamed: ${oldRel} -> ${newRel}`);
        // Update open tabs
        setTabs((prev) =>
          prev.map((t) =>
            t.relativePath === oldRel
              ? { ...t, id: newRel, relativePath: newRel, title: newRel.split('/').pop() || newRel }
              : t
          )
        );
        if (activeTabId === oldRel) setActiveTabId(newRel);
        await refreshWorkspace();
      } catch (err: any) {
        appendLog(`Rename failed: ${err.message}`);
        alert(`Failed to rename: ${err.message}`);
      }
    }
  };

  const handleDeleteEntry = async (relPath: string) => {
    if (window.myForgeAPI) {
      try {
        await window.myForgeAPI.deleteEntry(relPath);
        appendLog(`Deleted: ${relPath}`);
        // Close if open
        setTabs((prev) => prev.filter((t) => !t.relativePath.startsWith(relPath)));
        await refreshWorkspace();
      } catch (err: any) {
        appendLog(`Delete failed: ${err.message}`);
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  const handleShowInFolder = (relPath: string) => {
    if (window.myForgeAPI) {
      window.myForgeAPI.showInFolder(relPath);
    }
  };

  // Run Current File (Part I & Runner)
  const handleRunCurrentFile = async () => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || isRunningFile) return;

    if (activeTab.isDirty) {
      await handleSave();
    }

    setIsRunningFile(true);
    appendLog(`Running ${activeTab.relativePath}...`);
    setShowBottomPanel(true);

    if (window.myForgeAPI) {
      try {
        const result = await window.myForgeAPI.runFile(activeTab.relativePath);
        if (result.stdout) appendLog(result.stdout.trim());
        if (result.stderr) appendLog(`[stderr] ${result.stderr.trim()}`);
        appendLog(`Process exited with code ${result.exitCode} (${result.durationMs}ms)`);
      } catch (err: any) {
        appendLog(`Run error: ${err.message}`);
      } finally {
        setIsRunningFile(false);
      }
    } else {
      setTimeout(() => {
        appendLog(`Hello from forge! [runtime: preview, exit: 0]`);
        setIsRunningFile(false);
      }, 400);
    }
  };

  // Git Handlers
  const handleStageFile = async (path: string) => {
    if (!window.myForgeAPI) return;
    await window.myForgeAPI.gitStageFile(path);
    await refreshGit();
  };

  const handleUnstageFile = async (path: string) => {
    if (!window.myForgeAPI) return;
    await window.myForgeAPI.gitUnstageFile(path);
    await refreshGit();
  };

  const handleStageAll = async () => {
    if (!window.myForgeAPI) return;
    await window.myForgeAPI.gitStageAll();
    await refreshGit();
  };

  const handleUnstageAll = async () => {
    if (!window.myForgeAPI) return;
    await window.myForgeAPI.gitUnstageAll();
    await refreshGit();
  };

  const handleDiscardChanges = async (path: string) => {
    if (!window.myForgeAPI) return;
    await window.myForgeAPI.gitDiscardChanges(path);
    await refreshWorkspace();
  };

  const handleCommit = async (message: string): Promise<boolean> => {
    if (!window.myForgeAPI) return true;
    const res = await window.myForgeAPI.gitCommit(message);
    if (res.success) {
      appendLog(`Committed [${res.commitHash || 'ok'}]: ${message}`);
      await refreshGit();
      return true;
    } else {
      appendLog(`Commit failed: ${res.error}`);
      alert(`Commit error: ${res.error}`);
      return false;
    }
  };

  const handleViewDiff = async (file: GitFileStatus) => {
    if (window.myForgeAPI) {
      const diff = await window.myForgeAPI.gitGetDiff(file.path, file.staged);
      const diffTab: EditorTab = {
        id: `diff:${file.path}`,
        relativePath: file.path,
        title: `Diff: ${file.path.split('/').pop()}`,
        content: diff.modified,
        originalContent: diff.original,
        languageId: 'plaintext',
        isDirty: false,
        isDiff: true,
        diffOriginal: diff.original,
        diffModified: diff.modified,
      };
      setTabs((prev) => [...prev.filter((t) => t.id !== diffTab.id), diffTab]);
      setActiveTabId(diffTab.id);
    }
  };

  const handleSwitchBranch = async (branch: string) => {
    if (window.myForgeAPI) {
      await window.myForgeAPI.gitSwitchBranch(branch);
      appendLog(`Switched to branch: ${branch}`);
      await refreshWorkspace();
    }
  };

  // Search
  const handleContentSearch = async (
    query: string,
    options: { isCaseSensitive: boolean; isWholeWord: boolean }
  ): Promise<ContentSearchResult> => {
    if (window.myForgeAPI) {
      return window.myForgeAPI.searchContent(query, options);
    }
    return { query, matches: [], totalMatches: 0, fileCount: 0, durationMs: 0 };
  };

  const searchWorkspaceFiles = async (rawQuery: string): Promise<FileEntry[]> => {
    // Check for line jump syntax: query:line or query:line:col
    const match = rawQuery.match(/^([^:]+):(\d+)(?::(\d+))?$/);
    const query = match ? match[1] : rawQuery;

    if (window.myForgeAPI) {
      try {
        return await window.myForgeAPI.searchFiles(query, 40);
      } catch {
        return [];
      }
    }
    return files.filter(
      (f) =>
        !f.isDir &&
        (f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.relativePath.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        setShowQuickOpen(true);
        setShowCommandPalette(false);
      } else if (isCmdOrCtrl && e.key === 'P' && e.shiftKey) {
        e.preventDefault();
        setShowCommandPalette(true);
        setShowQuickOpen(false);
      } else if (isCmdOrCtrl && e.key === 'b') {
        e.preventDefault();
        setActiveView((prev) => (prev ? null : 'explorer'));
      } else if (isCmdOrCtrl && e.key === 'j') {
        e.preventDefault();
        setShowBottomPanel((prev) => !prev);
      } else if (isCmdOrCtrl && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (isCmdOrCtrl && e.key === 'S' && e.shiftKey) {
        e.preventDefault();
        handleSaveAs();
      } else if (isCmdOrCtrl && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
      } else if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault();
        setActiveView((prev) => (prev === 'terminal' ? null : 'terminal'));
      } else if (isCmdOrCtrl && e.key === 'w' && activeTabId) {
        e.preventDefault();
        const fakeEvent = { stopPropagation: () => {} } as unknown as MouseEvent;
        handleCloseTabRequest(activeTabId, fakeEvent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Command palette commands
  const commands: CommandItem[] = [
    { id: 'quick-open', label: 'Go to File...', category: 'File', shortcut: 'Cmd+P', action: () => setShowQuickOpen(true) },
    { id: 'open-folder', label: 'Open Folder...', category: 'File', action: handleOpenFolder },
    { id: 'open-file', label: 'Open File...', category: 'File', action: handleOpenFile },
    { id: 'save-file', label: 'Save Active File', category: 'File', shortcut: 'Cmd+S', action: handleSave },
    { id: 'save-file-as', label: 'Save As...', category: 'File', shortcut: 'Cmd+Shift+S', action: handleSaveAs },
    { id: 'run-file', label: 'Run Current File', category: 'Run', action: handleRunCurrentFile },
    { id: 'rescan-go', label: 'Rescan Workspace with Go Indexer', category: 'Go Backend', action: refreshWorkspace },
    { id: 'open-settings', label: 'Preferences: Open Settings (Antigravity Mode)', category: 'Preferences', shortcut: 'Cmd+,', action: () => setShowSettingsModal(true) },
    { id: 'toggle-sidebar', label: 'Toggle Primary Sidebar', category: 'View', shortcut: 'Cmd+B', action: () => setActiveView((v) => (v ? null : 'explorer')) },
    { id: 'toggle-terminal-sidebar', label: 'Toggle Sidebar Terminal', category: 'View', shortcut: 'Ctrl+`', action: () => setActiveView((v) => (v === 'terminal' ? null : 'terminal')) },
    { id: 'toggle-panel', label: 'Toggle Bottom Panel', category: 'View', shortcut: 'Cmd+J', action: () => setShowBottomPanel((p) => !p) },
    { id: 'toggle-docs', label: showProductWebsite ? 'Return to IDE Workspace' : 'Open Product Website & Docs', category: 'Help', action: () => setShowProductWebsite((prev) => !prev) },
  ];

  const pendingCloseTab = tabs.find((t) => t.id === pendingCloseTabId);

  return (
    <div className="forge-app">
      {/* Web preview banner */}
      {isWebPreview && !showProductWebsite && (
        <div className="forge-web-banner">
          <span>🌐 Forge Web IDE (Sandbox Preview) — For full native Go daemon indexing, real PTY terminal, and filesystem access, launch the desktop app with: <code>npm start</code></span>
          <button
            onClick={() => {
              window.location.hash = '#/';
              setShowProductWebsite(true);
            }}
            style={{
              marginLeft: 12,
              background: 'transparent',
              border: '1px solid currentColor',
              color: 'inherit',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            ← Product Website & Docs
          </button>
        </div>
      )}

      {/* CodeEdit-inspired Titlebar */}
      <div className="forge-titlebar">
        <div className="forge-titlebar-left">
          <span>forge</span>
          <span className="forge-badge">v0.3.0</span>
          {workspaceRoot && (
            <span style={{ opacity: 0.8, marginLeft: 4 }}>
              — {workspaceRoot.split('/').filter(Boolean).pop()}
            </span>
          )}
        </div>

        <div className="forge-titlebar-center">
          <div
            className="forge-quick-trigger"
            onClick={() => setShowQuickOpen(true)}
            title="Search files across workspace (Cmd+P)"
          >
            <span>Search files in workspace...</span>
            <span className="forge-kbd">Cmd+P</span>
          </div>
        </div>

        <div className="forge-titlebar-right">
          <button
            style={{
              background: showProductWebsite ? 'var(--forge-accent)' : 'rgba(41, 122, 160, 0.15)',
              color: showProductWebsite ? '#ffffff' : 'var(--forge-accent)',
              border: '1px solid rgba(41, 122, 160, 0.3)',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginRight: 12,
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              if (isWebPreview) {
                window.location.hash = showProductWebsite ? '#/web-ide' : '#/';
              }
              setShowProductWebsite((prev) => !prev);
            }}
            title="View Product Website, Documentation & Guides"
          >
            <span>{showProductWebsite ? '💻' : '🌐'}</span>
            <span>{showProductWebsite ? 'Back to Editor' : isWebPreview ? 'Product Site' : 'Website & Docs'}</span>
          </button>
          <span>Yantra Works</span>
        </div>
      </div>

      {/* Main Workbench Layout */}
      <div className="forge-workbench">
        <ActivityBar
          activeView={showProductWebsite ? null : activeView}
          onSelectView={(v) => {
            setShowProductWebsite(false);
            setActiveView((prev) => (prev === v ? null : v));
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {showProductWebsite ? (
          <ProductLandingPage
            isDesktop={!isWebPreview}
            onOpenWebIDE={() => {
              if (isWebPreview) {
                window.location.hash = '#/web-ide';
              }
              setShowProductWebsite(false);
            }}
          />
        ) : (
          <>
            {activeView === 'explorer' && (
              <FileTree
                workspaceRoot={workspaceRoot}
                files={files}
                selectedPath={activeTab?.relativePath || null}
                iconTheme={settings.iconTheme}
                onSelectFile={handleSelectFile}
                onOpenFolder={handleOpenFolder}
                onRefresh={refreshWorkspace}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRenameEntry={handleRenameEntry}
                onDeleteEntry={handleDeleteEntry}
                onShowInFolder={handleShowInFolder}
                isLoading={isLoading}
              />
            )}

            {activeView === 'search' && (
              <SearchSidebar
                onSearch={handleContentSearch}
                onSelectMatch={(fileRel, line, col) => {
                  const fileObj = files.find((f) => f.relativePath === fileRel) || {
                    relativePath: fileRel,
                    absolutePath: fileRel,
                    name: fileRel.split('/').pop() || fileRel,
                    isDir: false,
                    size: 0,
                    modTime: '',
                  };
                  handleSelectFile(fileObj, line, col);
                }}
              />
            )}

            {activeView === 'git' && (
              <GitSidebar
                gitStatus={gitStatus}
                onRefresh={refreshGit}
                onStageFile={handleStageFile}
                onUnstageFile={handleUnstageFile}
                onStageAll={handleStageAll}
                onUnstageAll={handleUnstageAll}
                onDiscardChanges={handleDiscardChanges}
                onCommit={handleCommit}
                onViewDiff={handleViewDiff}
                onSwitchBranch={handleSwitchBranch}
                branches={branches}
              />
            )}

            {activeView === 'extensions' && <ExtensionsSidebar />}

            {activeView === 'terminal' && (
              <TerminalSidebar
                cwd={workspaceRoot}
                theme={settings.theme}
                onMoveToBottom={() => {
                  setActiveView(null);
                  setShowBottomPanel(true);
                }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <EditorArea
                workspaceRoot={workspaceRoot}
                tabs={tabs}
                activeTabId={activeTabId}
                settings={settings}
                onSelectTab={setActiveTabId}
                onCloseTab={handleCloseTabRequest}
                onCloseOthers={handleCloseOthers}
                onCloseAll={handleCloseAll}
                onContentChange={handleContentChange}
                onCursorChange={(line, col) => setCursorPos({ line, col })}
                onSave={handleSave}
                onOpenQuickOpen={() => setShowQuickOpen(true)}
                onOpenCommandPalette={() => setShowCommandPalette(true)}
                onOpenFolder={handleOpenFolder}
                onOpenFile={handleOpenFile}
                onRunFile={handleRunCurrentFile}
                isRunning={isRunningFile}
              />

              {showBottomPanel && (
                <BottomPanel
                  cwd={workspaceRoot}
                  theme={settings.theme}
                  health={health}
                  daemonInfo={daemonInfo}
                  indexStats={indexStats}
                  logs={logs}
                  onClose={() => setShowBottomPanel(false)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        branch={gitStatus?.branch || 'main'}
        isGitRepo={Boolean(gitStatus?.isRepo)}
        cursorLine={cursorPos.line}
        cursorCol={cursorPos.col}
        activeLanguage={activeTab?.languageId || 'plaintext'}
        encoding="UTF-8"
        theme={settings.theme}
        indexStats={indexStats}
        health={health}
        onToggleTheme={() =>
          handleUpdateSettings({
            theme:
              settings.theme === '2026-dark'
                ? 'graphite-dark'
                : settings.theme === 'graphite-dark'
                ? 'sand-light'
                : '2026-dark',
          })
        }
        onToggleBottomPanel={() => setShowBottomPanel((p) => !p)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Modals */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      <QuickOpen
        isOpen={showQuickOpen}
        onClose={() => setShowQuickOpen(false)}
        onSelectFile={(file) => handleSelectFile(file)}
        searchFiles={searchWorkspaceFiles}
        iconTheme={settings.iconTheme}
      />

      <UnsavedChangesModal
        isOpen={Boolean(pendingCloseTabId)}
        fileName={pendingCloseTab?.title || 'file'}
        onSave={async () => {
          if (pendingCloseTabId) {
            await handleSave();
            executeCloseTab(pendingCloseTabId);
          }
        }}
        onDontSave={() => {
          if (pendingCloseTabId) {
            executeCloseTab(pendingCloseTabId);
          }
        }}
        onCancel={() => {
          setPendingCloseTabId(null);
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
};
