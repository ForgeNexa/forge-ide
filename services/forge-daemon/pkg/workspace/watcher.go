package workspace

import (
	"errors"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// FileChangeType denotes the nature of filesystem event.
type FileChangeType string

const (
	ChangeCreated  FileChangeType = "created"
	ChangeModified FileChangeType = "modified"
	ChangeDeleted  FileChangeType = "deleted"
)

// FileChangeEvent is the payload dispatched when a workspace file changes.
type FileChangeEvent struct {
	Type         FileChangeType `json:"type"`
	RelativePath string         `json:"path"`
	AbsolutePath string         `json:"fullPath"`
	IsDir        bool           `json:"isDir"`
}

// WatcherHandler is a callback invoked on filesystem events.
type WatcherHandler func(event FileChangeEvent)

// WorkspaceWatcher monitors workspace directories for file creation, modification, and deletion.
type WorkspaceWatcher struct {
	fsWatcher *fsnotify.Watcher
	root      string
	indexer   *Indexer
	handler   WatcherHandler
	logger    *log.Logger
	stopCh    chan struct{}
	mu        sync.Mutex
	closed    bool

	// Debouncing recent events to avoid flooding on editor saves
	eventMu      sync.Mutex
	recentEvents map[string]time.Time
}

// NewWorkspaceWatcher initializes and starts a recursive workspace watcher.
func NewWorkspaceWatcher(root string, indexer *Indexer, logger *log.Logger, handler WatcherHandler) (*WorkspaceWatcher, error) {
	if root == "" {
		return nil, errors.New("cannot watch empty root directory")
	}

	cleanedRoot := filepath.Clean(root)
	info, err := os.Stat(cleanedRoot)
	if err != nil || !info.IsDir() {
		return nil, errors.New("watcher root must be an existing directory")
	}

	fsw, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	w := &WorkspaceWatcher{
		fsWatcher:    fsw,
		root:         cleanedRoot,
		indexer:      indexer,
		handler:      handler,
		logger:       logger,
		stopCh:       make(chan struct{}),
		recentEvents: make(map[string]time.Time),
	}

	// Add root and subdirectories recursively
	if err := w.watchRecursively(cleanedRoot); err != nil {
		_ = fsw.Close()
		return nil, err
	}

	go w.eventLoop()
	return w, nil
}

// watchRecursively traverses the tree and adds unignored directories to fsnotify.
func (w *WorkspaceWatcher) watchRecursively(dir string) error {
	return filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // Skip unreadable directories gracefully
		}

		if !d.IsDir() {
			return nil
		}

		name := d.Name()
		if path != w.root {
			rel, _ := filepath.Rel(w.root, path)
			if IsDirectoryIgnored(name) || IsPathIgnored(rel) {
				return filepath.SkipDir
			}
		}

		if err := w.fsWatcher.Add(path); err != nil && w.logger != nil {
			w.logger.Printf("[watcher] error adding path %s: %v", path, err)
		}
		return nil
	})
}

// eventLoop listens for raw fsnotify events and processes them.
func (w *WorkspaceWatcher) eventLoop() {
	for {
		select {
		case <-w.stopCh:
			return

		case err, ok := <-w.fsWatcher.Errors:
			if !ok {
				return
			}
			if w.logger != nil {
				w.logger.Printf("[watcher] fsnotify error: %v", err)
			}

		case event, ok := <-w.fsWatcher.Events:
			if !ok {
				return
			}
			w.handleFSEvent(event)
		}
	}
}

// handleFSEvent processes an individual fsnotify event with debouncing and cache updates.
func (w *WorkspaceWatcher) handleFSEvent(event fsnotify.Event) {
	absPath := filepath.Clean(event.Name)

	relPath, err := filepath.Rel(w.root, absPath)
	if err != nil || relPath == "." || relPath == ".." || IsPathIgnored(relPath) {
		return
	}

	// Debounce rapid bursts for the same path and operation (30ms window)
	key := event.Op.String() + ":" + absPath
	w.eventMu.Lock()
	lastTime, exists := w.recentEvents[key]
	now := time.Now()
	if exists && now.Sub(lastTime) < 30*time.Millisecond {
		w.eventMu.Unlock()
		return
	}
	w.recentEvents[key] = now
	// Prune map periodically
	if len(w.recentEvents) > 500 {
		cutoff := now.Add(-1 * time.Minute)
		for k, t := range w.recentEvents {
			if t.Before(cutoff) {
				delete(w.recentEvents, k)
			}
		}
	}
	w.eventMu.Unlock()

	var changeType FileChangeType
	var isDir bool
	var size int64

	stat, statErr := os.Stat(absPath)
	if statErr == nil {
		isDir = stat.IsDir()
		size = stat.Size()
	}

	if event.Op.Has(fsnotify.Create) {
		changeType = ChangeCreated
		if isDir {
			// If a new directory was created, add it to watcher
			if !IsPathIgnored(relPath) {
				_ = w.fsWatcher.Add(absPath)
			}
		}
		if w.indexer != nil {
			w.indexer.UpdateCacheFile(relPath, absPath, isDir, size)
		}
	} else if event.Op.Has(fsnotify.Write) {
		changeType = ChangeModified
		if w.indexer != nil {
			w.indexer.UpdateCacheFile(relPath, absPath, isDir, size)
		}
	} else if event.Op.Has(fsnotify.Remove) || event.Op.Has(fsnotify.Rename) {
		changeType = ChangeDeleted
		if w.indexer != nil {
			w.indexer.DeleteCacheEntry(relPath)
		}
	} else {
		return
	}

	changeEvent := FileChangeEvent{
		Type:         changeType,
		RelativePath: relPath,
		AbsolutePath: absPath,
		IsDir:        isDir,
	}

	if w.handler != nil {
		w.handler(changeEvent)
	}
}

// Close gracefully terminates the watcher and releases OS handles.
func (w *WorkspaceWatcher) Close() error {
	w.mu.Lock()
	defer w.mu.Unlock()

	if w.closed {
		return nil
	}
	w.closed = true

	close(w.stopCh)
	return w.fsWatcher.Close()
}
