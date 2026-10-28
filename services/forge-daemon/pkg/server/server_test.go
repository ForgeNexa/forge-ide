package server

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/protocol"
)

func TestServer_RPCFlow(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "my-forge-rpc-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	_ = os.WriteFile(filepath.Join(tempDir, "sample.txt"), []byte("sample file content"), 0644)

	logger := log.New(io.Discard, "", 0)
	srv := NewServer(logger)

	// Build a stream of newline-delimited requests
	requests := []string{
		`{"jsonrpc":"2.0","id":1,"method":"initialize"}`,
		`{"jsonrpc":"2.0","id":2,"method":"system/health"}`,
		`{"jsonrpc":"2.0","id":3,"method":"workspace/setFolder","params":{"path":"` + tempDir + `"}}`,
		`{"jsonrpc":"2.0","id":4,"method":"workspace/index"}`,
		`{"jsonrpc":"2.0","id":5,"method":"workspace/searchFiles","params":{"query":"sample"}}`,
		`{"jsonrpc":"2.0","id":6,"method":"workspace/readFile","params":{"path":"sample.txt"}}`,
		`{"jsonrpc":"2.0","id":7,"method":"nonexistentMethod"}`,
		`{"jsonrpc":"2.0","id":8,"method":"shutdown"}`,
	}

	input := strings.Join(requests, "\n") + "\n"
	inBuf := bytes.NewBufferString(input)
	outBuf := &bytes.Buffer{}

	if err := srv.Serve(inBuf, outBuf); err != nil {
		t.Fatalf("serve returned error: %v", err)
	}

	// Read responses
	lines := strings.Split(strings.TrimSpace(outBuf.String()), "\n")
	if len(lines) != len(requests) {
		t.Fatalf("expected %d response lines, got %d", len(requests), len(lines))
	}

	// Verify initialize response
	var r1 protocol.Response
	if err := json.Unmarshal([]byte(lines[0]), &r1); err != nil {
		t.Fatalf("failed to parse r1: %v", err)
	}
	resMap, ok := r1.Result.(map[string]interface{})
	if !ok || resMap["server"] != "my-forge-daemon" {
		t.Errorf("unexpected initialize result: %v", r1.Result)
	}

	// Verify nonexistent method error
	var r7 protocol.Response
	if err := json.Unmarshal([]byte(lines[6]), &r7); err != nil {
		t.Fatalf("failed to parse r7: %v", err)
	}
	if r7.Error == nil || r7.Error.Code != protocol.CodeMethodNotFound {
		t.Errorf("expected MethodNotFound error, got: %v", r7.Error)
	}
}
