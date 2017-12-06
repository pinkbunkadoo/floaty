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

let incognito = false
let frames = []
let pictures = []
let menu

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let dropWindow
let aboutWindow
let menuTemplate
let firstFocus = true


function setIncognito(value) {
  // if (value == true && frames.length == 0) return;

  if (value != incognito) {
    incognito = value

    if (incognito) {
      dropWindow.setIgnoreMouseEvents(true)
      // dropWindow.minimize()
      dropWindow.hide()
    } else {
      dropWindow.setIgnoreMouseEvents(false)
      // dropWindow.restore()
      dropWindow.show()
    }


    for (var i = 0; i < frames.length; i++) {
      frame = frames[i]
      if (incognito) {
        frame.setIgnoreMouseEvents(true)
      } else {
        frame.setIgnoreMouseEvents(false)
      }
      frame.send('incognito', value)
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
          click: (item, focusedWindow) => {
            setIncognito(!incognito)
          }
        },
        {
          label: 'Reload',
          role: 'reload',
          accelerator: 'CommandOrControl+R',
          click: () => {
            mainWindow.reload()
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: (() => {
            if (process.platform === 'darwin') {
              return 'Alt+Command+I'
            } else {
              return 'Ctrl+Shift+I'
            }
          })(),
          click: (item, focusedWindow) => {
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

    if (process.platform === 'darwin') app.dock.hide()

    createMenu()

    mainWindow = new BrowserWindow({ show: false })

    options = {
      width: 280,
      height: 280,
      minWidth: 280,
      minHeight: 280,
      // transparent: true,
      alwaysOnTop: true,
      resizable: false,
      title: appName,
      // titleBarStyle: 'hidden',
      // parent: mainWindow,
      // focusable: process.plaftorm !== 'darwin' ? true : false,
      // focusable: false,
      disableAutoHideCursor: true,
      hasShadow: false,
      acceptFirstMouse: true,
      // useContentSize: true,
      minimizable: false,
      maximizable: false,
      // frame: false,
      // show: false,
      // modal: process.plaftorm !== 'darwin' ? false : true,
      // modal: true,
      parent: mainWindow
      // backgroundColor: '#20A0FF',
      // autoHideMenuBar: true
    }

    dropWindow = new BrowserWindow(options)
    // dropWindow.menu = null
    // Menu.setApplicationMenu(menu)
    Menu.setApplicationMenu(null)

    // let bounds = dropWindow.getContentBounds()
    // console.log(bounds)
    dropWindow.setContentBounds({ x: 0, y: 0, width: 280, height: 280 })
    dropWindow.center()

    dropWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'drop.html'),
      protocol: 'file:',
      slashes: true
    }))

    dropWindow.on('focus', () => {
      setIncognito(false)
    })

    dropWindow.on('close', () => {
      app.quit()
    })

    dropWindow.on('minimize', function() {
      if (!incognito) {
        for (var i = 0; i < frames.length; i++) {
          frame = frames[i]
          frame.minimize()
        }
      }
    })

    dropWindow.on('restore', function() {
      for (var i = 0; i < frames.length; i++) {
        frame = frames[i]
        frame.restore()
      }
    })

    // mainWindow = dropWindow

    // let icon = nativeImage.createFromPath(app.getAppPath() + '/images/icon.png')
    //
    // if (process.platform === 'darwin') {
    //   app.dock.setIcon(icon)
    // } else {
    //   mainWindow.setIcon(icon)
    // }

    // mainWindow.webContents.openDevTools({ mode:'bottom' })
    // app.setName(appName)

    iconFilename = process.platform === 'darwin' ? 'tray_dark.png' : 'tray.png'
    iconPath = app.getAppPath() + '/images/' + iconFilename;

    tray = new Tray(iconPath)
    contextMenu = Menu.buildFromTemplate([
      {label: 'Show/Hide', click: (menuItem) => {
        setIncognito(!incognito)
        // menuItem.checked = incognito
      }},
      { type: 'separator' },
      {label: 'About', click: (menuItem) => {
        // app.about()
        showAbout()
      }},
      { type: 'separator' },
      {label: 'Quit', click: (menuItem) => {
        app.quit()
      }}
    ])
    tray.setToolTip('Floaty! :)')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      setIncognito(false)
    })

    // contextMenu.items[0].label = 'frogger'
    // tray.setContextMenu(null)
  }
}

function showAbout() {
  if (aboutWindow) {
    aboutWindow.close()
  }

  options = {
    show: true,
    alwaysOnTop: true
    // resizable: false,
    // backgroundColor: '#808080',
    // frame: false
  }

  aboutWindow = new BrowserWindow(options)

  aboutWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'about.html'),
    protocol: 'file:',
    slashes: true
  }))

  // aboutWindow.webContents.openDevTools({ mode:'bottom' })

}

function createWindow(imagePath) {
  options = {}

  let imageFilename = null

  index1 = imagePath.lastIndexOf('/')
  index2 = imagePath.lastIndexOf('\\')

  if (index1 > index2) {
    imageFilename = imagePath.substring(index1 + 1)
  } else {
    if (index2 != -1)
      imageFilename = imagePath.substring(index2 + 1)
  }

  options.title = imageFilename
  // options.title = null
  options.width = 640
  options.height = 480
  options.minimizable = false
  options.maximizable = false
  options.transparent = true
  options.hasShadow = false
  options.frame = false
  options.disableAutoHideCursor = true
  // options.modal = process.plaftorm !== 'darwin' ? false : true,
  // options.modal = true
  options.skipTaskbar = true
  options.alwaysOnTop = true
  options.acceptFirstMouse = true

  // if (process.platform !== 'darwin') {
  options.parent = mainWindow
  // }
  // options.show = false


  frame = new BrowserWindow(options)
  frame.firstFocus = true
  frame.imagePath = imagePath

  frame.on('focus', () => {
    // console.log('framefocus', incognito)
    // if (!frame.firstFocus) {
      // setIncognito(false)
    // }
    // frame.firstFocus = false
    // frame.setAlwaysOnTop(true)
  })

  frame.loadURL(url.format({
    pathname: path.join(__dirname, 'display.html'),
    protocol: 'file:',
    slashes: true
  }))

  // frame.webContents.openDevTools({ mode: 'bottom' })

  frames.push(frame)

  // dropWindow.setAlwaysOnTop(true)
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
    app.quit()
  }
})

app.on('show', function() {
  app.dock.show()
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
  // console.log(x, y)
})

ipc.on('console', function (event, arg) {
  console.log(arg)
})


ipc.on('request-image', function(event) {
  handle = BrowserWindow.fromWebContents(event.sender)
  event.sender.send('image', handle.imagePath)
})


ipc.on('request-incognito', function(event) {
  setIncognito(true)
})


ipc.on('request-quit', function(event) {
  dropWindow.close()
})


ipc.on('image-drop', function(event, path) {
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

ipc.on('close-about', (event) => {
  if (aboutWindow) {
    aboutWindow.close()
    aboutWindow = null
  }
})
