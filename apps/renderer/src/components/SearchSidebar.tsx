import { useState, type FC, type KeyboardEvent } from 'react';
import { ContentSearchResult, ContentSearchMatch } from '@my-forge/shared-protocol';
import { IconSearch, IconChevronRight, IconChevronDown } from './Icons';

interface SearchSidebarProps {
  onSearch: (
    query: string,
    options: { isCaseSensitive: boolean; isWholeWord: boolean }
  ) => Promise<ContentSearchResult>;
  onSelectMatch: (fileRelPath: string, line: number, col: number) => void;
}

export const SearchSidebar: FC<SearchSidebarProps> = ({ onSearch, onSelectMatch }) => {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ContentSearchResult | null>(null);
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await onSearch(query, { isCaseSensitive: caseSensitive, isWholeWord: wholeWord });
      setResult(res);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Group matches by file
  const matchesByFile: Record<string, ContentSearchMatch[]> = {};
  if (result) {
    for (const m of result.matches) {
      if (!matchesByFile[m.relativePath]) {
        matchesByFile[m.relativePath] = [];
      }
      matchesByFile[m.relativePath].push(m);
    }
  }

  const toggleFile = (path: string) => {
    setCollapsedFiles((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="forge-sidebar">
      <div className="forge-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconSearch />
          <span>Search</span>
        </div>
      </div>

      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--forge-border-subtle)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            style={{
              width: '100%',
              background: 'var(--forge-bg-input)',
              border: '1px solid var(--forge-border)',
              borderRadius: 'var(--forge-radius-sm)',
              padding: '6px 64px 6px 8px',
              color: 'var(--forge-text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
            placeholder="Search across workspace"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div style={{ position: 'absolute', right: 4, display: 'flex', gap: 4 }}>
            <button
              style={{
                background: caseSensitive ? 'var(--forge-accent)' : 'transparent',
                color: caseSensitive ? '#ffffff' : 'var(--forge-text-muted)',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Match Case"
              onClick={() => setCaseSensitive(!caseSensitive)}
            >
              Aa
            </button>
            <button
              style={{
                background: wholeWord ? 'var(--forge-accent)' : 'transparent',
                color: wholeWord ? '#ffffff' : 'var(--forge-text-muted)',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Match Whole Word"
              onClick={() => setWholeWord(!wholeWord)}
            >
              \b
            </button>
          </div>
        </div>

        {result && (
          <div style={{ marginTop: 8, fontSize: '11px', color: 'var(--forge-text-muted)' }}>
            {result.totalMatches} results in {result.fileCount} files ({result.durationMs}ms)
          </div>
        )}
      </div>

      {/* Results Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {isSearching && (
          <div style={{ padding: '12px', color: 'var(--forge-text-muted)', fontSize: '12px' }}>
            Searching...
          </div>
        )}

        {result && result.totalMatches === 0 && !isSearching && (
          <div style={{ padding: '12px', color: 'var(--forge-text-muted)', fontSize: '12px' }}>
            No results found.
          </div>
        )}

        {result &&
          Object.entries(matchesByFile).map(([filePath, matches]) => {
            const isCollapsed = collapsedFiles[filePath];
            return (
              <div key={filePath} style={{ marginBottom: 4 }}>
                <div
                  className="forge-tree-item"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                  onClick={() => toggleFile(filePath)}
                >
                  {isCollapsed ? <IconChevronRight /> : <IconChevronDown />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {filePath}
                  </span>
                  <span className="forge-badge" style={{ marginLeft: 'auto' }}>
                    {matches.length}
                  </span>
                </div>

                {!isCollapsed &&
                  matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="forge-tree-item"
                      style={{ paddingLeft: '28px', fontSize: '11px' }}
                      onClick={() => onSelectMatch(m.relativePath, m.line, m.column)}
                    >
                      <span style={{ color: 'var(--forge-text-muted)', marginRight: 6 }}>
                        {m.line}:
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.lineText}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
      </div>
    </div>
  );
};
