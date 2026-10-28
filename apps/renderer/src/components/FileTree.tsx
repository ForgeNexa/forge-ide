import { useState, type FC } from 'react';
import { FileEntry } from '@my-forge/shared-protocol';
import {
  IconFolder,
  IconFile,
  IconChevronRight,
  IconChevronDown,
  IconRefresh,
} from './Icons';

interface FileTreeProps {
  workspaceRoot: string;
  files: FileEntry[];
  selectedPath: string | null;
  onSelectFile: (file: FileEntry) => void;
  onOpenFolder: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const FileTree: FC<FileTreeProps> = ({
  workspaceRoot,
  files,
  selectedPath,
  onSelectFile,
  onOpenFolder,
  onRefresh,
  isLoading,
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});

  const folderName = workspaceRoot ? workspaceRoot.split('/').filter(Boolean).pop() || 'workspace' : null;

  const toggleDir = (relPath: string) => {
    setExpandedDirs((prev) => ({ ...prev, [relPath]: !prev[relPath] }));
  };

  // Group files into current tree structure
  const renderEntries = () => {
    if (!workspaceRoot) {
      return (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--forge-text-muted)' }}>
          <p style={{ marginBottom: '14px', fontSize: '12px' }}>You have not yet opened a folder.</p>
          <button
            onClick={onOpenFolder}
            style={{
              backgroundColor: 'var(--forge-accent)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--forge-radius-md)',
              fontWeight: 500,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Open Folder
          </button>
        </div>
      );
    }

    if (files.length === 0 && !isLoading) {
      return (
        <div style={{ padding: '20px 16px', color: 'var(--forge-text-muted)', fontSize: '12px' }}>
          Workspace is empty.
        </div>
      );
    }

    return files.map((file) => {
      const isSelected = selectedPath === file.relativePath;
      const depth = file.relativePath.split('/').length - 1;

      return (
        <div
          key={file.relativePath}
          className={`forge-tree-item ${isSelected ? 'selected' : ''} ${file.isDir ? 'is-dir' : ''}`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
          onClick={() => {
            if (file.isDir) {
              toggleDir(file.relativePath);
            } else {
              onSelectFile(file);
            }
          }}
        >
          {file.isDir ? (
            <>
              {expandedDirs[file.relativePath] ? <IconChevronDown /> : <IconChevronRight />}
              <span style={{ color: 'var(--forge-warning)' }}>
                <IconFolder />
              </span>
            </>
          ) : (
            <>
              <span style={{ width: 12 }} />
              <span style={{ color: 'var(--forge-text-muted)' }}>
                <IconFile />
              </span>
            </>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="forge-sidebar">
      <div className="forge-sidebar-header">
        <span>{folderName || 'Explorer'}</span>
        <div className="forge-sidebar-actions">
          <button
            className="forge-icon-btn"
            title="Rescan Workspace with Go"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <IconRefresh />
          </button>
          <button
            className="forge-icon-btn"
            title="Open Another Folder"
            onClick={onOpenFolder}
          >
            <IconFolder />
          </button>
        </div>
      </div>
      <div className="forge-filetree">{renderEntries()}</div>
    </div>
  );
};
