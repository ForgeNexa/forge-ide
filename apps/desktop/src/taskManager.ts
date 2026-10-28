import { spawn, ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ProjectTask } from '@my-forge/shared-protocol';

export class TaskManager {
  private runningTasks: Map<string, ChildProcess> = new Map();

  public async detectTasks(cwd: string): Promise<ProjectTask[]> {
    const tasks: ProjectTask[] = [];

    if (!cwd) return tasks;

    // 1. Detect package.json scripts
    const pkgPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const raw = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(raw);
        if (pkg.scripts && typeof pkg.scripts === 'object') {
          for (const [scriptName] of Object.entries(pkg.scripts)) {
            tasks.push({
              id: `npm:${scriptName}`,
              name: `npm run ${scriptName}`,
              command: `npm run ${scriptName}`,
              source: 'package.json',
              status: 'idle',
            });
          }
        }
      } catch {
        // Ignore parse error
      }
    }

    // 2. Detect Makefile targets
    const makefilePath = path.join(cwd, 'Makefile');
    if (fs.existsSync(makefilePath)) {
      try {
        const content = fs.readFileSync(makefilePath, 'utf8');
        const targetRegex = /^([a-zA-Z0-9_-]+):/gm;
        let match;
        while ((match = targetRegex.exec(content)) !== null) {
          const target = match[1];
          if (!target.startsWith('.')) {
            tasks.push({
              id: `make:${target}`,
              name: `make ${target}`,
              command: `make ${target}`,
              source: 'Makefile',
              status: 'idle',
            });
          }
        }
      } catch {
        // Ignore read error
      }
    }

    // 3. Detect Go project
    const goModPath = path.join(cwd, 'go.mod');
    if (fs.existsSync(goModPath)) {
      tasks.push({
        id: 'go:build',
        name: 'go build ./...',
        command: 'go build ./...',
        source: 'go.mod',
        status: 'idle',
      });
      tasks.push({
        id: 'go:test',
        name: 'go test -v ./...',
        command: 'go test -v ./...',
        source: 'go.mod',
        status: 'idle',
      });
    }

    // 4. Detect Cargo project
    const cargoPath = path.join(cwd, 'Cargo.toml');
    if (fs.existsSync(cargoPath)) {
      tasks.push({
        id: 'cargo:build',
        name: 'cargo build',
        command: 'cargo build',
        source: 'Cargo.toml',
        status: 'idle',
      });
      tasks.push({
        id: 'cargo:test',
        name: 'cargo test',
        command: 'cargo test',
        source: 'Cargo.toml',
        status: 'idle',
      });
    }

    return tasks;
  }

  public runTask(
    task: ProjectTask,
    cwd: string,
    onOutput: (chunk: string) => void,
    onExit: (code: number) => void
  ): string {
    const taskId = `${task.id}-${Date.now()}`;
    const [bin, ...args] = task.command.split(' ');

    try {
      const child = spawn(bin, args, {
        cwd: cwd || process.cwd(),
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      this.runningTasks.set(taskId, child);

      child.stdout?.on('data', (d) => onOutput(d.toString()));
      child.stderr?.on('data', (d) => onOutput(d.toString()));

      child.on('close', (code) => {
        this.runningTasks.delete(taskId);
        onExit(code ?? 0);
      });

      child.on('error', (err) => {
        onOutput(`\n[Process Error]: ${err.message}\n`);
        this.runningTasks.delete(taskId);
        onExit(1);
      });
    } catch (err: any) {
      onOutput(`\n[Spawn Error]: ${err.message}\n`);
      onExit(1);
    }

    return taskId;
  }

  public killTask(taskId: string): boolean {
    const proc = this.runningTasks.get(taskId);
    if (proc) {
      proc.kill('SIGTERM');
      this.runningTasks.delete(taskId);
      return true;
    }
    return false;
  }
}
