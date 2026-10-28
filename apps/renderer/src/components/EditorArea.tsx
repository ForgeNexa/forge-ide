import { useRef, useEffect, type FC, type MouseEvent } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { IconClose } from './Icons';

export interface EditorTab {
  id: string;
  relativePath: string;
  title: string;
  content: string;
  originalContent: string;
  languageId: string;
  isDirty: boolean;
}

interface EditorAreaProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  theme: 'graphite-dark' | 'sand-light';
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: MouseEvent) => void;
  onContentChange: (id: string, content: string) => void;
  onCursorChange: (line: number, col: number) => void;
  onSave: () => void;
  onOpenQuickOpen: () => void;
  onOpenCommandPalette: () => void;
}

export const EditorArea: FC<EditorAreaProps> = ({
  tabs,
  activeTabId,
  theme,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onCursorChange,
  onSave,
  onOpenQuickOpen,
  onOpenCommandPalette,
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom Graphite Dark theme matching Yantra Works design tokens
    monaco.editor.defineTheme('forge-graphite-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '768390', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f47067' },
        { token: 'string', foreground: '96d0ff' },
        { token: 'number', foreground: '6cb6ff' },
        { token: 'type', foreground: 'dcedf9' },
        { token: 'function', foreground: 'd2a8ff' },
      ],
      colors: {
        'editor.background': '#141619',
        'editor.foreground': '#e6edf3',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#adbac7',
        'editorCursor.foreground': '#388bfd',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#1f385c',
        'editor.lineHighlightBackground': '#181b20',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#388bfd55',
      },
    });

    // Cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange(e.position.lineNumber, e.position.column);
    });

    // Add Command/Ctrl+S save shortcut to Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  useEffect(() => {
    if (editorRef.current) {
      const monacoTheme = theme === 'sand-light' ? 'vs' : 'forge-graphite-dark';
      // @ts-ignore
      window.monaco?.editor.setTheme(monacoTheme);
    }
  }, [theme]);

  return (
    <div className="forge-editor-area">
      {/* Tab bar */}
      <div className="forge-tabbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`forge-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <span>{tab.title}</span>
              {tab.isDirty ? (
                <div className="forge-tab-dirty" title="Unsaved changes" />
              ) : (
                <div
                  className="forge-tab-close"
                  onClick={(e) => onCloseTab(tab.id, e)}
                  title="Close (Cmd+W)"
                >
                  <IconClose />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor surface */}
      <div className="forge-editor-surface">
        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.languageId || 'plaintext'}
            value={activeTab.content}
            theme={theme === 'sand-light' ? 'vs' : 'forge-graphite-dark'}
            onChange={(val) => onContentChange(activeTab.id, val || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, monospace',
              fontLigatures: true,
              minimap: { enabled: true, renderCharacters: false, maxColumn: 80 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              tabSize: 2,
              wordWrap: 'on',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '16px',
              color: 'var(--forge-text-muted)',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--forge-text-primary)' }}>
              my-forge
            </div>
            <p style={{ fontSize: '13px' }}>Your workspace for building software.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div
                style={{ cursor: 'pointer', display: 'flex', gap: '16px', justifyContent: 'space-between' }}
                onClick={onOpenQuickOpen}
              >
                <span>Quick Open File</span>
                <span className="forge-kbd">Cmd+P</span>
              </div>
              <div
                style={{ cursor: 'pointer', display: 'flex', gap: '16px', justifyContent: 'space-between' }}
                onClick={onOpenCommandPalette}
              >
                <span>Command Palette</span>
                <span className="forge-kbd">Cmd+Shift+P</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
