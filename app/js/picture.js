
class Picture {
  constructor(params) {
    this.id = params.id
    this.x = params.x
    this.y = params.y
    this.dataURL = params.dataURL
    this.imageFilename = params.imageFilename
    this.imagePath = params.imagePath
  }
}

module.exports = Picture
