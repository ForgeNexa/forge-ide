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

// Settings & Preferences (Comprehensive IDE Settings Engine)
export interface ForgeSettings {
  // A. Appearance and UI
  theme: '2026-dark' | 'graphite-dark' | 'sand-light';
  iconTheme: 'material-icon-theme' | 'minimal';
  uiDensity: 'comfortable' | 'compact';
  uiFontSize: number;
  uiFontFamily: string;
  fontSize: number;
  fontFamily: string;
  terminalFontSize: number;
  terminalFontFamily: string;
  smoothScrolling: boolean;
  breadcrumbs: boolean;
  stickyScroll: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  minimap: boolean;
  cursorBlinking: 'smooth' | 'blink' | 'solid';

  // B. Editor
  tabSize: number;
  insertSpaces: boolean;
  detectIndentation: boolean;
  wordWrap: boolean;
  bracketPairColorization: boolean;
  autoClosingBrackets: boolean;
  autoClosingQuotes: boolean;
  highlightMatchingBrackets: boolean;
  highlightCurrentLine: boolean;
  codeFolding: boolean;

  // C. Files and Autosave
  autoSave: 'off' | 'afterDelay' | 'onFocusChange';
  autoSaveDelayMs: number;
  confirmCloseUnsaved: boolean;
  restorePreviousTabs: boolean;
  restorePreviousWorkspace: boolean;
  maxFileSizeMB: number;

  // D. Language and IntelliSense
  autoLanguageDetection: boolean;
  quickSuggestions: boolean;
  parameterHints: boolean;
  suggestionDelayMs: number;
  lspEnabled: boolean;
  aiEnabled: boolean;
  aiProvider: 'gemini-3.8-flash' | 'gemini-pro' | 'claude-3.7' | 'local';
  aiInlineCompletions: boolean;
  aiContextAwareness: boolean;

  // E. Formatting
  formatOnSave: boolean;
  formatOnPaste: boolean;
  formatOnType: boolean;
  defaultFormatter: string;
  formattingTimeoutMs: number;

  // F. Diagnostics and Error Highlighting
  diagnosticsEnabled: boolean;
  diagnosticsDebounceMs: number;
  inlineErrors: boolean;

  // G. Terminal and Tasks
  terminalPosition: 'bottom';
  defaultShell: string;
  terminalScrollback: number;
  terminalCursorStyle: 'block' | 'underline' | 'bar';

  // H. Git and Source Control
  gitAutoDetect: boolean;
  gitAutoRefresh: boolean;
  gitConfirmDestructive: boolean;
  gitGutterIndicators: boolean;

  // I. Extensions & Go Daemon Performance
  autoReindexDebounceMs: number;

  // J. Advanced & Privacy
  telemetryEnabled: boolean;
  localOnlyMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  searchMaxResults: number;
}

export const defaultForgeSettings: ForgeSettings = {
  theme: '2026-dark',
  iconTheme: 'material-icon-theme',
  uiDensity: 'comfortable',
  uiFontSize: 13,
  uiFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 13,
  fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
  terminalFontSize: 12,
  terminalFontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
  smoothScrolling: true,
  breadcrumbs: true,
  stickyScroll: true,
  lineNumbers: 'on',
  minimap: true,
  cursorBlinking: 'smooth',

  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  wordWrap: true,
  bracketPairColorization: true,
  autoClosingBrackets: true,
  autoClosingQuotes: true,
  highlightMatchingBrackets: true,
  highlightCurrentLine: true,
  codeFolding: true,

  autoSave: 'afterDelay',
  autoSaveDelayMs: 1000,
  confirmCloseUnsaved: true,
  restorePreviousTabs: true,
  restorePreviousWorkspace: true,
  maxFileSizeMB: 10,

  autoLanguageDetection: true,
  quickSuggestions: true,
  parameterHints: true,
  suggestionDelayMs: 50,
  lspEnabled: true,
  aiEnabled: true,
  aiProvider: 'local',
  aiInlineCompletions: true,
  aiContextAwareness: true,

  formatOnSave: true,
  formatOnPaste: false,
  formatOnType: false,
  defaultFormatter: 'default',
  formattingTimeoutMs: 2500,

  diagnosticsEnabled: true,
  diagnosticsDebounceMs: 250,
  inlineErrors: true,

  terminalPosition: 'bottom',
  defaultShell: 'zsh',
  terminalScrollback: 5000,
  terminalCursorStyle: 'block',

  gitAutoDetect: true,
  gitAutoRefresh: true,
  gitConfirmDestructive: true,
  gitGutterIndicators: true,

  autoReindexDebounceMs: 250,

  telemetryEnabled: false,
  localOnlyMode: true,
  logLevel: 'info',
  searchMaxResults: 500,
};

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

// Language Server Definition & Status
export interface LanguageServerInfo {
  languageId: string;
  languageName: string;
  serverName: string;
  binaryName: string;
  installCommand: string;
  bundled: boolean;
  available: boolean;
  detectedPath?: string;
  capabilities: {
    completion: boolean;
    diagnostics: boolean;
    hover: boolean;
    definition: boolean;
    formatting: boolean;
  };
  license: string;
  sdkRequirement: string;
}

// LSP Symbol and Intelligence Types
export interface DocumentSymbol {
  name: string;
  kind: 'function' | 'method' | 'class' | 'interface' | 'variable' | 'type' | 'constant';
  line: number;
  col: number;
  endLine?: number;
  containerName?: string;
}

export interface DefinitionResult {
  file: string;
  line: number;
  col: number;
  matchedText: string;
}

export interface HoverResult {
  symbol: string;
  signature: string;
  doc?: string;
  language: string;
}

// Local AI Autocomplete request and response
export interface AICompletionRequest {
  prefix: string;
  suffix: string;
  languageId: string;
  filename: string;
  maxTokens?: number;
}

export interface AICompletionResult {
  text: string;
  model: string;
  durationMs: number;
  cached?: boolean;
}

export interface AIProviderStatus {
  provider: 'ollama' | 'tabby' | 'local' | 'disabled';
  model: string;
  available: boolean;
  endpoint: string;
  latencyMs?: number;
  memoryUsageMB?: number;
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

  // Language Server Protocol (LSP)
  lspGetRegistry: () => Promise<LanguageServerInfo[]>;
  lspGetDiagnostics: (filePath?: string) => Promise<DiagnosticMarker[]>;
  lspGetDocumentSymbols: (filePath: string, content?: string) => Promise<DocumentSymbol[]>;
  lspGetDefinition: (filePath: string, symbol: string) => Promise<DefinitionResult | null>;
  lspGetHover: (filePath: string, symbol: string) => Promise<HoverResult | null>;

  // Local AI Autocomplete
  aiGetCompletion: (req: AICompletionRequest) => Promise<AICompletionResult | null>;
  aiGetStatus: () => Promise<AIProviderStatus>;

  // Settings & Workspaces
  getSettings: () => Promise<ForgeSettings>;
  saveSettings: (settings: Partial<ForgeSettings>) => Promise<ForgeSettings>;
  resetSettings: () => Promise<ForgeSettings>;
  exportSettings: () => Promise<string>;
  importSettings: (json: string) => Promise<{ success: boolean; settings?: ForgeSettings; error?: string }>;
  getRecentWorkspaces: () => Promise<string[]>;

  // Diagnostics & Logs
  getDiagnosticReport: () => Promise<Record<string, any>>;
  openLogDir: () => Promise<string>;

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
