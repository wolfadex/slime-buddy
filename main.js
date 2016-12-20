const {
    app,
    Menu,
    Tray,
    ipcMain,
    BrowserWindow
} = require('electron');
const Configstore = require('configstore');
const defaultSlime = {
    emotion: 'none',
    awake: true,
    sleepiness: 100,
    hunger: 100,
    happiness: 50,
    doJump: false,
    doEat: false,
    dead: false,
};
const defaultSettings = {
    x: 10,
    y: 10,
};
const conf = new Configstore('slimebuddy', Object.assign({}, defaultSlime, defaultSettings));
const path = require('path');
const url = require('url');
const settings = conf.all;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;


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

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 128,
        height: 158,
        alwaysOnTop: true,
        frame: false,
        resizable: false,
        transparent: true,
        show: false,
        fullscreenable: false,
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
    let trayIcon = new Tray('assets/icon_small.png');

    var trayMenuTemplate = [
        {
            label: 'Slime Buddy',
            enabled: false
        }, {
            label: 'About',
            click: function () {
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
    ];
    var trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    trayIcon.setContextMenu(trayMenu);

    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
    });

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
