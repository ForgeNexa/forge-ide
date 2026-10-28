import { contextBridge, ipcRenderer } from 'electron';
import { MyForgeAPI } from '@my-forge/shared-protocol';

const api: MyForgeAPI = {
  getDaemonInfo: () => ipcRenderer.invoke('daemon:getInfo'),
  getDaemonHealth: () => ipcRenderer.invoke('daemon:getHealth'),
  setWorkspaceFolder: (path: string) => ipcRenderer.invoke('daemon:setWorkspaceFolder', path),
  getWorkspaceFolder: () => ipcRenderer.invoke('daemon:getWorkspaceFolder'),
  indexWorkspace: () => ipcRenderer.invoke('daemon:indexWorkspace'),
  listDirectory: (path?: string) => ipcRenderer.invoke('daemon:listDirectory', path),
  searchFiles: (query: string, limit?: number) => ipcRenderer.invoke('daemon:searchFiles', query, limit),
  searchContent: (query: string, options?: any) => ipcRenderer.invoke('daemon:searchContent', query, options),
  readFile: (path: string) => ipcRenderer.invoke('daemon:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('daemon:writeFile', path, content),

  createFile: (path: string, content?: string) => ipcRenderer.invoke('fs:createFile', path, content),
  createFolder: (path: string) => ipcRenderer.invoke('fs:createFolder', path),
  renameEntry: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:renameEntry', oldPath, newPath),
  deleteEntry: (path: string) => ipcRenderer.invoke('fs:deleteEntry', path),
  showInFolder: (path: string) => ipcRenderer.invoke('fs:showInFolder', path),

  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName?: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  gitGetStatus: () => ipcRenderer.invoke('git:getStatus'),
  gitStageFile: (path: string) => ipcRenderer.invoke('git:stageFile', path),
  gitUnstageFile: (path: string) => ipcRenderer.invoke('git:unstageFile', path),
  gitStageAll: () => ipcRenderer.invoke('git:stageAll'),
  gitUnstageAll: () => ipcRenderer.invoke('git:unstageAll'),
  gitDiscardChanges: (path: string) => ipcRenderer.invoke('git:discardChanges', path),
  gitCommit: (message: string) => ipcRenderer.invoke('git:commit', message),
  gitGetDiff: (path: string, staged?: boolean) => ipcRenderer.invoke('git:getDiff', path, staged),
  gitGetBranches: () => ipcRenderer.invoke('git:getBranches'),
  gitSwitchBranch: (branch: string) => ipcRenderer.invoke('git:switchBranch', branch),
  gitCreateBranch: (branch: string) => ipcRenderer.invoke('git:createBranch', branch),

  terminalCreate: (options?: any) => ipcRenderer.invoke('terminal:create', options),
  terminalWrite: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
  terminalResize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
  terminalClose: (id: string) => ipcRenderer.invoke('terminal:close', id),
  onTerminalData: (callback: (id: string, data: string) => void) => {
    const handler = (_: any, id: string, data: string) => callback(id, data);
    ipcRenderer.on('terminal:data', handler);
    return () => ipcRenderer.removeListener('terminal:data', handler);
  },
  onTerminalExit: (callback: (id: string, exitCode: number) => void) => {
    const handler = (_: any, id: string, exitCode: number) => callback(id, exitCode);
    ipcRenderer.on('terminal:exit', handler);
    return () => ipcRenderer.removeListener('terminal:exit', handler);
  },

  runFile: (filePath: string) => ipcRenderer.invoke('runner:runFile', filePath),
  taskDetect: () => ipcRenderer.invoke('task:detect'),
  taskRun: (task: any) => ipcRenderer.invoke('task:run', task),
  taskKill: (taskId: string) => ipcRenderer.invoke('task:kill', taskId),
  onTaskOutput: (callback: (taskId: string, chunk: string) => void) => {
    const handler = (_: any, taskId: string, chunk: string) => callback(taskId, chunk);
    ipcRenderer.on('task:output', handler);
    return () => ipcRenderer.removeListener('task:output', handler);
  },
  onTaskExit: (callback: (taskId: string, exitCode: number) => void) => {
    const handler = (_: any, taskId: string, exitCode: number) => callback(taskId, exitCode);
    ipcRenderer.on('task:exit', handler);
    return () => ipcRenderer.removeListener('task:exit', handler);
  },

  extensionSearch: (query: string) => ipcRenderer.invoke('extension:search', query),
  extensionInstall: (id: string) => ipcRenderer.invoke('extension:install', id),
  extensionUninstall: (id: string) => ipcRenderer.invoke('extension:uninstall', id),
  extensionToggleEnable: (id: string, enabled: boolean) => ipcRenderer.invoke('extension:toggleEnable', id, enabled),
  extensionGetInstalled: () => ipcRenderer.invoke('extension:getInstalled'),

  lspGetRegistry: () => ipcRenderer.invoke('lsp:getRegistry'),
  lspGetDiagnostics: (filePath?: string) => ipcRenderer.invoke('lsp:getDiagnostics', filePath),
  lspGetDocumentSymbols: (filePath: string, content?: string) => ipcRenderer.invoke('lsp:getDocumentSymbols', filePath, content),
  lspGetDefinition: (filePath: string, symbol: string) => ipcRenderer.invoke('lsp:getDefinition', filePath, symbol),
  lspGetHover: (filePath: string, symbol: string) => ipcRenderer.invoke('lsp:getHover', filePath, symbol),

  aiGetCompletion: (req: any) => ipcRenderer.invoke('ai:getCompletion', req),
  aiGetStatus: () => ipcRenderer.invoke('ai:getStatus'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  exportSettings: () => ipcRenderer.invoke('settings:export'),
  importSettings: (json: string) => ipcRenderer.invoke('settings:import', json),
  getRecentWorkspaces: () => ipcRenderer.invoke('settings:getRecentWorkspaces'),

  getDiagnosticReport: () => ipcRenderer.invoke('diagnostics:getReport'),
  openLogDir: () => ipcRenderer.invoke('diagnostics:openLogDir'),

  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('myForgeAPI', api);
