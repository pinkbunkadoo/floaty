const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow
const ipc = require('electron').ipcRenderer

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

let settings = { scale: 1.0, opacity: 0.5, left: 0, top: 0 }

let titlebarSize = 24

let mouseLeft = false

let timerId = null
let timeout = 0
let requestAnimationFrameId
let active = false
let hintOpacity
let hintTimerId

let picture
let image

let container, titleEl, closeEl, info
let overlayContainer, canvasContainer
let canvas, ctx, overlayCanvas


window.onload = function (event) {
  // ipc.send('console', 'image-window onload')

  container = document.getElementById('container')
  container.classList.add('selected');

  canvasContainer = document.getElementById('canvas-container')

  canvas = document.getElementById('surface')
  // canvasContainer.appendChild(canvas)
  width = window.innerWidth
  height = window.innerHeight - titlebarSize
  canvas.width = width
  canvas.height = height

  overlayContainer = document.getElementById('overlay-container')
  overlayContainer.classList.add('border')
  overlayContainer.classList.add('selected')

  dragContainer = document.getElementById('drag-container')
  dragContainer.classList.add('draggable')

  // overlayContainer.appendChild(dragContainer)

  closeEl = document.getElementById('close')
  closeEl.classList.add('background');
  closeEl.classList.add('selected');

  // overlayContainer.appendChild(closeEl)

  closeEl.addEventListener('click', (event) => {
    ipc.send('close-image')
  })

  titleEl = document.getElementById('title')
  titleEl.classList.add('background');
  titleEl.classList.add('selected');
  titleEl.innerHTML = ''

  // info = document.getElementById('info')
  // updateInfo()

  initEventListeners()

  ipc.send('request-picture')

  // remote.getCurrentWebContents().openDevTools({ mode: 'undocked' })

}

function updateInfo() {
  // info.innerHTML = Math.round(settings.opacity * 100) + '%'
}

function worldToCanvas(x, y) {
  var tx = x - settings.left
  var ty = y - settings.top

  var sx = (tx * settings.scale)
  var sy = (ty * settings.scale)

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

  var sx = px / settings.scale
  var sy = py / settings.scale

  var tx = sx + settings.left
  var ty = sy + settings.top

  return new Point(tx, ty)
}

function resetAnimationTimer(count=5) {
  if (!active) {
    timerId = setInterval(() => {
      timeout--
      if (timeout == 0) {
        clearInterval(timerId)
        stop()
      } else {
        // ipc.send('console', timeout)
      }
    }, 50)
    start()
  }
  timeout = count
}

function zoomBy(x) {
  settings.scale += x
  if (settings.scale < 0.1) settings.scale = 0.1
  if (settings.scale > 4) settings.scale = 4
  resetAnimationTimer()
}

function scrollBy(dx, dy) {
  settings.left += dx
  settings.top += dy

  let xmax = image.width / 2
  let ymax = image.height / 2

  if (settings.left < -xmax) {
    settings.left = -xmax
  } else if (settings.left > xmax) {
    settings.left = xmax
  }
  if (settings.top < -ymax) {
    settings.top = -ymax
  } else if (settings.top > ymax) {
    settings.top = ymax
  }

  resetAnimationTimer()
}


