
class Picture {
  constructor(params) {
    this.id = params.id
    this.file = params.file !== undefined ? Object.assign({}, params.file) : null
    this.opacity = params.opacity !== undefined ? params.opacity : 0.75
    this.offset = params.offset !== undefined ? Object.assign({}, params.offset) : { x: 0, y: 0 }
    this.scale = params.scale !== undefined ? params.scale : 1
    this.bounds = params.bounds !== undefined ? Object.assign({}, params.bounds) : null
  }
}

module.exports = Picture
