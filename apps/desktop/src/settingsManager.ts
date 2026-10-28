import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ForgeSettings, defaultForgeSettings } from '@my-forge/shared-protocol';

export class SettingsManager {
  private configDir: string;
  private settingsFile: string;
  private recentFile: string;

  constructor(customConfigDir?: string) {
    this.configDir = customConfigDir || path.join(os.homedir(), '.forge');
    this.settingsFile = path.join(this.configDir, 'settings.json');
    this.recentFile = path.join(this.configDir, 'recent.json');
    this.ensureDir();
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
    } catch {
      // Ignore
    }
  }

  public getSettings(): ForgeSettings {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf8');
        const parsed = JSON.parse(raw);
        return { ...defaultForgeSettings, ...parsed };
      }
    } catch {
      // fallback on malformed json without crashing
    }
    return defaultForgeSettings;
  }

  public saveSettings(patch: Partial<ForgeSettings>): ForgeSettings {
    const current = this.getSettings();
    const updated = { ...current, ...patch };
    try {
      this.ensureDir();
      fs.writeFileSync(this.settingsFile, JSON.stringify(updated, null, 2), 'utf8');
    } catch (err) {
      console.error('[SettingsManager] Failed to save settings:', err);
    }
    return updated;
  }

  public resetSettings(): ForgeSettings {
    try {
      this.ensureDir();
      fs.writeFileSync(this.settingsFile, JSON.stringify(defaultForgeSettings, null, 2), 'utf8');
    } catch (err) {
      console.error('[SettingsManager] Failed to reset settings:', err);
    }
    return defaultForgeSettings;
  }

  public exportSettings(): string {
    return JSON.stringify(this.getSettings(), null, 2);
  }

  public importSettings(rawJSON: string): { success: boolean; settings?: ForgeSettings; error?: string } {
    try {
      const parsed = JSON.parse(rawJSON);
      if (typeof parsed !== 'object' || parsed === null) {
        return { success: false, error: 'Settings payload must be a JSON object' };
      }
      const updated = this.saveSettings(parsed);
      return { success: true, settings: updated };
    } catch (err: any) {
      return { success: false, error: `Invalid JSON format: ${err.message}` };
    }
  }

  public getRecentWorkspaces(): string[] {
    try {
      if (fs.existsSync(this.recentFile)) {
        const raw = fs.readFileSync(this.recentFile, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.filter((p) => typeof p === 'string' && fs.existsSync(p));
        }
      }
    } catch {
      // fallback
    }
    return [];
  }

  public addRecentWorkspace(dirPath: string): void {
    try {
      const recents = this.getRecentWorkspaces().filter((p) => p !== dirPath);
      recents.unshift(dirPath);
      const trimmed = recents.slice(0, 10);
      this.ensureDir();
      fs.writeFileSync(this.recentFile, JSON.stringify(trimmed, null, 2), 'utf8');
    } catch (err) {
      console.error('[SettingsManager] Failed to save recents:', err);
    }
  }
}
