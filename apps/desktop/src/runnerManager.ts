import { execFile } from 'node:child_process';
import * as path from 'node:path';
import { RunResult } from '@my-forge/shared-protocol';

export class RunnerManager {
  public runFile(filePath: string, cwd: string): Promise<RunResult> {
    const ext = path.extname(filePath).toLowerCase();
    let runtime = '';
    let args: string[] = [];

    switch (ext) {
      case '.go':
        runtime = 'go';
        args = ['run', filePath];
        break;
      case '.ts':
      case '.js':
      case '.mjs':
        runtime = 'node';
        args = [filePath];
        break;
      case '.py':
        runtime = 'python3';
        args = [filePath];
        break;
      case '.sh':
        runtime = 'bash';
        args = [filePath];
        break;
      default:
        return Promise.resolve({
          success: false,
          runtime: 'none',
          command: filePath,
          stdout: '',
          stderr: `No known runtime configured for extension ${ext}`,
          exitCode: 1,
          durationMs: 0,
        });
    }

    const start = Date.now();
    return new Promise((resolve) => {
      execFile(
        runtime,
        args,
        {
          cwd,
          timeout: 30000,
          maxBuffer: 5 * 1024 * 1024,
        },
        (err, stdout, stderr) => {
          const durationMs = Date.now() - start;
          const exitCode = err ? (typeof err.code === 'number' ? err.code : 1) : 0;
          resolve({
            success: exitCode === 0,
            runtime,
            command: `${runtime} ${args.join(' ')}`,
            stdout: stdout || '',
            stderr: stderr || (err && !stdout ? err.message : ''),
            exitCode,
            durationMs,
          });
        }
      );
    });
  }
}
