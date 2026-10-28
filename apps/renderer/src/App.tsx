import { useState, useEffect, useCallback, type FC, type MouseEvent } from 'react';
import {
  FileEntry,
  IndexStats,
  SystemHealth,
  DaemonInfo,
} from '@my-forge/shared-protocol';
import { ActivityBar, ActivityView } from './components/ActivityBar';
import { FileTree } from './components/FileTree';
import { EditorArea, EditorTab } from './components/EditorArea';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { QuickOpen } from './components/QuickOpen';
import './styles/app.css';

export const App: FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'graphite-dark' | 'sand-light'>('graphite-dark');

  // Workspace state
  const [workspaceRoot, setWorkspaceRoot] = useState<string>('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);

  // Daemon state
  const [daemonInfo, setDaemonInfo] = useState<DaemonInfo | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Editor tabs
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Layout states
  const [activeView, setActiveView] = useState<ActivityView | null>('explorer');
  const [showBottomPanel, setShowBottomPanel] = useState(true);

  // Modal overlays
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showQuickOpen, setShowQuickOpen] = useState(false);

  // Cursor indicator
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const appendLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`].slice(-200));
  }, []);

  // Update DOM data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial daemon connect and workspace scan
  useEffect(() => {
    const initApp = async () => {
      appendLog('Initializing my-forge workspace...');
      if (window.myForgeAPI) {
        try {
          const info = await window.myForgeAPI.getDaemonInfo();
          setDaemonInfo(info);
          appendLog(`Connected to Go daemon (${info.server} v${info.version}, Go ${info.go})`);

          const wsFolder = await window.myForgeAPI.getWorkspaceFolder();
          if (wsFolder?.root) {
            setWorkspaceRoot(wsFolder.root);
            appendLog(`Active workspace: ${wsFolder.root}`);
            await refreshWorkspace();
          }

          const h = await window.myForgeAPI.getDaemonHealth();
          setHealth(h);
        } catch (err: any) {
          appendLog(`Daemon connection error: ${err.message}`);
        }
      } else {
        // Standalone browser development mode preview
        appendLog('Running in standalone preview mode (mock Go daemon).');
        setWorkspaceRoot('/sample/my-forge-project');
        setFiles([
          { relativePath: 'src/main.go', absolutePath: '/sample/src/main.go', name: 'main.go', isDir: false, size: 240, modTime: '', languageId: 'go' },
          { relativePath: 'src/app.ts', absolutePath: '/sample/src/app.ts', name: 'app.ts', isDir: false, size: 480, modTime: '', languageId: 'typescript' },
          { relativePath: 'README.md', absolutePath: '/sample/README.md', name: 'README.md', isDir: false, size: 820, modTime: '', languageId: 'markdown' },
          { relativePath: 'package.json', absolutePath: '/sample/package.json', name: 'package.json', isDir: false, size: 650, modTime: '', languageId: 'json' },
        ]);
        setIndexStats({
          totalFiles: 4,
          totalDirs: 1,
          durationMs: 1,
          lastIndexedAt: new Date().toISOString(),
          workspaceRoot: '/sample/my-forge-project',
        });
      }
    };

    initApp();
  }, []);

  // Poll daemon health every 5 seconds
  useEffect(() => {
    if (!window.myForgeAPI) return;
    const interval = setInterval(async () => {
      try {
        const h = await window.myForgeAPI!.getDaemonHealth();
        setHealth(h);
      } catch {
        // Ignore health poll errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rescan workspace with Go
  const refreshWorkspace = async () => {
    if (!window.myForgeAPI) return;
    setIsLoading(true);
    appendLog('Starting workspace index scan via Go daemon...');
    try {
      const stats = await window.myForgeAPI.indexWorkspace();
      setIndexStats(stats);
      const entries = await window.myForgeAPI.listDirectory('');
      setFiles(entries);
      appendLog(`Indexing complete: ${stats.totalFiles} files, ${stats.totalDirs} dirs in ${stats.durationMs}ms`);
    } catch (err: any) {
      appendLog(`Indexing failed: ${err.message}`);
    } finally {
      setIsLoading(false);
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
          await refreshWorkspace();
        }
      } catch (err: any) {
        appendLog(`Open folder error: ${err.message}`);
      }
    }
  };

  // Open file in editor tab
  const handleSelectFile = async (file: FileEntry) => {
    if (file.isDir) return;

    // Check if already open
    const existing = tabs.find((t) => t.relativePath === file.relativePath);
    if (existing) {
      setActiveTabId(existing.id);
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
      content = `// my-forge preview\n// File: ${file.relativePath}\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello from my-forge!")\n}\n`;
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
    appendLog(`Opened file: ${file.relativePath}`);
  };

  const handleCloseTab = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        const nextActive = filtered[filtered.length - 1]?.id || null;
        setActiveTabId(nextActive);
      }
      return filtered;
    });
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

  // Save current active tab
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
        appendLog(`Saved file: ${activeTab.relativePath}`);
      } catch (err: any) {
        appendLog(`Error saving file ${activeTab.relativePath}: ${err.message}`);
      }
    } else {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id ? { ...t, isDirty: false, originalContent: t.content } : t
        )
      );
      appendLog(`Saved (mock): ${activeTab.relativePath}`);
    }
  };

  // Quick Open search query forwarding to Go daemon
  const searchWorkspaceFiles = async (query: string): Promise<FileEntry[]> => {
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

  // Global keyboard shortcut dispatcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd+P: Quick Open
      if (isCmdOrCtrl && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        setShowQuickOpen(true);
        setShowCommandPalette(false);
      }
      // Cmd+Shift+P: Command Palette
      else if (isCmdOrCtrl && e.key === 'P' && e.shiftKey) {
        e.preventDefault();
        setShowCommandPalette(true);
        setShowQuickOpen(false);
      }
      // Cmd+B: Toggle Sidebar
      else if (isCmdOrCtrl && e.key === 'b') {
        e.preventDefault();
        setActiveView((prev) => (prev ? null : 'explorer'));
      }
      // Cmd+J: Toggle Bottom Panel
      else if (isCmdOrCtrl && e.key === 'j') {
        e.preventDefault();
        setShowBottomPanel((prev) => !prev);
      }
      // Cmd+S: Save
      else if (isCmdOrCtrl && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Cmd+W: Close Tab
      else if (isCmdOrCtrl && e.key === 'w' && activeTabId) {
        e.preventDefault();
        const fakeEvent = { stopPropagation: () => {} } as unknown as MouseEvent;
        handleCloseTab(activeTabId, fakeEvent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Command palette command list
  const commands: CommandItem[] = [
    {
      id: 'quick-open',
      label: 'Go to File...',
      category: 'File',
      shortcut: 'Cmd+P',
      action: () => setShowQuickOpen(true),
    },
    {
      id: 'open-folder',
      label: 'Open Folder...',
      category: 'File',
      action: handleOpenFolder,
    },
    {
      id: 'save-file',
      label: 'Save Active File',
      category: 'File',
      shortcut: 'Cmd+S',
      action: handleSave,
    },
    {
      id: 'rescan-go',
      label: 'Rescan Workspace with Go Indexer',
      category: 'Go Backend',
      action: refreshWorkspace,
    },
    {
      id: 'toggle-theme',
      label: `Switch to ${theme === 'graphite-dark' ? 'Sand Light' : 'Graphite Dark'} Theme`,
      category: 'Preferences',
      action: () => setTheme((t) => (t === 'graphite-dark' ? 'sand-light' : 'graphite-dark')),
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Primary Sidebar',
      category: 'View',
      shortcut: 'Cmd+B',
      action: () => setActiveView((v) => (v ? null : 'explorer')),
    },
    {
      id: 'toggle-panel',
      label: 'Toggle Bottom Panel',
      category: 'View',
      shortcut: 'Cmd+J',
      action: () => setShowBottomPanel((p) => !p),
    },
  ];

  return (
    <div className="forge-app">
      {/* Titlebar */}
      <div className="forge-titlebar">
        <div className="forge-titlebar-left">
          <span>my-forge</span>
          <span className="forge-badge">v0.1.0</span>
          {workspaceRoot && (
            <span style={{ opacity: 0.7, marginLeft: 6 }}>
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
          <span>Yantra Works</span>
        </div>
      </div>

      {/* Main Workbench Layout */}
      <div className="forge-workbench">
        <ActivityBar
          activeView={activeView}
          onSelectView={(v) => setActiveView((prev) => (prev === v ? null : v))}
          onOpenSettings={() => setShowCommandPalette(true)}
        />

        {activeView === 'explorer' && (
          <FileTree
            workspaceRoot={workspaceRoot}
            files={files}
            selectedPath={activeTab?.relativePath || null}
            onSelectFile={handleSelectFile}
            onOpenFolder={handleOpenFolder}
            onRefresh={refreshWorkspace}
            isLoading={isLoading}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <EditorArea
            tabs={tabs}
            activeTabId={activeTabId}
            theme={theme}
            onSelectTab={setActiveTabId}
            onCloseTab={handleCloseTab}
            onContentChange={handleContentChange}
            onCursorChange={(line, col) => setCursorPos({ line, col })}
            onSave={handleSave}
            onOpenQuickOpen={() => setShowQuickOpen(true)}
            onOpenCommandPalette={() => setShowCommandPalette(true)}
          />

          {showBottomPanel && (
            <BottomPanel
              health={health}
              daemonInfo={daemonInfo}
              indexStats={indexStats}
              logs={logs}
            />
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        branch="main"
        cursorLine={cursorPos.line}
        cursorCol={cursorPos.col}
        activeLanguage={activeTab?.languageId || 'plaintext'}
        encoding="UTF-8"
        theme={theme}
        indexStats={indexStats}
        health={health}
        onToggleTheme={() => setTheme((t) => (t === 'graphite-dark' ? 'sand-light' : 'graphite-dark'))}
        onToggleBottomPanel={() => setShowBottomPanel((p) => !p)}
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
        onSelectFile={handleSelectFile}
        searchFiles={searchWorkspaceFiles}
      />
    </div>
  );
};
