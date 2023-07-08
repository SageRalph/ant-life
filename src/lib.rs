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