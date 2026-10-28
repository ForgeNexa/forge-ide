import { useState, useEffect, useRef, type FC, type KeyboardEvent } from 'react';
import { IconSearch } from './Icons';

export interface CommandItem {
  id: string;
  label: string;
  category?: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[selectedIndex];
      if (selected) {
        selected.action();
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
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="forge-palette-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', color: 'var(--forge-text-muted)', fontSize: '13px' }}>
              No matching commands.
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`forge-palette-item ${idx === selectedIndex ? 'active' : ''}`}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
              >
                <div>
                  {cmd.category && <span style={{ opacity: 0.6, marginRight: 6 }}>{cmd.category}:</span>}
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && <span className="forge-kbd">{cmd.shortcut}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
