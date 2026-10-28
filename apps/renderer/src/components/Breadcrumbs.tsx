import { type FC } from 'react';
import { IconPlay } from './Icons';
import { MaterialIcon } from './MaterialIcon';

interface BreadcrumbsProps {
  workspaceRoot: string;
  activePath: string | null;
  iconTheme?: 'material-icon-theme' | 'minimal';
  onRunFile?: () => void;
  isRunning?: boolean;
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({
  workspaceRoot,
  activePath,
  iconTheme = 'material-icon-theme',
  onRunFile,
  isRunning,
}) => {
  if (!activePath) return null;

  const folderName = workspaceRoot ? workspaceRoot.split('/').filter(Boolean).pop() || 'workspace' : '';
  const parts = activePath.split('/').filter(Boolean);

  const isRunnable = /\.(go|ts|js|mjs|py|sh)$/i.test(activePath);

  return (
    <div className="forge-breadcrumbs">
      <div className="forge-breadcrumbs-path">
        {folderName && (
          <>
            <span style={{ opacity: 0.7 }}>{folderName}</span>
            <span style={{ opacity: 0.4 }}>/</span>
          </>
        )}
        {parts.map((part, idx) => (
          <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {idx === parts.length - 1 ? (
              <>
                <MaterialIcon fileName={part} size={14} iconTheme={iconTheme} />
                <span style={{ fontWeight: 600, color: 'var(--forge-text-primary)' }}>{part}</span>
              </>
            ) : (
              <>
                <span style={{ opacity: 0.8 }}>{part}</span>
                <span style={{ opacity: 0.4 }}>/</span>
              </>
            )}
          </span>
        ))}
      </div>

      {isRunnable && onRunFile && (
        <button
          className="forge-run-btn"
          title="Run Current File"
          onClick={onRunFile}
          disabled={isRunning}
        >
          <IconPlay />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>
      )}
    </div>
  );
};
