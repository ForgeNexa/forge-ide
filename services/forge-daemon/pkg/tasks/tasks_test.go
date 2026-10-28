package tasks

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestTasksManager_DetectAndRun(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "forge-task-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create package.json and go.mod
	pkgJSON := `{"name": "test-pkg", "scripts": {"build": "echo build-ok", "test": "echo test-ok"}}`
	_ = os.WriteFile(filepath.Join(tempDir, "package.json"), []byte(pkgJSON), 0644)
	_ = os.WriteFile(filepath.Join(tempDir, "go.mod"), []byte("module test.pkg\n\ngo 1.23\n"), 0644)

	mgr := NewManager(2)

	// 1. Detect tasks
	detected, err := mgr.DetectTasks(tempDir)
	if err != nil {
		t.Fatalf("failed to detect tasks: %v", err)
	}
	if len(detected) < 4 {
		t.Errorf("expected at least 4 tasks, got %d", len(detected))
	}

	// 2. Run a task
	var outputMu sync.Mutex
	var outputBuf strings.Builder
	doneCh := make(chan int, 1)

	task := ProjectTask{
		ID:      "test-echo",
		Name:    "echo test",
		Command: "echo 'task-runner-success'",
		Source:  "npm",
	}

	taskId, err := mgr.RunTask(tempDir, task, func(id string, chunk string) {
		outputMu.Lock()
		outputBuf.WriteString(chunk)
		outputMu.Unlock()
	}, func(id string, code int) {
		doneCh <- code
	})
	if err != nil {
		t.Fatalf("failed to run task: %v", err)
	}
	if taskId == "" {
		t.Errorf("expected non-empty taskId")
	}

	select {
	case code := <-doneCh:
		if code != 0 {
			t.Errorf("expected exit code 0, got %d", code)
		}
	case <-time.After(5 * time.Second):
		t.Fatalf("task timed out")
	}

	outputMu.Lock()
	outStr := outputBuf.String()
	outputMu.Unlock()

	if !strings.Contains(outStr, "task-runner-success") {
		t.Errorf("expected output to contain 'task-runner-success', got: %s", outStr)
	}
}
