const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer

const Point = require('../point')
const Picture = require('../picture')
const Icon = require('../icon')

const fs = require('fs')

let image, container, titleEl, closeEl
let overlayContainer
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

  width = window.innerWidth
  height = window.innerHeight

  canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  // canvas.style.background = 'red';

  // ctx = canvas.getContext('2d')
  container.appendChild(canvas)

  // overlayCanvas = document.createElement('canvas')
  // overlayCanvas.width = width - 16
  // overlayCanvas.height = height - 16

  // overlayContainer = document.createElement('div')
  overlayContainer = document.getElementById('overlay-container')
  overlayContainer.classList.add('border')
  overlayContainer.classList.add('selected')

  dragContainer = document.getElementById('drag-container')
  // dragContainer.style['-webkit-user-select'] = 'none'
  // dragContainer.style.flex = 'auto'
  dragContainer.classList.add('draggable')

  // overlayContainer.appendChild(dragContainer)

  // overlayContainer.appendChild(overlayCanvas)

  closeEl = document.getElementById('close')
  // closeEl.classList.add('close');
  closeEl.classList.add('background');
  closeEl.classList.add('selected');

  // let closeIcon = (new Icon('close', 24, 24)).element()
  // closeEl.appendChild(closeIcon)

  closeEl.addEventListener('click', (event) => {
    ipc.send('close-image')
  })

  // overlayContainer.appendChild(closeEl)

  titleEl = document.getElementById('title')
  // titleEl.classList.add('title');
  titleEl.classList.add('background');
  titleEl.classList.add('selected');
  titleEl.innerHTML = ''

  // overlayContainer.appendChild(titleEl)

  document.body.appendChild(overlayContainer)

  // start()
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
  // width = canvas.width
  // height = canvas.height

  ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)

  if (!incognito) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    ctx.fillRect(0, 0, width, height)
  }

  p = worldToCanvas(picture.x, picture.y)

  w = picture.image.width * settings.scale
  h = picture.image.height * settings.scale

  ctx.drawImage(picture.image, p.x - w * 0.5, p.y - h * 0.5, w >> 0, h >> 0)

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
  container.style.opacity = settings.opacity
}

function setTitle(name) {
  titleEl.innerHTML = name
}

function onImageReceived() {
  overlayContainer.style.visibility = 'visible'
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
    container.style.opacity = opacity
    settings.opacity = opacity
    updateOpacity()

  } else if (event.key == '-' && !event.repeat) {
    opacity = settings.opacity
    opacity = opacity - 0.1
    opacity = (opacity >= 0.1 ? opacity : 0.1)
    container.style.opacity = opacity
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
    dragContainer.classList.remove('draggable')

  } else if ((event.key == 'Control') && !event.repeat) {
    dragContainer.classList.remove('draggable')
  }

  // message = event.key
  // draw()
}

function onKeyUp(event) {
  if ((event.key == 'Shift') && !event.repeat) {
    // ipc.send('console', 'shiftup')
    dragContainer.classList.add('draggable')
  } else if ((event.key == 'Control') && !event.repeat) {

    dragContainer.classList.add('draggable')
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
    dragContainer.classList.remove('draggable')
  } else if (e.ctrlKey) {
    mode = 'zoom'
    dragContainer.classList.remove('draggable')
  }
  // if (!e.shiftKey)
  //   dragContainer.classList.add('draggable')
}

function onMouseUp(e) {
  mode = null
  // if (!e.shiftKey) dragContainer.classList.add('draggable')
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


function handleEvent(e) {
  // if (e.type == 'keydown') onKeyDown(e)
  // else if (e.type == 'keyup') onKeyUp(e)
  // else if (e.type == 'wheel') onWheel(e)
  // else if (e.type == 'mouseup') onMouseUp(e)
  // else if (e.type == 'mousedown') onMouseDown(e)
  // else if (e.type == 'mousemove') onMouseMove(e)
  // else if (e.type == 'dragstart') onDragStart(e)
  // else if (e.type == 'drag') onDrag(e)
  // else if (e.type == 'drop') onDrop(e)
  // else if (e.type == 'dragenter') onDragEnter(e)
  // else if (e.type == 'dragover') onDragOver(e)
  // else if (e.type == 'blur') onBlur(e)
  // else if (e.type == 'focus') onFocus(e)
  // else if (e.type == 'resize') onResize(e)
  // else if (e.type == 'scroll') onScroll(e)
  // else if (e.type == 'contextmenu') onContextMenu(e)
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


// function requestSettings() {
  // ipc.send('request-settings');
// }


// function saveSettings() {
//   ipc.send('save-settings', settings);
// }


ipc.on('settings', function(event, arg1) {
  for (i in arg1) {
    settings[i] = arg1[i]
  }
  container.style.opacity = settings.opacity
  isInitialised = true
})


ipc.on('initialise', function(event, imagePath) {
  isInitialised = true
  // console.log('initialise')
})


ipc.on('image', function(event, imagePath) {
  // console.log('image:', imagePath)

  fs.readFile(imagePath, null, function(err, data) {
      // console.log(imagePath);
      image = new Image()
      image.src = 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64'))
      picture = new Picture(image, 0, 0)
      setTitle(filename)
      onImageReceived();
  })

  index1 = imagePath.lastIndexOf('/')
  index2 = imagePath.lastIndexOf('\\')

  if (index1 > index2) {
    filename = imagePath.substring(index1 + 1)
  } else {
    if (index2 != -1)
      filename = imagePath.substring(index2 + 1)
  }

  // overlayContainer.title = imagePath
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
