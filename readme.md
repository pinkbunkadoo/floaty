Floaty is an app for displaying images, transparently, above other desktop windows. Each image can be resized and moved as you would a regular window.

Supported image formats include PNG, JPEG and other web browser compatible types.

## Installation

Floaty requires Node.js and Electron.

```sh
npm install
```

## Running

```sh
electron .
```

## Usage Instructions

- Drag one or more images onto the drop window
- Make the desired adjustments to any images
- Tap the eye icon or press slash (/) on the keyboard to enter covert mode<sup>1</sup>
- Tap the tray icon to leave covert mode</li>

<sup>1</sup> In covert mode, images are non-interactive and will appear above all other desktop windows

### Global shortcuts

| shortcut | description |
| ------------- |:-------------:|
| / | Covert mode |
| Ctrl + Q | Quit |

### Image Shortcuts

| shortcut | description |
| ------------- |:-------------:|
| - | Decrease image opacity |
| + | Increase image opacity |
| Shift + Drag | Pan image |
| Ctrl + Drag | Scale image |
