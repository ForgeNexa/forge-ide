package git

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// GitFileStatus represents the status of an individual file.
type GitFileStatus struct {
	Path              string `json:"path"`
	Status            string `json:"status"` // 'modified' | 'untracked' | 'staged' | 'deleted' | 'renamed' | 'conflicted'
	Staged            bool   `json:"staged"`
	WorkingTreeStatus string `json:"workingTreeStatus"`
	IndexStatus       string `json:"indexStatus"`
}

// GitRepoStatus represents the overall repository state.
type GitRepoStatus struct {
	IsRepo   bool            `json:"isRepo"`
	Branch   string          `json:"branch"`
	Upstream string          `json:"upstream,omitempty"`
	Files    []GitFileStatus `json:"files"`
	Ahead    int             `json:"ahead"`
	Behind   int             `json:"behind"`
}

// GitCommitResult represents the outcome of a commit operation.
type GitCommitResult struct {
	Success    bool   `json:"success"`
	CommitHash string `json:"commitHash,omitempty"`
	Message    string `json:"message,omitempty"`
	Error      string `json:"error,omitempty"`
}

// GitDiffResult holds original and modified diff lines.
type GitDiffResult struct {
	Original string `json:"original"`
	Modified string `json:"modified"`
}

// Manager manages Git operations for workspaces.
type Manager struct{}

// NewManager creates a new Git manager.
func NewManager() *Manager {
	return &Manager{}
}

func (m *Manager) runGit(ctx context.Context, dir string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = dir
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("git %s failed: %w (%s)", strings.Join(args, " "), err, strings.TrimSpace(stderr.String()))
	}
	return strings.TrimSpace(stdout.String()), nil
}

// GetStatus returns the structured Git status for a directory.
func (m *Manager) GetStatus(dir string) (GitRepoStatus, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1. Verify if directory is a git repository
	revOut, err := m.runGit(ctx, dir, "rev-parse", "--is-inside-work-tree")
	if err != nil || revOut != "true" {
		return GitRepoStatus{
			IsRepo: false,
			Branch: "",
			Files:  []GitFileStatus{},
		}, nil
	}

	// 2. Query branch and upstream
	branch, _ := m.runGit(ctx, dir, "branch", "--show-current")
	upstream, _ := m.runGit(ctx, dir, "rev-parse", "--abbrev-ref", "@{upstream}")

	// 3. Ahead / Behind calculation
	ahead, behind := 0, 0
	if upstream != "" {
		countOut, err := m.runGit(ctx, dir, "rev-list", "--left-right", "--count", "HEAD..."+upstream)
		if err == nil {
			parts := strings.Fields(countOut)
			if len(parts) == 2 {
				ahead, _ = strconv.Atoi(parts[0])
				behind, _ = strconv.Atoi(parts[1])
			}
		}
	}

	// 4. Status porcelain v1 parser
	statusOut, err := m.runGit(ctx, dir, "status", "--porcelain=v1", "-uall")
	if err != nil {
		return GitRepoStatus{IsRepo: true, Branch: branch, Files: []GitFileStatus{}}, nil
	}

	var files []GitFileStatus
	lines := strings.Split(statusOut, "\n")
	for _, line := range lines {
		if len(line) < 4 {
			continue
		}
		x := string(line[0])
		y := string(line[1])
		filePath := strings.TrimSpace(line[3:])
		if strings.Contains(filePath, " -> ") {
			parts := strings.Split(filePath, " -> ")
			filePath = parts[len(parts)-1]
		}
		normPath := filepath.ToSlash(filePath)

		var statusStr string
		staged := false

		if x == "?" && y == "?" {
			statusStr = "untracked"
			staged = false
		} else if x == "U" || y == "U" || (x == "A" && y == "A") || (x == "D" && y == "D") {
			statusStr = "conflicted"
			staged = false
		} else if x != " " && x != "?" {
			staged = true
			if x == "M" {
				statusStr = "modified"
			} else if x == "A" {
				statusStr = "staged"
			} else if x == "D" {
				statusStr = "deleted"
			} else if x == "R" {
				statusStr = "renamed"
			} else {
				statusStr = "modified"
			}
		} else {
			staged = false
			if y == "M" {
				statusStr = "modified"
			} else if y == "D" {
				statusStr = "deleted"
			} else {
				statusStr = "modified"
			}
		}

		files = append(files, GitFileStatus{
			Path:              normPath,
			Status:            statusStr,
			Staged:            staged,
			WorkingTreeStatus: y,
			IndexStatus:       x,
		})
	}

	if files == nil {
		files = []GitFileStatus{}
	}

	return GitRepoStatus{
		IsRepo:   true,
		Branch:   branch,
		Upstream: upstream,
		Files:    files,
		Ahead:    ahead,
		Behind:   behind,
	}, nil
}

