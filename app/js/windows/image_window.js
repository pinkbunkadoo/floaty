const electron = require('electron')
const remote = require('electron').remote
const { ipcRenderer } = require('electron')

const Point = require('../point')
const Picture = require('../picture')
const Icon = require('../icon')

const fs = require('fs')

let width, height
let isInitialised = false
let initialised = false
let mode = null
let incognito = false
let focused = true

let titleBarSize = 28

let mouseLeft = false

let timerId = null
let timeout = 0
let requestAnimationFrameId
let active = false
let hintTimerCount
let hintTimerId
let updateTimerId
let updateCooldown

let picture
let image

let containerEl, titleEl, closeEl, titleBarEl, colorOverlayEl
let overlayContainerEl, canvasContainerEl
let canvas, ctx, overlayCanvas
let ui = []

const load = async(event, args) => {
  picture = args.picture
  createImage(args.firstShow)
  // if (remote.getCurrentWindow().isFocused()) {
  //   setFocused(true)
  // }
}

window.onload = function() {
  width = window.innerWidth
  height = window.innerHeight - titleBarSize
  titleBarSize = 0

  titleBarEl = document.getElementById('title-bar')
  containerEl = document.getElementById('container')

  canvasContainerEl = document.getElementById('canvas-container')
  if (process.platform === 'darwin') canvasContainerEl.classList.add('macos')
  canvas = document.getElementById('surface')
  canvas.width = width
  canvas.height = height

  overlayContainerEl = document.getElementById('overlay-container')
  dragContainer = document.getElementById('drag-container')

  closeEl = document.getElementById('close')

  closeEl.addEventListener('click', (event) => {
    // remote.getCurrentWebContents().closeDevTools()
    window.close()
    // remote.getCurrentWindow().close()
  })

  titleEl = document.getElementById('title')

  ui = [ overlayContainerEl, containerEl, closeEl, titleEl ]

  initEventListeners()

  // remote.getCurrentWindow().show()
  // remote.getCurrentWebContents().openDevTools({ mode: 'undocked' })
}

function setFocused(focused=true) {
  if (focused) {
    for (var i = 0; i < ui.length; i++) { ui[i].classList.add('selected') }
    focused = true
    setMode(null)
  } else {
    for (var i = 0; i < ui.length; i++) { ui[i].classList.remove('selected') }
    focused = false
    setMode(null)
  }
}

function adjustFrame(width, height) {
  let frame = remote.getCurrentWindow()
  let bounds = frame.getBounds()

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

  frame.setSize(width, height)
  // frame.setMinimumSize(128, 128)
  frame.center()

  if (image.width > width && image.height > height) {
    let wr = width / image.width
    let hr = height / image.height
    picture.scale = wr > hr ? hr : wr
  } else if (image.width > width) {
    picture.scale = width / image.width
  } else if (image.height > height) {
    picture.scale = height / image.height
  }

  bounds = frame.getBounds()
  updatePicture({ bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } })
  // ipcRenderer.send('console', picture.bounds)

  // startUpdateTimer()
}

function createImage(firstShow=true) {
  image = new Image()
  image.onload = (e) => {
    initialised = true

    setTitle(picture.file.name)
    titleEl.style.visibility = 'visible'

    if (firstShow) {
      let handle = remote.getCurrentWindow()
      handle.show()
      // ipcRenderer.send('console', 'firstShow')
      if (picture.bounds) {
        handle.setBounds(picture.bounds)
      } else {
        // adjustFrame(e.target.width, e.target.height + titleBarSize)
        adjustFrame(e.target.width, e.target.height)
      }
      // remote.getCurrentWindow().show()
      // remote.getCurrentWindow().setTitle(picture.file.name)
      // remote.getCurrentWebContents().openDevTools({ mode: 'undocked' })
      ipcRenderer.send('frameInitialised')
      setFocused(true)


    }

    draw()
  }

  image.src = picture.file.path
  // image.src = picture.dataURL //'data:image/jpeg;base64,' + data.toString('base64')
}

function worldToCanvas(x, y) {
  var tx = x - picture.offset.x
  var ty = y - picture.offset.y

  var sx = (tx * picture.scale)
  var sy = (ty * picture.scale)

  // var widthHalf = (width * 0.5) >> 0
  // var heightHalf = (height * 0.5) >> 0

  var widthHalf = (width / 2)
  var heightHalf = (height / 2)

  return new Point(sx + widthHalf, sy + heightHalf)
}

function canvasToWorld(x, y) {
  // var widthHalf = (width / 2) >> 0
  // var heightHalf = (height / 2) >> 0
  var widthHalf = (width / 2)
  var heightHalf = (height / 2)

  var px = x - widthHalf
  var py = y - heightHalf

  var sx = px / picture.scale
  var sy = py / picture.scale

  var tx = sx + picture.offset.x
  var ty = sy + picture.offset.y

  return new Point(tx, ty)
}

