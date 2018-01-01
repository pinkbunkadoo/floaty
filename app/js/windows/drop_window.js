const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer
const fs = require('fs')
const Point = require('../point')
const Picture = require('../picture')
const Icon = require('../icon')

const thumbWidth = 128

let container, perimeter, thumbnailContainer
let isInitialised = false
let mode = null
let incognito = false
let image
let icons = {}
let mx = 0
let my = 0
let previousmx = 0
let previousmy = 0
let eye, settings, close

window.onload = function (event) {
  console.log('onload');

  eye = document.getElementById('eye')
  close = document.getElementById('close')

  eye.onclick = function() {
    ipc.send('request-incognito')
  }

  close.onclick = function() {
    ipc.send('request-quit')
  }

  if (process.platform === 'darwin') close.style.display = 'none'

  thumbnailContainer = document.getElementById('thumbnail-container')
  container = document.getElementById('container')
  perimeter = document.getElementById('perimeter')

  initEventListeners()

  // ipc.send('request-thumbnails')
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
  ipc.send('image-drop', file.path, e.clientX, e.clientY)
}

function onDragEnter(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onDragOver(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onMouseDown(e) {
}

function onMouseUp(e) {
  mx = 0
  my = 0
  previousmx = 0
  previousmy = 0
}

function onMouseMove(e) {
  mx = e.clientX
  my = e.clientY
  let dx = mx - previousmx
  let dy = my - previousmy

  previousmx = mx
  previousmy = my
}

function onMouseEnter(e) {
}

function onMouseLeave(e) {
}

function onMouseOver(e) {
}

function onMouseOut(e) {
}

function onBlur(e) {
}

function onFocus(e) {
}

function onScroll(e) {
}

function onContextMenu(e) {
}

function onResize(e) {
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
  window.addEventListener('mouseenter', onMouseEnter);
  window.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('mouseout', onMouseOut);
  window.addEventListener('mouseover', onMouseOver);
  window.addEventListener('scroll', onScroll);
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  window.addEventListener('resize', onResize);
}

function createThumbnail(dataURL, imagePath) {
  let image = new Image()
  image.src = dataURL
  image.onload = (e) => {
    let img = e.target
    let el = document.createElement('div')
    el.dataset.path = imagePath
    el.classList.add('thumbnail')
    el.appendChild(img)
    let w = (img.width * 0.5) >> 0
    let h = (img.height * 0.5) >> 0
    el.style.width = (w) + 'px'
    el.style.height = (h) + 'px'
    img.width = w
    img.height = h
    thumbnailContainer.appendChild(el)
  }
}

ipc.on('thumbnails', function(event, arg) {
  for (let i = 0; i < arg.length; i++) {
    createThumbnail(arg[i].data, arg[i].path)
  }
})

ipc.on('remove-image', function(event, path) {
  let found = null
  for (let i = 0; i < thumbnailContainer.childNodes.length; i++) {
    let node = thumbnailContainer.childNodes[i]
    if (node.dataset.path === path) {
      found = node
      break
    }
  }
  if (found) {
    thumbnailContainer.removeChild(found)
  }
})

ipc.on('new-image', function(event, arg) {
  createThumbnail(arg.data, arg.path)
})

ipc.on('incognito', function(event, arg1) {
  incognito = arg1
  if (incognito) {
    container.style.opacity = 0
  } else {
    container.style.opacity = 1.0
  }
})
