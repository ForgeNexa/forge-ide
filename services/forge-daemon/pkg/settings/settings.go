package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// ForgeSettings holds all user preferences and IDE configuration.
type ForgeSettings struct {
	Theme            string `json:"theme"`
	IconTheme        string `json:"iconTheme"`
	UIDensity        string `json:"uiDensity"`
	UIFontSize       int    `json:"uiFontSize"`
	UIFontFamily     string `json:"uiFontFamily"`
	FontSize         int    `json:"fontSize"`
	FontFamily       string `json:"fontFamily"`
	TerminalFontSize int    `json:"terminalFontSize"`
	SmoothScrolling  bool   `json:"smoothScrolling"`
	Breadcrumbs      bool   `json:"breadcrumbs"`
	StickyScroll     bool   `json:"stickyScroll"`
	LineNumbers      string `json:"lineNumbers"`
	Minimap          bool   `json:"minimap"`
	CursorBlinking   string `json:"cursorBlinking"`
	TabSize          int    `json:"tabSize"`
	InsertSpaces     bool   `json:"insertSpaces"`
	AutoSave         string `json:"autoSave"`
	FormatOnSave     bool   `json:"formatOnSave"`
	WordWrap         string `json:"wordWrap"`
	AIEnabled        bool   `json:"aiEnabled"`
	AIProvider       string `json:"aiProvider"`
	AIOllamaModel    string `json:"aiOllamaModel"`
	AITelemetry      bool   `json:"aiTelemetry"`
}

// DefaultSettings returns verified defaults for Forge IDE.
func DefaultSettings() ForgeSettings {
	return ForgeSettings{
		Theme:            "2026-dark",
		IconTheme:        "material-icon-theme",
		UIDensity:        "compact",
		UIFontSize:       13,
		UIFontFamily:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
		FontSize:         14,
		FontFamily:       "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
		TerminalFontSize: 13,
		SmoothScrolling:  true,
		Breadcrumbs:      true,
		StickyScroll:     true,
		LineNumbers:      "on",
		Minimap:          true,
		CursorBlinking:   "smooth",
		TabSize:          2,
		InsertSpaces:     true,
		AutoSave:         "afterDelay",
		FormatOnSave:     true,
		WordWrap:         "off",
		AIEnabled:        true,
		AIProvider:       "ollama",
		AIOllamaModel:    "deepseek-coder:1.3b",
		AITelemetry:      false,
	}
}

// Manager manages settings persistence and recent workspaces.
type Manager struct {
	mu           sync.RWMutex
	baseDir      string
	settingsFile string
	recentsFile  string
	current      ForgeSettings
}

// NewManager creates a settings manager storing files in customBaseDir or ~/.forge.
func NewManager(customBaseDir string) *Manager {
	base := customBaseDir
	if base == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			base = ".forge"
		} else {
			base = filepath.Join(home, ".forge")
		}
	}

	_ = os.MkdirAll(base, 0755)

	m := &Manager{
		baseDir:      base,
		settingsFile: filepath.Join(base, "settings.json"),
		recentsFile:  filepath.Join(base, "recent-workspaces.json"),
		current:      DefaultSettings(),
	}

	m.load()
	return m
}

func (m *Manager) load() {
	m.mu.Lock()
	defer m.mu.Unlock()

	data, err := os.ReadFile(m.settingsFile)
	if err == nil {
		var s ForgeSettings
		if err := json.Unmarshal(data, &s); err == nil {
			m.current = s
		}
	}
}

// Get returns active settings.
func (m *Manager) Get() ForgeSettings {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.current
}

// Save applies patch and persists settings atomically.
func (m *Manager) Save(patch map[string]interface{}) (ForgeSettings, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Serialize current to map, apply patch, unmarshal back
	currBytes, _ := json.Marshal(m.current)
	var raw map[string]interface{}
	_ = json.Unmarshal(currBytes, &raw)

	for k, v := range patch {
		raw[k] = v
	}

	patchedBytes, err := json.Marshal(raw)
	if err != nil {
		return m.current, err
	}

	var updated ForgeSettings
	if err := json.Unmarshal(patchedBytes, &updated); err != nil {
		return m.current, err
	}

	m.current = updated

	// Atomic write
	tempPath := m.settingsFile + ".tmp"
	if err := os.WriteFile(tempPath, patchedBytes, 0644); err != nil {
		return m.current, err
	}
	_ = os.Rename(tempPath, m.settingsFile)

	return m.current, nil
}

// Reset restores default settings.
func (m *Manager) Reset() ForgeSettings {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.current = DefaultSettings()
	data, _ := json.MarshalIndent(m.current, "", "  ")
	_ = os.WriteFile(m.settingsFile, data, 0644)
	return m.current
}

// AddRecentWorkspace appends a workspace folder path to recents list.
func (m *Manager) AddRecentWorkspace(folderPath string) []string {
	m.mu.Lock()
	defer m.mu.Unlock()

	recents := m.readRecentsUnsafe()
	var updated []string
	updated = append(updated, folderPath)

	for _, p := range recents {
		if p != folderPath && len(updated) < 15 {
			updated = append(updated, p)
		}
	}

	data, _ := json.MarshalIndent(updated, "", "  ")
	_ = os.WriteFile(m.recentsFile, data, 0644)
	return updated
}

// GetRecentWorkspaces returns list of recent workspaces.
func (m *Manager) GetRecentWorkspaces() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.readRecentsUnsafe()
}

func (m *Manager) readRecentsUnsafe() []string {
	data, err := os.ReadFile(m.recentsFile)
	if err != nil {
		return []string{}
	}
	var list []string
	_ = json.Unmarshal(data, &list)
	if list == nil {
		list = []string{}
	}
	return list
}
