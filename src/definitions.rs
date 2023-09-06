#[derive(Copy, Clone, PartialEq)]
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

#[derive(Clone)]
pub struct Chunk {
    pub air: i32,
    pub soil: i32,
    pub sand: i32,
    pub stone: i32,
    pub worker: i32,
    pub queen: i32,
    pub egg: i32,
    pub corpse: i32,
    pub plant: i32,
    pub water: i32,
    pub fungus: i32,
    pub pest: i32,
    pub trail: i32,
}

impl Chunk {
    pub fn get(&self, tile: &TileSet) -> i32 {
        match tile {
            TileSet::AIR => self.air,
            TileSet::SOIL => self.soil,
            TileSet::SAND => self.sand,
            TileSet::STONE => self.stone,
            TileSet::WORKER => self.worker,
            TileSet::QUEEN => self.queen,
            TileSet::EGG => self.egg,
            TileSet::CORPSE => self.corpse,
            TileSet::PLANT => self.plant,
            TileSet::WATER => self.water,
            TileSet::FUNGUS => self.fungus,
            TileSet::PEST => self.pest,
            TileSet::TRAIL => self.trail,
        }
    }
}

#[derive(Clone)]
pub struct Definitions {
    pub debug: bool,
    pub benchmark_ticks: i32,
    pub benchmark_batches: i32,
    pub benchmark_density: f64,
    pub tps: i32,
    pub start_paused: bool,
    pub row_count: i32,
    pub col_count: i32,
    pub chunk_size: i32,
    pub rain_freq: i32,
    pub rain_time: i32,
    pub pest_freq: i32,
    pub pest_start: i32,
    pub kill_prob: f64,
    pub evaporate_prob: f64,
    pub convert_prob: f64,
    pub grow_prob: f64,
    pub egg_lay_prob: f64,
    pub egg_hatch_prob: f64,
    pub egg_queen_prob: f64,
    pub queen_speed: f64,
    pub queen_range: i32,
    pub queen_fungus_min: i32,
    pub pest_seek_prob: f64,
    pub pest_range: i32,
    pub worker_range: i32,
    pub paintable_mask: [TileSet; 3],
    pub climb_mask: [TileSet; 7],
    pub walk_mask: [TileSet; 6],
    pub roam_mask: [TileSet; 4],
    pub plant_grow_mask: [TileSet; 4],
    pub pest_target_mask: [TileSet; 3],
    pub water_kill_mask: [TileSet; 4],
    pub push_mask: [TileSet; 2],
}

impl Definitions {
    pub fn new() -> Self {
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
