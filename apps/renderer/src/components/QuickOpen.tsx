import { useState, useEffect, useRef, type FC, type KeyboardEvent } from 'react';
import { FileEntry } from '@my-forge/shared-protocol';
import { MaterialIcon } from './MaterialIcon';
import { IconSearch } from './Icons';

interface QuickOpenProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: FileEntry) => void;
  searchFiles: (query: string) => Promise<FileEntry[]>;
  iconTheme?: 'material-icon-theme' | 'minimal';
}

export const QuickOpen: FC<QuickOpenProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  searchFiles,
  iconTheme = 'material-icon-theme',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      searchFiles('').then(setResults);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchFiles(query).then((res) => {
          setResults(res);
          setSelectedIndex(0);
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        onSelectFile(selected);
        onClose();
      }
    }
  };

  return (
    <div className="forge-modal-backdrop" onClick={onClose}>
      <div className="forge-palette" onClick={(e) => e.stopPropagation()}>
        <div className="forge-palette-input-wrap">
          <IconSearch />
          <input
            ref={inputRef}
            className="forge-palette-input"
            placeholder="Search files by name in Go index..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="forge-palette-list">
          {results.length === 0 ? (
            <div style={{ padding: '12px 14px', color: 'var(--forge-text-muted)', fontSize: '13px' }}>
              No files found.
            </div>
          ) : (
            results.map((file, idx) => (
              <div
                key={file.relativePath}
                className={`forge-palette-item ${idx === selectedIndex ? 'active' : ''}`}
                onClick={() => {
                  onSelectFile(file);
                  onClose();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MaterialIcon fileName={file.name} isDir={file.isDir} size={15} iconTheme={iconTheme} />
                  <span style={{ fontWeight: 500, marginRight: 8 }}>{file.name}</span>
                  <span className="forge-palette-meta">{file.relativePath}</span>
                </div>
                <span className="forge-palette-meta">{file.languageId || 'text'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
