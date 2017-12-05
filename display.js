const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer

const Point = require('./point')
const Picture = require('./picture')

const fs = require('fs')

let image, container, holder, outline, info
let canvas, ctx, overlayCanvas
let overlayContainer
let settings = { scale: 1.0, opacity: 1.0, left: 0, top: 0 }
let isInitialised = false
let mode = null
let frameNo = 0
let incognito = false
let picture
let focusFrame
let hasFocus = true
let focused = true
let active = true
let message


window.onload = function (event) {
  container = document.createElement('div')
  container.style['-webkit-user-select'] = 'none'
  container.style.position = 'absolute'
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.overflow = 'hidden'
  container.style.margin = '0px'
  container.style.padding = '0px'
  // container.style.borderRadius = '6px'
  container.style.boxSizing = 'border-box'
  // container.style.border = '3px solid rgba(255, 255, 255, 1)'

  document.body.appendChild(container)

  canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  ctx = canvas.getContext('2d')

  container.appendChild(canvas)

  overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = window.innerWidth
  overlayCanvas.height = window.innerHeight

  overlayContainer = document.createElement('div')
  overlayContainer.style['-webkit-user-select'] = 'none'
  overlayContainer.style.position = 'absolute'
  overlayContainer.style.width = '100%'
  overlayContainer.style.height = '100%'
  overlayContainer.style.overflow = 'hidden'
  overlayContainer.style.margin = '0px'
  overlayContainer.style.padding = '0px'
  // overlayContainer.style.border = '3px solid rgba(255, 255, 255, 1)'
  // overlayContainer.style.borderRadius = '6px'
  overlayContainer.style.boxSizing = 'border-box'

  overlayContainer.appendChild(overlayCanvas)

  close = document.createElement('div')
  close.style.position = 'fixed'
  close.style.right = '10px'
  close.style.top = '10px'
  close.style['-webkit-user-select'] = 'none'
  close.style.cursor = 'default'
  close.style.width = '32px'
  close.style.height = '32px'
  close.style.textAlign = 'center'
  close.style.color = 'white'
  close.style.fontSize = '24px'
  close.style.fontFamily = 'sans-serif'
  // close.style.border = '1px solid red'
  close.style.boxSizing = 'border-box'

  close.addEventListener('click', (event) => {
    ipc.send('close-image')
  })

  overlayContainer.appendChild(close)

  // focusFrame = document.createElement('div')
  // focusFrame.style.position = 'absolute'
  // focusFrame.style.left = '16px'
  // focusFrame.style.top = '16px'
  // focusFrame.style.border = '6px solid white'
  // focusFrame.style.width = '80%'
  // focusFrame.style.height = '80%'
  // focusFrame.style.borderRadius = '16px'
  //
  // overlayContainer.appendChild(focusFrame)

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

  var widthHalf = (canvas.width * 0.5) >> 0
  var heightHalf = (canvas.height * 0.5) >> 0

  return new Point(sx + widthHalf, sy + heightHalf)
}


function canvasToWorld(x, y) {
  var widthHalf = (canvas.width / 2) >> 0
  var heightHalf = (canvas.height / 2) >> 0

  var px = x - widthHalf
  var py = y - heightHalf

  var sx = px / settings.scale
  var sy = py / settings.scale

  var tx = sx + settings.left
  var ty = sy + settings.top

  return new Point(tx, ty)
}


function draw() {
  width = canvas.width
  height = canvas.height

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

  ctx = overlayCanvas.getContext('2d')

  ctx.clearRect(0, 0, width, height)

  // close icon

  ctx.fillStyle = focused ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.25)'
  ctx.beginPath()
  ctx.arc(width - 26, 26, 16, 0, 2 * Math.PI, false)
  // ctx.closePath()
  ctx.fill()

  ctx.lineWidth = 4
  ctx.strokeStyle = focused ? 'white' : 'rgba(255, 255, 255, 0.5)'
  ctx.beginPath()
  ctx.moveTo(width - 26 - 6, 26 - 6)
  ctx.lineTo(width - 26 + 6, 26 + 6)
  ctx.moveTo(width - 26 + 6, 26 - 6)
  ctx.lineTo(width - 26 - 6, 26 + 6)
  ctx.stroke()

  if (focused) {
    // ctx.lineWidth = 6
    // ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
    // ctx.beginPath()
    // ctx.arc(width / 2, height / 2, 16, 0, 2 * Math.PI)
    // ctx.stroke()
  }

  // ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
  // ctx.lineWidth = 8
  // ctx.beginPath()
  // ctx.rect(0, 0, width, height)
  // ctx.stroke()

  ctx.font = '18px sans-serif'
  tm = ctx.measureText(filename)

  ctx.fillStyle = focused ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.25)'
  ctx.fillRect(8, height - 8 - 32, tm.width + 16, 32)

  ctx.fillStyle = focused ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'
  ctx.fillText(filename, 16, height - 18)
}


function update() {
}


function frame() {
  if (active) {
    requestAnimationFrame(frame)
    update()
    draw()
    frameNo++
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
  }

  // message = event.key
  // draw()
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
  if (e.buttons & 1) {
    if (e.shiftKey) {
      if (mode !== 'drag') {
        mode = 'drag'
      }
    } else if (e.ctrlKey) {
      if (mode !== 'zoom') {
        mode = 'zoom'
      }
    } else {
      if (!mode) {
        // console.log('move', e.movementX)
        ipc.send('move-window-by', e.movementX, e.movementY)
      }
    }

    if (mode === 'drag') {
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


function onMouseUp(e) {
  mode = null
}


function onBlur(e) {
  mode = null
  hasFocus = false
  // overlayContainer.style.border = '3px solid rgba(255, 255, 255, 0.5)'
  // active = false
  focused = false
}


function onFocus(e) {
  mode = null
  hasFocus = true
  // overlayContainer.style.border = '3px solid rgba(255, 255, 255, 1)'
  // active = true
  focused = true
}

let resizeTimeout

function onResize(e) {
  if (!resizeTimeout) {
    resizeTimeout = setTimeout(function() {
      resizeTimeout = null

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      overlayCanvas.width = window.innerWidth
      overlayCanvas.height = window.innerHeight

     // The actualResizeHandler will execute at a rate of 15fps
   }, 66)
  }
}


function onScroll(e) {
  console.log('scroll')
}


function onContextMenu(e) {
  console.log('contextmenu')
}


function handleEvent(e) {
  if (e.type == 'keydown') onKeyDown(e)
  else if (e.type == 'wheel') onWheel(e)
  else if (e.type == 'mouseup') onMouseUp(e)
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
  console.log('image:', imagePath)

  fs.readFile(imagePath, null, function(err, data) {
      image = new Image()
      image.src = 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64'))
      picture = new Picture(image, 0, 0)
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
    stop()
    draw()
  } else {
    // container.style.borderRadius = '6px'
    overlayContainer.style.opacity = 1
    start()
  }
})
