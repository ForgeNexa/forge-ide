import {
  AICompletionRequest,
  AICompletionResult,
  AIProviderStatus,
} from '@my-forge/shared-protocol';

export interface LocalAIOptions {
  endpoint?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

export class LocalAIProvider {
  private endpoint: string;
  private defaultModel: string;
  private timeoutMs: number;
  private lastStatus: AIProviderStatus | null = null;
  private lastCheckedTime = 0;

  constructor(options?: LocalAIOptions) {
    this.endpoint = options?.endpoint || process.env.FORGE_AI_ENDPOINT || 'http://localhost:11434';
    this.defaultModel = options?.defaultModel || 'qwen2.5-coder:0.5b-base';
    this.timeoutMs = options?.timeoutMs || 2500;
  }

  /**
   * Format FIM (Fill-In-The-Middle) prompt for Qwen2.5-Coder and StarCoder models.
   */
  public formatFIMPrompt(prefix: string, suffix: string): string {
    // Standard Qwen2.5-Coder / StarCoder FIM tokens
    return `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`;
  }

  /**
   * Check health and availability of local Ollama / Tabby server.
   */
  public async getStatus(): Promise<AIProviderStatus> {
    const now = Date.now();
    // Cache status for 3 seconds to avoid spamming local port
    if (this.lastStatus && now - this.lastCheckedTime < 3000) {
      return this.lastStatus;
    }

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);

      const res = await fetch(`${this.endpoint}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as { models?: Array<{ name: string; size?: number }> };
        const models = data.models || [];
        const foundTarget = models.find((m) => m.name.includes('qwen2.5-coder') || m.name.includes('coder'));
        const activeModel = foundTarget ? foundTarget.name : (models[0]?.name || this.defaultModel);
        const latencyMs = Date.now() - startTime;

        this.lastStatus = {
          provider: 'ollama',
          model: activeModel,
          available: true,
          endpoint: this.endpoint,
          latencyMs,
          memoryUsageMB: foundTarget?.size ? Math.round(foundTarget.size / (1024 * 1024)) : 580,
        };
        this.lastCheckedTime = now;
        return this.lastStatus;
      }
    } catch {
      // Local server is not reachable
    }

    this.lastStatus = {
      provider: 'local',
      model: this.defaultModel,
      available: false,
      endpoint: this.endpoint,
      latencyMs: 0,
      memoryUsageMB: 0,
    };
    this.lastCheckedTime = now;
    return this.lastStatus;
  }

  /**
   * Generate inline code completion using local model or fallback.
   */
  public async getCompletion(req: AICompletionRequest): Promise<AICompletionResult | null> {
    const status = await this.getStatus();
    const startTime = Date.now();

    // If Ollama is running and available, request FIM completion
    if (status.available) {
      try {
        const prompt = this.formatFIMPrompt(req.prefix, req.suffix);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(`${this.endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: status.model,
            prompt,
            stream: false,
            options: {
              stop: [
                '<|fim_prefix|>',
                '<|fim_suffix|>',
                '<|fim_middle|>',
                '<|endoftext|>',
                '<|file_separator|>',
                '\n\n\n',
              ],
              num_predict: req.maxTokens || 48,
              temperature: 0.2,
              top_p: 0.95,
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = (await res.json()) as { response?: string };
          const text = (data.response || '').trimEnd();
          if (text) {
            return {
              text,
              model: status.model,
              durationMs: Date.now() - startTime,
            };
          }
        }
      } catch (err) {
        // Fall through to offline heuristic if request fails or times out
      }
    }

    // Graceful offline fallback heuristic: provides instant bracket/block completion
    return this.getOfflineHeuristicCompletion(req, startTime);
  }

  /**
   * Deterministic local offline heuristic for zero-latency completion when model daemon is inactive.
   */
  private getOfflineHeuristicCompletion(
    req: AICompletionRequest,
    startTime: number
  ): AICompletionResult | null {
    const lastLine = req.prefix.split('\n').pop() || '';
    const trimmed = lastLine.trim();

    let completionText = '';

    if (req.languageId === 'typescript' || req.languageId === 'javascript') {
      if (trimmed.endsWith('if (') && !trimmed.endsWith(') {')) {
        completionText = 'condition) {\n  \n}';
      } else if (trimmed.endsWith('function') || trimmed.endsWith('const handler = (')) {
        completionText = ') => {\n  \n};';
      } else if (trimmed.endsWith('console.log(')) {
        completionText = `'DEBUG', );`;
      }
    } else if (req.languageId === 'go') {
      if (trimmed.endsWith('if err != nil {')) {
        completionText = '\n\treturn err\n}';
      } else if (trimmed.startsWith('func ') && trimmed.endsWith('{')) {
        completionText = '\n\treturn nil\n}';
      }
    } else if (req.languageId === 'python') {
      if (trimmed.endsWith('def __init__(self):')) {
        completionText = '\n        pass';
      } else if (trimmed.endsWith('if __name__ == "__main__":')) {
        completionText = '\n    main()';
      }
    }

    if (completionText) {
      return {
        text: completionText,
        model: 'local-heuristic (offline)',
        durationMs: Date.now() - startTime,
      };
    }

    return null;
  }
}
