import { useState, type FC } from 'react';
import { ExtensionItem } from '@my-forge/shared-protocol';
import { IconExtensions, IconSearch } from './Icons';

const initialExtensions: ExtensionItem[] = [
  {
    id: 'golang.go',
    name: 'Go',
    displayName: 'Go Language Support',
    publisher: 'Google / Go Authors',
    version: '0.41.0',
    description: 'Rich Go language support via gopls language server.',
    category: 'language',
    supported: true,
    supportNote: 'Syntax & LSP Ready via gopls',
    installed: true,
  },
  {
    id: 'ms-vscode.vscode-typescript-next',
    name: 'TypeScript',
    displayName: 'TypeScript and JavaScript',
    publisher: 'Microsoft',
    version: '5.8.0',
    description: 'Built-in Monaco TypeScript and JavaScript language support.',
    category: 'language',
    supported: true,
    supportNote: 'Fully supported in Monaco engine',
    installed: true,
  },
  {
    id: 'github.github-vscode-theme',
    name: 'GitHub Themes',
    displayName: 'GitHub Theme',
    publisher: 'GitHub',
    version: '6.3.4',
    description: 'GitHub Dark, Light, and Dimmed color themes for code editors.',
    category: 'theme',
    supported: true,
    supportNote: 'TextMate & JSON themes compatible',
    installed: false,
  },
  {
    id: 'rust-lang.rust-analyzer',
    name: 'Rust Analyzer',
    displayName: 'rust-analyzer',
    publisher: 'The Rust Programming Language',
    version: '0.3.1800',
    description: 'Rust language support via rust-analyzer LSP.',
    category: 'language',
    supported: true,
    supportNote: 'LSP compatible',
    installed: false,
  },
  {
    id: 'ms-python.python',
    name: 'Python',
    displayName: 'Python',
    publisher: 'Microsoft',
    version: '2024.2.1',
    description: 'Python language support, execution, and debugging.',
    category: 'language',
    supported: false,
    supportNote: 'Requires full Node.js extension host (Phase 5)',
    installed: false,
  },
];

export const ExtensionsSidebar: FC = () => {
  const [query, setQuery] = useState('');
  const [extensions, setExtensions] = useState<ExtensionItem[]>(initialExtensions);

  const filtered = extensions.filter(
    (e) =>
      e.displayName.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase())
  );

  const toggleInstall = (id: string) => {
    setExtensions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, installed: !e.installed } : e))
    );
  };

  return (
    <div className="forge-sidebar">
      <div className="forge-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconExtensions />
          <span>Extensions (Open VSX)</span>
        </div>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--forge-border-subtle)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            style={{
              width: '100%',
              background: 'var(--forge-bg-input)',
              border: '1px solid var(--forge-border)',
              borderRadius: 'var(--forge-radius-sm)',
              padding: '6px 8px 6px 28px',
              color: 'var(--forge-text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
            placeholder="Search extensions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ position: 'absolute', left: 8, color: 'var(--forge-text-muted)' }}>
            <IconSearch />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {filtered.map((ext) => (
          <div
            key={ext.id}
            style={{
              padding: '10px 10px',
              borderBottom: '1px solid var(--forge-border-subtle)',
              borderRadius: 'var(--forge-radius-sm)',
              marginBottom: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>{ext.displayName}</span>
              <span style={{ fontSize: '10px', color: 'var(--forge-text-muted)' }}>v{ext.version}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--forge-text-secondary)', marginTop: 2 }}>
              {ext.description}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: ext.supported ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                  color: ext.supported ? 'var(--forge-success)' : 'var(--forge-error)',
                }}
              >
                {ext.supportNote}
              </span>

              {ext.supported ? (
                <button
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: 'var(--forge-radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: ext.installed ? 'var(--forge-bg-hover)' : 'var(--forge-accent)',
                    color: ext.installed ? 'var(--forge-text-secondary)' : '#ffffff',
                  }}
                  onClick={() => toggleInstall(ext.id)}
                >
                  {ext.installed ? 'Installed' : 'Install'}
                </button>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--forge-text-muted)' }}>Unsupported</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
