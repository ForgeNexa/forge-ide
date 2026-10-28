import { useRef, useEffect, useState, type FC, type MouseEvent } from 'react';
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
  isImage?: boolean;
  imageUrl?: string;
  isBinary?: boolean;
  isPreviewMarkdown?: boolean;
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
  onToggleMarkdownPreview?: (id: string) => void;
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
  onToggleMarkdownPreview,
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const editorRef = useRef<any>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const inlineProviderRegistered = useRef(false);

  const [imageZoom, setImageZoom] = useState(100);
  const [isSplitView, setIsSplitView] = useState(false);

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

    // Register local AI inline completions provider
    if (!inlineProviderRegistered.current) {
      inlineProviderRegistered.current = true;
      monaco.languages.registerInlineCompletionsProvider('*', {
        provideInlineCompletions: async (model: any, position: any, _context: any, token: any) => {
          const currentSettings = settingsRef.current;
          if (!currentSettings.aiEnabled || !currentSettings.aiInlineCompletions) {
            return { items: [] };
          }
          if (!window.myForgeAPI?.aiGetCompletion) {
            return { items: [] };
          }

          const fullText = model.getValue();
          const offset = model.getOffsetAt(position);
          const prefix = fullText.slice(0, offset);
          const suffix = fullText.slice(offset);

          try {
            const res = await window.myForgeAPI.aiGetCompletion({
              prefix,
              suffix,
              languageId: model.getLanguageId(),
              filename: activeTabRef.current?.relativePath || 'unnamed',
              maxTokens: 48,
            });

            if (!res || !res.text || token.isCancellationRequested) {
              return { items: [] };
            }

            return {
              items: [
                {
                  insertText: res.text,
                  range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                },
              ],
            };
          } catch {
            return { items: [] };
          }
        },
        freeInlineCompletions: () => {},
      });
    }
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
            style={{ marginLeft: 'auto', paddingRight: '10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <button
              className={`forge-icon-btn ${isSplitView ? 'active' : ''}`}
              title="Split Editor Side-by-Side"
              onClick={() => setIsSplitView((s) => !s)}
              style={{ fontSize: '11px', padding: '2px 6px' }}
            >
              ◫ Split
            </button>
            <button
              className="forge-icon-btn"
              title="Close All Tabs"
              onClick={onCloseAll}
              style={{ fontSize: '10px', padding: '2px 6px' }}
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
          isMarkdown={activeTab.languageId === 'markdown' || activeTab.relativePath.endsWith('.md')}
          isPreviewMarkdown={activeTab.isPreviewMarkdown}
          onToggleMarkdownPreview={() => onToggleMarkdownPreview && onToggleMarkdownPreview(activeTab.id)}
        />
      )}

      {/* Editor surface */}
      <div className="forge-editor-surface" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activeTab ? (
          activeTab.isImage ? (
            /* Image Preview */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', background: 'var(--forge-bg-editor)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: '1px solid var(--forge-border)', fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                <span>Image Preview: {activeTab.title}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="forge-icon-btn" onClick={() => setImageZoom((z) => Math.max(25, z - 25))}>-</button>
                  <span>{imageZoom}%</span>
                  <button className="forge-icon-btn" onClick={() => setImageZoom((z) => Math.min(400, z + 25))}>+</button>
                  <button className="forge-icon-btn" onClick={() => setImageZoom(100)}>100%</button>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px', backgroundImage: 'radial-gradient(var(--forge-border) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                <img
                  src={activeTab.imageUrl || `file://${workspaceRoot}/${activeTab.relativePath}`}
                  alt={activeTab.title}
                  style={{
                    transform: `scale(${imageZoom / 100})`,
                    maxWidth: '90%',
                    maxHeight: '90%',
                    objectFit: 'contain',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ) : activeTab.isBinary ? (
            /* Binary Safe Card */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%', gap: 14, color: 'var(--forge-text-muted)', padding: '20px' }}>
              <div style={{ fontSize: '36px' }}>📦</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--forge-text-primary)' }}>
                {activeTab.title}
              </div>
              <div style={{ fontSize: '12px', maxWidth: '420px', textAlign: 'center', lineHeight: 1.5 }}>
                This file is binary or uses an unsupported encoding and cannot be rendered in the text editor.
              </div>
              <button
                onClick={() => window.myForgeAPI?.showInFolder(activeTab.relativePath)}
                style={{
                  padding: '6px 14px',
                  background: 'var(--forge-accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                Reveal in System File Manager
              </button>
            </div>
          ) : activeTab.isPreviewMarkdown ? (
            /* Markdown Preview Mode */
            <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '24px 32px', background: 'var(--forge-bg-editor)', color: 'var(--forge-text-primary)' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
                {activeTab.content.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={idx} style={{ fontSize: '24px', fontWeight: 700, margin: '16px 0 8px', borderBottom: '1px solid var(--forge-border)', paddingBottom: 6 }}>{line.slice(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={idx} style={{ fontSize: '18px', fontWeight: 600, margin: '14px 0 6px' }}>{line.slice(3)}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} style={{ fontSize: '15px', fontWeight: 600, margin: '10px 0 4px' }}>{line.slice(4)}</h3>;
                  }
                  if (line.startsWith('> ')) {
                    return <blockquote key={idx} style={{ borderLeft: '3px solid var(--forge-accent)', paddingLeft: '12px', color: 'var(--forge-text-muted)', margin: '8px 0' }}>{line.slice(2)}</blockquote>;
                  }
                  if (line.startsWith('```')) {
                    return <div key={idx} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--forge-text-muted)', margin: '4px 0' }}>{line}</div>;
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <li key={idx} style={{ marginLeft: '20px', lineHeight: '1.6' }}>{line.slice(2)}</li>;
                  }
                  if (line.trim() === '') {
                    return <div key={idx} style={{ height: '8px' }} />;
                  }
                  return <p key={idx} style={{ margin: '4px 0', lineHeight: '1.6' }}>{line}</p>;
                })}
              </div>
            </div>
          ) : activeTab.isDiff ? (
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
            <div style={{ display: 'flex', flex: 1, height: '100%', width: '100%' }}>
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
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
                    lineNumbers: settings.lineNumbers === 'off' ? 'off' : 'on',
                    renderLineHighlight: 'all',
                    tabSize: settings.tabSize,
                    wordWrap: settings.wordWrap ? 'on' : 'off',
                    smoothScrolling: settings.smoothScrolling,
                    cursorBlinking: settings.cursorBlinking || 'smooth',
                    inlineSuggest: { enabled: settings.aiInlineCompletions !== false },
                    quickSuggestions: { other: true, comments: false, strings: false },
                  }}
                />
              </div>
              {isSplitView && tabs.length > 1 && (
                <div style={{ flex: 1, height: '100%', borderLeft: '1px solid var(--forge-border)', position: 'relative' }}>
                  {(() => {
                    const secondaryTab = tabs.find((t) => t.id !== activeTab.id) || tabs[0];
                    return (
                      <Editor
                        height="100%"
                        language={secondaryTab.languageId || 'plaintext'}
                        value={secondaryTab.content}
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
                          readOnly: true,
                          minimap: { enabled: false },
                          lineNumbers: 'on',
                          wordWrap: 'on',
                        }}
                      />
                    );
                  })()}
                </div>
              )}
            </div>
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
