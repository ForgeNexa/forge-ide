package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestGitManager_Flow(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "forge-git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	mgr := NewManager()

	// 1. Initial state (not a repo)
	status, err := mgr.GetStatus(tempDir)
	if err != nil {
		t.Fatalf("unexpected error on non-repo: %v", err)
	}
	if status.IsRepo {
		t.Errorf("expected isRepo=false, got true")
	}

	// 2. Initialize repo
	cmd := exec.Command("git", "init", "-b", "main")
	cmd.Dir = tempDir
	if err := cmd.Run(); err != nil {
		t.Fatalf("git init failed: %v", err)
	}

	cmdName := exec.Command("git", "config", "user.name", "test-user")
	cmdName.Dir = tempDir
	_ = cmdName.Run()

	cmdEmail := exec.Command("git", "config", "user.email", "test@test.local")
	cmdEmail.Dir = tempDir
	_ = cmdEmail.Run()

	// 3. Create a file
	testFile := filepath.Join(tempDir, "sample.txt")
	if err := os.WriteFile(testFile, []byte("hello git"), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	status, err = mgr.GetStatus(tempDir)
	if err != nil {
		t.Fatalf("status failed: %v", err)
	}
	if !status.IsRepo {
		t.Errorf("expected isRepo=true")
	}
	if len(status.Files) != 1 || status.Files[0].Status != "untracked" {
		t.Errorf("expected 1 untracked file, got %+v", status.Files)
	}

	// 4. Stage file
	if err := mgr.StageFile(tempDir, "sample.txt"); err != nil {
		t.Fatalf("stage failed: %v", err)
	}
	status, _ = mgr.GetStatus(tempDir)
	if len(status.Files) != 1 || !status.Files[0].Staged {
		t.Errorf("expected staged file, got %+v", status.Files)
	}

	// 5. Commit
	res, err := mgr.Commit(tempDir, "initial commit")
	if err != nil || !res.Success {
		t.Fatalf("commit failed: %v", err)
	}
	if res.CommitHash == "" {
		t.Errorf("expected non-empty commit hash")
	}

	// 6. Branch operations
	if err := mgr.CreateBranch(tempDir, "feature/demo"); err != nil {
		t.Fatalf("create branch failed: %v", err)
	}
	branches, err := mgr.GetBranches(tempDir)
	if err != nil || len(branches) < 2 {
		t.Errorf("expected at least 2 branches, got %v", branches)
	}

	if err := mgr.SwitchBranch(tempDir, "main"); err != nil {
		t.Fatalf("switch branch failed: %v", err)
	}
}
