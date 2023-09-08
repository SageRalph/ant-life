use crate::world::World;
use crate::utils::Utils;
use crate::definitions;
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Clone)]
pub struct Worldgen {
    world: Rc<RefCell<World>>,
}

impl Worldgen {
    pub fn new(world: Rc<RefCell<World>>) -> Worldgen {
        Worldgen {
            world
        }
    }

    pub fn generate_benchmark_world(&self, mask: &[definitions::TileSet]) {
        self.world.borrow_mut().tiles.clear();
        for _ in 0..self.world.borrow().rows {
            let mut row = Vec::new();
            for _ in 0..self.world.borrow().cols {
                let tile_index = Utils::random_int_inclusive(&0, &(mask.len() as i32 - 1)) as usize;
                let tile = mask[tile_index].clone();
                row.push(tile);
            }
            self.world.borrow_mut().tiles.push(row);
        }
    }

    fn generate(
        &mut self, 
        sky_prop: i32,
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
        noise_max_size: i32,
    ) {
        self.world.borrow_mut().age = 0;
        let surface_y: i32 = (self.world.borrow().rows as f64 * (1.0 - sky_prop as f64).round()) as i32;
        self.world.borrow_mut().surface_y = Some(surface_y);
        let mid_x = (self.world.borrow().cols as f64 / 2.0).round() as i32;

        // sand
        self.generate_patches(
            &sand_count,
            &surface_y,
            &sand_min_size,
            &sand_max_size,
            &definitions::TileSet::SAND,
            &None,
        );

        // stone
        self.generate_patches(
            &stone_count,
            &surface_y,
            &stone_min_size,
            &stone_max_size,
            &definitions::TileSet::STONE,
            &None,
        );

        // water
        self.generate_patches(
            &water_count,//     let _worldgen = worldgen::Worldgen::new(world.clone());
            &(surface_y - water_max_size * 2),
            &water_min_size,
            &water_max_size,
            &definitions::TileSet::WATER,
            &None,
        );

        // air pockets 
        self.generate_patches(
            &hollow_count,
            &surface_y,
            &hollow_min_size,
            &hollow_max_size,
            &definitions::TileSet::AIR,
            &Some(
                vec![
                    definitions::TileSet::SOIL, 
                    definitions::TileSet::SAND, 
                    definitions::TileSet::STONE, 
                    definitions::TileSet::WATER,
                ],
            ),
        );

        // fungus
        self.generate_patches(
            &fungus_count,
            &(surface_y - water_max_size * 2),
            &fungus_min_size,
            &fungus_max_size,
            &definitions::TileSet::FUNGUS,
            &Some(vec![definitions::TileSet::SOIL, definitions::TileSet::SAND]),
        );

        // Noise (to make shapes less obvious)
        self.generate_patches(
            &noise_count,
            &surface_y,
            &noise_min_size,
            &noise_max_size,
            &definitions::TileSet::SOIL,
            &Some(
                vec![
                    definitions::TileSet::SAND, 
                    definitions::TileSet::STONE, 
                    definitions::TileSet::WATER, 
                    definitions::TileSet::FUNGUS, 
                    definitions::TileSet::AIR, 
                    definitions::TileSet::PLANT,
                ],
            ),
        );

        // underground plant
        self.generate_patches(
            &plant_count,
            &surface_y,
            &1,
            &1,
            &definitions::TileSet::PLANT,
            &Some(
                vec![
                    definitions::TileSet::WATER, 
                    definitions::TileSet::AIR,
                ],
            ),
        );

        // surface plant
        let plant_prob = surface_plant_count as f64 / 100.0;
        for x in 0..self.world.borrow_mut().cols {
            if rand::random::<f64>() <= plant_prob {
                let y = self.find_surface_y(x) + 1;
                self.world.borrow_mut().set_tile(
                    &x, 
                    &y, 
                    &definitions::TileSet::PLANT, 
                    None
                );
            }
        }

        for x in 0..self.world.borrow_mut().cols {
            let radius = Utils::random_int_inclusive(&1, &6);
            self.world.borrow_mut().fill_circle(
                &x, 
                &0, 
                &radius,
                &definitions::TileSet::STONE, 
                &None
            );
        }

        // Starting area
        let queen_to_ceil = self.world.borrow_mut().rows - surface_y as i32 + 1;
        let half_start_area = (start_area_size as f64 / 2.0).round() as i32;

        for x in (mid_x - half_start_area)..(mid_x + half_start_area) {
            self.world.borrow().fill_circle(
                &x, 
                &self.world.borrow().rows, 
                &queen_to_ceil, 
                &definitions::TileSet::AIR, 
                &None,
            );
        }

        // TODO maybe these should just be i32s anyway
        self.world.borrow().fill_circle(
            &mid_x, 
            &surface_y, 
            &start_area_size, 
            &definitions::TileSet::SOIL,
            &Some(vec![definitions::TileSet::SAND, definitions::TileSet::STONE]),
        );

        // Guarantee an easy to reach fungus
        let random_x = Utils::random_int_inclusive(
            &(mid_x - half_start_area),
            &(mid_x + half_start_area),
        );
        let random_y = Utils::random_int_inclusive(
            &(surface_y - start_area_size),
            &surface_y,
        );
        self.world.borrow().fill_circle(
            &random_x, 
            &random_y, 
            &4, 
            &definitions::TileSet::FUNGUS, 
            &None
        );

        // TODO starting age should definitely be an i32
        for _ in 0..starting_age as i32 {
            self.world.borrow_mut().tick();
        }

        // Starting units
        self.world.borrow_mut().set_tile(
            &mid_x, 
            &(surface_y as i32), 
            &definitions::TileSet::QUEEN,
            None,
        );

    }

    pub fn generate_patches(
        &mut self, 
        count: &i32, 
        max_height: &i32, 
        min_size: &i32, 
        max_size: &i32, 
        tile: &definitions::TileSet, 
        mask: &Option<Vec<definitions::TileSet>>,
    ) {
        let tile_count = self.world.borrow().rows * self.world.borrow().cols;
        let count = (count * tile_count) / 10_000;

        for _ in 0..count {
            let x = Utils::random_int_inclusive(&0, &self.world.borrow().cols);
            let y = Utils::random_int_inclusive(&0, &max_height); 
            let size = Utils::random_int_inclusive(&min_size, &max_size);
            self.world.borrow().fill_circle(&x, &y, &size, tile, mask);
        }
    }

    pub fn find_surface_y(&self, x: i32) -> i32 {
        for y in (0..=self.world.borrow().rows).rev() {
            if self.world.borrow().check_tile(&x, &y, Some(&vec![definitions::TileSet::AIR, definitions::TileSet::WATER])) {
                return y;
            }
        }
        0
    }
}
