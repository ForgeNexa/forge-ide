# Contributing to Forge IDE

Thank you for your interest in contributing to **Forge IDE**! Forge is an open-source, local-first code editor and IDE developed by **ForgeNexa** and the community.

We value contributions of all kinds: code improvements, bug fixes, documentation, language server configurations, accessibility enhancements, testing, and UI refinements.

---

## 1. Code of Conduct

All contributors and participants are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all community members with empathy, respect, and constructive collaboration.

---

## 2. Prerequisites

To build and test Forge locally, ensure you have installed:
- **Node.js:** v20.x or v22.x LTS (compatible with v24+)
- **Go:** 1.23+
- **Git**
- **C/C++ Build Tools:** Xcode Command Line Tools on macOS (`xcode-select --install`), `build-essential` on Linux, or Visual Studio C++ Build Tools on Windows (required for native `node-pty` compilation).

---

## 3. Development Workflow

### Step 1: Fork and Clone
```bash
git clone https://github.com/<your-username>/forge.git
cd forge
```

### Step 2: Install Dependencies & Build
```bash
npm install
npm run build
```

### Step 3: Create a Feature Branch
Always work on a dedicated, descriptively named branch branched off `main`:
```bash
git checkout -b feat/your-feature-name
# or: git checkout -b fix/issue-description
```

### Step 4: Run the Development Server
```bash
npm run dev
```
This runs the Go daemon, Vite dev server, and Electron desktop shell concurrently with Hot Module Replacement (HMR).

---

## 4. Running Tests & Quality Verification

Before committing or opening a pull request, verify that all test suites pass with zero errors:

```bash
# 1. Run complete automated test suite (Go unit tests, race detector, TypeScript contract tests, and functional flows)
npm test

# 2. Run Go tests specifically
npm run test:go

# 3. Verify TypeScript build
npm run build
```

---

## 5. Submitting a Pull Request

1. **Keep Changes Focused:** A pull request should address a single cohesive feature, bug fix, or improvement.
2. **Follow Conventions:** Follow Semantic Versioning and [Keep a Changelog](https://keepachangelog.com/) for documentation updates.
3. **Write Tests:** Add or update integration tests in `tests/functional_flows.test.ts` or Go unit tests in `services/forge-daemon/`.
4. **Never Commit Secrets:** Do not commit API keys, personal access tokens, private `.env` files, or binary build artifacts.
5. **Open Pull Request:** Push your branch and open a PR against `main`. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely, including test logs and screenshots for UI changes.

---

## 6. Reporting Bugs & Requesting Features

- **Bug Reports:** Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) with exact reproduction steps, OS/architecture details, and relevant console/daemon logs.
- **Feature Requests:** Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) describing the user problem, proposed API or UI interaction, and any alternative solutions considered.
