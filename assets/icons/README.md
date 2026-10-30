# Forge IDE — Icon & Branding Specification

**Organization:** ForgeNexa  
**Product:** Forge IDE (branded as `forge` / `my-forge`)

---

## 1. Icon Concept & Geometry

The Forge brand mark represents a modern anvil infused with a rising generative code spark. It symbolizes precision craftsmanship, software durability, and accelerated development.

- **Master Vector File:** `assets/icons/forge.svg`
- **Color Palette:**
  - Steel Shadow: `#0F1115` to `#1E222B`
  - Cobalt Anvil Face: `#0D419D` to `#388BFD`
  - Electric Spark Highlight: `#79C0FF`
  - Molten Flame: `#FF5722` (crimson) → `#FF9800` (amber) → `#FFEB3B` (gold)

---

## 2. Multi-Resolution Export Targets

When generating release packages via `electron-builder` or OS packagers:

| Platform | Format | Target Resolutions | Destination |
| :--- | :--- | :--- | :--- |
| **macOS** | `.icns` | 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024 (Retina) | `assets/icons/icon.icns` |
| **Windows** | `.ico` | 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256 | `assets/icons/icon.ico` |
| **Linux** | `.png` | 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512 | `/usr/share/icons/hicolor/...` |
| **Web Favicon**| `.svg` / `.png` | 32x32, 192x192, 512x512 | `apps/renderer/public/favicon.svg` |

---

## 3. Desktop Integration

- **Linux Desktop Entry:** `assets/forge.desktop`
- **MIME Associations:** `text/plain`, `inode/directory`, programming language source files (`.go`, `.ts`, `.py`, `.rs`, `.c`, etc.).
