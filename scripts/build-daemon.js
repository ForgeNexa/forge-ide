const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const daemonDir = path.resolve(__dirname, '../services/forge-daemon');
const binDir = path.join(daemonDir, 'bin');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const targetName = isWin ? 'bin/forge-daemon.exe' : 'bin/forge-daemon';
console.log(`[build-daemon] Building forge-daemon for ${process.platform} -> ${targetName}`);

execSync(`go build -o ${targetName} cmd/forge-daemon/main.go`, {
  cwd: daemonDir,
  stdio: 'inherit',
});

// On Windows, ensure both forge-daemon.exe and forge-daemon exist for full compatibility
if (isWin) {
  try {
    fs.copyFileSync(path.join(daemonDir, targetName), path.join(binDir, 'forge-daemon'));
  } catch (err) {
    console.warn('[build-daemon] Notice: could not create extensionless alias on Windows:', err.message);
  }
}

console.log('[build-daemon] Daemon build completed successfully.');
