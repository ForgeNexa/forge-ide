import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'node:path';
import { DaemonManager } from './daemonManager';
import { GitManager } from './gitManager';
import { TerminalManager } from './terminalManager';
import { RunnerManager } from './runnerManager';
import { SettingsManager } from './settingsManager';

let mainWindow: BrowserWindow | null = null;
let currentWorkspace = process.cwd();

const daemon = new DaemonManager();
const git = new GitManager();
const runner = new RunnerManager();
const settings = new SettingsManager();
const terminal = new TerminalManager(() => mainWindow);

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 800,
    minHeight: 540,
    title: 'forge — Your workspace for building software',
    backgroundColor: '#121417',
    titleBarStyle: 'hiddenInset',
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
  // Daemon methods
  ipcMain.handle('daemon:getInfo', async () => daemon.call('initialize'));
  ipcMain.handle('daemon:getHealth', async () => daemon.getHealth());
  ipcMain.handle('daemon:setWorkspaceFolder', async (_, folderPath: string) => {
    currentWorkspace = folderPath;
    settings.addRecentWorkspace(folderPath);
    return daemon.setWorkspaceFolder(folderPath);
  });
  ipcMain.handle('daemon:getWorkspaceFolder', async () => daemon.getWorkspaceFolder());
  ipcMain.handle('daemon:indexWorkspace', async () => daemon.indexWorkspace());
  ipcMain.handle('daemon:listDirectory', async (_, relPath?: string) => daemon.listDirectory(relPath || ''));
  ipcMain.handle('daemon:searchFiles', async (_, query: string, limit?: number) => daemon.searchFiles(query, limit));
  ipcMain.handle('daemon:searchContent', async (_, query: string, options?: any) =>
    daemon.searchContent(query, options)
  );
  ipcMain.handle('daemon:readFile', async (_, filePath: string) => daemon.readFile(filePath));
  ipcMain.handle('daemon:writeFile', async (_, filePath: string, content: string) =>
    daemon.writeFile(filePath, content)
  );

  // File and folder CRUD
  ipcMain.handle('fs:createFile', async (_, relPath: string, content = '') =>
    daemon.createFile(relPath, content)
  );
  ipcMain.handle('fs:createFolder', async (_, relPath: string) => daemon.createFolder(relPath));
  ipcMain.handle('fs:renameEntry', async (_, oldRelPath: string, newRelPath: string) =>
    daemon.renameEntry(oldRelPath, newRelPath)
  );
  ipcMain.handle('fs:deleteEntry', async (_, relPath: string) => daemon.deleteEntry(relPath));
  ipcMain.handle('fs:showInFolder', async (_, relPath: string) => {
    const fullPath = path.isAbsolute(relPath) ? relPath : path.join(currentWorkspace, relPath);
    shell.showItemInFolder(fullPath);
    return true;
  });

  // Native File/Folder Dialogs
  ipcMain.handle('dialog:openFolder', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Open Workspace Folder',
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const selected = res.filePaths[0];
    currentWorkspace = selected;
    settings.addRecentWorkspace(selected);
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
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (_, defaultName?: string) => {
    if (!mainWindow) return null;
    const res = await dialog.showSaveDialog(mainWindow, {
      title: 'Save File As',
      defaultPath: defaultName ? path.join(currentWorkspace, defaultName) : currentWorkspace,
    });
    if (res.canceled || !res.filePath) return null;
    return res.filePath;
  });

  // Git operations
  ipcMain.handle('git:getStatus', async () => git.getStatus(currentWorkspace));
  ipcMain.handle('git:stageFile', async (_, filePath: string) => git.stageFile(currentWorkspace, filePath));
  ipcMain.handle('git:unstageFile', async (_, filePath: string) => git.unstageFile(currentWorkspace, filePath));
  ipcMain.handle('git:stageAll', async () => git.stageAll(currentWorkspace));
  ipcMain.handle('git:unstageAll', async () => git.unstageAll(currentWorkspace));
  ipcMain.handle('git:discardChanges', async (_, filePath: string) =>
    git.discardChanges(currentWorkspace, filePath)
  );
  ipcMain.handle('git:commit', async (_, message: string) => git.commit(currentWorkspace, message));
  ipcMain.handle('git:getDiff', async (_, filePath: string, staged?: boolean) =>
    git.getDiff(currentWorkspace, filePath, staged)
  );
  ipcMain.handle('git:getBranches', async () => git.getBranches(currentWorkspace));
  ipcMain.handle('git:switchBranch', async (_, branch: string) => git.switchBranch(currentWorkspace, branch));
  ipcMain.handle('git:createBranch', async (_, branch: string) => git.createBranch(currentWorkspace, branch));

  // Terminal PTY
  ipcMain.handle('terminal:create', async (_, options?: { cwd?: string; cols?: number; rows?: number }) => {
    return terminal.createTerminal(options?.cwd || currentWorkspace, options?.cols, options?.rows);
  });
  ipcMain.handle('terminal:write', async (_, id: string, data: string) => {
    terminal.write(id, data);
  });
  ipcMain.handle('terminal:resize', async (_, id: string, cols: number, rows: number) => {
    terminal.resize(id, cols, rows);
  });
  ipcMain.handle('terminal:close', async (_, id: string) => {
    terminal.close(id);
  });

  // Runner
  ipcMain.handle('runner:runFile', async (_, filePath: string) => {
    return runner.runFile(filePath, currentWorkspace);
  });

  // Settings
  ipcMain.handle('settings:get', async () => settings.getSettings());
  ipcMain.handle('settings:save', async (_, patch: any) => settings.saveSettings(patch));
  ipcMain.handle('settings:getRecentWorkspaces', async () => settings.getRecentWorkspaces());

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

function setupNativeMenu() {
  const isMac = process.platform === 'darwin';
  const template: any[] = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (mainWindow) {
              const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
              if (!res.canceled && res.filePaths[0]) {
                const selected = res.filePaths[0];
                currentWorkspace = selected;
                settings.addRecentWorkspace(selected);
                await daemon.setWorkspaceFolder(selected);
                await daemon.indexWorkspace();
                mainWindow.webContents.reload();
              }
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  try {
    console.log('[Main] Starting Go daemon...');
    await daemon.start();
    registerIPCHandlers();
    setupNativeMenu();
    await createWindow();

    // Auto-set current working directory as default workspace
    currentWorkspace = process.cwd();
    try {
      await daemon.setWorkspaceFolder(currentWorkspace);
      await daemon.indexWorkspace();
      settings.addRecentWorkspace(currentWorkspace);
      console.log(`[Main] Initialized workspace to: ${currentWorkspace}`);
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
  console.log('[Main] Quitting app, stopping processes...');
  terminal.closeAll();
  await daemon.stop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
