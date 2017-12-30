
function Point(x, y) {
  this.x = (x == undefined ? 0 : x)
  this.y = (y == undefined ? 0 : y)
}


Point.prototype.copy = function() {
  return new Point(this.x, this.y)
}

module.exports = Point
