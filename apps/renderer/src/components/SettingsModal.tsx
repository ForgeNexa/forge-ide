import { type FC } from 'react';
import { ForgeSettings } from '@my-forge/shared-protocol';
import { IconClose } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ForgeSettings;
  onUpdateSettings: (patch: Partial<ForgeSettings>) => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="forge-modal-backdrop" onClick={onClose}>
      <div
        className="forge-palette"
        style={{ width: '500px', maxHeight: '520px', padding: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Preferences & Settings</span>
          <div className="forge-tab-close" onClick={onClose}>
            <IconClose />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Theme */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>Color Theme</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                Overall visual appearance of the editor
              </div>
            </div>
            <select
              style={{
                background: 'var(--forge-bg-input)',
                color: 'var(--forge-text-primary)',
                border: '1px solid var(--forge-border)',
                borderRadius: 'var(--forge-radius-sm)',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
              }}
              value={settings.theme}
              onChange={(e) => onUpdateSettings({ theme: e.target.value as any })}
            >
              <option value="graphite-dark">Graphite Dark (CodeEdit Inspired)</option>
              <option value="sand-light">Sand Light</option>
            </select>
          </div>

          {/* Font Size */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>Font Size</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                Editor text font size ({settings.fontSize}px)
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="22"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
            />
          </div>

          {/* Tab Size */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>Tab Size</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                Number of spaces per indentation tab
              </div>
            </div>
            <select
              style={{
                background: 'var(--forge-bg-input)',
                color: 'var(--forge-text-primary)',
                border: '1px solid var(--forge-border)',
                borderRadius: 'var(--forge-radius-sm)',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
              }}
              value={settings.tabSize}
              onChange={(e) => onUpdateSettings({ tabSize: parseInt(e.target.value, 10) })}
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
            </select>
          </div>

          {/* Minimap */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>Minimap</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                Show code outline minimap on right side
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.minimap}
              onChange={(e) => onUpdateSettings({ minimap: e.target.checked })}
            />
          </div>

          {/* Word Wrap */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>Word Wrap</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                Wrap long lines automatically in editor
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.wordWrap}
              onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
