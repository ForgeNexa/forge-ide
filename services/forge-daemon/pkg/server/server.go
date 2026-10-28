package server

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/ai"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/api"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/git"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/lsp"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/protocol"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/settings"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/tasks"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/workspace"
)

// Server handles JSON-RPC 2.0 communication over stdio and loopback HTTP services.
type Server struct {
	indexer    *workspace.Indexer
	watcher    *workspace.WorkspaceWatcher
	git        *git.Manager
	lsp        *lsp.Manager
	tasks      *tasks.Manager
	settings   *settings.Manager
	ai         *ai.Provider
	router     *api.Router
	httpSrv    *http.Server
	httpPort   int
	startTime  time.Time
	logger     *log.Logger
	mu         sync.Mutex
	isClosed   bool
	encoder    *json.Encoder
}

// NewServer creates a new Go-first JSON-RPC and HTTP server.
func NewServer(logger *log.Logger) *Server {
	if logger == nil {
		logger = log.New(os.Stderr, "[forge-daemon] ", log.LstdFlags)
	}

	indexer := workspace.NewIndexer()
	gitMgr := git.NewManager()
	lspMgr := lsp.NewManager(4)
	tasksMgr := tasks.NewManager(4)
	settingsMgr := settings.NewManager("")
	aiProv := ai.NewProvider("", "")

	deps := api.ServerDependencies{
		Indexer:  indexer,
		Git:      gitMgr,
		Lsp:      lspMgr,
		Tasks:    tasksMgr,
		Settings: settingsMgr,
		AI:       aiProv,
	}

	router := api.NewRouter(deps, "")

	s := &Server{
		indexer:   indexer,
		git:       gitMgr,
		lsp:       lspMgr,
		tasks:     tasksMgr,
		settings:  settingsMgr,
		ai:        aiProv,
		router:    router,
		startTime: time.Now(),
		logger:    logger,
	}

	// Start loopback HTTP server on random local port
	s.startHTTPServer()

	return s
}

func (s *Server) startHTTPServer() {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		s.logger.Printf("[server] loopback HTTP listen error: %v", err)
		return
	}

	s.httpPort = listener.Addr().(*net.TCPAddr).Port
	s.httpSrv = &http.Server{
		Handler:      s.router.Engine(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		if err := s.httpSrv.Serve(listener); err != nil && err != http.ErrServerClosed {
			s.logger.Printf("[server] HTTP serve error: %v", err)
		}
	}()
	s.logger.Printf("[server] Loopback HTTP server running on http://127.0.0.1:%d", s.httpPort)
}

// Serve reads JSON-RPC line-delimited messages from r and writes to w.
func (s *Server) Serve(r io.Reader, w io.Writer) error {
	scanner := bufio.NewScanner(r)
	buf := make([]byte, 1024*1024)
	scanner.Buffer(buf, 16*1024*1024)

	encoder := json.NewEncoder(w)
	s.mu.Lock()
	s.encoder = encoder
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		s.isClosed = true
		if s.watcher != nil {
			_ = s.watcher.Close()
			s.watcher = nil
		}
		if s.tasks != nil {
			s.tasks.StopAll()
		}
		if s.httpSrv != nil {
			ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
			defer cancel()
			_ = s.httpSrv.Shutdown(ctx)
		}
		s.mu.Unlock()
	}()

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var req protocol.Request
		if err := json.Unmarshal(line, &req); err != nil {
			s.logger.Printf("parse error: %v", err)
			resp := protocol.Response{
				JSONRPC: "2.0",
				Error:   protocol.NewError(protocol.CodeParseError, "Parse error", err.Error()),
			}
			s.sendResponse(resp)
			continue
		}

		resp := s.handleRequest(&req)
		if resp != nil {
			s.sendResponse(*resp)
		}

		if req.Method == "shutdown" {
			s.logger.Println("shutdown received, terminating server loop")
			break
		}
	}

	return scanner.Err()
}

