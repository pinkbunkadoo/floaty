const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer

const Point = require('./point')
const Picture = require('./picture')

const fs = require('fs')

let image, container, holder, outline, info
let canvas, ctx, overlayCanvas
let overlayContainer
let settings = { scale: 1.0, opacity: 1.0, left: 0, top: 0 }
let isInitialised = false
let mode = null
let frameNo = 0
let incognito = false
let pictures = []
let hasFocus = true
let active = true


function update() {
}


function worldToCanvas(x, y) {
  var tx = x - settings.left
  var ty = y - settings.top

  var sx = (tx * settings.scale)
  var sy = (ty * settings.scale)

  var widthHalf = (canvas.width * 0.5) >> 0
  var heightHalf = (canvas.height * 0.5) >> 0

  return new Point(sx + widthHalf, sy + heightHalf)
}


function canvasToWorld(x, y) {
  var widthHalf = (canvas.width / 2) >> 0
  var heightHalf = (canvas.height / 2) >> 0

  var px = x - widthHalf
  var py = y - heightHalf

  var sx = px / settings.scale
  var sy = py / settings.scale

  var tx = sx + settings.left
  var ty = sy + settings.top

  return new Point(tx, ty)
}


function draw() {
  width = canvas.width
  height = canvas.height

  ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)

  if (!incognito) {
    // ctx.fillStyle = 'rgb(64, 64, 64)'
    // ctx.fillRect(0, 0, width, height)
  }

  for (var i = 0; i < pictures.length; i++) {
    picture = pictures[i]

    p = worldToCanvas(picture.x, picture.y)

    w = picture.image.width * settings.scale
    h = picture.image.height * settings.scale

    ctx.drawImage(picture.image, p.x - w * 0.5, p.y - h * 0.5, w >> 0, h >> 0)
    // ctx.drawImage(picture.image, p.x, p.y, w >> 0, h >> 0)
  }

  ctx = overlayCanvas.getContext('2d')

  ctx.clearRect(0, 0, width, height)

  if (!hasFocus) {
    ctx.globalAlpha = 0.5
  }
  // ctx.strokeStyle = 'rgba(64, 255, 255, 0.5)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.rect(0, 0, width, height)
  ctx.stroke()

  ctx.globalAlpha = 1

  // s = (settings.left >> 0) + ',' + (settings.top>>0)
  s = hasFocus.toString()
  ctx.font = '12px sans-serif'
  tm = ctx.measureText(s)

  ctx.fillStyle = 'rgba(0, 0, 0, 1)'
  ctx.fillRect(width * 0.5 - (tm.width + 8) * 0.5, 8, tm.width + 8, 24)

  ctx.fillStyle = 'rgba(255, 255, 255, 1)'
  ctx.fillText(s, (width * 0.5 - tm.width * 0.5) >> 0, 24)

}


function frame() {
  if (active) {
    requestAnimationFrame(frame)
    update()
    draw()
    frameNo++
  }
}


function start() {
  active = true
  requestAnimationFrame(frame)
}


function stop() {
  active = false
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

  document.body.appendChild(container)

  canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  ctx = canvas.getContext('2d')

  container.appendChild(canvas)

  overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = window.innerWidth
  overlayCanvas.height = window.innerHeight

  overlayContainer = document.createElement('div');
  overlayContainer.style['-webkit-user-select'] = 'none';
  overlayContainer.style.position = 'absolute';
  overlayContainer.style.width = '100%';
  overlayContainer.style.height = '100%';
  overlayContainer.style.overflow = 'hidden'
  overlayContainer.style.margin = '0px';
  overlayContainer.style.padding = '0px';

  overlayContainer.appendChild(overlayCanvas)

  document.body.appendChild(overlayContainer)

  start()
  initEventListeners()

  ipc.send('request-image')
  // console.log(window.imagePath);
  // requestSettings()
}


function updateOpacity() {
  container.style.opacity = settings.opacity;
}


function onWheel(e) {
  e.preventDefault();
}


