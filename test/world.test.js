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
    beforeEach(async () => {
      world = new World();
      await world.initialize();
      console.log(world);
    });

  describe('_legal', () => {
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

  describe('checkTile', () => {
      it('should return false if coordinates are not legal', () => {
        world._legal = jest.fn().mockReturnValue(false);
        expect(world.checkTile(1, 1, [])).toBe(false);
      });

      it('should return true if coordinates are legal and mask is not provided', () => {
        world._legal = jest.fn().mockReturnValue(true);
        expect(world.checkTile(1, 1)).toBe(true);
      });

      it('should return true if coordinates are legal and tile is in the mask', () => {
        const tile = 'tile1';
        world._legal = jest.fn().mockReturnValue(true);
        world.getTile = jest.fn().mockReturnValue(tile);
        expect(world.checkTile(1, 1, [tile])).toBe(true);
      });

      it('should return false if coordinates are legal but tile is not in the mask', () => {
        const tile = 'tile1';
        const differentTile = 'tile2';
        world._legal = jest.fn().mockReturnValue(true);
        world.getTile = jest.fn().mockReturnValue(differentTile);
        expect(world.checkTile(1, 1, [tile])).toBe(false);
      });
    });
  });
});
