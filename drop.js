const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer
const fs = require('fs')
// const app =  require('electron').app
const Point = require('./point')
const Picture = require('./picture')
const Icon = require('./icon')

let container
let isInitialised = false
let mode = null
let incognito = false
let image
let icons = {}
let mx = 0
let my = 0
let previousmx = 0
let previousmy = 0

window.onload = function (event) {

  svg = document.getElementById('icons')
  for (var i = 0; i < svg.children.length; i++) {
    icon = svg.children[i]
    icons[icon.id] = { id: icon.id, width: icon.viewBox.baseVal.width, height: icon.viewBox.baseVal.height}
  }

  settings = (new Icon('settings', icons['settings'].width, icons['settings'].height)).element()
  eye = (new Icon('eye', icons['eye'].width, icons['eye'].height)).element()

  eye.onclick = function() {
    ipc.send('request-incognito')
  }

  settings.onclick = function() {
    ipc.send('request-quit')
  }

  container = document.getElementById('container')

  svgcontainer = document.createElement('div')
  svgcontainer.style.display = 'flex'
  svgcontainer.style.alignItems = 'center'
  svgcontainer.style.justifyContent = 'flex-end'
  svgcontainer.style.width = '100%'
  // svgcontainer.style.height = '32px'
  svgcontainer.style.padding = '8px'
  svgcontainer.style.position = 'fixed'
  svgcontainer.style.boxSizing = 'border-box'

  svgcontainer.appendChild(eye)
  // svgcontainer.appendChild(settings)

  document.body.appendChild(svgcontainer)

  initEventListeners()
}

function startup() {

}

function onWheel(e) {
  e.preventDefault();
}


function onKeyDown(event) {
  if (event.key == '=' && !event.repeat) {
  }
}

function onDragStart(e) {
  e.preventDefault();
  e.stopPropagation();
}

function onDrag(e) {
  e.preventDefault();
  e.stopPropagation();
}

function onImageLoad(e) {
}

function onDrop(e) {
  e.preventDefault()
  e.stopPropagation()

  file = e.dataTransfer.files[0]
  ipc.send('image-drop', file.path)
}

function onDragEnter(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onDragOver(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onMouseMove(e) {
  mx = e.clientX
  my = e.clientY
  let dx = mx - previousmx
  let dy = my - previousmy

  if (e.buttons & 1) {
    // if (e.movementX < 100 && e.movementY < 100) {
      // ipc.send('move-window-by', e.movementX, e.movementY)
    // }
      // ipc.send('move-window-by', dx, dy)

    // console.log(e.movementX, e.movementY)
  }
  previousmx = mx
  previousmy = my

  // ipc.send('console', e.clientX + ',' + e.clientY)
}

function onMouseDown(e) {
  // ipc.send('console', e.clientX + ',' + e.clientY)
  // console.log();
  // mx = 0
  // my = 0
  // previousmx = 0
  // previousmy = 0
}

function onMouseUp(e) {
  mx = 0
  my = 0
  previousmx = 0
  previousmy = 0
}

function onBlur(e) {
  // console.log('blur');
}

function onFocus(e) {
  // console.log('focus');
}

function onScroll(e) {
}

function onContextMenu(e) {
  // console.log('contextmenu');
}

function handleEvent(e) {
  if (e.type == 'keydown') onKeyDown(e);
  else if (e.type == 'wheel') onWheel(e);
  else if (e.type == 'mousedown') onMouseDown(e);
  else if (e.type == 'mouseup') onMouseUp(e);
  else if (e.type == 'mousemove') onMouseMove(e);
  else if (e.type == 'dragstart') onDragStart(e);
  else if (e.type == 'drag') onDrag(e);
  else if (e.type == 'drop') onDrop(e);
  else if (e.type == 'dragenter') onDragEnter(e)
  else if (e.type == 'dragover') onDragOver(e)
  else if (e.type == 'blur') onBlur(e)
  else if (e.type == 'focus') onFocus(e)
  else if (e.type == 'scroll') onScroll(e)
  else if (e.type == 'contextmenu') onContextMenu(e)
}

function initEventListeners() {
  document.body.addEventListener("wheel", handleEvent);
  window.addEventListener('keydown', handleEvent);
  window.addEventListener('dragstart', handleEvent);
  window.addEventListener('drag', handleEvent);
  window.addEventListener('drop', handleEvent);
  window.addEventListener('dragover', handleEvent);
  window.addEventListener('dragenter', handleEvent);
  window.addEventListener('mousedown', handleEvent);
  window.addEventListener('mouseup', handleEvent);
  window.addEventListener('mousemove', handleEvent);
  window.addEventListener('scroll', handleEvent);
  window.addEventListener('contextmenu', handleEvent);
  window.addEventListener('blur', handleEvent);
  window.addEventListener('focus', handleEvent);
  window.addEventListener('resize', handleEvent);
}

ipc.on('incognito', function(event, arg1) {
  incognito = arg1
  if (incognito) {
    container.style.opacity = 0
  } else {
    container.style.opacity = 1.0
  }
})
