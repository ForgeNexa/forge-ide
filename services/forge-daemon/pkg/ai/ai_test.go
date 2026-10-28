package ai

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestAIProvider_FIMFormattingAndFallback(t *testing.T) {
	// 1. Test FIM Prompt Formatting
	deepseekPrompt := FormatFIMPrompt("func main() {", "}", "deepseek-coder:1.3b")
	if !strings.Contains(deepseekPrompt, "<｜fim begin｜>") || !strings.Contains(deepseekPrompt, "<｜fim hole｜>") {
		t.Errorf("expected DeepSeek FIM tokens, got: %s", deepseekPrompt)
	}

	starcoderPrompt := FormatFIMPrompt("const x =", "console.log(x);", "starcoder2:3b")
	if !strings.Contains(starcoderPrompt, "<PRE>") || !strings.Contains(starcoderPrompt, "<SUF>") {
		t.Errorf("expected StarCoder FIM tokens, got: %s", starcoderPrompt)
	}

	// 2. Test Offline Fallback
	provider := NewProvider("http://127.0.0.1:54321", "deepseek-coder:1.3b")
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	resp, err := provider.Complete(ctx, AICompletionRequest{
		Prefix:   "fmt.",
		Suffix:   "",
		Language: "go",
		FilePath: "main.go",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(resp.Completion, "Println") {
		t.Errorf("expected heuristic completion for fmt., got: %s", resp.Completion)
	}

	status := provider.GetStatus(ctx)
	if status.Available {
		t.Errorf("expected offline status on dummy port")
	}
}
