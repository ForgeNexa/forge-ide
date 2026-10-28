import { useEffect, useRef, type FC } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalTabProps {
  cwd: string;
  theme: 'graphite-dark' | 'sand-light';
}

export const TerminalTab: FC<TerminalTabProps> = ({ cwd, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: 12,
      lineHeight: 1.2,
      theme:
        theme === 'sand-light'
          ? {
              background: '#ffffff',
              foreground: '#1f2328',
              cursor: '#0969da',
              selectionBackground: '#d0e2ff',
            }
          : {
              background: '#141518',
              foreground: '#e6edf3',
              cursor: '#388bfd',
              selectionBackground: '#264f78',
            },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    let cleanupDataListener: (() => void) | undefined;
    let cleanupExitListener: (() => void) | undefined;

    if (window.myForgeAPI) {
      // Real Electron PTY
      window.myForgeAPI
        .terminalCreate({ cwd, cols: term.cols, rows: term.rows })
        .then(({ id }) => {
          terminalIdRef.current = id;

          term.onData((data) => {
            if (terminalIdRef.current) {
              window.myForgeAPI!.terminalWrite(terminalIdRef.current, data);
            }
          });

          cleanupDataListener = window.myForgeAPI!.onTerminalData((id, data) => {
            if (id === terminalIdRef.current) {
              term.write(data);
            }
          });

          cleanupExitListener = window.myForgeAPI!.onTerminalExit((id, code) => {
            if (id === terminalIdRef.current) {
              term.write(`\r\n[Process completed with exit code ${code}]\r\n`);
            }
          });
        })
        .catch((err) => {
          term.write(`\r\n\x1b[31mFailed to spawn terminal: ${err.message}\x1b[0m\r\n`);
        });
    } else {
      // Browser preview interactive shell fallback
      term.writeln('\x1b[1;34mforge Web Preview Shell\x1b[0m');
      term.writeln('Running in browser sandbox. Type "help" for commands.\r\n');
      let prompt = '\x1b[32mforge:~/workspace$\x1b[0m ';
      term.write(prompt);

      let currentLine = '';
      term.onData((data) => {
        if (data === '\r') {
          term.write('\r\n');
          const cmd = currentLine.trim();
          if (cmd === 'help') {
            term.writeln('Available preview commands: pwd, ls, git status, go version, clear');
          } else if (cmd === 'pwd') {
            term.writeln(cwd || '/workspace/forge');
          } else if (cmd === 'ls') {
            term.writeln('apps  docs  go.mod  package.json  packages  README.md  services');
          } else if (cmd === 'git status') {
            term.writeln('On branch main\nnothing to commit, working tree clean');
          } else if (cmd === 'go version') {
            term.writeln('go version go1.26.4 darwin/arm64');
          } else if (cmd === 'clear') {
            term.clear();
          } else if (cmd) {
            term.writeln(`forge: command not found: ${cmd}`);
          }
          currentLine = '';
          term.write(prompt);
        } else if (data === '\u007F') {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (data >= ' ' && data <= '~') {
          currentLine += data;
          term.write(data);
        }
      });
    }

    const handleResize = () => {
      try {
        fitAddon.fit();
        if (terminalIdRef.current && window.myForgeAPI) {
          window.myForgeAPI.terminalResize(terminalIdRef.current, term.cols, term.rows);
        }
      } catch {
        // ignore resize error
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cleanupDataListener) cleanupDataListener();
      if (cleanupExitListener) cleanupExitListener();
      if (terminalIdRef.current && window.myForgeAPI) {
        window.myForgeAPI.terminalClose(terminalIdRef.current);
      }
      term.dispose();
    };
  }, [cwd, theme]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
};
