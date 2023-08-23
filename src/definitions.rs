#[derive(Copy, Clone)]
pub enum TileSet {
    AIR,
    SOIL,
    SAND,
    STONE,
    WORKER,
    QUEEN,
    EGG,
    CORPSE,
    PLANT,
    WATER,
    FUNGUS,
    PEST,
    TRAIL,
}

impl TileSet {
    fn color(&self) -> &'static str {
        match self {
            TileSet::AIR => "skyblue",
            TileSet::SOIL => "peru",
            TileSet::SAND => "sandybrown",
            TileSet::STONE => "slategray",
            TileSet::WORKER => "red",
            TileSet::QUEEN => "blueviolet",
            TileSet::EGG => "white",
            TileSet::CORPSE => "black",
            TileSet::PLANT => "olivedrab",
            TileSet::WATER => "blue",
            TileSet::FUNGUS => "teal",
            TileSet::PEST => "fuchsia",
            TileSet::TRAIL => "yellow",
        }
    }
}

struct Definitions {
    debug: bool,
    benchmark_ticks: i32,
    benchmark_batches: i32,
    benchmark_density: f64,
    tps: i32,
    start_paused: bool,
    row_count: i32,
    col_count: i32,
    chunk_size: i32,
    rain_freq: i32,
    rain_time: i32,
    pest_freq: i32,
    pest_start: i32,
    kill_prob: f64,
    evaporate_prob: f64,
    convert_prob: f64,
    grow_prob: f64,
    egg_lay_prob: f64,
    egg_hatch_prob: f64,
    egg_queen_prob: f64,
    queen_speed: f64,
    queen_range: i32,
    queen_fungus_min: i32,
    pest_seek_prob: f64,
    pest_range: i32,
    worker_range: i32,
    paintable_mask: [TileSet; 3],
    climb_mask: [TileSet; 7],
    walk_mask: [TileSet; 6],
    roam_mask: [TileSet; 4],
    plant_grow_mask: [TileSet; 4],
    pest_target_mask: [TileSet; 3],
    water_kill_mask: [TileSet; 4],
    push_mask: [TileSet; 2],
}

impl Definitions {
    fn new() -> Self {
        Definitions {
            debug: true,
            benchmark_ticks: 100,
            benchmark_batches: 10,
            benchmark_density: 0.05,
            tps: 30,
            start_paused: true,
            row_count: 100,
            col_count: 100,
            chunk_size: 20,
            rain_freq: 2500,
            rain_time: 500,
            pest_freq: 100,
            pest_start: 4000,
            kill_prob: 0.01,
            evaporate_prob: 0.008,
            convert_prob: 0.03,
            grow_prob: 0.1,
            egg_lay_prob: 0.5,
            egg_hatch_prob: 0.005,
            egg_queen_prob: 0.01,
            queen_speed: 0.1,
            queen_range: 20,
            queen_fungus_min: 8,
            pest_seek_prob: 0.2,
            pest_range: 20,
            worker_range: 15,
            paintable_mask: [TileSet::AIR, TileSet::SOIL, TileSet::SAND],
            climb_mask: [
                TileSet::SOIL,
                TileSet::SAND,
                TileSet::STONE,
                TileSet::FUNGUS,
                TileSet::CORPSE,
                TileSet::WORKER,
                TileSet::EGG,
            ],
            walk_mask: [
                TileSet::AIR,
                TileSet::CORPSE,
                TileSet::EGG,
                TileSet::PLANT,
                TileSet::FUNGUS,
                TileSet::TRAIL,
            ],
            roam_mask: [TileSet::AIR, TileSet::CORPSE, TileSet::FUNGUS, TileSet::TRAIL],
            plant_grow_mask: [
                TileSet::AIR,
                TileSet::WATER,
                TileSet::CORPSE,
                TileSet::TRAIL,
            ],
            pest_target_mask: [TileSet::EGG, TileSet::QUEEN, TileSet::WORKER],
            water_kill_mask: [
                TileSet::WORKER,
                TileSet::QUEEN,
                TileSet::EGG,
                TileSet::PEST,
            ],
            push_mask: [TileSet::PLANT, TileSet::CORPSE],
        }
    }
}
