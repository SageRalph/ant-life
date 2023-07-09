/**
 * Tile logic for the world
 * @param {World} world - The world state object to operate on
 */
class Worldlogic {
  constructor(world) {
    this.world = world;
  }

  /**
   * Runs the simulation for a single step
   */
  tick() {
    this.world.age += 1;

    // Randomly alternate left-to-right and right-to-left to avoid turn-order bias
    const bias = Math.random() <= 0.5;

    for (let y = 0; y < this.world.rows; y++) {
      for (let x = 0; x < this.world.cols; x++) {
        const dx = bias ? x : this.world.cols - 1 - x;
        this._doTileAction(dx, y);
      }
    }
  }

  /**
   * Perform the action for a tile if it has one
   * @param {number} x - X coordinate of tile
   * @param {number} y - Y coordinate of tile
   * @returns {boolean} - Whether the tile performed an action
   */
  _doTileAction(x, y) {
    const actions = {
      SAND: this._sandAction,
      CORPSE: this._corpseAction,
      WATER: this._waterAction,
      PLANT: this._plantAction,
      FUNGUS: this._fungusAction,
      RICH_FUNGUS: this._fungusAction,
      QUEEN: this._queenAction,
      WORKER: this._workerAction,
      PEST: this._pestAction,
      EGG: this._eggAction,
      TRAIL: this._trailAction,
    };

    const tile = this.world.getTile(x, y);
    if (actions.hasOwnProperty(tile)) {
      return actions[tile].call(this, x, y);
    } else {
      return false;
    }
  }

  /**
   * Performs the action for a SAND tile
   * SAND falls down and to the side
   * @param {number} x - X coordinate of tile
   * @param {number} y - Y coordinate of tile
   * @returns {boolean} - Whether the tile performed an action
   */
  _sandAction(x, y) {
    // move down or diagonally down
    const bias = randomSign();
    return (
      this.world.swapTiles(x, y, x, y - 1, ["AIR", "WATER"]) ||
      this.world.swapTiles(x, y, x + bias, y - 1, ["AIR", "WATER"]) ||
      this.world.swapTiles(x, y, x - bias, y - 1, ["AIR", "WATER"])
    );
  }

  /**
   * Performs the action for a CORPSE tile
   * CORPSE falls down and to the side and has a chance to be converted by adjacent PLANT tiles
   */
  _corpseAction(x, y) {
    // when touching plant, convert to plant
    if (Math.random() <= CONVERT_PROB * this._touching(x, y, ["PLANT"])) {
      return this.world.setTile(x, y, "PLANT");
    }

    // move down or diagonally down
    const bias = randomSign();
    return (
      this.world.swapTiles(x, y, x, y - 1, ["AIR"]) ||
      this.world.swapTiles(x, y, x - bias, y - 1, ["AIR"]) ||
      this.world.swapTiles(x, y, x + bias, y - 1, ["AIR"])
    );
  }

  /**
   * Performs the action for a WATER tile
   * WATER falls down and to the side, evaporates under sky or if air to
   * left/right or near plant, and kills neighbouring creatures
   */
  _waterAction(x, y) {
    // chance to kill neighbouring creatures
    if (
      Math.random() <= KILL_PROB &&
      this._setOneTouching(x, y, "CORPSE", WATER_KILL_MASK)
    ) {
      return this.world.setTile(x, y, "AIR");
    }

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
    const bias = randomSign();
    return (
      this.world.swapTiles(x, y, x, y - 1, ["AIR", "CORPSE"]) ||
      this.world.swapTiles(x, y, x + bias, y - 1, ["AIR", "CORPSE"]) ||
      this.world.swapTiles(x, y, x - bias, y - 1, ["AIR", "CORPSE"]) ||
      this.world.swapTiles(x, y, x + bias, y, ["AIR", "CORPSE"])
    );
  }

