/**
 * World generation
 * @param {World} world - World state object to modify
 */
class Worldgen {
  constructor(world) {
    this.world = world;
  }

  /**
   * Generate a benchmark world with random tiles from the tileset
   * @param {string[]} mask - Array of tile types to use
   */
  generateBenchmarkWorld(mask = Object.keys(TILESET)) {
    this.world.age = 0;
    this.world.surfaceY = this.world.rows - 1;

    // World containing random tiles
    this.world.tiles = [];
    for (let y = 0; y < this.world.rows; y++) {
      let row = [];
      for (let x = 0; x < this.world.cols; x++) {
        // Random tile from mask
        let tile = mask[randomIntInclusive(0, mask.length - 1)];
        row.push(tile);
      }
      this.world.tiles.push(row);
    }
  }

  /**
   * Generate a world
   * All options scale with world size, numbers are for a 10000 tile (100x100) world
   * @param {object} options - World generation options
   * @param {number} options.skyProp - Proportion of world that is sky
   * @param {number} options.startingAge - Starting age of world
   * @param {number} options.startAreaSize - Size of starting area
   * @param {number} options.sandCount - Number of sand patches
   * @param {number} options.sandMinSize - Minimum size of sand patches
   * @param {number} options.sandMaxSize - Maximum size of sand patches
   * @param {number} options.stoneCount - Number of stone patches
   * @param {number} options.stoneMinSize - Minimum size of stone patches
   * @param {number} options.stoneMaxSize - Maximum size of stone patches
   * @param {number} options.waterCount - Number of water patches
   * @param {number} options.waterMinSize - Minimum size of water patches
   * @param {number} options.waterMaxSize - Maximum size of water patches
   * @param {number} options.hollowCount - Number of hollow patches
   * @param {number} options.hollowMinSize - Minimum size of hollow patches
   * @param {number} options.hollowMaxSize - Maximum size of hollow patches
   * @param {number} options.surfacePlantCount - Number of plants on surface
   * @param {number} options.plantCount - Number of plants
   * @param {number} options.fungusCount - Number of fungus patches
   * @param {number} options.fungusMinSize - Minimum size of fungus patches
   * @param {number} options.fungusMaxSize - Maximum size of fungus patches
   * @param {number} options.noiseCount - Number of noise patches
   * @param {number} options.noiseMinSize - Minimum size of noise patches
   * @param {number} options.noiseMaxSize - Maximum size of noise patches
   *
   */
  generate({
    skyProp = 0.2,
    startingAge = 100,
    startAreaSize = 10,
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
    surfacePlantCount = 10,
    plantCount = 300,
    fungusCount = 30,
    fungusMinSize = 1,
    fungusMaxSize = 4,
    noiseCount = 200,
    noiseMinSize = 4,
    noiseMaxSize = 6,
  }) {
    this.world.age = 0;
    this.world.setAge(0);

    const surfaceY = Math.round(this.world.rows * (1 - skyProp));
    this.world.surfaceY = surfaceY;
    const midX = Math.round(this.world.cols / 2);

    // Build 2d tile array
    this.world.tiles = [];
    for (let y = 0; y < this.world.rows; y++) {
      let row = [];
      for (let x = 0; x < this.world.cols; x++) {
        // Default to SOIL underground and AIR above
        let tile = y < surfaceY ? "SOIL" : "AIR";
        row.push(tile);
      }
      this.world.tiles.push(row);
    }
    this.world.setTiles(JSON.stringify(this.world.tiles));

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
    // These are SOIL patches that can occlude other patches to break up shapes
    this._generatePatches(
      noiseCount,
      surfaceY,
      noiseMinSize,
      noiseMaxSize,
      "SOIL",
      ["SAND", "STONE", "WATER", "FUNGUS", "AIR", "PLANT"],
    );

    // Underground Plant
    this._generatePatches(plantCount, surfaceY, 1, 1, "PLANT", [
      "WATER",
      "AIR",
    ]);

    // Surface Plant
    const plantProb = surfacePlantCount / 100;
    for (let x = 0; x < this.world.cols; x++) {
      if (Math.random() <= plantProb) {
        this.world.setTile(x, this._findSurfaceY(x) + 1, "PLANT");
      }
    }

    // Bedrock
    for (let x = 0; x < this.world.cols; x++) {
      this.world.fillCircle(x, 0, randomIntInclusive(1, 6), "STONE");
    }

    // Starting area
    // Clear a cone shape
    const queenToCeil = this.world.rows - surfaceY + 1;
    const halfStartArea = Math.round(startAreaSize / 2);
    for (let x = midX - halfStartArea; x < midX + halfStartArea; x++) {
      this.world.fillCircle(x, this.world.rows, queenToCeil, "AIR");
    }
    this.world.fillCircle(midX, surfaceY, startAreaSize, "SOIL", [
      "SAND",
      "STONE",
    ]);
    // Guarantee an easy to reach fungus
    this.world.fillCircle(
      randomIntInclusive(midX - halfStartArea, midX + halfStartArea),
      randomIntInclusive(surfaceY - startAreaSize, surfaceY),
      4,
      "FUNGUS",
    );

    for (let i = 0; i < startingAge; i++) {
      this.world.tick();
    }

    // Starting units
    this.world.setTile(midX, surfaceY, "QUEEN");
  }

  /**
   * Generate a number of patches of a given tile type, with a given size range
   * count is scaled based on map size (counts are for a 100x100 10000 tile map)
   * @param {number} count - Number of patches to generate (will be scaled based on map size)
   * @param {number} maxHeight - Maximum height to generate patches at
   * @param {number} minSize - Minimum patch size
   * @param {number} maxSize - Maximum patch size
   * @param {string} tile - Tile type to generate
   * @param {string[]} mask - Tile types allowed to be replaced
   */
  _generatePatches(count, maxHeight, minSize, maxSize, tile, mask) {
    // Scale based on map size (counts are for default 100x100 map)
    const tileCount = this.world.rows * this.world.cols;
    count = (count * tileCount) / 10000;

    for (let i = 0; i < count; i++) {
      this.world.fillCircle(
        randomIntInclusive(0, this.world.cols),
        randomIntInclusive(0, maxHeight),
        randomIntInclusive(minSize, maxSize),
        tile,
        mask,
      );
    }
  }

  /**
   * Returns the surface Y coordinate at the given X coordinate
   * @param {number} x - X coordinate to check
   * @returns {number} - Y coordinate of the first tile below the given x coordinate that is not AIR or WATER
   */
  _findSurfaceY(x) {
    for (let y = this.world.rows - 1; y >= 0; y--) {
      if (!this.world.checkTile(x, y, JSON.stringify(["AIR", "WATER"]))) return y;
    }
    return 0;
  }
}

if (typeof module === 'object') {
  module.exports = { Worldgen };
}