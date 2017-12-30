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
  // svg = document.getElementById('icons')
  // for (var i = 0; i < svg.children.length; i++) {
  //   icon = svg.children[i]
  //   icons[icon.id] = { id: icon.id, width: icon.viewBox.baseVal.width, height: icon.viewBox.baseVal.height}
  // }

  settings = (new Icon('settings', 32, 32)).element()
  eye = (new Icon('eye', 32, 32)).element()

  eye.onclick = function() {
    ipc.send('request-incognito')
  }

  settings.onclick = function() {
    ipc.send('request-quit')
  }

  container = document.getElementById('container')

  bar = document.createElement('div')
  bar.style.display = 'flex'
  bar.style.alignItems = 'center'
  bar.style.justifyContent = 'flex-end'
  bar.style.width = '100%'
  bar.style.padding = '8px'
  bar.style.paddingRight = '16px'
  bar.style.position = 'fixed'
  bar.style.boxSizing = 'border-box'
  bar.style.bottom = '0px'
  // bar.style.bottom = '0px'

  bar.appendChild(eye)
  // svgcontainer.appendChild(settings)

  document.body.appendChild(bar)

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

function onResize(e) {
}

function handleEvent(e) {
  // if (e.type == 'keydown') onKeyDown(e);
  // else if (e.type == 'wheel') onWheel(e);
  // else if (e.type == 'mousedown') onMouseDown(e);
  // else if (e.type == 'mouseup') onMouseUp(e);
  // else if (e.type == 'mousemove') onMouseMove(e);
  // else if (e.type == 'dragstart') onDragStart(e);
  // else if (e.type == 'drag') onDrag(e);
  // else if (e.type == 'drop') onDrop(e);
  // else if (e.type == 'dragenter') onDragEnter(e)
  // else if (e.type == 'dragover') onDragOver(e)
  // else if (e.type == 'blur') onBlur(e)
  // else if (e.type == 'focus') onFocus(e)
  // else if (e.type == 'scroll') onScroll(e)
  // else if (e.type == 'contextmenu') onContextMenu(e)
}

function initEventListeners() {
  document.body.addEventListener("wheel", onWheel);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('dragstart', onDragStart);
  window.addEventListener('drag', onDrag);
  window.addEventListener('drop', onDrop);
  window.addEventListener('dragover', onDragOver);
  window.addEventListener('dragenter', onDragEnter);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('scroll', onScroll);
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  window.addEventListener('resize', onResize);
}

ipc.on('incognito', function(event, arg1) {
  incognito = arg1
  if (incognito) {
    container.style.opacity = 0
  } else {
    container.style.opacity = 1.0
  }
})
