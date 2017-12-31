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
let active = true
let message

let settings = { scale: 1.0, opacity: 1.0, left: 0, top: 0 }

let mousedown = false

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

  ipc.send('request-image')
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


function draw() {
  ctx = canvas.getContext('2d')
  ctx.save()
  ctx.clearRect(0, 0, width, height)

  if (!incognito) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    ctx.fillRect(0, 0, width, height)
  }

  p = worldToCanvas(picture.x, picture.y)
  w = picture.image.width * settings.scale
  h = picture.image.height * settings.scale

  ctx.globalAlpha = settings.opacity
  ctx.drawImage(picture.image, p.x - w * 0.5, p.y - h * 0.5, w >> 0, h >> 0)

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
}


function stop() {
  active = false
}


function updateOpacity() {
  // canvasContainer.style.opacity = settings.opacity
  // overlayContainer.style.opacity = 1
  // ipc.send('console', settings.opacity)
}

function setTitle(name) {
  titleEl.innerHTML = name
}

function onImageReceived() {
  // overlayContainer.style.visibility = 'visible'
  // dragContainer.classList.add('draggable')
  dragOn()

  ipc.send('console', 'image-received')

  // let ratio = picture.image.height / picture.image.width
  // let canvas = document.createElement('canvas')
  // canvas.width = 56
  // canvas.height = (56 * ratio) >> 0
  //
  // let ctx = canvas.getContext('2d')
  // ctx.drawImage(picture.image, 0, 0, canvas.width, canvas.height)
  //
  // let dataURL = canvas.toDataURL()
  // ipc.send('thumbnail', dataURL)

  start()
}


function onWheel(e) {
  e.preventDefault()
}


function onKeyDown(event) {
  // console.log(event.key);
  if ((event.key == '=' || event.key == '+') && !event.repeat) {
    opacity = settings.opacity
    opacity = opacity + 0.1
    opacity = (opacity <= 1.0 ? opacity : 1.0)
    // container.style.opacity = opacity
    settings.opacity = opacity
    updateOpacity()

  } else if (event.key == '-' && !event.repeat) {
    opacity = settings.opacity
    opacity = opacity - 0.1
    opacity = (opacity >= 0.1 ? opacity : 0.1)
    // container.style.opacity = opacity
    settings.opacity = opacity
    updateOpacity()

  } else if (event.key == ',' && !event.repeat) {
    scale = settings.scale
    scale = scale - 0.5
    scale = (scale < 0.5 ? 0.5 : scale)
    settings.scale = scale

  } else if (event.key == '.' && !event.repeat) {
    scale = settings.scale
    scale = scale + 0.5
    scale = (scale > 8.0 ? 8.0 : scale)
    settings.scale = scale

  } else if ((event.key == 'Delete' || event.key == 'Backspace') && !event.repeat) {
    ipc.send('close-image')

  } else if ((event.key == 'Shift') && !event.repeat) {
    // ipc.send('console', 'shift')
    dragOff()
    // dragContainer.classList.remove('draggable')

  } else if ((event.key == 'Control') && !event.repeat) {
    // dragContainer.classList.remove('draggable')
    dragOff()
  }

  // message = event.key
  // draw()
}

function onKeyUp(event) {
  if ((event.key == 'Shift') && !event.repeat) {
    // ipc.send('console', 'shiftup')
    // dragContainer.classList.add('draggable')
    dragOn()
  } else if ((event.key == 'Control') && !event.repeat) {
    // dragContainer.classList.add('draggable')
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


function onMouseMove(e) {
  // ipc.send('console', 'move')

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
      settings.left = settings.left - e.movementX / settings.scale
      settings.top = settings.top - e.movementY / settings.scale
      // saveSettings()

    } else if (mode === 'zoom') {
      if (image) {
        // x = settings.left + canvas.width * 0.5
        // y = settings.top + canvas.height * 0.5

        settings.scale = (settings.scale + (e.movementX * (settings.scale * 0.002)))
        if (settings.scale < 0.5) settings.scale = 0.5
        if (settings.scale > 4) settings.scale = 4

        // settings.left = x - canvas.width * 0.5
        // settings.top = y - canvas.height * 0.5
      }
    }
  }
}

function onMouseDown(e) {
  if (e.shiftKey) {
    mode = 'pan'
    dragOff()
  } else if (e.ctrlKey) {
    mode = 'zoom'
    dragOff()
  }
}

function onMouseUp(e) {
  mode = null
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
      // overlayCanvas.width = width - 16
      // overlayCanvas.height = height - 16

     // The actualResizeHandler will execute at a rate of 15fps
   }, 66)
  }
}


function onScroll(e) {
  // console.log('scroll')
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
  updateOpacity()
  isInitialised = true
  ipc.send('console', settings)
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
    start()
  }
})
