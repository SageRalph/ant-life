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
    // sanity checker
    pub fn print(&self, s: String) {
        console::log_1(&format!("{}", s).into());
    }

    // constructor
    #[wasm_bindgen(constructor)]
    pub fn constructor(rows: i32, cols: i32, age: i32, ants: i32) -> Self {
        console::log_1(&format!("constructor fired").into());
        World {
            rows: rows, // todo get values from js
            cols: cols,  
            age: age,
            ants: ants,
            tiles: vec![vec![String::from(""); cols as usize]; rows as usize],
        }
    }

    // getters & setters
    pub fn set_rows(&mut self, num: i32) -> Result<(), String> {
        match num {
            n if n > 0 => Ok(self.rows = n),
            _ => Err(format!("Number of rows must be positive integer")),
        }
    }

    pub fn get_rows(&self) -> i32 {
        self.rows
    }

    pub fn set_cols(&mut self, num: i32) -> Result<(), String> {
        match num {
            n if n > 0 => Ok(self.cols = n),
            _ => Err(format!("Number of columns must be positive integer")),
        }
    }

    pub fn get_cols(&self) -> i32 {
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
        let tile_str: Result<String, _> = serde_json::to_string(&self.tiles[y as usize][x as usize]);
        match tile_str {
            Ok(v) => Ok(v),
            Err(e) => Err(format!("Error parsing JSON: {}", e)),
        }
    }

//   getTile(x, y) {
//     return this.tiles[y][x];
//   }

    // functions
    pub fn legal(rows: i32, cols: i32, x: i32, y: i32) -> bool {
        x >= 0 && y >= 0 && x < cols && y < rows
    }
}