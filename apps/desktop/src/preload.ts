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
  readFile: (path: string) => ipcRenderer.invoke('daemon:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('daemon:writeFile', path, content),

  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('myForgeAPI', api);
