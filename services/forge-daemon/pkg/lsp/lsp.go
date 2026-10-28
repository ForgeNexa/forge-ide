package lsp

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// DocumentSymbol represents an extracted symbol in a source file.
type DocumentSymbol struct {
	Name           string `json:"name"`
	Kind           string `json:"kind"` // 'function' | 'class' | 'interface' | 'variable' | 'constant' | 'struct'
	Line           int    `json:"line"`
	Column         int    `json:"column"`
	Detail         string `json:"detail,omitempty"`
	ContainerName  string `json:"containerName,omitempty"`
}

// DefinitionLocation represents the target file and line of a definition.
type DefinitionLocation struct {
	File     string `json:"file"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	LineText string `json:"lineText"`
}

// HoverInfo holds signature and documentation for hover presentation.
type HoverInfo struct {
	Symbol    string `json:"symbol"`
	Signature string `json:"signature"`
	Doc       string `json:"doc,omitempty"`
	Language  string `json:"language"`
}

// DiagnosticItem represents a compiler warning or syntax error.
type DiagnosticItem struct {
	File     string `json:"file"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Message  string `json:"message"`
	Severity string `json:"severity"` // 'error' | 'warning' | 'info'
	Source   string `json:"source"`
}

// Manager orchestrates language intelligence, symbol extraction, and diagnostics.
type Manager struct {
	workerPool chan struct{}
}

// NewManager creates a new LSP manager with a bounded worker pool.
func NewManager(maxConcurrency int) *Manager {
	if maxConcurrency <= 0 {
		maxConcurrency = 4
	}
	return &Manager{
		workerPool: make(chan struct{}, maxConcurrency),
	}
}

// GetDocumentSymbols extracts structural symbols from source code.
func (m *Manager) GetDocumentSymbols(filePath string, content string) ([]DocumentSymbol, error) {
	ext := strings.ToLower(filepath.Ext(filePath))
	var symbols []DocumentSymbol

	lines := strings.Split(content, "\n")

	// Regex patterns per language family
	var fnRegex, classRegex, ifaceRegex *regexp.Regexp

	switch ext {
	case ".go":
		fnRegex = regexp.MustCompile(`^func\s+(?:\([^)]+\)\s+)?([A-Za-z0-9_]+)\s*\(`)
		classRegex = regexp.MustCompile(`^type\s+([A-Za-z0-9_]+)\s+struct\b`)
		ifaceRegex = regexp.MustCompile(`^type\s+([A-Za-z0-9_]+)\s+interface\b`)
	case ".ts", ".tsx", ".js", ".jsx":
		fnRegex = regexp.MustCompile(`(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(|(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>`)
		classRegex = regexp.MustCompile(`(?:export\s+)?class\s+([A-Za-z0-9_]+)`)
		ifaceRegex = regexp.MustCompile(`(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)`)
	case ".py":
		fnRegex = regexp.MustCompile(`^\s*def\s+([A-Za-z0-9_]+)\s*\(`)
		classRegex = regexp.MustCompile(`^\s*class\s+([A-Za-z0-9_]+)`)
	case ".rs":
		fnRegex = regexp.MustCompile(`(?:pub\s+)?fn\s+([A-Za-z0-9_]+)\s*\(`)
		classRegex = regexp.MustCompile(`(?:pub\s+)?struct\s+([A-Za-z0-9_]+)`)
		ifaceRegex = regexp.MustCompile(`(?:pub\s+)?trait\s+([A-Za-z0-9_]+)`)
	default:
		fnRegex = regexp.MustCompile(`(?:function|def|func|fn)\s+([A-Za-z0-9_]+)`)
	}

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		lineNum := i + 1

		if fnRegex != nil {
			if match := fnRegex.FindStringSubmatch(trimmed); len(match) > 1 {
				name := match[1]
				if name == "" && len(match) > 2 {
					name = match[2]
				}
				if name != "" {
					symbols = append(symbols, DocumentSymbol{
						Name:   name,
						Kind:   "function",
						Line:   lineNum,
						Column: strings.Index(line, name) + 1,
						Detail: trimmed,
					})
					continue
				}
			}
		}

		if classRegex != nil {
			if match := classRegex.FindStringSubmatch(trimmed); len(match) > 1 && match[1] != "" {
				symbols = append(symbols, DocumentSymbol{
					Name:   match[1],
					Kind:   "class",
					Line:   lineNum,
					Column: strings.Index(line, match[1]) + 1,
					Detail: trimmed,
				})
				continue
			}
		}

		if ifaceRegex != nil {
			if match := ifaceRegex.FindStringSubmatch(trimmed); len(match) > 1 && match[1] != "" {
				symbols = append(symbols, DocumentSymbol{
					Name:   match[1],
					Kind:   "interface",
					Line:   lineNum,
					Column: strings.Index(line, match[1]) + 1,
					Detail: trimmed,
				})
			}
		}
	}

	if symbols == nil {
		symbols = []DocumentSymbol{}
	}
	return symbols, nil
}

