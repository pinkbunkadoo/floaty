const electron = require('electron')
// Module to control application life.
const app = electron.app

const Menu = electron.Menu
const ipc = require('electron').ipcMain

const { globalShortcut } = require('electron')

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

let alwaysOnTop = false
let menu
// let incognito = false
let settings = { incognito: false }

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let imageWindow
let menuTemplate
let win
let firstFocus = true

function setIncognito(value) {
  if (value != settings.incognito) {
    settings.incognito = value
    // settings.incognito = value
    // imageWindow.webContents.closeDevTools()
    createWindow()
  }
}


function createMenu() {
  menuTemplate = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Transparent',
          accelerator: '/',
          click: function (item, focusedWindow) {
            setIncognito(!settings.incognito)
          }
        },
        {
          label: 'Reload',
          role: 'reload'
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: (function () {
            if (process.platform === 'darwin') {
              return 'Alt+Command+I'
            } else {
              return 'Ctrl+Shift+I'
            }
          })(),
          click: function (item, focusedWindow) {
            imageWindow.toggleDevTools()
          }
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.getName(),
      submenu: [
        {
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })
  }

  menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}


function createWindow () {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({ width: 320, height: 240 })
    mainWindow.hide()
    createMenu()
  }

  let bounds

  if (imageWindow) {
    bounds = imageWindow.getBounds()
    // imageWindow.hide()
    // imageWindow.close()
  }

  if (!imageWindow) {

    options = {}
    if (bounds) {
      options.x = bounds.x
      options.y = bounds.y
      options.width = bounds.width
      options.height = bounds.height
    } else {
      options.width = 640
      options.height = 480
    }
    options.minimizable = false
    options.maximizable = false
    options.transparent = true
    options.hasShadow = false
    // options.backgroundColor = '#10101010'
    // options.frame = (process.platform === 'darwin' ? true : false)
    options.frame = false
    options.disableAutoHideCursor = true
    // options.show = false

    if (settings.incognito) {
      options.frame = false
      // options.backgroundColor = '#00000000'
      options.alwaysOnTop = true
    }

    // alwaysOnTop: true,
    // acceptFirstMouse: false,
    // focusable: false,
    // disableAutoHideCursor: true,
    // resizable: true,
    // titleBarStyle: 'hidden',

    imageWindow = new BrowserWindow(options)
    imageWindow.firstFocus = true
    imageWindow.on('focus', () => {
      if (!imageWindow.firstFocus) {
        setIncognito(false)
      }
      imageWindow.firstFocus = false
    })

    // and load the index.html of the app.
    imageWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'setup.html'),
      protocol: 'file:',
      slashes: true
    }))
  }

  if (settings.incognito) {
    imageWindow.setIgnoreMouseEvents(true)
    imageWindow.setAlwaysOnTop(true)
  } else {
    imageWindow.setIgnoreMouseEvents(false)
    imageWindow.setAlwaysOnTop(false)
    // imageWindow.webContents.openDevTools({ mode:'bottom' })
  }

  imageWindow.send('incognito', settings.incognito)

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
// app.on('window-all-closed', function () {
//   // On OS X it is common for applications and their menu bar
//   // to stay active until the user quits explicitly with Cmd + Q
//   if (process.platform !== 'darwin') {
//     // app.exit()
//   }
// })

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    // createWindow()
  }
})

// app.on('quit')

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipc.on('move-window-by', function (event, x, y) {
  bounds = imageWindow.getBounds()
  bounds.x += x
  bounds.y += y
  imageWindow.setBounds(bounds)
})

ipc.on('size-window-by', function (event, x, y) {
  bounds = imageWindow.getBounds()
  bounds.width += x
  bounds.height += y
  bounds.width = bounds.width < 128 ? 128 : bounds.width;
  bounds.height = bounds.height < 128 ? 128 : bounds.height;
  imageWindow.setBounds(bounds)
})

ipc.on('request-settings', function(event) {
  event.sender.send('settings', settings)
})

ipc.on('image-update', function(event, arg1) {
  settings.src = arg1;

  // win.send('image', arg1);
})

ipc.on('save-settings', function(event, arg1) {
  for (i in arg1) {
    settings[i] = arg1[i]
  }

  // win.send('settings-changed', settings)

})
