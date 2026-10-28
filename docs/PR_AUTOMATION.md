# Automated Pull Request & Safe Merging Guide

**Author:** Principal Release & DevOps Engineer  
**Date:** 2026-10-28  
**Repository:** `https://github.com/manish-npx/forge`  
**Base Branch:** `main` (Protected)  

---

## 1. Overview & Core Philosophy

To enable high-velocity development without sacrificing stability or security, Forge IDE implements an automated, quality-gated GitHub development workflow:
1. **Agents and contributors work exclusively on dedicated feature branches** (`feat/*`, `fix/*`, `perf/*`, `docs/*`).
2. **Every pull request must satisfy automated quality gates** (TypeScript compile, Go tests with race detection, monorepo production build, 15 end-to-end integration flows, and security audit).
3. **Eligible, routine, low-risk pull requests can be automatically merged** once all required checks pass and branch protection rules are satisfied.
4. **Sensitive changes strictly require human authorization** and cannot be auto-merged.

---

## 2. The Automated PR Lifecycle

```
[1. Developer / Agent]
     │
     ├─> Create feature branch: `git checkout -b feat/<topic>`
     ├─> Implement changes + add unit & integration tests
     ├─> Run local validation: `npm run build && npm test && npm audit`
     └─> Push branch: `git push origin feat/<topic>`
     │
[2. Open Pull Request]
     │
     ├─> Open PR targeting `main`: `gh pr create --title "..." --body "..."`
     └─> Flag auto-merge eligibility: `gh pr merge --auto --squash`
     │
[3. GitHub Actions CI Quality Gates]
     │
     ├─> Lint & TypeScript Check (TypeScript 7.0.2 `tsc`)
     ├─> Go Daemon Tests (Go 1.26 `go test -v -race ./...`)
     ├─> Monorepo Production Build (`npm run build`)
     ├─> End-to-End Flow Tests (`tests/functional_flows.test.ts`)
     └─> Security Vulnerability Audit (`npm audit`)
     │
[4. Automatic Squash & Merge (If Eligible)]
     │
     ├─> All CI checks PASS
     ├─> Branch protection satisfied
     └─> Merged into `main` using Squash & Merge
```

---

## 3. Required Safeguards & Merge Policies

### Strict Safeguards (Never Bypassed)
- **Zero Direct Pushes to `main`:** The `main` branch is protected. All changes must arrive via pull requests.
- **Zero Force-Pushes:** `git push --force` is prohibited across all branches to guarantee revision history integrity.
- **Zero CI Weakening:** Test requirements, linters, and type checkers must never be disabled or relaxed to make a merge succeed.
- **Zero Merges on Failing Checks:** If any CI check, unit test, or flow test fails, auto-merge is immediately aborted.

### Human Review Mandatory For Sensitive Changes
Auto-merge is strictly **disabled** and requires explicit human review and approval for:
1. **Desktop Shell & Framework Replacements:** Migrating from Electron to Electrobun, Wails, or Tauri.
2. **Major Toolchain & Runtime Upgrades:** Major version upgrades to Node.js, Go, or Electron.
3. **Security-Sensitive Changes:** Authentication tokens, IPC contextBridge exposure, secret redaction, or cryptographic routines.
4. **Release Publication:** Tagging new SemVer releases (`v0.3.0`, `v1.0.0`), publishing binaries, or uploading checksums.
5. **Permissions & Workflows:** Modifications to `.github/workflows/` or repository administrative settings.
6. **Destructive Operations:** Deletion of branches, removal of existing features, or database/file clearing.

---

## 4. Enabling Auto-Merge in GitHub Repository Settings

To enable GitHub native auto-merge for this repository:

1. **Repository Settings &rarr; General &rarr; Pull Requests:**
   - Check **Allow auto-merge**.
   - Check **Automatically delete head branches**.
   - Select **Allow squash merging** (Recommended merge strategy).
2. **Repository Settings &rarr; Branches &rarr; Branch protection rules (`main`):**
   - Check **Require a pull request before merging**.
   - Check **Require status checks to pass before merging**:
     - `ci / quality-gates`
   - Check **Require branches to be up to date before merging**.
   - Check **Do not allow bypassing the above settings**.

---

## 5. GitHub CLI (`gh`) Automation Commands

### Opening a PR and Enabling Auto-Merge
```bash
# 1. Ensure local tests pass
npm run build && npm test

# 2. Push feature branch
git push -u origin feat/your-feature-name

# 3. Create PR and immediately enable auto-merge
gh pr create \
  --base main \
  --head feat/your-feature-name \
  --title "feat: descriptive title following Conventional Commits" \
  --body "Summary of changes, tests added, and verification evidence."

# 4. Enable auto-merge with squash strategy
gh pr merge --auto --squash
```

### Checking PR and Auto-Merge Status
```bash
# Check status of PR checks
gh pr checks

# View current auto-merge status
gh pr view --json autoMergeRequest,mergeable,state
```

---

## 6. Troubleshooting Auto-Merge Failures

| Symptom | Cause | Resolution |
|---|---|---|
| `GraphQL: Auto merge is not allowed for this repository` | Repository setting "Allow auto-merge" is disabled | Enable "Allow auto-merge" in GitHub repository settings under General &rarr; Pull Requests. |
| `Pull request is not mergeable` | Merge conflicts with base branch (`main`) | Rebase or merge `main` into the feature branch: `git merge main`, resolve conflicts, test, and push. |
| `Required status checks are pending` | CI workflow is still running | Auto-merge will trigger automatically as soon as the last required check passes. |
| `Required reviews not satisfied` | Branch protection requires approval from a CODEOWNER or human reviewer | Request review from the repository owner; auto-merge will proceed once approved. |
