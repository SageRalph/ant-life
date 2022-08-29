const QUEEN_SPEED = 0.1; // The queen will only act this proportion of ticks
const KILL_CHANCE = 0.01; // Chance per tick for each neighbouring hazard to kill

class World {
  constructor(rows, cols, generatorSettings = {}) {
    this.rows = rows;
    this.cols = cols;
    this.age = 0;
    this.generatorSettings = generatorSettings;
    this._generate(generatorSettings);
  }

  tick() {
    this.age += 1;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this._doTileAction(x, y);
      }
    }
  }

  getTile(x, y) {
    return this.tiles[y][x];
  }

  setTile(x, y, tile) {
    this.tiles[y][x] = tile;
  }

  fillCircle(centerX, centerY, radius, tile, mask = []) {
    const me = this;
    this._doWithinBounds(
      centerX - radius,
      centerY - radius,
      centerX + radius,
      centerY + radius,
      function (x, y) {
        if (mask.length && !me._is(x, y, mask)) return;
        if (!pointWithinRadius(centerX, centerY, x, y, radius)) return;
        me.setTile(x, y, tile);
      },
    );
  }

  fillRectangle(minX, minY, maxX, maxY, tile, mask = []) {
    const me = this;
    this._doWithinBounds(minX, minY, maxX, maxY, function (x, y) {
      if (mask.length && !me._is(x, y, mask)) return;
      me.setTile(x, y, tile);
    });
  }

  _generate({
    skyProp = 0.2,
    startAreaSize = 15,
    sandMin = 30,
    sandMax = 60,
    sandMinSize = 4,
    sandMaxSize = 10,
    stoneMin = 10,
    stoneMax = 20,
    stoneMinSize = 4,
    stoneMaxSize = 8,
    waterMin = 5,
    waterMax = 10,
    waterMinSize = 5,
    waterMaxSize = 15,
    hollowMin = 5,
    hollowMax = 10,
    hollowMinSize = 4,
    hollowMaxSize = 10,
    plantMin = 10,
    plantMax = 20,
    plantMinSize = 4,
    plantMaxSize = 6,
    fungusMin = 20,
    fungusMax = 20,
    fungusMinSize = 1,
    fungusMaxSize = 4,
    noiseMin = 200,
    noiseMax = 200,
    noiseMinSize = 4,
    noiseMaxSize = 6,
    startingAge = 100,
  }) {
    const surfaceY = Math.round(this.rows * (1 - skyProp));
    const midX = Math.round(this.cols / 2);

    // Build 2d tile array
    this.tiles = [];
    for (let y = 0; y < this.rows; y++) {
      let row = [];
      for (let x = 0; x < this.cols; x++) {
        // Default to SOIL underground and AIR above
        let tile = y < surfaceY ? "SOIL" : "AIR";
        row.push(tile);
      }
      this.tiles.push(row);
    }

    // Sand
    this._generatePatches(
      randomIntInclusive(sandMin, sandMax),
      surfaceY,
      sandMinSize,
      sandMaxSize,
      "SAND",
    );

    // Stones
    this._generatePatches(
      randomIntInclusive(stoneMin, stoneMax),
      surfaceY,
      stoneMinSize,
      stoneMaxSize,
      "STONE",
    );

    // Water
    this._generatePatches(
      randomIntInclusive(waterMin, waterMax),
      surfaceY - waterMaxSize * 2,
      waterMinSize,
      waterMaxSize,
      "WATER",
      ["SOIL", "SAND", "STONE"],
    );

    // Air pockets
    this._generatePatches(
      randomIntInclusive(hollowMin, hollowMax),
      surfaceY,
      hollowMinSize,
      hollowMaxSize,
      "AIR",
      ["SOIL", "SAND", "STONE", "WATER"],
    );

    // Plant
    this._generatePatches(
      randomIntInclusive(plantMin, plantMax),
      surfaceY,
      plantMinSize,
      plantMaxSize,
      "PLANT",
      ["WATER", "AIR"],
    );

    // Fungus
    this._generatePatches(
      randomIntInclusive(fungusMin, fungusMax),
      surfaceY - fungusMaxSize * 2,
      fungusMinSize,
      fungusMaxSize,
      "FUNGUS",
      ["SOIL", "SAND"],
    );

    // Noise (to make shapes less obvious)
    this._generatePatches(
      randomIntInclusive(noiseMin, noiseMax),
      surfaceY,
      noiseMinSize,
      noiseMaxSize,
      "SOIL",
      ["SAND", "STONE", "WATER", "FUNGUS", "AIR", "PLANT"],
    );

    // Bedrock
    for (let x = 0; x < this.cols; x++) {
      this.fillCircle(x, 0, randomIntInclusive(1, 6), "STONE");
    }

    // Starting area
    // Clear a cone shape
    const queenToCeil = this.rows - surfaceY + 1;
    const halfStartArea = Math.round(startAreaSize / 2);
    for (let x = midX - halfStartArea; x < midX + halfStartArea; x++) {
      this.fillCircle(x, this.rows, queenToCeil, "AIR");
    }
    this.fillCircle(midX, surfaceY, startAreaSize, "SOIL", ["SAND", "STONE"]);
    // Guarantee an easy to reach max size fungus
    this.fillCircle(
      randomIntInclusive(midX - halfStartArea, midX + halfStartArea),
      surfaceY - halfStartArea,
      fungusMaxSize,
      "FUNGUS",
    );

    for (let i = 0; i < startingAge; i++) {
      this.tick();
    }

    // Starting units
    this.setTile(midX, surfaceY, "QUEEN");
  }

  _doTileAction(x, y) {
    const bias = Math.random > 0.5 ? 1 : -1;
    switch (this.getTile(x, y)) {
      case "SAND":
        // move down or diagonally down
        return (
          this._swapTilesIf(x, y, x, y - 1, ["AIR", "WATER"]) ||
          this._swapTilesIf(x, y, x - bias, y - 1, ["AIR", "WATER"]) ||
          this._swapTilesIf(x, y, x + bias, y - 1, ["AIR", "WATER"])
        );

      case "CORPSE":
        // move down or diagonally down
        return (
          this._swapTilesIf(x, y, x, y - 1, ["AIR"]) ||
          this._swapTilesIf(x, y, x - bias, y - 1, ["AIR"]) ||
          this._swapTilesIf(x, y, x + bias, y - 1, ["AIR"])
        );

      case "WATER":
        // move down or diagonally down or sideways
        return (
          this._swapTilesIf(x, y, x, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTilesIf(x, y, x - bias, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTilesIf(x, y, x + bias, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTilesIf(x, y, x - bias, y, ["AIR", "CORPSE"]) ||
          this._swapTilesIf(x, y, x + bias, y, ["AIR", "CORPSE"])
        );

      case "PLANT":
        // when touching fungus, convert to fungus
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["FUNGUS"])) {
          return this.setTile(x, y, "FUNGUS");
        }

        // when touching air and water, convert one to plant
        if (
          Math.random() <=
          KILL_CHANCE *
            this._touching(x, y, ["AIR"]) * // base chance from empty space
            (this._touching(x, y, ["WATER"]) + 0.1) * // penalty if no water
            (this._touching(x, y, ["CORPSE"]) + 1) // bonus if corpses
        ) {
          const growMask = ["AIR", "WATER", "CORPSE"];
          return (
            this._convertTileIf(x - 1, y - 1, "PLANT", growMask) ||
            this._convertTileIf(x + 1, y - 1, "PLANT", growMask) ||
            this._convertTileIf(x, y - 1, "PLANT", growMask) ||
            this._convertTileIf(x - 1, y, "PLANT", growMask) ||
            this._convertTileIf(x + 1, y, "PLANT", growMask) ||
            this._convertTileIf(x - 1, y + 1, "PLANT", growMask) ||
            this._convertTileIf(x + 1, y + 1, "PLANT", growMask) ||
            this._convertTileIf(x, y + 1, "PLANT", ["AIR", "WATER", "CORPSE"])
          );
        }
        return;

      case "FUNGUS":
        // Destroyed by air
        if (
          Math.random() <=
          KILL_CHANCE * (this._touching(x, y, ["AIR"]) - 2)
        ) {
          return this.setTile(x, y, "SAND");
        }
        return;

      case "QUEEN":
        // Destroyed by water
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["WATER"])) {
          return this.setTile(x, y, "CORPSE");
        }
        // when touching fungus, converts one to egg, else move any direction towards closest fungus
        return (
          Math.random() >= QUEEN_SPEED ||
          this._convertTileIf(x - 1, y - 1, "EGG", ["FUNGUS"]) ||
          this._convertTileIf(x + 1, y - 1, "EGG", ["FUNGUS"]) ||
          this._convertTileIf(x, y - 1, "EGG", ["FUNGUS"]) ||
          this._convertTileIf(x - 1, y, "EGG", ["FUNGUS"]) ||
          this._convertTileIf(x + 1, y, "EGG", ["FUNGUS"]) ||
          this._convertTileIf(x - 1, y + 1, "EGG", ["FUNGUS"]) ||
          this._convertTileIf(x + 1, y + 1, "EGG", ["FUNGUS"]) ||
          this._convertTileIf(x, y + 1, "EGG", ["FUNGUS"]) ||
          this._searchForTile(x, y, "FUNGUS", 10, ["AIR", "EGG", "ANT"])
        );

      case "ANT":
        // Destroyed by water
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["WATER"])) {
          return this.setTile(x, y, "CORPSE");
        }
        return;

      case "EGG":
        // Destroyed by water
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["WATER"])) {
          return this.setTile(x, y, "CORPSE");
        }

        // chance to convert to ant, else move down or diagonally down
        if (Math.random() <= 0.001) {
          // hatch into QUEEN or ANT
          this.setTile(x, y, Math.random() < 0.01 ? "QUEEN" : "ANT");
          return true;
        }
        return (
          this._swapTilesIf(x, y, x, y - 1, ["AIR", "WATER"]) ||
          this._swapTilesIf(x, y, x - bias, y - 1, ["AIR", "WATER"]) ||
          this._swapTilesIf(x, y, x + bias, y - 1, ["AIR", "WATER"])
        );
    }
  }

  _legal(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  _doWithinBounds(minX, minY, maxX, maxY, func) {
    for (let y = Math.max(minY, 0); y <= Math.min(maxY, this.rows - 1); y++) {
      for (let x = Math.max(minX, 0); x <= Math.min(maxX, this.rows - 1); x++) {
        func(x, y);
      }
    }
  }

  _touching(x, y, mask) {
    const me = this;
    let count = 0;
    this._doWithinBounds(x - 1, y - 1, x + 1, y + 1, function (a, b) {
      if (me._is(a, b, mask)) count++;
    });
    return count;
  }

  _is(x, y, mask) {
    if (!this._legal(x, y)) return false;
    return mask.includes(this.getTile(x, y));
  }

  _swapTiles(x, y, a, b) {
    const t1 = this.getTile(x, y);
    const t2 = this.getTile(a, b);
    this.setTile(a, b, t1);
    this.setTile(x, y, t2);
  }

  _swapTilesIf(x, y, a, b, mask) {
    if (!this._is(a, b, mask)) {
      return false;
    } else {
      this._swapTiles(x, y, a, b);
      return true;
    }
  }

  _convertTileIf(x, y, tile, mask) {
    if (!this._is(x, y, mask)) {
      return false;
    } else {
      this.setTile(x, y, tile);
      return true;
    }
  }

  _searchForTile(x, y, tile, radius, walkableMask = ["AIR"]) {
    for (let r = 1; r <= radius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (dx === 0 && dy === 0) continue;

          const a = x + dx;
          const b = y + dy;

          if (this._is(a, b, tile)) {
            // found
            const desiredX = x + Math.sign(dx);
            const desiredY = y + Math.sign(dy);

            // move towards if possible
            if (
              this._swapTilesIf(x, y, desiredX, desiredY, walkableMask) ||
              this._swapTilesIf(x, y, x, desiredY, walkableMask) ||
              this._swapTilesIf(x, y, desiredX, y, walkableMask)
            ) {
              return true;
            }
          }
        }
      }
    }
    // none reachable found in radius
    return false;
  }

  _generatePatches(count, maxHeight, minSize, maxSize, tile, mask) {
    for (let i = 0; i < count; i++) {
      this.fillCircle(
        randomIntInclusive(0, this.cols),
        randomIntInclusive(0, maxHeight),
        randomIntInclusive(minSize, maxSize),
        tile,
        mask,
      );
    }
  }
}
