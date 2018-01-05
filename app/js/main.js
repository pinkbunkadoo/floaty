
const electron = require('electron')
const { app, nativeImage, ipcMain, globalShortcut } = require('electron')
const { Tray, dialog } = require('electron')
const { BrowserWindow } = require('electron')
const { Menu } = require('electron')

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
let empties = []
// let pictures = []
// let imageId = 1
let pictureId = 1

let tray

// if (process.platform === 'win32') app.disableHardwareAcceleration()

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
    console.log('incognito frames', frames.length)

    for (var i = 0; i < frames.length; i++) {
      let handle = frames[i].handle
      if (incognito) {
        handle.setIgnoreMouseEvents(true)
        handle.setAlwaysOnTop(true)
      } else {
        handle.setIgnoreMouseEvents(false)
        handle.setAlwaysOnTop(false)
      }
      handle.send('incognito', value)
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

function openLayoutDialog() {
  // console.log('openLayout')
  // console.log(BrowserWindow.getFocusedWindow())
  dialog.showOpenDialog(mainWindow, {
    title: 'Open Layout File...',
    filters: [
      { name: 'Layout File ',  extensions: [ 'layout' ] }
    ]
  })
}


function startup() {
  if (!mainWindow) {
    // mainWindow = new BrowserWindow({ show: false})

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

    createEmpty()

    loadLayoutFile()
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

function createImageWindow(picture) {
  if (!empties.length) {
    createEmpty()
  }

  let frame = empties.pop()
  let handle = frame.handle
  frame.picture = picture
  frames.push(frame)

  let domReady = () => { handle.send('load', { picture: picture, firstShow: !frame.initialised }) }

  if (!handle.webContents.isLoading()) { domReady() }

  handle.webContents.on('dom-ready', domReady)

  handle.setTitle(picture.file.name)
  handle.show()

  createEmpty()
}

function createEmpty() {
  let win = new BrowserWindow({
    title: 'Empty',
    width: 1,
    height: 1,
    minWidth: 128,
    minHeight: 128,
    minimizable: false,
    maximizable: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    acceptFirstMouse: true,
    parent: null,
    show: false
  })

  let frame = { handle: win, initialised: false }

  win.loadURL(url.format({
    pathname: path.join(__dirname, '../image_window.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('ready-to-show', () => {
  })

  win.on('close', () => {
    closeImage(win)
  })

  empties.push(frame)
}

function createEmpties(count=1) {
  for (var i = 0; i < count; i++) {
    createEmpty()
  }
}

function processImageFile(file) {
  let picture = new Picture({
    id: pictureId++,
    file: file
  })
  createImageWindow(picture)
}

function closeImage(handle) {
  let frameIndex = frames.findIndex((element) => { return element.handle === handle })
  if (frameIndex != -1) {
    frames.splice(frameIndex, 1)
  }
}

function loadLayoutFile() {
  // console.log('loading layout')
  let filename = path.join(app.getPath('home'), '.floaty')
  fs.readFile(filename, (err, data) => {
    if (err) throw err
    let obj = JSON.parse(data)
    // console.log(obj)
    for (var i = 0; i < obj.pictures.length; i++) {
      let pic = obj.pictures[i]
      let picture = new Picture({ id: pictureId++ })
      for (let name in pic) { picture[name] = pic[name] }

      // console.log(picture)

      //   bounds: { x: pic.bounds.x, y: pic.bounds.y, width: pic.bounds.width, height: pic.bounds.height },
      //   opacity: pic.opacity,
      //   scale: pic.scale,
      //   offset: { x: pic.offset.x, y: pic.offset.y }
      // })
      // picture.id = pictureId++
      // let picture = new Picture({
      //   id: pictureId++,
      //   file: file
      // })
      createImageWindow(picture)
    }
  })
}

function saveLayoutFile() {
  let data = { pictures: [] }

  for (var i = 0; i < frames.length; i++) {
    let frame = frames[i]
    let bounds = frame.handle.getBounds()
    data.pictures.push({
      bounds: bounds,
      opacity: parseFloat(frame.picture.opacity.toPrecision(2)),
      scale: parseFloat(frame.picture.scale.toPrecision(2)),
      offset: frame.picture.offset,
      file: frame.picture.file
    })
  }
  let filename = path.join(app.getPath('home'), '.floaty')
  // let path = path.join()
  let string = JSON.stringify(data, null, 2)

  fs.writeFile(filename, string, (err) => {
    if (err) throw err
    console.log('saved:', filename)
  })
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

app.on('show', () => {
  app.dock.show()
})

app.on('before-quit', (event) => {
  saveLayoutFile()
})

// app.on('quit' () => {
//   console.log('quit')
// })

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    startup()
  } else {
    setIncognito(false)
  }
})



ipcMain.on('newWindow', (event) => {
  // let win = new BrowserWindow({
  //   width: 320,
  //   height: 200
  // })
  // win.loadURL(url.format({
  //   pathname: path.join(__dirname, '../demo.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }))
})

ipcMain.on('openLayout', function(event) {
  openLayoutDialog()
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

ipcMain.on('frameInitialised', function(event, id) {
  // let frame = event.sender
  let handle = BrowserWindow.fromWebContents(event.sender)
  let frame = frames.find((element) => {
    return element.handle === handle
  })
  if (frame) frame.initialised = true

  // for (var i = 0; i < pictures.length; i++) {
  //   if (pictures[i].id === id) {
  //     console.log('picture done!', id)
  //   }
  // }
})

ipcMain.on('requestIncognito', function(event) {
  setIncognito(true)
})

ipcMain.on('requestQuit', function(event) {
  dropWindow.close()
})

ipcMain.on('frameUpdate', (event, picture) => {
  let handle = BrowserWindow.fromWebContents(event.sender)
  let frame = frames.find((element) => {
    return element.handle === handle
  })
  if (frame) frame.picture = picture
})

ipcMain.on('imageDrop', function(event, files) {
  // let bounds = dropWindow.getContentBounds()
  if (empties.length < files.length) {
    createEmpties(files.length - empties.length)
  }
  for (var i = 0; i < files.length; i++) {
    processImageFile(files[i])
  }
})

ipcMain.on('closeAbout', (event) => {
  if (aboutWindow) {
    aboutWindow.close()
    aboutWindow = null
  }
})