function draw(quality='medium') {
  ctx = canvas.getContext('2d')
  ctx.save()
  ctx.clearRect(0, 0, width, height)

  if (!incognito) {
    ctx.fillStyle = 'rgb(0, 192, 255)'
    ctx.globalAlpha = 0.05
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
  }

  if (initialised) {
    p = worldToCanvas(0, 0)
    w = image.width * settings.scale
    h = image.height * settings.scale
    ctx.imageSmoothingQuality = quality
    ctx.globalAlpha = settings.opacity
    ctx.drawImage(image, p.x - (w/2), p.y - (h/2), w, h)
    ctx.globalAlpha = 1
  }

  if (hintTimerId) {
    let fontSize = 40

    ctx.fillStyle = 'white'
    ctx.font = fontSize + 'px sans-serif'
    let text = Math.round(settings.opacity * 100) + '%'
    let tm = ctx.measureText(text)

    // let x = width / 2 - tm.width / 2
    let x = 16
    let y = height - 16

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(x - 8, y - fontSize, tm.width + 16, fontSize + fontSize * 0.2)
    ctx.fillStyle = 'white'
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
  settings.left = 0
  settings.top = 0
  settings.scale = 1
  draw()
  // ipc.send('console', 'center')
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
  // ipc.send('console', 'start-animation')
}


function stop() {
  active = false
  cancelAnimationFrame(requestAnimationFrameId)
  updateInfo()
  draw()
  // ipc.send('console', 'stop-animation')
}


function updateOpacity(value) {
  settings.opacity = value
  settings.opacity = (settings.opacity >= 0.05 ? settings.opacity : 0.05)
  settings.opacity = (settings.opacity <= 1 ? settings.opacity : 1)
  resetAnimationTimer(10)

  hintOpacity = 1

  if (!hintTimerId) {
    hintTimerId = setInterval(() => {
      hintOpacity = hintOpacity - 0.1
      if (hintOpacity <= 0) {
        clearInterval(hintTimerId)
        hintTimerId = null
        draw()
      }
    }, 50)
  }
}

function setTitle(name) {
  titleEl.innerHTML = name
}

function onKeyDown(event) {
  if ((event.key == '=' || event.key == '+')) {
    updateOpacity(settings.opacity + 0.05)
  } else if (event.key == '-') {
    updateOpacity(settings.opacity - 0.05)
  } else if (event.key == ',') {
    zoomBy(-0.5)
  } else if (event.key == '.') {
    zoomBy(0.5)
  } else if ((event.key == 'Delete' || event.key == 'Backspace') && !event.repeat) {
    ipc.send('close-image')
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
  let x = e.deltaX / settings.scale
  let y = e.deltaY / settings.scale
  if (e.ctrlKey) {
    zoomBy(-e.deltaY * (settings.scale * 0.01))
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
      // ipc.send('console', e.buttons)
      // settings.left = 0
      // settings.top = 0
      // settings.scale = 1
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
      scrollBy(-e.movementX / settings.scale, -e.movementY / settings.scale)
    }
    else if (mode === 'zoom') {
      // zoomBy(e.movementX * (settings.scale * 0.002))
      zoomBy(e.movementX * (settings.scale * 0.0025))
    }
  }
  // ipc.send('console', 'image-window-mouse')
}

function onBlur(e) {
  // ipc.send('console', 'image-window-blur')
  overlayContainer.classList.remove('selected')
  container.classList.remove('selected');
  closeEl.classList.remove('selected');
  titleEl.classList.remove('selected');
  focused = false
  setMode(null)
}

function onFocus(e) {
  // ipc.send('console', 'image-window-focus')
  overlayContainer.classList.add('selected')
  container.classList.add('selected');
  closeEl.classList.add('selected');
  titleEl.classList.add('selected');
  focused = true
  setMode(null)
}

let resizeTimeoutId

function onResize(e) {
  if (!resizeTimeoutId) {
    resizeTimeoutId = setTimeout(function() {
      resizeTimeoutId = null
      width = window.innerWidth
      height = window.innerHeight - titlebarSize
      if (canvas) {
        canvas.width = width
        canvas.height = height
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

ipc.on('settings', function(event, arg) {
  for (i in arg) {
    settings[i] = arg[i]
  }
  updateOpacity(settings.opacity)
  isInitialised = true
})

ipc.on('picture', (event, arg) => {
  picture = arg
  image = new Image()
  image.onload = (e) => {
    initialised = true
    setTitle(picture.imageFilename)
    ipc.send('request-initialise', e.target.width, e.target.height + titlebarSize)
    draw()
  }
  image.src = picture.dataURL
})

ipc.on('initialised', (event, w, h) => {
  if (image.width > w && image.height > h) {
    let wr = w / image.width
    let hr = h / image.height
    settings.scale = wr > hr ? hr : wr
  } else if (image.width > w) {
    settings.scale = w / image.width
  } else if (image.height > h) {
    settings.scale = h / image.height
  }

  width = window.innerWidth
  height = window.innerHeight - titlebarSize

  setTitle(settings.scale)
  // ipc.send('console', 'initialised')
  draw()
})

ipc.on('incognito', function(event, arg) {
  settings.incognito = arg
  incognito = arg

  if (incognito) {
    overlayContainer.style.opacity = 0
    overlayContainer.classList.remove('border')
    container.classList.remove('selected')
    draw()
  } else {
    overlayContainer.classList.add('border')
    overlayContainer.style.opacity = 1
    container.classList.add('selected')
    draw()
  }
})
