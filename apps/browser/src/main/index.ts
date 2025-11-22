import { app, BrowserWindow, Menu, protocol } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerFRWProtocol } from './protocol.js';
import { setupIPC } from './ipc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CRITICAL: Register frw:// as privileged BEFORE app is ready
// This allows sub-resources (images, CSS, JS) to load properly
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'frw',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: false
    }
  }
]);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: 'FRW Browser',
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Load the app
  const isDev = !app.isPackaged;
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files (no asar packaging)
    const appPath = app.getAppPath();
    mainWindow.loadFile(path.join(appPath, 'dist-electron/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Register frw:// protocol
  console.log('[Main] Registering frw:// protocol...');
  registerFRWProtocol();
  console.log('[Main] ✓ frw:// protocol registered');
  
  // Setup IPC handlers
  setupIPC();
  
  // Wait a bit for Vite to start in dev mode
  if (!app.isPackaged) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Create window
  createWindow();

  // Application menu with DevTools toggle
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              if (win.webContents.isDevToolsOpened()) {
                win.webContents.closeDevTools();
              } else {
                win.webContents.openDevTools();
              }
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
