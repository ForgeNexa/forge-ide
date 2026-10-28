package workspace

import (
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

func TestWorkspaceWatcher(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "watcher-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	indexer := NewIndexer()
	if err := indexer.SetWorkspaceRoot(tempDir); err != nil {
		t.Fatalf("failed to set root: %v", err)
	}
	if _, err := indexer.Index(); err != nil {
		t.Fatalf("failed to index: %v", err)
	}

	var eventsMu sync.Mutex
	var events []FileChangeEvent

	watcher, err := NewWorkspaceWatcher(tempDir, indexer, nil, func(ev FileChangeEvent) {
		eventsMu.Lock()
		events = append(events, ev)
		eventsMu.Unlock()
	})
	if err != nil {
		t.Fatalf("failed to create watcher: %v", err)
	}
	defer watcher.Close()

	// Give the watcher a moment to initialize the event loop
	time.Sleep(50 * time.Millisecond)

	// 1. Create a file
	filePath := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(filePath, []byte("hello world"), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	// Wait for event dispatch
	time.Sleep(150 * time.Millisecond)

	eventsMu.Lock()
	foundCreate := false
	for _, ev := range events {
		if ev.RelativePath == "test.txt" && (ev.Type == ChangeCreated || ev.Type == ChangeModified) {
			foundCreate = true
			break
		}
	}
	eventsMu.Unlock()

	if !foundCreate {
		t.Errorf("expected create/modify event for test.txt, got events: %v", events)
	}

	// 2. Modify the file
	if err := os.WriteFile(filePath, []byte("hello updated world"), 0644); err != nil {
		t.Fatalf("failed to overwrite test file: %v", err)
	}

	time.Sleep(150 * time.Millisecond)

	eventsMu.Lock()
	foundModify := false
	for _, ev := range events {
		if ev.RelativePath == "test.txt" && ev.Type == ChangeModified {
			foundModify = true
			break
		}
	}
	eventsMu.Unlock()

	if !foundModify {
		t.Errorf("expected modify event for test.txt, got events: %v", events)
	}

	// 3. Delete the file
	if err := os.Remove(filePath); err != nil {
		t.Fatalf("failed to remove test file: %v", err)
	}

	time.Sleep(150 * time.Millisecond)

	eventsMu.Lock()
	foundDelete := false
	for _, ev := range events {
		if ev.RelativePath == "test.txt" && ev.Type == ChangeDeleted {
			foundDelete = true
			break
		}
	}
	eventsMu.Unlock()

	if !foundDelete {
		t.Errorf("expected delete event for test.txt, got events: %v", events)
	}

	// 4. Verify ignored files do not trigger events
	gitDir := filepath.Join(tempDir, ".git")
	_ = os.MkdirAll(gitDir, 0755)
	_ = os.WriteFile(filepath.Join(gitDir, "HEAD"), []byte("ref: refs/heads/main"), 0644)

	time.Sleep(100 * time.Millisecond)

	eventsMu.Lock()
	for _, ev := range events {
		if ev.RelativePath == ".git" || filepath.Dir(ev.RelativePath) == ".git" {
			t.Errorf("expected .git to be ignored, but got event: %v", ev)
		}
	}
	eventsMu.Unlock()
}
