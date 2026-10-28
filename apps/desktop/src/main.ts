import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'node:path';
import { DaemonManager } from './daemonManager';

let mainWindow: BrowserWindow | null = null;
const daemon = new DaemonManager();

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 800,
    minHeight: 540,
    title: 'my-forge — Your workspace for building software',
    backgroundColor: '#121417',
    titleBarStyle: 'hiddenInset', // Sleek native macOS traffic lights integrated into top bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || Boolean(process.env.VITE_DEV_SERVER_URL);

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log(`[Main] Loading development URL: ${devUrl}`);
    await mainWindow.loadURL(devUrl);
    // mainWindow.webContents.openDevTools();
  } else {
    const distPath = path.join(__dirname, '../../renderer/dist/index.html');
    console.log(`[Main] Loading production bundle: ${distPath}`);
    await mainWindow.loadFile(distPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIPCHandlers() {
  ipcMain.handle('daemon:getInfo', async () => {
    return daemon.call('initialize');
  });

  ipcMain.handle('daemon:getHealth', async () => {
    return daemon.getHealth();
  });

  ipcMain.handle('daemon:setWorkspaceFolder', async (_, folderPath: string) => {
    return daemon.setWorkspaceFolder(folderPath);
  });

  ipcMain.handle('daemon:getWorkspaceFolder', async () => {
    return daemon.getWorkspaceFolder();
  });

  ipcMain.handle('daemon:indexWorkspace', async () => {
    return daemon.indexWorkspace();
  });

  ipcMain.handle('daemon:listDirectory', async (_, relPath?: string) => {
    return daemon.listDirectory(relPath || '');
  });

  ipcMain.handle('daemon:searchFiles', async (_, query: string, limit?: number) => {
    return daemon.searchFiles(query, limit);
  });

  ipcMain.handle('daemon:readFile', async (_, filePath: string) => {
    return daemon.readFile(filePath);
  });

  ipcMain.handle('daemon:writeFile', async (_, filePath: string, content: string) => {
    return daemon.writeFile(filePath, content);
  });

  // Native File/Folder Dialogs
  ipcMain.handle('dialog:openFolder', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Open Workspace Folder',
    });
    if (res.canceled || res.filePaths.length === 0) {
      return null;
    }
    const selected = res.filePaths[0];
    await daemon.setWorkspaceFolder(selected);
    await daemon.indexWorkspace();
    return selected;
  });

  ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: 'Open File',
    });
    if (res.canceled || res.filePaths.length === 0) {
      return null;
    }
    return res.filePaths[0];
  });

  // Window Controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
}

app.whenReady().then(async () => {
  try {
    console.log('[Main] Starting Go daemon...');
    await daemon.start();
    registerIPCHandlers();
    await createWindow();

    // Auto-set current working directory as default workspace for developer convenience
    const currentWd = process.cwd();
    try {
      await daemon.setWorkspaceFolder(currentWd);
      await daemon.indexWorkspace();
      console.log(`[Main] Initialized workspace to: ${currentWd}`);
    } catch (e) {
      console.warn('[Main] Could not auto-set default workspace:', e);
    }
  } catch (err) {
    console.error('[Main] Failed during startup:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', async () => {
  console.log('[Main] Quitting app, stopping Go daemon...');
  await daemon.stop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
