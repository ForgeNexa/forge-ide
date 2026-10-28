import * as path from 'node:path';
import * as fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { DiagnosticMarker, LanguageServerInfo, DocumentSymbol, DefinitionResult, HoverResult } from '@my-forge/shared-protocol';
import { detectInstalledLanguageServers } from './lspRegistry';

const execAsync = promisify(exec);

export class LspManager {
  private cachedRegistry: LanguageServerInfo[] | null = null;

  constructor() {}

  /**
   * Returns list of supported language servers and their availability.
   */
  public async getRegistry(): Promise<LanguageServerInfo[]> {
    this.cachedRegistry = detectInstalledLanguageServers();
    return this.cachedRegistry;
  }

  /**
   * Performs quick diagnostic check on the current workspace or target file.
   */
  public async getDiagnostics(
    workspaceRoot: string,
    targetFile?: string
  ): Promise<DiagnosticMarker[]> {
    if (!workspaceRoot || !fs.existsSync(workspaceRoot)) {
      return [];
    }

    const markers: DiagnosticMarker[] = [];

    // Check Go diagnostics if go.mod exists or target is a Go file
    const isGoWorkspace = fs.existsSync(path.join(workspaceRoot, 'go.mod'));
    const isGoFile = targetFile?.endsWith('.go');

    if (isGoWorkspace || isGoFile) {
      try {
        await execAsync('go vet ./...', { cwd: workspaceRoot, timeout: 3000 });
      } catch (err: any) {
        if (err.stderr || err.stdout) {
          const output = (err.stderr || err.stdout).toString();
          const lines = output.split('\n');
          for (const line of lines) {
            // format: file.go:line:col: message or file.go:line: message
            const match = line.match(/^([^:]+):(\d+)(?::(\d+))?:\s+(.*)$/);
            if (match) {
              const relFile = match[1].trim();
              const lineNum = parseInt(match[2], 10);
              const colNum = match[3] ? parseInt(match[3], 10) : 1;
              const msg = match[4].trim();

              markers.push({
                id: `go-${relFile}-${lineNum}-${colNum}`,
                file: relFile,
                line: lineNum,
                col: colNum,
                severity: 'error',
                message: msg,
                source: 'go vet',
              });
            }
          }
        }
      }
    }

    // Check Python file syntax if target is a Python file
    if (targetFile?.endsWith('.py')) {
      const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(workspaceRoot, targetFile);
      if (fs.existsSync(fullPath)) {
        try {
          await execAsync(`python3 -m py_compile "${fullPath}"`, { timeout: 2000 });
        } catch (err: any) {
          const output = (err.stderr || err.stdout || '').toString();
          const match = output.match(/File "(.*?)", line (\d+)(?:, in .*)?\n(?:\s+.*\n)?(?:\s+\^\n)?(\w+Error: .*)/);
          if (match) {
            markers.push({
              id: `py-${targetFile}-${match[2]}`,
              file: targetFile,
              line: parseInt(match[2], 10),
              col: 1,
              severity: 'error',
              message: match[3],
              source: 'py_compile',
            });
          }
        }
      }
    }

    // Check TypeScript / JavaScript syntax / diagnostics if package.json has tsconfig.json
    const tsconfigPath = path.join(workspaceRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath) && (!targetFile || targetFile.match(/\.(ts|tsx)$/))) {
      try {
        await execAsync('npx --no-install tsc --noEmit --pretty false', {
          cwd: workspaceRoot,
          timeout: 4000,
        });
      } catch (err: any) {
        if (err.stdout) {
          const output = err.stdout.toString();
          const lines = output.split('\n');
          for (const line of lines) {
            // format: src/file.ts(line,col): error TS2304: Cannot find name 'x'.
            const match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.*)$/);
            if (match) {
              markers.push({
                id: `ts-${match[1]}-${match[2]}-${match[3]}`,
                file: match[1].trim(),
                line: parseInt(match[2], 10),
                col: parseInt(match[3], 10),
                severity: match[4] === 'error' ? 'error' : 'warning',
                message: match[5].trim(),
                source: 'typescript',
              });
            }
          }
        }
      }
    }

    return markers;
  }

  /**
   * Extracts document outline symbols (functions, classes, interfaces, methods)
   * for Go, TypeScript, JavaScript, Python, and Rust.
   */
  public async getDocumentSymbols(
    filePath: string,
    fileContent?: string
  ): Promise<DocumentSymbol[]> {
    let content = fileContent;
    if (content === undefined && fs.existsSync(filePath)) {
      try {
        content = fs.readFileSync(filePath, 'utf8');
      } catch {
        return [];
      }
    }

    if (!content) return [];

    const symbols: DocumentSymbol[] = [];
    const lines = content.split('\n');
    const ext = path.extname(filePath).toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 1. Go Symbol Extraction
      if (ext === '.go') {
        // Functions and methods
        const funcMatch = line.match(/^func\s+(?:\((?:[^)]+)\)\s+)?([A-Za-z0-9_]+)\s*\(/);
        if (funcMatch) {
          const isMethod = line.includes('(') && line.indexOf('(') < line.indexOf(funcMatch[1]);
          symbols.push({
            name: funcMatch[1],
            kind: isMethod ? 'method' : 'function',
            line: lineNum,
            col: line.indexOf(funcMatch[1]) + 1,
          });
          continue;
        }

        // Types, Structs, Interfaces
        const typeMatch = line.match(/^type\s+([A-Za-z0-9_]+)\s+(struct|interface|[A-Za-z0-9_]+)/);
        if (typeMatch) {
          const kind = typeMatch[2] === 'struct' ? 'class' : typeMatch[2] === 'interface' ? 'interface' : 'type';
          symbols.push({
            name: typeMatch[1],
            kind,
            line: lineNum,
            col: line.indexOf(typeMatch[1]) + 1,
          });
          continue;
        }
      }

      // 2. TypeScript / JavaScript Symbol Extraction
      if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
        // Classes
        const classMatch = line.match(/(?:export\s+)?class\s+([A-Za-z0-9_]+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[1],
            kind: 'class',
            line: lineNum,
            col: line.indexOf(classMatch[1]) + 1,
          });
          continue;
        }

        // Interfaces & Types
        const ifaceMatch = line.match(/(?:export\s+)?interface\s+([A-Za-z0-9_]+)/);
        if (ifaceMatch) {
          symbols.push({
            name: ifaceMatch[1],
            kind: 'interface',
            line: lineNum,
            col: line.indexOf(ifaceMatch[1]) + 1,
          });
          continue;
        }

        const typeAliasMatch = line.match(/(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=/);
        if (typeAliasMatch) {
          symbols.push({
            name: typeAliasMatch[1],
            kind: 'type',
            line: lineNum,
            col: line.indexOf(typeAliasMatch[1]) + 1,
          });
          continue;
        }

        // Functions
        const fnMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/);
        if (fnMatch) {
          symbols.push({
            name: fnMatch[1],
            kind: 'function',
            line: lineNum,
            col: line.indexOf(fnMatch[1]) + 1,
          });
          continue;
        }

        // Arrow function constants
        const arrowMatch = line.match(/(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
        if (arrowMatch) {
          symbols.push({
            name: arrowMatch[1],
            kind: 'function',
            line: lineNum,
            col: line.indexOf(arrowMatch[1]) + 1,
          });
          continue;
        }
      }

      // 3. Python Symbol Extraction
      if (ext === '.py') {
        const pyClass = line.match(/^\s*class\s+([A-Za-z0-9_]+)/);
        if (pyClass) {
          symbols.push({
            name: pyClass[1],
            kind: 'class',
            line: lineNum,
            col: line.indexOf(pyClass[1]) + 1,
          });
          continue;
        }

        const pyDef = line.match(/^\s*def\s+([A-Za-z0-9_]+)\s*\(/);
        if (pyDef) {
          const isMethod = line.startsWith('    ') || line.startsWith('\t');
          symbols.push({
            name: pyDef[1],
            kind: isMethod ? 'method' : 'function',
            line: lineNum,
            col: line.indexOf(pyDef[1]) + 1,
          });
          continue;
        }
      }

      // 4. Rust Symbol Extraction
      if (ext === '.rs') {
        const rustFn = line.match(/(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)\s*\(/);
        if (rustFn) {
          symbols.push({
            name: rustFn[1],
            kind: 'function',
            line: lineNum,
            col: line.indexOf(rustFn[1]) + 1,
          });
          continue;
        }

        const rustStruct = line.match(/(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/);
        if (rustStruct) {
          symbols.push({
            name: rustStruct[1],
            kind: 'class',
            line: lineNum,
            col: line.indexOf(rustStruct[1]) + 1,
          });
          continue;
        }
      }
    }

    return symbols;
  }

  /**
   * Finds symbol definition in the given workspace file or across workspace files.
   */
  public async findDefinition(
    workspaceRoot: string,
    filePath: string,
    symbol: string
  ): Promise<DefinitionResult | null> {
    if (!symbol || symbol.trim().length === 0) return null;

    // Check in target file first
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspaceRoot, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      const defRegexes = [
        new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${symbol}\\b`),
        new RegExp(`(?:export\\s+)?class\\s+${symbol}\\b`),
        new RegExp(`(?:export\\s+)?interface\\s+${symbol}\\b`),
        new RegExp(`(?:export\\s+)?type\\s+${symbol}\\b`),
        new RegExp(`(?:const|let|var)\\s+${symbol}\\b`),
        new RegExp(`func\\s+(?:\\([^)]+\\)\\s+)?${symbol}\\b`),
        new RegExp(`type\\s+${symbol}\\b`),
        new RegExp(`def\\s+${symbol}\\b`),
        new RegExp(`fn\\s+${symbol}\\b`),
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const re of defRegexes) {
          if (re.test(line)) {
            return {
              file: filePath,
              line: i + 1,
              col: line.indexOf(symbol) + 1,
              matchedText: line.trim(),
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Retrieves hover documentation and signature information for a symbol.
   */
  public async getHover(
    filePath: string,
    symbol: string,
    fileContent?: string
  ): Promise<HoverResult | null> {
    if (!symbol) return null;

    let content = fileContent;
    if (content === undefined && fs.existsSync(filePath)) {
      try {
        content = fs.readFileSync(filePath, 'utf8');
      } catch {
        return null;
      }
    }

    if (!content) return null;

    const ext = path.extname(filePath).replace('.', '') || 'plaintext';
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip pure comments when matching the declaration signature
      if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
        continue;
      }

      if (line.includes(symbol)) {
        // Collect preceding doc comment lines if any
        let doc = '';
        let j = i - 1;
        while (j >= 0 && (lines[j].trim().startsWith('//') || lines[j].trim().startsWith('*') || lines[j].trim().startsWith('/*'))) {
          doc = lines[j].replace(/^\s*(\/\/|\*|\/\*)\s*/, '') + '\n' + doc;
          j--;
        }

        return {
          symbol,
          signature: line.trim(),
          doc: doc.trim() || undefined,
          language: ext,
        };
      }
    }

    return null;
  }
}
