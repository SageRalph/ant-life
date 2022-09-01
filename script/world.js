class World {
  constructor(rows = ROW_COUNT, cols = COL_COUNT, generatorSettings = {}) {
    this.rows = rows;
    this.cols = cols;
    this.age = 0;
    this.ants = 1;
    this.generatorSettings = generatorSettings;
    this.worldgen = new Worldgen(this);
    this.worldlogic = new Worldlogic(this);
    this.worldgen.generate(generatorSettings);
  }

  tick() {
    // Tile actions
    this.worldlogic.tick();

    // Rain
    if (this.age >= RAIN_FREQ && this.age % RAIN_FREQ <= RAIN_TIME) {
      const maxRain = randomIntInclusive(1, 5);
      const rainProgress = this.age % RAIN_FREQ;
      const rainCount =
        (Math.min(
          rainProgress ** 2 / 10000,
          maxRain,
          (RAIN_TIME - rainProgress) ** 2 / 10000,
        ) *
          this.cols) /
        100;
      this.doRain(rainCount);
    } // Pests (never at same time as rain)
    else if (this.age >= PEST_START && this.age % PEST_FREQ === 0) {
      this.doRain(Math.random(), "PEST");
    }
  }

  doRain(count, tile = "WATER") {
    // allow for non-int chance
    let realCount = Math.floor(count);
    if (Math.random() <= count % 1) {
      realCount++;
    }
    for (let i = 0; i < realCount; i++) {
      const x = randomIntInclusive(0, this.cols - 1);
      this.setTile(x, this.rows - 1, tile, ["AIR"]);
    }
  }

  getTile(x, y) {
    return this.tiles[y][x];
  }

  setTile(x, y, tile, mask = false) {
    if (!this.checkTile(x, y, mask)) {
      return false;
    } else {
      this.tiles[y][x] = tile;
      return true;
    }
  }

  checkTile(x, y, mask) {
    if (!this._legal(x, y)) return false;
    if (!mask) return true;
    return mask.includes(this.getTile(x, y));
  }

  swapTiles(x, y, a, b, mask = false) {
    if (!this.checkTile(a, b, mask)) {
      return false;
    } else {
      const t1 = this.getTile(x, y);
      const t2 = this.getTile(a, b);
      this.setTile(a, b, t1);
      this.setTile(x, y, t2);
      return true;
    }
  }

  forEachTile(minX, minY, maxX, maxY, func) {
    for (let y = Math.max(minY, 0); y <= Math.min(maxY, this.rows - 1); y++) {
      for (let x = Math.max(minX, 0); x <= Math.min(maxX, this.rows - 1); x++) {
        func(x, y);
      }
    }
  }

  fillCircle(centerX, centerY, radius, tile, mask = []) {
    const me = this;
    this.forEachTile(
      centerX - radius,
      centerY - radius,
      centerX + radius,
      centerY + radius,
      function (x, y) {
        if (mask.length && !me.checkTile(x, y, mask)) return;
        if (!pointWithinRadius(centerX, centerY, x, y, radius)) return;
        me.setTile(x, y, tile);
      },
    );
  }

  fillRectangle(minX, minY, maxX, maxY, tile, mask = []) {
    const me = this;
    this.forEachTile(minX, minY, maxX, maxY, function (x, y) {
      if (mask.length && !me.checkTile(x, y, mask)) return;
      me.setTile(x, y, tile);
    });
  }

  _legal(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }
}
