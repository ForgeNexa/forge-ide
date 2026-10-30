# ForgeNexa Automated Website Deployment

This document explains the CI/CD deployment pipeline configured for the ForgeNexa public website hosted at [https://forgenexa.github.io/](https://forgenexa.github.io/).

---

## 1. GitHub Actions Pipeline Overview

The website deployment workflow is defined in `.github/workflows/deploy.yml` within the `ForgeNexa/ForgeNexa.github.io` repository.

### Workflow Configuration

```yaml
name: Deploy ForgeNexa Website to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Bun Runtime
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.4.4

      - name: Install Dependencies
        run: bun install --frozen-lockfile

      - name: Run Unit Tests
        run: bun test

      - name: Typecheck TypeScript
        run: bunx tsc --noEmit

      - name: Build Production Assets
        run: bun run build

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 2. Quality Gates

Before any deployment artifact is generated or published, three mandatory quality gates run in sequence:

1. **Bun Dependency Verification:** All packages are verified against `bun.lock` using `--frozen-lockfile` to prevent drift.
2. **Unit Tests (`bun test`):** Executes Vitest test suite (`src/products.test.ts`), validating that:
   - All 5 products exist with correct slug routes.
   - Statuses match official availability (`Available`, `In Development`, `Planned`).
   - GitHub and Documentation URLs are valid format.
3. **Static Typecheck (`bunx tsc --noEmit`):** Ensures 100% strict TypeScript compliance across all components and pages.

---

## 3. GitHub Pages Repository Settings

The `ForgeNexa.github.io` repository is configured with:
- **Build Type:** `workflow` (configured via GitHub REST API `/repos/ForgeNexa/ForgeNexa.github.io/pages`).
- **Source:** GitHub Actions.
- **Custom 404 Routing:** Handled by `public/404.html` redirect script to preserve SPA routes on page refreshes.

---

## 4. Deployment Verification

To verify that the deployment pipeline succeeded:
```bash
# Check status of latest workflow run
curl -s -H "Authorization: token <GITHUB_TOKEN>" \
  https://api.github.com/repos/ForgeNexa/ForgeNexa.github.io/actions/runs?per_page=1

# Verify live site HTTP status
curl -sI https://forgenexa.github.io/
```
Expected HTTP response: `HTTP/2 200 OK`.
