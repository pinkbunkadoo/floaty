
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

const layoutFilename = 'default.floaty'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let dropWindow
let aboutWindow
let tray
let bounds

let incognito = false
let frames = []
let empties = []
let pictures = []
let pictureId = 1
let pictureLoadCount = -1

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
          setIncognito(false)
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
      // dropWindow.show()
    })
  } catch (e) {
    console.log('Unable to create tray icon!');
    console.log(e);
  }
}

function setIncognito(value) {
  if (incognito != value) {
    incognito = value
    // console.log(frames.length)
    for (var i = 0; i < frames.length; i++) {
      let handle = frames[i].handle
      if (incognito) {
        if (process.platform == 'win32') handle.setSkipTaskbar(true)
        handle.setIgnoreMouseEvents(true)
        handle.setAlwaysOnTop(true)
      } else {
        if (process.platform == 'win32') handle.setSkipTaskbar(false)
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

function createMainWindow() {
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
    // console.log('ready-to-show');
    createPictureWindows()
    dropWindow.show()
  })

  dropWindow.on('show', () => {
    // console.log('show');
    if (tray) {
      tray.destroy()
      tray = null
    }
  })

  dropWindow.webContents.once('dom-ready', () => {
    dropWindow.webContents.send('load')
    // createPictureWindows()
  })

  dropWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../drop_window.html'),
    protocol: 'file:',
    slashes: true
  }))

  // dropWindow.webContents.openDevTools({ mode: 'undocked' })

  dropWindow.on('focus', () => { })

  dropWindow.on('close', () => {
    // console.log('close')
    app.quit()
  })

  dropWindow.on('minimize', function() { })

  dropWindow.on('restore', function() { })

  if (process.platform === 'darwin') {
    globalShortcut.register('Command+Option+/', () => {
      setIncognito(!incognito)
    })
  }

  // dropWindow.webContents.openDevTools({ mode: 'undocked' })

  bounds ? dropWindow.setBounds(bounds) : dropWindow.center()
  // dropWindow.show()
}

function startup() {
  console.log('startup');
  loadLayoutFile()
  createMainWindow()
  createEmpty()
}

function showAbout() {
}

function createPictureWindow(picture) {
  if (!empties.length) createEmpty()

  let frame = empties.pop()
  frame.picture = picture
  frames.push(frame)

  let loadFunc = () => { frame.handle.send('load', { picture: picture, firstShow: true }) }

  if (frame.isDomReady) {
    loadFunc()
  } else {
    setTimeout(() => { loadFunc() }, 500)
  }

  frame.handle.on('close', () => {
    closeImage(frame.handle.id)
  })

  frame.handle.setTitle(picture.file.name)

  picture.windowId = frame.handle.id

  if (!empties.length) createEmpty()
}

function createPictureWindows() {
  for (var i = 0; i < pictures.length; i++) {
    let picture = pictures[i]
    createPictureWindow(picture)
  }
}

function createEmpty() {
  let handle = new BrowserWindow({
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

  let frame = { handle: handle, isDomReady: false, initialised: false }

  handle.webContents.on('dom-ready', () => {
    frame.isDomReady = true
  })

  handle.loadURL(url.format({
    pathname: path.join(__dirname, '../image_window.html'),
    protocol: 'file:',
    slashes: true
  }))

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
  createPictureWindow(picture)
}

function closeImage(id) {
  let handle = BrowserWindow.fromId(id)
  if (handle) {
    let frameIndex = frames.findIndex((element) => { return element.handle === handle })
    if (frameIndex != -1) {
      frames.splice(frameIndex, 1)
    }
    // handle.close()
  }
  if (dropWindow) dropWindow.send('remove-picture', id)
}

function loadLayoutFile() {
  let filename = path.join(app.getPath('home'), layoutFilename)
  try {
    let data = fs.readFileSync(filename)
    try {
      let obj = JSON.parse(data)
      if (obj) {
        if (obj.pictures && obj.pictures.length) {
          pictureLoadCount = 0
          for (var i = 0; i < obj.pictures.length; i++) {
            let picture = new Picture(obj.pictures[i])
            picture.id = pictureId++
            pictureLoadCount++
            pictures.push(picture)
          }
          console.log('pictures:', pictureLoadCount)
          createEmpties(pictureLoadCount)
        }
        if (obj.window) bounds = obj.window;
      }
    } catch (err) {
      console.log(err)
    }
    console.log('loaded: ', filename)
  } catch(err) {
    console.log(err);
  }
}

function saveLayoutFile() {
  let filename = path.join(app.getPath('home'), layoutFilename)
  let string = ''

  let obj = { window: bounds, pictures: [] }

  if (frames.length) {
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
  try {
    fs.writeFileSync(filename, string)
    console.log('saved:', filename)
  } catch (e) {
    console.log(e)
  }

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
  console.log('app.show');
  app.dock.show()
})

app.on('before-quit', (event) => {
  if (dropWindow) {
    bounds = dropWindow.getBounds()
  }
  saveLayoutFile()
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    startup()
  } else {
    setIncognito(false)
  }
})




ipcMain.on('console', function (event, arg) {
  console.log(arg)
})

ipcMain.on('open-layout', function(event) {
  openLayoutDialog()
})

ipcMain.on('focus-window', function(event, id) {
  let handle = BrowserWindow.fromId(id)
  if (handle) {
    handle.focus()
  }
})

// function sendPictureToFrame(frame) {
//   frame.handle.send('load', { picture: frame.picture, firstShow: true })
// }

ipcMain.on('frame-ready', (event) => {
  // console.log('frameReady')
  // let handle = BrowserWindow.fromWebContents(event.sender)
  // let frame = frames.find((element) => { return element.handle === handle })
  // if (frame) {
  //   sendPictureToFrame(frame)
  // }
})

ipcMain.on('frame-initialised', function(event) {
  let handle = BrowserWindow.fromWebContents(event.sender)
  let frame = frames.find((element) => {
    return element.handle === handle
  })

  if (frame) {
    frame.initialised = true
    dropWindow.send('new-picture', handle.id, frame.picture.file.name)
    frame.handle.show()
  }

  if (pictureLoadCount > 0) {
    pictureLoadCount--
  }

  if (pictureLoadCount == 0) {
    dropWindow.focus()
    pictureLoadCount = -1
  }
})

ipcMain.on('request-incognito', function(event) {
  setIncognito(true)
})

ipcMain.on('request-close', function(event, id) {
  // console.log('request-close', id)
  // closeImage(id)
  let handle = BrowserWindow.fromId(id)
  if (handle) {
    handle.close()
  }
})

ipcMain.on('request-quit', function(event) {
  app.quit()
})

ipcMain.on('frame-update', (event, picture) => {
  let handle = BrowserWindow.fromWebContents(event.sender)
  let frame = frames.find((element) => {
    return element.handle === handle
  })
  if (frame) frame.picture = picture
})

ipcMain.on('image-drop', function(event, files) {
  if (empties.length < files.length) {
    createEmpties(files.length - empties.length)
  }
  for (var i = 0; i < files.length; i++) {
    processImageFile(files[i])
  }
})
