# Search Visibility & Technical SEO Guide

This document describes the technical search engine optimization (SEO), metadata specifications, social sharing integration, and search console configuration for **Forge IDE** (`https://manish-npx.github.io/forge/`).

---

## 1. Primary Metadata Architecture

The primary landing page (`apps/renderer/index.html`) implements modern HTML5 head tags conforming to W3C and major search engine standards:

| Tag | Value | Purpose |
| :--- | :--- | :--- |
| `<title>` | `Forge IDE — Fast, Lightweight Open Source Code Editor & IDE by Yantra Works` | Search engine results title (< 70 characters displayed) |
| `<meta name="description">` | `Forge (my-forge) is a fast, lightweight, distraction-free desktop & web IDE powered by Monaco Editor, a native Go workspace daemon, and local-first AI autocomplete. Built for developers by Yantra Works.` | Search snippet summary (155 characters) |
| `<meta name="keywords">` | `forge, forge ide, my-forge, yantra works, code editor, lightweight ide, vs code alternative, monaco editor, go daemon, web ide, local ai autocomplete, developer tools, open source ide` | Target discovery keywords |
| `<link rel="canonical">` | `https://manish-npx.github.io/forge/` | Prevents duplicate content indexing |
| `<meta name="robots">` | `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` | Instructs bots to index and generate rich snippets |
| `<meta name="theme-color">` | `#121314` | Matches browser frame to Forge's 2026 Dark UI |

---

## 2. Social Sharing & Card Cards (Open Graph / Twitter)

When shared on Twitter/X, Discord, Slack, LinkedIn, or GitHub discussions, Forge renders high-fidelity rich preview cards:

### Open Graph (Facebook / Slack / Discord / LinkedIn)
- `og:type`: `website`
- `og:url`: `https://manish-npx.github.io/forge/`
- `og:title`: `Forge IDE — Fast, Lightweight Open Source Code Editor & IDE`
- `og:description`: `A fast, distraction-free IDE combining Monaco Editor, a high-performance Go backend daemon, and local-first AI autocomplete. Open source under the MIT License.`
- `og:image`: `https://manish-npx.github.io/forge/og-preview.png`
- `og:site_name`: `Forge IDE`
- `og:locale`: `en_US`

### Twitter Card
- `twitter:card`: `summary_large_image`
- `twitter:title`: `Forge IDE — Fast, Lightweight Open Source Code Editor & IDE`
- `twitter:description`: `A fast, distraction-free IDE combining Monaco Editor, a high-performance Go backend daemon, and local-first AI autocomplete.`
- `twitter:image`: `https://manish-npx.github.io/forge/og-preview.png`

---

## 3. Schema.org JSON-LD Structured Data

Forge includes machine-readable JSON-LD data embedded directly in the `<head>` of the application:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://manish-npx.github.io/forge/#software",
      "name": "Forge IDE",
      "alternateName": ["my-forge", "Forge"],
      "description": "A fast, lightweight, distraction-free desktop and web IDE combining Monaco Editor, a native Go workspace daemon, and local-first AI code completion.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "macOS, Windows, Linux, Web",
      "softwareVersion": "0.2.0",
      "url": "https://manish-npx.github.io/forge/",
      "downloadUrl": "https://github.com/manish-npx/forge/releases/tag/v0.2.0",
      "license": "https://github.com/manish-npx/forge/blob/main/LICENSE",
      "author": {
        "@type": "Organization",
        "name": "Yantra Works",
        "url": "https://github.com/manish-npx"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://manish-npx.github.io/forge/#website",
      "url": "https://manish-npx.github.io/forge/",
      "name": "Forge IDE",
      "description": "Your workspace for building software. Fast, lightweight desktop & web code editor by Yantra Works.",
      "publisher": {
        "@type": "Organization",
        "name": "Yantra Works",
        "url": "https://github.com/manish-npx"
      }
    }
  ]
}
```

---

## 4. Search Engine Directives (`robots.txt` & `sitemap.xml`)

Located in `apps/renderer/public/`:

- **`robots.txt`**:
  ```txt
  User-agent: *
  Allow: /

  Sitemap: https://manish-npx.github.io/forge/sitemap.xml
  ```

- **`sitemap.xml`**:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://manish-npx.github.io/forge/</loc>
      <lastmod>2026-10-28</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>
  </urlset>
  ```

---

## 5. GitHub Pages Single-Page Application (SPA) 404 Routing

Because GitHub Pages does not support native server-side rewrites, deep links or refreshes to sub-routes (e.g. `https://manish-npx.github.io/forge/settings`) can return a generic 404.

Forge implements the battle-tested `rafgraph/spa-github-pages` protocol:
1. When a 404 occurs, `apps/renderer/public/404.html` captures the requested URL path and converts it into a redirect query string: `/?/subroute`.
2. `apps/renderer/index.html` receives the query string and uses `window.history.replaceState` to reconstruct the clean URL path before React loads.
3. This eliminates broken links and ensures search crawler accessibility.

---

## 6. Webmaster Tools Verification Steps

To verify domain ownership and accelerate indexing:

### Google Search Console
1. Visit [Google Search Console](https://search.google.com/search-console).
2. Choose **URL prefix**: `https://manish-npx.github.io/forge/`.
3. Verification method: Select **HTML tag** or **HTML file**.
   - If HTML tag: Add the provided `<meta name="google-site-verification" content="..." />` into `apps/renderer/index.html`.
4. Submit Sitemap: Enter `sitemap.xml` under Sitemaps tab.

### Bing Webmaster Tools
1. Visit [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Import verified site directly from Google Search Console (one click), or verify using HTML meta tag.
3. Submit `sitemap.xml`.
