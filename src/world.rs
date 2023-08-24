use std::cell::RefCell;
use std::rc::Rc;

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

        if self.age >= self.defs.rain_freq && self.age % self.defs.rain_freq <= self.defs.rain_time {
            let max_rain = Utils::random_int_inclusive(&1, &5);
            let rain_progress = self.age % self.defs.rain_freq;

            let rain_count = ((rain_progress.pow(2) as f64 / 10000.0)
                .min(max_rain as f64)
                .min((self.defs.rain_time - rain_progress).pow(2) as f64 / 10000.0)
                * self.cols as f64)
                / 100.0;


            self.do_rain(rain_count, &None);
        } 
        // Pests (never at the same time as rain)
        else if self.age >= self.defs.pest_start && self.age % self.defs.pest_freq == 0 {
            let random_value = rand::random::<f64>();
            self.do_rain(random_value, &Some(definitions::TileSet::PEST));       // Assuming do_rain accepts f64 and &str
        }
    }

    fn do_rain(&mut self, _count: f64, _tile: &Option<definitions::TileSet>) {
        println!("doRain")
    }

    fn get_tile(&self, x: i32, y: i32) -> definitions::TileSet {
        self.tiles[x as usize][y as usize]
    }

    pub fn set_tile(&mut self, _row: i32, _col: i32, _mask: Option<definitions::TileSet>) {
        println!("setTile")
    }

    pub fn check_tile(&self, x: i32, y: i32, mask: Option<&Vec<definitions::TileSet>>) -> bool {
        if !self.legal(x, y) {
            return false;
        }

        match mask {
            Some(mask_vec) => mask_vec.contains(&self.get_tile(x, y)),
            None => true,
        }
    }

    fn check_chunks(&self, _row: i32, _col: i32, _mask: definitions::TileSet, _distance: i32, _threshold: i32) {
        println!("checkChunks")
    }

    fn get_chunks(&self, _row: i32, _col: i32, _distance: i32) {
        println!("getChunks")
    }

    fn update_chunks(&self) {
        println!("updateChunks")
    }

    fn swap_tiles(&self, _row1: i32, _col1: i32, _row2: i32, _col2: i32, _mask: Option<definitions::TileSet>) {
        println!("swapTiles")
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

    fn legal(&self, x: i32, y: i32) -> bool {
        x > 0 && y >=0 && x < self.cols && y < self.rows
    }

    fn benchmark(&self) {
        println!("benchmark")
    }

    fn do_benchmark(&self) {
        println!("doBenchmark")
    }

}