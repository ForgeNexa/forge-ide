import { execFile } from 'node:child_process';
import { GitRepositoryStatus, GitFileStatus, GitCommitResult } from '@my-forge/shared-protocol';

export class GitManager {
  private runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      execFile('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(stderr.trim() || stdout.trim() || err.message));
        }
        resolve({ stdout, stderr });
      });
    });
  }

  public async isGitRepo(cwd: string): Promise<boolean> {
    try {
      const { stdout } = await this.runGit(['rev-parse', '--is-inside-work-tree'], cwd);
      return stdout.trim() === 'true';
    } catch {
      return false;
    }
  }

  public async getStatus(cwd: string): Promise<GitRepositoryStatus> {
    const isRepo = await this.isGitRepo(cwd);
    if (!isRepo) {
      return {
        isRepo: false,
        branch: '',
        files: [],
        ahead: 0,
        behind: 0,
      };
    }

    // Get branch
    let branch = 'HEAD';
    try {
      const { stdout } = await this.runGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
      branch = stdout.trim();
    } catch {
      // Detached head or new repo
    }

    // Get porcelain status
    const { stdout: statusOut } = await this.runGit(
      ['status', '--porcelain=v1', '-uall'],
      cwd
    );

    const files: GitFileStatus[] = [];
    const lines = statusOut.split('\n');

    for (const line of lines) {
      if (!line || line.length < 3) continue;
      const indexStatus = line[0];
      const workingTreeStatus = line[1];
      const filePath = line.substring(3).trim();

      let status: GitFileStatus['status'] = 'modified';
      let staged = false;

      if (indexStatus === '?' && workingTreeStatus === '?') {
        status = 'untracked';
      } else if (indexStatus === 'A') {
        status = 'staged';
        staged = true;
      } else if (indexStatus === 'M' || indexStatus === 'R') {
        status = 'staged';
        staged = true;
      } else if (indexStatus === 'D') {
        status = 'deleted';
        staged = true;
      } else if (indexStatus === 'U' || workingTreeStatus === 'U') {
        status = 'conflicted';
      } else if (workingTreeStatus === 'M') {
        status = 'modified';
      } else if (workingTreeStatus === 'D') {
        status = 'deleted';
      }

      files.push({
        path: filePath,
        status,
        staged,
        indexStatus,
        workingTreeStatus,
      });
    }

    // Get ahead / behind count if tracking upstream
    let ahead = 0;
    let behind = 0;
    let upstream = '';
    try {
      const { stdout: revOut } = await this.runGit(
        ['rev-list', '--left-right', '--count', `${branch}...@{u}`],
        cwd
      );
      const parts = revOut.trim().split(/\s+/);
      if (parts.length >= 2) {
        ahead = parseInt(parts[0], 10) || 0;
        behind = parseInt(parts[1], 10) || 0;
      }
      const { stdout: upOut } = await this.runGit(
        ['rev-parse', '--abbrev-ref', '@{u}'],
        cwd
      );
      upstream = upOut.trim();
    } catch {
      // No upstream configured
    }

    return {
      isRepo: true,
      branch,
      upstream,
      files,
      ahead,
      behind,
    };
  }

  public async stageFile(cwd: string, filePath: string): Promise<boolean> {
    await this.runGit(['add', '--', filePath], cwd);
    return true;
  }

  public async unstageFile(cwd: string, filePath: string): Promise<boolean> {
    await this.runGit(['restore', '--staged', '--', filePath], cwd);
    return true;
  }

  public async stageAll(cwd: string): Promise<boolean> {
    await this.runGit(['add', '-A'], cwd);
    return true;
  }

  public async unstageAll(cwd: string): Promise<boolean> {
    await this.runGit(['reset'], cwd);
    return true;
  }

  public async discardChanges(cwd: string, filePath: string): Promise<boolean> {
    try {
      await this.runGit(['checkout', '--', filePath], cwd);
    } catch {
      // If untracked file, remove it cleanly
      await this.runGit(['clean', '-f', '--', filePath], cwd);
    }
    return true;
  }

  public async commit(cwd: string, message: string): Promise<GitCommitResult> {
    if (!message || message.trim() === '') {
      return { success: false, error: 'Commit message cannot be empty' };
    }
    try {
      const { stdout } = await this.runGit(['commit', '-m', message], cwd);
      // Extract commit hash
      const hashMatch = stdout.match(/\[([^\s]+)\s+([a-f0-9]+)\]/i);
      const commitHash = hashMatch ? hashMatch[2] : undefined;
      return { success: true, commitHash, message: stdout.trim() };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async getDiff(
    cwd: string,
    filePath: string,
    staged = false
  ): Promise<{ original: string; modified: string }> {
    let original = '';
    let modified = '';

    try {
      if (staged) {
        // Staged diff: HEAD vs Index
        const { stdout: headContent } = await this.runGit(
          ['show', `HEAD:${filePath}`],
          cwd
        );
        original = headContent;
        const { stdout: indexContent } = await this.runGit(
          ['show', `:${filePath}`],
          cwd
        );
        modified = indexContent;
      } else {
        // Working tree diff: Index (or HEAD) vs Working Tree
        try {
          const { stdout: baseContent } = await this.runGit(
            ['show', `:${filePath}`],
            cwd
          );
          original = baseContent;
        } catch {
          const { stdout: headContent } = await this.runGit(
            ['show', `HEAD:${filePath}`],
            cwd
          );
          original = headContent;
        }
      }
    } catch {
      original = '';
    }

    return { original, modified };
  }

  public async getBranches(cwd: string): Promise<string[]> {
    try {
      const { stdout } = await this.runGit(['branch', '--format=%(refname:short)'], cwd);
      return stdout
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  public async switchBranch(cwd: string, branch: string): Promise<boolean> {
    await this.runGit(['checkout', branch], cwd);
    return true;
  }

  public async createBranch(cwd: string, branch: string): Promise<boolean> {
    await this.runGit(['checkout', '-b', branch], cwd);
    return true;
  }
}
