const QUEEN_SPEED = 0.1; // The queen will only act this proportion of ticks
const KILL_CHANCE = 0.01; // Chance per tick for each hazard to kill
const EVAPORATE_CHANCE = 0.01; // Chance per tick for water to evaporate
const CONVERT_CHANCE = 0.01; // Chance per tick for fungus/plant to convert
const GROW_CHANCE = 0.1; // Base chance per tick for a lone plant tile to grow (reduced by crowding)
const RAIN_FREQ = 2500; // How often (in game ticks) it rains
const RAIN_TIME = 500; // How long (in game ticks) it rains for
const PEST_FREQ = 100; // How often (in game ticks) a pest enters the map
const PEST_START = 4000; // How long (in game ticks) before pests can spawn

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
const ANT_WALK_MASK = ["AIR", "CORPSE", "EGG", "PLANT", "FUNGUS"];

// Tiles pests can move through
const PEST_WALK_MASK = ["AIR", "CORPSE", "FUNGUS"];

class World {
  constructor(rows, cols, generatorSettings = {}) {
    this.rows = rows;
    this.cols = cols;
    this.age = 0;
    this.ants = 1;
    this.generatorSettings = generatorSettings;
    this.worldgen = new Worldgen(this);
    this.worldgen.generate(generatorSettings);
  }

