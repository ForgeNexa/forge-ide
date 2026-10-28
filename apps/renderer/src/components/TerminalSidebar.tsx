import { useState, type FC } from 'react';
import { TerminalTab } from './TerminalTab';
import { IconTerminal, IconRefresh } from './Icons';

interface TerminalSidebarProps {
  cwd: string;
  theme: '2026-dark' | 'graphite-dark' | 'sand-light';
  onMoveToBottom?: () => void;
}

export const TerminalSidebar: FC<TerminalSidebarProps> = ({ cwd, theme, onMoveToBottom }) => {
  const [instanceKey, setInstanceKey] = useState(0);

  const handleRestart = () => {
    setInstanceKey((k) => k + 1);
  };

  return (
    <div className="forge-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="forge-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconTerminal />
          <span>Sidebar Terminal</span>
        </div>
        <div className="forge-sidebar-actions">
          <button
            className="forge-icon-btn"
            title="Restart Terminal Session"
            onClick={handleRestart}
          >
            <IconRefresh />
          </button>
          {onMoveToBottom && (
            <button
              className="forge-icon-btn"
              title="Dock Terminal to Bottom Panel"
              onClick={onMoveToBottom}
              style={{ fontSize: '10px' }}
            >
              ⬇
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: 0 }}>
        <TerminalTab key={instanceKey} cwd={cwd} theme={theme} />
      </div>
    </div>
  );
};
