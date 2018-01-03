const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow
const ipcRenderer = require('electron').ipcRenderer
const fs = require('fs')
const menu = require('../menu')

const Point = require('../point')
const Picture = require('../picture')
const Icon = require('../icon')

const thumbSize = 64

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
let title, eye, settings, close

const load = async(event, args) => {
  eye = document.getElementById('eye')
  close = document.getElementById('close')

  title = document.getElementById('title')

  eye.onclick = function() {
    ipcRenderer.send('request-incognito')
  }

  close.onclick = function() {
    ipcRenderer.send('request-quit')
  }

  if (process.platform === 'darwin') close.style.display = 'none'

  thumbnailContainer = document.getElementById('thumbnail-container')
  container = document.getElementById('container')
  perimeter = document.getElementById('perimeter')

  initEventListeners()

  title.innerHTML = remote.getCurrentWindow().getTitle()

  // remote.getCurrentWebContents().openDevTools({ mode: 'undocked' })

  menu.show()
}

ipcRenderer.on('load', load)

// remote.getCurrentWindow().on('focus', () => {
  // console.log('focus');
  // menu.show()
// })

function onWheel(e) {
  e.preventDefault();
}

function onKeyDown(event) {
  // console.log(event.key)
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

function onDrop(e) {
  e.preventDefault()
  e.stopPropagation()

  let file = e.dataTransfer.files[0]
  ipcRenderer.send('image-drop', file.path, e.clientX, e.clientY)
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

// function generateThumbnail(dataURL) {
//   let image = new Image()
//   image.onload = (e) => {
//     let img = e.target
//     let ratio = img.width / img.height
//     let canvas = document.createElement('canvas')
//     canvas.width = (thumbSize * ratio) >> 0
//     canvas.height = (thumbSize) >> 0
//     let ctx = canvas.getContext('2d')
//     ctx.fillStyle = 'black'
//     ctx.fillRect(0, 0, canvas.width, canvas.height)
//     ctx.imageSmoothingQuality = 'medium'
//     ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
//     let dataURL = canvas.toDataURL()
//     // return dataURL
//   }
//   image.src = dataURL
// }

ipcRenderer.on('thumbnails', function(event, arg) {
  // for (let i = 0; i < arg.length; i++) {
  //   createThumbnail(arg[i].data, arg[i].path)
  // }
})

ipcRenderer.on('remove-image', function(event, path) {
  // let found = null
  // for (let i = 0; i < thumbnailContainer.childNodes.length; i++) {
  //   let node = thumbnailContainer.childNodes[i]
  //   if (node.dataset.path === path) {
  //     found = node
  //     break
  //   }
  // }
  // if (found) {
  //   thumbnailContainer.removeChild(found)
  // }
})

ipcRenderer.on('new-picture', function(event, picture) {
  // generateThumbnail(picture.dataURL)
  // createThumbnail(arg.data, arg.path)
})

ipcRenderer.on('incognito', function(event, arg1) {
  incognito = arg1
  if (incognito) {
    container.style.opacity = 0
  } else {
    container.style.opacity = 1.0
  }
})