  tick() {
    this.age += 1;

    // Tile actions
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this._doTileAction(x, y);
      }
    }

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

  getTile(x, y) {
    return this.tiles[y][x];
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

  _doTileAction(x, y) {
    const bias = Math.random() < 0.5 ? 1 : -1;
    const bias2 = Math.random() < 0.5 ? 1 : -1;
    switch (this.getTile(x, y)) {
      case "SAND":
        // move down or diagonally down
        return (
          this._swapTiles(x, y, x, y - 1, ["AIR", "WATER"]) ||
          this._swapTiles(x, y, x + bias, y - 1, ["AIR", "WATER"]) ||
          this._swapTiles(x, y, x - bias, y - 1, ["AIR", "WATER"])
        );

      case "CORPSE":
        // when touching plant, convert to plant
        if (Math.random() <= CONVERT_CHANCE * this._touching(x, y, ["PLANT"])) {
          return this.setTile(x, y, "PLANT");
        }

        // move down or diagonally down
        return (
          this._swapTiles(x, y, x, y - 1, ["AIR"]) ||
          this._swapTiles(x, y, x - bias, y - 1, ["AIR"]) ||
          this._swapTiles(x, y, x + bias, y - 1, ["AIR"])
        );

      case "WATER":
        // chance to evaporate under sky or if air to left/right or near plant
        if (
          Math.random() <= EVAPORATE_CHANCE &&
          (this._exposedToSky(x, y) ||
            this._is(x - 1, y, ["AIR"]) ||
            this._is(x + 1, y, ["AIR"]) ||
            this._touching(x, y, ["PLANT"]))
        ) {
          return this.setTile(x, y, "AIR");
        }

        // move down or diagonally down or sideways
        return (
          this._swapTiles(x, y, x, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTiles(x, y, x + bias, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTiles(x, y, x - bias, y - 1, ["AIR", "CORPSE"]) ||
          this._swapTiles(x, y, x + bias, y, ["AIR", "CORPSE"])
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
        if (
          Math.random() <=
          CONVERT_CHANCE * this._touching(x, y, ["FUNGUS"])
        ) {
          return this.setTile(x, y, "FUNGUS");
        }

        // chance to grow up/down or left/right or diagonal
        if (
          Math.random() <=
          GROW_CHANCE / (this._touching(x, y, ["PLANT"], 3) ** 2 + 1)
        ) {
          const growMask = ["AIR", "WATER", "CORPSE"];
          return (
            this.setTile(x, y + bias2, "PLANT", growMask) ||
            this.setTile(x + bias, y + bias2, "PLANT", growMask)
            // this.setTile(x + bias, y, "PLANT", growMask) ||
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
        if (Math.random() <= QUEEN_SPEED) {
          return (
            this._setOneTouching(x, y, "EGG", ["FUNGUS"]) ||
            this._searchForTile(x, y, "FUNGUS", 20, ANT_WALK_MASK)
          );
        }
        return false;

      case "ANT":
        // Destroyed by water
        if (Math.random() <= KILL_CHANCE * this._touching(x, y, ["WATER"])) {
          return this.setTile(x, y, "CORPSE");
        }

        return this._antMove(x, y);

      case "PEST":
        // Destroyed by water and ants
        if (
          Math.random() <=
          KILL_CHANCE * this._touching(x, y, ["WATER", "ANT"])
        ) {
          return this.setTile(x, y, "CORPSE");
        }

        // Fight ants, queens, eggs
        // Note: this is asymmetric so groups of ants fight better than pests.
        // Pests are hit by all neighbouring ants but only hit one ant per tick.
        // But pests have a higher base attack chance so typically win 1 on 1.
        if (Math.random() <= KILL_CHANCE * 2) {
          if (this._setOneTouching(x, y, "CORPSE", ["ANT", "EGG", "QUEEN"])) {
            return true;
          }
        }

        return this._pestMove(x, y);

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
          this._swapTiles(x, y, x, y - 1, ["AIR", "WATER"]) ||
          this._swapTiles(x, y, x - bias, y - 1, ["AIR", "WATER"]) ||
          this._swapTiles(x, y, x + bias, y - 1, ["AIR", "WATER"])
        );
    }
  }

  _antMove(x, y) {
    // TODO - ants currently just move randomly
    const dx = randomIntInclusive(-1, 1);
    const dy = randomIntInclusive(-1, 1);
    return (
      (dy < 1 || this._touching(x + dx, y + dy, ANT_CLIMB_MASK) > 1) &&
      this._swapTiles(x, y, x + dx, y + dy, ANT_WALK_MASK)
    );
  }

  _pestMove(x, y) {
    // Seek out eggs
    if (this._searchForTile(x, y, "EGG", 20, ANT_WALK_MASK)) {
      return true;
    }
    if (this._searchForTile(x, y, "ANT", 10, ANT_WALK_MASK)) {
      return true;
    }
    // move randomly
    // Note: random movement uses a reduced tileset to avoid helping farm
    let dx = randomIntInclusive(-1, 1);
    let dy = randomIntInclusive(-1, 1);
    return this._swapTiles(x, y, x + dx, y + dy, PEST_WALK_MASK);
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

  _exposedToSky(x, y) {
    for (let i = y + 1; i < this.rows; i++) {
      if (!this._is(x, i, ["AIR"])) return false;
    }
    return true;
  }

  _touching(x, y, mask, radius = 1) {
    return this._touchingWhich(x, y, mask, radius).length;
  }

  _touchingWhich(x, y, mask, radius = 1) {
    const me = this;
    const touching = [];
    this._doWithinBounds(
      x - radius,
      y - radius,
      x + radius,
      y + radius,
      function (a, b) {
        if (me._is(a, b, mask) && (a !== x || b !== y)) touching.push({ a, b });
      },
    );
    return touching;
  }

  _is(x, y, mask) {
    if (!this._legal(x, y)) return false;
    if (!mask) return true;
    return mask.includes(this.getTile(x, y));
  }

  _swapTiles(x, y, a, b, mask = false) {
    if (!this._is(a, b, mask)) {
      return false;
    } else {
      const t1 = this.getTile(x, y);
      const t2 = this.getTile(a, b);
      this.setTile(a, b, t1);
      this.setTile(x, y, t2);
      return true;
    }
  }

  setTile(x, y, tile, mask = false) {
    if (!this._is(x, y, mask)) {
      return false;
    } else {
      this.tiles[y][x] = tile;
      return true;
    }
  }

  _setOneTouching(x, y, tile, mask) {
    const targets = this._touchingWhich(x, y, mask);
    if (targets.length) {
      const target = targets[randomIntInclusive(0, targets.length - 1)];
      return this.setTile(target.a, target.b, tile);
    }
    return false;
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
              this._swapTiles(x, y, desiredX, desiredY, walkableMask) ||
              this._swapTiles(x, y, x, desiredY, walkableMask) ||
              this._swapTiles(x, y, desiredX, y, walkableMask)
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
}
