package server

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/protocol"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/workspace"
)

// Server handles JSON-RPC 2.0 communication.
type Server struct {
	indexer   *workspace.Indexer
	watcher   *workspace.WorkspaceWatcher
	startTime time.Time
	logger    *log.Logger
	mu        sync.Mutex
	isClosed  bool
	encoder   *json.Encoder
}

// NewServer creates a new JSON-RPC server.
func NewServer(logger *log.Logger) *Server {
	if logger == nil {
		logger = log.New(os.Stderr, "[forge-daemon] ", log.LstdFlags)
	}
	return &Server{
		indexer:   workspace.NewIndexer(),
		startTime: time.Now(),
		logger:    logger,
	}
}

// Serve reads JSON-RPC line-delimited messages from r and writes to w.
func (s *Server) Serve(r io.Reader, w io.Writer) error {
	scanner := bufio.NewScanner(r)
	// Allow large messages up to 16MB
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
			"version":  "0.1.0",
			"protocol": "1.0",
			"pid":      os.Getpid(),
			"go":       runtime.Version(),
			"os":       runtime.GOOS,
			"arch":     runtime.GOARCH,
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

	case "shutdown":
		s.mu.Lock()
		s.isClosed = true
		if s.watcher != nil {
			_ = s.watcher.Close()
			s.watcher = nil
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
