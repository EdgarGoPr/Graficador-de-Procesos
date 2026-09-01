const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * 100% Portable Mode Configuration (Zero AppData, Zero Registry)
 * Redirects userData to local directory relative to the executable
 */
const portableDataDir = path.join(__dirname, '../data');
if (!fs.existsSync(portableDataDir)) {
  fs.mkdirSync(portableDataDir, { recursive: true });
}
app.setPath('userData', portableDataDir);

// Disable hardware acceleration cache in AppData
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');

/**
 * Resolve ../Proyectos/ directory relative to executable or app root
 */
let projectsDir = path.resolve(__dirname, '../Proyectos');
if (!fs.existsSync(projectsDir)) {
  projectsDir = path.resolve(__dirname, '../../Proyectos');
}
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    title: 'ProcesStudio | BPMN 2.0 & ISO 9001:2015',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    let distHtmlPath = path.join(__dirname, 'dist/index.html');
    if (!fs.existsSync(distHtmlPath)) {
      distHtmlPath = path.join(__dirname, '../dist/index.html');
    }
    if (!fs.existsSync(distHtmlPath)) {
      distHtmlPath = path.join(__dirname, '../../dist/index.html');
    }
    mainWindow.loadFile(distHtmlPath);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Portable Local Persistence
ipcMain.handle('procesos:listProjects', async () => {
  try {
    const files = fs.readdirSync(projectsDir);
    return files.filter(file => file.endsWith('.json'));
  } catch (err) {
    console.error('Error listing projects:', err);
    return [];
  }
});

ipcMain.handle('procesos:readProject', async (_, fileName) => {
  try {
    const filePath = path.join(projectsDir, path.basename(fileName));
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading project:', err);
    return null;
  }
});

ipcMain.handle('procesos:writeProject', async (_, fileName, data) => {
  try {
    const filePath = path.join(projectsDir, path.basename(fileName));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing project:', err);
    return false;
  }
});

ipcMain.handle('procesos:deleteProject', async (_, fileName) => {
  try {
    const filePath = path.join(projectsDir, path.basename(fileName));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (err) {
    console.error('Error deleting project:', err);
    return false;
  }
});

ipcMain.handle('procesos:getProjectsPath', async () => {
  return projectsDir;
});

ipcMain.handle('procesos:openProjectsFolder', async () => {
  try {
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }
    await shell.openPath(projectsDir);
    return true;
  } catch (err) {
    console.error('Error opening projects folder:', err);
    return false;
  }
});

ipcMain.handle('procesos:openProjectFile', async (_, fileName) => {
  try {
    const filePath = path.join(projectsDir, path.basename(fileName));
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    }
    await shell.openPath(projectsDir);
    return true;
  } catch (err) {
    console.error('Error revealing project file:', err);
    return false;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

