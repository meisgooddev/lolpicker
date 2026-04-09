const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { authenticate, createWebSocketConnection, createHttp1Request } = require('league-connect');

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

    lcuWs.subscribe('/lol-gameflow/v1/gameflow-phase', (data, event) => {
      if (mainWindow) {
        mainWindow.webContents.send('lcu-gameflow-update', data);
      }
    });

    console.log("Connected to LCU locally.");
  } catch (error) {
    console.warn("Could not connect to LCU", error.message);
    setTimeout(setupLCU, 5000);
  }
}

ipcMain.handle('get-lcu-summoner', async () => {
  try {
    const credentials = await authenticate();
    const res = await createHttp1Request({
      method: 'GET',
      url: '/lol-summoner/v1/current-summoner'
    }, credentials);
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn("Error fetching LCU summoner:", e.message);
    return null;
  }
});

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
