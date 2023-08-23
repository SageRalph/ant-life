use crate::world::World;
use crate::utils::Utils;
use crate::definitions;
use std::rc::Rc;

struct Worldgen {
    world: Rc<World>,
}

impl Worldgen {
    pub fn new(world: World) -> Worldgen {
        Worldgen {
            world: world.into(),
        }
    }

    pub fn generate_benchmark_world(&self, mask: &[definitions::TileSet]) {
        self.world.tiles.clear();
        for _ in 0..self.world.rows {
            let mut row = Vec::new();
            for _ in 0..self.world.cols {
                let tile_index = Utils::random_int_inclusive(0, mask.len() as i32 - 1) as usize;
                let tile = mask[tile_index].clone();
                row.push(tile);
            }
            self.world.tiles.push(row);
        }
    }

    fn generate(
        &self, 
        sky_prop: f64, 
        starting_age: f64, 
        start_area_size: f64, 
        sand_count: f64, 
        sand_min_size: f64, 
        sand_max_size: f64, 
        stone_count: f64, 
        stone_min_size: f64, 
        stone_max_size: f64, 
        water_count: f64, 
        water_min_size: f64, 
        water_max_size: f64, 
        hollow_count: f64, 
        hollow_min_size: f64, 
        hollow_max_size: f64, 
        surface_plant_count: f64, 
        plant_count: f64, 
        fungus_count: f64, 
        fungus_min_size: f64, 
        fungus_max_size: f64, 
        noise_count: f64, 
        noise_min_size: f64, 
        noise_max_size: f64,
    ) {
        self.world.age = 0;
        let surface_y: f64 = self.world.rows as f64 * (1.0 - sky_prop).round();
        self.world.surface_y = Some(surface_y);
        let mid_x = (self.world.cols as f64 / 2.0).round() as i32;

        // sand
        self.generate_patches(
            sand_count,
            surface_y,
            sand_min_size,
            sand_max_size,
            "SAND",
            None,
        );

        // stone
        self.generate_patches(
            stone_count,
            surface_y,
            stone_min_size,
            stone_max_size,
            "STONE",
            None,
        );

        // water
        self.generate_patches(
            water_count,
            surface_y - water_max_size * 2 as f64,
            water_min_size,
            water_max_size,
            "WATER",
            None,
        );

        // air pockets 
        self.generate_patches(
            hollow_count,
            surface_y,
            hollow_min_size,
            hollow_max_size,
            "AIR",
            ["SOIL", "SAND", "STONE", "WATER"],
        );

        // fungus
        self.generate_patches(
            fungus_count,
            surface_y - fungus_max_size * 2 as f64,
            fungus_min_size,
            fungus_max_size,
            "FUNGUS",
            ["SOIL", "SAND"],
        );

        // Noise (to make shapes less obvious)
        self.generate_patches(
            noise_count,
            surface_y,
            noise_min_size,
            noise_max_size,
            "SOIL",
            ["SAND", "STONE", "WATER", "FUNGUS", "AIR", "PLANT"],
        );

        // underground plant
        self.generate_patches(
            plant_count,
            surface_y,
            1,
            1,
            "PLANT",
            ["WATER", "AIR"],
        );

        // surface plant
        let plant_prob = surface_plant_count as f64 / 100.0;
        for x in 0..self.world.cols {
            if rand::random::<f64>() <= plant_prob {
                let y = self._find_surface_y(x) + 1;
                self.world.set_tile(x, y, Some(definitions::TileSet::PLANT));
            }
        }

        for x in 0..self.world.cols {
            let radius = Utils::random_int_inclusive(1, 6);
            self.world.fill_circle(x, 0, radius, definitions::TileSet::STONE, None);
        }

        // Starting area
        let queen_to_ceil = self.world.rows - surface_y as i32 + 1;
        let half_start_area = (start_area_size / 2.0).round() as i32;

        for x in (mid_x - half_start_area)..(mid_x + half_start_area) {
            self.world.fill_circle(x, self.world.rows, queen_to_ceil, definitions::TileSet::AIR, None);
        }

        // TODO maybe these should just be i32s anyway
        self.world.fill_circle(
            mid_x as i32, 
            surface_y as i32, 
            start_area_size as i32, 
            definitions::TileSet::SOIL,
            Some(vec![definitions::TileSet::SAND, definitions::TileSet::STONE]),
        );

        // Guarantee an easy to reach fungus
        let random_x = Utils::random_int_inclusive(mid_x - half_start_area, mid_x + half_start_area);
        let random_y = Utils::random_int_inclusive(surface_y as i32 - start_area_size as i32, surface_y as i32);
        self.world.fill_circle(random_x, random_y, 4, definitions::TileSet::FUNGUS, None);

        // TODO starting age should definitely be an i32
        for _ in 0..starting_age as i32 {
            self.world.tick();
        }

        // Starting units
        self.world.set_tile(mid_x, surface_y, "QUEEN");

    }

    fn generate_patches(
        &self, 
        count: i32, 
        max_height: i32, 
        min_size: i32, 
        max_size: i32, 
        tile: definitions::TileSet, 
        mask: Option<Vec<definitions::TileSet>>,
    ) {
        println!("generatePatches")
    }

    fn find_surface_y(&self, x: i32) {
        println!("findSurfaceY")
    }

    pub fn _generate_patches(&mut self, count: i32, max_height: i32, min_size: i32, max_size: i32, tile: definitions::TileSet, mask: Option<Vec<definitions::TileSet>>) {
        let tile_count = self.world.rows * self.world.cols;
        let count = (count * tile_count) / 10_000;

        for _ in 0..count {
            let x = Utils::random_int_inclusive(0, self.world.cols);
            let y = Utils::random_int_inclusive(0, max_height); 
            let size = Utils::random_int_inclusive(min_size, max_size);
            self.world.fill_circle(x, y, size, tile, mask);
        }
    }

    pub fn _find_surface_y(&self, x: i32) -> i32 {
        for y in (0..=self.world.rows).rev() {
            if self.world.check_tile(x, y, !vec[definitions::TileSetAIR, definitions::TileSetWATER]) {
                return y;
            }
        }
        0
    }

}