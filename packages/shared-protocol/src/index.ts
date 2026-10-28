export interface JSONRPCRequest<T = unknown> {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: T;
}

export interface JSONRPCResponse<T = unknown> {
  jsonrpc: '2.0';
  id?: number | string;
  result?: T;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

export interface FileEntry {
  relativePath: string;
  absolutePath: string;
  name: string;
  isDir: boolean;
  size: number;
  modTime: string;
  languageId?: string;
}

export interface IndexStats {
  totalFiles: number;
  totalDirs: number;
  durationMs: number;
  lastIndexedAt: string;
  workspaceRoot: string;
}

export interface SystemHealth {
  status: string;
  uptimeSec: number;
  goroutines: number;
  allocBytes: number;
  sysBytes: number;
  numGC: number;
}

export interface DaemonInfo {
  server: string;
  version: string;
  protocol: string;
  pid: number;
  go: string;
  os: string;
  arch: string;
}

// Content search interfaces
export interface ContentSearchMatch {
  relativePath: string;
  absolutePath: string;
  line: number;
  column: number;
  lineText: string;
  matchLength: number;
}

export interface ContentSearchResult {
  query: string;
  matches: ContentSearchMatch[];
  totalMatches: number;
  fileCount: number;
  durationMs: number;
}

// Git interfaces
export interface GitFileStatus {
  path: string;
  status: 'modified' | 'untracked' | 'staged' | 'deleted' | 'renamed' | 'conflicted';
  staged: boolean;
  workingTreeStatus: string;
  indexStatus: string;
}

export interface GitRepositoryStatus {
  isRepo: boolean;
  branch: string;
  upstream?: string;
  files: GitFileStatus[];
  ahead: number;
  behind: number;
}

export interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  message?: string;
  error?: string;
}

// File Execution interfaces
export interface RunResult {
  success: boolean;
  runtime: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

// Settings & Preferences (Google Antigravity IDE style)
export interface ForgeSettings {
  theme: '2026-dark' | 'graphite-dark' | 'sand-light';
  iconTheme: 'material-icon-theme' | 'minimal';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  bracketPairColorization: boolean;
  autoClosingBrackets: boolean;
  cursorBlinking: 'smooth' | 'blink' | 'solid';
  // Go Daemon & Performance
  maxFileSizeMB: number;
  autoReindexDebounceMs: number;
  // Agentic & AI Pairing (Antigravity IDE mode)
  aiEnabled: boolean;
  aiProvider: 'gemini-3.8-flash' | 'gemini-pro' | 'claude-3.7' | 'local';
  aiInlineCompletions: boolean;
  aiContextAwareness: boolean;
  // Privacy & Local-first
  telemetryEnabled: boolean;
  localOnlyMode: boolean;
  // Terminal dock position
  terminalPosition: 'sidebar' | 'bottom';
}

// Diagnostic marker for Problems tab
export interface DiagnosticMarker {
  id: string;
  file: string;
  line: number;
  col: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: string;
}

// Detected Project Task
export interface ProjectTask {
  id: string;
  name: string;
  command: string;
  source: string;
  status: 'idle' | 'running' | 'success' | 'failed';
}

// Extension metadata
export interface ExtensionItem {
  id: string;
  name: string;
  displayName: string;
  publisher: string;
  version: string;
  description: string;
  category: 'theme' | 'language' | 'snippet' | 'tool';
  supported: boolean;
  supportNote: string;
  installed: boolean;
  enabled?: boolean;
  iconUrl?: string;
  downloads?: number;
  rating?: number;
}

// Window API interface exposed via Electron preload contextBridge
export interface MyForgeAPI {
  // Daemon methods
  getDaemonInfo: () => Promise<DaemonInfo>;
  getDaemonHealth: () => Promise<SystemHealth>;
  setWorkspaceFolder: (path: string) => Promise<{ success: boolean; root: string }>;
  getWorkspaceFolder: () => Promise<{ root: string }>;
  indexWorkspace: () => Promise<IndexStats>;
  listDirectory: (path?: string) => Promise<FileEntry[]>;
  searchFiles: (query: string, limit?: number) => Promise<FileEntry[]>;
  searchContent: (
    query: string,
    options?: { isCaseSensitive?: boolean; isWholeWord?: boolean }
  ) => Promise<ContentSearchResult>;
  readFile: (path: string) => Promise<{ path: string; content: string }>;
  writeFile: (path: string, content: string) => Promise<{ success: boolean; path: string }>;

  // File/Folder CRUD
  createFile: (relPath: string, content?: string) => Promise<{ success: boolean; path: string }>;
  createFolder: (relPath: string) => Promise<{ success: boolean; path: string }>;
  renameEntry: (oldRelPath: string, newRelPath: string) => Promise<{ success: boolean; oldPath: string; newPath: string }>;
  deleteEntry: (relPath: string) => Promise<{ success: boolean; path: string }>;
  showInFolder: (relPath: string) => Promise<boolean>;

  // Native OS dialogs
  openFolderDialog: () => Promise<string | null>;
  openFileDialog: () => Promise<string | null>;
  saveFileDialog: (defaultName?: string) => Promise<string | null>;

  // Git operations
  gitGetStatus: () => Promise<GitRepositoryStatus>;
  gitStageFile: (path: string) => Promise<{ success: boolean }>;
  gitUnstageFile: (path: string) => Promise<{ success: boolean }>;
  gitStageAll: () => Promise<{ success: boolean }>;
  gitUnstageAll: () => Promise<{ success: boolean }>;
  gitDiscardChanges: (path: string) => Promise<{ success: boolean }>;
  gitCommit: (message: string) => Promise<GitCommitResult>;
  gitGetDiff: (path: string, staged?: boolean) => Promise<{ original: string; modified: string }>;
  gitGetBranches: () => Promise<string[]>;
  gitSwitchBranch: (branch: string) => Promise<{ success: boolean }>;
  gitCreateBranch: (branch: string) => Promise<{ success: boolean }>;

  // Terminal PTY operations
  terminalCreate: (options?: { cwd?: string; cols?: number; rows?: number }) => Promise<{ id: string }>;
  terminalWrite: (id: string, data: string) => Promise<void>;
  terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
  terminalClose: (id: string) => Promise<void>;
  onTerminalData: (callback: (id: string, data: string) => void) => () => void;
  onTerminalExit: (callback: (id: string, exitCode: number) => void) => () => void;

  // Run File & Tasks
  runFile: (filePath: string) => Promise<RunResult>;
  taskDetect: () => Promise<ProjectTask[]>;
  taskRun: (task: ProjectTask) => Promise<{ taskId: string }>;
  taskKill: (taskId: string) => Promise<boolean>;
  onTaskOutput: (callback: (taskId: string, chunk: string) => void) => () => void;
  onTaskExit: (callback: (taskId: string, exitCode: number) => void) => () => void;

  // Extensions
  extensionSearch: (query: string) => Promise<ExtensionItem[]>;
  extensionInstall: (id: string) => Promise<boolean>;
  extensionUninstall: (id: string) => Promise<boolean>;
  extensionToggleEnable: (id: string, enabled: boolean) => Promise<boolean>;
  extensionGetInstalled: () => Promise<ExtensionItem[]>;

  // Settings & Workspaces
  getSettings: () => Promise<ForgeSettings>;
  saveSettings: (settings: Partial<ForgeSettings>) => Promise<ForgeSettings>;
  getRecentWorkspaces: () => Promise<string[]>;

  // Window control
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    myForgeAPI?: MyForgeAPI;
  }
}
