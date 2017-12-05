const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer
const fs = require('fs')
// const app =  require('electron').app
const Point = require('./point')
const Picture = require('./picture')

let container
let isInitialised = false
let mode = null
let incognito = false
let image
let icons = {}

window.onload = function (event) {
  // container = document.createElement('div')
  // container.style['-webkit-user-select'] = 'none'
  // container.style.position = 'absolute'
  // container.style.width = '100%'
  // container.style.height = '100%'
  // container.style.overflow = 'hidden'
  // container.style.margin = '0px'
  // container.style.padding = '8px'
  // container.style.boxSizing = 'border-box'
  // container.style.borderRadius = '24px'
  // container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  // container.style.display = 'flex'
  // container.style.alignItems = 'center'
  // container.style.justifyContent = 'center'
  //
  // document.body.appendChild(container)

  svg = document.getElementById('icons')
  for (var i = 0; i < svg.children.length; i++) {
    icon = svg.children[i]
    icons[icon.id] = { id: icon.id, width: icon.viewBox.baseVal.width, height: icon.viewBox.baseVal.height}
    // console.log(icons[icon.id])
  }

  settings = createIcon('settings', icons['settings'].width, icons['settings'].height)
  eye = createIcon('eye', icons['eye'].width, icons['eye'].height)

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
  svgcontainer.appendChild(settings)

  document.body.appendChild(svgcontainer)

  initEventListeners()
}

function createIcon(name, width, height) {
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink')
  svg.setAttribute('width', width)
  svg.setAttribute('height', height)
  svg.setAttribute('fill', 'white')

  var svguse = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  svguse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + name)

  svg.appendChild(svguse)

  svgcontainer = document.createElement('div')
  svgcontainer.style.display = 'flex'
  svgcontainer.style.alignItems = 'center'
  svgcontainer.style.justifyContent = 'center'
  svgcontainer.style.width = '24px'
  svgcontainer.style.minWidth = '24px'
  svgcontainer.style.height = '24px'
  svgcontainer.style.minHeight = '24px'
  svgcontainer.style.marginLeft = '8px'
  // svgcontainer.style.marginRight = '8px'
  // svgcontainer.style.border = '1px solid black'

  svgcontainer.appendChild(svg)

  return svgcontainer
}

function startup() {

}

function loadImages() {
  // icons = []
  // Loader.load('./images/icons.svg', function(event) {
  //   var svg = event.target.responseXML.documentElement
  //   for (var i = 0; i < svg.children.length; i++) {
  //     var child = svg.children[i]
  //     app.icons[child.id] = { width: child.viewBox.baseVal.width, height: child.viewBox.baseVal.height }
  //   }
  //   document.body.appendChild(svg)
  //   app.startup()
  // })
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
  if (e.buttons & 1) {
    ipc.send('move-window-by', e.movementX, e.movementY)
  }
}

function onMouseUp(e) {
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

  // console.log(event)

  if (incognito) {
    container.style.opacity = 0
    // stop()
  } else {
    container.style.opacity = 1.0
    // start()
  }
})
