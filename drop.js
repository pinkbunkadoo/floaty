const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer

const Point = require('./point')
const Picture = require('./picture')

let container
let settings = { scale: 1.0, opacity: 1.0, left: 0, top: 0 }
let isInitialised = false
let mode = null
let incognito = false
let image

function update() {
}


function draw() {
}


function frame() {
  requestAnimationFrame(frame)

  update()
  draw()
}


window.onload = function (event) {
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
  // container.style.backgroundColor = 'rgba(0, 0, 0, 0.25)'
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.justifyContent = 'center'

  hint = document.createElement('div')
  hint.style.color = 'white'
  hint.style.font = '24px Tahoma, sans-serif'
  hint.innerHTML = 'floatz'
  hint.style['-webkit-user-select'] = 'none'
  hint.style.cursor = 'default'
  container.appendChild(hint)

  document.body.appendChild(container)

  requestAnimationFrame(frame)
  requestSettings()
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

  var reader = new FileReader()

  reader.addEventListener("load", function (event) {
      image = new Image()
      image.src = this.result
      image.title = file.name
      // console.log(this.result);

      // settings.path = file.path
      // settings.name = file.name
      // settings.left = 0
      // settings.top = 0
      //
      // canvas.width = window.innerWidth
      // canvas.height = window.innerHeight
      // overlayCanvas.width = window.innerWidth
      // overlayCanvas.height = window.innerHeight
      //
      // p = canvasToWorld(e.clientX, e.clientY)
      // picture = new Picture(image, 0, 0)
      // pictures[0] = picture
      //
      // ipc.send('image-drop', file.path)
      //
      // saveSettings()
    }, false)

  reader.readAsDataURL(file)
}


function onDragEnter(e) {
  e.preventDefault();
  e.stopPropagation();
}


function onDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
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
  else if (e.type == 'dragenter') onDragEnter(e);
  else if (e.type == 'dragover') onDragOver(e);
  else if (e.type == 'blur') onBlur(e);
  else if (e.type == 'focus') onFocus(e);
  // else if (e.type == 'resize') onResize(e);
  else if (e.type == 'scroll') onScroll(e);
  else if (e.type == 'contextmenu') onContextMenu(e);
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


function requestSettings() {
  ipc.send('request-settings');
}


function saveSettings() {
  ipc.send('save-settings', settings);
}


ipc.on('settings', function(event, arg1) {
  for (i in arg1) {
    settings[i] = arg1[i];
  }
  container.style.opacity = settings.opacity;

  if (settings.incognito) {
    // container.style.backgroundColor = '';
    // outline.style.opacity = 0.0;
    // info.style.opacity = 0.0;
  } else {
    // container.style.backgroundColor = 'white';
    // info.style.opacity = 1.0;
    // outline.style.opacity = 1.0;
  }

  if (isInitialised == false && !settings.incognito) {
    initEventListeners()
  }

  isInitialised = true
})


ipc.on('incognito', function(event, arg1) {
  // if (arg1) {
  //   overlayContainer.style.display = 'none'
  // } else {
  //   overlayContainer.style.display = 'block'
  // }
  settings.incognito = arg1
  incognito = arg1
})

