
const electron = require('electron')
const { app, nativeImage, ipcMain, globalShortcut } = require('electron')
const { Tray } = require('electron')
const { BrowserWindow } = require('electron')
const { Menu } = require('electron')

const path = require('path')
const url = require('url')
const fs = require('fs')
const Picture = require('./picture')

const appName = 'Floaty'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let dropWindow
let aboutWindow
let menuTemplate
let menu

let firstFocus = true
let incognito = false
let frames = []
let pictures = []
let imageId = 1


function setIncognito(value) {
  // if (value == true && frames.length == 0) return;

  if (value != incognito) {
    incognito = value

    if (incognito) {
      dropWindow.setIgnoreMouseEvents(true)
      dropWindow.hide()
      if (process.platform === 'darwin') app.dock.hide()
    } else {
      dropWindow.setIgnoreMouseEvents(false)
      dropWindow.show()
      if (process.platform === 'darwin') app.dock.show()
    }

    for (var i = 0; i < frames.length; i++) {
      frame = frames[i]
      if (incognito) {
        frame.setIgnoreMouseEvents(true)
        frame.setAlwaysOnTop(true)
      } else {
        frame.setIgnoreMouseEvents(false)
        frame.setAlwaysOnTop(false)
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
          label: 'Incognito On/Off',
          accelerator: process.platform === 'darwin' ? 'Command+Option+/' : '/',
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
              return 'Option+Command+I'
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

  if (process.platform !== 'darwin') {
    menuTemplate.unshift({
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    })
  }

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

    // mainWindow = new BrowserWindow({
    //   focusable: true,
    //   show: true
    // })

    dropWindow = new BrowserWindow({
      title: appName,
      frame: false,
      minWidth: 320,
      minHeight: 320,
      maximizable: false,
      fullscreenable: false,
      fullscreen: false,
      titleBarStyle: 'hiddenInset',
      disableAutoHideCursor: true,
      acceptFirstMouse: true,
      minimizable: false,
      maximizable: false,
      autoHideMenuBar: true,
      parent: null
      // parent: mainWindow
    })

    mainWindow = dropWindow

    // if (process.platform !== 'darwin') mainWindow = dropWindow

    createMenu()

    if (process.platform === 'darwin') {
      globalShortcut.register('Command+Option+/', () => {
        setIncognito(!incognito)
      })
    }

    // dropWindow.webContents.openDevTools({ mode:'bottom' })

    dropWindow.setContentBounds({ x: 0, y: 0, width: 480, height: 480 })
    dropWindow.center()

    dropWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../drop_window.html'),
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

    try {
      iconFilename = process.platform === 'darwin' ? 'tray_dark.png' : 'tray_light.png'
      iconPath = app.getAppPath() + '/app/images/' + iconFilename;

      tray = new Tray(iconPath)

      if (process.platform === 'darwin') {
        pressedImage = nativeImage.createFromPath(app.getAppPath() + '/app/images/tray_light.png')
        tray.setPressedImage(pressedImage)
      }

      contextMenu = Menu.buildFromTemplate([
        {
          label: 'Incognito On/Off', click: (menuItem) => {
            setIncognito(!incognito)
          }
        },
        { type: 'separator' },
        {
          label: 'Quit ' + appName, click: (menuItem) => {
            app.quit()
          }
        }
      ])
      tray.setToolTip(appName + '! :)')
      tray.setContextMenu(contextMenu)
      tray.on('click', () => {
        setIncognito(false)
        dropWindow.show()
      })
    } catch (e) {
      console.log('Unable to create tray icon!');
      console.log(e);
    }
  }
}

function showAbout() {
  if (aboutWindow) {
    aboutWindow.close()
  }

  aboutWindow = new BrowserWindow({
    show: true,
    alwaysOnTop: true
  })

  aboutWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../about_window.html'),
    protocol: 'file:',
    slashes: true
  }))

  aboutWindow.on('close', () => {
    aboutWindow = null
  })

  // aboutWindow.webContents.openDevTools({ mode:'bottom' })
}

function generatePictureId(name) {
  let count = 0
  while (1) {
    let found = false
    let id = (count == 0 ? name : name + count)
    for (var i = 0; i < pictures.length; i++) {
      let picture = pictures[i]
      if (picture.id === id) {
        found = true
        break
      }
    }
    if (!found) break
    count++
  }
  return (count == 0 ? name : name + count)
}

