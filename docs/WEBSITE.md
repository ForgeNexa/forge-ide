# ForgeNexa Public Website Architecture

This document describes the architecture, technology stack, directory structure, and interactive demo designs of the primary ForgeNexa public portal, hosted at [https://forgenexa.github.io/](https://forgenexa.github.io/).

---

## 1. Overview and Objectives

The ForgeNexa website serves as the developer portal, documentation center, and ecosystem hub for all ForgeNexa products:
1. **Forge IDE** — Developer desktop environment (Available v0.2.1).
2. **Forge API** — Local-first API workbench and testing client (In Development).
3. **Forge Terminal** — GPU-accelerated multiplexed terminal emulator (In Development).
4. **Forge Git** — Graph-centric Git visualizer and visual merge suite (In Development).
5. **Forge Hub** — Central developer orchestration, plugin registry, and dashboard (Planned).

### Hosting & Infrastructure
- **Domain:** `https://forgenexa.github.io/`
- **Hosting Tier:** 100% Free via GitHub Pages.
- **Repository:** `ForgeNexa/ForgeNexa.github.io`
- **Deployment Engine:** GitHub Actions with workflow dispatch and push triggers on `main`.

---

## 2. Technology Stack

- **Runtime & Package Manager:** Bun 1.4.4 for high-speed builds, local development, and reproducible lockfiles (`bun.lock`).
- **Core Framework:** React 19.
- **Type Safety:** TypeScript 5.8 (with strict typing across data definitions and UI components).
- **Bundler:** Vite 6 with `@vitejs/plugin-react`.
- **Styling:** Tailwind CSS 3.4 with custom Forge dark theme tokens (`#0F1115`, `#161B22`, `#58A6FF`, `#3FB950`, `#BC8CFF`).
- **Icons:** Lucide React (`lucide-react`).
- **Testing:** Vitest 3.0.

---

## 3. Directory Layout in `ForgeNexa.github.io`

```
ForgeNexa.github.io/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated CI/CD pipeline for GitHub Pages
├── public/
│   ├── 404.html                # Single Page App fallback routing
│   ├── favicon.svg             # ForgeNexa geometric anvil/hexagon logo
│   ├── og-image.svg            # Social media OpenGraph banner
│   ├── robots.txt              # Search crawler directives
│   └── sitemap.xml             # Complete XML sitemap with all routes
├── src/
│   ├── components/
│   │   ├── Artworks.tsx        # Custom vector hero graphics per product
│   │   ├── InteractiveDemos.tsx# Functional browser-based interactive product demos
│   │   └── Layout.tsx          # Navbar, Footer, and ProductHero shell
│   ├── data/
│   │   └── products.ts         # Central product catalog with truthful status
│   ├── App.tsx                 # Main hash-routed SPA shell & view controller
│   ├── index.css               # Tailwind CSS directives & custom scrollbars
│   ├── main.tsx                # React DOM root entry point
│   └── products.test.ts        # Unit test suite verifying catalog integrity
├── bun.lock                    # Frozen Bun package lockfile
├── index.html                  # HTML5 entry template with SEO metadata
├── package.json                # Project dependencies and script declarations
├── postcss.config.js           # PostCSS configuration for Tailwind
├── tailwind.config.js          # Tailwind theme and brand color palettes
├── tsconfig.json               # TypeScript compiler configuration
├── tsconfig.node.json          # Node/bundler TypeScript settings
└── vite.config.ts              # Vite configuration
```

---

## 4. Interactive Product Demos

Each product features a working, client-side interactive demo running natively in the browser without requiring a backend:

1. **Forge IDE Demo (`src/components/InteractiveDemos.tsx`):**
   - Interactive file explorer (`main.go`, `config.yaml`, `README.md`).
   - Live code editor with line numbers and syntax highlighting.
   - Docked diagnostic terminal with toggleable outputs.

2. **Forge API Demo:**
   - Method selector (`GET`, `POST`, `PUT`, `DELETE`).
   - Customizable request endpoint, headers, and request body.
   - Interactive "Send Request" trigger returning formatted JSON responses with simulated latency (18ms).

3. **Forge Terminal Demo:**
   - Multi-tab terminal manager (`bash`, `zsh`, `htop`).
   - Clickable interactive command palette (`ls -la`, `git status`, `go test ./...`, `uname -a`).
   - Color theme switcher (Monokai, Dracula, Nord, Cyberpunk).

4. **Forge Git Demo:**
   - Interactive visual commit graph with branches (`main`, `feat/auth`).
   - Clickable commits displaying commit message, author, SHA, and affected files.
   - Side-by-side / inline diff viewer.

5. **Forge Hub Demo:**
   - Central ecosystem launchpad showing real-time connectivity status across installed tools.
   - Integrated system metrics and plugin store preview.

---

## 5. Development & Testing Instructions

To run or build the website locally:

```bash
# Clone the repository
git clone https://github.com/ForgeNexa/ForgeNexa.github.io.git
cd ForgeNexa.github.io

# Install dependencies using Bun
bun install --frozen-lockfile

# Run unit tests
bun test

# Start local development server
bun dev

# Build production bundle
bun run build
```
