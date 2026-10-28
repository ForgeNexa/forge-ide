import { useState, type FC } from 'react';
import { ForgeSettings, defaultForgeSettings } from '@my-forge/shared-protocol';
import { IconClose, IconSearch } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ForgeSettings;
  onUpdateSettings: (patch: Partial<ForgeSettings>) => void;
}

export type SettingsCategory =
  | 'appearance'
  | 'editor'
  | 'files'
  | 'language'
  | 'formatting'
  | 'diagnostics'
  | 'terminal'
  | 'git'
  | 'extensions'
  | 'advanced'
  | 'json'
  | 'shortcuts';

export const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(settings, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const categories: { id: SettingsCategory; label: string; icon: string }[] = [
    { id: 'appearance', label: 'Appearance & UI', icon: '🎨' },
    { id: 'editor', label: 'Editor & Typography', icon: '🖋️' },
    { id: 'files', label: 'Files & Autosave', icon: '📁' },
    { id: 'language', label: 'Language & IntelliSense', icon: '🧠' },
    { id: 'formatting', label: 'Formatting', icon: '📐' },
    { id: 'diagnostics', label: 'Diagnostics & Linters', icon: '⚠️' },
    { id: 'terminal', label: 'Terminal & Tasks', icon: '📟' },
    { id: 'git', label: 'Git & Source Control', icon: '🌿' },
    { id: 'extensions', label: 'Extensions & Daemons', icon: '🧩' },
    { id: 'advanced', label: 'Advanced & Privacy', icon: '🔒' },
    { id: 'json', label: 'JSON Settings Editor', icon: '{ }' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' },
  ];

  const shortcutsList = [
    { command: 'Quick Open (File)', key: 'Cmd+P / Ctrl+P', desc: 'Instant fuzzy file search via Go indexer' },
    { command: 'Command Palette', key: 'Cmd+Shift+P / Ctrl+Shift+P', desc: 'Open workspace action dispatcher' },
    { command: 'Save File', key: 'Cmd+S / Ctrl+S', desc: 'Save current active file buffer' },
    { command: 'Save File As', key: 'Cmd+Shift+S / Ctrl+Shift+S', desc: 'Save file to new path' },
    { command: 'Toggle Primary Sidebar', key: 'Cmd+B / Ctrl+B', desc: 'Expand or collapse sidebar' },
    { command: 'Toggle Bottom Tool Window', key: 'Cmd+J / Ctrl+J', desc: 'Expand or collapse bottom panel' },
    { command: 'Integrated Terminal', key: 'Ctrl+\`', desc: 'Toggle terminal in bottom tool window' },
    { command: 'Format Document', key: 'Shift+Alt+F', desc: 'Format active document using configured formatter' },
    { command: 'Preferences', key: 'Cmd+, / Ctrl+,', desc: 'Open Forge settings dialog' },
  ];

  const handleResetDefaults = () => {
    if (confirm('Reset all settings to default configuration?')) {
      onUpdateSettings(defaultForgeSettings);
      setJsonText(JSON.stringify(defaultForgeSettings, null, 2));
      showStatus('Settings reset to defaults');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'forge-settings.json');
    dlAnchor.click();
    showStatus('Settings exported to forge-settings.json');
  };

  const handleImportJSON = () => {
    const raw = prompt('Paste exported settings JSON here:');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        onUpdateSettings(parsed);
        setJsonText(JSON.stringify({ ...settings, ...parsed }, null, 2));
        showStatus('Settings imported successfully');
      } else {
        alert('Invalid JSON: payload must be a JSON object');
      }
    } catch (err: any) {
      alert(`Invalid JSON: ${err.message}`);
    }
  };

  const handleApplyJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onUpdateSettings(parsed);
      setJsonError(null);
      showStatus('JSON settings applied successfully');
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const q = searchQuery.toLowerCase();
  const matchesSearch = (text: string, desc: string) => {
    if (!q) return true;
    return text.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  };

  return (
    <div className="forge-modal-backdrop" onClick={onClose}>
      <div
        className="forge-palette"
        style={{
          width: '840px',
          height: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--forge-bg-dialog)',
          borderRadius: 'var(--forge-radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--forge-border)',
            background: 'var(--forge-bg-activitybar)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                Forge IDE Settings
              </div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                Yantra Works · Antigravity Configuration Engine
              </div>
            </div>
          </div>

          {/* Search settings input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '280px' }}>
            <input
              style={{
                width: '100%',
                padding: '6px 28px 6px 10px',
                background: 'var(--forge-bg-input)',
                border: '1px solid var(--forge-border)',
                borderRadius: 'var(--forge-radius-sm)',
                color: 'var(--forge-text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
              placeholder="Search all settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: 'var(--forge-text-muted)' }}>
              <IconSearch />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="forge-icon-btn" onClick={onClose} title="Close (Esc)">
              <IconClose />
            </button>
          </div>
        </div>

        {/* Status banner if any */}
        {statusMessage && (
          <div
            style={{
              padding: '6px 18px',
              background: 'rgba(56, 139, 253, 0.15)',
              borderBottom: '1px solid rgba(56, 139, 253, 0.3)',
              color: 'var(--forge-accent)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            ✓ {statusMessage}
          </div>
        )}

        {/* Body Split View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar Categories */}
          <div
            style={{
              width: '210px',
              borderRight: '1px solid var(--forge-border)',
              background: 'var(--forge-bg-sidebar)',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflowY: 'auto',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (cat.id === 'json') {
                    setJsonText(JSON.stringify(settings, null, 2));
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 'var(--forge-radius-sm)',
                  border: 'none',
                  background: activeCategory === cat.id ? 'var(--forge-bg-hover)' : 'transparent',
                  color: activeCategory === cat.id ? 'var(--forge-text-primary)' : 'var(--forge-text-secondary)',
                  fontWeight: activeCategory === cat.id ? 600 : 400,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--forge-border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={handleResetDefaults}
                style={{
                  padding: '5px 8px',
                  fontSize: '11px',
                  background: 'transparent',
                  border: '1px solid var(--forge-border)',
                  color: 'var(--forge-text-muted)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ↺ Reset to Defaults
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={handleExportJSON}
                  style={{
                    flex: 1,
                    padding: '5px 4px',
                    fontSize: '11px',
                    background: 'transparent',
                    border: '1px solid var(--forge-border)',
                    color: 'var(--forge-text-muted)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Export
                </button>
                <button
                  onClick={handleImportJSON}
                  style={{
                    flex: 1,
                    padding: '5px 4px',
                    fontSize: '11px',
                    background: 'transparent',
                    border: '1px solid var(--forge-border)',
                    color: 'var(--forge-text-muted)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Settings Content Area */}
          <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* A. Appearance and UI */}
            {activeCategory === 'appearance' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Appearance & Workspace UI
                </div>

                {matchesSearch('Color Theme', 'Select editor surface color theme') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Color Theme</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Default is 2026 Dark, inspired by mrleemurray.theme-2026</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.theme}
                      onChange={(e) => onUpdateSettings({ theme: e.target.value as any })}
                    >
                      <option value="2026-dark">2026 Dark (Default)</option>
                      <option value="graphite-dark">Graphite Dark (CodeEdit Neutral)</option>
                      <option value="sand-light">Sand Light (Clean daylight)</option>
                    </select>
                  </div>
                )}

                {matchesSearch('File Icon Theme', 'Visual file and folder icons in tree') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>File Icon Theme</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Material Icon Theme or Minimal mode</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.iconTheme}
                      onChange={(e) => onUpdateSettings({ iconTheme: e.target.value as any })}
                    >
                      <option value="material-icon-theme">Material Icon Theme (Recommended)</option>
                      <option value="minimal">Minimalist Monochrome</option>
                    </select>
                  </div>
                )}

                {matchesSearch('UI Density', 'Compact or comfortable spacing') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>UI Density</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Compact (CodeEdit-like) or Comfortable</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.uiDensity}
                      onChange={(e) => onUpdateSettings({ uiDensity: e.target.value as any })}
                    >
                      <option value="comfortable">Comfortable (Balanced)</option>
                      <option value="compact">Compact (High density)</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Smooth Scrolling', 'Animate scrolling smoothly') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Smooth Scrolling</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Animate editor scrolling smoothly</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.smoothScrolling}
                      onChange={(e) => onUpdateSettings({ smoothScrolling: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Breadcrumbs', 'Show file navigation breadcrumb path') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Breadcrumbs</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Show path breadcrumbs above active editor</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.breadcrumbs}
                      onChange={(e) => onUpdateSettings({ breadcrumbs: e.target.checked })}
                    />
                  </div>
                )}
              </>
            )}

            {/* B. Editor */}
            {activeCategory === 'editor' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Editor & Typography
                </div>

                {matchesSearch('Font Family', 'Editor font family') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Font Family</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Monospace font stack</div>
                    </div>
                    <input
                      className="forge-input"
                      style={{ width: '220px' }}
                      value={settings.fontFamily}
                      onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
                    />
                  </div>
                )}

                {matchesSearch('Font Size', 'Editor font size in pixels') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Font Size</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Default is 13px</div>
                    </div>
                    <input
                      type="number"
                      className="forge-input"
                      style={{ width: '80px' }}
                      min={10}
                      max={28}
                      value={settings.fontSize}
                      onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) || 13 })}
                    />
                  </div>
                )}

                {matchesSearch('Tab Size', 'Number of spaces per tab') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Tab Size</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Indentation spaces</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.tabSize}
                      onChange={(e) => onUpdateSettings({ tabSize: parseInt(e.target.value, 10) })}
                    >
                      <option value="2">2 spaces</option>
                      <option value="4">4 spaces</option>
                      <option value="8">8 spaces</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Line Numbers', 'Line numbering mode') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Line Numbers</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Standard, relative, or off</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.lineNumbers}
                      onChange={(e) => onUpdateSettings({ lineNumbers: e.target.value as any })}
                    >
                      <option value="on">On</option>
                      <option value="relative">Relative</option>
                      <option value="off">Off</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Minimap', 'Show code minimap') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Minimap</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Overview minimap on right side</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.minimap}
                      onChange={(e) => onUpdateSettings({ minimap: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Bracket Pair Colorization', 'Color matching brackets') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Bracket Pair Colorization</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Colorize matching brackets for readability</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.bracketPairColorization}
                      onChange={(e) => onUpdateSettings({ bracketPairColorization: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Auto Closing Brackets and Quotes', 'Automatically close brackets and quotes') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Auto Closing Brackets</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Automatically insert closing pairs</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoClosingBrackets}
                      onChange={(e) => onUpdateSettings({ autoClosingBrackets: e.target.checked })}
                    />
                  </div>
                )}
              </>
            )}

            {/* C. Files and Autosave */}
            {activeCategory === 'files' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Files, Workspaces & Autosave
                </div>

                {matchesSearch('Autosave Mode', 'Configurable autosave behavior') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Autosave Mode</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Configurable safe autosave delay</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.autoSave}
                      onChange={(e) => onUpdateSettings({ autoSave: e.target.value as any })}
                    >
                      <option value="afterDelay">After delay (Safe default)</option>
                      <option value="onFocusChange">On focus change</option>
                      <option value="off">Off (Manual Cmd+S)</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Autosave Delay', 'Milliseconds to wait before saving') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Autosave Delay</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Delay in milliseconds after keystroke</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.autoSaveDelayMs}
                      onChange={(e) => onUpdateSettings({ autoSaveDelayMs: parseInt(e.target.value, 10) })}
                    >
                      <option value="500">500 ms (Rapid)</option>
                      <option value="1000">1000 ms (Standard)</option>
                      <option value="3000">3000 ms (Conservative)</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Confirm Close Unsaved', 'Prompt before discarding dirty buffer') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Confirm Close Unsaved</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Prevent accidental data loss on tab close</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.confirmCloseUnsaved}
                      onChange={(e) => onUpdateSettings({ confirmCloseUnsaved: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Restore Previous Workspace & Tabs', 'Restore open editors on restart') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Restore Previous Tabs</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Reopen open editor tabs upon app launch</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.restorePreviousTabs}
                      onChange={(e) => onUpdateSettings({ restorePreviousTabs: e.target.checked })}
                    />
                  </div>
                )}
              </>
            )}

            {/* D. Language and IntelliSense */}
            {activeCategory === 'language' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Language, LSP & AI IntelliSense
                </div>

                {matchesSearch('LSP Language Intelligence', 'Enable Language Server Protocol') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>LSP Language Intelligence</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Enable gopls, pyright, rust-analyzer, etc.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.lspEnabled}
                      onChange={(e) => onUpdateSettings({ lspEnabled: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('AI Autocomplete Provider', 'Local Ollama FIM or Cloud') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>AI Autocomplete Engine</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Private local FIM model or optional cloud</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.aiProvider}
                      onChange={(e) => onUpdateSettings({ aiProvider: e.target.value as any })}
                    >
                      <option value="local">Local FIM (Ollama / Qwen2.5-Coder 0.5B/1.5B)</option>
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash (Cloud)</option>
                      <option value="gemini-pro">Gemini Pro (Advanced reasoning)</option>
                      <option value="claude-3.7">Claude 3.7 Sonnet</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Inline Ghost Completions', 'Show completions as ghost text') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Inline Ghost Completions</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Render ghost text accepted with Tab key</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.aiInlineCompletions}
                      onChange={(e) => onUpdateSettings({ aiInlineCompletions: e.target.checked })}
                    />
                  </div>
                )}
              </>
            )}

            {/* E. Formatting */}
            {activeCategory === 'formatting' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Document Formatting
                </div>

                {matchesSearch('Format On Save', 'Automatically format document upon save') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Format On Save</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Format document using gofmt, prettier, or LSP</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.formatOnSave}
                      onChange={(e) => onUpdateSettings({ formatOnSave: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Formatting Timeout', 'Timeout in milliseconds') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Formatting Timeout</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Abort formatter if execution exceeds timeout</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.formattingTimeoutMs}
                      onChange={(e) => onUpdateSettings({ formattingTimeoutMs: parseInt(e.target.value, 10) })}
                    >
                      <option value="1500">1500 ms</option>
                      <option value="2500">2500 ms (Standard)</option>
                      <option value="5000">5000 ms</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* F. Diagnostics and Error Highlighting */}
            {activeCategory === 'diagnostics' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Diagnostics & Problems
                </div>

                {matchesSearch('Diagnostics Enabled', 'Enable real-time compiler and linter checks') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Diagnostics Enabled</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Background go vet, tsc, and py_compile checks</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.diagnosticsEnabled}
                      onChange={(e) => onUpdateSettings({ diagnosticsEnabled: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Inline Errors', 'Show inline error squiggles in editor') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Inline Error Squiggles</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Display colored squiggles under problematic syntax</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.inlineErrors}
                      onChange={(e) => onUpdateSettings({ inlineErrors: e.target.checked })}
                    />
                  </div>
                )}
              </>
            )}

            {/* G. Terminal and Tasks */}
            {activeCategory === 'terminal' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Terminal & Tool Window
                </div>

                {matchesSearch('Terminal Placement', 'Terminal dock location') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Terminal Dock Location</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Mandatory IntelliJ-style bottom tool window</div>
                    </div>
                    <span className="forge-badge" style={{ background: 'var(--forge-accent)', color: '#fff' }}>
                      Bottom Tool Window
                    </span>
                  </div>
                )}

                {matchesSearch('Default Shell Profile', 'Default shell executable') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Default Shell Profile</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Default PTY shell session profile</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.defaultShell}
                      onChange={(e) => onUpdateSettings({ defaultShell: e.target.value })}
                    >
                      <option value="zsh">Zsh (macOS Default)</option>
                      <option value="bash">Bash (Linux Default)</option>
                      <option value="sh">sh (POSIX)</option>
                      <option value="powershell">PowerShell</option>
                      <option value="cmd">Command Prompt</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Terminal Font Size', 'Terminal emulator font size') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Terminal Font Size</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Default is 12px</div>
                    </div>
                    <input
                      type="number"
                      className="forge-input"
                      style={{ width: '80px' }}
                      min={10}
                      max={24}
                      value={settings.terminalFontSize}
                      onChange={(e) => onUpdateSettings({ terminalFontSize: parseInt(e.target.value, 10) || 12 })}
                    />
                  </div>
                )}
              </>
            )}

            {/* H. Git and Source Control */}
            {activeCategory === 'git' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Git & Source Control
                </div>

                {matchesSearch('Git Auto-Detect', 'Automatically detect git repositories') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Auto-Detect Git Repositories</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Scan workspace root for .git repository</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.gitAutoDetect}
                      onChange={(e) => onUpdateSettings({ gitAutoDetect: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Confirm Destructive Actions', 'Confirm before discarding changes') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Confirm Destructive Actions</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Prompt before git checkout -- or discard changes</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.gitConfirmDestructive}
                      onChange={(e) => onUpdateSettings({ gitConfirmDestructive: e.target.checked })}
                    />
                  </div>
                )}
              </>
            )}

            {/* I. Extensions & Daemon */}
            {activeCategory === 'extensions' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Extensions & Go Daemon Performance
                </div>

                {matchesSearch('Go Daemon Debounce Rate', 'Indexing debounce rate') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Go Indexer Debounce Rate</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Debounce interval for workspace re-indexing</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.autoReindexDebounceMs}
                      onChange={(e) => onUpdateSettings({ autoReindexDebounceMs: parseInt(e.target.value, 10) })}
                    >
                      <option value="100">100 ms (Fastest)</option>
                      <option value="250">250 ms (Balanced default)</option>
                      <option value="500">500 ms (Power saving)</option>
                    </select>
                  </div>
                )}

                {matchesSearch('Max File Size', 'Threshold for large file indexing') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Max Indexed File Size</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Skip indexing files exceeding this size</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.maxFileSizeMB}
                      onChange={(e) => onUpdateSettings({ maxFileSizeMB: parseInt(e.target.value, 10) })}
                    >
                      <option value="5">5 MB</option>
                      <option value="10">10 MB (Default)</option>
                      <option value="25">25 MB</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* J. Advanced & Privacy */}
            {activeCategory === 'advanced' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Privacy, Telemetry & Diagnostics
                </div>

                {matchesSearch('Local-Only Mode', 'Zero cloud network access') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Local-Only Mode</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Operate strictly offline with zero outbound cloud calls</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.localOnlyMode}
                      onChange={(e) => onUpdateSettings({ localOnlyMode: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Telemetry', 'Anonymous usage telemetry') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Telemetry Enabled</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Forge is strictly zero-telemetry by default</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.telemetryEnabled}
                      onChange={(e) => onUpdateSettings({ telemetryEnabled: e.target.checked })}
                    />
                  </div>
                )}

                {matchesSearch('Log Level', 'Application structured logging verbosity') && (
                  <div className="forge-settings-row">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>Logging Verbosity</div>
                      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Structured log level in ~/.forge/logs</div>
                    </div>
                    <select
                      className="forge-select"
                      value={settings.logLevel}
                      onChange={(e) => onUpdateSettings({ logLevel: e.target.value as any })}
                    >
                      <option value="info">INFO (Recommended)</option>
                      <option value="debug">DEBUG (Verbose)</option>
                      <option value="warn">WARN</option>
                      <option value="error">ERROR</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* JSON Settings Editor */}
            {activeCategory === 'json' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  Interactive JSON Settings Editor
                </div>
                <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                  Directly edit raw configuration. Validated on Apply.
                </div>
                {jsonError && (
                  <div style={{ color: 'var(--forge-error)', fontSize: '12px', background: 'rgba(255,0,0,0.1)', padding: '6px 10px', borderRadius: 4 }}>
                    ⚠️ {jsonError}
                  </div>
                )}
                <textarea
                  style={{
                    flex: 1,
                    minHeight: '280px',
                    fontFamily: 'JetBrains Mono, Menlo, monospace',
                    fontSize: '12px',
                    background: 'var(--forge-bg-input)',
                    color: 'var(--forge-text-primary)',
                    border: '1px solid var(--forge-border)',
                    borderRadius: 'var(--forge-radius-sm)',
                    padding: '10px',
                    outline: 'none',
                    resize: 'none',
                  }}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => {
                      setJsonText(JSON.stringify(settings, null, 2));
                      setJsonError(null);
                    }}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: '1px solid var(--forge-border)',
                      color: 'var(--forge-text-muted)',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleApplyJSON}
                    style={{
                      padding: '6px 16px',
                      background: 'var(--forge-accent)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: 4,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Apply JSON Settings
                  </button>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Reference */}
            {activeCategory === 'shortcuts' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Keyboard Shortcuts Reference
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {shortcutsList
                    .filter((s) => matchesSearch(s.command, s.desc) || s.key.toLowerCase().includes(q))
                    .map((s) => (
                      <div
                        key={s.command}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--forge-bg-hover)',
                          borderRadius: 'var(--forge-radius-sm)',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--forge-text-primary)' }}>{s.command}</div>
                          <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>{s.desc}</div>
                        </div>
                        <div
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '11px',
                            background: 'var(--forge-bg-activitybar)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--forge-border)',
                          }}
                        >
                          {s.key}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
