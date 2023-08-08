let DEBUG = false; // Show debug info in the console
let BENCHMARK_TICKS = 100; // Number of simulation steps to run the benchmark for
let BENCHMARK_BATCHES = 10; // Benchmarks are averaged over this many runs
let BENCHMARK_DENSITY = 0.05; // Proportion of tiles that are not air in benchmark worlds, this ensures tiles can move around

const TPS = 30;
const START_PAUSED = true;

const TILESET = {
  AIR: "skyblue",
  SOIL: "peru",
  SAND: "sandybrown",
  STONE: "slategray",
  WORKER: "red",
  QUEEN: "blueviolet",
  EGG: "white",
  CORPSE: "black",
  PLANT: "olivedrab",
  WATER: "blue",
  FUNGUS: "teal",
  PEST: "fuchsia",
  TRAIL: "yellow",
};

// Tiles that can be overridden with the brush
const PAINTABLE_MASK = ["AIR", "SOIL", "SAND"];

const RAIN_FREQ = 2500; // How often (in game ticks) it rains
const RAIN_TIME = 500; // How long (in game ticks) it rains for
const PEST_FREQ = 100; // How often (in game ticks) a pest enters the map
const PEST_START = 4000; // How long (in game ticks) before pests can spawn

// These are modifiable during run-time using the browser console but only take effect after the game is reset
let ROW_COUNT = 100; // World height
let COL_COUNT = 100; // World width

// These are modifiable during run-time using the browser console and take effect immediately
let CHUNK_SIZE = 20; // Optimisation for faster searching, must be factor of ROW_COUNT and COL_COUNT
let KILL_PROB = 0.01; // Chance per tick for each hazard to kill
let EVAPORATE_PROB = 0.008; // Chance per tick for water to evaporate
let CONVERT_PROB = 0.03; // Chance per tick for fungus/plant to convert
let GROW_PROB = 0.1; // Base chance per tick for a lone plant tile to grow (reduced by crowding)
let EGG_LAY_PROB = 0.5; // Chance that an egg is laid when a queen eats fungus
let EGG_HATCH_PROB = 0.005; // Chance per tick for an egg to hatch
let EGG_QUEEN_PROB = 0.01; // Chance for a hatching egg to be a queen
let QUEEN_SPEED = 0.1; // The queen will only act this proportion of ticks
let QUEEN_RANGE = 20; // Search radius of queens
let QUEEN_FUNGUS_MIN = 8; // Minimum fungus tiles in range for queen to feed
let PEST_SEEK_PROB = 0.2; // Chance per tick for a pest to seek a target
let PEST_RANGE = 20; // Search radius of pests
let WORKER_RANGE = 15; // Search radius of workers

// Tiles ants can climb
const CLIMB_MASK = [
  "SOIL",
  "SAND",
  "STONE",
  "FUNGUS",
  "CORPSE",
  "WORKER",
  "EGG",
];

// Tiles ants can move through (also used by pests when hunting)
const WALK_MASK = ["AIR", "CORPSE", "EGG", "PLANT", "FUNGUS", "TRAIL"];

// Tiles pests can move through when wandering
const ROAM_MASK = ["AIR", "CORPSE", "FUNGUS", "TRAIL"];

// Tiles plants can grow into
const PLANT_GROW_MASK = ["AIR", "WATER", "CORPSE", "TRAIL"];

// Tiles pests will seek to kill
const PEST_TARGET_MASK = ["EGG", "QUEEN", "WORKER"];

// Tiles water will kill
const WATER_KILL_MASK = ["WORKER", "QUEEN", "EGG", "PEST"];

// Tiles workers can push when they move
const PUSH_MASK = ["PLANT", "CORPSE"];

// module exports all variables
if (typeof module === 'object') {
  module.exports = {
    DEBUG,
    BENCHMARK_TICKS,
    BENCHMARK_BATCHES,
    BENCHMARK_DENSITY,
    TPS,
    START_PAUSED,
    TILESET,
    PAINTABLE_MASK,
    ROW_COUNT,
    COL_COUNT,
    CHUNK_SIZE,
    RAIN_FREQ,
    RAIN_TIME,
    PEST_FREQ,
    PEST_START,
    KILL_PROB,
    EVAPORATE_PROB,
    CONVERT_PROB,
    GROW_PROB,
    EGG_LAY_PROB,
    EGG_HATCH_PROB,
    EGG_QUEEN_PROB,
    QUEEN_SPEED,
    QUEEN_RANGE,
    QUEEN_FUNGUS_MIN,
    PEST_SEEK_PROB,
    PEST_RANGE,
    WORKER_RANGE,
    CLIMB_MASK,
    WALK_MASK,
    ROAM_MASK,
    PLANT_GROW_MASK,
    PEST_TARGET_MASK,
    WATER_KILL_MASK,
    PUSH_MASK
  };
}