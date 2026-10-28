package workspace

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

var (
	ErrWorkspaceNotSet     = errors.New("workspace root directory is not configured")
	ErrPathTraversalDenied = errors.New("access denied: path escapes workspace boundaries")
	ErrFileNotFound        = errors.New("file not found")
	ErrFileTooLarge        = errors.New("file exceeds max permitted size (10MB)")
)

const MaxFileSize = 10 * 1024 * 1024 // 10MB limit for in-memory editor loading

// Default ignored directories & patterns
var defaultIgnoredDirs = map[string]bool{
	".git":         true,
	".hg":          true,
	".svn":         true,
	"node_modules": true,
	".next":        true,
	".nuxt":        true,
	"dist":         true,
	"build":        true,
	"target":       true,
	".turbo":       true,
	"vendor":       true,
}

// FileEntry represents a file or directory inside the workspace.
type FileEntry struct {
	RelativePath string    `json:"relativePath"`
	AbsolutePath string    `json:"absolutePath"`
	Name         string    `json:"name"`
	IsDir        bool      `json:"isDir"`
	Size         int64     `json:"size"`
	ModTime      time.Time `json:"modTime"`
	LanguageID   string    `json:"languageId,omitempty"`
}

// IndexStats holds statistics from the indexing run.
type IndexStats struct {
	TotalFiles      int           `json:"totalFiles"`
	TotalDirs       int           `json:"totalDirs"`
	DurationMs      int64         `json:"durationMs"`
	LastIndexedAt   time.Time     `json:"lastIndexedAt"`
	WorkspaceRoot   string        `json:"workspaceRoot"`
}

// Indexer manages workspace file scanning and search.
type Indexer struct {
	mu            sync.RWMutex
	workspaceRoot string
	files         []FileEntry
	stats         IndexStats
}

// NewIndexer creates a new workspace indexer.
func NewIndexer() *Indexer {
	return &Indexer{
		files: make([]FileEntry, 0, 1024),
	}
}

// SetWorkspaceRoot sets the workspace root folder and validates it.
func (idx *Indexer) SetWorkspaceRoot(root string) error {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	cleaned := filepath.Clean(root)
	info, err := os.Stat(cleaned)
	if err != nil {
		return fmt.Errorf("invalid workspace path: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("workspace path is not a directory: %s", cleaned)
	}

	idx.workspaceRoot = cleaned
	idx.files = idx.files[:0]
	idx.stats = IndexStats{
		WorkspaceRoot: cleaned,
	}
	return nil
}

// GetWorkspaceRoot returns the active workspace root.
func (idx *Indexer) GetWorkspaceRoot() string {
	idx.mu.RLock()
	defer idx.mu.RUnlock()
	return idx.workspaceRoot
}

// Index rescans the workspace directory.
func (idx *Indexer) Index() (IndexStats, error) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	if idx.workspaceRoot == "" {
		return IndexStats{}, ErrWorkspaceNotSet
	}

	start := time.Now()
	entries := make([]FileEntry, 0, 1024)
	totalFiles := 0
	totalDirs := 0

	err := filepath.WalkDir(idx.workspaceRoot, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			// Skip unreadable files/folders gracefully
			return nil
		}

		// Root itself
		if path == idx.workspaceRoot {
			return nil
		}

		name := d.Name()
		if d.IsDir() {
			if defaultIgnoredDirs[name] || strings.HasPrefix(name, ".git") {
				return filepath.SkipDir
			}
			totalDirs++
		} else {
			totalFiles++
		}

		rel, err := filepath.Rel(idx.workspaceRoot, path)
		if err != nil {
			rel = path
		}

		var size int64
		var modTime time.Time
		if info, err := d.Info(); err == nil {
			size = info.Size()
			modTime = info.ModTime()
		}

		lang := ""
		if !d.IsDir() {
			lang = DetectLanguage(name)
		}

		entries = append(entries, FileEntry{
			RelativePath: rel,
			AbsolutePath: path,
			Name:         name,
			IsDir:        d.IsDir(),
			Size:         size,
			ModTime:      modTime,
			LanguageID:   lang,
		})

		return nil
	})

	if err != nil {
		return IndexStats{}, err
	}

	duration := time.Since(start).Milliseconds()
	idx.files = entries
	idx.stats = IndexStats{
		TotalFiles:    totalFiles,
		TotalDirs:     totalDirs,
		DurationMs:    duration,
		LastIndexedAt: time.Now(),
		WorkspaceRoot: idx.workspaceRoot,
	}

	return idx.stats, nil
}