  /**
   * Performs the action for a PLANT tile
   * PLANT falls down when unsupported by adjacent PLANT tiles and has a chance to grow
   * Growth is less likely when touching other PLANT or FUNGUS tiles so they form narrow stems
   */
  _plantAction(x, y) {
    // when unsupported, move down
    if (
      this.world.checkTile(x, y - 1, ["AIR", "WATER"]) &&
      this._touching(x, y, ["PLANT"]) < 2
    ) {
      return this.world.swapTiles(x, y, x, y - 1);
    }

    // chance to grow up/down or left/right or diagonal, reduced by nearby plant/fungus
    if (
      Math.random() <=
      GROW_PROB /
        (this._touching(x, y, ["PLANT", "FUNGUS", "RICH_FUNGUS"], 3) ** 2 + 1)
    ) {
      const bias = randomSign();
      const bias2 = randomSign();
      return (
        this.world.setTile(x, y + bias2, "PLANT", PLANT_GROW_MASK) ||
        this.world.setTile(x + bias, y + bias2, "PLANT", PLANT_GROW_MASK)
        // this.world.setTile(x + bias, y, "PLANT", PLANT_GROW_MASK) ||
      );
    }
    return;
  }

  /**
   * Performs the action for a FUNGUS tile
   * FUNGUS falls down and has a chance to convert to adjacent PLANT tiles if underground
   */
  _fungusAction(x, y) {
    // // Destroyed by air
    // if (Math.random() <= KILL_PROB && this._exposedToSky(x, y)) {
    //   return this.world.setTile(x, y, "SAND");
    // }

    // when unsupported, move down
    if (
      this.world.checkTile(x, y - 1, ["AIR", "WATER"]) &&
      this._touching(x, y, ["FUNGUS", "RICH_FUNGUS", "PLANT"]) < 2
    ) {
      return this.world.swapTiles(x, y, x, y - 1);
    }

    // When underground and touching corpse, convert to RICH_FUNGUS
    if (y < this.world.surfaceY && Math.random() <= CONVERT_PROB) {
      if (this._setOneTouching(x, y, "RICH_FUNGUS", ["CORPSE"])) {
        return true;
      }
    }

    // When underground and touching plant, convert to fungus
    if (y < this.world.surfaceY && Math.random() <= CONVERT_PROB) {
      if (this._setOneTouching(x, y, "FUNGUS", ["PLANT"])) {
        return true;
      }
    }

    return;
  }

  /**
   * Performs the action for a QUEEN tile
   * QUEEN falls down when unable to climb. When few FUNGUS tiles are nearby,
   * QUEEN moves randomly. When adjacent to FUNGUS QUEEN converts it to EGG.
   * Otherwise QUEEN moves towards closest FUNGUS if any are in range. QUEEN
   * will not convert FUNGUS if there are too few nearby to avoid extinction.
   */
  _queenAction(x, y) {
    // when unsupported on all sides, move down
    if (!this._climbable(x, y)) {
      return this.world.swapTiles(x, y, x, y - 1);
    }

    if (Math.random() <= QUEEN_SPEED) {
      // when few fungus nearby, move randomly
      if (
        this._touching(x, y, ["FUNGUS", "RICH_FUNGUS"], QUEEN_RANGE) <
        QUEEN_FUNGUS_MIN
      ) {
        return this._moveRandom(x, y, WALK_MASK);
      }
      // when touching fungus, converts one to egg, else move any direction towards closest fungus
      // RICH_FUNGUS always converts to EGG
      const tileLaid = Math.random() <= EGG_LAY_PROB ? "EGG" : "AIR";
      return (
        this._setOneTouching(x, y, "EGG", ["RICH_FUNGUS"]) ||
        this._setOneTouching(x, y, tileLaid, ["FUNGUS"]) ||
        this._searchForTile(
          x,
          y,
          ["FUNGUS", "RICH_FUNGUS"],
          QUEEN_RANGE,
          WALK_MASK,
        ) ||
        this._moveRandom(x, y, WALK_MASK) // unreachable target
      );
    }
    return false;
  }

  /**
   * Performs the action for a WORKER tile
   * WORKER falls down when unable to climb and moves randomly.
   * When moving randomly, WORKER will push adjacent tiles, spreading them around.
   */
  _workerAction(x, y) {
    // when unsupported on all sides, move down
    if (!this._climbable(x, y)) {
      return this.world.swapTiles(x, y, x, y - 1);
    }

    // move randomly
    return this._moveRandom(x, y, WALK_MASK, PUSH_MASK);
  }

