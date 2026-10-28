import { useState, type FC } from 'react';
import { ForgeSettings } from '@my-forge/shared-protocol';
import { IconClose, IconSearch } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ForgeSettings;
  onUpdateSettings: (patch: Partial<ForgeSettings>) => void;
}

type SettingsCategory =
  | 'general'
  | 'appearance'
  | 'editor'
  | 'daemon'
  | 'ai'
  | 'privacy'
  | 'shortcuts';

export const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories: { id: SettingsCategory; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'editor', label: 'Editor', icon: '🖋️' },
    { id: 'daemon', label: 'Go Daemon & Performance', icon: '⚡' },
    { id: 'ai', label: 'Agentic & AI Pairing', icon: '🤖' },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' },
  ];

  const shortcutsList = [
    { command: 'Quick Open (File)', key: 'Cmd+P / Ctrl+P', desc: 'Instant fuzzy file search via Go indexer' },
    { command: 'Command Palette', key: 'Cmd+Shift+P / Ctrl+Shift+P', desc: 'Open workspace action dispatcher' },
    { command: 'Save File', key: 'Cmd+S / Ctrl+S', desc: 'Save current active file buffer' },
    { command: 'Save File As', key: 'Cmd+Shift+S / Ctrl+Shift+S', desc: 'Save file to new path' },
    { command: 'Toggle Primary Sidebar', key: 'Cmd+B / Ctrl+B', desc: 'Expand or collapse sidebar' },
    { command: 'Toggle Bottom Panel', key: 'Cmd+J / Ctrl+J', desc: 'Expand or collapse bottom panel' },
    { command: 'Sidebar Terminal', key: 'Ctrl+\`', desc: 'Toggle terminal in activity bar' },
    { command: 'Preferences', key: 'Cmd+, / Ctrl+,', desc: 'Open Antigravity settings dialog' },
  ];

  const filteredShortcuts = shortcutsList.filter(
    (s) =>
      s.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="forge-modal-backdrop" onClick={onClose}>
      <div
        className="forge-palette"
        style={{
          width: '780px',
          height: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--forge-bg-dialog)',
          borderRadius: 'var(--forge-radius-lg)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Antigravity Settings Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' }}>
              forge Settings
            </span>
            <span className="forge-badge" style={{ marginLeft: 4 }}>
              Google Antigravity Mode
            </span>
          </div>

          {/* Search settings input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '260px' }}>
            <input
              style={{
                width: '100%',
                background: 'var(--forge-bg-input)',
                border: '1px solid var(--forge-border)',
                borderRadius: 'var(--forge-radius-md)',
                padding: '4px 8px 4px 26px',
                color: 'var(--forge-text-primary)',
                fontSize: '11px',
                outline: 'none',
              }}
              placeholder="Search settings & shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div style={{ position: 'absolute', left: 8, color: 'var(--forge-text-muted)' }}>
              <IconSearch />
            </div>
          </div>

          <div className="forge-tab-close" onClick={onClose} style={{ marginLeft: 12 }}>
            <IconClose />
          </div>
        </div>

        {/* Body with category navigation on left and settings cards on right */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Categories Sidebar */}
          <div
            style={{
              width: '210px',
              borderRight: '1px solid var(--forge-border)',
              background: 'var(--forge-bg-sidebar)',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {categories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 'var(--forge-radius-sm)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: activeCategory === c.id ? 600 : 400,
                  color: activeCategory === c.id ? 'var(--forge-accent)' : 'var(--forge-text-secondary)',
                  background: activeCategory === c.id ? 'var(--forge-bg-active)' : 'transparent',
                }}
                onClick={() => setActiveCategory(c.id)}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Settings Content Area */}
          <div style={{ flex: 1, padding: '18px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* General */}
            {activeCategory === 'general' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  General Configuration
                </div>
                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Terminal Dock Placement</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Choose default terminal docking location
                    </div>
                  </div>
                  <select
                    className="forge-select"
                    value={settings.terminalPosition}
                    onChange={(e) => onUpdateSettings({ terminalPosition: e.target.value as any })}
                  >
                    <option value="sidebar">Activity Bar Sidebar</option>
                    <option value="bottom">Bottom Panel</option>
                  </select>
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Window Titlebar</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      macOS CodeEdit-style unified titlebar with traffic light integration
                    </div>
                  </div>
                  <span className="forge-badge">Active</span>
                </div>
              </>
            )}

            {/* Appearance */}
            {activeCategory === 'appearance' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Appearance & Design
                </div>
                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Color Theme</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Official 2026 Dark and CodeEdit design palettes
                    </div>
                  </div>
                  <select
                    className="forge-select"
                    value={settings.theme}
                    onChange={(e) => onUpdateSettings({ theme: e.target.value as any })}
                  >
                    <option value="2026-dark">2026 Dark (Default — mrleemurray.theme-2026)</option>
                    <option value="graphite-dark">Graphite Dark (CodeEdit Reference)</option>
                    <option value="sand-light">Sand Light (Crisp Contrast)</option>
                  </select>
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>File & Folder Icon Theme</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Recognizable glyphs for languages, configs & folders
                    </div>
                  </div>
                  <select
                    className="forge-select"
                    value={settings.iconTheme || 'material-icon-theme'}
                    onChange={(e) => onUpdateSettings({ iconTheme: e.target.value as any })}
                  >
                    <option value="material-icon-theme">Material Icon Theme (Default)</option>
                    <option value="minimal">Minimal Icons</option>
                  </select>
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Editor Font Family</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Monospace font for Monaco code surface
                    </div>
                  </div>
                  <input
                    style={{
                      background: 'var(--forge-bg-input)',
                      border: '1px solid var(--forge-border)',
                      borderRadius: 'var(--forge-radius-sm)',
                      padding: '4px 8px',
                      color: 'var(--forge-text-primary)',
                      fontSize: '11px',
                      width: '200px',
                    }}
                    value={settings.fontFamily}
                    onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Editor */}
            {activeCategory === 'editor' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Editor Controls
                </div>
                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Font Size ({settings.fontSize}px)</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Adjust editor font scale</div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="22"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Line Numbers</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Display mode for line numbering</div>
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

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Tab Size</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Spaces per indentation</div>
                  </div>
                  <select
                    className="forge-select"
                    value={settings.tabSize}
                    onChange={(e) => onUpdateSettings({ tabSize: parseInt(e.target.value, 10) })}
                  >
                    <option value="2">2 spaces</option>
                    <option value="4">4 spaces</option>
                  </select>
                </div>

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

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Minimap</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Show overview minimap on right side</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.minimap}
                    onChange={(e) => onUpdateSettings({ minimap: e.target.checked })}
                  />
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Word Wrap</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Wrap lines exceeding viewport width</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.wordWrap}
                    onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked })}
                  />
                </div>
              </>
            )}

            {/* Go Daemon & Performance */}
            {activeCategory === 'daemon' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Go Daemon & Performance
                </div>
                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Resident Go Daemon</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      JSON-RPC 2.0 daemon running over private stdio/IPC
                    </div>
                  </div>
                  <span className="forge-badge" style={{ color: 'var(--forge-success)' }}>Active (PID monitored)</span>
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Max In-Memory File Size</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Threshold for fast memory buffers</div>
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

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Debounce Rate</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>Debounce interval for re-indexing</div>
                  </div>
                  <select
                    className="forge-select"
                    value={settings.autoReindexDebounceMs}
                    onChange={(e) => onUpdateSettings({ autoReindexDebounceMs: parseInt(e.target.value, 10) })}
                  >
                    <option value="100">100 ms (Fastest)</option>
                    <option value="250">250 ms (Balanced)</option>
                    <option value="500">500 ms (Power saving)</option>
                  </select>
                </div>
              </>
            )}

            {/* Agentic & AI Pairing (Antigravity mode) */}
            {activeCategory === 'ai' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Google Antigravity AI Engine
                </div>
                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Antigravity AI Pairing</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Autonomous coding assistant & code generation
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.aiEnabled}
                    onChange={(e) => onUpdateSettings({ aiEnabled: e.target.checked })}
                  />
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>AI Model Selection</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Selected LLM architecture for workspace intelligence
                    </div>
                  </div>
                  <select
                    className="forge-select"
                    value={settings.aiProvider}
                    onChange={(e) => onUpdateSettings({ aiProvider: e.target.value as any })}
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Ultra-fast)</option>
                    <option value="gemini-pro">Gemini Pro (Advanced reasoning)</option>
                    <option value="claude-3.7">Claude 3.7 Sonnet</option>
                    <option value="local">Local Model (Ollama / Llama.cpp)</option>
                  </select>
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Inline Ghost Completions</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Show suggested code completions as ghost text
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.aiInlineCompletions}
                    onChange={(e) => onUpdateSettings({ aiInlineCompletions: e.target.checked })}
                  />
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Contextual Awareness</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Feed Go daemon indexed symbols to enhance completions
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.aiContextAwareness}
                    onChange={(e) => onUpdateSettings({ aiContextAwareness: e.target.checked })}
                  />
                </div>
              </>
            )}

            {/* Privacy */}
            {activeCategory === 'privacy' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Privacy & Local-First Isolation
                </div>
                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Local-Only Mode</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      All files, symbols, and buffers remain strictly on your machine
                    </div>
                  </div>
                  <span className="forge-badge" style={{ color: 'var(--forge-success)' }}>Enforced</span>
                </div>

                <div className="forge-settings-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '12px' }}>Usage Telemetry</div>
                    <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                      Zero silent telemetry, tracking, or cloud log uploads
                    </div>
                  </div>
                  <span className="forge-badge" style={{ color: 'var(--forge-text-muted)' }}>Disabled by Default</span>
                </div>
              </>
            )}

            {/* Keyboard Shortcuts */}
            {activeCategory === 'shortcuts' && (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--forge-border-subtle)', paddingBottom: 6 }}>
                  Configured Keyboard Shortcuts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredShortcuts.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: 'var(--forge-bg-hover)',
                        borderRadius: 'var(--forge-radius-sm)',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.command}</div>
                        <div style={{ fontSize: '10px', color: 'var(--forge-text-muted)' }}>{s.desc}</div>
                      </div>
                      <span className="forge-kbd" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {s.key}
                      </span>
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
