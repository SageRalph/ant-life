let DEBUG = false;

const START_PAUSED = false;

const TILESET = {
  AIR: "skyblue",
  SOIL: "peru",
  SAND: "sandybrown",
  STONE: "slategray",
  ANT: "red",
  QUEEN: "blueviolet",
  EGG: "white",
  CORPSE: "black",
  PLANT: "olivedrab",
  WATER: "blue",
  FUNGUS: "teal",
  PEST: "fuchsia",
};

const ROW_COUNT = 100;
const COL_COUNT = 100;
const RAIN_FREQ = 2500; // How often (in game ticks) it rains
const RAIN_TIME = 500; // How long (in game ticks) it rains for
const PEST_FREQ = 100; // How often (in game ticks) a pest enters the map
const PEST_START = 4000; // How long (in game ticks) before pests can spawn

const KILL_PROB = 0.01; // Chance per tick for each hazard to kill
const EVAPORATE_PROB = 0.01; // Chance per tick for water to evaporate
const CONVERT_PROB = 0.01; // Chance per tick for fungus/plant to convert
const GROW_PROB = 0.1; // Base chance per tick for a lone plant tile to grow (reduced by crowding)
const EGG_HATCH_PROB = 0.001; // Chance per tick for an egg to hatch
const EGG_QUEEN_PROB = 0.01; // Chance for a hatching egg to be a queen
const QUEEN_SPEED = 0.1; // The queen will only act this proportion of ticks
const QUEEN_RANGE = 20; // Search radius of queens
const PEST_RANGE = 20; // Search radius of pests

// Tiles ants can climb
const CLIMB_MASK = ["SOIL", "SAND", "STONE", "FUNGUS", "CORPSE", "ANT", "EGG"];

// Tiles ants can move through (also used by pests when hunting)
const WALK_MASK = ["AIR", "CORPSE", "EGG", "PLANT", "FUNGUS"];

// Tiles pests can move through when wandering
const ROAM_MASK = ["AIR", "CORPSE", "FUNGUS"];

// Tiles plants can grow into
const PLANT_GROW_MASK = ["AIR", "WATER", "CORPSE"];

// Tiles pests will seek to kill
const PEST_TARGET_MASK = ["EGG", "QUEEN", "ANT"];
