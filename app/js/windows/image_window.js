const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer

const Point = require('../point')
const Picture = require('../picture')
const Icon = require('../icon')

const fs = require('fs')

let image, container, titleEl, closeEl
let overlayContainer, canvasContainer
let canvas, ctx, overlayCanvas
let width, height
let isInitialised = false
let mode = null

let incognito = false
let picture
let focusFrame

let focused = true
let active = false
let message

let settings = { scale: 1.0, opacity: 1.0, left: 0, top: 0 }

let mousedown = false

let timerId = null

window.onload = function (event) {
  container = document.getElementById('container')
  container.classList.add('selected');

  canvasContainer = document.getElementById('canvas-container')

  canvas = document.getElementById('surface')
  // canvasContainer.appendChild(canvas)
  width = window.innerWidth
  height = window.innerHeight
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

  // document.body.appendChild(overlayContainer)

  initEventListeners()

  if (!picture) ipc.send('request-image')
}

function worldToCanvas(x, y) {
  var tx = x - settings.left
  var ty = y - settings.top

  var sx = (tx * settings.scale)
  var sy = (ty * settings.scale)

  var widthHalf = (width * 0.5) >> 0
  var heightHalf = (height * 0.5) >> 0

  return new Point(sx + widthHalf, sy + heightHalf)
}


function canvasToWorld(x, y) {
  var widthHalf = (width / 2) >> 0
  var heightHalf = (height / 2) >> 0

  var px = x - widthHalf
  var py = y - heightHalf

  var sx = px / settings.scale
  var sy = py / settings.scale

  var tx = sx + settings.left
  var ty = sy + settings.top

  return new Point(tx, ty)
}

function resetAnimationTimer() {
  if (timerId) {
    clearTimeout(timerId)
  }
  timerId = setTimeout(() => {
      // clearInterval(timerId)
      timerId = null
      stop()
  }, 1000)
  if (!active) start()
}

function zoomBy(x) {
  settings.scale += x
  if (settings.scale < 0.5) settings.scale = 0.5
  if (settings.scale > 4) settings.scale = 4
  resetAnimationTimer()
}

function scrollBy(dx, dy) {
  settings.left += dx
  settings.top += dy

  let xmax = picture.image.width / 2
  let ymax = picture.image.height / 2

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


function draw() {
  ctx = canvas.getContext('2d')
  ctx.save()
  ctx.clearRect(0, 0, width, height)

  if (!incognito) {
    ctx.fillStyle = 'rgba(0, 192, 255, 0.1)'
    ctx.fillRect(0, 0, width, height)
  }

  p = worldToCanvas(picture.x, picture.y)
  w = picture.image.width * settings.scale
  h = picture.image.height * settings.scale

  ctx.globalAlpha = settings.opacity
  ctx.drawImage(picture.image, p.x - w * 0.5, p.y - h * 0.5, w >> 0, h >> 0)

  // ctx.fillStyle = 'white'
  // ctx.font = '48px sans-serif'
  // ctx.fillText(settings.left, 50, 100)

  ctx.restore()
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
    requestAnimationFrame(frame)
    draw()
  }
}


function start() {
  active = true
  requestAnimationFrame(frame)
  // ipc.send('console', 'start-animation')
}


function stop() {
  active = false
  // ipc.send('console', 'stop-animation')
}


function updateOpacity(value) {
  // opacity = settings.opacity
  // opacity = opacity - 0.05
  settings.opacity = value
  settings.opacity = (settings.opacity >= 0.05 ? settings.opacity : 0.05)
  settings.opacity = (settings.opacity <= 1 ? settings.opacity : 1)

  draw()
  // canvasContainer.style.opacity = settings.opacity
  // overlayContainer.style.opacity = 1
  // ipc.send('console', settings.opacity)
}

function setTitle(name) {
  titleEl.innerHTML = name
}

let thumbSize = 64

function generateThumbnail() {
  let img = picture.image
  let ratio = img.width / img.height
  let canvas = document.createElement('canvas')
  canvas.width = (thumbSize * ratio) >> 0
  canvas.height = (thumbSize) >> 0
  let ctx = canvas.getContext('2d')
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingQuality = 'medium'
  // console.log(ctx.imageSmoothingQuality)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  let dataURL = canvas.toDataURL()
  return dataURL
}

function onImageReceived() {
  // dragOn()
  // ipc.send('console', 'image-received')
  let thumbnail = generateThumbnail()
  ipc.send('thumbnail', thumbnail)
  // console.log();
  // start()
  draw()
}

