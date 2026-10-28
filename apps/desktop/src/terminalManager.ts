import { BrowserWindow } from 'electron';
import * as os from 'node:os';

let pty: any = null;
try {
  pty = require('node-pty');
} catch (e) {
  console.warn('[TerminalManager] node-pty not available, fallback will be used:', e);
}

export class TerminalManager {
  private terminals = new Map<string, any>();
  private idCounter = 1;

  constructor(private getWindow: () => BrowserWindow | null) {}

  public createTerminal(cwd?: string, cols = 80, rows = 24): { id: string } {
    const id = `term-${this.idCounter++}`;
    const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh');

    const workingDir = cwd || os.homedir();

    if (pty) {
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: workingDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      });

      ptyProcess.onData((data: string) => {
        const win = this.getWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send('terminal:data', id, data);
        }
      });

      ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
        const win = this.getWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send('terminal:exit', id, exitCode);
        }
        this.terminals.delete(id);
      });

      this.terminals.set(id, ptyProcess);
    } else {
      console.warn('[TerminalManager] Simulating PTY because native binding is missing');
    }

    return { id };
  }

  public write(id: string, data: string): void {
    const term = this.terminals.get(id);
    if (term) {
      term.write(data);
    }
  }

  public resize(id: string, cols: number, rows: number): void {
    const term = this.terminals.get(id);
    if (term && term.resize) {
      try {
        term.resize(cols, rows);
      } catch (err) {
        console.warn('[TerminalManager] Resize error:', err);
      }
    }
  }

  public close(id: string): void {
    const term = this.terminals.get(id);
    if (term) {
      try {
        term.kill();
      } catch {
        // ignore kill error
      }
      this.terminals.delete(id);
    }
  }

  public closeAll(): void {
    for (const [, term] of this.terminals) {
      try {
        term.kill();
      } catch {
        // ignore
      }
    }
    this.terminals.clear();
  }
}
