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

#[wasm_bindgen]
pub fn check_tile(tile: &str, rows: i32, cols: i32, x: i32, y: i32, mask_json: &str) -> bool {
    if !legal(rows, cols, x, y) {
        return false;
    }

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
