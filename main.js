const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    shell
} = require('electron');
const Configstore = require('configstore');
const defaultSlime = {
    emotion: 'none',
    bday: new Date(),
    awake: true,
    sleepiness: 100,
    hunger: 100,
    happiness: 50,
    doJump: false,
    doEat: false,
    dead: false,
    color: null,
};
const defaultSettings = {
    x: 10,
    y: 10,
};
const conf = new Configstore('slimebuddy', Object.assign({}, defaultSlime, defaultSettings));
const path = require('path');
const url = require('url');
const settings = conf.all;
let mainWindow;
let settingsWindow;

app.setName('Slime Buddy');

ipcMain.on('saveSlime', (e, data) => {
  conf.set(Object.assign({}, data, {
     x: mainWindow.getBounds().x,
     y: mainWindow.getBounds().y,
  }));
  e.returnValue = true;
});
ipcMain.on('loadSlime', (e) => {
    e.returnValue = settings;
});
ipcMain.on('resetSlime', (e) => {
    e.returnValue = Object.assign({}, settings, defaultSlime);
});
ipcMain.on('showSettings', (e) => {
    createSettingsWindow();
    e.returnValue = true;
});
ipcMain.on('hideSettings', (e) => {
    settingsWindow.close();
});

function createMainWindow () {
    mainWindow = new BrowserWindow({
        width: 128,
        height: 158,
        alwaysOnTop: true,
        frame: false,
        resizable: false,
        transparent: true,
        show: false,
        fullscreenable: false,
        icon: 'assets/icons/icon.png',
        x: settings.x,
        y: settings.y,
    });

    const menuTemplate = [
        {
            label: 'Slime Buddy',
            submenu: [
                {
                    label: 'About ...',
                    click: () => {
                        console.log('About Clicked');
                    }
                }, {
                    type: 'separator'
                }, {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'game.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

const createSettingsWindow = () => {
    settingsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        alwaysOnTop: true,
        frame: false,
        resizable: false,
        fullscreenable: false,
        icon: 'assets/icons/icon.png',
    });

    settingsWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'settings.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // Open the DevTools.
    // settingsWindow.webContents.openDevTools();

    settingsWindow.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
};

app.on('ready', createMainWindow)

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
    app.quit()
  // }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow()
  }
})
