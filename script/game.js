let FRAME_TIMER;
let LAST_FRAME_TIME = performance.now();
let LAST_TICK_TIME = performance.now();
let FPS_TIME = 0;
let WORLD;
let RENDERER;
let BRUSH_ON = false;
let BRUSH_MASK = "AIR";
let BRUSH_X;
let BRUSH_Y;
let LAST_ANT_COUNT = 1;

$(document).ready(function () {
  init();
  setupControls();
  if (!START_PAUSED) {
    $("#btn-pause").trigger("click");
  }
});

/**
 * Benchmark simulation performance
 */
function benchmark() {
  return new World().benchmark();
}

/**
 * Pause the simulation
 */
function pause() {
  if (FRAME_TIMER) {
    cancelAnimationFrame(FRAME_TIMER);
    FRAME_TIMER = null;
  }
  $("#btn-pause").text("Play");
}

/**
 * Run the simulation
 */
function play() {
  $("#btn-pause").text("Pause");
  gameLoop();
}

/**
 * Run simulation for a single step
 */
function step() {
  gameLoop(false);
}

function setupControls() {
  $("#btn-pause").on("click", function () {
    if (FRAME_TIMER) {
      pause();
    } else {
      play();
    }
  });

  $("#btn-tick").on("click", function () {
    step();
  });

  $("#btn-reset").on("click", function () {
    init();
    if (START_PAUSED && FRAME_TIMER) {
      cancelAnimationFrame(FRAME_TIMER);
      FRAME_TIMER = null;
      $("#btn-pause").text("Play");
    }
  });

  $("#map").on("pointerdown", function (e) {
    _setPointerLocation(e);
    _setBrushMask();
    BRUSH_ON = true;
    doInput();
  });
  $("#map").on("pointermove", function (e) {
    _setPointerLocation(e);
    if (BRUSH_ON) doInput();
  });
  $("#map").on("pointerup pointercancel pointerout", function (e) {
    BRUSH_ON = false;
  });
}

function _setPointerLocation(e) {
  const { x, y } = RENDERER.mapCoordinates(e.clientX, e.clientY);
  BRUSH_X = x;
  BRUSH_Y = y;
}

function _setBrushMask() {
  // Starting brushing from outside the map will only paint over AIR
  if (
    BRUSH_X < 0 ||
    BRUSH_X >= WORLD.cols ||
    BRUSH_Y < 0 ||
    BRUSH_Y >= WORLD.rows
  ) {
    BRUSH_MASK = "AIR";
    return;
  }

  // Brush will only paint over tiles of the same type as the first tile clicked
  // If the first tile clicked is not paintable, the brush will only paint over AIR
  const tile = WORLD.getTile(BRUSH_X, BRUSH_Y);
  if (PAINTABLE_MASK.includes(tile)) {
    BRUSH_MASK = tile;
  } else {
    BRUSH_MASK = "AIR";
  }
}

function init() {
  if (DEBUG) console.log("Loading...");
  $("#score").text("");

  // WASM entrypoint
  WORLD = new World(); 

  // here renderer has constant access to world, when world is in wasm
  // this will have to be replaced with getters and setters
  RENDERER = new Renderer(document.getElementById("map"), WORLD, TILESET);
  RENDERER.draw();
  prompt(`
    Spring has arrived and plants are sprouting <br/>
    Guide your queen (purple) to fungus (teal) to begin your new colony
  `);
  if (DEBUG) console.log(WORLD);
}

function gameLoop(loop = true) {
  const start = performance.now();

  // world tick rate can be <= frame rate
  if (start - LAST_TICK_TIME >= 1000 / TPS) {
    LAST_TICK_TIME = start;
    WORLD.tick();

    if (DEBUG) {
      const elapsed = performance.now() - start;
      // TODO replace WORLD.age with WORLD.get_age()
      console.log(`Tick ${WORLD.age} completed in ${elapsed}ms`);
    }
  }

  doInput(false);
  RENDERER.draw();

  // TODO replace WORLD.ants with WORLD.get_ants()
  if (LAST_ANT_COUNT === 1 && WORLD.ants > 1) {
    prompt(`
      The first workers (red) have begun to hatch from eggs (white) <br/> 
      Grow more fungus (teal) by bringing it plant material (green)
    `);
  }

  // TODO replace WORLD.ants with WORLD.get_ants()
  if (WORLD.ants > 1) {
    $("#score").text(WORLD.ants);
  }
  LAST_ANT_COUNT = WORLD.ants;

  // TODO replace WORLD.age with WORLD.get_age()
  if (WORLD.age === RAIN_FREQ - 500) {
    prompt(`
      The spring rains will start soon, prepare for the flood! <br/>
      Water (blue) kills workers (red), queens (purple), and eggs (white)
    `);
  } else if (WORLD.age === RAIN_FREQ + RAIN_TIME) {
    prompt(`
    The rains have stopped for now, but will return regularly <br/>
    Water (blue) evaporates in the sun and is absorbed by plants (green)
  `);
  } else if (WORLD.age === PEST_START - 500) {
    prompt(`
    Pests (pink) will soon be attracted by the new growth <br/>
    Pests will hunt for eggs (white) but workers (red) will fight back
  `);
  } else if (WORLD.age === PEST_START + 500) {
    prompt(`
    Stay on guard for more pests and rainfall <br/>
    Protect the queen and grow the colony by farming fungus
  `);
  }

  if (loop) {
    // Calculate FPS
    const thisFrameTime = (thisLoop = performance.now()) - LAST_FRAME_TIME;
    FPS_TIME += (thisFrameTime - FPS_TIME) / 20;
    LAST_FRAME_TIME = thisLoop;
    $("#fps").text(`${Math.round(1000 / FPS_TIME)} FPS`);

    // Request every v-blank
    FRAME_TIMER = requestAnimationFrame(gameLoop);
  }
}

function doInput(draw = true) {
  if (!BRUSH_ON) return;
  if (
    BRUSH_X < 0 ||
    BRUSH_X >= WORLD.cols ||
    BRUSH_Y < 0 ||
    BRUSH_Y >= WORLD.rows
  ) {
    return;
  }
  const brushSize = Math.round($("#brush-size").val());
  const brushMat = $("#brush-mat").val();
  
  // TODO ensure this is serialised 
  WORLD.fillCircle(BRUSH_X, BRUSH_Y, brushSize, brushMat, BRUSH_MASK);
  if (draw) RENDERER.draw();
}

function prompt(text) {
  $("#info").html(text);
  $("#info").addClass("alert");
  setTimeout(function () {
    $("#info").removeClass("alert");
  }, 1000);
}
