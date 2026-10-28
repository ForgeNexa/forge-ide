import { useState, type FC } from 'react';
import { GitRepositoryStatus, GitFileStatus } from '@my-forge/shared-protocol';
import {
  IconGit,
  IconRefresh,
  IconPlus,
  IconMinus,
  IconUndo,
  IconDiff,
  IconBranch,
} from './Icons';

interface GitSidebarProps {
  gitStatus: GitRepositoryStatus | null;
  onRefresh: () => void;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onDiscardChanges: (path: string) => void;
  onCommit: (message: string) => Promise<boolean>;
  onViewDiff: (file: GitFileStatus) => void;
  onSwitchBranch: (branch: string) => void;
  branches: string[];
}

export const GitSidebar: FC<GitSidebarProps> = ({
  gitStatus,
  onRefresh,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onDiscardChanges,
  onCommit,
  onViewDiff,
  onSwitchBranch,
  branches,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [showBranches, setShowBranches] = useState(false);

  if (!gitStatus?.isRepo) {
    return (
      <div className="forge-sidebar">
        <div className="forge-sidebar-header">
          <span>Source Control</span>
        </div>
        <div style={{ padding: '24px 16px', color: 'var(--forge-text-muted)', fontSize: '12px' }}>
          The active workspace is not a Git repository.
        </div>
      </div>
    );
  }

  const stagedFiles = gitStatus.files.filter((f) => f.staged);
  const unstagedFiles = gitStatus.files.filter((f) => !f.staged);

  const handleCommitSubmit = async () => {
    if (!commitMessage.trim() || isCommitting) return;
    setIsCommitting(true);
    const ok = await onCommit(commitMessage);
    if (ok) {
      setCommitMessage('');
    }
    setIsCommitting(false);
  };

  return (
    <div className="forge-sidebar">
      <div className="forge-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconGit />
          <span>Source Control</span>
        </div>
        <div className="forge-sidebar-actions">
          <button className="forge-icon-btn" title="Refresh Git Status" onClick={onRefresh}>
            <IconRefresh />
          </button>
        </div>
      </div>

      {/* Branch selector */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--forge-border-subtle)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--forge-bg-hover)',
            padding: '5px 8px',
            borderRadius: 'var(--forge-radius-sm)',
            cursor: 'pointer',
            fontSize: '11px',
          }}
          onClick={() => setShowBranches(!showBranches)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBranch />
            <span style={{ fontWeight: 600 }}>{gitStatus.branch || 'HEAD'}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--forge-text-muted)' }}>
            {gitStatus.ahead > 0 ? `↑${gitStatus.ahead}` : ''} {gitStatus.behind > 0 ? `↓${gitStatus.behind}` : ''}
          </span>
        </div>

        {showBranches && branches.length > 0 && (
          <div
            style={{
              background: 'var(--forge-bg-dialog)',
              border: '1px solid var(--forge-border)',
              borderRadius: 'var(--forge-radius-sm)',
              marginTop: '4px',
              maxHeight: '120px',
              overflowY: 'auto',
              boxShadow: 'var(--forge-shadow-menu)',
            }}
          >
            {branches.map((b) => (
              <div
                key={b}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: b === gitStatus.branch ? 'var(--forge-accent)' : 'inherit',
                  background: b === gitStatus.branch ? 'var(--forge-bg-hover)' : 'transparent',
                }}
                onClick={() => {
                  onSwitchBranch(b);
                  setShowBranches(false);
                }}
              >
                {b}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commit Box */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--forge-border-subtle)' }}>
        <textarea
          style={{
            width: '100%',
            height: '60px',
            background: 'var(--forge-bg-input)',
            border: '1px solid var(--forge-border)',
            borderRadius: 'var(--forge-radius-sm)',
            padding: '6px 8px',
            color: 'var(--forge-text-primary)',
            fontSize: '12px',
            resize: 'none',
            outline: 'none',
            marginBottom: '8px',
          }}
          placeholder="Message (Cmd+Enter to commit)"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleCommitSubmit();
            }
          }}
        />
        <button
          style={{
            width: '100%',
            padding: '6px 0',
            backgroundColor: 'var(--forge-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--forge-radius-sm)',
            fontWeight: 600,
            fontSize: '11px',
            cursor: 'pointer',
            opacity: !commitMessage.trim() || isCommitting ? 0.6 : 1,
          }}
          onClick={handleCommitSubmit}
          disabled={!commitMessage.trim() || isCommitting}
        >
          {isCommitting ? 'Committing...' : `Commit to ${gitStatus.branch}`}
        </button>
      </div>

      {/* Files Lists */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {/* Staged Changes */}
        {stagedFiles.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 12px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              <span>Staged Changes ({stagedFiles.length})</span>
              <button
                className="forge-icon-btn"
                title="Unstage All"
                onClick={onUnstageAll}
                style={{ padding: 0 }}
              >
                <IconMinus />
              </button>
            </div>
            {stagedFiles.map((file) => (
              <div
                key={file.path}
                className="forge-tree-item"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}
                  onClick={() => onViewDiff(file)}
                  title="Click to view diff"
                >
                  <IconDiff />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {file.path}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--forge-git-added)' }}>
                    {file.indexStatus || 'A'}
                  </span>
                  <button
                    className="forge-icon-btn"
                    title="Unstage File"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnstageFile(file.path);
                    }}
                  >
                    <IconMinus />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Changes (Working Tree) */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 12px',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            <span>Changes ({unstagedFiles.length})</span>
            {unstagedFiles.length > 0 && (
              <button
                className="forge-icon-btn"
                title="Stage All Changes"
                onClick={onStageAll}
                style={{ padding: 0 }}
              >
                <IconPlus />
              </button>
            )}
          </div>
          {unstagedFiles.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--forge-text-muted)' }}>
              No changes in working tree.
            </div>
          ) : (
            unstagedFiles.map((file) => (
              <div
                key={file.path}
                className="forge-tree-item"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}
                  onClick={() => onViewDiff(file)}
                  title="Click to view diff"
                >
                  <IconDiff />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {file.path}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color:
                        file.status === 'untracked'
                          ? 'var(--forge-git-added)'
                          : file.status === 'deleted'
                          ? 'var(--forge-git-deleted)'
                          : 'var(--forge-git-modified)',
                    }}
                  >
                    {file.workingTreeStatus === '?' ? 'U' : file.workingTreeStatus || 'M'}
                  </span>
                  <button
                    className="forge-icon-btn"
                    title="Stage File"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageFile(file.path);
                    }}
                  >
                    <IconPlus />
                  </button>
                  <button
                    className="forge-icon-btn"
                    title="Discard Changes"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Discard changes to ${file.path}?`)) {
                        onDiscardChanges(file.path);
                      }
                    }}
                  >
                    <IconUndo />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
