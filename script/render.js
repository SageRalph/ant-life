class Renderer {
  constructor(canvas, world, tileset) {
    this.canvas = canvas;
    this.world = world;
    this.tileset = tileset;
    this._ctx = canvas.getContext("2d", { alpha: false });
    // Ensure tiles are square
    this._tileSize = Math.min(
      canvas.width / world.cols,
      canvas.height / world.rows,
    );
    // Center the world (letterbox if not square)
    this._xOffset = (canvas.width - this._tileSize * world.cols) / 2;
    this._yOffset = (canvas.height - this._tileSize * world.rows) / 2;
    this.fillStyle = "AIR";
    // Clear canvas
    this._ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Draw the current world state. Optimised to only draw changed tiles.
   */
  draw() {
    /// loop through rows and columns
    for (let y = 0; y < this.world.rows; y++) {
      for (let x = 0; x < this.world.cols; x++) {
        // Optimisation: only draw tile if changed
        const tile = this.world.tiles[y][x];
        if (this.oldTiles && this.oldTiles[y][x] === tile) {
          continue;
        }

        // Optimisation: only change brush if needed
        if (this.fillStyle !== tile) {
          this.fillStyle = tile;
          this._ctx.fillStyle = this.tileset[this.fillStyle];
        }

        // Draw tile
        this._ctx.fillRect(
          this._xOffset + x * this._tileSize,
          this._yOffset + (this.world.rows - y - 1) * this._tileSize,
          this._tileSize,
          this._tileSize,
        );
      }
    }

    this.oldTiles = JSON.parse(JSON.stringify(this.world.tiles));
  }

  /**
   * Convert canvas coordinates to world coordinates
   * @param {number} x - Canvas x coordinate
   * @param {number} y - Canvas y coordinate
   * @returns {object} - World coordinates {x, y}
   */
  mapCoordinates(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const cx = (x - rect.left) * scaleX - this._xOffset;
    const cy = (y - rect.top) * scaleY - this._yOffset;
    return {
      x: Math.floor(cx / this._tileSize),
      y: this.world.rows - Math.ceil(cy / this._tileSize),
    };
  }
}
