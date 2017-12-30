
class Picture {
  constructor(image, x, y) {
    this.x = (x == undefined ? 0 : x)
    this.y = (y == undefined ? 0 : y)
    this.image = image
  }
}

module.exports = Picture
