const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose Safe Portable Storage API to Frontend
 */
contextBridge.exposeInMainWorld('procesosStorage', {
  listProjects: () => ipcRenderer.invoke('procesos:listProjects'),
  readProject: (fileName) => ipcRenderer.invoke('procesos:readProject', fileName),
  writeProject: (fileName, data) => ipcRenderer.invoke('procesos:writeProject', fileName, data),
  deleteProject: (fileName) => ipcRenderer.invoke('procesos:deleteProject', fileName),
  getProjectsPath: () => ipcRenderer.invoke('procesos:getProjectsPath'),
});
