use crate::world::World;
use crate::utils;
use crate::definitions;

struct Worldgen;

impl Worldgen {
    fn generate_benchmark_world(world: &World, mask: definitions::TileSet) {
        world.tiles.clear();
        for _ in 0..world.rows {
            let mut row = Vec::new();
            for _ in 0..world.cols {
                let tile_index = utils::random_int_inclusive(0, mask.len() as i32 - 1) as usize;
                let tile = mask[tile_index];
                row.push(tile);
            }
            world.tiles.push(row);
        }
    }

    fn generate(
        &self, 
        sky_prop: f64, 
        starting_age: i32, 
        start_area_size: i32, 
        sand_count: i32, 
        sand_min_size: i32, 
        sand_max_size: i32, 
        stone_count: i32, 
        stone_min_size: i32, 
        stone_max_size: i32, 
        water_count: i32, 
        water_min_size: i32, 
        water_max_size: i32, 
        hollow_count: i32, 
        hollow_min_size: i32, 
        hollow_max_size: i32, 
        surface_plant_count: i32, 
        plant_count: i32, 
        fungus_count: i32, 
        fungus_min_size: i32, 
        fungus_max_size: i32, 
        noise_count: i32, 
        noise_min_size: i32, 
        noise_max_size: i32
    ) {
        println!("generate");

        // sand
        self.generate_patches(
            sand_count,
            surface_y,
            sand_min_size,
            sand_max_size,
            "SAND",
        );

        // stone
        self.generate_patches(
            stone_count,
            surface_y,
            stone_min_size,
            stone_max_size,
            "STONE",
        );

        // water
        self.generate_patches(
            water_count,
            surface_y - water_max_size * 2,
            water_min_size,
            water_max_size,
            "WATER",
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
            surface_y - fungus_max_size * 2,
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
                World::set_tile(x, y, "PLANT");
            }
        }

        for x in 0..self.world.cols() {
            let radius = rand::thread_rng().gen_range(1..=6);
            self.world.fill_circle(x, 0, radius, "STONE");
        }

        // Starting area
        let queen_to_ceil = World::rows - surface_y + 1;
        let half_start_area = (start_area_size / 2.0).round() as i32;

        for x in (mid_x - half_start_area)..(mid_x + half_start_area) {
            World::fill_circle(x, World::rows, queen_to_ceil, "AIR");
        }
        World::fill_circle(mid_x, surface_y, start_area_size, "SOIL", &["SAND", "STONE"]);

        // Guarantee an easy to reach fungus
        let random_x = rand::thread_rng().gen_range(mid_x - half_start_area..=mid_x + half_start_area);
        let random_y = rand::thread_rng().gen_range(surface_y - start_area_size..=surface_y);
        World::fill_circle(random_x, random_y, 4, "FUNGUS");

        for _ in 0..starting_age {
            World::tick();
        }

        // Starting units
        World::set_tile(mid_x, surface_y, "QUEEN");

    }

    fn generate_patches(
        &self, 
        count: i32, 
        max_height: i32, 
        min_size: i32, 
        max_size: i32, 
        tile: TileSet, 
        mask: Option<TileSet>
    ) {
        println!("generatePatches")
    }

    fn find_surface_y(&self, x: i32) {
        println!("findSurfaceY")
    }

    pub fn _generate_patches(&mut self, count: i32, max_height: i32, min_size: i32, max_size: i32, tile: &str, mask: &[&str]) {
        let tile_count = self.world.rows() * self.world.cols();
        let count = (count * tile_count) / 10_000;

        for _ in 0..count {
            let x = rand::thread_rng().gen_range(0..self.world.cols());
            let y = rand::thread_rng().gen_range(0..max_height);
            let size = rand::thread_rng().gen_range(min_size..=max_size);
            self.world.fill_circle(x, y, size, tile, mask);
        }
    }

    pub fn _find_surface_y(&self, x: i32) -> i32 {
        for y in (0..=self.world.rows()).rev() {
            if !self.world.check_tile(x, y, &["AIR", "WATER"]) {
                return y;
            }
        }
        0
    }

}