function onKeyDown(event) {
  if (event.key == '=' && !event.repeat) {
    opacity = settings.opacity
    opacity = opacity + 0.1
    opacity = (opacity <= 1.0 ? opacity : 1.0)
    container.style.opacity = opacity
    settings.opacity = opacity
    updateOpacity()
    // saveSettings();

  } else if (event.key == '-' && !event.repeat) {
    opacity = settings.opacity
    opacity = opacity - 0.1
    opacity = (opacity >= 0.1 ? opacity : 0.1)
    container.style.opacity = opacity
    settings.opacity = opacity
    updateOpacity()
    // saveSettings()

  } else if (event.key == ',' && !event.repeat) {
    scale = settings.scale
    scale = scale - 0.5
    scale = (scale < 0.5 ? 0.5 : scale)
    settings.scale = scale
    // saveSettings()

  } else if (event.key == '.' && !event.repeat) {
    scale = settings.scale
    scale = scale + 0.5
    scale = (scale > 8.0 ? 8.0 : scale)
    settings.scale = scale
    // saveSettings()

  // } else if (event.key == 'b' && !event.repeat) {
    // console.log(process.getBounds());

  // } else if (event.key == 'ArrowRight') {
  //   event.preventDefault();
  //   ipc.send('size-window-by', 20, 0)
  //
  // } else if (event.key == 'ArrowUp') {
  //   event.preventDefault();
  //   ipc.send('size-window-by', 0, -20)
  //
  // } else if (event.key == 'ArrowLeft') {
  //   event.preventDefault();
  //   ipc.send('size-window-by', -20, 0)
  //
  // } else if (event.key == 'ArrowDown') {
  //   event.preventDefault();
  //   ipc.send('size-window-by', 0, 20)
  }
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
    if (e.shiftKey) {
      if (mode !== 'drag') {
        mode = 'drag'
      }
    } else if (e.ctrlKey) {
      if (mode !== 'zoom') {
        mode = 'zoom'
      }
    } else {
      if (!mode) {
        // console.log('move', e.movementX)
        ipc.send('move-window-by', e.movementX, e.movementY)
      }
    }

    if (mode === 'drag') {
      settings.left = settings.left - e.movementX / settings.scale
      settings.top = settings.top - e.movementY / settings.scale
      // saveSettings()

    } else if (mode === 'zoom') {
      if (image) {
        // x = settings.left + canvas.width * 0.5
        // y = settings.top + canvas.height * 0.5

        settings.scale = (settings.scale + (e.movementX * (settings.scale * 0.002)))
        if (settings.scale < 0.5) settings.scale = 0.5
        if (settings.scale > 4) settings.scale = 4

        // settings.left = x - canvas.width * 0.5
        // settings.top = y - canvas.height * 0.5
      }

      // updateCanvas()
      // saveSettings()
    }

  } else if (e.buttons & 4) {

    // holder.style.marginLeft = (holder.style.marginLeft + e.movementX) + 'px';
    // holder.style.marginTop = (holder.style.marginTop + e.movementY) + 'px';
    // holder.style.transform = 'translateX(' + e.movementX + 'px)';
    // holder.style.transform = 'translateY(' + e.movementY + 'px)';

    // holder.style.transform = 'translate(' + e.movementX + 'px, ' + e.movementY + 'px)';
  }

}


function onMouseUp(e) {
  mode = null
}


function onBlur(e) {
  mode = null
  hasFocus = false
  // console.log('blur');
}


function onFocus(e) {
  mode = null
  hasFocus = true
  // console.log('focus');
}

let resizeTimeout

function onResize(e) {
  if (!resizeTimeout) {
    resizeTimeout = setTimeout(function() {
      resizeTimeout = null

      // app.adjustLayout();

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      overlayCanvas.width = window.innerWidth
      overlayCanvas.height = window.innerHeight
      // ctx = canvas.getContext('2d')

     // The actualResizeHandler will execute at a rate of 15fps
    }, 66);
  }
}


function onScroll(e) {
  console.log('scroll');
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
  else if (e.type == 'resize') onResize(e);
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

  // window.addEventListener('reload', () => {
  //   settings.left = 0
  //   settings.top = 0
  //   console.log('reload');
  // })
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
  // holder.style.left = settings.left + 'px';
  // holder.style.top = settings.top + 'px';
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
    // initEventListeners()
  }

  // if (settings.src) {
  //   image = new Image()
  //   image.src = settings.src
  //   holder.appendChild(image)
  // }

  isInitialised = true

  // updateInfo()
})


ipc.on('initialise', function(event, imagePath) {
  // if (isInitialised === false) {
  //   initEventListeners()
  // }
  isInitialised = true
  console.log('initialise')
})


ipc.on('image', function(event, imagePath) {
  console.log('image', imagePath);

  fs.readFile(imagePath, null, function(err, data) {
      // console.log(contents.length)

      // blob = new Blob(contents, { type: 'application/octet-binary' })
      // blob = new Blob(data, { type: 'image/jpeg' })
      image = new Image()
      image.src = 'data:image/jpeg;base64,' + (new Buffer(data).toString('base64'))
      // document.body.appendChild(image)
      // container.appendChild(image)
      pictures[0] = new Picture(image, 0, 0)

      draw()

      // blob = new Blob([contents], { type: 'text' })

      // var reader = new FileReader()
      //
      // reader.addEventListener("load", function (event) {
      //   console.log('read image');
      //   image = new Image()
      //   image.src = this.result
      //
      //   console.log(this.result);

        // document.body.appendChild(image)

        // image.title = file.name
        //
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
      // }, false)
      //
      // reader.readAsDataURL(blob)

  });

})


ipc.on('incognito', function(event, arg1) {
  settings.incognito = arg1
  incognito = arg1

  if (incognito) {
    overlayContainer.style.display = 'none'
    stop()
    // container.style.backgroundColor = null;
    // info.style.opacity = 0.0;
  } else {
    overlayContainer.style.display = 'block'
    start()
    // container.style.backgroundColor = 'black';
    // info.style.opacity = 1.0;
  }
  // console.log(settings.incognito);
})
