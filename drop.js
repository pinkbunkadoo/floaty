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


window.onload = function (event) {
  console.log('dropWindow')

  container = document.createElement('div')
  container.style['-webkit-user-select'] = 'none'
  container.style.position = 'absolute'
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.overflow = 'hidden'
  container.style.margin = '0px'
  container.style.padding = '8px'
  container.style.boxSizing = 'border-box'
  // container.style.border = '2px solid white'
  container.style.borderRadius = '24px'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.25)'
  // container.style.backgroundColor = 'rgba(0, 255, 255, 0.25)'
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.justifyContent = 'center'

  // hint = document.createElement('div')
  // hint.style.color = 'white'
  // hint.style.font = '24px Tahoma, sans-serif'
  // hint.innerHTML = 'floatz'
  // hint.style['-webkit-user-select'] = 'none'
  // hint.style.cursor = 'default'
  // container.appendChild(hint)

  document.body.appendChild(container)

  // inner = document.createElement('div')
  // // inner.style.backgroundColor = 'rgba(0, 0, 0, 0.25)'
  // inner.style.boxSizing = 'border-box'
  // inner.style.border = '4px solid white'
  // inner.style.borderRadius = '16px'
  // // inner.style.margin = '8px'
  // inner.style.width = '100%'
  // inner.style.height = '100%'
  // inner.style.display = 'flex'
  // inner.style.alignItems = 'center'
  // inner.style.justifyContent = 'center'
  // container.appendChild(inner)

  initEventListeners()

  image = new Image()
  image.src = './images/drop.png'
  container.appendChild(image)
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

// <video class="wp-video-shortcode" id="video-1853-1" width="860" height="493" poster="http://www.b99.tv/wp-content/uploads/2015/01/From-Hare-to-Heir.jpg" preload="metadata" src="http://www.b99.tv/wp-content/uploads/2015/01/Bugs-Bunny-From-Hare-to-Heir.mp4?_=1" style="width: 100%; height: 100%;"><source type="video/mp4" src="http://www.b99.tv/wp-content/uploads/2015/01/Bugs-Bunny-From-Hare-to-Heir.mp4?_=1"><a href="http://www.b99.tv/wp-content/uploads/2015/01/Bugs-Bunny-From-Hare-to-Heir.mp4">http://www.b99.tv/wp-content/uploads/2015/01/Bugs-Bunny-From-Hare-to-Heir.mp4</a></video>

function onDragEnter(e) {
  e.preventDefault()
  e.stopPropagation()
}


function onDragOver(e) {
  e.preventDefault()
  e.stopPropagation()

  // e.dataTransfer.dropEffect = "none"
}


function onMouseMove(e) {
  if (e.buttons & 1) {
    ipc.send('move-window-by', e.movementX, e.movementY)
  }
}


function onMouseUp(e) {
}


function onBlur(e) {
}


function onFocus(e) {
}


function onScroll(e) {
}


function onContextMenu(e) {
  console.log('contextmenu');
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

  if (incognito) {
    container.style.opacity = 0
    // stop()
  } else {
    container.style.opacity = 1.0
    // start()
  }
})
