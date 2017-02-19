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

  // document.body.style.padding = '8px'

  container = document.createElement('div')
  container.style['-webkit-user-select'] = 'none'
  container.style.position = 'absolute'
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.overflow = 'hidden'
  container.style.margin = '0px'
  container.style.padding = '0px'
  container.style.boxSizing = 'border-box'
  container.style.border = '4px dashed white'
  container.style.borderRadius = '16px'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.25)'
  // container.style.backgroundColor = 'rgba(0, 255, 255, 0.25)'
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.justifyContent = 'center'

  hint = document.createElement('div')
  hint.style.color = 'white'
  // hint.style.font = '24px Tahoma, sans-serif'
  // hint.innerHTML = 'floatz'
  hint.style['-webkit-user-select'] = 'none'
  hint.style.cursor = 'default'
  container.appendChild(hint)

  document.body.appendChild(container)

  initEventListeners()

  // fs.readFile('file:///c:/users/dave/github/floatz/images/balloon.png', null, function(err, data) {
  //     image = new Image()
  //     image.src = 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64'))
  //     container.appendChild(image)
  //     console.log(image.src);
  //     // pictures[0] = new Picture(image, 0, 0)
  //     // draw()
  // });

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
  document.body.addEventListener("wheel", handleEvent); //add the event
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
