package workspace

import (
	"os"
	"path/filepath"
	"testing"
)

func TestIndexer_Lifecycle(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "my-forge-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create test directory structure
	srcDir := filepath.Join(tempDir, "src")
	gitDir := filepath.Join(tempDir, ".git")
	nodeModulesDir := filepath.Join(tempDir, "node_modules")

	if err := os.MkdirAll(srcDir, 0755); err != nil {
		t.Fatalf("failed to create src dir: %v", err)
	}
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("failed to create .git dir: %v", err)
	}
	if err := os.MkdirAll(nodeModulesDir, 0755); err != nil {
		t.Fatalf("failed to create node_modules dir: %v", err)
	}

	// Create files
	_ = os.WriteFile(filepath.Join(tempDir, "README.md"), []byte("# Test Project"), 0644)
	_ = os.WriteFile(filepath.Join(srcDir, "main.go"), []byte("package main\n\nfunc main() {}\n"), 0644)
	_ = os.WriteFile(filepath.Join(srcDir, "app.ts"), []byte("console.log('hello');"), 0644)
	_ = os.WriteFile(filepath.Join(gitDir, "config"), []byte("git config"), 0644)
	_ = os.WriteFile(filepath.Join(nodeModulesDir, "package.json"), []byte("{}"), 0644)

	indexer := NewIndexer()

	// 1. Initial state
	if _, err := indexer.Index(); err != ErrWorkspaceNotSet {
		t.Errorf("expected ErrWorkspaceNotSet, got %v", err)
	}

	// 2. Set root
	if err := indexer.SetWorkspaceRoot(tempDir); err != nil {
		t.Fatalf("failed to set workspace root: %v", err)
	}

	// 3. Index
	stats, err := indexer.Index()
	if err != nil {
		t.Fatalf("index failed: %v", err)
	}

	if stats.TotalFiles != 3 {
		t.Errorf("expected 3 files (ignoring .git and node_modules), got %d", stats.TotalFiles)
	}

	// 4. Search files
	results := indexer.SearchFiles("main", 10)
	if len(results) != 1 || results[0].Name != "main.go" {
		t.Errorf("expected 1 match for 'main', got %v", results)
	}

	// 5. Read file
	content, err := indexer.ReadFile("src/main.go")
	if err != nil {
		t.Fatalf("failed to read src/main.go: %v", err)
	}
	if content != "package main\n\nfunc main() {}\n" {
		t.Errorf("unexpected content: %s", content)
	}

	// 6. Security: Path traversal rejection
	_, err = indexer.ReadFile("../../etc/passwd")
	if err != ErrPathTraversalDenied {
		t.Errorf("expected ErrPathTraversalDenied, got %v", err)
	}

	// 7. Write file
	err = indexer.WriteFile("src/test.txt", "hello world")
	if err != nil {
		t.Fatalf("failed to write file: %v", err)
	}

	readBack, err := indexer.ReadFile("src/test.txt")
	if err != nil || readBack != "hello world" {
		t.Errorf("readBack failed or content mismatch: %v, %s", err, readBack)
	}
}

func TestDetectLanguage(t *testing.T) {
	cases := []struct {
		filename string
		expected string
	}{
		{"main.go", "go"},
		{"index.ts", "typescript"},
		{"component.tsx", "typescript"},
		{"script.js", "javascript"},
		{"styles.css", "css"},
		{"doc.md", "markdown"},
		{"Dockerfile", "dockerfile"},
		{"config.json", "json"},
		{"unknown.xyz", "plaintext"},
	}

	for _, c := range cases {
		got := DetectLanguage(c.filename)
		if got != c.expected {
			t.Errorf("DetectLanguage(%q) = %q; want %q", c.filename, got, c.expected)
		}
	}
}
