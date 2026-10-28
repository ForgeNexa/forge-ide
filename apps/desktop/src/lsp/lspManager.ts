import * as path from 'node:path';
import * as fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { DiagnosticMarker, LanguageServerInfo } from '@my-forge/shared-protocol';
import { detectInstalledLanguageServers } from './lspRegistry';

const execAsync = promisify(exec);

export class LspManager {
  private cachedRegistry: LanguageServerInfo[] | null = null;

  constructor() {}

  /**
   * Returns list of supported language servers and their availability.
   */
  public async getRegistry(): Promise<LanguageServerInfo[]> {
    this.cachedRegistry = detectInstalledLanguageServers();
    return this.cachedRegistry;
  }

  /**
   * Performs quick diagnostic check on the current workspace or target file.
   */
  public async getDiagnostics(
    workspaceRoot: string,
    targetFile?: string
  ): Promise<DiagnosticMarker[]> {
    if (!workspaceRoot || !fs.existsSync(workspaceRoot)) {
      return [];
    }

    const markers: DiagnosticMarker[] = [];

    // Check Go diagnostics if go.mod exists or target is a Go file
    const isGoWorkspace = fs.existsSync(path.join(workspaceRoot, 'go.mod'));
    const isGoFile = targetFile?.endsWith('.go');

    if (isGoWorkspace || isGoFile) {
      try {
        await execAsync('go vet ./...', { cwd: workspaceRoot, timeout: 3000 });
      } catch (err: any) {
        if (err.stderr || err.stdout) {
          const output = (err.stderr || err.stdout).toString();
          const lines = output.split('\n');
          for (const line of lines) {
            // format: file.go:line:col: message or file.go:line: message
            const match = line.match(/^([^:]+):(\d+)(?::(\d+))?:\s+(.*)$/);
            if (match) {
              const relFile = match[1].trim();
              const lineNum = parseInt(match[2], 10);
              const colNum = match[3] ? parseInt(match[3], 10) : 1;
              const msg = match[4].trim();

              markers.push({
                id: `go-${relFile}-${lineNum}-${colNum}`,
                file: relFile,
                line: lineNum,
                col: colNum,
                severity: 'error',
                message: msg,
                source: 'go vet',
              });
            }
          }
        }
      }
    }

    // Check Python file syntax if target is a Python file
    if (targetFile?.endsWith('.py')) {
      const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(workspaceRoot, targetFile);
      if (fs.existsSync(fullPath)) {
        try {
          await execAsync(`python3 -m py_compile "${fullPath}"`, { timeout: 2000 });
        } catch (err: any) {
          const output = (err.stderr || err.stdout || '').toString();
          const match = output.match(/File "(.*?)", line (\d+)(?:, in .*)?\n(?:\s+.*\n)?(?:\s+\^\n)?(\w+Error: .*)/);
          if (match) {
            markers.push({
              id: `py-${targetFile}-${match[2]}`,
              file: targetFile,
              line: parseInt(match[2], 10),
              col: 1,
              severity: 'error',
              message: match[3],
              source: 'py_compile',
            });
          }
        }
      }
    }

    // Check TypeScript / JavaScript syntax / diagnostics if package.json has tsconfig.json
    const tsconfigPath = path.join(workspaceRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath) && (!targetFile || targetFile.match(/\.(ts|tsx)$/))) {
      try {
        await execAsync('npx --no-install tsc --noEmit --pretty false', {
          cwd: workspaceRoot,
          timeout: 4000,
        });
      } catch (err: any) {
        if (err.stdout) {
          const output = err.stdout.toString();
          const lines = output.split('\n');
          for (const line of lines) {
            // format: src/file.ts(line,col): error TS2304: Cannot find name 'x'.
            const match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.*)$/);
            if (match) {
              markers.push({
                id: `ts-${match[1]}-${match[2]}-${match[3]}`,
                file: match[1].trim(),
                line: parseInt(match[2], 10),
                col: parseInt(match[3], 10),
                severity: match[4] === 'error' ? 'error' : 'warning',
                message: match[5].trim(),
                source: 'typescript',
              });
            }
          }
        }
      }
    }

    return markers;
  }
}
