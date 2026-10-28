const https = require('https');

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const OWNER = 'manish-npx';
const REPO = 'forge';

const ISSUES = [
  {
    title: '[Milestone 2] Real-time background file watching (fsnotify) in Go daemon',
    body: `### Overview
Implement background recursive filesystem watching in \`services/forge-daemon\` to stream real-time workspace file change notifications to the Electron desktop shell.

### Tasks
- [ ] Add \`github.com/fsnotify/fsnotify\` to \`services/forge-daemon/go.mod\`.
- [ ] Implement recursive directory watcher filtering out \`.git\`, \`node_modules\`, and \`dist\`.
- [ ] Dispatch JSON-RPC 2.0 notifications over stdout:
  - \`workspace/fileCreated\`
  - \`workspace/fileModified\`
  - \`workspace/fileDeleted\`
- [ ] Wire \`daemonManager.ts\` to update React FileTree state without full re-indexing.
- [ ] Add Go unit tests in \`services/forge-daemon/pkg/workspace\`.

**Reference:** \`docs/PROJECT_IMPLEMENTATION_PLAN.md\`
`,
    labels: ['enhancement', 'backend'],
  },
  {
    title: '[Milestone 3] HTML5 drag-and-drop tree re-parenting and declarative extension loader',
    body: `### Overview
Enhance FileTree ergonomics and expand Open VSX extension compatibility.

### Tasks
- [ ] Add HTML5 drag-and-drop handling to \`FileTree.tsx\` for moving files and folders.
- [ ] Add confirmation modal when moving folders or overwriting files.
- [ ] Expand \`extensionManager.ts\` to unpack and load declarative TextMate syntaxes and code snippets from installed \`.vsix\` packages.
- [ ] Add end-to-end flow test for tree move operations via \`workspace/renameEntry\`.

**Reference:** \`docs/PROJECT_IMPLEMENTATION_PLAN.md\`
`,
    labels: ['enhancement', 'ui'],
  },
  {
    title: '[Milestone 4] Multi-provider AI assistant panel in sidebar (Ollama, OpenAI, Gemini)',
    body: `### Overview
Add an interactive AI chat interface in the Activity Bar alongside local FIM code completion.

### Tasks
- [ ] Create \`AIChatSidebar.tsx\` in \`apps/renderer/src/components/\`.
- [ ] Implement streaming Markdown response rendering with syntax-highlighted code blocks.
- [ ] Connect providers: Local Ollama (default), OpenAI (GPT-4o), Google Gemini.
- [ ] Integrate OS Keychain or encrypted local storage for API keys.
- [ ] Add "Send Selection to AI" context menu action in Monaco Editor.

**Reference:** \`docs/PROJECT_IMPLEMENTATION_PLAN.md\`
`,
    labels: ['feature', 'ai'],
  },
  {
    title: '[Milestone 5] Cross-platform desktop packaging matrix (.dmg, .deb, .exe)',
    body: `### Overview
Automate full Electron production desktop application installers in GitHub Actions.

### Tasks
- [ ] Configure \`electron-builder\` matrix in \`.github/workflows/release.yml\`.
- [ ] macOS: Build \`.dmg\` and \`.zip\` for Apple Silicon (\`arm64\`) and Intel (\`x64\`).
- [ ] Linux: Build \`.AppImage\` and \`.deb\` for \`x64\` and \`arm64\`.
- [ ] Windows: Build \`.exe\` NSIS installer for \`x64\`.
- [ ] Generate cryptographic SHA256 checksums automatically on release tags.

**Reference:** \`docs/RELEASING.md\`
`,
    labels: ['ci/cd', 'packaging'],
  },
  {
    title: '[Architecture] Electrobun Evaluation: Native PTY bindings and WebKit font metric tracking',
    body: `### Overview
Monitor and track Electrobun framework maturity for future lightweight desktop shell migration.

### Current Status
- Electrobun prototype builds at 73 MB (\`Forge IDE (Electrobun Experiment)-dev.app\`).
- Bun 1.4.4 installed on evaluation host.

### Required Upstream Milestones Before Production Adoption
- [ ] Upstream Electrobun native PTY Zig bindings (replacing \`node-pty\`).
- [ ] macOS WKWebView Monaco subpixel font rendering and key composition stabilization.
- [ ] Linux WebKitGTK multi-process WebGL2 parity.

**Reference:** \`docs/ARCHITECTURE_DECISION.md\` and \`experiments/electrobun-eval/README.md\`
`,
    labels: ['architecture', 'research'],
  },
];

function createIssue(issue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    });

    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues`,
      method: 'POST',
      headers: {
        'User-Agent': 'Forge-Issue-Creator',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const json = JSON.parse(body);
          console.log(`✓ Created Issue #${json.number}: ${json.title} (${json.html_url})`);
          resolve(json);
        } else {
          reject(new Error(`Failed to create issue (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`Creating ${ISSUES.length} roadmap issues on ${OWNER}/${REPO}...`);
  for (const issue of ISSUES) {
    await createIssue(issue);
    // Small delay between API calls
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log('All issues created successfully!');
}

main().catch((err) => {
  console.error('Issue creation failed:', err);
  process.exit(1);
});