function onKeyDown(event) {
  if ((event.key == '=' || event.key == '+')) {
    // opacity = settings.opacity
    // opacity = opacity + 0.05
    // opacity = (opacity <= 1.0 ? opacity : 1.0)
    // settings.opacity = opacity
    updateOpacity(settings.opacity + 0.05)

  } else if (event.key == '-') {
    // opacity = settings.opacity
    // opacity = opacity - 0.05
    // opacity = (opacity >= 0.05 ? opacity : 0.05)
    // settings.opacity = opacity
    updateOpacity(settings.opacity - 0.05)

  } else if (event.key == ',') {
    // scale = settings.scale
    // scale = scale - 0.5
    // scale = (scale < 0.5 ? 0.5 : scale)
    // settings.scale = scale
    zoomBy(-0.5)

  } else if (event.key == '.') {
    // scale = settings.scale
    // scale = scale + 0.5
    // scale = (scale > 8.0 ? 8.0 : scale)
    // settings.scale = scale
    zoomBy(0.5)

  } else if ((event.key == 'Delete' || event.key == 'Backspace') && !event.repeat) {
    ipc.send('close-image')

  } else if ((event.key == 'Shift') && !event.repeat) {
    dragOff()

  } else if ((event.key == 'Control') && !event.repeat) {
    dragOff()
  }
}

function onKeyUp(event) {
  if ((event.key == 'Shift') && !event.repeat) {
    dragOn()
  } else if ((event.key == 'Control') && !event.repeat) {
    dragOn()
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
  // ipc.send('console', e.deltaZ)
  let x = e.deltaX / settings.scale
  let y = e.deltaY / settings.scale
  // settings.left = settings.left + e.deltaX / settings.scale
  // settings.top = settings.top + e.deltaY / settings.scale
  if (e.ctrlKey) {
    zoomBy(-e.deltaY * (settings.scale * 0.01))
  } else {
    scrollBy(x, y)
  }
}

function onMouseDown(e) {
  if (e.shiftKey) {
    mode = 'pan'
    dragOff()
  } else if (e.ctrlKey) {
    mode = 'zoom'
    dragOff()
  } else {
    if (e.buttons & 2) {
      settings.left = 0
      settings.top = 0
    }
  }
}

function onMouseUp(e) {
  mode = null
}

function onMouseMove(e) {
  if (e.buttons & 1) {
    if (e.shiftKey) {
      if (mode !== 'pan') {
        mode = 'pan'
      }
    } else if (e.ctrlKey) {
      if (mode !== 'zoom') {
        mode = 'zoom'
      }
    } else {
      if (!mode) {
        // console.log('move', e.movementX)
        // ipc.send('move-window-by', e.movementX, e.movementY)
      }
    }

    if (mode === 'pan') {
      // settings.left = settings.left - e.movementX / settings.scale
      // settings.top = settings.top - e.movementY / settings.scale
      scrollBy(-e.movementX / settings.scale, -e.movementY / settings.scale)
      // saveSettings()

    } else if (mode === 'zoom') {
      if (image) {
        zoomBy(e.movementX * (settings.scale * 0.002))
      }
    }
  }
}

function onBlur(e) {
  overlayContainer.classList.remove('selected')
  container.classList.remove('selected');
  // dragContainer.classList.add('draggable')
  closeEl.classList.remove('selected');
  titleEl.classList.remove('selected');
  focused = false
  mode = null
}

function onFocus(e) {
  overlayContainer.classList.add('selected')
  container.classList.add('selected');
  // dragContainer.classList.add('draggable')
  closeEl.classList.add('selected');
  titleEl.classList.add('selected');
  focused = true
  mode = null
}

let resizeTimeout

function onResize(e) {
  if (!resizeTimeout) {
    resizeTimeout = setTimeout(function() {
      resizeTimeout = null

      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width
      canvas.height = height

      draw()
      // overlayCanvas.width = width - 16
      // overlayCanvas.height = height - 16

     // The actualResizeHandler will execute at a rate of 15fps
   }, 1000/30)
  }
}


function onScroll(e) {
  // console.log('scroll')
  // ipc.send('console', 'scroll')
}


function onContextMenu(e) {
  // console.log('contextmenu')
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

ipc.on('settings', function(event, arg1) {
  for (i in arg1) {
    settings[i] = arg1[i]
  }
  // container.style.opacity = settings.opacity
  updateOpacity(settings.opacity)
  isInitialised = true
  // ipc.send('console', settings)
})


ipc.on('initialise', function(event, imagePath) {
  isInitialised = true
  // console.log('initialise')
})


ipc.on('image', function(event, imagePath) {
  fs.readFile(imagePath, null, function(err, data) {
      image = new Image()
      image.src = 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64'))
      image.onload = (e) => {
        picture = new Picture(e.target, 0, 0)
        onImageReceived()
      }
      setTitle(filename)
  })

  index1 = imagePath.lastIndexOf('/')
  index2 = imagePath.lastIndexOf('\\')

  if (index1 > index2) {
    filename = imagePath.substring(index1 + 1)
  } else {
    if (index2 != -1)
      filename = imagePath.substring(index2 + 1)
  }
})


ipc.on('incognito', function(event, arg1) {
  settings.incognito = arg1
  incognito = arg1

  if (incognito) {
    overlayContainer.style.opacity = 0
    overlayContainer.classList.remove('border')
    // container.style.borderRadius = 0
    container.classList.remove('selected');
    stop()
    draw()
  } else {
    overlayContainer.classList.add('border')
    overlayContainer.style.opacity = 1
    // container.style.borderRadius = '6px'
    container.classList.add('selected');
    draw()
  }
})