// SearchFiles returns matching files matching query (fuzzy / substring).
func (idx *Indexer) SearchFiles(query string, limit int) []FileEntry {
	idx.mu.RLock()
	defer idx.mu.RUnlock()

	if limit <= 0 {
		limit = 50
	}

	q := strings.ToLower(strings.TrimSpace(query))
	results := make([]FileEntry, 0, limit)

	for _, f := range idx.files {
		if f.IsDir {
			continue
		}
		if q == "" || strings.Contains(strings.ToLower(f.RelativePath), q) || strings.Contains(strings.ToLower(f.Name), q) {
			results = append(results, f)
			if len(results) >= limit {
				break
			}
		}
	}

	return results
}

// ListDirectory lists contents of a relative path inside the workspace.
func (idx *Indexer) ListDirectory(relPath string) ([]FileEntry, error) {
	idx.mu.RLock()
	root := idx.workspaceRoot
	idx.mu.RUnlock()

	if root == "" {
		return nil, ErrWorkspaceNotSet
	}

	target := filepath.Join(root, relPath)
	target = filepath.Clean(target)

	// Security check: ensure target is inside root
	if !strings.HasPrefix(target, root) {
		return nil, ErrPathTraversalDenied
	}

	dirEntries, err := os.ReadDir(target)
	if err != nil {
		return nil, err
	}

	results := make([]FileEntry, 0, len(dirEntries))
	for _, d := range dirEntries {
		name := d.Name()
		if defaultIgnoredDirs[name] {
			continue
		}
		full := filepath.Join(target, name)
		rel, _ := filepath.Rel(root, full)
		var size int64
		var modTime time.Time
		if info, err := d.Info(); err == nil {
			size = info.Size()
			modTime = info.ModTime()
		}

		lang := ""
		if !d.IsDir() {
			lang = DetectLanguage(name)
		}

		results = append(results, FileEntry{
			RelativePath: rel,
			AbsolutePath: full,
			Name:         name,
			IsDir:        d.IsDir(),
			Size:         size,
			ModTime:      modTime,
			LanguageID:   lang,
		})
	}

	return results, nil
}

// ReadFile safely reads file content within workspace boundaries.
func (idx *Indexer) ReadFile(relOrAbsPath string) (string, error) {
	idx.mu.RLock()
	root := idx.workspaceRoot
	idx.mu.RUnlock()

	if root == "" {
		return "", ErrWorkspaceNotSet
	}

	var target string
	if filepath.IsAbs(relOrAbsPath) {
		target = filepath.Clean(relOrAbsPath)
	} else {
		target = filepath.Clean(filepath.Join(root, relOrAbsPath))
	}

	if !strings.HasPrefix(target, root) {
		return "", ErrPathTraversalDenied
	}

	info, err := os.Stat(target)
	if err != nil {
		if os.IsNotExist(err) {
			return "", ErrFileNotFound
		}
		return "", err
	}
	if info.Size() > MaxFileSize {
		return "", ErrFileTooLarge
	}

	content, err := os.ReadFile(target)
	if err != nil {
		return "", err
	}

	return string(content), nil
}

// WriteFile safely writes file content within workspace boundaries.
func (idx *Indexer) WriteFile(relOrAbsPath string, content string) error {
	idx.mu.RLock()
	root := idx.workspaceRoot
	idx.mu.RUnlock()

	if root == "" {
		return ErrWorkspaceNotSet
	}

	var target string
	if filepath.IsAbs(relOrAbsPath) {
		target = filepath.Clean(relOrAbsPath)
	} else {
		target = filepath.Clean(filepath.Join(root, relOrAbsPath))
	}

	if !strings.HasPrefix(target, root) {
		return ErrPathTraversalDenied
	}

	// Ensure parent dir exists
	parent := filepath.Dir(target)
	if err := os.MkdirAll(parent, 0755); err != nil {
		return err
	}

	return os.WriteFile(target, []byte(content), 0644)
}

// DetectLanguage maps file extensions/names to Monaco language identifiers.
func DetectLanguage(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	base := strings.ToLower(filepath.Base(filename))

	// Match special filenames
	switch base {
	case "dockerfile":
		return "dockerfile"
	case "makefile":
		return "makefile"
	case "package.json", "tsconfig.json":
		return "json"
	}

	switch ext {
	case ".go":
		return "go"
	case ".ts":
		return "typescript"
	case ".tsx":
		return "typescript"
	case ".js", ".mjs", ".cjs":
		return "javascript"
	case ".jsx":
		return "javascript"
	case ".json":
		return "json"
	case ".html", ".htm":
		return "html"
	case ".css":
		return "css"
	case ".scss", ".sass":
		return "scss"
	case ".md", ".markdown":
		return "markdown"
	case ".py":
		return "python"
	case ".rs":
		return "rust"
	case ".c", ".h":
		return "c"
	case ".cpp", ".hpp", ".cc":
		return "cpp"
	case ".yaml", ".yml":
		return "yaml"
	case ".sh", ".bash", ".zsh":
		return "shell"
	case ".sql":
		return "sql"
	default:
		return "plaintext"
	}
}
