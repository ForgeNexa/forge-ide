import type { FC } from 'react';

/**
 * Material Icon Theme Provider for Forge
 * Inspired by and compatible with PKief.material-icon-theme (MIT License)
 * Copyright (c) 2025 Material Extensions / Philipp Kief
 */

interface FileIconProps {
  fileName: string;
  isDir?: boolean;
  isOpen?: boolean;
  size?: number;
  iconTheme?: 'material-icon-theme' | 'minimal';
}

export const MaterialIcon: FC<FileIconProps> = ({
  fileName,
  isDir = false,
  isOpen = false,
  size = 16,
  iconTheme = 'material-icon-theme',
}) => {
  const lowerName = fileName.toLowerCase();

  // If Minimal Icon Theme is selected, render clean minimal shapes
  if (iconTheme === 'minimal') {
    if (isDir) {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.85, flexShrink: 0 }}>
          {isOpen ? (
            <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 14.5 5h-6.293a1 1 0 0 1-.707-.293L6.086 3.293A1 1 0 0 0 5.379 3H1.5z" />
          ) : (
            <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.207l-1.414-1.414A1.5 1.5 0 0 0 5.732 3H1.5z" />
          )}
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.7, flexShrink: 0 }}>
        <path d="M3 2h6.5L13 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
        <polyline points="9 2 9 6 13 6" />
      </svg>
    );
  }

  // --- Directory Icons ---
  if (isDir) {
    // Specific Folder Names
    if (lowerName === 'node_modules') {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3.5A1.5 1.5 0 0 0 0 5v7a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-6L7 3.5H1.5z" fill="#388bfd" opacity="0.3" />
          <path d="M1 5.5h14v6.5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-6.5z" fill="#4ade80" opacity="0.8" />
          <text x="5" y="11" fill="#121314" fontSize="7" fontWeight="bold">JS</text>
        </svg>
      );
    }
    if (lowerName === 'src' || lowerName === 'source') {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.2l-1.4-1.4A1.5 1.5 0 0 0 5.7 3H1.5z" fill="#38bdf8" />
          <path d="M5.5 7.5L3.5 9.5l2 2m5-4l2 2-2 2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (lowerName === 'test' || lowerName === 'tests' || lowerName === '__tests__') {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.2l-1.4-1.4A1.5 1.5 0 0 0 5.7 3H1.5z" fill="#10b981" />
          <path d="M7 6v2l-1.5 2.5a.7.7 0 0 0 .6 1h3.8a.7.7 0 0 0 .6-1L9 8V6" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    }
    if (lowerName === 'docs' || lowerName === 'doc') {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.2l-1.4-1.4A1.5 1.5 0 0 0 5.7 3H1.5z" fill="#a78bfa" />
          <path d="M5 7h6M5 9h4" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    if (lowerName === 'dist' || lowerName === 'build' || lowerName === 'out' || lowerName === 'bin') {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.2l-1.4-1.4A1.5 1.5 0 0 0 5.7 3H1.5z" fill="#f59e0b" />
          <circle cx="8" cy="9.5" r="2" stroke="#ffffff" strokeWidth="1.2" />
        </svg>
      );
    }
    if (lowerName === '.git') {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.2l-1.4-1.4A1.5 1.5 0 0 0 5.7 3H1.5z" fill="#f43f5e" />
        </svg>
      );
    }

    // Default Folder (Open vs Closed)
    if (isOpen) {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 14.5 5h-6.3a1 1 0 0 1-.7-.3L6.1 3.3A1 1 0 0 0 5.4 3H1.5z" fill="#d97706" />
          <path d="M1.5 6h13l-1.8 6H.3L1.5 6z" fill="#fbbf24" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.2l-1.4-1.4A1.5 1.5 0 0 0 5.7 3H1.5z" fill="#fbbf24" />
      </svg>
    );
  }

  // --- Specific Exact File Names ---
  if (lowerName === 'package.json' || lowerName === 'package-lock.json') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#cb3837" />
        <path d="M3 4v8h5V6h2v6h3V4H3z" fill="#ffffff" />
      </svg>
    );
  }

  if (lowerName === 'go.mod' || lowerName === 'go.sum') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#00add8" />
        <path d="M4 8.5C4 6.8 5.2 5.5 7 5.5c1.2 0 2.1.6 2.6 1.4L8.3 7.8c-.3-.5-.7-.8-1.3-.8-1 0-1.7.8-1.7 1.8 0 1 .7 1.8 1.7 1.8.8 0 1.3-.4 1.5-.9H7v-1.4h3.1v3.2H9l-.1-.7c-.5.6-1.2.9-2 .9-1.7 0-2.9-1.4-2.9-3.2z" fill="#ffffff" />
      </svg>
    );
  }

  if (lowerName === 'tsconfig.json' || lowerName.startsWith('tsconfig.')) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#3178c6" />
        <text x="3" y="11.5" fill="#ffffff" fontSize="8" fontWeight="bold">TS</text>
      </svg>
    );
  }

  if (lowerName === '.gitignore' || lowerName === '.gitattributes' || lowerName === '.gitmodules') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" fill="#f05032" />
        <path d="M5.5 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-2.5 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="#ffffff" />
        <path d="M5.5 7v4m5-4v2l-2.5 2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (lowerName === 'dockerfile' || lowerName.startsWith('docker-compose')) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#2496ed" />
        <path d="M3 8h2v2H3V8zm3 0h2v2H6V8zm3 0h2v2H9V8zm3 0h2v2h-2V8zM6 5h2v2H6V5zm3 0h2v2H9V5zm-4 7c1 1.5 4 1.5 6 0 1 0 2-.5 2-1H3c0 .5 1 1 2 1z" fill="#ffffff" />
      </svg>
    );
  }

  if (lowerName === 'readme.md' || lowerName === 'readme') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#0284c7" />
        <path d="M4 4.5h8M4 7h8M4 9.5h5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="11.5" cy="10.5" r="1.5" fill="#f59e0b" />
      </svg>
    );
  }

  if (lowerName === 'license' || lowerName === 'license.md' || lowerName === 'license.txt') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#eab308" />
        <path d="M5 4h6v8H5V4zm1 2h4m-4 2h4m-4 2h2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (lowerName === 'makefile') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#64748b" />
        <path d="M4 6l3 2.5L4 11m4 0h4" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (lowerName.startsWith('.env')) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="3" fill="#eab308" />
        <circle cx="6" cy="8" r="2" stroke="#ffffff" strokeWidth="1.2" />
        <path d="M8 8h4m-2-1v2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // --- File Extensions Mapping ---
  const ext = lowerName.includes('.') ? lowerName.split('.').pop() || '' : '';

  switch (ext) {
    case 'go':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#00add8" />
          <text x="2" y="11" fill="#ffffff" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">GO</text>
        </svg>
      );
    case 'ts':
    case 'tsx':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#3178c6" />
          <text x="2" y="11" fill="#ffffff" fontSize="7.5" fontWeight="bold">TS</text>
        </svg>
      );
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#f7df1e" />
          <text x="2.5" y="11" fill="#000000" fontSize="7.5" fontWeight="bold">JS</text>
        </svg>
      );
    case 'py':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#3776ab" />
          <text x="2" y="11" fill="#ffd43b" fontSize="7.5" fontWeight="bold">PY</text>
        </svg>
      );
    case 'rs':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#dea584" />
          <text x="2" y="11" fill="#000000" fontSize="7.5" fontWeight="bold">RS</text>
        </svg>
      );
    case 'json':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#f59e0b" />
          <text x="1.5" y="11" fill="#ffffff" fontSize="7" fontWeight="bold">&#123; &#125;</text>
        </svg>
      );
    case 'md':
    case 'markdown':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#0284c7" />
          <path d="M3 5.5v5l2-2.5 2 2.5v-5m4 2l1.5 2 1.5-2m-1.5-2v4" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'html':
    case 'htm':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#e34f26" />
          <path d="M4 4l1 7 3 1 3-1 1-7H4zm2 2h4l-.3 2.5-1.7.5-1.7-.5-.1-1" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#1572b6" />
          <text x="2" y="11" fill="#ffffff" fontSize="7" fontWeight="bold">CSS</text>
        </svg>
      );
    case 'yaml':
    case 'yml':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#cb171e" />
          <text x="2" y="11" fill="#ffffff" fontSize="6.5" fontWeight="bold">YML</text>
        </svg>
      );
    case 'sh':
    case 'bash':
    case 'zsh':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#4ade80" />
          <text x="2" y="11" fill="#000000" fontSize="7.5" fontWeight="bold">&gt;_</text>
        </svg>
      );
    case 'sql':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#e38c00" />
          <ellipse cx="8" cy="5" rx="5" ry="1.8" stroke="#ffffff" strokeWidth="1" />
          <path d="M3 5v5c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V5" stroke="#ffffff" strokeWidth="1" />
        </svg>
      );
    case 'svg':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect width="16" height="16" rx="3" fill="#10b981" />
          <circle cx="5.5" cy="5.5" r="1.5" fill="#ffffff" />
          <path d="M3 12l3-3 2 2 3-4 2 3H3z" fill="#ffffff" opacity="0.9" />
        </svg>
      );
    default:
      // Generic File with dog-ear
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.7, flexShrink: 0 }}>
          <path d="M3 2h6.5L13 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
          <polyline points="9 2 9 6 13 6" />
        </svg>
      );
  }
};
