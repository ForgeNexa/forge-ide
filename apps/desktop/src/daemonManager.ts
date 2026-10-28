import { spawn, ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import {
  JSONRPCRequest,
  JSONRPCResponse,
  DaemonInfo,
  SystemHealth,
  IndexStats,
  FileEntry,
  FileChangeEvent,
} from '@my-forge/shared-protocol';

export class DaemonManager {
  private process: ChildProcess | null = null;
  private requestId = 1;
  private pendingRequests = new Map<number, {
    resolve: (res: any) => void;
    reject: (err: any) => void;
    timer: NodeJS.Timeout;
  }>();
  private notificationListeners = new Map<string, Set<(params: any) => void>>();
  private rl: readline.Interface | null = null;
  private isShuttingDown = false;

  constructor() {}

  public async start(): Promise<DaemonInfo> {
    const daemonBinary = this.resolveBinaryPath();
    console.log(`[DaemonManager] Launching Go daemon binary: ${daemonBinary}`);

    this.process = spawn(daemonBinary, [], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env },
    });

    this.process.on('error', (err) => {
      console.error('[DaemonManager] Failed to start Go daemon process:', err);
    });

    this.process.on('exit', (code, signal) => {
      console.log(`[DaemonManager] Go daemon process exited with code=${code}, signal=${signal}`);
      this.cleanup();
      if (!this.isShuttingDown) {
        console.warn('[DaemonManager] Daemon exited unexpectedly.');
      }
    });

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error('Failed to bind stdio pipes for Go daemon');
    }

    this.rl = readline.createInterface({
      input: this.process.stdout,
      terminal: false,
    });

    this.rl.on('line', (line) => {
      this.handleIncomingLine(line);
    });

    // Send initialize request
    const initInfo = await this.call<DaemonInfo>('initialize');
    console.log('[DaemonManager] Daemon initialized successfully:', initInfo);
    return initInfo;
  }

  private resolveBinaryPath(): string {
    const isWindows = process.platform === 'win32';
    const names = isWindows ? ['forge-daemon.exe', 'forge-daemon'] : ['forge-daemon', 'forge-daemon.exe'];
    const searchDirs = [
      path.resolve(__dirname, '../../../services/forge-daemon/bin'),
      path.resolve(__dirname, '../../services/forge-daemon/bin'),
      path.resolve(process.cwd(), 'services/forge-daemon/bin'),
    ];

    const candidates: string[] = [];
    for (const dir of searchDirs) {
      for (const name of names) {
        candidates.push(path.join(dir, name));
      }
    }

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c;
      }
    }

    throw new Error(
      `forge-daemon binary not found. Checked: ${candidates.join(', ')}. Please run 'npm run build:daemon'.`
    );
  }

  private handleIncomingLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const data = JSON.parse(trimmed);

      // Asynchronous JSON-RPC 2.0 notifications (has method, no id)
      if (data.method && (data.id === undefined || data.id === null)) {
        const listeners = this.notificationListeners.get(data.method);
        if (listeners) {
          for (const listener of listeners) {
            try {
              listener(data.params);
            } catch (err) {
              console.error(`[DaemonManager] Error in listener for ${data.method}:`, err);
            }
          }
        }
        return;
      }

      const resp: JSONRPCResponse = data;
      const id = typeof resp.id === 'number' ? resp.id : -1;
      const pending = this.pendingRequests.get(id);

      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(id);

        if (resp.error) {
          pending.reject(new Error(`RPC Error [${resp.error.code}]: ${resp.error.message}`));
        } else {
          pending.resolve(resp.result);
        }
      }
    } catch (err) {
      console.error('[DaemonManager] Error parsing daemon JSON-RPC response:', err, line);
    }
  }

  public onNotification<T = any>(method: string, listener: (params: T) => void): () => void {
    if (!this.notificationListeners.has(method)) {
      this.notificationListeners.set(method, new Set());
    }
    const set = this.notificationListeners.get(method)!;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  public onFileChange(listener: (event: FileChangeEvent) => void): () => void {
    const unsubCreated = this.onNotification<FileChangeEvent>('workspace/fileCreated', listener);
    const unsubModified = this.onNotification<FileChangeEvent>('workspace/fileModified', listener);
    const unsubDeleted = this.onNotification<FileChangeEvent>('workspace/fileDeleted', listener);
    return () => {
      unsubCreated();
      unsubModified();
      unsubDeleted();
    };
  }

  public call<T>(method: string, params?: unknown, timeoutMs = 8000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin || this.process.killed) {
        return reject(new Error('Go daemon is not running'));
      }

      const id = this.requestId++;
      const req: JSONRPCRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Daemon RPC call '${method}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        const payload = JSON.stringify(req) + '\n';
        this.process.stdin.write(payload, 'utf8');
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  public async getHealth(): Promise<SystemHealth> {
    return this.call<SystemHealth>('system/health');
  }

  public async setWorkspaceFolder(folderPath: string): Promise<{ success: boolean; root: string }> {
    return this.call<{ success: boolean; root: string }>('workspace/setFolder', { path: folderPath });
  }

  public async getWorkspaceFolder(): Promise<{ root: string }> {
    return this.call<{ root: string }>('workspace/getFolder');
  }

  public async indexWorkspace(): Promise<IndexStats> {
    return this.call<IndexStats>('workspace/index');
  }

  public async listDirectory(relPath: string = ''): Promise<FileEntry[]> {
    return this.call<FileEntry[]>('workspace/listDirectory', { path: relPath });
  }

  public async searchFiles(query: string, limit = 50): Promise<FileEntry[]> {
    return this.call<FileEntry[]>('workspace/searchFiles', { query, limit });
  }

  public async searchContent(
    query: string,
    options?: { isCaseSensitive?: boolean; isWholeWord?: boolean; maxMatches?: number }
  ): Promise<any> {
    return this.call('workspace/searchContent', {
      query,
      caseSensitive: options?.isCaseSensitive || false,
      wholeWord: options?.isWholeWord || false,
      maxMatches: options?.maxMatches || 250,
    });
  }

  public async createFile(relPath: string, content = ''): Promise<{ success: boolean; path: string }> {
    return this.call<{ success: boolean; path: string }>('workspace/createFile', { path: relPath, content });
  }

  public async createFolder(relPath: string): Promise<{ success: boolean; path: string }> {
    return this.call<{ success: boolean; path: string }>('workspace/createFolder', { path: relPath });
  }

  public async renameEntry(
    oldRelPath: string,
    newRelPath: string
  ): Promise<{ success: boolean; oldPath: string; newPath: string }> {
    return this.call<{ success: boolean; oldPath: string; newPath: string }>('workspace/renameEntry', {
      oldPath: oldRelPath,
      newPath: newRelPath,
    });
  }

  public async deleteEntry(relPath: string): Promise<{ success: boolean; path: string }> {
    return this.call<{ success: boolean; path: string }>('workspace/deleteEntry', { path: relPath });
  }

  public async readFile(filePath: string): Promise<{ path: string; content: string }> {
    return this.call<{ path: string; content: string }>('workspace/readFile', { path: filePath });
  }

  public async writeFile(filePath: string, content: string): Promise<{ success: boolean; path: string }> {
    return this.call<{ success: boolean; path: string }>('workspace/writeFile', { path: filePath, content });
  }

  public async stop(): Promise<void> {
    this.isShuttingDown = true;
    try {
      if (this.process && !this.process.killed) {
        await Promise.race([
          this.call('shutdown', {}, 1000),
          new Promise((r) => setTimeout(r, 1000)),
        ]);
        this.process.kill('SIGTERM');
      }
    } catch {
      // Ignore shutdown errors
    } finally {
      this.cleanup();
    }
  }

  private cleanup() {
    for (const [, p] of this.pendingRequests) {
      clearTimeout(p.timer);
      p.reject(new Error('Daemon stopped'));
    }
    this.pendingRequests.clear();
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    this.process = null;
  }
}