func (s *Server) sendResponse(resp protocol.Response) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.encoder != nil {
		if err := s.encoder.Encode(resp); err != nil {
			s.logger.Printf("failed to write response: %v", err)
		}
	}
}

// SendNotification dispatches an asynchronous JSON-RPC notification to the client.
func (s *Server) SendNotification(method string, params interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.encoder == nil || s.isClosed {
		return
	}
	notif := protocol.Notification{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
	}
	if err := s.encoder.Encode(notif); err != nil {
		s.logger.Printf("failed to write notification: %v", err)
	}
}

func (s *Server) handleRequest(req *protocol.Request) *protocol.Response {
	resp := &protocol.Response{
		JSONRPC: "2.0",
		ID:      req.ID,
	}

	switch req.Method {
	case "initialize":
		resp.Result = map[string]interface{}{
			"server":   "my-forge-daemon",
			"version":  "0.2.0",
			"protocol": "2.0",
			"pid":      os.Getpid(),
			"go":       runtime.Version(),
			"os":       runtime.GOOS,
			"arch":     runtime.GOARCH,
			"http": map[string]interface{}{
				"enabled":  s.httpPort > 0,
				"endpoint": fmt.Sprintf("http://127.0.0.1:%d", s.httpPort),
				"token":    s.router.GetToken(),
			},
			"capabilities": map[string]interface{}{
				"workspace": true,
				"fsnotify":  true,
				"git":       true,
				"lsp":       true,
				"tasks":     true,
				"settings":  true,
				"ai":        true,
			},
		}

	case "system/health":
		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		resp.Result = map[string]interface{}{
			"status":     "healthy",
			"uptimeSec":  time.Since(s.startTime).Seconds(),
			"goroutines": runtime.NumGoroutine(),
			"allocBytes": m.Alloc,
			"sysBytes":   m.Sys,
			"numGC":      m.NumGC,
			"httpPort":   s.httpPort,
		}

	case "workspace/setFolder":
		var p struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, "Invalid params: expected 'path' string", nil)
			return resp
		}
		if err := s.indexer.SetWorkspaceRoot(p.Path); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, err.Error(), nil)
			return resp
		}
		s.settings.AddRecentWorkspace(p.Path)

		// Reinitialize workspace background file watcher
		s.mu.Lock()
		if s.watcher != nil {
			_ = s.watcher.Close()
			s.watcher = nil
		}
		watcher, err := workspace.NewWorkspaceWatcher(p.Path, s.indexer, s.logger, func(ev workspace.FileChangeEvent) {
			switch ev.Type {
			case workspace.ChangeCreated:
				s.SendNotification("workspace/fileCreated", ev)
			case workspace.ChangeModified:
				s.SendNotification("workspace/fileModified", ev)
			case workspace.ChangeDeleted:
				s.SendNotification("workspace/fileDeleted", ev)
			}
		})
		if err != nil {
			s.logger.Printf("[server] failed to initialize file watcher: %v", err)
		} else {
			s.watcher = watcher
		}
		s.mu.Unlock()

		resp.Result = map[string]interface{}{
			"success": true,
			"root":    s.indexer.GetWorkspaceRoot(),
		}

	case "workspace/getFolder":
		resp.Result = map[string]interface{}{
			"root": s.indexer.GetWorkspaceRoot(),
		}

	case "workspace/index":
		stats, err := s.indexer.Index()
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = stats

	case "workspace/listDirectory":
		var p struct {
			Path string `json:"path"`
		}
		if len(req.Params) > 0 {
			_ = json.Unmarshal(req.Params, &p)
		}
		entries, err := s.indexer.ListDirectory(p.Path)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = entries

	case "workspace/searchFiles":
		var p struct {
			Query string `json:"query"`
			Limit int    `json:"limit"`
		}
		if len(req.Params) > 0 {
			_ = json.Unmarshal(req.Params, &p)
		}
		results := s.indexer.SearchFiles(p.Query, p.Limit)
		resp.Result = results

	case "workspace/searchContent":
		var p struct {
			Query         string `json:"query"`
			CaseSensitive bool   `json:"caseSensitive"`
			WholeWord     bool   `json:"wholeWord"`
			MaxMatches    int    `json:"maxMatches"`
		}
		if len(req.Params) > 0 {
			_ = json.Unmarshal(req.Params, &p)
		}
		results := s.indexer.SearchContent(p.Query, p.CaseSensitive, p.WholeWord, p.MaxMatches)
		resp.Result = results

	case "workspace/createFile":
		var p struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil || p.Path == "" {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, "Invalid params: 'path' required", nil)
			return resp
		}
		if err := s.indexer.CreateFile(p.Path, p.Content); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true, "path": p.Path}

	case "workspace/createFolder":
		var p struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil || p.Path == "" {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, "Invalid params: 'path' required", nil)
			return resp
		}
		if err := s.indexer.CreateFolder(p.Path); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true, "path": p.Path}

	case "workspace/renameEntry":
		var p struct {
			OldPath string `json:"oldPath"`
			NewPath string `json:"newPath"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil || p.OldPath == "" || p.NewPath == "" {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, "Invalid params: 'oldPath' and 'newPath' required", nil)
			return resp
		}
		if err := s.indexer.RenameEntry(p.OldPath, p.NewPath); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true, "oldPath": p.OldPath, "newPath": p.NewPath}

	case "workspace/deleteEntry":
		var p struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil || p.Path == "" {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, "Invalid params: 'path' required", nil)
			return resp
		}
		if err := s.indexer.DeleteEntry(p.Path); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true, "path": p.Path}

	case "workspace/readFile":
		var p struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil || p.Path == "" {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, "Invalid params: 'path' required", nil)
			return resp
		}
		content, err := s.indexer.ReadFile(p.Path)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{
			"path":    p.Path,
			"content": content,
		}

	case "workspace/writeFile":
		var p struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil || p.Path == "" {
			resp.Error = protocol.NewError(protocol.CodeInvalidParams, "Invalid params: 'path' and 'content' required", nil)
			return resp
		}
		if err := s.indexer.WriteFile(p.Path, p.Content); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{
			"success": true,
			"path":    p.Path,
		}

	// ---------------- Git Operations (Go Backend) ----------------
	case "git/status":
		root := s.indexer.GetWorkspaceRoot()
		status, err := s.git.GetStatus(root)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = status

	case "git/stage":
		var p struct {
			Path string `json:"path"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		if err := s.git.StageFile(root, p.Path); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true}

	case "git/unstage":
		var p struct {
			Path string `json:"path"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		if err := s.git.UnstageFile(root, p.Path); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true}

	case "git/stageAll":
		root := s.indexer.GetWorkspaceRoot()
		if err := s.git.StageAll(root); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true}

	case "git/unstageAll":
		root := s.indexer.GetWorkspaceRoot()
		if err := s.git.UnstageAll(root); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true}

	case "git/discard":
		var p struct {
			Path string `json:"path"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		if err := s.git.DiscardChanges(root, p.Path); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true}

	case "git/commit":
		var p struct {
			Message string `json:"message"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		result, err := s.git.Commit(root, p.Message)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = result

	case "git/diff":
		var p struct {
			Path   string `json:"path"`
			Staged bool   `json:"staged"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		diffResult, err := s.git.GetDiff(root, p.Path, p.Staged)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = diffResult

	case "git/branches":
		root := s.indexer.GetWorkspaceRoot()
		branches, err := s.git.GetBranches(root)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = branches

	case "git/switchBranch":
		var p struct {
			Branch string `json:"branch"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		if err := s.git.SwitchBranch(root, p.Branch); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true}

	case "git/createBranch":
		var p struct {
			Branch string `json:"branch"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		if err := s.git.CreateBranch(root, p.Branch); err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"success": true}

	// ---------------- LSP & Intelligence Operations ----------------
	case "lsp/symbols":
		var p struct {
			FilePath string `json:"filePath"`
			Content  string `json:"content"`
		}
		_ = json.Unmarshal(req.Params, &p)
		symbols, err := s.lsp.GetDocumentSymbols(p.FilePath, p.Content)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = symbols

	case "lsp/definition":
		var p struct {
			FilePath string `json:"filePath"`
			Symbol   string `json:"symbol"`
		}
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		loc, err := s.lsp.FindDefinition(root, p.FilePath, p.Symbol)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = loc

	case "lsp/hover":
		var p struct {
			FilePath string `json:"filePath"`
			Symbol   string `json:"symbol"`
			Content  string `json:"content"`
		}
		_ = json.Unmarshal(req.Params, &p)
		hover, err := s.lsp.GetHover(p.FilePath, p.Symbol, p.Content)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = hover

	case "lsp/diagnostics":
		var p struct {
			FilePath string `json:"filePath"`
		}
		if len(req.Params) > 0 {
			_ = json.Unmarshal(req.Params, &p)
		}
		root := s.indexer.GetWorkspaceRoot()
		diags, err := s.lsp.GetDiagnostics(root, p.FilePath)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = diags

	// ---------------- Tasks Runner Operations ----------------
	case "task/detect":
		root := s.indexer.GetWorkspaceRoot()
		detected, err := s.tasks.DetectTasks(root)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = detected

	case "task/run":
		var p tasks.ProjectTask
		_ = json.Unmarshal(req.Params, &p)
		root := s.indexer.GetWorkspaceRoot()
		taskId, err := s.tasks.RunTask(root, p, func(id string, chunk string) {
			s.SendNotification("task/output", map[string]interface{}{"taskId": id, "chunk": chunk})
		}, func(id string, code int) {
			s.SendNotification("task/exit", map[string]interface{}{"taskId": id, "exitCode": code})
		})
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = map[string]interface{}{"taskId": taskId}

	case "task/kill":
		var p struct {
			TaskId string `json:"taskId"`
		}
		_ = json.Unmarshal(req.Params, &p)
		success := s.tasks.KillTask(p.TaskId)
		resp.Result = map[string]interface{}{"success": success}

	// ---------------- Settings Operations ----------------
	case "settings/get":
		resp.Result = s.settings.Get()

	case "settings/save":
		var patch map[string]interface{}
		_ = json.Unmarshal(req.Params, &patch)
		updated, err := s.settings.Save(patch)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = updated

	case "settings/reset":
		resp.Result = s.settings.Reset()

	case "settings/recentWorkspaces":
		resp.Result = s.settings.GetRecentWorkspaces()

	// ---------------- AI Local Completion ----------------
	case "ai/completion":
		var p ai.AICompletionRequest
		_ = json.Unmarshal(req.Params, &p)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		aiResp, err := s.ai.Complete(ctx, p)
		if err != nil {
			resp.Error = protocol.NewError(protocol.CodeInternalError, err.Error(), nil)
			return resp
		}
		resp.Result = aiResp

	case "ai/status":
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		resp.Result = s.ai.GetStatus(ctx)

	case "shutdown":
		s.mu.Lock()
		s.isClosed = true
		if s.watcher != nil {
			_ = s.watcher.Close()
			s.watcher = nil
		}
		if s.tasks != nil {
			s.tasks.StopAll()
		}
		if s.httpSrv != nil {
			ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
			defer cancel()
			_ = s.httpSrv.Shutdown(ctx)
		}
		s.mu.Unlock()
		resp.Result = map[string]interface{}{
			"status": "shutting_down",
		}

	default:
		resp.Error = protocol.NewError(protocol.CodeMethodNotFound, fmt.Sprintf("Method '%s' not found", req.Method), nil)
	}

	return resp
}
