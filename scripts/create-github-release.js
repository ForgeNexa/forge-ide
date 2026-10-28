const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const OWNER = 'manish-npx';
const REPO = 'forge';
const TAG = 'v0.2.0';
const RELEASE_NAME = 'Forge IDE v0.2.0 — Production Baseline Release';

const RELEASE_BODY = `## Forge IDE v0.2.0 — Production Baseline Release

**Forge IDE** (*my-forge*, by **Yantra Works**) — Your workspace for building software.

### ✨ What's New in v0.2.0
- **Native Go Daemon (\`forge-daemon\`):** Sub-millisecond recursive indexing and fast regex search via line-delimited JSON-RPC 2.0 stdio.
- **2026 Dark Theme & Material Icon Theme:** Authentic, distraction-free visual aesthetic inspired by CodeEdit and modern VS Code conventions.
- **IntelliJ-Style Bottom Tool Window:** Docked terminal, output panel, problems view, task runner, and daemon logs with resizing and multi-session tabs.
- **22-Language Support Matrix & Diagnostics:** Background compiler diagnostics (\`go vet\`, \`tsc\`, \`py_compile\`) and outline symbol extraction.
- **Local-First AI Code Completion:** Fill-In-The-Middle (FIM) autocomplete powered by local Ollama models with zero telemetry.
- **Modern Monorepo Toolchain:** Built with TypeScript 7.0.2, Electron 45.1.0, and React 19 with 0 vulnerabilities (\`npm audit\` clean).
- **Vite Bundle Optimization:** Initial JavaScript payload reduced by 57.3% (313 kB core) with lazy-loaded modals.

### 📦 Standalone Precompiled Daemons
- \`forge-daemon-darwin-arm64\` (Apple Silicon M1/M2/M3/M4)
- \`forge-daemon-darwin-amd64\` (macOS Intel)
- \`forge-daemon-linux-amd64\` (Linux x86_64)
- \`forge-daemon-linux-arm64\` (Linux aarch64)
- \`forge-daemon-windows-amd64.exe\` (Windows x64)

### 🔒 Cryptographic Verification
Verify downloads using the attached \`SHA256SUMS.txt\`:
\`\`\`bash
sha256sum -c SHA256SUMS.txt
\`\`\`

> **Note for macOS/Windows Users:** Because Forge is an open source community project built on GitHub Actions without commercial Apple/Microsoft code signing certificates, run \`xattr -cr /path/to/binary\` on macOS or click "More info -> Run anyway" on Windows SmartScreen.
`;

function apiRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function uploadAsset(uploadUrlTemplate, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const uploadUrl = uploadUrlTemplate.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`);
    const parsed = new URL(uploadUrl);

    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'User-Agent': 'Forge-Release-Script',
        'Authorization': `token ${TOKEN}`,
        'Content-Type': fileName.endsWith('.txt') ? 'text/plain' : 'application/octet-stream',
        'Content-Length': fileData.length,
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`  ✓ Uploaded ${fileName} (${(fileData.length / 1024 / 1024).toFixed(2)} MB)`);
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Failed to upload ${fileName} (${res.statusCode}): ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function main() {
  console.log('1. Checking for existing release for tag:', TAG);
  let release;
  try {
    release = await apiRequest({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Forge-Release-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    console.log(`Found existing release: ${release.name} (id: ${release.id})`);
  } catch {
    console.log('Creating new release...');
    release = await apiRequest({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases`,
      method: 'POST',
      headers: {
        'User-Agent': 'Forge-Release-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    }, JSON.stringify({
      tag_name: TAG,
      target_commitish: 'main',
      name: RELEASE_NAME,
      body: RELEASE_BODY,
      draft: false,
      prerelease: false,
    }));
    console.log(`Created release successfully: ${release.html_url}`);
  }

  const artifactsDir = path.resolve(__dirname, '../release-artifacts');
  const files = fs.readdirSync(artifactsDir);
  console.log(`2. Uploading ${files.length} release assets to release id ${release.id}...`);

  for (const file of files) {
    const fullPath = path.join(artifactsDir, file);
    if (fs.statSync(fullPath).isDirectory()) continue;

    // Check if asset already exists in release
    const existing = (release.assets || []).find((a) => a.name === file);
    if (existing) {
      console.log(`  - Asset ${file} already exists, skipping.`);
      continue;
    }

    await uploadAsset(release.upload_url, fullPath, file);
  }

  console.log('3. Release published successfully:');
  console.log(`URL: ${release.html_url}`);
}

main().catch((err) => {
  console.error('Release creation failed:', err);
  process.exit(1);
});