  /**
   * Performs the action for a PEST tile
   * PESTS kill adjacent WORKER, QUEEN, and EGG tiles, seek out targets, or fly around randomly.
   * PESTS can be killed by adjacent WORKER tiles but usually win a 1-on-1 fight.
   */
  _pestAction(x, y) {
    // Destroyed by workers
    if (Math.random() <= KILL_PROB * this._touching(x, y, ["WORKER"])) {
      return this.world.setTile(x, y, "CORPSE");
    }

    // Fight workers, queens, eggs
    // Note: this is asymmetric so groups of workers fight better than pests.
    // Pests are hit by all neighbouring workers but only hit one worker per tick.
    // But pests have a higher base attack chance so typically win 1 on 1.
    if (Math.random() <= KILL_PROB * 2) {
      if (this._setOneTouching(x, y, "CORPSE", PEST_TARGET_MASK)) {
        return true;
      }
    }

    // Chance to seek out targets
    // Note: low chance allows going around obstacles and also reduces lag
    if (
      Math.random() < PEST_SEEK_PROB &&
      this._searchForTile(x, y, PEST_TARGET_MASK, PEST_RANGE, WALK_MASK)
    ) {
      return true;
    }
    // move randomly
    // Note: random movement uses a reduced tileset to avoid helping farm
    return this._moveRandom(x, y, ROAM_MASK);
  }

  /**
   * Performs the action for an EGG tile
   * EGG falls down and to the side and has a chance to hatch into a QUEEN or WORKER.
   */
  _eggAction(x, y) {
    // chance to hatch, else move down or diagonally down
    if (Math.random() <= EGG_HATCH_PROB) {
      // hatch into QUEEN or WORKER
      this.world.setTile(
        x,
        y,
        Math.random() < EGG_QUEEN_PROB ? "QUEEN" : "WORKER",
      );
      this.world.ants++;
      return true;
    }
    const bias = randomSign();
    return (
      this.world.swapTiles(x, y, x, y - 1, ["AIR", "WATER"]) ||
      this.world.swapTiles(x, y, x - bias, y - 1, ["AIR", "WATER"]) ||
      this.world.swapTiles(x, y, x + bias, y - 1, ["AIR", "WATER"])
    );
  }

  /**
   * Performs the action for a TRAIL tile
   * TRAIL falls down but is destroyed on contact with anything except air.
   * TRAIL draws a random WORKER within range (if any) towards it. This is separate
   * from the WORKER action, so TRAIL lets WORKERs move faster than usual.
   */
  _trailAction(x, y) {
    let result = false;

    // when unsupported on all sides, move down but don't stack
    if (!this._climbable(x, y)) {
      if (this.world.checkTile(x, y - 1, "TRAIL")) {
        this.world.setTile(x, y, "AIR");
      } else {
        this.world.swapTiles(x, y, x, y - 1);
      }
    }

    // find a worker to draw
    const targets = this._touchingWhich(x, y, ["WORKER"], WORKER_RANGE);
    if (!targets.length) {
      result = false;
    } else {
      // choose one at random
      const { a, b } = targets[randomIntInclusive(0, targets.length - 1)];

      // move worker towards if possible
      const desiredA = a + Math.sign(x - a);
      const desiredB = b + Math.sign(y - b);
      result =
        this._climbable(a, b) &&
        (this.world.swapTiles(a, b, desiredA, desiredB, WALK_MASK) ||
          this.world.swapTiles(a, b, a, desiredB, WALK_MASK) ||
          this.world.swapTiles(a, b, desiredA, b, WALK_MASK));
    }

    // Instantly destroyed on contact with anything that moves
    // Note: this is done after drawing workers so it works when touching a surface
    // however, this means we have to check that its not been consumed yet
    if (
      this.world.checkTile(x, y, ["TRAIL"]) && // check not consumed
      this._touching(x, y, ["AIR", "TRAIL"]) < 8
    ) {
      return this.world.setTile(x, y, "AIR");
    }
    return result;
  }

