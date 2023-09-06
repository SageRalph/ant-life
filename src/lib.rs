extern crate wasm_bindgen;
use std::cell::RefCell;
use std::rc::Rc;
// use wasm_bindgen::prelude::*;

// Importing modules
mod definitions;
mod utils;
mod worldgen;
mod worldlogic;
mod world;

pub use world::World;

// fn main(rows: i32, cols: i32) {
//     let world = Rc::new(RefCell::new(world::World::new(rows, cols))); 
//     let _worldgen = worldgen::Worldgen::new(world.clone());
// }