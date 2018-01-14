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
let pages = {}

let pictures = []

let containerEl, pictureListContainerEl
let titleEl

const load = async(event, args) => {
}

window.onload = () => {
  icons['eye'] = document.getElementById('eye-icon')
  icons['close'] = document.getElementById('close-icon')
  icons['settings'] = document.getElementById('settings-icon')
  icons['help'] = document.getElementById('help-icon')

  titleEl = document.getElementById('title')

  pages['drop'] = document.getElementById('drop-container')
  pages['settings'] = document.getElementById('settings-container')
  pages['help'] = document.getElementById('help-container')

  pictureListContainerEl = document.getElementById('picture-list-container')

  icons['eye'].onclick = function() {
    ipcRenderer.send('request-incognito')
  }

  icons['close'].onclick = function() {
    ipcRenderer.send('request-quit')
  }

  icons['settings'].onclick = function() {
    showPage('settings')
  }

  icons['help'].onclick = function() {
    showPage('help')
  }

  if (process.platform === 'darwin') icons['close'].style.display = 'none'

  containerEl = document.getElementById('container')

  titleEl.innerHTML = remote.getCurrentWindow().getTitle()

  initEventListeners()
  showPage('drop')

  menu.show()
  // remote.getCurrentWebContents().openDevTools({ mode: 'undocked' })
}

window.onbeforeunload = () => {
  // menu.hide()
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
  pages['drop'].style.display = 'flex'
}

function showSettings() {
  pages['settings'].style.display = 'flex'

  pictureListContainerEl.innerHTML = ''

  for (var i = 0; i < pictures.length; i++) {
    let picture = pictures[i]
    let el = document.createElement('div')
    let titleEl = document.createElement('div')
    let closeEl = document.createElement('div')

    el.classList.add('picture-list-item')
    titleEl.classList.add('picture-list-item-title')
    closeEl.classList.add('picture-list-item-close')

    el.dataset.id = picture.id

    titleEl.innerHTML = picture.filename
    closeEl.innerHTML = '<svg class="icon"><use xlink:href="./images/icons.svg#close"></svg>'

    el.appendChild(titleEl)
    el.appendChild(closeEl)

    closeEl.onclick = () => {
      ipcRenderer.send('request-close', picture.id)
    }

    titleEl.onclick = () => {
      ipcRenderer.send('focus-window', picture.id)
    }

    pictureListContainerEl.appendChild(el)
  }

  pages['settings'].querySelector('#back-icon').onclick = () => {
    showPage('drop')
  }
}

function showHelp() {
  pages['help'].style.display = 'flex'
  pages['help'].querySelector('#back-icon').onclick = () => {
    showPage('drop')
  }
}

function showPage(name) {
  for (let name in pages) pages[name].style.display = 'none'
  if (name === 'drop') {
    showDrop()
  } else if (name === 'settings') {
    showSettings()
  } else if (name === 'help') {
    showHelp()
  }
}

function newPicture(id, filename) {
  pictures.push({ id: id, filename: filename })
}

function removePicture(id) {
  let index = pictures.findIndex((element) => { return element.id == id })
  if (index > -1) {
    pictures.splice(index, 1)
  }

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

  if (list.length) ipcRenderer.send('image-drop', list)
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
}

function onMouseMove(e) {
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

function onDragDefault(e) {
  event.dataTransfer.allowedEffect = 'none'
  event.preventDefault()
}

function initEventListeners() {
  document.addEventListener('dragover', onDragDefault)
  document.addEventListener('drop', onDragDefault)
  document.addEventListener('dragenter', onDragDefault)
  document.addEventListener('dragstart', onDragDefault)

  pages['drop'].addEventListener('drop', onDrop)
  pages['drop'].addEventListener('dragover', onDragOver)
  pages['drop'].addEventListener('dragenter', onDragEnter)

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

ipcRenderer.on('remove-picture', function(event, id) {
  removePicture(id)
})

ipcRenderer.on('new-picture', function(event, id, filename) {
  newPicture(id, filename)
})

ipcRenderer.on('incognito', function(event, value) {
  setIncognito(value)
})
