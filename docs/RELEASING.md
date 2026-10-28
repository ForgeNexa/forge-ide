# Forge IDE — Release Engineering & Distribution Guide

**Product:** Forge IDE (by Yantra Works)  
**Current Version:** 0.2.0  
**Repository:** `https://github.com/manish-npx/forge`

---

## 1. Versioning Policy

Forge adheres strictly to **Semantic Versioning (SemVer 2.0.0)**:
- `0.1.0`: Initial functional architecture and baseline Go daemon.
- `0.2.0`: Modern 2026 Dark & Material Icon themes, IntelliJ-style bottom tool-window, 22-language LSP registry, local AI autocomplete, and searchable settings engine.
- `0.2.1`: Backward-compatible bug fixes and patch releases.
- `1.0.0`: First production-ready public release upon completion of Phase 5 extension host compatibility and native DAP debugging.

> [!IMPORTANT]
> Never overwrite or force-push an existing release tag. Each release must have a unique semantic version tag (e.g. `v0.2.0`).

---

## 2. Pre-Release Verification Checklist

Before creating any release candidate or pushing a tag:

1. **Working Tree Cleanliness:**
   ```bash
   git status
   # Ensure zero uncommitted files or unversioned debris
   ```
2. **Go Backend Verification:**
   ```bash
   cd services/forge-daemon
   go fmt ./...
   go vet ./...
   go test -v -race ./...
   cd ../..
   ```
3. **TypeScript & Monorepo Build:**
   ```bash
   npm run build
   ```
4. **Integration Test Suite (14 Automated Flows):**
   ```bash
   npm test
   # All 14 flows must pass 100%
   ```
5. **Version Consistency:**
   Ensure `0.2.0` is synchronized in:
   - `package.json`
   - `apps/desktop/package.json`
   - `apps/renderer/package.json`
   - `packages/shared-protocol/package.json`
   - `packages/design-system/package.json`

---

## 3. Step-by-Step Release Workflow

### Step 1: Update `CHANGELOG.md`
Add a dedicated section for the new version under Keep a Changelog standards:
```markdown
## [0.2.0] - 2026-10-28
### Added
- ...
### Changed
- ...
### Fixed
- ...
```

### Step 2: Compile Cross-Platform Daemon Artifacts
Run the cross-compilation pipeline:
```bash
npm run package:daemons
```
This generates stripped, standalone Go daemon binaries in `release-artifacts/`:
- `forge-daemon-darwin-arm64` (Apple Silicon M1/M2/M3/M4)
- `forge-daemon-darwin-amd64` (macOS Intel x86_64)
- `forge-daemon-linux-amd64` (Linux x86_64)
- `forge-daemon-linux-arm64` (Linux aarch64)
- `forge-daemon-windows-amd64.exe` (Windows x64)
- `SHA256SUMS.txt` (Cryptographic verification checksums)

### Step 3: Package Desktop Application
```bash
npm run package --workspace=@my-forge/desktop
```

### Step 4: Tag the Release in Git
```bash
git tag -a v0.2.0 -m "Release v0.2.0: Complete UI, Settings, LSP & Bottom Tool Window"
git push origin v0.2.0
```

### Step 5: Publish the GitHub Release
1. Open `https://github.com/manish-npx/forge/releases/new`.
2. Select tag `v0.2.0`.
3. Set title: `Forge IDE v0.2.0 — Complete UI, Settings, LSP & Bottom Tool Window`.
4. Paste verified release notes from `CHANGELOG.md`.
5. Attach the release binaries from `release-artifacts/` and `SHA256SUMS.txt`.
6. Click **Publish release**.

---

## 4. Code Signing & Notarization Reality

| Operating System | Requirement | Unsigned Community Behavior | Workaround / User Instructions |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Developer ID Application Certificate + `notarytool` | Gatekeeper displays *"App is damaged and can't be opened"* or unknown developer prompt. | User clears quarantine attribute: `xattr -cr /Applications/Forge.app` or right-clicks app and chooses **Open**. |
| **Windows** | Microsoft Authenticode EV / OV Certificate | Windows Defender SmartScreen displays *"Windows protected your PC"*. | User clicks **More info** → **Run anyway**. |
| **Linux** | GPG detached signature (`.asc`) | Package managers (APT/RPM) require imported public key. | Binary runs directly with `chmod +x` or through AppImage. |

> [!NOTE]
> Releases generated on public GitHub Actions without paid Apple/Microsoft signing certificates are distributed as **Unsigned Open Source Binaries**. The above verification workarounds must be clearly communicated in release notes to maintain transparency and user trust.
