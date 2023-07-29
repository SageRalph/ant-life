
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
    this._updateChunks();

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

  checkChunks(x, y, mask, distance = 0, threshold = 1) {
    if (!this._legal(x, y)) return false;
    if (!mask) return true;
    if (!threshold) return true;
    const chunks = this._getChunks(x, y, distance);
    let total = 0;
    for (let chunk of chunks) {
      for (let tile of mask) {
        total += chunk[tile];
        if (total > threshold) return true;
      }
    }
    return false;
  }

  _getChunks(x, y, distance) {
    const cxMin = Math.max(0, Math.floor((x - distance) / CHUNK_SIZE));
    const cyMin = Math.max(0, Math.floor((y - distance) / CHUNK_SIZE));
    const cxMax = Math.min(
      this.chunks[0].length - 1,
      Math.floor((x + distance) / CHUNK_SIZE),
    );
    const cyMax = Math.min(
      this.chunks.length - 1,
      Math.floor((y + distance) / CHUNK_SIZE),
    );

    let matches = [];
    for (let cx = cxMin; cx <= cxMax; cx++) {
      for (let cy = cyMin; cy <= cyMax; cy++) {
        matches.push(this.chunks[cy][cx]);
      }
    }
    return matches;
  }

  _updateChunks() {
    const me = this;
    this.chunks = [];

    for (let b = 0; b < this.rows / CHUNK_SIZE; b++) {
      this.chunks.push([]);
      for (let a = 0; a < this.rows / CHUNK_SIZE; a++) {
        // Create chunk with zeroed counts for all tile types
        let blankChunk = {};
        for (let tile of Object.keys(TILESET)) {
          blankChunk[tile] = 0;
        }
        this.chunks[b].push(blankChunk);

        // Count tiles in chunk
        const b0 = b * CHUNK_SIZE;
        const a0 = a * CHUNK_SIZE;
        this.forEachTile(
          a0,
          b0,
          a0 + CHUNK_SIZE,
          b0 + CHUNK_SIZE,
          function (x, y) {
            me.chunks[b][a][me.getTile(x, y)]++;
          },
        );
      }
    }
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


  async _legal(x, y) {
    if (!this.legalFunction) {
      const { legal } = await import('../pkg/ant_life_optimised.js');
      this.legalFunction = legal;
    }

    return await this.legalFunction(this.rows, this.cols, x, y);
  }

  benchmark() {
    const durations = {};
    const allTiles = Object.keys(TILESET);

    // mixed tilesets
    durations["all"] = this._doBenchmark(allTiles, "all");
    durations["creatures"] = this._doBenchmark(
      ["PEST", "WORKER", "EGG", "QUEEN", "AIR"],
      "creatures",
    );

    // Each tile
    for (let tile of allTiles) {
      let mask = [tile];
      // Pad mask with AIR for more realistic behaviour and smoother performance
      for (let i = 0; i < 1 / BENCHMARK_DENSITY - 1; i++) {
        mask.push("AIR");
      }
      durations[tile] = this._doBenchmark(mask, tile);
    }

    const sorted = Object.fromEntries(
      Object.entries(durations).sort(([, a], [, b]) => a - b),
    );
    const result = JSON.stringify(sorted, null, 2);

    console.log(
      `Benchmarked TPS over ${BENCHMARK_BATCHES} runs of ${BENCHMARK_TICKS} ticks at density ${BENCHMARK_DENSITY}\n${result}`,
    );
    return sorted;
  }

  _doBenchmark(mask, name) {
    console.log("Benchmarking", name);
    const batches = [];
    for (let batch = 0; batch < BENCHMARK_BATCHES; batch++) {
      this.worldgen.generateBenchmarkWorld(mask);
      const start = performance.now();
      for (let i = 0; i < BENCHMARK_TICKS; i++) {
        this.worldlogic.tick();
      }
      batches.push((performance.now() - start) / BENCHMARK_TICKS);
    }
    return Math.round(1000 / average(batches));
  }
}

if (typeof module === 'object') {
  module.exports = { World };
}