function onImageDrop(imagePath, x, y) {
  let imageFilename = null

  index1 = imagePath.lastIndexOf('/')
  index2 = imagePath.lastIndexOf('\\')

  if (index1 > index2) {
    imageFilename = imagePath.substring(index1 + 1)
  } else {
    if (index2 != -1)
      imageFilename = imagePath.substring(index2 + 1)
  }

  fs.readFile(imagePath, null, function(err, data) {
    // img = new Image()
    // img.src = 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64'))
    // img.onload = (e) => {
      let picture = new Picture({
        id: generatePictureId(),
        x: x,
        y: y,
        dataURL: 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64')),
        imageFilename: imageFilename,
        imagePath: imagePath
      })
      createImageWindow(picture)
    // }
  })

}

function createImageWindow(picture) {
  options = {}

  let frame = new BrowserWindow({
    title: picture.imageFilename,
    width: 640,
    height: 480,
    minWidth: 256,
    minHeight: 256,
    minimizable: false,
    maximizable: false,
    transparent: true,
    hasShadow: false,
    frame: false,
    disableAutoHideCursor: true,
    skipTaskbar: true,
    acceptFirstMouse: true,
    parent: mainWindow
    // parent: process.platform === 'darwin' ? mainWindow : dropWindow
    // parent: process.platform === 'darwin' ? mainWindow : null
  })

  frame.firstFocus = true

  frame.setBounds({ x: picture.x, y: picture.y, width: 640, height: 480})
  frame.center()

  frame.on('focus', () => {})

  frame.loadURL(url.format({
    pathname: path.join(__dirname, '../image_window.html'),
    protocol: 'file:',
    slashes: true
  }))

  // frame.webContents.openDevTools({ mode: 'bottom' })

  frame.picture = picture
  frames.push(frame)

  // picture.frame = frame
  // pictures.push(picture)
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
    setIncognito(false)
  }
})


ipcMain.on('move-window-by', function (event, x, y) {
  // handle = BrowserWindow.fromWebContents(event.sender)
  // bounds = handle.getBounds()
  // bounds.x += x
  // bounds.y += y
  // handle.setBounds(bounds)
  console.log('move-window-by')
})

ipcMain.on('console', function (event, arg) {
  console.log(arg)
})

ipcMain.on('thumbnail', function (event, arg) {
  // console.log('thumbnail');
  let handle = BrowserWindow.fromWebContents(event.sender)
  handle.thumbnail = arg
  // console.log(arg)
  dropWindow.send('new-image', { data: handle.thumbnail, path: handle.imagePath })
})

ipcMain.on('request-thumbnails', function(event) {
  let list = frames.map((frame) => {
    return { data: frame.thumbnail, path: frame.imagePath };
  })
  event.sender.send('thumbnails', list)
})

ipcMain.on('request-picture', function(event) {
  handle = BrowserWindow.fromWebContents(event.sender)
  let frame = frames.find((element) => {
    return element === handle
  })
  event.sender.send('picture', frame.picture)
})

ipcMain.on('request-incognito', function(event) {
  setIncognito(true)
})

ipcMain.on('request-quit', function(event) {
  dropWindow.close()
})

ipcMain.on('resize-frame', (event, width, height) => {
  let handle = BrowserWindow.fromWebContents(event.sender)
  let bounds = handle.getBounds()

  let ratio = (width > height ? height / width : width / height);

  let display = electron.screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
  let dw = display.size.width
  let dh = display.size.height

  let wratio = dw / width
  let hratio = dh / height

  if (wratio < 1 && hratio < 1) {
    // Both width and height are larger than display area
    if (wratio < hratio) {
      // Favour width
      width = dw
      height = height * wratio
    } else {
      // Favour height
      width = width * hratio
      height = dh
    }
  } else if (wratio < 1) {
    width = dw
    height = height * wratio
  } else if (hratio < 1) {
    width = width * hratio
    height = dh
  }

  width = Math.round(width)
  height = Math.round(height)

  handle.setSize(width, height)
  handle.center()

  handle.send('frame-resized', width, height)
})

ipcMain.on('image-drop', function(event, imagePath, x, y) {
  let bounds = dropWindow.getContentBounds()
  onImageDrop(imagePath, bounds.x + x, bounds.y + y)
  // processImageFile(imagePath)
  // createWindow(imagePath, bounds.x + x, bounds.y + y)
})

ipcMain.on('close-image', (event) => {
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
    let path = frames[index].imagePath
    dropWindow.send('remove-image', path)
    frames.splice(index, 1)
  }

  handle.close()
  dropWindow.focus()
})

ipcMain.on('close-about', (event) => {
  if (aboutWindow) {
    aboutWindow.close()
    aboutWindow = null
  }
})
