const BrowserWindow = require('electron').remote.BrowserWindow
const ipc = require('electron').ipcRenderer

let image, container, holder, outline, info
let canvas, ctx, overlayCanvas
let overlayContainer
let settings = { scale: 1.0, opacity: 1.0, left: 0, top: 0 }
let isInitialised = false
let mode = null
let frameNo = 0
let incognito = false

function update() {
}


function draw() {
  width = canvas.width
  height = canvas.height

  ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)

  if (!incognito) {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
  }

  if (image) {
    scale = settings.scale
    ctx.drawImage(image, settings.left, settings.top, (image.width*scale)>>0, (image.height*scale)>>0)
  }

  ctx = overlayCanvas.getContext('2d')

  ctx.clearRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(255, 64, 192, 0.5)'
  ctx.lineWidth = 16
  ctx.beginPath()
  ctx.rect(0, 0, width, height)
  ctx.stroke()

  ctx.font = '12px sans-serif'
  tm = ctx.measureText('Hello world')

  ctx.fillStyle = 'rgba(0, 0, 0, 1)'
  ctx.fillRect(width * 0.5 - (tm.width + 8) * 0.5, 8, tm.width + 8, 24)

  ctx.fillStyle = 'rgba(255, 255, 255, 1)'
  ctx.fillText('Hello world', (width * 0.5 - tm.width * 0.5) >> 0, 24)

  // size = 40
  // thickness = 2
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  // ctx.fillRect(size, thickness, width - size * 2, thickness)
  // ctx.fillRect(thickness, size, thickness, height - size * 2)
  // ctx.fillRect(size, height - thickness * 2, width - size * 2, thickness)
  // ctx.fillRect(width - thickness * 2, size, thickness, height - size * 2)
}


function frame() {
  requestAnimationFrame(frame)

  update()
  draw()
  frameNo++
}


window.onload = function (event) {

  container = document.createElement('div');
  container.style['-webkit-user-select'] = 'none';
  container.style.position = 'absolute';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.overflow = 'hidden'
  container.style.margin = '0px';
  container.style.padding = '0px';
  // container.style.backgroundColor = 'blue';

  // holder = document.createElement('div');
  // holder.style.margin = '0px';
  // holder.style.padding = '0px';
  // holder.style.position = 'fixed';
  //
  // container.appendChild(holder);
  document.body.appendChild(container);

  // outline = document.createElement('div')
  // outline.style.border = '1px solid cyan'
  // outline.style.boxSizing = 'border-box'
  // outline.style.position = 'absolute';
  // outline.style.width = '100%';
  // outline.style.height = '100%';
  // outline.style.opacity = 0;
  // outline.style.overflow = 'hidden';
  // outline.style.margin = '12px';

  // info = document.createElement('div')
  // info.style.position = 'fixed';
  // info.style.opacity = 0;
  // info.style.font = '12px sans-serif'
  // info.style.color = 'white'
  // info.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'

  canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  ctx = canvas.getContext('2d')
  // ctx.fillStyle = 'white'
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  // ctx.drawImage(image, 0, 0)

  container.appendChild(canvas)

  overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = window.innerWidth
  overlayCanvas.height = window.innerHeight

  // document.body.appendChild(outline);
  // document.body.appendChild(info);

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

  requestAnimationFrame(frame)
  requestSettings()
}


function onWheel(e) {
  e.preventDefault();
  // settings.left = settings.left - e.deltaX
  // settings.top = settings.top - e.deltaY
  // console.log(e.deltaZ)
}


