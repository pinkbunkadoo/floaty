const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer

const Point = require('./point')
const Picture = require('./picture')
const Icon = require('./icon')

const fs = require('fs')

let image, container
let overlayContainer
let canvas, ctx, overlayCanvas
let title
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
let icons = {}

let mousedown = false


window.onload = function (event) {

  svg = document.getElementById('icons')
  for (var i = 0; i < svg.children.length; i++) {
    icon = svg.children[i]
    icons[icon.id] = { id: icon.id, width: icon.viewBox.baseVal.width, height: icon.viewBox.baseVal.height}
  }

  container = document.getElementById('container')

  width = window.innerWidth
  height = window.innerHeight

  canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  // ctx = canvas.getContext('2d')
  container.appendChild(canvas)

  // overlayCanvas = document.createElement('canvas')
  // overlayCanvas.width = width - 16
  // overlayCanvas.height = height - 16

  overlayContainer = document.createElement('div')
  overlayContainer.style['-webkit-user-select'] = 'none'
  overlayContainer.style.overflow = 'hidden'
  overlayContainer.style.display = 'flex'
  overlayContainer.style.width = '100%'
  overlayContainer.style.height = '100%'
  overlayContainer.style.padding = '6px'
  overlayContainer.style.position = 'fixed'
  // overlayContainer.style.borderRadius = '6px'
  // overlayContainer.style.border = '1px solid blue'
  // overlayContainer.style.border = '2px solid rgba(255, 255, 255, 1)'
  overlayContainer.style.boxSizing = 'border-box'

  overlayContainer.classList.add('border')
  overlayContainer.classList.add('selected')

  dragContainer = document.createElement('div')
  dragContainer.style['-webkit-user-select'] = 'none'
  // dragContainer.style['-webkit-app-region'] = 'drag'
  dragContainer.style.flex = 'auto'
  // dragContainer.style.border = '1px solid blue'

  dragContainer.classList.add('draggable')

  overlayContainer.appendChild(dragContainer)

  // overlayContainer.appendChild(overlayCanvas)

  close = document.createElement('div')
  close.style.position = 'fixed'
  close.style.display = 'flex'
  close.style.right = '8px'
  close.style.top = '8px'
  close.style.width = '32px'
  close.style.height = '32px'
  close.style.cursor = 'default'
  close.style.alignItems = 'center'
  close.style.justifyContent = 'center'
  close.style['-webkit-user-select'] = 'none'
  close.style['-webkit-app-region'] = 'no-drag'
  close.style.boxSizing = 'border-box'
  close.style.borderRadius = '16px'
  close.style.background = 'rgba(32, 160, 255, 1)' //'rgba(0, 0, 0, 0.65)'


  let closeElement = (new Icon('close', icons['close'].width, icons['close'].height)).element()
  close.appendChild(closeElement)

  close.addEventListener('click', (event) => {
    ipc.send('close-image')
  })

  overlayContainer.appendChild(close)

  title = document.createElement('div')
  title.style.position = 'fixed'
  title.style.left = '8px'
  title.style.bottom = '8px'
  title.style.padding = '6px'
  title.style.height = '32px'
  title.style.color = 'white'
  title.style.fontSize = '18px'
  title.style.fontFamily =  'sans-serif'
  // title.style.border = '1px solid yellow'
  title.style.boxSizing = 'border-box'
  title.style.background = 'rgba(32, 160, 255, 1)'//'rgba(0, 0, 0, 0.65)'
  title.style.borderRadius = '4px'
  title.innerHTML = ''

  overlayContainer.appendChild(title)

  document.body.appendChild(overlayContainer)

  start()
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

  // ctx = overlayCanvas.getContext('2d')
  // ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
  //
  // // close icon
  //
  // ctx.fillStyle = focused ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.25)'
  // ctx.beginPath()
  // ctx.arc(overlayCanvas.width - 16, 16, 16, 0, 2 * Math.PI, false)
  // ctx.fill()
  //
  // ctx.font = '18px sans-serif'
  // tm = ctx.measureText(filename)
  //
  // ctx.fillStyle = focused ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.25)'
  // ctx.fillRect(0, overlayCanvas.height - 32, tm.width + 16, 32)
  //
  // ctx.fillStyle = focused ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'
  // ctx.fillText(filename, 8, overlayCanvas.height - 10)
}


function update() {
}


function frame() {
  if (active) {
    requestAnimationFrame(frame)
    update()
    draw()
    // frameNo++
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
  title.innerHTML = name
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
  mode = null
  // overlayContainer.style.border = '3px solid rgba(255, 255, 255, 0.5)'
  // overlayContainer.style.border = '2px solid rgba(128, 128, 128, 1)'
  overlayContainer.classList.remove('selected')
  dragContainer.classList.add('draggable')
  // overlayContainer.addClass('border')
  focused = false
}


function onFocus(e) {
  mode = null
  // overlayContainer.style.border = '3px solid rgba(255, 255, 255, 1)'
  // overlayContainer.style.border = '2px solid rgba(255, 255, 255, 1)'
  // overlayContainer.removeClass('border')
  overlayContainer.classList.add('selected')
  dragContainer.classList.add('draggable')
  focused = true
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
  if (e.type == 'keydown') onKeyDown(e)
  else if (e.type == 'keyup') onKeyUp(e)
  else if (e.type == 'wheel') onWheel(e)
  else if (e.type == 'mouseup') onMouseUp(e)
  else if (e.type == 'mousedown') onMouseDown(e)
  else if (e.type == 'mousemove') onMouseMove(e)
  else if (e.type == 'dragstart') onDragStart(e)
  else if (e.type == 'drag') onDrag(e)
  else if (e.type == 'drop') onDrop(e)
  else if (e.type == 'dragenter') onDragEnter(e)
  else if (e.type == 'dragover') onDragOver(e)
  else if (e.type == 'blur') onBlur(e)
  else if (e.type == 'focus') onFocus(e)
  else if (e.type == 'resize') onResize(e)
  else if (e.type == 'scroll') onScroll(e)
  else if (e.type == 'contextmenu') onContextMenu(e)
}


function initEventListeners() {
  document.body.addEventListener("wheel", handleEvent)
  window.addEventListener('keydown', handleEvent)
  window.addEventListener('keyup', handleEvent)
  window.addEventListener('dragstart', handleEvent)
  window.addEventListener('drag', handleEvent)
  window.addEventListener('drop', handleEvent)
  window.addEventListener('dragover', handleEvent)
  window.addEventListener('dragenter', handleEvent)
  window.addEventListener('mousedown', handleEvent)
  window.addEventListener('mouseup', handleEvent)
  window.addEventListener('mousemove', handleEvent)
  window.addEventListener('scroll', handleEvent)
  window.addEventListener('contextmenu', handleEvent)
  window.addEventListener('blur', handleEvent)
  window.addEventListener('focus', handleEvent)
  window.addEventListener('resize', handleEvent)
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
      image = new Image()
      image.src = 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64'))
      picture = new Picture(image, 0, 0)
      setTitle(filename)
      draw()
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
    // container.style.borderRadius = '0px'
    overlayContainer.style.opacity = 0
    // overlayContainer.style.border = '2px solid rgba(0, 0, 0, 0)'
    overlayContainer.classList.remove('border')
    stop()
    draw()
  } else {
    overlayContainer.classList.add('border')
    // overlayContainer.classList.add('selected')
    // container.style.borderRadius = '6px'
    overlayContainer.style.opacity = 1
    // overlayContainer.style.border = '2px solid rgba(0, 0, 0, 0.5)'
    start()
  }
})
