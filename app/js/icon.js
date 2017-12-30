
class Icon {
  constructor(name, width, height, dark) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')

    if (dark)
      svg.setAttribute('fill', 'black')
    else
      svg.setAttribute('fill', 'white')

    // console.log('Icon', name);

    var svguse = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    svguse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', './images/icons.svg#' + name)

    svg.appendChild(svguse)

    var svgcontainer = document.createElement('div')
    svgcontainer.style.display = 'flex'
    // svgcontainer.style.background = 'gray'
    svgcontainer.style.alignItems = 'center'
    svgcontainer.style.justifyContent = 'center'
    svgcontainer.style.width = width + 'px'
    svgcontainer.style.minWidth = height + 'px'
    svgcontainer.style.height = height + 'px'
    svgcontainer.style.minHeight = height + 'px'
    svgcontainer.style['-webkit-app-region'] = 'no-drag'

    svgcontainer.appendChild(svg)

    this.svg = svgcontainer
  }

  element() {
    return this.svg
  }
}

module.exports = Icon
