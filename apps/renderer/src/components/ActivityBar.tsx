import type { FC } from 'react';
import {
  IconFiles,
  IconSearch,
  IconGit,
  IconDebug,
  IconExtensions,
  IconSettings,
  IconTerminal,
} from './Icons';

export type ActivityView = 'explorer' | 'search' | 'git' | 'debug' | 'extensions';

interface ActivityBarProps {
  activeView: ActivityView | null;
  onSelectView: (view: ActivityView) => void;
  onOpenSettings: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen?: boolean;
}

export const ActivityBar: FC<ActivityBarProps> = ({
  activeView,
  onSelectView,
  onOpenSettings,
  onToggleTerminal,
  isTerminalOpen,
}) => {
  return (
    <div className="forge-activitybar">
      <div className="forge-activitybar-top">
        <button
          className={`forge-activity-btn ${activeView === 'explorer' ? 'active' : ''}`}
          title="Explorer (Cmd+Shift+E)"
          onClick={() => onSelectView('explorer')}
        >
          <IconFiles />
        </button>
        <button
          className={`forge-activity-btn ${activeView === 'search' ? 'active' : ''}`}
          title="Search (Cmd+Shift+F)"
          onClick={() => onSelectView('search')}
        >
          <IconSearch />
        </button>
        <button
          className={`forge-activity-btn ${activeView === 'git' ? 'active' : ''}`}
          title="Source Control (Ctrl+Shift+G)"
          onClick={() => onSelectView('git')}
        >
          <IconGit />
        </button>
        <button
          className={`forge-activity-btn ${activeView === 'debug' ? 'active' : ''}`}
          title="Run & Debug (Cmd+Shift+D)"
          onClick={() => onSelectView('debug')}
        >
          <IconDebug />
        </button>
        <button
          className={`forge-activity-btn ${activeView === 'extensions' ? 'active' : ''}`}
          title="Extensions (Cmd+Shift+X)"
          onClick={() => onSelectView('extensions')}
        >
          <IconExtensions />
        </button>
        <button
          className={`forge-activity-btn ${isTerminalOpen ? 'active' : ''}`}
          title="Integrated Terminal (Ctrl+` / Cmd+J)"
          onClick={onToggleTerminal}
        >
          <IconTerminal />
        </button>
      </div>
      <div className="forge-activitybar-bottom">
        <button
          className="forge-activity-btn"
          title="Settings (Cmd+,)"
          onClick={onOpenSettings}
        >
          <IconSettings />
        </button>
      </div>
    </div>
  );
};