// StageFile stages a file using git add.
func (m *Manager) StageFile(dir string, filePath string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := m.runGit(ctx, dir, "add", filePath)
	return err
}

// UnstageFile unstages a file using git restore or git reset.
func (m *Manager) UnstageFile(dir string, filePath string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := m.runGit(ctx, dir, "restore", "--staged", filePath)
	if err != nil {
		_, err = m.runGit(ctx, dir, "reset", "HEAD", filePath)
	}
	return err
}

// StageAll stages all changes.
func (m *Manager) StageAll(dir string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := m.runGit(ctx, dir, "add", "-A")
	return err
}

// UnstageAll unstages all staged files.
func (m *Manager) UnstageAll(dir string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := m.runGit(ctx, dir, "reset")
	return err
}

// DiscardChanges discards working tree changes.
func (m *Manager) DiscardChanges(dir string, filePath string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := m.runGit(ctx, dir, "checkout", "--", filePath)
	if err != nil {
		_, err = m.runGit(ctx, dir, "clean", "-fd", filePath)
	}
	return err
}

// Commit creates a git commit.
func (m *Manager) Commit(dir string, message string) (GitCommitResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := m.runGit(ctx, dir, "commit", "-m", message)
	if err != nil {
		return GitCommitResult{Success: false, Error: err.Error()}, err
	}

	hash, _ := m.runGit(ctx, dir, "rev-parse", "--short", "HEAD")
	return GitCommitResult{
		Success:    true,
		CommitHash: hash,
		Message:    message,
	}, nil
}

// GetDiff retrieves staged or working tree diffs.
func (m *Manager) GetDiff(dir string, filePath string, staged bool) (GitDiffResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var diff string
	var err error
	if staged {
		diff, err = m.runGit(ctx, dir, "diff", "--staged", filePath)
	} else {
		diff, err = m.runGit(ctx, dir, "diff", filePath)
	}
	if err != nil {
		return GitDiffResult{}, err
	}

	var origContent string
	if staged {
		origContent, _ = m.runGit(ctx, dir, "show", "HEAD:"+filePath)
	} else {
		origContent, _ = m.runGit(ctx, dir, "show", ":"+filePath)
	}

	return GitDiffResult{
		Original: origContent,
		Modified: diff,
	}, nil
}

// GetBranches returns list of local branches.
func (m *Manager) GetBranches(dir string) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	out, err := m.runGit(ctx, dir, "branch", "--format=%(refname:short)")
	if err != nil {
		return []string{}, err
	}
	lines := strings.Split(out, "\n")
	var branches []string
	for _, line := range lines {
		trim := strings.TrimSpace(line)
		if trim != "" {
			branches = append(branches, trim)
		}
	}
	return branches, nil
}

// SwitchBranch checks out an existing branch.
func (m *Manager) SwitchBranch(dir string, branch string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := m.runGit(ctx, dir, "checkout", branch)
	return err
}

// CreateBranch creates and checks out a new branch.
func (m *Manager) CreateBranch(dir string, branch string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := m.runGit(ctx, dir, "checkout", "-b", branch)
	return err
}
