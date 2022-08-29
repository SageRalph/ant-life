const ROW_COUNT = 100;
const COL_COUNT = 100;
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
  FUNGUS: "darkcyan",
};
const START_PAUSED = false;
const DEBUG = false;

const FPS = 30;
let FRAME_TIMER;
let WORLD;
let RENDERER;
let BRUSH_ON = false;
let BRUSH_X;
let BRUSH_Y;

$(document).ready(function () {
  init();
  setupControls();
  if (!START_PAUSED) {
    $("#btn-pause").trigger("click");
  }
});

function setupControls() {
  $("#btn-pause").on("click", function () {
    if (FRAME_TIMER) {
      clearTimeout(FRAME_TIMER);
      FRAME_TIMER = null;
      $(this).text("Play");
    } else {
      $(this).text("Pause");
      gameLoop();
    }
  });

  $("#btn-tick").on("click", function () {
    gameLoop(false);
  });

  $("#btn-reset").on("click", function () {
    init();
    if (START_PAUSED && FRAME_TIMER) {
      clearTimeout(FRAME_TIMER);
      FRAME_TIMER = null;
      $("#btn-pause").text("Play");
    }
  });

  $("#map").on("pointerdown", function (e) {
    _setPointerLocation(e);
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

function init() {
  console.log("Loading...");
  WORLD = new World(ROW_COUNT, COL_COUNT);
  RENDERER = new Renderer(document.getElementById("map"), WORLD, TILESET);
  RENDERER.draw();
  if (DEBUG) console.log(WORLD);
}

function gameLoop(loop = true) {
  const start = Date.now();

  doInput(false);
  WORLD.tick();
  RENDERER.draw();

  if (DEBUG) {
    const elapsed = Date.now() - start;
    console.log(`Tick ${WORLD.age} completed in ${elapsed}ms`);
  }

  const delayMS = Math.max(Math.round(start + 1000 / FPS) - Date.now(), 0);
  if (loop) {
    FRAME_TIMER = setTimeout(gameLoop, delayMS);
  }
}

function doInput(draw = true) {
  if (!BRUSH_ON) return;
  const brushSize = Math.round($("#brush-size").val());
  const brushMat = $("#brush-mat").val();
  WORLD.fillCircle(BRUSH_X, BRUSH_Y, brushSize, brushMat);
  if (draw) RENDERER.draw();
}
