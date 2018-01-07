
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
let bounds

let incognito = false
let frames = []
let empties = []
// let pictures = []
// let imageId = 1
let pictureId = 1
let pictureLoadCount = -1

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
    // console.log('incognito frames', frames.length)

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

function show() {
  dropWindow.show()
  // for (var i = 0; i < frames.length; i++) {
  //   frames[i].handle.show()
  // }
}


function startup() {
  dropWindow = new BrowserWindow({
    title: appName,
    frame: false,
    width: 480,
    height: 480,
    minWidth: 360,
    minHeight: 360,
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
    console.log('ready-to-show')
  })

  dropWindow.webContents.on('dom-ready', () => {
    dropWindow.webContents.send('load')
  })

  if (process.platform === 'darwin') {
    globalShortcut.register('Command+Option+/', () => {
      setIncognito(!incognito)
    })
  }

  // dropWindow.setSize(480, 480)
  // dropWindow.setContentBounds({ x: 0, y: 0, width: 480, height: 480 })
  // dropWindow.center()

  dropWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../drop_window.html'),
    protocol: 'file:',
    slashes: true
  }))

  dropWindow.webContents.openDevTools({ mode: 'undocked' })

  dropWindow.on('focus', () => {
    // console.log('dropWindow-focus')
  })

  dropWindow.on('close', () => {
    console.log('dropWindow close')
    app.quit()
  })

  dropWindow.on('minimize', function() {
  })

  dropWindow.on('restore', function() {
  })

  loadLayoutFile()
  // dropWindow.webContents.openDevTools({ mode: 'undocked' })
  createEmpty()
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

  let domReady = () => { handle.send('load', { picture: picture, firstShow: true }) }

  if (!handle.webContents.isLoading()) { domReady() }

  handle.webContents.on('dom-ready', domReady)
  handle.on('close', () => {
    // closeImage(handle)
    closeImage(handle.id)
  })


  handle.setTitle(picture.file.name)
  // handle.show()

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

  win.on('focus', () => {
    // console.log('focus')
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

function closeImage(id) {
  // console.log('closeImage', id)
  let handle = BrowserWindow.fromId(id)
  if (handle) {
    // console.log('closing...', id)
    let frameIndex = frames.findIndex((element) => { return element.handle === handle })
    if (frameIndex != -1) {
      frames.splice(frameIndex, 1)
      if (dropWindow) dropWindow.send('removePicture', id)
    }
  }
}

function loadLayoutFile() {
  let filename = path.join(app.getPath('home'), '.floaty')
  try {
    fs.readFile(filename, (err, data) => {
      if (err) {
        console.log(err)
      } else {
        try {
          let obj = JSON.parse(data)
          if (obj) {
            // console.log(obj)
            if (obj.pictures && obj.pictures.length) {
              pictureLoadCount = 0
              for (var i = 0; i < obj.pictures.length; i++) {
                let pic = obj.pictures[i]
                let picture = new Picture({ id: pictureId++ })
                for (let name in pic) { picture[name] = pic[name] }
                pictureLoadCount++
                createImageWindow(picture)
              }
              console.log('pictures:', pictureLoadCount)
            }
            if (obj.window) {
              console.log(obj.window)
              dropWindow.setBounds(obj.window)
            }
          }
        } catch (err) {
          console.log(err)
        }
      }
      // console.log('layout loaded')
      show()
    })
  } catch(err) {
    console.log(err);
  }
}

function saveLayoutFile() {
  let filename = path.join(app.getPath('home'), '.floaty')
  let string = ''

  let obj = { window: bounds, pictures: [] }

  if (frames.length) {
    // console.log('frames', frames.length)
    for (var i = 0; i < frames.length; i++) {
      let frame = frames[i]
      let bounds = frame.handle.getBounds()
      obj.pictures.push({
        bounds: bounds,
        opacity: parseFloat(frame.picture.opacity.toPrecision(2)),
        scale: parseFloat(frame.picture.scale.toPrecision(2)),
        offset: frame.picture.offset,
        file: frame.picture.file
      })
    }

  }
  try {
    string = JSON.stringify(obj, null, 2)
  } catch (err) {
    console.log(err)
  }
  fs.writeFile(filename, string, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('saved:', filename)
    }
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
  console.log('before-quit');
  if (dropWindow) {
    bounds = dropWindow.getBounds()
    // console.log(bounds)
  }
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

ipcMain.on('focusWindow', function(event, id) {
  let handle = BrowserWindow.fromId(id)
  if (handle) {
    handle.focus()
  }
})

ipcMain.on('frameInitialised', function(event) {
  // let frame = event.sender
  let handle = BrowserWindow.fromWebContents(event.sender)
  let frame = frames.find((element) => {
    return element.handle === handle
  })

  if (frame) {
    frame.initialised = true
    // console.log('frameInitialised', handle.id)
    dropWindow.send('newPicture', handle.id)

    // frame.handle.webContents.focus()
    frame.handle.show()

    // console.log(frame.handle.webContents.isFocused())
  }

  if (pictureLoadCount > 0) {
    pictureLoadCount--
  }

  if (pictureLoadCount == 0) {
    // console.log('pictureLoadCount == 0')
    dropWindow.focus()
    pictureLoadCount = -1
  }

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
  // dropWindow.close()
  app.quit()
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
