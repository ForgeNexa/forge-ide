import { type FC } from 'react';
import { IconPlay } from './Icons';
import { MaterialIcon } from './MaterialIcon';

interface BreadcrumbsProps {
  workspaceRoot: string;
  activePath: string | null;
  iconTheme?: 'material-icon-theme' | 'minimal';
  onRunFile?: () => void;
  isRunning?: boolean;
  isMarkdown?: boolean;
  isPreviewMarkdown?: boolean;
  onToggleMarkdownPreview?: () => void;
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({
  workspaceRoot,
  activePath,
  iconTheme = 'material-icon-theme',
  onRunFile,
  isRunning,
  isMarkdown,
  isPreviewMarkdown,
  onToggleMarkdownPreview,
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

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {isMarkdown && onToggleMarkdownPreview && (
          <button
            onClick={onToggleMarkdownPreview}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              background: isPreviewMarkdown ? 'var(--forge-accent)' : 'transparent',
              color: isPreviewMarkdown ? '#ffffff' : 'var(--forge-text-muted)',
              border: '1px solid var(--forge-border)',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title={isPreviewMarkdown ? 'Switch to Markdown source code' : 'Preview rendered Markdown'}
          >
            {isPreviewMarkdown ? '✎ Code' : '👁 Preview'}
          </button>
        )}

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
    </div>
  );
};
