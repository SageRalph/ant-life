extern crate console_error_panic_hook;
use std::panic;
use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub struct World {
    rows: i32,
    cols: i32,
    // age: i32,
    // ants: i32,
    tiles: Vec<Vec<String>>, 
}

#[wasm_bindgen]
impl World {
    pub fn new(rows: i32, cols: i32) -> World {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        let tiles = vec![vec![String::from(" "); cols as usize]; rows as usize];
        World { rows, cols, tiles }
    }

    pub fn test_string(&self, s: &str) {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        console::log_1(&s.into());
    }

    pub fn set_tiles(&mut self, tiles_str: &str) {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        console::log_1(&tiles_str.into());
        let tiles: Result<Vec<Vec<String>>, _> = serde_json::from_str(tiles_str);
        match tiles {
            Ok(v) => {
                // do something with v
            },
            Err(e) => {
                // handle error here
                println!("Error parsing JSON: {}", e);
            }
        }
    }

    pub fn push_tile_row(&mut self, tile_row_str: &str) {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        let tile_row: Result<Vec<String>, _> = serde_json::from_str(tile_row_str);

        match tile_row {
            Ok(v) => {
                // do something with v
                self.tiles.push(v);
            },
            Err (e) => {
                println!("Error parsing JSON: {}", e);
            }
        }
    }

    pub fn get_tile(&self, x: i32, y: i32) -> String {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        self.tiles[y as usize][x as usize].clone()
    }

    pub fn legal(&self, x: i32, y: i32) -> bool {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        x >= 0 && y >= 0 && x < self.cols && y < self.rows
    }

    pub fn check_tile(&self, x: i32, y: i32, mask_json: &str) -> bool {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        if !self.legal(x, y) {
            return false;
        }
        let tile = self.get_tile(x, y);

        // Parse the mask JSON as a serde_json::Value
        let mask_value: serde_json::Value = serde_json::from_str(mask_json).unwrap();
        if mask_value.is_boolean() && !mask_value.as_bool().unwrap() {
            return true;
        }

        // if mask value is a JSON String, check if it's equal to the tile
        if mask_value.is_string() {
            if mask_value.as_str().unwrap() == tile {
                return true;
            }
        }

        // If the mask is a JSON Array, check if the tile is in the array
        if mask_value.is_array() {
            let mask: Vec<String> = mask_value.as_array().unwrap().iter()
                .map(|v| v.as_str().unwrap().to_string())
                .collect();

            if mask.contains(&tile.to_string()) {
                return true;
            }
        }

        false
    }
}
