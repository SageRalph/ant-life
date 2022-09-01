class Worldlogic {
  constructor(world) {
    this.world = world;
  }

  doTileAction(x, y) {
    const bias = Math.random() < 0.5 ? 1 : -1;
    const bias2 = Math.random() < 0.5 ? 1 : -1;
    switch (this.world.getTile(x, y)) {
      case "SAND":
        // move down or diagonally down
        return (
          this.world.swapTiles(x, y, x, y - 1, ["AIR", "WATER"]) ||
          this.world.swapTiles(x, y, x + bias, y - 1, ["AIR", "WATER"]) ||
          this.world.swapTiles(x, y, x - bias, y - 1, ["AIR", "WATER"])
        );

      case "CORPSE":
        // when touching plant, convert to plant
        if (Math.random() <= CONVERT_PROB * this._touching(x, y, ["PLANT"])) {
          return this.world.setTile(x, y, "PLANT");
        }

        // move down or diagonally down
        return (
          this.world.swapTiles(x, y, x, y - 1, ["AIR"]) ||
          this.world.swapTiles(x, y, x - bias, y - 1, ["AIR"]) ||
          this.world.swapTiles(x, y, x + bias, y - 1, ["AIR"])
        );

      case "WATER":
        // chance to evaporate under sky or if air to left/right or near plant
        if (
          Math.random() <= EVAPORATE_PROB &&
          (this._exposedToSky(x, y) ||
            this.world.checkTile(x - 1, y, ["AIR"]) ||
            this.world.checkTile(x + 1, y, ["AIR"]) ||
            this._touching(x, y, ["PLANT"]))
        ) {
          return this.world.setTile(x, y, "AIR");
        }

        // move down or diagonally down or sideways
        return (
          this.world.swapTiles(x, y, x, y - 1, ["AIR", "CORPSE"]) ||
          this.world.swapTiles(x, y, x + bias, y - 1, ["AIR", "CORPSE"]) ||
          this.world.swapTiles(x, y, x - bias, y - 1, ["AIR", "CORPSE"]) ||
          this.world.swapTiles(x, y, x + bias, y, ["AIR", "CORPSE"])
        );

      case "PLANT":
        // when unsupported, move down
        if (
          this.world.checkTile(x, y - 1, ["AIR", "WATER"]) &&
          this._touching(x, y, ["PLANT"]) < 2
        ) {
          return this.world.swapTiles(x, y, x, y - 1);
        }

        // when touching fungus, convert to fungus
        if (Math.random() <= CONVERT_PROB * this._touching(x, y, ["FUNGUS"])) {
          return this.world.setTile(x, y, "FUNGUS");
        }

        // chance to grow up/down or left/right or diagonal
        if (
          Math.random() <=
          GROW_PROB / (this._touching(x, y, ["PLANT"], 3) ** 2 + 1)
        ) {
          return (
            this.world.setTile(x, y + bias2, "PLANT", PLANT_GROW_MASK) ||
            this.world.setTile(x + bias, y + bias2, "PLANT", PLANT_GROW_MASK)
            // this.world.setTile(x + bias, y, "PLANT", PLANT_GROW_MASK) ||
          );
        }
        return;

      case "FUNGUS":
        // Destroyed by air
        if (Math.random() <= KILL_PROB && this._exposedToSky(x, y)) {
          return this.world.setTile(x, y, "SAND");
        }
        return;

      case "QUEEN":
        // Destroyed by water
        if (Math.random() <= KILL_PROB * this._touching(x, y, ["WATER"])) {
          return this.world.setTile(x, y, "CORPSE");
        }
        // when touching fungus, converts one to egg, else move any direction towards closest fungus
        if (Math.random() <= QUEEN_SPEED) {
          return (
            this._setOneTouching(x, y, "EGG", ["FUNGUS"]) ||
            this._searchForTile(x, y, "FUNGUS", QUEEN_RANGE, WALK_MASK)
          );
        }
        return false;

      case "ANT":
        // Destroyed by water
        if (Math.random() <= KILL_PROB * this._touching(x, y, ["WATER"])) {
          return this.world.setTile(x, y, "CORPSE");
        }

        return this._antMove(x, y);

      case "PEST":
        // Destroyed by water and ants
        if (
          Math.random() <=
          KILL_PROB * this._touching(x, y, ["WATER", "ANT"])
        ) {
          return this.world.setTile(x, y, "CORPSE");
        }

        // Fight ants, queens, eggs
        // Note: this is asymmetric so groups of ants fight better than pests.
        // Pests are hit by all neighbouring ants but only hit one ant per tick.
        // But pests have a higher base attack chance so typically win 1 on 1.
        if (Math.random() <= KILL_PROB * 2) {
          if (this._setOneTouching(x, y, "CORPSE", ["ANT", "EGG", "QUEEN"])) {
            return true;
          }
        }

        return this._pestMove(x, y);

      case "EGG":
        // Destroyed by water
        if (Math.random() <= KILL_PROB * this._touching(x, y, ["WATER"])) {
          return this.world.setTile(x, y, "CORPSE");
        }

        // chance to convert to ant, else move down or diagonally down
        if (Math.random() <= EGG_HATCH_PROB) {
          // hatch into QUEEN or ANT
          this.world.setTile(
            x,
            y,
            Math.random() < EGG_QUEEN_PROB ? "QUEEN" : "ANT",
          );
          this.world.ants++;
          return true;
        }
        return (
          this.world.swapTiles(x, y, x, y - 1, ["AIR", "WATER"]) ||
          this.world.swapTiles(x, y, x - bias, y - 1, ["AIR", "WATER"]) ||
          this.world.swapTiles(x, y, x + bias, y - 1, ["AIR", "WATER"])
        );
    }
  }

  _antMove(x, y) {
    // TODO - ants currently just move randomly
    const dx = randomIntInclusive(-1, 1);
    const dy = randomIntInclusive(-1, 1);
    return (
      (dy < 1 || this._touching(x + dx, y + dy, CLIMB_MASK) > 1) &&
      this.world.swapTiles(x, y, x + dx, y + dy, WALK_MASK)
    );
  }

  _pestMove(x, y) {
    // Seek out eggs
    if (this._searchForTile(x, y, PEST_TARGET_MASK, PEST_RANGE, WALK_MASK)) {
      return true;
    }
    // move randomly
    // Note: random movement uses a reduced tileset to avoid helping farm
    let dx = randomIntInclusive(-1, 1);
    let dy = randomIntInclusive(-1, 1);
    return this.world.swapTiles(x, y, x + dx, y + dy, ROAM_MASK);
  }

  _exposedToSky(x, y) {
    for (let i = y + 1; i < this.world.rows; i++) {
      if (!this.world.checkTile(x, i, ["AIR"])) return false;
    }
    return true;
  }

  _touching(x, y, mask, radius = 1) {
    return this._touchingWhich(x, y, mask, radius).length;
  }

  _touchingWhich(x, y, mask, radius = 1) {
    const world = this.world;
    const touching = [];
    this.world.forEachTile(
      x - radius,
      y - radius,
      x + radius,
      y + radius,
      function (a, b) {
        if (world.checkTile(a, b, mask) && (a !== x || b !== y))
          touching.push({ a, b });
      },
    );
    return touching;
  }

  _setOneTouching(x, y, tile, mask) {
    const targets = this._touchingWhich(x, y, mask);
    if (targets.length) {
      const target = targets[randomIntInclusive(0, targets.length - 1)];
      return this.world.setTile(target.a, target.b, tile);
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

          if (this.world.checkTile(a, b, tile)) {
            // found
            const desiredX = x + Math.sign(dx);
            const desiredY = y + Math.sign(dy);

            // move towards if possible
            if (
              this.world.swapTiles(x, y, desiredX, desiredY, walkableMask) ||
              this.world.swapTiles(x, y, x, desiredY, walkableMask) ||
              this.world.swapTiles(x, y, desiredX, y, walkableMask)
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
