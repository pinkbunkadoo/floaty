
function Picture(image, x, y) {
  this.x = (x == undefined ? 0 : x)
  this.y = (y == undefined ? 0 : y)
  this.image = image
}


// Picture.prototype.copy = function() {
//   return new Picture(this.x, this.y);
// }
//
module.exports = Picture