function updateNotify() {
  // ipcRenderer.send('console', 'update')
  ipcRenderer.send('frameUpdate', picture)
}

function updatePicture(params={}) {
  for (let property in params) {
    picture[property] = params[property]
  }
  startUpdateTimer()
}

function startUpdateTimer() {
  if (!updateTimerId) {
    updateTimerId = setInterval(() => {
      updateCooldown--
      if (updateCooldown == 0) {
        updateNotify()
        clearInterval(updateTimerId)
        updateTimerId = null
      }
    }, 100)
  }
  updateCooldown = 5
}

function resetAnimationTimer(count=10) {
  if (!active) {
    timerId = setInterval(() => {
      timeout--
      if (timeout == 0) {
        clearInterval(timerId)
        stop()
      }
    }, 100)
    start()
  }
  timeout = count
}

function zoomBy(x) {
  picture.scale += x
  if (picture.scale < 0.1) picture.scale = 0.1
  if (picture.scale > 4) picture.scale = 4
  resetAnimationTimer()
  updatePicture()
}

function scrollBy(dx, dy) {
  picture.offset.x += dx
  picture.offset.y += dy

  let xmax = image.width / 2
  let ymax = image.height / 2

  if (picture.offset.x < -xmax) {
    picture.offset.x = -xmax
  } else if (picture.offset.x > xmax) {
    picture.offset.x = xmax
  }
  if (picture.offset.y < -ymax) {
    picture.offset.y = -ymax
  } else if (picture.offset.y > ymax) {
    picture.offset.y = ymax
  }

  resetAnimationTimer()
  updatePicture()
}

function draw(quality='medium') {
  ctx = canvas.getContext('2d')
  ctx.save()
  ctx.clearRect(0, 0, width, height)

  if (!incognito) {
    ctx.fillStyle = 'rgb(0, 160, 255)'
    // ctx.fillStyle = 'rgb(0, 0, 0)'
    // ctx.fillStyle = 'white'
    ctx.globalAlpha = 0.1
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
  }

  if (initialised) {
    p = worldToCanvas(0, 0)
    w = image.width * picture.scale
    h = image.height * picture.scale
    ctx.imageSmoothingQuality = quality
    ctx.globalAlpha = picture.opacity
    // ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(image, p.x - (w/2) >> 0, p.y - (h/2) >> 0, w >> 0, h >> 0)
    // ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  if (hintTimerId) {
    let fontSize = 32

    ctx.fillStyle = 'white'
    ctx.font = fontSize + 'px sans-serif'
    let text = Math.round(picture.opacity * 100) + '%'
    let tm = ctx.measureText(text)

    // let x = width / 2 - tm.width / 2
    let x = 16
    let y = height - 16

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(x - 8, y - fontSize, tm.width + 16, fontSize + fontSize * 0.2)
    ctx.fillStyle = 'white'
    // ctx.lineWidth = 6
    // ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)
  }

  ctx.restore()
}

function setMode(newMode) {
  if (mode != newMode) {
    mode = newMode
    if (mode == null) {
      dragOn()
    } else {
      dragOff()
    }
  }
}

function centerImage() {
  picture.offset.x = 0
  picture.offset.y = 0
  picture.scale = 1
  updatePicture()
  draw()
  // ipcRenderer.send('console', 'center')
}

function dragOn() {
  dragContainer.classList.add('draggable')
  // dragContainer.style.visibility = 'visible'
}

function dragOff() {
  dragContainer.classList.remove('draggable')
  // dragContainer.style.visibility = 'hidden'
}

function frame() {
  if (active) {
    requestAnimationFrameId = requestAnimationFrame(frame)
    draw()
  }
}

function start() {
  active = true
  requestAnimationFrameId = requestAnimationFrame(frame)
  // ipcRenderer.send('console', 'start-animation')
}

function stop() {
  active = false
  cancelAnimationFrame(requestAnimationFrameId)
  draw()
  // ipcRenderer.send('console', 'stop-animation')
}

function startHintTimer() {
  hintTimerCount = 10

  if (!hintTimerId) {
    hintTimerId = setInterval(() => {
      hintTimerCount = hintTimerCount - 1
      if (hintTimerCount <= 0) {
        clearInterval(hintTimerId)
        hintTimerId = null
        draw()
      }
    }, 100)
  }

  resetAnimationTimer(20)
}

function updateOpacity(value) {
  picture.opacity = value
  picture.opacity = (picture.opacity >= 0.05 ? picture.opacity : 0.05)
  picture.opacity = (picture.opacity <= 1 ? picture.opacity : 1)
  updatePicture()
  startHintTimer()
}

