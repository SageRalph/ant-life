function pointWithinRadius(a, b, x, y, r) {
  var dist = (a - x) * (a - x) + (b - y) * (b - y);
  return dist < r * r;
}

function randomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomSign() {
  return Math.random() < 0.5 ? 1 : -1;
}

function average(arr) {
  return arr.reduce((p, c) => p + c, 0) / arr.length;
}

module.exports = {
  pointWithinRadius,
  randomIntInclusive,
  randomSign,
  average,
};