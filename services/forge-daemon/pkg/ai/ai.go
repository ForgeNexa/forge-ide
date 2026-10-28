package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

// AICompletionRequest holds parameters for code completion.
type AICompletionRequest struct {
	Prefix   string `json:"prefix"`
	Suffix   string `json:"suffix"`
	Language string `json:"language"`
	FilePath string `json:"filePath"`
	Model    string `json:"model,omitempty"`
}

// AICompletionResponse holds generated suggestion.
type AICompletionResponse struct {
	Completion string `json:"completion"`
	Model      string `json:"model"`
	Provider   string `json:"provider"`
	LatencyMs  int64  `json:"latencyMs"`
	Cached     bool   `json:"cached"`
}

// AIStatus reports provider health and active model.
type AIStatus struct {
	Provider  string `json:"provider"`
	Available bool   `json:"available"`
	Model     string `json:"model"`
	Endpoint  string `json:"endpoint"`
	Message   string `json:"message"`
}

// Provider manages AI completion with bounded cancellation.
type Provider struct {
	client     *http.Client
	endpoint   string
	model      string
	mu         sync.Mutex
	activeReqs map[string]context.CancelFunc
}

// NewProvider creates a new local AI provider.
func NewProvider(endpoint string, model string) *Provider {
	if endpoint == "" {
		endpoint = "http://127.0.0.1:11434"
	}
	if model == "" {
		model = "deepseek-coder:1.3b"
	}
	return &Provider{
		client: &http.Client{
			Timeout: 4 * time.Second,
		},
		endpoint:   endpoint,
		model:      model,
		activeReqs: make(map[string]context.CancelFunc),
	}
}

// FormatFIMPrompt formats prefix and suffix into Fill-In-The-Middle prompt according to model tokenizer conventions.
func FormatFIMPrompt(prefix string, suffix string, model string) string {
	lower := strings.ToLower(model)
	if strings.Contains(lower, "deepseek") {
		return fmt.Sprintf("<｜fim begin｜>%s<｜fim hole｜>%s<｜fim end｜>", prefix, suffix)
	}
	if strings.Contains(lower, "starcoder") || strings.Contains(lower, "codellama") {
		return fmt.Sprintf("<PRE> %s <SUF> %s <MID>", prefix, suffix)
	}
	if strings.Contains(lower, "qwen") {
		return fmt.Sprintf("<|fim_prefix|>%s<|fim_suffix|>%s<|fim_middle|>", prefix, suffix)
	}
	// Default standard FIM template
	return fmt.Sprintf("<｜fim begin｜>%s<｜fim hole｜>%s<｜fim end｜>", prefix, suffix)
}

// Complete generates completion via local Ollama or returns fallback.
func (p *Provider) Complete(ctx context.Context, req AICompletionRequest) (AICompletionResponse, error) {
	start := time.Now()
	modelName := p.model
	if req.Model != "" {
		modelName = req.Model
	}

	prompt := FormatFIMPrompt(req.Prefix, req.Suffix, modelName)

	payload := map[string]interface{}{
		"model":  modelName,
		"prompt": prompt,
		"stream": false,
		"options": map[string]interface{}{
			"temperature": 0.2,
			"top_p":       0.95,
			"num_predict": 64,
			"stop":        []string{"\n\n", "```", "<｜end of sentence｜>", "<|file_separator|>"},
		},
	}

	bodyBytes, _ := json.Marshal(payload)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.endpoint+"/api/generate", bytes.NewReader(bodyBytes))
	if err != nil {
		return p.fallbackCompletion(req, start), nil
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(httpReq)
	if err != nil {
		// Ollama offline / unreachable -> fallback gracefully
		return p.fallbackCompletion(req, start), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return p.fallbackCompletion(req, start), nil
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return p.fallbackCompletion(req, start), nil
	}

	var parsed struct {
		Response string `json:"response"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil || parsed.Response == "" {
		return p.fallbackCompletion(req, start), nil
	}

	return AICompletionResponse{
		Completion: parsed.Response,
		Model:      modelName,
		Provider:   "ollama",
		LatencyMs:  time.Since(start).Milliseconds(),
		Cached:     false,
	}, nil
}

// fallbackCompletion provides safe, context-aware rule-based completion when local Ollama model is offline.
func (p *Provider) fallbackCompletion(req AICompletionRequest, start time.Time) AICompletionResponse {
	trimmedPrefix := strings.TrimRight(req.Prefix, " \t")
	completion := ""

	if strings.HasSuffix(trimmedPrefix, "fmt.") {
		completion = `Println("hello from forge")`
	} else if strings.HasSuffix(trimmedPrefix, "console.") {
		completion = `log("hello from forge");`
	} else if strings.HasSuffix(trimmedPrefix, "if err != nil {") {
		completion = "\n\treturn err\n}"
	}

	return AICompletionResponse{
		Completion: completion,
		Model:      "forge-local-heuristic",
		Provider:   "offline-fallback",
		LatencyMs:  time.Since(start).Milliseconds(),
		Cached:     true,
	}
}

// GetStatus checks if the local Ollama instance is reachable.
func (p *Provider) GetStatus(ctx context.Context) AIStatus {
	req, err := http.NewRequestWithContext(ctx, "GET", p.endpoint+"/api/tags", nil)
	if err != nil {
		return AIStatus{
			Provider:  "ollama",
			Available: false,
			Model:     p.model,
			Endpoint:  p.endpoint,
			Message:   "Ollama not running locally. Run 'ollama run deepseek-coder:1.3b' for offline AI completion.",
		}
	}

	resp, err := p.client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return AIStatus{
			Provider:  "ollama",
			Available: false,
			Model:     p.model,
			Endpoint:  p.endpoint,
			Message:   "Ollama offline. Local fallback active.",
		}
	}
	defer resp.Body.Close()

	return AIStatus{
		Provider:  "ollama",
		Available: true,
		Model:     p.model,
		Endpoint:  p.endpoint,
		Message:   "Local Ollama online and ready.",
	}
}
