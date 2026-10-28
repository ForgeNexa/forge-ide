/**
 * Electrobun Prototype Main Process for Forge IDE
 * Evaluates Bun runtime + Zig native layer + system WebKit/WebView2
 */

// In Electrobun, the main process runs on Bun
console.log('[Electrobun-Main] Starting Forge IDE experimental shell...');

// Prototype typed RPC and Window lifecycle
export interface ForgeElectrobunRPC {
  getSystemInfo: () => { runtime: string; os: string; arch: string };
  spawnGoDaemon: () => Promise<boolean>;
}

export const rpcHandlers: ForgeElectrobunRPC = {
  getSystemInfo: () => ({
    runtime: 'Bun + Electrobun v2.0.5',
    os: process.platform,
    arch: process.arch,
  }),
  spawnGoDaemon: async () => {
    console.log('[Electrobun-Main] Spawning Go daemon via Bun.spawn...');
    return true;
  },
};
