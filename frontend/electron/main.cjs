const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { authenticate, createWebSocketConnection } = require('league-connect');

let mainWindow;
let lcuWs;

async function setupLCU() {
  try {
    const credentials = await authenticate({ awaitConnection: true });
    lcuWs = await createWebSocketConnection({
      authenticationOptions: { awaitConnection: true }
    });

    lcuWs.subscribe('/lol-champ-select/v1/session', (data, event) => {
      if (mainWindow) {
        mainWindow.webContents.send('lcu-draft-update', data);
      }
    });
    console.log("Connected to LCU locally.");
  } catch (error) {
    console.warn("Could not connect to LCU", error.message);
    setTimeout(setupLCU, 5000);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "LOLPicker"
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true
  });

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupLCU();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
