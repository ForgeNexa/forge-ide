package tasks

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ProjectTask represents a runnable project command or lifecycle script.
type ProjectTask struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Command     string `json:"command"`
	Source      string `json:"source"` // 'npm' | 'go' | 'make' | 'cargo' | 'python'
	Description string `json:"description,omitempty"`
}

// RunningTask tracks an active process.
type RunningTask struct {
	ID        string
	Task      ProjectTask
	Cmd       *exec.Cmd
	Cancel    context.CancelFunc
	StartTime time.Time
}

// Manager orchestrates task detection and bounded background execution.
type Manager struct {
	mu           sync.Mutex
	activeTasks  map[string]*RunningTask
	taskCounter  uint64
	maxTasksPool chan struct{}
}

// NewManager creates a task manager with a bounded concurrency pool.
func NewManager(maxConcurrentTasks int) *Manager {
	if maxConcurrentTasks <= 0 {
		maxConcurrentTasks = 4
	}
	return &Manager{
		activeTasks:  make(map[string]*RunningTask),
		maxTasksPool: make(chan struct{}, maxConcurrentTasks),
	}
}

// DetectTasks scans workspace root for runnable project tasks.
func (m *Manager) DetectTasks(workspaceRoot string) ([]ProjectTask, error) {
	var tasks []ProjectTask

	// 1. Detect package.json scripts
	pkgPath := filepath.Join(workspaceRoot, "package.json")
	if data, err := os.ReadFile(pkgPath); err == nil {
		var pkg struct {
			Scripts map[string]string `json:"scripts"`
		}
		if err := json.Unmarshal(data, &pkg); err == nil {
			for name, cmd := range pkg.Scripts {
				tasks = append(tasks, ProjectTask{
					ID:          "npm:" + name,
					Name:        "npm run " + name,
					Command:     "npm run " + name,
					Source:      "npm",
					Description: cmd,
				})
			}
		}
	}

	// 2. Detect Go tasks
	goModPath := filepath.Join(workspaceRoot, "go.mod")
	if _, err := os.Stat(goModPath); err == nil {
		tasks = append(tasks,
			ProjectTask{
				ID:          "go:test",
				Name:        "go test ./...",
				Command:     "go test -v ./...",
				Source:      "go",
				Description: "Run all Go package unit tests",
			},
			ProjectTask{
				ID:          "go:vet",
				Name:        "go vet ./...",
				Command:     "go vet ./...",
				Source:      "go",
				Description: "Run Go static analysis vet",
			},
			ProjectTask{
				ID:          "go:build",
				Name:        "go build ./...",
				Command:     "go build ./...",
				Source:      "go",
				Description: "Compile Go packages",
			},
		)
	}

	// 3. Detect Makefile
	makePath := filepath.Join(workspaceRoot, "Makefile")
	if data, err := os.ReadFile(makePath); err == nil {
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			if strings.Contains(line, ":") && !strings.HasPrefix(line, "\t") && !strings.HasPrefix(line, "#") {
				parts := strings.SplitN(line, ":", 2)
				target := strings.TrimSpace(parts[0])
				if target != "" && !strings.Contains(target, "=") && !strings.HasPrefix(target, ".") {
					tasks = append(tasks, ProjectTask{
						ID:          "make:" + target,
						Name:        "make " + target,
						Command:     "make " + target,
						Source:      "make",
						Description: "Makefile target " + target,
					})
				}
			}
		}
	}

	if tasks == nil {
		tasks = []ProjectTask{}
	}
	return tasks, nil
}

// RunTask starts a task process with bounded concurrency, streaming chunks to outputCb.
func (m *Manager) RunTask(workspaceRoot string, task ProjectTask, outputCb func(taskId string, chunk string), exitCb func(taskId string, code int)) (string, error) {
	select {
	case m.maxTasksPool <- struct{}{}:
	default:
		return "", errors.New("maximum concurrent background tasks reached")
	}

	idNum := atomic.AddUint64(&m.taskCounter, 1)
	taskId := fmt.Sprintf("task-%d", idNum)

	ctx, cancel := context.WithCancel(context.Background())

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd.exe", "/c", task.Command)
	} else {
		cmd = exec.CommandContext(ctx, "/bin/sh", "-c", task.Command)
	}
	cmd.Dir = workspaceRoot

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		<-m.maxTasksPool
		return "", err
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		<-m.maxTasksPool
		return "", err
	}

	if err := cmd.Start(); err != nil {
		cancel()
		<-m.maxTasksPool
		return "", err
	}

	running := &RunningTask{
		ID:        taskId,
		Task:      task,
		Cmd:       cmd,
		Cancel:    cancel,
		StartTime: time.Now(),
	}

	m.mu.Lock()
	m.activeTasks[taskId] = running
	m.mu.Unlock()

	// Stream stdout & stderr concurrently
	go m.streamReader(taskId, stdoutPipe, outputCb)
	go m.streamReader(taskId, stderrPipe, outputCb)

	// Wait for process completion in background goroutine
	go func() {
		defer func() {
			<-m.maxTasksPool
			m.mu.Lock()
			delete(m.activeTasks, taskId)
			m.mu.Unlock()
		}()

		waitErr := cmd.Wait()
		exitCode := 0
		if waitErr != nil {
			if exitErr, ok := waitErr.(*exec.ExitError); ok {
				exitCode = exitErr.ExitCode()
			} else {
				exitCode = 1
			}
		}

		if exitCb != nil {
			exitCb(taskId, exitCode)
		}
	}()

	return taskId, nil
}

func (m *Manager) streamReader(taskId string, r io.Reader, cb func(string, string)) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()
		if cb != nil {
			cb(taskId, line+"\n")
		}
	}
}

// KillTask terminates an active background task.
func (m *Manager) KillTask(taskId string) bool {
	m.mu.Lock()
	running, exists := m.activeTasks[taskId]
	m.mu.Unlock()

	if !exists {
		return false
	}

	running.Cancel()
	if running.Cmd != nil && running.Cmd.Process != nil {
		_ = running.Cmd.Process.Kill()
	}
	return true
}

// StopAll cancels all running tasks cleanly.
func (m *Manager) StopAll() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, t := range m.activeTasks {
		t.Cancel()
		if t.Cmd != nil && t.Cmd.Process != nil {
			_ = t.Cmd.Process.Kill()
		}
	}
	m.activeTasks = make(map[string]*RunningTask)
}
