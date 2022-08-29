class Renderer {
  constructor(canvas, world, tileset) {
    this.canvas = canvas;
    this.world = world;
    this.tileset = tileset;
    this._ctx = canvas.getContext("2d");
    this._cw = canvas.width / world.cols;
    this._ch = canvas.height / world.rows;
  }

  draw() {
    /// loop through rows and columns
    for (let y = 0; y < this.world.rows; y++) {
      for (let x = 0; x < this.world.cols; x++) {
        // Draw tile
        const tile = this.world.getTile(x, y);
        this._ctx.fillStyle = this.tileset[tile];
        this._ctx.fillRect(
          x * this._cw,
          this.canvas.height - y * this._ch,
          this._cw,
          -this._ch,
        );
      }
    }
  }
}
