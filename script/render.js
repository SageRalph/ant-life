class Renderer {
  constructor(canvas, world, tileset) {
    this.canvas = canvas;
    this.world = world;
    this.tileset = tileset;
    this._ctx = canvas.getContext("2d", { alpha: false });
    this._cw = canvas.width / world.cols;
    this._ch = canvas.height / world.rows;
    this.fillStyle = "AIR";
  }

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
          x * this._cw,
          this.canvas.height - y * this._ch,
          this._cw,
          -this._ch,
        );
      }
    }

    this.oldTiles = JSON.parse(JSON.stringify(this.world.tiles));
  }

  mapCoordinates(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const cx = (x - rect.left) * scaleX;
    const cy = (y - rect.top) * scaleY;
    return {
      x: Math.floor(cx / this._cw),
      y: this.world.rows - Math.ceil(cy / this._ch),
    };
  }
}