function onKeyDown(event) {
  if (event.key == '=' && !event.repeat) {
    // opacity = parseFloat(container.style.opacity);
    opacity = settings['opacity'];
    opacity = opacity + 0.1;
    opacity = (opacity <= 1.0 ? opacity : 1.0);
    container.style.opacity = opacity;
    settings['opacity'] = opacity;
    saveSettings();

  } else if (event.key == '-' && !event.repeat) {
    // opacity = parseFloat(container.style.opacity);
    opacity = settings['opacity'];
    opacity = opacity - 0.1;
    opacity = (opacity >= 0.1 ? opacity : 0.1);
    container.style.opacity = opacity;
    settings.opacity = opacity;
    saveSettings()

  } else if (event.key == ',' && !event.repeat) {
    scale = settings.scale;
    scale = scale - 0.5;
    scale = (scale < 0.5 ? 0.5 : scale);
    // holder.style.transform = 'scale(' + scale + ')';
    settings.scale = scale;
    saveSettings()
    // updateCanvas()

  } else if (event.key == '.' && !event.repeat) {
    scale = settings.scale;
    scale = scale + 0.5;
    scale = (scale > 8.0 ? 8.0 : scale);
    // holder.style.transform = 'scale(' + scale + ')';
    settings.scale = scale;
    saveSettings()
    // updateCanvas()

  } else if (event.key == 'b' && !event.repeat) {
    // console.log(process.getBounds());

  } else if (event.key == 'ArrowRight') {
    event.preventDefault();
    ipc.send('size-window-by', 20, 0)

  } else if (event.key == 'ArrowUp') {
    event.preventDefault();
    ipc.send('size-window-by', 0, -20)

  } else if (event.key == 'ArrowLeft') {
    event.preventDefault();
    ipc.send('size-window-by', -20, 0)

  } else if (event.key == 'ArrowDown') {
    event.preventDefault();
    ipc.send('size-window-by', 0, 20)
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
  console.log('drop');
  e.preventDefault();
  e.stopPropagation();

  file = e.dataTransfer.files[0];

  var reader = new FileReader();

  reader.addEventListener("load", function (event) {
      image = new Image();
      image.src = this.result;
      image.title = file.name;

      settings.path = file.path;
      settings.name = file.name;
      settings.left = 0
      settings.top = 0

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      overlayCanvas.width = window.innerWidth
      overlayCanvas.height = window.innerHeight

      // ipc.send('image-update', this.result);

      saveSettings()

      // holder.appendChild(image);
      // holder.style.width = image.width + 'px';
      // holder.style.height = image.height + 'px';
    }, false);

  reader.readAsDataURL(file);
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
        ipc.send('move-window-by', e.movementX, e.movementY)
      }
    }

    if (mode === 'drag') {
      // holder.style.left = (holder.offsetLeft + e.movementX) + 'px';
      // holder.style.top = (holder.offsetTop + e.movementY) + 'px';
      // settings.left = holder.offsetLeft;
      // settings.top = holder.offsetTop;

      settings.left = settings.left + e.movementX;
      settings.top = settings.top + e.movementY;
      // updateCanvas()
      saveSettings()

    } else if (mode === 'zoom') {
      settings.scale = (settings.scale + (e.movementX * 0.002));
      if (settings.scale < 0.5) settings.scale = 0.5;
      if (settings.scale > 4) settings.scale = 4;

      // updateCanvas()
      saveSettings()
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
  // console.log('blur');
}


function onFocus(e) {
  mode = null
  // console.log('focus');
}

let resizeTimeout

function onResize(e) {
  if (!resizeTimeout) {
    resizeTimeout = setTimeout(function() {
      resizeTimeout = null;

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
  settings.left++
  console.log('scroll');
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
    initEventListeners()
  }

  // if (settings.src) {
  //   image = new Image()
  //   image.src = settings.src
  //   holder.appendChild(image)
  // }

  isInitialised = true

  // updateInfo()
})


ipc.on('incognito', function(event, arg1) {
  if (arg1) {
    overlayContainer.style.display = 'none'
    // container.style.backgroundColor = null;
    // info.style.opacity = 0.0;
  } else {
    overlayContainer.style.display = 'block'
    // container.style.backgroundColor = 'black';
    // info.style.opacity = 1.0;
  }
  settings.incognito = arg1
  incognito = arg1
  console.log(settings.incognito);
})
