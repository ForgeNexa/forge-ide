import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  subsystem: string;
  message: string;
  correlationId?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

export class Logger {
  private logDir: string;
  private logFile: string;
  private currentLevel: LogLevel = 'info';
  private maxFileSize = 5 * 1024 * 1024; // 5 MB

  constructor(customDir?: string) {
    this.logDir = customDir || path.join(os.homedir(), '.forge', 'logs');
    this.logFile = path.join(this.logDir, 'forge.log');
    this.ensureDir();
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch {
      // ignore
    }
  }

  public setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  /**
   * Redacts sensitive patterns such as tokens, API keys, passwords.
   */
  public redact(text: string): string {
    if (!text) return '';
    return text
      .replace(/ghp_[A-Za-z0-9_]{30,}/g, 'ghp_REDACTED')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza_REDACTED')
      .replace(/bearer\s+[A-Za-z0-9-._~+/]+=*/gi, 'Bearer REDACTED')
      .replace(/password["']?\s*[:=]\s*["'][^"']+["']/gi, 'password: "REDACTED"');
  }

  private shouldLog(level: LogLevel): boolean {
    const priority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return priority[level] >= priority[this.currentLevel];
  }

  public log(entry: Omit<StructuredLogEntry, 'timestamp'>) {
    if (!this.shouldLog(entry.level)) return;

    const fullEntry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level: entry.level,
      subsystem: entry.subsystem,
      message: this.redact(entry.message),
      correlationId: entry.correlationId,
      durationMs: entry.durationMs,
      metadata: entry.metadata ? JSON.parse(this.redact(JSON.stringify(entry.metadata))) : undefined,
    };

    const line = JSON.stringify(fullEntry) + '\n';
    try {
      this.rotateIfNeeded();
      fs.appendFileSync(this.logFile, line, 'utf8');
    } catch {
      // Fallback to console if disk write fails
      console.log(`[${fullEntry.level.toUpperCase()}][${fullEntry.subsystem}] ${fullEntry.message}`);
    }
  }

  private rotateIfNeeded() {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxFileSize) {
          const oldFile = path.join(this.logDir, 'forge.prev.log');
          if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
          }
          fs.renameSync(this.logFile, oldFile);
        }
      }
    } catch {
      // ignore rotation errors
    }
  }

  public debug(subsystem: string, message: string, metadata?: Record<string, any>) {
    this.log({ level: 'debug', subsystem, message, metadata });
  }

  public info(subsystem: string, message: string, metadata?: Record<string, any>) {
    this.log({ level: 'info', subsystem, message, metadata });
  }

  public warn(subsystem: string, message: string, metadata?: Record<string, any>) {
    this.log({ level: 'warn', subsystem, message, metadata });
  }

  public error(subsystem: string, message: string, metadata?: Record<string, any>) {
    this.log({ level: 'error', subsystem, message, metadata });
  }

  public getLogDirectory(): string {
    return this.logDir;
  }

  public getRecentLogs(lines = 100): string[] {
    try {
      if (fs.existsSync(this.logFile)) {
        const content = fs.readFileSync(this.logFile, 'utf8');
        return content.trim().split('\n').slice(-lines);
      }
    } catch {
      // ignore
    }
    return [];
  }

  public generateDiagnosticReport(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions?.electron || 'N/A',
      osRelease: os.release(),
      memoryTotalMB: Math.round(os.totalmem() / (1024 * 1024)),
      memoryFreeMB: Math.round(os.freemem() / (1024 * 1024)),
      recentLogs: this.getRecentLogs(50),
    };
  }
}

export const logger = new Logger();
