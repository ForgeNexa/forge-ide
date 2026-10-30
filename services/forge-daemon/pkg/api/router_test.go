package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/ForgeNexa/forge-ide/services/forge-daemon/pkg/ai"
	"github.com/ForgeNexa/forge-ide/services/forge-daemon/pkg/git"
	"github.com/ForgeNexa/forge-ide/services/forge-daemon/pkg/lsp"
	"github.com/ForgeNexa/forge-ide/services/forge-daemon/pkg/settings"
	"github.com/ForgeNexa/forge-ide/services/forge-daemon/pkg/tasks"
	"github.com/ForgeNexa/forge-ide/services/forge-daemon/pkg/workspace"
)

func TestRouter_AuthAndEndpoints(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "api-test-*")
	if err != nil {
		t.Fatalf("temp dir err: %v", err)
	}
	defer os.RemoveAll(tempDir)

	_ = os.WriteFile(filepath.Join(tempDir, "index.ts"), []byte("console.log('hi');"), 0644)

	indexer := workspace.NewIndexer()
	_ = indexer.SetWorkspaceRoot(tempDir)
	_, _ = indexer.Index()

	deps := ServerDependencies{
		Indexer:  indexer,
		Git:      git.NewManager(),
		Lsp:      lsp.NewManager(2),
		Tasks:    tasks.NewManager(2),
		Settings: settings.NewManager(tempDir),
		AI:       ai.NewProvider("", ""),
	}

	testToken := "test-secret-token-12345"
	router := NewRouter(deps, testToken)

	// 1. Health check (unauthenticated)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	router.Engine().ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 on health, got %d", w.Code)
	}

	// 2. Unauthorized access without header
	wNoAuth := httptest.NewRecorder()
	reqTreeNoAuth, _ := http.NewRequest("GET", "/api/v1/workspace/tree", nil)
	router.Engine().ServeHTTP(wNoAuth, reqTreeNoAuth)
	if wNoAuth.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without auth, got %d", wNoAuth.Code)
	}

	// 3. Authorized access with bearer token
	wAuth := httptest.NewRecorder()
	reqTreeAuth, _ := http.NewRequest("GET", "/api/v1/workspace/tree", nil)
	reqTreeAuth.Header.Set("Authorization", "Bearer "+testToken)
	router.Engine().ServeHTTP(wAuth, reqTreeAuth)
	if wAuth.Code != http.StatusOK {
		t.Errorf("expected 200 with auth, got %d", wAuth.Code)
	}

	var res struct {
		Files []workspace.FileEntry `json:"files"`
	}
	_ = json.Unmarshal(wAuth.Body.Bytes(), &res)
	if len(res.Files) != 1 || res.Files[0].Name != "index.ts" {
		t.Errorf("expected 1 file (index.ts), got: %+v", res.Files)
	}
}
