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
        console::log_1(&format!("hello we are getting this far").into());
        let tiles = vec![vec![String::from(" "); cols as usize]; rows as usize];
        World { rows, cols, tiles }
    }

    pub fn test_string(&self, s: &str) {
        console::log_1(&s.into());
    }

    pub fn set_tiles(&mut self, tiles_str: &str) {
        self.tiles = serde_json::from_str(tiles_str).unwrap();
    }

    pub fn get_tile(&self, x: i32, y: i32) -> String {
        self.tiles[y as usize][x as usize].clone()
    }

    pub fn legal(&self, x: i32, y: i32) -> bool {
        x >= 0 && y >= 0 && x < self.cols && y < self.rows
    }

    pub fn check_tile(&self, x: i32, y: i32, mask_json: &str) -> bool {
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
