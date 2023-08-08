/**
 * Returns whether a point is within a given radius of another point
 * @param {number} a - X coordinate of the first point
 * @param {number} b - Y coordinate of the first point
 * @param {number} x - X coordinate of the second point
 * @param {number} y - Y coordinate of the second point
 * @param {number} r - Radius
 * @returns {boolean} - Whether the first point is within the given radius of the second point
 */
function pointWithinRadius(a, b, x, y, r) {
  var dist = (a - x) * (a - x) + (b - y) * (b - y);
  return dist < r * r;
}

/**
 * Return a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer between min and max (inclusive)
 */
function randomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Return a random sign (1 or -1)
 * @returns {number} - 1 or -1
 */
function randomSign() {
  return Math.random() < 0.5 ? 1 : -1;
}

/**
 * Calculate the average of an array of numbers
 * @param {number[]} arr - Array of numbers
 * @returns {number} - Average of the array
 */
function average(arr) {
  return arr.reduce((p, c) => p + c, 0) / arr.length;
}
