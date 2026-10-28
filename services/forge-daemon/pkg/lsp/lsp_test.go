package lsp

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLspManager_SymbolsAndDefinition(t *testing.T) {
	mgr := NewManager(2)

	goCode := `package main

// AddNumbers adds two numbers
func AddNumbers(a int, b int) int {
	return a + b
}

type UserProfile struct {
	ID   string
	Name string
}

type Greeter interface {
	Greet() string
}
`
	symbols, err := mgr.GetDocumentSymbols("main.go", goCode)
	if err != nil {
		t.Fatalf("failed to extract symbols: %v", err)
	}
	if len(symbols) < 3 {
		t.Errorf("expected at least 3 symbols, got %d", len(symbols))
	}

	foundFn, foundStruct, foundIface := false, false, false
	for _, s := range symbols {
		if s.Name == "AddNumbers" && s.Kind == "function" {
			foundFn = true
		}
		if s.Name == "UserProfile" && s.Kind == "class" {
			foundStruct = true
		}
		if s.Name == "Greeter" && s.Kind == "interface" {
			foundIface = true
		}
	}

	if !foundFn || !foundStruct || !foundIface {
		t.Errorf("symbol extraction mismatch: fn=%v, struct=%v, iface=%v", foundFn, foundStruct, foundIface)
	}

	// Test hover
	hover, err := mgr.GetHover("main.go", "AddNumbers", goCode)
	if err != nil || hover == nil {
		t.Fatalf("expected hover for AddNumbers, got %v", err)
	}
	if hover.Symbol != "AddNumbers" || hover.Doc == "" {
		t.Errorf("expected hover with doc comment, got %+v", hover)
	}

	// Test Definition Discovery
	tempDir, err := os.MkdirTemp("", "lsp-test-*")
	if err != nil {
		t.Fatalf("temp dir error: %v", err)
	}
	defer os.RemoveAll(tempDir)

	_ = os.WriteFile(filepath.Join(tempDir, "main.go"), []byte(goCode), 0644)
	def, err := mgr.FindDefinition(tempDir, "main.go", "UserProfile")
	if err != nil || def == nil {
		t.Fatalf("expected definition for UserProfile, got %v", err)
	}
	if def.File != "main.go" || def.Line <= 0 {
		t.Errorf("unexpected definition result: %+v", def)
	}
}
