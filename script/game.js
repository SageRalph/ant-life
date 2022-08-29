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
  FUNGUS: "cyan",
};

const FPS = 10;
let FRAME_TIMER;
let WORLD;
let RENDERER;

$(document).ready(function () {
  console.log("Loading...");
  WORLD = new World(ROW_COUNT, COL_COUNT);
  RENDERER = new Renderer(document.getElementById("map"), WORLD, TILESET);
  console.log(WORLD);
  setupControls();
  RENDERER.draw();
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
}

function gameLoop(loop = true) {
  const start = Date.now();

  WORLD.tick();
  RENDERER.draw();

  const elapsed = Date.now() - start;
  console.log("Frame time ms:", elapsed);
  const delayMS = Math.max(Math.round(start + 1000 / FPS) - Date.now(), 0);
  if (loop) {
    FRAME_TIMER = setTimeout(gameLoop, delayMS);
  }
}
