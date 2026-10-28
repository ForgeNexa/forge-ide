import { useRef, useEffect, type FC, type MouseEvent } from 'react';
import Editor, { DiffEditor, OnMount } from '@monaco-editor/react';
import { ForgeSettings } from '@my-forge/shared-protocol';
import { IconClose, IconFolder, IconFile } from './Icons';
import { Breadcrumbs } from './Breadcrumbs';
import { MaterialIcon } from './MaterialIcon';

export interface EditorTab {
  id: string;
  relativePath: string;
  title: string;
  content: string;
  originalContent: string;
  languageId: string;
  isDirty: boolean;
  isDiff?: boolean;
  diffOriginal?: string;
  diffModified?: string;
}

interface EditorAreaProps {
  workspaceRoot: string;
  tabs: EditorTab[];
  activeTabId: string | null;
  settings: ForgeSettings;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: MouseEvent) => void;
  onCloseOthers: (id: string) => void;
  onCloseAll: () => void;
  onContentChange: (id: string, content: string) => void;
  onCursorChange: (line: number, col: number) => void;
  onSave: () => void;
  onOpenQuickOpen: () => void;
  onOpenCommandPalette: () => void;
  onOpenFolder: () => void;
  onOpenFile: () => void;
  onRunFile?: () => void;
  isRunning?: boolean;
}

export const EditorArea: FC<EditorAreaProps> = ({
  workspaceRoot,
  tabs,
  activeTabId,
  settings,
  onSelectTab,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
  onContentChange,
  onCursorChange,
  onSave,
  onOpenQuickOpen,
  onOpenCommandPalette,
  onOpenFolder,
  onOpenFile,
  onRunFile,
  isRunning,
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define authentic 2026 Dark theme (mrleemurray.theme-2026 / 2026-dark.json)
    monaco.editor.defineTheme('forge-2026-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'storage', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'constant', foreground: '79c0ff' },
        { token: 'type', foreground: '79c0ff' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'ffa657' },
        { token: 'tag', foreground: '7ee787' },
      ],
      colors: {
        'editor.background': '#121314',
        'editor.foreground': '#BBBEBF',
        'editorLineNumber.foreground': '#858889',
        'editorLineNumber.activeForeground': '#BBBEBF',
        'editorCursor.foreground': '#BBBEBF',
        'editor.selectionBackground': '#276782dd',
        'editor.inactiveSelectionBackground': '#27678260',
        'editor.selectionHighlightBackground': '#27678260',
        'editor.lineHighlightBackground': '#242526',
        'editorIndentGuide.background': '#8384854D',
        'editorIndentGuide.activeBackground': '#838485',
        'editorBracketMatch.background': '#3994BC55',
        'editorBracketMatch.border': '#2A2B2C',
      },
    });

    // Define custom Graphite Dark theme matching CodeEdit design tokens
    monaco.editor.defineTheme('forge-graphite-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'd2a8ff' },
        { token: 'function', foreground: 'd2a8ff' },
      ],
      colors: {
        'editor.background': '#151619',
        'editor.foreground': '#e6edf3',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#adbac7',
        'editorCursor.foreground': '#388bfd',
        'editor.selectionBackground': '#23344d',
        'editor.inactiveSelectionBackground': '#1b263b',
        'editor.lineHighlightBackground': '#18191d',
        'editorIndentGuide.background': '#1f2227',
        'editorIndentGuide.activeBackground': '#388bfd44',
      },
    });

    const activeTheme =
      settings.theme === 'sand-light'
        ? 'vs'
        : settings.theme === 'graphite-dark'
        ? 'forge-graphite-dark'
        : 'forge-2026-dark';
    monaco.editor.setTheme(activeTheme);

    editor.onDidChangeCursorPosition((e) => {
      onCursorChange(e.position.lineNumber, e.position.column);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  useEffect(() => {
    if (editorRef.current) {
      const monacoTheme =
        settings.theme === 'sand-light'
          ? 'vs'
          : settings.theme === 'graphite-dark'
          ? 'forge-graphite-dark'
          : 'forge-2026-dark';
      // @ts-ignore
      window.monaco?.editor?.setTheme(monacoTheme);
    }
  }, [settings.theme]);

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
              onContextMenu={(e) => {
                e.preventDefault();
                const action = confirm(`Close other tabs?`);
                if (action) {
                  onCloseOthers(tab.id);
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <MaterialIcon fileName={tab.title} size={14} iconTheme={settings.iconTheme} />
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

        {tabs.length > 0 && (
          <div
            style={{ marginLeft: 'auto', paddingRight: '10px', display: 'flex', gap: 6 }}
          >
            <button
              className="forge-icon-btn"
              title="Close All Tabs"
              onClick={onCloseAll}
              style={{ fontSize: '10px' }}
            >
              Close All
            </button>
          </div>
        )}
      </div>

      {/* CodeEdit Breadcrumbs */}
      {activeTab && (
        <Breadcrumbs
          workspaceRoot={workspaceRoot}
          activePath={activeTab.relativePath}
          iconTheme={settings.iconTheme}
          onRunFile={onRunFile}
          isRunning={isRunning}
        />
      )}

      {/* Editor surface */}
      <div className="forge-editor-surface">
        {activeTab ? (
          activeTab.isDiff ? (
            <DiffEditor
              height="100%"
              original={activeTab.diffOriginal || ''}
              modified={activeTab.diffModified || ''}
              language={activeTab.languageId || 'plaintext'}
              theme={
                settings.theme === 'sand-light'
                  ? 'vs'
                  : settings.theme === 'graphite-dark'
                  ? 'forge-graphite-dark'
                  : 'forge-2026-dark'
              }
              options={{
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily,
                renderSideBySide: true,
                automaticLayout: true,
                readOnly: true,
              }}
            />
          ) : (
            <Editor
              height="100%"
              language={activeTab.languageId || 'plaintext'}
              value={activeTab.content}
              theme={
                settings.theme === 'sand-light'
                  ? 'vs'
                  : settings.theme === 'graphite-dark'
                  ? 'forge-graphite-dark'
                  : 'forge-2026-dark'
              }
              onChange={(val) => onContentChange(activeTab.id, val || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily,
                fontLigatures: true,
                minimap: { enabled: settings.minimap, renderCharacters: false, maxColumn: 80 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: settings.tabSize,
                wordWrap: settings.wordWrap ? 'on' : 'off',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
              }}
            />
          )
        ) : (
          /* CodeEdit-inspired welcome / empty workspace screen */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '18px',
              color: 'var(--forge-text-muted)',
            }}
          >
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--forge-text-primary)', letterSpacing: '-0.5px' }}>
              forge
            </div>
            <p style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', marginTop: -8 }}>
              Your workspace for building software.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={onOpenFolder}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'var(--forge-accent)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--forge-radius-md)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <IconFolder />
                <span>Open Folder</span>
              </button>
              <button
                onClick={onOpenFile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'var(--forge-bg-hover)',
                  color: 'var(--forge-text-primary)',
                  border: '1px solid var(--forge-border)',
                  padding: '8px 16px',
                  borderRadius: 'var(--forge-radius-md)',
                  fontWeight: 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <IconFile />
                <span>Open File</span>
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '16px',
                width: '280px',
              }}
            >
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  background: 'var(--forge-bg-hover)',
                  fontSize: '12px',
                }}
                onClick={onOpenQuickOpen}
              >
                <span>Quick Open File</span>
                <span className="forge-kbd">Cmd+P</span>
              </div>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  background: 'var(--forge-bg-hover)',
                  fontSize: '12px',
                }}
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
