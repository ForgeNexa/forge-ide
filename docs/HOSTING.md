# ForgeNexa Hosting and Custom Domain Guide

This document details the hosting architecture for ForgeNexa web properties, zero-cost operational model, and guidelines for future custom domain configuration.

---

## 1. Hosting Architecture and Zero-Cost Strategy

ForgeNexa leverages **GitHub Pages** as its primary hosting platform:
- **Cost:** \$0/month (Free tier included with GitHub Organization).
- **SSL / TLS:** Free automated certificates issued and rotated by Let's Encrypt through GitHub's edge network.
- **CDN:** Global CDN acceleration backed by Fastly edge caches and GitHub edge routing.
- **Uptime & SLA:** High-availability static delivery with zero backend server maintenance.

---

## 2. Organization vs User Repositories

Because the organization name is `ForgeNexa`, naming the repository `ForgeNexa.github.io` automatically routes it to the root domain:
- **Repository:** `ForgeNexa/ForgeNexa.github.io`
- **Root URL:** `https://forgenexa.github.io/`

Sub-repositories within the organization (e.g. `ForgeNexa/forge`) can also serve subpaths (e.g., `https://forgenexa.github.io/forge/`) if needed, but all products are currently indexed under the central portal.

---

## 3. Future Custom Domain Setup (Optional)

If ForgeNexa acquires a custom apex domain (such as `forgenexa.com` or `forgenexa.dev`):

### Step A: DNS Record Configuration
Configure the domain registrar's DNS records:

1. **Apex Domain (`forgenexa.dev`):**
   - Add four `A` records pointing to GitHub's IP addresses:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - Add four `AAAA` records for IPv6:
     ```
     2606:50c0:8000::153
     2606:50c0:8001::153
     2606:50c0:8002::153
     2606:50c0:8003::153
     ```

2. **Subdomain (`www.forgenexa.dev`):**
   - Add a `CNAME` record:
     ```
     CNAME: forgenexa.github.io
     ```

### Step B: GitHub Repository Configuration
1. In `ForgeNexa/ForgeNexa.github.io` settings under **Pages** > **Custom domain**, enter the custom domain name.
2. Check **Enforce HTTPS** once the DNS check passes and the certificate is provisioned.
3. Add a `CNAME` file to the root `public/` folder in the repository containing the domain name.
