# ForgeNexa SEO & Search Visibility Regression Testing

**Document Revision:** 1.0.0  
**Target Domain:** `https://forgenexa.github.io/`  
**Target Brand:** `ForgeNexa`  

---

## 1. Executive Summary

Search visibility for new domains and branded terms is governed by automated search engine crawlers (principally Googlebot). Googlebot operates a **Two-Wave Indexing System**:

- **Wave 1 (Instant / Static HTML)**: Googlebot retrieves the initial HTTP response and indexes all text, semantic headings, meta tags, and outbound links directly found in the HTML source without running JavaScript. If `<div id="root">` is empty, Googlebot initially indexes a blank page with zero keywords.
- **Wave 2 (Deferred Web Rendering Service - WRS)**: Headless Chromium renders the JavaScript bundle when rendering resources are allocated. For new or low-authority domains, Wave 2 rendering can be queued for hours to multiple weeks.

To guarantee immediate discoverability and prevent brand misspellings (e.g., "ForceNexa" or "Forgexa"), the public portal has been upgraded with **Pre-rendered Semantic HTML**, **Schema.org Structured Data**, and **Canonical Sitemaps**.

---

## 2. Automated Regression Checklist

| Test Item | Specification | Status | Verification Method |
|---|---|---|---|
| **Wave 1 HTML Content** | `#root` must contain complete semantic headings (`<h1>`, `<h2>`, `<h3>`), paragraphs, and navigation links before JS loads. | **PASSED** | `curl -s https://forgenexa.github.io/ \| grep -q "ForgeNexa — Open Developer Tools Ecosystem"` |
| **Schema.org JSON-LD** | `<script type="application/ld+json">` declaring `Organization`, `WebSite`, and `SoftwareApplication` for all tools. | **PASSED** | Rich Results Validator / JSON-LD parsing |
| **Canonical URL** | `<link rel="canonical" href="https://forgenexa.github.io/" />` present in `<head>`. | **PASSED** | Inspect `<head>` |
| **Robots Directives** | `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />` | **PASSED** | Verified in `index.html` |
| **Clean Sitemap** | `public/sitemap.xml` must NOT contain URL fragments (`#`). Sitemaps with `#` are treated as duplicate roots by Googlebot. | **PASSED** | Verified `sitemap.xml` contains canonical URLs without fragments |
| **Dynamic 404 Assets** | `404.html` must match `index.html` dynamically on every build to prevent broken asset bundles during client-side deep links. | **PASSED** | `cp dist/index.html dist/404.html` in build script |
| **Brand Integrity** | Zero references to legacy names ("Yantra") in public website assets, metadata, or source code. | **PASSED** | `grep -ri "yantra" /tmp/forgenexa-site/src` returns 0 results |

---

## 3. Webmaster Actions & Monitoring Protocol

While static HTML pre-rendering ensures immediate indexing when crawled, domain-level ranking and indexing progression require standard search engine administrative verification:

### Step 1: Google Search Console Verification
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Add Property -> **URL prefix**: `https://forgenexa.github.io/`.
3. Choose **HTML tag** verification method.
4. Replace the placeholder in `index.html`:
   ```html
   <meta name="google-site-verification" content="YOUR_TOKEN_HERE" />
   ```
5. Click **Verify** in Google Search Console.

### Step 2: Submit Sitemap
1. In Search Console, select **Sitemaps** from the left navigation.
2. Enter `sitemap.xml` and submit.
3. Verify status changes to **Success**.

### Step 3: Request URL Inspection & Indexing
1. Use the **URL Inspection** bar at the top of Google Search Console.
2. Enter `https://forgenexa.github.io/`.
3. Click **Test Live URL** -> confirm that Googlebot sees the pre-rendered HTML and screenshot.
4. Click **Request Indexing**.

---

## 4. Verification Script

To run automated regressions against the live website:

```bash
#!/usr/bin/env bash
set -e

SITE="https://forgenexa.github.io"
echo "Verifying $SITE..."

# 1. Check HTTP Status
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/")
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAIL: Expected 200, got $HTTP_CODE"
  exit 1
fi

# 2. Check Semantic Content (Wave 1)
HTML=$(curl -s "$SITE/")
if ! echo "$HTML" | grep -q "ForgeNexa — Open Developer Tools Ecosystem"; then
  echo "FAIL: Missing pre-rendered hero heading"
  exit 1
fi

if ! echo "$HTML" | grep -q "application/ld+json"; then
  echo "FAIL: Missing Schema.org JSON-LD"
  exit 1
fi

# 3. Check Sitemap
SITEMAP=$(curl -s "$SITE/sitemap.xml")
if echo "$SITEMAP" | grep -q "#"; then
  echo "FAIL: Sitemap contains URL hash fragments"
  exit 1
fi

echo "ALL SEO REGRESSION CHECKS PASSED."
```
