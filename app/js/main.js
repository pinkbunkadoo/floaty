
const electron = require('electron')
const { app, nativeImage, ipcMain, globalShortcut } = require('electron')
const { Tray } = require('electron')
const { BrowserWindow } = require('electron')
const { Menu } = require('electron')

if (process.platform === 'win32') app.disableHardwareAcceleration()

console.log(process.platform)

const path = require('path')
const url = require('url')
const fs = require('fs')

const Picture = require('./picture')

const appName = app.getName()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let dropWindow
let aboutWindow
let menuTemplate

let incognito = false
let frames = []
let pictures = []
let imageId = 1

let tray

function createTrayIcon() {
  try {
    let iconFilename = process.platform === 'darwin' ? 'tray_dark.png' : 'tray_light.png'
    let iconPath = app.getAppPath() + '/app/images/' + iconFilename;

    tray = new Tray(iconPath)

    if (process.platform === 'darwin') {
      pressedImage = nativeImage.createFromPath(app.getAppPath() + '/app/images/tray_light.png')
      tray.setPressedImage(pressedImage)
    }

    contextMenu = Menu.buildFromTemplate([
      {
        label: 'Reveal', click: (menuItem) => {
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

function setIncognito(value) {
  // if (value == true && frames.length == 0) return;

  if (incognito != value) {
    incognito = value

    // console.log('incognito', incognito)

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

    if (incognito) {
      dropWindow.setIgnoreMouseEvents(true)
      dropWindow.hide()
      if (process.platform === 'darwin') app.dock.hide()
      createTrayIcon()
    } else {
      dropWindow.setIgnoreMouseEvents(false)
      dropWindow.show()
      if (process.platform === 'darwin') app.dock.show()
      if (tray) {
        tray.destroy()
        tray = null
      }
    }

  }
}

function openLayout() {
  console.log('openLayout')
}


function startup() {
  if (!mainWindow) {

    // mainWindow = new BrowserWindow({
    //   show: false
    // })

    dropWindow = new BrowserWindow({
      title: appName,
      frame: false,
      minWidth: 320,
      minHeight: 320,
      fullscreenable: false,
      fullscreen: false,
      titleBarStyle: 'hiddenInset',
      disableAutoHideCursor: true,
      acceptFirstMouse: true,
      minimizable: true,
      maximizable: false,
      autoHideMenuBar: true,
      show: false,
      parent: null
      // parent: mainWindow
    })

    mainWindow = dropWindow

    dropWindow.once('ready-to-show', () => {
      dropWindow.show()
    })

    dropWindow.webContents.on('dom-ready', () => {
      dropWindow.webContents.send('load')
    })

    if (process.platform === 'darwin') {
      globalShortcut.register('Command+Option+/', () => {
        setIncognito(!incognito)
      })
    }

    dropWindow.setContentBounds({ x: 0, y: 0, width: 480, height: 480 })
    dropWindow.center()

    dropWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../drop_window.html'),
      protocol: 'file:',
      slashes: true
    }))

    // dropWindow.webContents.openDevTools({ mode: 'undocked' })

    dropWindow.on('focus', () => {
      // setIncognito(false)
    })

    dropWindow.on('close', () => {
      app.quit()
    })

    dropWindow.on('minimize', function() {
      // if (!incognito) {
      //   for (var i = 0; i < frames.length; i++) {
      //     frame = frames[i]
      //     // frame.minimize()
      //     frame.hide()
      //   }
      // }
    })

    dropWindow.on('restore', function() {
      // for (var i = 0; i < frames.length; i++) {
      //   frame = frames[i]
      //   // frame.restore()
      //   frame.show()
      // }
    })
  }
}

function showAbout() {
  // if (aboutWindow) {
  //   aboutWindow.close()
  // }
  //
  // aboutWindow = new BrowserWindow({
  //   show: true,
  //   alwaysOnTop: true
  // })
  //
  // aboutWindow.loadURL(url.format({
  //   pathname: path.join(__dirname, '../about_window.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }))
  //
  // aboutWindow.on('close', () => {
  //   aboutWindow = null
  // })

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

function processImageDrop(imagePath, x, y) {
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
    let picture = new Picture({
      id: generatePictureId(),
      x: x,
      y: y,
      dataURL: 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64')),
      imageFilename: imageFilename,
      imagePath: imagePath
    })
    createImageWindow(picture)
  })

}

function createImageWindow(picture) {
  let bounds = dropWindow.getBounds()

  let frame = new BrowserWindow({
    title: picture.imageFilename,
    x: bounds.x,
    y: bounds.y,
    width: 1,
    height: 1,
    minimizable: false,
    maximizable: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    acceptFirstMouse: true,
    parent: process.platform === 'darwin' ? null : dropWindow,
    show: false
  })

  frame.initialised = false

  // frame.picture = picture
  frames.push(frame)

  frame.loadURL(url.format({
    pathname: path.join(__dirname, '../image_window.html'),
    protocol: 'file:',
    slashes: true
  }))

  frame.once('ready-to-show', () => {
    // console.log('frame ready')
    frame.show()
    // frame.center()
    // frame.firstShow = false
  })

  frame.webContents.on('dom-ready', () => {
    // console.log('dom-ready')
    // console.log(picture.initialised)
    frame.webContents.send('load', { picture: picture, firstShow: !frame.initialised })
    // frame.initialised = true
    // frame.send('picture', frame.picture, frame.firstShow)
    // frame.firstShow = false
  })

  frame.on('focus', () => {

  })

  // frame.webContents.openDevTools()

  // frame.on('load', () => {
    // handle = BrowserWindow.fromWebContents(event.sender)
    // let frame = frames.find((element) => {
    //   return element === handle
    // })
    // frame.send('picture', frame.picture)
  // })


  // let hwnd = frame.getNativeWindowHandle()
  // console.log(hwnd)
  // dropWindow.send('new-picture', frame.picture)
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

ipcMain.on('openLayout', function(event) {
  openLayout()
})

ipcMain.on('goIncognito', function(event) {
  setIncognito(true)
})

ipcMain.on('console', function (event, arg) {
  console.log(arg)
})

// ipcMain.on('thumbnail', function (event, arg) {
//   let handle = BrowserWindow.fromWebContents(event.sender)
//   handle.thumbnail = arg
//   dropWindow.send('new-image', { data: handle.thumbnail, path: handle.imagePath })
// })

ipcMain.on('frameInitialised', function(event) {
  // let frame = event.sender
  let handle = BrowserWindow.fromWebContents(event.sender)
  handle.initialised = true
  // console.log('frameInitialised')
})

ipcMain.on('request-thumbnails', function(event) {
  // let list = frames.map((frame) => {
  //   return { data: frame.thumbnail, path: frame.imagePath };
  // })
  // event.sender.send('thumbnails', list)
})

ipcMain.on('request-picture', function(event) {
  // handle = BrowserWindow.fromWebContents(event.sender)
  // let frame = frames.find((element) => {
  //   return element === handle
  // })
  // event.sender.send('picture', frame.picture)
})

ipcMain.on('request-incognito', function(event) {
  setIncognito(true)
})

ipcMain.on('request-quit', function(event) {
  dropWindow.close()
})

ipcMain.on('image-drop', function(event, imagePath, x, y) {
  let bounds = dropWindow.getContentBounds()
  processImageDrop(imagePath, bounds.x + x, bounds.y + y)
})

ipcMain.on('close-image', (event) => {
  let handle = BrowserWindow.fromWebContents(event.sender)
  let index = -1

  for (var i = 0; i < frames.length; i++) {
    frame = frames[i]
    if (frame === handle) {
      index = i
      break
    }
  }

  if (index != -1) {
    let path = frames[index].imagePath
    // dropWindow.send('remove-image', path)
    frames.splice(index, 1)
  }

  handle.close()
  // dropWindow.focus()
})

ipcMain.on('close-about', (event) => {
  if (aboutWindow) {
    aboutWindow.close()
    aboutWindow = null
  }
})
