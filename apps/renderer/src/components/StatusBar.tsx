import { type FC } from 'react';
import { IconGit, IconGoGopher, IconSettings } from './Icons';
import { IndexStats, SystemHealth } from '@my-forge/shared-protocol';

interface StatusBarProps {
  branch: string;
  isGitRepo: boolean;
  cursorLine: number;
  cursorCol: number;
  activeLanguage: string;
  encoding: string;
  theme: 'graphite-dark' | 'sand-light';
  indexStats: IndexStats | null;
  health: SystemHealth | null;
  onToggleTheme: () => void;
  onToggleBottomPanel: () => void;
  onOpenSettings: () => void;
}

export const StatusBar: FC<StatusBarProps> = ({
  branch,
  isGitRepo,
  cursorLine,
  cursorCol,
  activeLanguage,
  encoding,
  theme,
  indexStats,
  onToggleTheme,
  onToggleBottomPanel,
  onOpenSettings,
}) => {
  return (
    <div className="forge-statusbar">
      <div className="forge-statusbar-left">
        {isGitRepo ? (
          <div className="forge-status-item" title="Git Branch">
            <IconGit />
            <span>{branch || 'main'}</span>
          </div>
        ) : (
          <div className="forge-status-item" style={{ opacity: 0.6 }}>
            <span>No Git</span>
          </div>
        )}

        <div
          className="forge-status-item forge-status-pill"
          title="Click to view Go daemon telemetry & health"
          onClick={onToggleBottomPanel}
        >
          <IconGoGopher />
          <span>Go Daemon: Active</span>
        </div>

        {indexStats && (
          <div className="forge-status-item" style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
            <span>⚡ {indexStats.totalFiles} files in {indexStats.durationMs}ms</span>
          </div>
        )}
      </div>

      <div className="forge-statusbar-right">
        <div className="forge-status-item">
          <span>Ln {cursorLine}, Col {cursorCol}</span>
        </div>
        <div className="forge-status-item">
          <span>{encoding}</span>
        </div>
        <div className="forge-status-item" style={{ textTransform: 'capitalize' }}>
          <span>{activeLanguage}</span>
        </div>
        <div className="forge-status-item" onClick={onOpenSettings} title="Preferences (Cmd+,)">
          <IconSettings />
        </div>
        <div className="forge-status-item" onClick={onToggleTheme} title="Switch Theme">
          <span>{theme === 'graphite-dark' ? '🌙' : '☀️'}</span>
        </div>
      </div>
    </div>
  );
};
