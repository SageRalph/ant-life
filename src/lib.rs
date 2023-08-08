extern crate console_error_panic_hook;
use rand::Rng;
use std::panic;
use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub struct World {
    rows: i32,
    cols: i32,
    age: i32,
    ants: i32,
    tiles: Vec<Vec<String>>,
}

#[wasm_bindgen]
impl World {
    // constructor
    #[wasm_bindgen(constructor)]
    pub fn constructor(rows: i32, cols: i32, age: i32, ants: i32) -> Self {
        panic::set_hook(Box::new(console_error_panic_hook::hook));

        let tiles = vec![vec![String::from(""); cols as usize]; rows as usize];
        console::log_1(&format!("WASM World constructor fired").into());
        World {
            rows,
            cols,
            age,
            ants,
            tiles,
        }
    }

    // getters & setters
    pub fn set_rows(&mut self, num: i32) -> Result<(), String> {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        match num {
            n if n > 0 => Ok(self.rows = n),
            _ => Err(format!("Number of rows must be positive integer")),
        }
    }

    pub fn get_rows(&self) -> i32 {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        self.rows
    }

    pub fn set_cols(&mut self, num: i32) -> Result<(), String> {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        match num {
            n if n > 0 => Ok(self.cols = n),
            _ => Err(format!("Number of columns must be positive integer")),
        }
    }

    pub fn get_cols(&self) -> i32 {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        self.cols
    }

    pub fn set_age(&mut self, num: i32) -> Result<(), String> {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        match num {
            n if n >= 0 => Ok(self.age = num),
            e => {
                web_sys::console::error_1(&e.into());
                Err(e.to_string())
            }
        }
    }

    pub fn get_age(&self) -> i32 {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        self.age
    }

    pub fn set_ants(&mut self, num: i32) -> Result<(), String> {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        match num {
            n if n >= 0 => Ok(self.ants = num),
            e => {
                web_sys::console::error_1(&e.into());
                Err(e.to_string())
            } 
        }
    }

    pub fn get_ants(&self) -> i32 {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        self.ants
    }

    pub fn set_tiles(&mut self, tiles_str: &str) -> Result<(), String> {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        let tiles: Result<Vec<Vec<String>>, _> = serde_json::from_str(tiles_str);
        match tiles {
            Ok(v) => Ok(self.tiles = v),
            Err(e) => Err(format!("Error parsing JSON: {}", e)),
        }
    }

    pub fn set_tile(&mut self, x: i32, y: i32, tile: &str, mask_str: Option<String>) -> bool {
        if !self.legal(x, y) {
            return false;
        }

        if let Some(mask) = &mask_str {
            if !self.check_tile(x, y, Some(mask.clone())) {
                return false;
            }
        } else {
            if !self.check_tile(x, y, None) {
                return false;
            }
        }
        
        self.tiles[y as usize][x as usize] = tile.to_string();
        true
    }

    pub fn get_tiles(&self) -> Result<String, String> {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        let tiles_str: Result<String, _> = serde_json::to_string(&self.tiles);
        match tiles_str {
            Ok(v) => Ok(v),
            Err(e) => Err(format!("Error parsing JSON: {}", e)),
        }
    }

    pub fn get_tile(&self, x: i32, y:i32) -> Result<String, String> {
        panic::set_hook(Box::new(console_error_panic_hook::hook));

        if !self.legal(x, y) {
            return Err(format!("Coordinates x: {}, y: {} are out of bounds.", x, y));
        }

        let tile_str: Result<String, _> = serde_json::to_string(&self.tiles[y as usize][x as usize]);
        match tile_str {
            Ok(v) => Ok(v),
            Err(e) => Err(format!("Error parsing JSON: {}", e)),
        }
    }

    // functions
    pub fn do_rain(&mut self, count: f64, tile: Option<String>) {
        let tile = tile.unwrap_or("WATER".to_string());
        
        let mut real_count = count.floor() as i32;
        
        let mut rng = rand::thread_rng();
        if rng.gen::<f64>() <= count {
            real_count += 1;
        }

        for _ in 0..real_count {
            let x = rng.gen_range(0..self.cols);
            self.set_tile(x, self.rows - 1, &tile, Some(String::from("AIR")));
        }
    }

    pub fn legal(&self, x: i32, y: i32) -> bool {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        x >= 0 && y >= 0 && x < self.cols && y < self.rows
    }

    pub fn check_tile(&self, x: i32, y: i32, mask_str: Option<String>) -> bool {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        match mask_str {
            Some(mask_json) => {
                let mask: Result<Vec<String>, _> = serde_json::from_str(&mask_json);
                match mask {
                    Ok(m) => m.contains(&self.get_tile(x, y).unwrap()),
                    Err(_) => false, // If the JSON is invalid, we return false. Adapt this as needed.
                }
            }
            None => true,
        }
    }
}