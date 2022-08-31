const QUEEN_SPEED = 0.1; // The queen will only act this proportion of ticks
const KILL_CHANCE = 0.01; // Chance per tick for each neighbouring hazard to kill
const GROW_CHANCE = 0.1; // Base chance per tick for a lone plant tile to grow (reduced by crowding)

// Tiles ants can climb
const ANT_CLIMB_MASK = [
  "SOIL",
  "SAND",
  "STONE",
  "FUNGUS",
  "CORPSE",
  "ANT",
  "EGG",
];

// Tiles ants can move through
const ANT_WALK_MASK = ["AIR", "EGG", "PLANT", "FUNGUS"];
class World {
  constructor(rows, cols, generatorSettings = {}) {
    this.rows = rows;
    this.cols = cols;
    this.age = 0;
    this.ants = 1;
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
    startingAge = 100,
    startAreaSize = 15,
    sandCount = 50,
    sandMinSize = 4,
    sandMaxSize = 10,
    stoneCount = 15,
    stoneMinSize = 4,
    stoneMaxSize = 8,
    waterCount = 8,
    waterMinSize = 5,
    waterMaxSize = 15,
    hollowCount = 15,
    hollowMinSize = 4,
    hollowMaxSize = 10,
    plantCount = 300,
    fungusCount = 30,
    fungusMinSize = 1,
    fungusMaxSize = 4,
    noiseCount = 200,
    noiseMinSize = 4,
    noiseMaxSize = 6,
  }) {
    const surfaceY = Math.round(this.rows * (1 - skyProp));
    this.surfaceY = surfaceY;
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
      sandCount,
      surfaceY,
      sandMinSize,
      sandMaxSize,
      "SAND",
    );

    // Stones
    this._generatePatches(
      stoneCount,
      surfaceY,
      stoneMinSize,
      stoneMaxSize,
      "STONE",
    );

    // Water
    this._generatePatches(
      waterCount,
      surfaceY - waterMaxSize * 2,
      waterMinSize,
      waterMaxSize,
      "WATER",
      ["SOIL", "SAND", "STONE"],
    );

    // Air pockets
    this._generatePatches(
      hollowCount,
      surfaceY,
      hollowMinSize,
      hollowMaxSize,
      "AIR",
      ["SOIL", "SAND", "STONE", "WATER"],
    );

    // Fungus
    this._generatePatches(
      fungusCount,
      surfaceY - fungusMaxSize * 2,
      fungusMinSize,
      fungusMaxSize,
      "FUNGUS",
      ["SOIL", "SAND"],
    );

    // Noise (to make shapes less obvious)
    this._generatePatches(
      noiseCount,
      surfaceY,
      noiseMinSize,
      noiseMaxSize,
      "SOIL",
      ["SAND", "STONE", "WATER", "FUNGUS", "AIR", "PLANT"],
    );

    // Plant seeds
    this._generatePatches(plantCount, surfaceY + 3, 1, 1, "PLANT", [
      "WATER",
      "AIR",
    ]);

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
    // Guarantee an easy to reach fungus
    this.fillCircle(
      randomIntInclusive(midX - halfStartArea, midX + halfStartArea),
      randomIntInclusive(surfaceY - startAreaSize, surfaceY),
      4,
      "FUNGUS",
    );

    for (let i = 0; i < startingAge; i++) {
      this.tick();
    }

    // Starting units
    this.setTile(midX, surfaceY, "QUEEN");
  }

  _doTileAction(x, y) {
    const bias = Math.random() < 0.5 ? 1 : -1;
    const bias2 = Math.random() < 0.5 ? 1 : -1;
    switch (this.getTile(x, y)) {
      case "SAND":
        // move down or diagonally down
        return (
          this._swapTilesIf(x, y, x, y - 1, ["AIR", "WATER"]) ||
          this._swapTilesIf(x, y, x + bias, y - 1, ["AIR", "WATER"]) ||
          this._swapTilesIf(x, y, x - bias, y - 1, ["AIR", "WATER"])
        );

      case "CORPSE":
        // move down or diagonally down
        return (
          this._swapTilesIf(x, y, x, y - 1, ["AIR"]) ||
          this._swapTilesIf(x, y, x - bias, y - 1, ["AIR"]) ||
          this._swapTilesIf(x, y, x + bias, y - 1, ["AIR"])
        );

      case "WATER":
        // chance to evaporate if no water to left/right
        if (
          Math.random() <= KILL_CHANCE &&
          (this._exposedToSky(x, y) ||
            this._is(x - 1, y, ["AIR"]) ||
            this._is(x + 1, y, ["AIR"]))
        ) {
          return this.setTile(x, y, "AIR");
        }

        // move down or diagonally down or sideways
        return (
          this._swapTilesIf(x, y, x, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTilesIf(x, y, x + bias, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTilesIf(x, y, x - bias, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTilesIf(x, y, x + bias, y, ["AIR", "CORPSE"])
        );

      case "PLANT":
        // when unsupported, move down
        if (
          this._is(x, y - 1, ["AIR", "WATER"]) &&
          this._touching(x, y, ["PLANT"]) < 2
        ) {
          return this._swapTiles(x, y, x, y - 1);
        }

        // when touching fungus, convert to fungus
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["FUNGUS"])) {
          return this.setTile(x, y, "FUNGUS");
        }

        // chance to grow up/down or left/right or diagonal
        if (
          Math.random() <=
          GROW_CHANCE / (this._touching(x, y, ["PLANT"], 3) ** 2 + 1)
        ) {
          const growMask = ["AIR", "WATER", "CORPSE"];
          return (
            this._convertTileIf(x, y + bias2, "PLANT", growMask) ||
            this._convertTileIf(x + bias, y + bias2, "PLANT", growMask)
            // this._convertTileIf(x + bias, y, "PLANT", growMask) ||
          );
        }
        return;

      case "FUNGUS":
        // Destroyed by air
        if (Math.random() <= KILL_CHANCE && this._exposedToSky(x, y)) {
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
          this._searchForTile(x, y, "FUNGUS", 20, ANT_WALK_MASK)
        );

      case "ANT":
        // Destroyed by water
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["WATER"])) {
          return this.setTile(x, y, "CORPSE");
        }

        // TODO - ants currently just move randomly
        const dx = randomIntInclusive(-1, 1);
        const dy = randomIntInclusive(-1, 1);
        return (
          (dy < 1 || this._touching(x + dx, y + dy, ANT_CLIMB_MASK) > 1) &&
          this._swapTilesIf(x, y, x + dx, y + dy, ANT_WALK_MASK)
        );

      case "EGG":
        // Destroyed by water
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["WATER"])) {
          return this.setTile(x, y, "CORPSE");
        }

        // chance to convert to ant, else move down or diagonally down
        if (Math.random() <= 0.001) {
          // hatch into QUEEN or ANT
          this.setTile(x, y, Math.random() < 0.01 ? "QUEEN" : "ANT");
          this.ants++;
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

  _exposedToSky(x, y) {
    for (let i = y + 1; i < this.rows; i++) {
      if (!this._is(x, i, ["AIR"])) return false;
    }
    return true;
  }

  _touching(x, y, mask, radius = 1) {
    const me = this;
    let count = 0;
    this._doWithinBounds(
      x - radius,
      y - radius,
      x + radius,
      y + radius,
      function (a, b) {
        if (me._is(a, b, mask) && (a !== x || b !== y)) count++;
      },
    );
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
