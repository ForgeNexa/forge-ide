import { useState, useEffect, type FC } from 'react';
import { ExtensionItem } from '@my-forge/shared-protocol';
import { IconExtensions, IconSearch, IconClose, IconRefresh } from './Icons';

export const ExtensionsSidebar: FC = () => {
  const [query, setQuery] = useState('');
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'installed' | 'themes' | 'tools'>('all');
  const [selectedExtension, setSelectedExtension] = useState<ExtensionItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadExtensions = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      if (window.myForgeAPI?.extensionSearch) {
        const results = await window.myForgeAPI.extensionSearch(searchQuery);
        setExtensions(results);
      } else {
        // Fallback offline catalog for web preview
        setExtensions([
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
            installed: true,
            enabled: true,
            downloads: 14200000,
            rating: 4.8,
          },
          {
            id: 'ms-vscode.vscode-typescript-next',
            name: 'vscode-typescript-next',
            displayName: 'TypeScript and JavaScript',
            publisher: 'Microsoft',
            version: '5.8.0',
            description: 'Built-in Monaco TypeScript, JavaScript, and JSX/TSX intelligence.',
            category: 'language',
            supported: true,
            supportNote: 'Native in Monaco engine',
            installed: true,
            enabled: true,
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
            installed: false,
            enabled: false,
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
            installed: false,
            enabled: false,
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
            installed: false,
            enabled: false,
            downloads: 45000000,
            rating: 4.6,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExtensions(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleInstallToggle = async (ext: ExtensionItem) => {
    if (ext.installed) {
      if (window.myForgeAPI?.extensionUninstall) {
        await window.myForgeAPI.extensionUninstall(ext.id);
      }
      setStatusMessage(`Uninstalled ${ext.displayName}`);
    } else {
      if (window.myForgeAPI?.extensionInstall) {
        await window.myForgeAPI.extensionInstall(ext.id);
      }
      setStatusMessage(`Installed ${ext.displayName}`);
    }
    setExtensions((prev) =>
      prev.map((e) => (e.id === ext.id ? { ...e, installed: !e.installed, enabled: !e.installed } : e))
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleEnableToggle = async (ext: ExtensionItem) => {
    const newEnabled = !ext.enabled;
    if (window.myForgeAPI?.extensionToggleEnable) {
      await window.myForgeAPI.extensionToggleEnable(ext.id, newEnabled);
    }
    setExtensions((prev) =>
      prev.map((e) => (e.id === ext.id ? { ...e, enabled: newEnabled } : e))
    );
    setStatusMessage(`${ext.displayName} is now ${newEnabled ? 'Enabled' : 'Disabled'}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filtered = extensions.filter((e) => {
    if (filterTab === 'installed') return e.installed;
    if (filterTab === 'themes') return e.category === 'theme';
    if (filterTab === 'tools') return e.category === 'language' || e.category === 'tool';
    return true;
  });

  return (
    <div className="forge-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header */}
      <div className="forge-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconExtensions />
          <span>Extensions: Marketplace</span>
        </div>
        <button className="forge-icon-btn" title="Refresh Extensions" onClick={() => loadExtensions(query)}>
          <IconRefresh />
        </button>
      </div>

      {/* Search Input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--forge-border-subtle)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            style={{
              width: '100%',
              background: 'var(--forge-bg-input)',
              border: '1px solid var(--forge-border)',
              borderRadius: 'var(--forge-radius-sm)',
              padding: '6px 28px 6px 8px',
              color: 'var(--forge-text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
            placeholder="Search Open VSX & Marketplace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: 'var(--forge-text-muted)' }}>
            <IconSearch />
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {(['all', 'installed', 'themes', 'tools'] as const).map((tab) => (
            <button
              key={tab}
              style={{
                background: filterTab === tab ? 'var(--forge-accent)' : 'var(--forge-bg-hover)',
                color: filterTab === tab ? '#ffffff' : 'var(--forge-text-secondary)',
                border: 'none',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
              onClick={() => setFilterTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            padding: '4px 12px',
            background: 'var(--forge-accent-subtle)',
            color: 'var(--forge-accent)',
            fontSize: '11px',
            borderBottom: '1px solid var(--forge-border-subtle)',
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Extensions List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--forge-text-muted)', fontSize: '12px' }}>
            Querying marketplace registry...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--forge-text-muted)', fontSize: '12px' }}>
            No extensions matching query.
          </div>
        ) : (
          filtered.map((ext) => (
            <div
              key={ext.id}
              style={{
                padding: '10px',
                borderRadius: 'var(--forge-radius-md)',
                background: selectedExtension?.id === ext.id ? 'var(--forge-bg-hover)' : 'transparent',
                border: '1px solid var(--forge-border-subtle)',
                marginBottom: 6,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onClick={() => setSelectedExtension(ext)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--forge-text-primary)' }}>
                    {ext.displayName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: 1 }}>
                    {ext.publisher} • v{ext.version}
                  </div>
                </div>

                {/* Install / Uninstall Button */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    style={{
                      background: ext.installed ? 'var(--forge-bg-hover)' : 'var(--forge-accent)',
                      color: ext.installed ? 'var(--forge-text-primary)' : '#ffffff',
                      border: '1px solid var(--forge-border)',
                      borderRadius: 'var(--forge-radius-sm)',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstallToggle(ext);
                    }}
                  >
                    {ext.installed ? 'Uninstall' : 'Install'}
                  </button>
                  {ext.installed && (
                    <button
                      style={{
                        background: ext.enabled ? 'rgba(56, 139, 253, 0.1)' : 'var(--forge-bg-hover)',
                        color: ext.enabled ? 'var(--forge-accent)' : 'var(--forge-text-muted)',
                        border: '1px solid var(--forge-border)',
                        borderRadius: 'var(--forge-radius-sm)',
                        padding: '2px 6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                      title={ext.enabled ? 'Click to Disable' : 'Click to Enable'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnableToggle(ext);
                      }}
                    >
                      {ext.enabled ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--forge-text-secondary)',
                  marginTop: 6,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {ext.description}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: ext.supported ? 'rgba(63, 185, 80, 0.15)' : 'rgba(210, 153, 34, 0.15)',
                    color: ext.supported ? 'var(--forge-success)' : 'var(--forge-warning)',
                    fontWeight: 600,
                  }}
                >
                  {ext.supported ? '✓ Native Tier' : '⚠️ Extension Host'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--forge-text-muted)' }}>
                  {ext.downloads ? `${(ext.downloads / 1000).toFixed(0)}k downloads` : ext.supportNote}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Extension Details Drawer */}
      {selectedExtension && (
        <div
          style={{
            borderTop: '1px solid var(--forge-border)',
            background: 'var(--forge-bg-dialog)',
            padding: '12px',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>{selectedExtension.displayName}</span>
            <button className="forge-icon-btn" onClick={() => setSelectedExtension(null)}>
              <IconClose />
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginBottom: 8 }}>
            ID: <code>{selectedExtension.id}</code> • Publisher: {selectedExtension.publisher}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
            {selectedExtension.description}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', background: 'var(--forge-bg-hover)', padding: '6px 8px', borderRadius: '4px' }}>
            <strong>Compatibility Note:</strong> {selectedExtension.supportNote}
          </div>
        </div>
      )}
    </div>
  );
};