  /**
   * Returns whether a tile is climbable
   * @param {number} x - x coordinate
   * @param {number} y - y coordinate
   * @returns {boolean} whether the tile is climbable
   */
  _climbable(x, y) {
    return (
      !this.world.checkTile(x, y - 1, ["AIR", "TRAIL"]) ||
      this._touching(x, y, CLIMB_MASK) > 0
    );
  }

  /**
   * Move in a random direction, switching places with the target tile
   * or pushing the tile in front if possible
   * @param {number} x - mover x coordinate
   * @param {number} y - mover y coordinate
   * @param {string[]} mask - tile types that can be swapped with
   * @param {boolean} pushMask - tile types that can be pushed
   * @returns {boolean} whether tiles were swapped
   */
  _moveRandom(x, y, mask, pushMask = false) {
    // determine direction
    const dx = randomIntInclusive(-1, 1);
    const dy = randomIntInclusive(-1, 1);

    // when moving into a pushable tile, swap the two tiles in front
    if (pushMask && this.world.checkTile(x + dx, y + dy, pushMask)) {
      // push less vertically than horizontally
      this.world.swapTiles(x + dx, y + dy, x + dx + dx, y + dy, mask);
    }

    // swap with tile in front
    return this.world.swapTiles(x, y, x + dx, y + dy, mask);
  }

  /**
   * Returns whether a tile is exposed to the sky
   * @param {number} x - x coordinate
   * @param {number} y - y coordinate
   * @returns {boolean} whether the tile is exposed to the sky
   */
  _exposedToSky(x, y) {
    for (let i = y + 1; i < this.world.rows; i++) {
      if (!this.world.checkTile(x, i, ["AIR"])) return false;
    }
    return true;
  }

  /**
   * Returns the number of tiles matching the mask that are in reach
   * @param {number} x - x coordinate
   * @param {number} y - y coordinate
   * @param {string[]} mask - tile types to check for
   * @param {number} radius - radius to check (1 means only adjacent tiles)
   * @returns {boolean} the number of matching tiles in reach
   */
  _touching(x, y, mask, radius = 1) {
    return this._touchingWhich(x, y, mask, radius).length;
  }

  /**
   * Returns the tiles matching the mask that are in reach
   * @param {number} x - x coordinate
   * @param {number} y - y coordinate
   * @param {string[]} mask - tile types to check for
   * @param {number} radius - radius to check (1 means only adjacent tiles)
   * @returns {object[]} list of matching tiles in reach as {x, y} objects
   */
  _touchingWhich(x, y, mask, radius = 1) {
    // If no chunks in range contain target, skip searching
    const threshold = this.world.checkTile(x, y, mask) ? 2 : 1;
    if (!this.world.checkChunks(x, y, mask, radius, threshold)) return [];

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

  /**
   * Sets one random tile matching the mask that is in reach to the given tile
   * @param {number} x - x coordinate
   * @param {number} y - y coordinate
   * @param {string} tile - tile type to set
   * @param {string[]} mask - tile types allowed to be replaced
   * @returns {boolean} whether a tile was replaced
   */
  _setOneTouching(x, y, tile, mask) {
    const targets = this._touchingWhich(x, y, mask);
    if (targets.length) {
      const target = targets[randomIntInclusive(0, targets.length - 1)];
      return this.world.setTile(target.a, target.b, tile);
    }
    return false;
  }

  /**
   * Move one step towards the nearest tile matching the target mask (if any are in range),
   * switching places with the next tile in that direction
   * @param {number} x - mover x coordinate
   * @param {number} y - mover y coordinate
   * @param {string[]} targetMask - tile types to move towards
   * @param {number} radius - maximum search range
   * @param {string[]} walkableMask - tile types that can be moved into
   * @returns {boolean} whether the tile moved
   */
  _searchForTile(x, y, targetMask, radius, walkableMask = ["AIR"]) {
    // If no chunks in range contain target, skip searching
    if (!this.world.checkChunks(x, y, targetMask, radius)) return false;

    for (let r = 1; r <= radius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (dx === 0 && dy === 0) continue;

          const a = x + dx;
          const b = y + dy;

          if (this.world.checkTile(a, b, targetMask)) {
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
