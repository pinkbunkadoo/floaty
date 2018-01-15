const { app, Menu } = require('electron').remote
const { ipcRenderer } = require('electron')

menuTemplate = [
  {
    label: 'View',
    submenu: [
      {
        label: 'Covert Mode',
        accelerator: '/',
        click: function(item, focusedWindow) {
          ipcRenderer.send('request-incognito')
        }
      },
      { type: 'separator' },
      {
        label: 'Reload',
        role: 'reload',
        accelerator: 'CommandOrControl+R',
        click: (item, focusedWindow) => {
          focusedWindow.reload()
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Option+Command+I'
          } else {
            return 'Ctrl+Shift+I'
          }
        })(),
        click: (item, focusedWindow) => {
          focusedWindow.toggleDevTools({ mode: 'undocked' })
        }
      }
    ]
  }
]

let fileMenu = [
  {
    label: 'Open Layout...',
    accelerator: 'Ctrl+O',
    click: () => {
      ipcRenderer.send('open-layout')
    }
  }
]

if (process.platform !== 'darwin') {
  fileMenu.unshift({ type: 'separator' })
  fileMenu.unshift({
    label: 'Quit',
    accelerator: 'Ctrl+Q',
    click: () => {
      app.quit()
    }
  })
}

menuTemplate.unshift({
  label: 'File',
  submenu: fileMenu
})

if (process.platform === 'darwin') {
  menuTemplate.unshift({
    label: app.getName(),
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
}

const mainMenu = Menu.buildFromTemplate(menuTemplate)


module.exports = {
  hide: function() {
    Menu.setApplicationMenu(null)
  },
  show: function() {
    Menu.setApplicationMenu(mainMenu)
  }
}
