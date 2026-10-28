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
  readFile: (path: string) => Promise<{ path: string; content: string }>;
  writeFile: (path: string, content: string) => Promise<{ success: boolean; path: string }>;

  // Native OS dialogs
  openFolderDialog: () => Promise<string | null>;
  openFileDialog: () => Promise<string | null>;

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