function setTitle(name) {
  titleEl.innerHTML = name
}

function onKeyDown(event) {
  if ((event.key == '=' || event.key == '+')) {
    updateOpacity(picture.opacity + 0.05)
  } else if (event.key == '-') {
    updateOpacity(picture.opacity - 0.05)
  } else if (event.key == ',') {
    zoomBy(-0.5)
  } else if (event.key == '.') {
    zoomBy(0.5)
  } else if ((event.key == 'Delete' || event.key == 'Backspace') && !event.repeat) {
    // ipcRenderer.send('closeImage')
    window.close()
  } else if (event.key == 'Shift' && !event.repeat) {
    setMode('pan')
  } else if (event.key == 'Control' && !event.repeat) {
    setMode('zoom')
  }
}

function onKeyUp(event) {
  if (event.key == 'Shift' && !event.repeat) {
    if (!mouseLeft) setMode(null)
  } else if (event.key == 'Control' && !event.repeat) {
    if (!mouseLeft) setMode(null)
  } else if (event.key == ' ' && !event.repeat) {
    centerImage()
  }
}

function onDragStart(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onDrag(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onDrop(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onDragEnter(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onDragOver(e) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'none'
}

function onWheel(e) {
  e.preventDefault()
  let x = e.deltaX / picture.scale
  let y = e.deltaY / picture.scale
  if (e.ctrlKey) {
    zoomBy(-e.deltaY * (picture.scale * 0.01))
  } else {
    scrollBy(x, y)
  }
}

function onMouseDown(e) {
  if (e.button === 0) mouseLeft = true

  if (e.shiftKey) {
    setMode('pan')
  } else if (e.ctrlKey) {
    setMode('zoom')
  } else {
    if (e.buttons & 2 || e.buttons & 3) {
      // ipcRenderer.send('console', e.buttons)
      // picture.offset.x = 0
      // picture.offset.y = 0
      // picture.scale = 1
      draw()
    }
  }
}

function onMouseUp(e) {
  if (e.button === 0) mouseLeft = false
  if (e.button === 0) {
    if (!e.ctrlKey && !e.shiftKey) {
      setMode(null)
    }
  }
}

function onMouseMove(e) {
  if (e.buttons & 1) {
    if (mode === 'pan') {
      scrollBy(-e.movementX / picture.scale, -e.movementY / picture.scale)
    }
    else if (mode === 'zoom') {
      // zoomBy(e.movementX * (picture.scale * 0.002))
      zoomBy(e.movementX * (picture.scale * 0.0025))
    }
  }
  // ipcRenderer.send('console', 'image-window-mouse')
}

function onBlur(e) {
  setFocused(false)
}

function onFocus(e) {
  startHintTimer()
  setFocused(true)
}

let resizeTimeoutId

function onResize(e) {
  if (!resizeTimeoutId) {
    resizeTimeoutId = setTimeout(function() {
      resizeTimeoutId = null
      width = window.innerWidth
      height = window.innerHeight - titleBarSize
      if (canvas) {
        canvas.width = width
        canvas.height = height
      }
      if (picture && picture.bounds) {
        updatePicture({ x: picture.bounds.x, y: picture.bounds.y, width: width, height: height })
      }
      draw()
   }, 1000 / 30)
  }
}

function onScroll(e) {
}

function onContextMenu(e) {
  e.preventDefault()
  e.stopPropagation()
}

function initEventListeners() {
  document.body.addEventListener("wheel", onWheel)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('dragstart', onDragStart)
  window.addEventListener('drag', onDrag)
  window.addEventListener('drop', onDrop)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('scroll', onScroll)
  window.addEventListener('contextmenu', onContextMenu)
  window.addEventListener('blur', onBlur)
  window.addEventListener('focus', onFocus)
  window.addEventListener('resize', onResize)
}


ipcRenderer.on('load', load)

ipcRenderer.on('settings', function(event, arg) {
  // for (i in arg) {
  //   settings[i] = arg[i]
  // }
  // updateOpacity(picture.opacity)
  // isInitialised = true
})

// ipcRenderer.on('initialised', (event, w, h) => {
//   if (image.width > w && image.height > h) {
//     let wr = w / image.width
//     let hr = h / image.height
//     picture.scale = wr > hr ? hr : wr
//   } else if (image.width > w) {
//     picture.scale = w / image.width
//   } else if (image.height > h) {
//     picture.scale = h / image.height
//   }
//   draw()
// })

ipcRenderer.on('incognito', function(event, arg) {
  // settings.incognito = arg
  incognito = arg

  if (incognito) {
    overlayContainerEl.style.opacity = 0
    // overlayContainerEl.classList.remove('border')
    draw()
  } else {
    // overlayContainerEl.classList.add('border')
    overlayContainerEl.style.opacity = 1
    draw()
  }
})
