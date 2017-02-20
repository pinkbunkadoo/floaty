const electron = require('electron')
// Module to control application life.
const app = electron.app
const Tray = electron.Tray
const nativeImage = electron.nativeImage
const Menu = electron.Menu
const ipc = electron.ipcMain

const globalShortcut = electron.globalShortcut

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const appName = 'Floaty'

// app.setName(appName)

let incognito = false
let frames = []
let pictures = []
let menu

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let dropWindow
let menuTemplate
let firstFocus = true


function setIncognito(value) {
  // console.log('setIncognito', incognito, value);
  if (value != incognito) {
    if (value == true && frames.length == 0) return;

    incognito = value

    console.log('incognito', incognito)

    for (var i = 0; i < frames.length; i++) {
      frame = frames[i]
      if (incognito) {
        frame.setIgnoreMouseEvents(true)
        // frame.setAlwaysOnTop(true)
      } else {
        frame.setIgnoreMouseEvents(false)
        // frame.setAlwaysOnTop(false)
      }
      frame.send('incognito', value)
    }


    dropWindow.send('incognito', incognito)

    if (incognito) {
      dropWindow.setIgnoreMouseEvents(true)
    } else {
      dropWindow.setIgnoreMouseEvents(false)
    }

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
            // console.log('/');
            setIncognito(!incognito)
          }
        },
        {
          label: 'Reload',
          accelerator: 'R',
          click: () => {
            // mainWindow.reload()
          }
          // role: 'reload'
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
            dropWindow.toggleDevTools()
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


function startup() {
  if (!mainWindow) {

    createMenu()

    // mainWindow = new BrowserWindow({
    //   width: 320,
    //   height: 240,
    //   transparent: true,
    //   alwaysOnTop: true,
    //   title: appName,
    //   frame: false,
    //   // skipTaskbar: true,
    //   focusable: process.plaftorm !== 'darwin' ? true : false,
    //   // modal: true,
    //   hasShadow: false
    // })
    //
    // mainWindow.setIgnoreMouseEvents(true)
    // mainWindow.firstFocus = true
    //
    // mainWindow.on('focus', () => {
    //   if (!mainWindow.firstFocus) {
    //     setIncognito(false)
    //   }
    //   mainWindow.firstFocus = false
    // })


    dropWindow = new BrowserWindow({
      width: 300,
      height: 300,
      minWidth: 300,
      minHeight: 300,
      transparent: true,
      alwaysOnTop: true,
      title: appName,
      // parent: mainWindow,
      // focusable: process.plaftorm !== 'darwin' ? true : false,
      // focusable: false,
      disableAutoHideCursor: true,
      hasShadow: false,
      acceptFirstMouse: true,
      frame: false
    })

    dropWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'drop.html'),
      protocol: 'file:',
      slashes: true
    }))

    dropWindow.on('focus', () => {
      setIncognito(false)
      // console.log('focus');
      // console.log('drop');
      // dropWindow.setAlwaysOnTop(false)
      // dropWindow.setAlwaysOnTop(true)
    })

    dropWindow.on('close', () => {
      app.exit()
    })

    mainWindow = dropWindow

    // let icon = nativeImage.createFromPath(app.getAppPath() + '/images/icon.png')
    //
    // if (process.platform === 'darwin') {
    //   app.dock.setIcon(icon)
    // } else {
    //   mainWindow.setIcon(icon)
    // }

    // mainWindow.webContents.openDevTools({ mode:'bottom' })
    // app.setName(appName)

  }
}



function createWindow(imagePath) {
  options = {}
  options.title = imagePath
  options.width = 640
  options.height = 480
  options.minimizable = false
  options.maximizable = false
  options.transparent = true
  options.hasShadow = false
  options.frame = false
  options.disableAutoHideCursor = true
  options.modal = process.plaftorm !== 'darwin' ? false : true,
  options.skipTaskbar = true

  if (process.platform !== 'darwin') {
    // options.parent = mainWindow
  }
  // options.show = false

  options.alwaysOnTop = true
  options.acceptFirstMouse = true

  frame = new BrowserWindow(options)
  frame.firstFocus = true
  frame.imagePath = imagePath

  frame.on('focus', () => {
    if (!frame.firstFocus) {
      setIncognito(false)
    }
    frame.firstFocus = false
    // frame.setAlwaysOnTop(true)
  })

  frame.loadURL(url.format({
    pathname: path.join(__dirname, 'display.html'),
    protocol: 'file:',
    slashes: true
  }))

  frames.push(frame)

  dropWindow.setAlwaysOnTop(true)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', startup)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.exit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    startup()
  } else {
    // mainWindow.show()
    setIncognito(false)
  }
  // console.log('activate')
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipc.on('move-window-by', function (event, x, y) {

  handle = BrowserWindow.fromWebContents(event.sender)

  bounds = handle.getBounds()
  bounds.x += x
  bounds.y += y
  handle.setBounds(bounds)
})


ipc.on('request-image', function(event) {
  handle = BrowserWindow.fromWebContents(event.sender)
  event.sender.send('image', handle.imagePath)
})


ipc.on('image-drop', function(event, path) {
  console.log('image-drop', path)
  createWindow(path)
})


ipc.on('close-image', (event) => {
  let handle = BrowserWindow.fromWebContents(event.sender)
  let index = -1

  for (var i = 0; i < frames.length; i++) {
    frame = frames[i]
    if (frame === handle) {
      index = i
      break;
    }
  }

  if (index != -1) {
    frames.splice(index, 1)
  }

  handle.close()
})
