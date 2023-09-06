use std::cell::RefCell;
use std::rc::Rc;
use std::cmp;

use crate::utils::Utils;
use crate::definitions;
use crate::worldgen;

#[derive(Clone)]
pub struct World {
    pub rows: i32,
    pub cols: i32,
    pub age: i32,
    pub ants: i32,
    pub tiles: Vec<Vec<definitions::TileSet>>,
    pub surface_y: Option<i32>,
    pub worldgen: Option<worldgen::Worldgen>,
    pub defs: definitions::Definitions,
}

impl World {
    pub fn new(rows: i32, cols: i32) -> World {
        World {
            rows: rows,
            cols: cols,
            age: 0,
            ants: 0,
            tiles: Vec::<Vec<definitions::TileSet>>::new(),
            surface_y: None,
            worldgen: None,
            defs: definitions::Definitions::new(),
        }
    }

    pub fn init(&mut self) {
        let world_rc = Rc::new(RefCell::new(self.clone()));
        self.worldgen = Some(worldgen::Worldgen::new(world_rc));
    }

    pub fn tick(&mut self) {
        self.update_chunks();
        // self.worldlogic.tick(); // TODO implement this

        if 
            self.age >= self.defs.rain_freq && 
            self.age % self.defs.rain_freq <= self.defs.rain_time 
        {
            let max_rain = Utils::random_int_inclusive(&1, &5);
            let rain_progress = self.age % self.defs.rain_freq;

            let rain_count = ((rain_progress.pow(2) as f64 / 10000.0)
                .min(max_rain as f64)
                .min((self.defs.rain_time - rain_progress).pow(2) as f64 / 10000.0)
                * self.cols as f64)
                / 100.0;


            self.do_rain(rain_count, None);
        } 
        // Pests (never at the same time as rain)
        else if self.age >= self.defs.pest_start && self.age % self.defs.pest_freq == 0 {
            let random_value = rand::random::<f64>();
            self.do_rain(random_value, Some(&definitions::TileSet::PEST));       // Assuming do_rain accepts f64 and &str
        }
    }

    fn do_rain(&mut self, count: f64, def_tile: Option<&definitions::TileSet>) {
        let tile = match def_tile {
            Some(tile) => tile.clone(),
            None => definitions::TileSet::WATER,
        };

        let mut real_count = count.floor() as usize;
        if rand::random::<f64>() <= count % 1.0 {
            real_count += 1;
        }
        for _ in 0..real_count {
            let x = Utils::random_int_inclusive(&0, &self.cols);
            self.set_tile(
                &x, 
                &(self.rows - 1), 
                &tile, 
                Some(&vec![definitions::TileSet::AIR])
            );
        }
    }

    fn get_tile(&self, x: &i32, y: &i32) -> definitions::TileSet {
        self.tiles[*x as usize][*y as usize]
    }

    pub fn set_tile(
        &mut self, 
        x: &i32, 
        y: &i32, 
        tile: &definitions::TileSet, 
        mask: Option<&Vec<definitions::TileSet>>,
    ) -> bool {
        if !self.check_tile(x, y, mask) {
            false
        } else {
            self.tiles[*y as usize][*x as usize] = *tile;
            true
        }
    }

    pub fn check_tile(&self, x: &i32, y: &i32, mask: Option<&Vec<definitions::TileSet>>) -> bool {
        if !self.legal(x, y) {
            return false;
        }

        match mask {
            Some(mask_vec) => mask_vec.contains(&self.get_tile(x, y)),
            None => true,
        }
    }

    fn check_chunks(
        &self, 
        y: &i32, 
        x: &i32, 
        mask: &Vec<definitions::TileSet>, 
        def_distance: Option<&i32>, 
        def_threshold: Option<&i32>,
    ) -> bool {
        if !self.legal(x, y) {
            return false;
        }

        let distance = match def_distance {
            Some(distance) => def_distance.unwrap(),
            None => &0
        };

        let threshold = match def_threshold {
            Some(threshold) => def_threshold.unwrap(),
            None => &1
        };

        // original JS if !mask, is mask sometimes undefined? It never
        // appears to be. Assuming mask is always defined for now.
        if threshold == &0 {
            return true;
        }

        let chunks = self.get_chunks(x, y, distance);
        let mut total = 0;

        for chunk in &chunks {
            if let mask = mask {
                for tile in mask {
                    total += *chunk.get(tile).unwrap_or(&0);
                    if total > threshold {
                        return true;
                    }
                }
            }
        }

        false
    }

    fn get_chunks(&self, y: &i32, x: &i32, distance: &i32) {
        println!("getChunks");
        let cx_min = cmp::max(
            0,
            (((x - distance) / self.defs.chunk_size) as f64).floor() as i32
        );
        let cy_min = cmp::max(
            0, 
            (((y - distance) / self.defs.chunk_size) as f64).floor() as i32
        );
        let cx_max = cmp::min (
            self.chunks[0].len() - 1,
            (((x + distance) / self.defs.chunk_size) as f64).floor() as i32
        );
        let cy_max = cmp::min(
            self.chunks.len() - 1,
            (((y + distance) / self.defs.chunk_size) as f64).floor() as i32
        );
    }

    fn update_chunks(&self) {
        println!("updateChunks")
    }

    pub fn swap_tiles(&mut self, x: &i32, y: &i32, a: &i32, b: &i32, mask: Option<&Vec<definitions::TileSet>>) -> bool {
        if !self.check_tile(a, b, mask) {
            false
        } else {
            let t1 = self.get_tile(x, y);
            let t2 = self.get_tile(a, b);
            self.set_tile(a, b, &t1, None);
            self.set_tile(x, y, &t2, None);
            true
        }
    }

    fn for_each_tile(&self, _min_row: i32, _min_col: i32, _max_row: i32, _max_col: i32, _callback: fn(i32, i32))  {
        println!("forEachTile")
    }

    pub fn fill_circle(
        &self, 
        _center_x: &i32, 
        _center_y: &i32, 
        _radius: &i32, 
        _tile: &definitions::TileSet, 
        _mask: &Option<Vec<definitions::TileSet>>,
    ) {
        println!("fillCircle")
    }

    fn fill_rectangle(
        &self, 
        _min_x: i32, 
        _min_y: i32, 
        _max_x: i32, 
        _max_y: i32, 
        _tile: definitions::TileSet, 
        _mask: &Option<definitions::TileSet>,
    ) {
        println!("fillRectangle")
    }

    fn legal(&self, x: &i32, y: &i32) -> bool {
        x > &0 && y >= &0 && x < &self.cols && y < &self.rows
    }

    fn benchmark(&self) {
        println!("benchmark")
    }

    fn do_benchmark(&self) {
        println!("doBenchmark")
    }

}