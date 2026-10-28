package settings

import (
	"os"
	"testing"
)

func TestSettingsManager(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "forge-settings-test-*")
	if err != nil {
		t.Fatalf("temp dir err: %v", err)
	}
	defer os.RemoveAll(tempDir)

	mgr := NewManager(tempDir)

	// 1. Initial settings
	initial := mgr.Get()
	if initial.Theme != "2026-dark" || initial.IconTheme != "material-icon-theme" {
		t.Errorf("unexpected initial settings: %+v", initial)
	}

	// 2. Save patch
	patch := map[string]interface{}{
		"fontSize": 18,
		"theme":    "sand-light",
	}
	saved, err := mgr.Save(patch)
	if err != nil {
		t.Fatalf("save patch failed: %v", err)
	}
	if saved.FontSize != 18 || saved.Theme != "sand-light" {
		t.Errorf("patch not applied: %+v", saved)
	}

	// 3. Recent workspaces
	recents := mgr.AddRecentWorkspace("/path/to/projectA")
	if len(recents) != 1 || recents[0] != "/path/to/projectA" {
		t.Errorf("unexpected recents: %v", recents)
	}

	// 4. Reset
	reset := mgr.Reset()
	if reset.FontSize != 14 || reset.Theme != "2026-dark" {
		t.Errorf("reset failed: %+v", reset)
	}
}
