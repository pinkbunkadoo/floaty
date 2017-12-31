const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer
const fs = require('fs')

const Icon = require('../icon')

let icons = {}

window.onload = function() {

  svg = document.getElementById('icons')
  for (var i = 0; i < svg.children.length; i++) {
    icon = svg.children[i]
    icons[icon.id] = { id: icon.id, width: icon.viewBox.baseVal.width, height: icon.viewBox.baseVal.height}
  }

  close = (new Icon('close', icons['close'].width, icons['close'].height, true)).element()

  close.onclick = function() {
    // ipc.send('request-incognito')
    ipc.send('close-about')
  }

  container = document.getElementById('container')

  svgcontainer = document.createElement('div')
  svgcontainer.style.display = 'flex'
  svgcontainer.style.alignItems = 'center'
  svgcontainer.style.justifyContent = 'flex-end'
  svgcontainer.style.width = '100%'
  svgcontainer.style.padding = '8px'
  svgcontainer.style.left = '0px'
  svgcontainer.style.top = '0px'
  svgcontainer.style.position = 'absolute'
  svgcontainer.style.boxSizing = 'border-box'
  // svgcontainer.style.border = '1px solid black'

  svgcontainer.appendChild(close)

  document.body.appendChild(svgcontainer)

  initEventListeners()
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    ipc.send('close-about')
  }
}

function handleEvent(e) {
  if (e.type == 'keydown') onKeyDown(e)
}

function initEventListeners() {
  window.addEventListener('keydown', handleEvent)
}
