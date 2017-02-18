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

let settings = { incognito: false }
let frames = []
let pictures = []
let menu

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let menuTemplate
let firstFocus = true


function setIncognito(value) {
  if (value != settings.incognito) {
    settings.incognito = value
    // settings.incognito = value
    // imageWindow.webContents.closeDevTools()
    // createWindow()
    for (var i = 0; i < frames.length; i++) {
      frame = frames[i]
      if (settings.incognito) {
        frame.setIgnoreMouseEvents(true)
        frame.setAlwaysOnTop(true)
      } else {
        frame.setIgnoreMouseEvents(false)
        frame.setAlwaysOnTop(false)
          // imageWindow.webContents.openDevTools({ mode:'bottom' })
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
          click: function (item, focusedWindow) {
            setIncognito(!settings.incognito)
          }
        },
        {
          label: 'Reload',
          accelerator: 'R',
          click: () => {
            imageWindow.reload()
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
            mainWindow.toggleDevTools()
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
    mainWindow = new BrowserWindow({
      width: 320,
      height: 320,
      minWidth: 320,
      minHeight: 320,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      // resizable: false,
      hasShadow: false
    })

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'drop.html'),
      protocol: 'file:',
      slashes: true
    }))
    createMenu()

    // mainWindow.webContents.openDevTools({ mode:'bottom' })
  }
}



function createWindow(imagePath) {
  console.log('createWindow');
  let bounds

  // if (imageWindow) {
  //   bounds = imageWindow.getBounds()
  //   // imageWindow.hide()
  //   // imageWindow.close()
  // }

  options = {}
  options.width = 640
  options.height = 480
  options.minimizable = false
  options.maximizable = false
  options.transparent = true
  options.hasShadow = false
  // options.backgroundColor = '#10101010'
  // options.frame = (process.platform === 'darwin' ? true : false)
  options.frame = false
  // options.disableAutoHideCursor = true

  if (process.platform !== 'darwin') {
    options.parent = mainWindow
  }

  // options.show = false

  // alwaysOnTop: true,
  options.acceptFirstMouse = true
  // focusable: false,
  // disableAutoHideCursor: true,
  // resizable: true,
  // titleBarStyle: 'hidden',

  frame = new BrowserWindow(options)
  frame.firstFocus = true
  frame.imagePath = imagePath

  frame.on('focus', () => {
    // console.log('focus');
    if (!frame.firstFocus) {
      // setIncognito(false)
    } else {
    }
    // frame.send('initialise', imagePath)
    frame.firstFocus = false
  })

  frame.loadURL(url.format({
    pathname: path.join(__dirname, 'display.html'),
    protocol: 'file:',
    slashes: true
  }))
  // console.log('ass');

  // frame.webContents.openDevTools({ mode:'bottom' })

  frames.push(frame)
  // pictures.push(imagePath)

  // if (settings.incognito) {
  //   imageWindow.setIgnoreMouseEvents(true)
  //   imageWindow.setAlwaysOnTop(true)
  // } else {
  //   imageWindow.setIgnoreMouseEvents(false)
  //   imageWindow.setAlwaysOnTop(false)
  //   // imageWindow.webContents.openDevTools({ mode:'bottom' })
  // }
  //
  // imageWindow.send('incognito', settings.incognito)

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', startup)

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

  handle = BrowserWindow.fromWebContents(event.sender)

  bounds = handle.getBounds()
  bounds.x += x
  bounds.y += y
  handle.setBounds(bounds)

  // console.log('moveWindowBy', x, y);
})

// ipc.on('size-window-by', function (event, x, y) {
//   bounds = event.sender.getBounds()
//   bounds.width += x
//   bounds.height += y
//   bounds.width = bounds.width < 128 ? 128 : bounds.width;
//   bounds.height = bounds.height < 128 ? 128 : bounds.height;
//   event.sender.setBounds(bounds)
// })

ipc.on('request-settings', function(event) {
  event.sender.send('settings', settings)
})


ipc.on('request-image', function(event) {
  handle = BrowserWindow.fromWebContents(event.sender)
  event.sender.send('image', handle.imagePath)
})


ipc.on('image-drop', function(event, path) {
  // image = new Image()
  // image.src = src

  // settings.src = arg1;
  // win.send('image', arg1);
  console.log('image-drop', path);
  createWindow(path)
})


ipc.on('save-settings', function(event, arg1) {
  for (i in arg1) {
    settings[i] = arg1[i]
  }

  // win.send('settings-changed', settings)

})
