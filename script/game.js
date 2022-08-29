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

const FPS = 10;
let FRAME_TIMER;
let WORLD;
let RENDERER;

$(document).ready(function () {
  init();
  setupControls();
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
    if (FRAME_TIMER) {
      clearTimeout(FRAME_TIMER);
      FRAME_TIMER = null;
      $("#btn-pause").text("Play");
    }
  });

  $("#map").on("click", function (e) {
    const rect = e.target.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const { x, y } = RENDERER.mapCoordinates(cx, cy);
    const brushSize = Math.round($("#brush-size").val());
    const brushMat = $("#brush-mat").val();
    WORLD.fillCircle(x, y, brushSize, brushMat);
    RENDERER.draw();
  });
}

function init() {
  console.log("Loading...");
  WORLD = new World(ROW_COUNT, COL_COUNT);
  RENDERER = new Renderer(document.getElementById("map"), WORLD, TILESET);
  RENDERER.draw();
  console.log(WORLD);
}

function gameLoop(loop = true) {
  const start = Date.now();

  WORLD.tick();
  RENDERER.draw();

  const elapsed = Date.now() - start;
  console.log("Tick Duration ms:", elapsed);
  const delayMS = Math.max(Math.round(start + 1000 / FPS) - Date.now(), 0);
  if (loop) {
    FRAME_TIMER = setTimeout(gameLoop, delayMS);
  }
}
