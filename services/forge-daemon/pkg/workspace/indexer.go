package workspace

import (
	"bufio"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

var (
	ErrWorkspaceNotSet     = errors.New("workspace root directory is not configured")
	ErrPathTraversalDenied = errors.New("access denied: path escapes workspace boundaries")
	ErrFileNotFound        = errors.New("file not found")
	ErrFileTooLarge        = errors.New("file exceeds max permitted size (10MB)")
	ErrDestinationExists   = errors.New("destination already exists")
)

const (
	MaxFileSize       = 10 * 1024 * 1024 // 10MB limit for in-memory editor loading
	MaxSearchFileSize = 2 * 1024 * 1024  // 2MB limit for text content search
)

// Default ignored directories & patterns
var defaultIgnoredDirs = map[string]bool{
	".git":            true,
	".hg":             true,
	".svn":            true,
	"node_modules":    true,
	".next":           true,
	".nuxt":           true,
	"dist":            true,
	"build":           true,
	"target":          true,
	".turbo":          true,
	"vendor":          true,
	".hutch":          true,
	".cottontail-tmp": true,
}

// IsDirectoryIgnored checks if a directory name matches ignored conventions.
func IsDirectoryIgnored(name string) bool {
	return defaultIgnoredDirs[name] || strings.HasPrefix(name, ".git")
}

// IsPathIgnored checks if any path component in relative or absolute path is in ignored directories.
func IsPathIgnored(p string) bool {
	cleaned := filepath.Clean(p)
	parts := strings.Split(cleaned, string(filepath.Separator))
	for _, part := range parts {
		if part == "" || part == "." {
			continue
		}
		if IsDirectoryIgnored(part) {
			return true
		}
	}
	return false
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
	TotalFiles    int       `json:"totalFiles"`
	TotalDirs     int       `json:"totalDirs"`
	DurationMs    int64     `json:"durationMs"`
	LastIndexedAt time.Time `json:"lastIndexedAt"`
	WorkspaceRoot string    `json:"workspaceRoot"`
}

// ContentSearchMatch represents a line match in a file.
type ContentSearchMatch struct {
	RelativePath string `json:"relativePath"`
	AbsolutePath string `json:"absolutePath"`
	Line         int    `json:"line"`
	Column       int    `json:"column"`
	LineText     string `json:"lineText"`
	MatchLength  int    `json:"matchLength"`
}

// ContentSearchResult represents the aggregate result of a workspace text search.
type ContentSearchResult struct {
	Query        string               `json:"query"`
	Matches      []ContentSearchMatch `json:"matches"`
	TotalMatches int                  `json:"totalMatches"`
	FileCount    int                  `json:"fileCount"`
	DurationMs   int64                `json:"durationMs"`
}

// Indexer manages workspace file scanning, search, and filesystem CRUD.
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

// SearchContent scans files line-by-line for the specified text pattern.
func (idx *Indexer) SearchContent(query string, caseSensitive bool, wholeWord bool, maxMatches int) ContentSearchResult {
	idx.mu.RLock()
	filesToScan := make([]FileEntry, len(idx.files))
	copy(filesToScan, idx.files)
	root := idx.workspaceRoot
	idx.mu.RUnlock()

	start := time.Now()
	res := ContentSearchResult{
		Query:   query,
		Matches: make([]ContentSearchMatch, 0),
	}

	if strings.TrimSpace(query) == "" || root == "" {
		return res
	}

	if maxMatches <= 0 {
		maxMatches = 250
	}

	var matchRegex *regexp.Regexp
	var needle string
	if wholeWord {
		pattern := `\b` + regexp.QuoteMeta(query) + `\b`
		if !caseSensitive {
			pattern = `(?i)` + pattern
		}
		var err error
		matchRegex, err = regexp.Compile(pattern)
		if err != nil {
			return res
		}
	} else if !caseSensitive {
		needle = strings.ToLower(query)
	} else {
		needle = query
	}

	matchedFilesMap := make(map[string]bool)

	for _, file := range filesToScan {
		if file.IsDir || file.Size > MaxSearchFileSize || file.Size == 0 {
			continue
		}

		f, err := os.Open(file.AbsolutePath)
		if err != nil {
			continue
		}

		scanner := bufio.NewScanner(f)
		lineNum := 1

		for scanner.Scan() {
			lineText := scanner.Text()

			if matchRegex != nil {
				locs := matchRegex.FindAllStringIndex(lineText, -1)
				for _, loc := range locs {
					res.Matches = append(res.Matches, ContentSearchMatch{
						RelativePath: file.RelativePath,
						AbsolutePath: file.AbsolutePath,
						Line:         lineNum,
						Column:       loc[0] + 1,
						LineText:     strings.TrimSpace(lineText),
						MatchLength:  loc[1] - loc[0],
					})
					matchedFilesMap[file.RelativePath] = true
					if len(res.Matches) >= maxMatches {
						break
					}
				}
			} else {
				targetLine := lineText
				if !caseSensitive {
					targetLine = strings.ToLower(lineText)
				}

				startCol := 0
				for {
					idxFound := strings.Index(targetLine[startCol:], needle)
					if idxFound == -1 {
						break
					}
					col := startCol + idxFound + 1
					res.Matches = append(res.Matches, ContentSearchMatch{
						RelativePath: file.RelativePath,
						AbsolutePath: file.AbsolutePath,
						Line:         lineNum,
						Column:       col,
						LineText:     strings.TrimSpace(lineText),
						MatchLength:  len(query),
					})
					matchedFilesMap[file.RelativePath] = true
					if len(res.Matches) >= maxMatches {
						break
					}
					startCol += idxFound + len(needle)
				}
			}

			if len(res.Matches) >= maxMatches {
				break
			}
			lineNum++
		}
		_ = f.Close()

		if len(res.Matches) >= maxMatches {
			break
		}
	}

	res.TotalMatches = len(res.Matches)
	res.FileCount = len(matchedFilesMap)
	res.DurationMs = time.Since(start).Milliseconds()
	return res
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

// resolveSafePath verifies that relOrAbsPath does not escape workspaceRoot.
func (idx *Indexer) resolveSafePath(relOrAbsPath string) (string, error) {
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

	return target, nil
}

// ReadFile safely reads file content within workspace boundaries.
func (idx *Indexer) ReadFile(relOrAbsPath string) (string, error) {
	target, err := idx.resolveSafePath(relOrAbsPath)
	if err != nil {
		return "", err
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
	target, err := idx.resolveSafePath(relOrAbsPath)
	if err != nil {
		return err
	}

	// Ensure parent dir exists
	parent := filepath.Dir(target)
	if err := os.MkdirAll(parent, 0755); err != nil {
		return err
	}

	if err := os.WriteFile(target, []byte(content), 0644); err != nil {
		return err
	}

	rel, _ := filepath.Rel(idx.GetWorkspaceRoot(), target)
	idx.updateCacheFile(rel, target, false, int64(len(content)))
	return nil
}

// CreateFile creates a new file at relPath with optional initial content.
func (idx *Indexer) CreateFile(relPath string, content string) error {
	target, err := idx.resolveSafePath(relPath)
	if err != nil {
		return err
	}

	if _, err := os.Stat(target); err == nil {
		return ErrDestinationExists
	}

	parent := filepath.Dir(target)
	if err := os.MkdirAll(parent, 0755); err != nil {
		return err
	}

	if err := os.WriteFile(target, []byte(content), 0644); err != nil {
		return err
	}

	rel, _ := filepath.Rel(idx.GetWorkspaceRoot(), target)
	idx.updateCacheFile(rel, target, false, int64(len(content)))
	return nil
}

// CreateFolder creates a new directory at relPath.
func (idx *Indexer) CreateFolder(relPath string) error {
	target, err := idx.resolveSafePath(relPath)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(target, 0755); err != nil {
		return err
	}

	rel, _ := filepath.Rel(idx.GetWorkspaceRoot(), target)
	idx.updateCacheFile(rel, target, true, 0)
	return nil
}

// RenameEntry renames or moves a file or folder inside the workspace.
func (idx *Indexer) RenameEntry(oldRelPath string, newRelPath string) error {
	oldTarget, err := idx.resolveSafePath(oldRelPath)
	if err != nil {
		return err
	}

	newTarget, err := idx.resolveSafePath(newRelPath)
	if err != nil {
		return err
	}

	if _, err := os.Stat(oldTarget); err != nil {
		return ErrFileNotFound
	}

	if _, err := os.Stat(newTarget); err == nil {
		return ErrDestinationExists
	}

	parent := filepath.Dir(newTarget)
	if err := os.MkdirAll(parent, 0755); err != nil {
		return err
	}

	if err := os.Rename(oldTarget, newTarget); err != nil {
		return err
	}

	idx.renameCacheEntry(oldRelPath, newRelPath, newTarget)
	return nil
}

// DeleteEntry deletes a file or directory tree inside the workspace.
func (idx *Indexer) DeleteEntry(relPath string) error {
	target, err := idx.resolveSafePath(relPath)
	if err != nil {
		return err
	}

	// Do not allow deleting the workspace root itself
	idx.mu.RLock()
	root := idx.workspaceRoot
	idx.mu.RUnlock()
	if target == root {
		return errors.New("cannot delete the workspace root directory")
	}

	if err := os.RemoveAll(target); err != nil {
		return err
	}

	idx.deleteCacheEntry(relPath)
	return nil
}

// UpdateCacheFile adds or updates an entry in the in-memory index cache.
func (idx *Indexer) UpdateCacheFile(rel string, abs string, isDir bool, size int64) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	cleanRel := filepath.Clean(rel)
	cleanAbs := filepath.Clean(abs)
	name := filepath.Base(cleanRel)

	lang := ""
	if !isDir {
		lang = DetectLanguage(name)
	}

	entry := FileEntry{
		RelativePath: cleanRel,
		AbsolutePath: cleanAbs,
		Name:         name,
		IsDir:        isDir,
		Size:         size,
		ModTime:      time.Now(),
		LanguageID:   lang,
	}

	for i, f := range idx.files {
		if f.RelativePath == cleanRel {
			idx.files[i] = entry
			return
		}
	}

	idx.files = append(idx.files, entry)
	if isDir {
		idx.stats.TotalDirs++
	} else {
		idx.stats.TotalFiles++
	}
}

func (idx *Indexer) updateCacheFile(rel string, abs string, isDir bool, size int64) {
	idx.UpdateCacheFile(rel, abs, isDir, size)
}

// DeleteCacheEntry removes an entry and its children from the in-memory index cache.
func (idx *Indexer) DeleteCacheEntry(rel string) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	cleanRel := filepath.Clean(rel)
	prefix := cleanRel + string(filepath.Separator)

	filtered := idx.files[:0]
	for _, f := range idx.files {
		if f.RelativePath == cleanRel || strings.HasPrefix(f.RelativePath, prefix) {
			if f.IsDir {
				idx.stats.TotalDirs--
			} else {
				idx.stats.TotalFiles--
			}
			continue
		}
		filtered = append(filtered, f)
	}
	idx.files = filtered
}

func (idx *Indexer) deleteCacheEntry(rel string) {
	idx.DeleteCacheEntry(rel)
}

// RenameCacheEntry updates paths for an entry and its children in the in-memory index cache.
func (idx *Indexer) RenameCacheEntry(oldRel string, newRel string, newAbs string) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	cleanOld := filepath.Clean(oldRel)
	cleanNew := filepath.Clean(newRel)
	oldPrefix := cleanOld + string(filepath.Separator)

	for i, f := range idx.files {
		if f.RelativePath == cleanOld {
			idx.files[i].RelativePath = cleanNew
			idx.files[i].AbsolutePath = filepath.Clean(newAbs)
			idx.files[i].Name = filepath.Base(cleanNew)
			if !idx.files[i].IsDir {
				idx.files[i].LanguageID = DetectLanguage(idx.files[i].Name)
			}
		} else if strings.HasPrefix(f.RelativePath, oldPrefix) {
			subRel := strings.TrimPrefix(f.RelativePath, oldPrefix)
			idx.files[i].RelativePath = filepath.Join(cleanNew, subRel)
			idx.files[i].AbsolutePath = filepath.Join(newAbs, subRel)
			idx.files[i].Name = filepath.Base(idx.files[i].RelativePath)
		}
	}
}

func (idx *Indexer) renameCacheEntry(oldRel string, newRel string, newAbs string) {
	idx.RenameCacheEntry(oldRel, newRel, newAbs)
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
