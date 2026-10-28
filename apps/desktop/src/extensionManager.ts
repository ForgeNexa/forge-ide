import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as https from 'node:https';
import { ExtensionItem } from '@my-forge/shared-protocol';

interface ExtensionRegistryData {
  installed: Record<string, { enabled: boolean; version: string; installTime: string }>;
}

export class ExtensionManager {
  private baseDir: string;
  private extensionsDir: string;
  private registryFile: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.join(os.homedir(), '.forge');
    this.extensionsDir = path.join(this.baseDir, 'extensions');
    this.registryFile = path.join(this.baseDir, 'extensions.json');
    this.ensureDirs();
  }

  private ensureDirs() {
    try {
      if (!fs.existsSync(this.extensionsDir)) {
        fs.mkdirSync(this.extensionsDir, { recursive: true });
      }
      if (!fs.existsSync(this.registryFile)) {
        const initial: ExtensionRegistryData = {
          installed: {
            'mrleemurray.theme-2026': { enabled: true, version: '1.0.0', installTime: new Date().toISOString() },
            'PKief.material-icon-theme': { enabled: true, version: '5.40.0', installTime: new Date().toISOString() },
            'golang.go': { enabled: true, version: '0.41.0', installTime: new Date().toISOString() },
            'ms-vscode.vscode-typescript-next': { enabled: true, version: '5.8.0', installTime: new Date().toISOString() },
          },
        };
        fs.writeFileSync(this.registryFile, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch {
      // Ignore
    }
  }

  private getRegistry(): ExtensionRegistryData {
    try {
      if (fs.existsSync(this.registryFile)) {
        return JSON.parse(fs.readFileSync(this.registryFile, 'utf8'));
      }
    } catch {
      // Fallback
    }
    return { installed: {} };
  }

  private saveRegistry(data: ExtensionRegistryData) {
    try {
      fs.writeFileSync(this.registryFile, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // Ignore
    }
  }

  public async search(query: string): Promise<ExtensionItem[]> {
    const registry = this.getRegistry();

    // Default curated catalog if query is empty or offline
    const defaultCatalog: ExtensionItem[] = [
      {
        id: 'mrleemurray.theme-2026',
        name: 'theme-2026',
        displayName: '2026 Dark Theme',
        publisher: 'mrleemurray',
        version: '1.0.0',
        description: 'Official 2026 Dark minimal focus theme with neutral layered hierarchy.',
        category: 'theme',
        supported: true,
        supportNote: 'Active default theme',
        installed: true,
        enabled: true,
        downloads: 85200,
        rating: 4.9,
      },
      {
        id: 'PKief.material-icon-theme',
        name: 'material-icon-theme',
        displayName: 'Material Icon Theme',
        publisher: 'PKief',
        version: '5.40.0',
        description: 'Material Design Icons for Visual Studio Code and Forge.',
        category: 'tool',
        supported: true,
        supportNote: 'Active default icon theme',
        installed: true,
        enabled: true,
        downloads: 18500000,
        rating: 4.95,
      },
      {
        id: 'golang.go',
        name: 'go',
        displayName: 'Go Language Support',
        publisher: 'Google / Go Authors',
        version: '0.41.0',
        description: 'Rich Go language support, gopls integration, and indexing.',
        category: 'language',
        supported: true,
        supportNote: 'Native Go daemon indexing + LSP ready',
        installed: Boolean(registry.installed['golang.go']),
        enabled: registry.installed['golang.go']?.enabled ?? true,
        downloads: 14200000,
        rating: 4.8,
      },
      {
        id: 'ms-vscode.vscode-typescript-next',
        name: 'vscode-typescript-next',
        displayName: 'TypeScript and JavaScript Language Features',
        publisher: 'Microsoft',
        version: '5.8.0',
        description: 'Built-in Monaco TypeScript, JavaScript, and JSX/TSX intelligence.',
        category: 'language',
        supported: true,
        supportNote: 'Native in Monaco engine',
        installed: Boolean(registry.installed['ms-vscode.vscode-typescript-next']),
        enabled: registry.installed['ms-vscode.vscode-typescript-next']?.enabled ?? true,
        downloads: 25000000,
        rating: 4.9,
      },
      {
        id: 'github.github-vscode-theme',
        name: 'github-vscode-theme',
        displayName: 'GitHub Theme',
        publisher: 'GitHub',
        version: '6.3.4',
        description: 'GitHub Dark, Light, and Dimmed color themes for code editors.',
        category: 'theme',
        supported: true,
        supportNote: 'Full JSON theme compatibility',
        installed: Boolean(registry.installed['github.github-vscode-theme']),
        enabled: registry.installed['github.github-vscode-theme']?.enabled ?? false,
        downloads: 12000000,
        rating: 4.7,
      },
      {
        id: 'rust-lang.rust-analyzer',
        name: 'rust-analyzer',
        displayName: 'rust-analyzer',
        publisher: 'The Rust Programming Language',
        version: '0.3.1800',
        description: 'Rust language support via rust-analyzer server.',
        category: 'language',
        supported: true,
        supportNote: 'LSP & cargo task runner compatible',
        installed: Boolean(registry.installed['rust-lang.rust-analyzer']),
        enabled: registry.installed['rust-lang.rust-analyzer']?.enabled ?? false,
        downloads: 4800000,
        rating: 4.9,
      },
      {
        id: 'ms-python.python',
        name: 'python',
        displayName: 'Python',
        publisher: 'Microsoft',
        version: '2024.2.1',
        description: 'Python language support, script execution, and syntax highlighting.',
        category: 'language',
        supported: true,
        supportNote: 'Syntax & Python runner supported; DAP debugger planned',
        installed: Boolean(registry.installed['ms-python.python']),
        enabled: registry.installed['ms-python.python']?.enabled ?? false,
        downloads: 45000000,
        rating: 4.6,
      },
    ];

    if (!query.trim()) {
      return defaultCatalog;
    }

    const qLower = query.toLowerCase();
    const localMatches = defaultCatalog.filter(
      (e) =>
        e.displayName.toLowerCase().includes(qLower) ||
        e.description.toLowerCase().includes(qLower) ||
        e.publisher.toLowerCase().includes(qLower) ||
        e.id.toLowerCase().includes(qLower)
    );

    // Try fetching additional live results from Open VSX API with a short timeout
    try {
      const openVsxResults = await this.queryOpenVsx(query);
      if (openVsxResults && openVsxResults.length > 0) {
        // Merge without duplicates
        const seenIds = new Set(localMatches.map((m) => m.id));
        for (const item of openVsxResults) {
          if (!seenIds.has(item.id)) {
            item.installed = Boolean(registry.installed[item.id]);
            item.enabled = registry.installed[item.id]?.enabled ?? true;
            localMatches.push(item);
          }
        }
      }
    } catch {
      // Fallback to local catalog
    }

    return localMatches;
  }

  private queryOpenVsx(query: string): Promise<ExtensionItem[]> {
    return new Promise((resolve) => {
      const url = `https://open-vsx.org/api/-/search?query=${encodeURIComponent(query)}&size=8`;
      const req = https.get(url, { timeout: 3000 }, (res) => {
        if (res.statusCode !== 200) {
          resolve([]);
          return;
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const extensions: ExtensionItem[] = (parsed.extensions || []).map((ext: any) => {
              const id = `${ext.namespace}.${ext.name}`;
              return {
                id,
                name: ext.name,
                displayName: ext.displayName || ext.name,
                publisher: ext.namespace,
                version: ext.version || '1.0.0',
                description: ext.description || '',
                category: ext.categories?.includes('Themes') ? 'theme' : 'language',
                supported: true,
                supportNote: 'Open VSX package',
                installed: false,
                downloads: ext.downloadCount || 0,
                rating: ext.averageRating || 4.5,
              };
            });
            resolve(extensions);
          } catch {
            resolve([]);
          }
        });
      });

      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
    });
  }

  public install(id: string): boolean {
    const registry = this.getRegistry();
    const extDir = path.join(this.extensionsDir, id);
    try {
      if (!fs.existsSync(extDir)) {
        fs.mkdirSync(extDir, { recursive: true });
        fs.writeFileSync(
          path.join(extDir, 'package.json'),
          JSON.stringify({ name: id, installedAt: new Date().toISOString() }, null, 2),
          'utf8'
        );
      }
      registry.installed[id] = {
        enabled: true,
        version: '1.0.0',
        installTime: new Date().toISOString(),
      };
      this.saveRegistry(registry);
      return true;
    } catch {
      return false;
    }
  }

  public uninstall(id: string): boolean {
    const registry = this.getRegistry();
    const extDir = path.join(this.extensionsDir, id);
    try {
      if (fs.existsSync(extDir)) {
        fs.rmSync(extDir, { recursive: true, force: true });
      }
      delete registry.installed[id];
      this.saveRegistry(registry);
      return true;
    } catch {
      return false;
    }
  }

  public toggleEnable(id: string, enabled: boolean): boolean {
    const registry = this.getRegistry();
    if (registry.installed[id]) {
      registry.installed[id].enabled = enabled;
      this.saveRegistry(registry);
      return true;
    }
    return false;
  }

  public getInstalled(): ExtensionItem[] {
    const registry = this.getRegistry();
    const list: ExtensionItem[] = [];
    for (const [id, info] of Object.entries(registry.installed)) {
      list.push({
        id,
        name: id.split('.').pop() || id,
        displayName: id,
        publisher: id.split('.')[0] || 'Unknown',
        version: info.version,
        description: `Installed extension (${info.enabled ? 'Enabled' : 'Disabled'})`,
        category: 'tool',
        supported: true,
        supportNote: 'Installed in ~/.forge/extensions',
        installed: true,
        enabled: info.enabled,
      });
    }
    return list;
  }
}
