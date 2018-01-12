const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow
const ipcRenderer = require('electron').ipcRenderer
const fs = require('fs')
const menu = require('../menu')
const Menu = remote.Menu;

const Point = require('../point')
const Picture = require('../picture')
const Icon = require('../icon')

const thumbSize = 64

let isInitialised = false
let mode = null
let incognito = false
let image
let icons = {}
let mx = 0
let my = 0
let previousmx = 0
let previousmy = 0

let pictures = []

let containerEl, perimeterEl, thumbnailContainerEl, dropContainerEl, settingsContainerEl, pictureListContainerEl
let titleEl, eyeIconEl, settingsIconEl, closeIconEl, backIconEl

const load = async(event, args) => {
  // remote.getCurrentWebContents().openDevTools({ mode: 'undocked' })
  menu.show()
}

window.onload = () => {
  eyeIconEl = document.getElementById('eye-icon')
  closeIconEl = document.getElementById('close-icon')
  settingsIconEl = document.getElementById('settings-icon')
  backIconEl = document.getElementById('back-icon')

  titleEl = document.getElementById('title')
  dropContainerEl = document.getElementById('drop-container')
  settingsContainerEl = document.getElementById('settings-container')

  pictureListContainerEl = document.getElementById('picture-list-container')

  eyeIconEl.onclick = function() {
    ipcRenderer.send('requestIncognito')
  }

  closeIconEl.onclick = function() {
    ipcRenderer.send('requestQuit')
  }

  settingsIconEl.onclick = function() {
    showPage('settings')
  }

  backIconEl.onclick = function() {
    showPage('drop')
  }

  if (process.platform === 'darwin') closeIconEl.style.display = 'none'

  thumbnailContainerEl = document.getElementById('thumbnail-container')
  containerEl = document.getElementById('container')
  perimeterEl = document.getElementById('perimeter')

  titleEl.innerHTML = remote.getCurrentWindow().getTitle()

  initEventListeners()

  for (var i = 0; i < 30; i++) {
    newPicture(i + 100, 'bungalo' + i + '.png')
  }
}

window.onbeforeunload = () => {
}

function showPopup() {
  // popupMenu = Menu.buildFromTemplate([
  //   {
  //     label: 'Close All Images',
  //     click: () => {
  //       console.log('close all images')
  //     }
  //   }
  // ])
  // popupMenu.popup()
}

function showDrop() {
  dropContainerEl.style.display = 'flex'
}

function showSettings() {
  settingsContainerEl.style.display = 'flex'
  pictureListContainerEl.innerHTML = ''
  for (var i = 0; i < pictures.length; i++) {
    let picture = pictures[i]
    let el = document.createElement('div')
    let titleEl = document.createElement('div')
    let closeEl = document.createElement('div')

    el.classList.add('picture-list-item')
    titleEl.style.flex = 'auto'
    closeEl.style.padding = '0 0 0 12px'

    el.dataset.id = picture.id


    titleEl.innerHTML = picture.filename
    closeEl.innerHTML = 'X'

    el.appendChild(titleEl)
    el.appendChild(closeEl)

    closeEl.onclick = () => {
      ipcRenderer.send('requestCloseImage', picture.id)
    }
    pictureListContainerEl.appendChild(el)
  }
}

function showPage(name) {
  if (name === 'drop') {
    settingsContainerEl.style.display = 'none'
    showDrop()
  } else if (name === 'settings') {
    dropContainerEl.style.display = 'none'
    showSettings()
  }
}

function newPicture(id, filename) {
  // let el = document.createElement('div')
  // el.classList.add('thumbnail')
  // el.dataset.id = id
  // el.onclick = () => {
  //   ipcRenderer.send('focusWindow', id)
  // }
  // thumbnailContainerEl.appendChild(el)
  pictures.push({ id: id, filename: filename })
}

function removePicture(id) {
  let index = pictures.findIndex((element) => { return element.id == id })
  if (index > -1) {
    pictures.splice(index, 1)
  }

  // for (var i = 0; i < thumbnailContainerEl.childNodes.length; i++) {
  //   let childEl = thumbnailContainerEl.childNodes[i]
  //   if (childEl.dataset.id == id) {
  //     thumbnailContainerEl.removeChild(childEl)
  //     break
  //   }
  // }

  for (var i = 0; i < pictureListContainerEl.childNodes.length; i++) {
    let childEl = pictureListContainerEl.childNodes[i]
    if (childEl.dataset.id == id) {
      pictureListContainerEl.removeChild(childEl)
      break
    }
  }
}

function setIncognito(value) {
  incognito = value
  if (incognito) {
    containerEl.style.opacity = 0
  } else {
    containerEl.style.opacity = 1.0
  }
}

function onKeyDown(e) {
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

  let list = []

  for (var i = 0; i < e.dataTransfer.files.length; i++) {
    let file = e.dataTransfer.files[i]
    switch (file.type) {
      case 'image/webp':
      case 'image/bmp':
      case 'image/jpeg':
      case 'image/png':
        list.push({ name: file.name, path: file.path, type: file.type, size: file.size })
      default:
    }
  }

  if (list.length) ipcRenderer.send('imageDrop', list)
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
  // mx = 0
  // my = 0
  // previousmx = 0
  // previousmy = 0
}

function onMouseMove(e) {
  // mx = e.clientX
  // my = e.clientY
  // let dx = mx - previousmx
  // let dy = my - previousmy
  // previousmx = mx
  // previousmy = my
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

  document.addEventListener('dragover', (event) => {
    event.dataTransfer.dropEffect = 'none'
    event.preventDefault()
  })
  document.addEventListener('drop', (event) => {
    event.dataTransfer.dropEffect = 'none'
    event.preventDefault()
  })
  document.addEventListener('dragenter', (event) => {
    event.dataTransfer.dropEffect = 'none'
    event.preventDefault()
  })

  // dropContainerEl.addEventListener('dragstart', onDragStart)
  // dropContainerEl.addEventListener('drag', onDrag)

  dropContainerEl.addEventListener('drop', onDrop)
  dropContainerEl.addEventListener('dragover', onDragOver)
  dropContainerEl.addEventListener('dragenter', onDragEnter)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('scroll', onScroll)
  window.addEventListener('contextmenu', onContextMenu)
  window.addEventListener('blur', onBlur)
  window.addEventListener('focus', onFocus)
  window.addEventListener('resize', onResize)
}

ipcRenderer.on('load', load)

ipcRenderer.on('removePicture', function(event, id) {
  removePicture(id)
})

ipcRenderer.on('newPicture', function(event, id, filename) {
  newPicture(id, filename)
})

ipcRenderer.on('incognito', function(event, value) {
  setIncognito(value)
})
