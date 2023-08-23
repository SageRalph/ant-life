extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

// Importing modules
mod definitions;
mod utils;
mod worldgen;
mod worldlogic;
mod world;

pub use world::World;

fn main(rows: i32, cols: i32) {
    let world = world::World::new(rows, cols);
}