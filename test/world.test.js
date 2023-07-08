const World = require('../script/world.js').World;
const Worldgen = require('../script/worldgen.js').Worldgen;
const Worldlogic = require('../script/worldlogic.js').Worldlogic;
const lib = require('../script/lib.js');
const definitions = require('../script/definitions.js');

global.Worldgen = Worldgen;
global.Worldlogic = Worldlogic;
global.randomIntInclusive = lib.randomIntInclusive;
global.pointWithinRadius = lib.pointWithinRadius;
global.CHUNK_SIZE = definitions.CHUNK_SIZE;
global.TILESET = definitions.TILESET;
global.randomSign = lib.randomSign;
global.KILL_PROB = definitions.KILL_PROB;
global.GROW_PROB = definitions.GROW_PROB;
global.EVAPORATE_PROB = definitions.EVAPORATE_PROB;
global.CONVERT_PROB = definitions.CONVERT_PROB;
global.WATER_KILL_MASK = definitions.WATER_KILL_MASK;
global.PLANT_GROW_MASK = definitions.PLANT_GROW_MASK;
global.RAIN_FREQ = definitions.RAIN_FREQ;
global.PEST_START = definitions.PEST_START;
global.ROW_COUNT = definitions.ROW_COUNT;
global.COL_COUNT = definitions.COL_COUNT;

describe('World', () => {
  describe('_legal', () => {
    let world;
    beforeEach(() => {
      world = new World();
    });

    it('returns true for valid coordinates within the world', () => {
      expect(world._legal(3, 4)).toBeTruthy();
      expect(world._legal(0, 0)).toBeTruthy();
      expect(world._legal(4, 4)).toBeTruthy();
    });

    it('returns false for negative coordinates', () => {
      expect(world._legal(-1, 3)).toBeFalsy();
      expect(world._legal(3, -1)).toBeFalsy();
      expect(world._legal(-1, -1)).toBeFalsy();
    });

    it('returns false for coordinates outside of the world', () => {
      expect(world._legal(COL_COUNT + 10, ROW_COUNT + 10)).toBeFalsy();
      expect(world._legal(COL_COUNT + 103, ROW_COUNT + 105)).toBeFalsy();
    });

    it('returns true for floating point coordinates', () => {
      expect(world._legal(1.5, 3)).toBeTruthy();
      expect(world._legal(3, 1.5)).toBeTruthy();
    });
  });
});