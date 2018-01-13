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

let containerEl, perimeterEl, dropContainerEl, settingsContainerEl, pictureListContainerEl
let titleEl, eyeIconEl, settingsIconEl, closeIconEl, backIconEl, helpIconEl

const load = async(event, args) => {
  // remote.getCurrentWebContents().openDevTools({ mode: 'undocked' })
}

window.onload = () => {
  eyeIconEl = document.getElementById('eye-icon')
  closeIconEl = document.getElementById('close-icon')
  settingsIconEl = document.getElementById('settings-icon')
  // backIconEl = document.getElementById('back-icon')
  helpIconEl = document.getElementById('help-icon')

  titleEl = document.getElementById('title')
  dropContainerEl = document.getElementById('drop-container')
  settingsContainerEl = document.getElementById('settings-container')
  helpContainerEl = document.getElementById('help-container')

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

  // backIconEl.onclick = function() {
  //   showPage('drop')
  // }

  helpIconEl.onclick = function() {
    showPage('help')
  }

  if (process.platform === 'darwin') closeIconEl.style.display = 'none'

  // thumbnailContainerEl = document.getElementById('thumbnail-container')
  containerEl = document.getElementById('container')
  perimeterEl = document.getElementById('perimeter')

  titleEl.innerHTML = remote.getCurrentWindow().getTitle()

  initEventListeners()

  // for (var i = 0; i < 50; i++) {
  //   newPicture(i + 100, 'bungalo-magic-' + i + '.png')
  // }

  menu.show()
}

window.onbeforeunload = () => {
  menu.hide()
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
  settingsContainerEl.style.display = 'none'
  helpContainerEl.style.display = 'none'
  dropContainerEl.style.display = 'flex'
}

function showSettings() {
  console.log('showSettings')

  dropContainerEl.style.display = 'none'

  settingsContainerEl.style.display = 'flex'

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
      ipcRenderer.send('requestCloseImage', picture.id)
    }

    titleEl.onclick = () => {
      ipcRenderer.send('focusWindow', picture.id)
    }

    pictureListContainerEl.appendChild(el)


  }

  settingsContainerEl.querySelector('#back-icon').onclick = () => {
    showPage('drop')
  }


}

function showHelp() {
  dropContainerEl.style.display = 'none'
  helpContainerEl.style.display = 'flex'

  helpContainerEl.querySelector('#back-icon').onclick = () => {
    showPage('drop')
  }

}

function showPage(name) {
  if (name === 'drop') {
    showDrop()
  } else if (name === 'settings') {
    showSettings()
  } else if (name === 'help') {
    showHelp()
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
