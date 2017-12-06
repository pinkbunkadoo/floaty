
class Icon {
  constructor(name, width, height, dark) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink')
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)

    if (dark)
      svg.setAttribute('fill', 'rgba(0, 0, 0, 0.75)')
    else
      svg.setAttribute('fill', 'white')

    var svguse = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    svguse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + name)

    svg.appendChild(svguse)

    var svgcontainer = document.createElement('div')
    svgcontainer.style.display = 'flex'
    svgcontainer.style.alignItems = 'center'
    svgcontainer.style.justifyContent = 'center'
    svgcontainer.style.width = '24px'
    svgcontainer.style.minWidth = '24px'
    svgcontainer.style.height = '24px'
    svgcontainer.style.minHeight = '24px'
    // svgcontainer.style.marginLeft = '8px'
    svgcontainer.style['-webkit-app-region'] = 'no-drag'
    // svgcontainer.style.background = 'red'

    // svgcontainer.style.marginRight = '8px'
    // svgcontainer.style.border = '1px solid black'

    svgcontainer.appendChild(svg)

    this.svg = svgcontainer
  }

  element() {
    return this.svg
  }
}

module.exports = Icon