// FindDefinition searches for symbol definition in the workspace.
func (m *Manager) FindDefinition(workspaceRoot string, relFile string, symbol string) (*DefinitionLocation, error) {
	if symbol == "" || workspaceRoot == "" {
		return nil, nil
	}

	// 1. Search in current file first
	currAbs := filepath.Join(workspaceRoot, relFile)
	if data, err := os.ReadFile(currAbs); err == nil {
		symbols, _ := m.GetDocumentSymbols(currAbs, string(data))
		for _, s := range symbols {
			if s.Name == symbol {
				lines := strings.Split(string(data), "\n")
				lineText := ""
				if s.Line-1 < len(lines) {
					lineText = lines[s.Line-1]
				}
				return &DefinitionLocation{
					File:     filepath.ToSlash(relFile),
					Line:     s.Line,
					Column:   s.Column,
					LineText: lineText,
				}, nil
			}
		}
	}

	// 2. Bounded scan of workspace files
	var targetLoc *DefinitionLocation
	var mu sync.Mutex

	_ = filepath.WalkDir(workspaceRoot, func(p string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			name := d.Name()
			if d.IsDir() && (name == ".git" || name == "node_modules" || name == "dist" || name == "build") {
				return filepath.SkipDir
			}
			return nil
		}

		mu.Lock()
		if targetLoc != nil {
			mu.Unlock()
			return filepath.SkipAll
		}
		mu.Unlock()

		ext := strings.ToLower(filepath.Ext(p))
		if ext != ".go" && ext != ".ts" && ext != ".tsx" && ext != ".js" && ext != ".py" && ext != ".rs" {
			return nil
		}

		data, err := os.ReadFile(p)
		if err != nil {
			return nil
		}

		symbols, _ := m.GetDocumentSymbols(p, string(data))
		for _, s := range symbols {
			if s.Name == symbol {
				rel, _ := filepath.Rel(workspaceRoot, p)
				lines := strings.Split(string(data), "\n")
				lineText := ""
				if s.Line-1 < len(lines) {
					lineText = lines[s.Line-1]
				}
				mu.Lock()
				targetLoc = &DefinitionLocation{
					File:     filepath.ToSlash(rel),
					Line:     s.Line,
					Column:   s.Column,
					LineText: lineText,
				}
				mu.Unlock()
				return filepath.SkipAll
			}
		}
		return nil
	})

	return targetLoc, nil
}

// GetHover provides signature and doc comment info for a symbol.
func (m *Manager) GetHover(filePath string, symbol string, content string) (*HoverInfo, error) {
	lines := strings.Split(content, "\n")
	ext := strings.ToLower(filepath.Ext(filePath))

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Skip pure comment lines when searching for the symbol definition
		if strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "/*") || strings.HasPrefix(trimmed, "*") || strings.HasPrefix(trimmed, "#") {
			continue
		}

		if strings.Contains(line, symbol) {
			doc := ""
			// Look for doc comments immediately preceding line
			if i > 0 {
				var commentLines []string
				for j := i - 1; j >= 0; j-- {
					prev := strings.TrimSpace(lines[j])
					if strings.HasPrefix(prev, "//") || strings.HasPrefix(prev, "#") || strings.HasPrefix(prev, "*") {
						commentLines = append([]string{prev}, commentLines...)
					} else {
						break
					}
				}
				doc = strings.Join(commentLines, "\n")
			}

			return &HoverInfo{
				Symbol:    symbol,
				Signature: trimmed,
				Doc:       doc,
				Language:  ext,
			}, nil
		}
	}
	return nil, nil
}

// GetDiagnostics runs background compiler diagnostics with bounded concurrency.
func (m *Manager) GetDiagnostics(workspaceRoot string, filePath string) ([]DiagnosticItem, error) {
	m.workerPool <- struct{}{}
	defer func() { <-m.workerPool }()

	var diags []DiagnosticItem

	// Check Go diagnostics if applicable
	if filepath.Ext(filePath) == ".go" || filePath == "" {
		ctx, cancel := context.WithTimeout(context.Background(), 6*time.Second)
		defer cancel()

		cmd := exec.CommandContext(ctx, "go", "vet", "./...")
		cmd.Dir = workspaceRoot
		out, err := cmd.CombinedOutput()
		if err != nil && len(out) > 0 {
			lines := strings.Split(string(out), "\n")
			for _, line := range lines {
				// Format: ./path/to/file.go:line:col: message
				parts := strings.SplitN(line, ":", 4)
				if len(parts) >= 4 {
					var lineNum int
					_, _ = fmt.Sscanf(parts[1], "%d", &lineNum)
					if lineNum <= 0 {
						lineNum = 1
					}
					diags = append(diags, DiagnosticItem{
						File:     filepath.ToSlash(strings.TrimPrefix(parts[0], "./")),
						Line:     lineNum,
						Message:  strings.TrimSpace(parts[3]),
						Severity: "warning",
						Source:   "go vet",
					})
				}
			}
		}
	}

	if diags == nil {
		diags = []DiagnosticItem{}
	}
	return diags, nil
}
