class Worldgen {
  constructor(world) {
    this.world = world;
  }

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
    plantCount = 300,
    fungusCount = 30,
    fungusMinSize = 1,
    fungusMaxSize = 4,
    noiseCount = 200,
    noiseMinSize = 4,
    noiseMaxSize = 6,
  }) {
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

    // Underground Plant
    this._generatePatches(plantCount, surfaceY, 1, 1, "PLANT", [
      "WATER",
      "AIR",
    ]);

    // Surface Plant
    this.world.doRain(this.world.cols / 3, "PLANT");

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
}
