use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    console::log_1(&format!("Hello, {}!", name).into());
    format!("This string has come from Rust!")
}

#[wasm_bindgen]
pub fn legal(rows: i32, cols: i32, x: i32, y: i32) -> bool {
    x >= 0 && y >= 0 && x < cols && y < rows
}

// #[wasm_bindgen]
// pub fn check_tile(tiles_json: &str, rows: i32, cols: i32, x: i32, y: i32, mask_json: &str) -> bool {
//     if !legal(rows, cols, x, y) {
//         return false;
//     }

//     let tiles: Vec<Vec<String>> = serde_json::from_str(tiles_json).unwrap();
//     let mask: Vec<String> = serde_json::from_str(mask_json).unwrap();
//     let tile_val = &tiles[x as usize][y as usize];

//     if mask.contains(&tile_val) {
//         return true;
//     }
//     false
// }
