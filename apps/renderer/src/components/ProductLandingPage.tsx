import { type FC } from 'react';
import {
  IconPlay,
  IconTerminal,
  IconGit,
  IconGoGopher,
  IconSettings,
} from './Icons';

interface ProductLandingPageProps {
  onOpenWebIDE: () => void;
  version?: string;
  isDesktop?: boolean;
}

export const ProductLandingPage: FC<ProductLandingPageProps> = ({
  onOpenWebIDE,
  version = 'v0.3.0',
  isDesktop = false,
}) => {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--forge-bg-app)',
        color: 'var(--forge-text-primary)',
        fontFamily: 'var(--forge-font-ui)',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '1080px', width: '100%', display: 'flex', flexDirection: 'column', gap: 48 }}>
        {/* Navigation / Header Brand */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #297AA0 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '18px',
              }}
            >
              F
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px' }}>forge</span>
              <span style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginLeft: 8 }}>by Yantra Works</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a
              href="https://github.com/manish-npx/forge"
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--forge-text-secondary)',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              GitHub
            </a>
            <button
              onClick={onOpenWebIDE}
              style={{
                background: 'var(--forge-accent)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--forge-radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isDesktop ? 'Back to Editor' : 'Open Web IDE →'}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginTop: 12 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 14px',
              borderRadius: '20px',
              background: 'rgba(41, 122, 160, 0.15)',
              border: '1px solid rgba(41, 122, 160, 0.3)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--forge-accent)',
            }}
          >
            <span>✨ Forge Developer IDE</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{version} Released</span>
          </div>

          <h1
            style={{
              fontSize: '48px',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              lineHeight: 1.15,
              background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '6px 0',
            }}
          >
            Your workspace for building software.
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--forge-text-secondary)',
              maxWidth: '720px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            A fast, distraction-free desktop IDE combining the ergonomics of Visual Studio Code, the refined compact aesthetics of macOS CodeEdit, and a native compiled <strong>Go backend daemon</strong> for sub-millisecond workspace indexing.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={onOpenWebIDE}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--forge-accent)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 26px',
                borderRadius: 'var(--forge-radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(41, 122, 160, 0.35)',
              }}
            >
              <IconPlay />
              <span>{isDesktop ? 'Return to IDE Workspace' : 'Open Web IDE (In-Browser)'}</span>
            </button>

            <a
              href="https://github.com/manish-npx/forge"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--forge-bg-hover)',
                color: 'var(--forge-text-primary)',
                border: '1px solid var(--forge-border)',
                padding: '12px 22px',
                borderRadius: 'var(--forge-radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <IconGit />
              <span>Clone & Star on GitHub</span>
            </a>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--forge-text-muted)' }}>
            100% Local-First • Zero Mandatory Accounts • MIT Licensed • Native Go Daemon
          </div>
        </div>

        {/* Desktop vs Web Boundary Banner */}
        <div
          style={{
            background: 'var(--forge-bg-sidebar)',
            border: '1px solid var(--forge-border)',
            borderRadius: 'var(--forge-radius-lg)',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '16px' }}>💻</span>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Forge Desktop Application</span>
              <span className="forge-badge" style={{ background: 'var(--forge-success)', color: '#ffffff' }}>Full Power</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Full native experience with compiled Go daemon (`forge-daemon`), local file read/write, native Git SCM, multi-session interactive PTY terminal (`node-pty`), task runners, and local extension storage.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '16px' }}>🌐</span>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Forge Web IDE (Browser Edition)</span>
              <span className="forge-badge">Sandbox Preview</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Instant in-browser preview powered by Monaco Editor and web sandbox terminal. Designed for quick file previews, code inspection, and testing UI themes without requiring any desktop installation.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              Built from First Principles for Professional Developers
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', marginTop: 4 }}>
              Engineered with clean process boundaries, authentic 2026 Dark palette, and Material icons.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18 }}>
            {/* Card 1 */}
            <div className="forge-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="forge-feature-icon" style={{ color: 'var(--forge-accent)' }}>
                  <IconGoGopher />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Native Go Daemon (`forge-daemon`)</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                High-performance Go service communicating via line-delimited JSON-RPC 2.0 stdio. Indexes 50,000+ files recursively in milliseconds using parallel WalkDir without blocking the UI thread.
              </p>
            </div>

            {/* Card 2 */}
            <div className="forge-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="forge-feature-icon" style={{ color: 'var(--forge-accent)' }}>
                  <span>🎨</span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>2026 Dark Theme (Default)</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Authentic 2026 Dark focus theme created by <code>mrleemurray</code>. Features balanced neutral dark surfaces (`#121314`), subtle `#2A2B2C` borders, and deliberate `#297AA0` structural accents.
              </p>
            </div>

            {/* Card 3 */}
            <div className="forge-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="forge-feature-icon" style={{ color: '#f59e0b' }}>
                  <span>📁</span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Material Icon Theme (Default)</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Material Design icon theme by <code>PKief</code>. Recognizable icons for <code>go.mod</code>, <code>package.json</code>, <code>tsconfig.json</code>, <code>Dockerfile</code>, <code>.gitignore</code>, and nested folders.
              </p>
            </div>

            {/* Card 4 */}
            <div className="forge-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="forge-feature-icon" style={{ color: 'var(--forge-warning)' }}>
                  <IconTerminal />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>IntelliJ-Style Tool Window</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Resizable bottom tool-window layout with functional tabs for Terminal (multi-session), Problems, Multi-Channel Output, Debug Console REPL, Build & Tasks, and Test Results.
              </p>
            </div>

            {/* Card 5 */}
            <div className="forge-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="forge-feature-icon" style={{ color: 'var(--forge-success)' }}>
                  <IconGit />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Full Git Source Control</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Complete native Git workflow: branch creation & switching, staging/unstaging, discard modifications, commit authoring, and side-by-side Monaco DiffEditor comparison.
              </p>
            </div>

            {/* Card 6 */}
            <div className="forge-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="forge-feature-icon" style={{ color: '#38bdf8' }}>
                  <IconSettings />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Open VSX & Marketplace</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Search extensions from Open VSX registry, install/uninstall with disk persistence in <code>~/.forge/extensions</code>, and toggle enabled/disabled extension lifecycle state.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Platforms & Installation */}
        <div style={{ background: 'var(--forge-bg-sidebar)', padding: '28px', borderRadius: 'var(--forge-radius-lg)', border: '1px solid var(--forge-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 8 }}>
            🖥️ Supported Platforms & Desktop Installation
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', marginBottom: 16 }}>
            Forge runs natively across macOS (Apple Silicon & Intel), Windows, and Linux.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '12px', background: 'var(--forge-bg-app)', borderRadius: 'var(--forge-radius-md)', border: '1px solid var(--forge-border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>🍏 macOS</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: 4 }}>Darwin ARM64 / x86_64</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-success)', marginTop: 4 }}>Native traffic lights & zsh PTY</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--forge-bg-app)', borderRadius: 'var(--forge-radius-md)', border: '1px solid var(--forge-border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>🪟 Windows</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: 4 }}>Windows 10 / 11 x64</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-success)', marginTop: 4 }}>PowerShell & CMD support</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--forge-bg-app)', borderRadius: 'var(--forge-radius-md)', border: '1px solid var(--forge-border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>🐧 Linux</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: 4 }}>Ubuntu, Debian, Fedora x64</div>
              <div style={{ fontSize: '11px', color: 'var(--forge-success)', marginTop: 4 }}>Bash & glibc compatible</div>
            </div>
          </div>

          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 8 }}>Quick Start from Source:</div>
          <pre
            style={{
              fontFamily: 'var(--forge-font-code)',
              fontSize: '12px',
              lineHeight: 1.6,
              background: 'var(--forge-bg-app)',
              padding: '14px',
              borderRadius: 'var(--forge-radius-md)',
              border: '1px solid var(--forge-border-subtle)',
              overflowX: 'auto',
              color: 'var(--forge-text-primary)',
              margin: 0,
            }}
          >
{`# 1. Clone repository
git clone https://github.com/manish-npx/forge.git
cd forge

# 2. Install dependencies & build daemon
npm install
npm run build

# 3. Launch Forge Desktop IDE
npm start`}
          </pre>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: 24,
            borderTop: '1px solid var(--forge-border)',
            color: 'var(--forge-text-muted)',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <div>
            <strong>forge</strong> by <strong>Yantra Works</strong> • Distributed under the MIT License
          </div>
          <div>
            <button
              onClick={onOpenWebIDE}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--forge-accent)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              Launch Web IDE Preview &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
