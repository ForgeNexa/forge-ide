import { useState, type FC, type MouseEvent, type KeyboardEvent } from 'react';
import { FileEntry } from '@my-forge/shared-protocol';
import {
  IconFolder,
  IconFile,
  IconChevronRight,
  IconChevronDown,
  IconRefresh,
  IconPlus,
} from './Icons';

interface FileTreeProps {
  workspaceRoot: string;
  files: FileEntry[];
  selectedPath: string | null;
  onSelectFile: (file: FileEntry) => void;
  onOpenFolder: () => void;
  onRefresh: () => void;
  onCreateFile: (parentRelPath: string, name: string) => Promise<void>;
  onCreateFolder: (parentRelPath: string, name: string) => Promise<void>;
  onRenameEntry: (oldRelPath: string, newRelPath: string) => Promise<void>;
  onDeleteEntry: (relPath: string) => Promise<void>;
  onShowInFolder: (relPath: string) => void;
  isLoading: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  entry: FileEntry | null;
}

export const FileTree: FC<FileTreeProps> = ({
  workspaceRoot,
  files,
  selectedPath,
  onSelectFile,
  onOpenFolder,
  onRefresh,
  onCreateFile,
  onCreateFolder,
  onRenameEntry,
  onDeleteEntry,
  onShowInFolder,
  isLoading,
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingParent, setCreatingParent] = useState<string>('');
  const [newEntryName, setNewEntryName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renamedName, setRenamedName] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const folderName = workspaceRoot ? workspaceRoot.split('/').filter(Boolean).pop() || 'workspace' : null;

  const toggleDir = (relPath: string) => {
    setExpandedDirs((prev) => ({ ...prev, [relPath]: !prev[relPath] }));
  };

  const handleContextMenu = (e: MouseEvent, file: FileEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry: file });
  };

  const handleCreateSubmit = async () => {
    if (!newEntryName.trim()) {
      setCreatingType(null);
      return;
    }
    const name = newEntryName.trim();
    if (creatingType === 'file') {
      await onCreateFile(creatingParent, name);
    } else if (creatingType === 'folder') {
      await onCreateFolder(creatingParent, name);
    }
    setCreatingType(null);
    setNewEntryName('');
  };

  const handleRenameSubmit = async (oldRelPath: string) => {
    if (!renamedName.trim()) {
      setRenamingPath(null);
      return;
    }
    const parent = oldRelPath.includes('/') ? oldRelPath.substring(0, oldRelPath.lastIndexOf('/')) : '';
    const newPath = parent ? `${parent}/${renamedName.trim()}` : renamedName.trim();
    await onRenameEntry(oldRelPath, newPath);
    setRenamingPath(null);
  };

  return (
    <div className="forge-sidebar" onClick={() => setContextMenu(null)}>
      <div className="forge-sidebar-header">
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {folderName || 'Explorer'}
        </span>
        <div className="forge-sidebar-actions">
          <button
            className="forge-icon-btn"
            title="New File"
            onClick={() => {
              setCreatingParent('');
              setCreatingType('file');
              setNewEntryName('');
            }}
          >
            <IconPlus />
          </button>
          <button
            className="forge-icon-btn"
            title="New Folder"
            onClick={() => {
              setCreatingParent('');
              setCreatingType('folder');
              setNewEntryName('');
            }}
          >
            <IconFolder />
          </button>
          <button
            className="forge-icon-btn"
            title="Rescan Workspace with Go"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <IconRefresh />
          </button>
          <button className="forge-icon-btn" title="Open Folder..." onClick={onOpenFolder}>
            <IconFolder />
          </button>
        </div>
      </div>

      <div className="forge-filetree">
        {!workspaceRoot ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--forge-text-muted)' }}>
            <p style={{ marginBottom: '14px', fontSize: '12px' }}>No workspace folder opened.</p>
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
        ) : (
          <>
            {/* Inline creation input at root */}
            {creatingType && creatingParent === '' && (
              <div style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {creatingType === 'folder' ? <IconFolder /> : <IconFile />}
                <input
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'var(--forge-bg-input)',
                    border: '1px solid var(--forge-border-focus)',
                    color: 'var(--forge-text-primary)',
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: 'var(--forge-radius-sm)',
                    outline: 'none',
                  }}
                  value={newEntryName}
                  onChange={(e) => setNewEntryName(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') handleCreateSubmit();
                    if (e.key === 'Escape') setCreatingType(null);
                  }}
                  onBlur={handleCreateSubmit}
                  placeholder={`New ${creatingType} name...`}
                />
              </div>
            )}

            {files.map((file) => {
              const isSelected = selectedPath === file.relativePath;
              const depth = file.relativePath.split('/').length - 1;
              const isRenaming = renamingPath === file.relativePath;

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
                  onContextMenu={(e) => handleContextMenu(e, file)}
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
                      <span style={{ width: 11 }} />
                      <span style={{ color: 'var(--forge-text-muted)' }}>
                        <IconFile />
                      </span>
                    </>
                  )}

                  {isRenaming ? (
                    <input
                      autoFocus
                      style={{
                        background: 'var(--forge-bg-input)',
                        border: '1px solid var(--forge-border-focus)',
                        color: 'var(--forge-text-primary)',
                        fontSize: '12px',
                        padding: '1px 4px',
                        outline: 'none',
                        flex: 1,
                      }}
                      value={renamedName}
                      onChange={(e) => setRenamedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(file.relativePath);
                        if (e.key === 'Escape') setRenamingPath(null);
                      }}
                      onBlur={() => handleRenameSubmit(file.relativePath)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--forge-bg-dialog)',
            border: '1px solid var(--forge-border)',
            borderRadius: 'var(--forge-radius-md)',
            boxShadow: 'var(--forge-shadow-menu)',
            zIndex: 2000,
            padding: '4px 0',
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.entry?.isDir && (
            <>
              <div
                className="forge-menu-item"
                onClick={() => {
                  setCreatingParent(contextMenu.entry!.relativePath);
                  setCreatingType('file');
                  setNewEntryName('');
                  setContextMenu(null);
                }}
              >
                New File Inside...
              </div>
              <div
                className="forge-menu-item"
                onClick={() => {
                  setCreatingParent(contextMenu.entry!.relativePath);
                  setCreatingType('folder');
                  setNewEntryName('');
                  setContextMenu(null);
                }}
              >
                New Folder Inside...
              </div>
              <div style={{ height: 1, background: 'var(--forge-border-subtle)', margin: '4px 0' }} />
            </>
          )}

          <div
            className="forge-menu-item"
            onClick={() => {
              if (contextMenu.entry) {
                setRenamingPath(contextMenu.entry.relativePath);
                setRenamedName(contextMenu.entry.name);
              }
              setContextMenu(null);
            }}
          >
            Rename...
          </div>

          <div
            className="forge-menu-item"
            style={{ color: 'var(--forge-error)' }}
            onClick={() => {
              if (contextMenu.entry) {
                if (confirm(`Delete ${contextMenu.entry.name}? This cannot be undone.`)) {
                  onDeleteEntry(contextMenu.entry.relativePath);
                }
              }
              setContextMenu(null);
            }}
          >
            Delete
          </div>

          <div style={{ height: 1, background: 'var(--forge-border-subtle)', margin: '4px 0' }} />

          <div
            className="forge-menu-item"
            onClick={() => {
              if (contextMenu.entry) {
                onShowInFolder(contextMenu.entry.relativePath);
              }
              setContextMenu(null);
            }}
          >
            Reveal in File Manager
          </div>

          <div
            className="forge-menu-item"
            onClick={() => {
              if (contextMenu.entry) {
                navigator.clipboard.writeText(contextMenu.entry.relativePath);
              }
              setContextMenu(null);
            }}
          >
            Copy Relative Path
          </div>
        </div>
      )}
    </div>
  );
};
