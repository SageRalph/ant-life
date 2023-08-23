use crate::definitions;

pub struct World {
    rows: i32,
    cols: i32,
    age: i32,
    ants: i32,
    tiles: Vec<Vec<definitions::TileSet>>,
}

impl World {
    pub fn new(rows: i32, cols: i32) -> World {
        World {
            rows: rows,
            cols: cols,
            age: 0,
            ants: 0,
            tiles: Vec<Vec<definitions::TileSet>::new()>::new(),
        }
    }

    fn tick(&mut self) {
        println!("tick")
    }

    fn do_rain(&mut self, count: i32, tile: definitions::TileSet) {
        println!("doRain")
    }

    fn get_tile(&self, row: i32, col: i32) {
        println!("getTile")
    }

    fn set_tile(&mut self, row: i32, col: i32, mask: Option<definitions::TileSet>) {
        println!("setTile")
    }

    fn check_tile(&self, row: i32, col: i32, mask: definitions::TileSet) {
        println!("checkTile")
    }

    fn check_chunks(&self, row: i32, col: i32, mask: definitions::TileSet, distance: i32, threshold: i32) {
        println!("checkChunks")
    }

    fn get_chunks(&self, row: i32, col: i32, distance: i32) {
        println!("getChunks")
    }

    fn update_chunks(&self) {
        println!("updateChunks")
    }

    fn swap_tiles(&self, row1: i32, col1: i32, row2: i32, col2: i32, mask: Option<definitions::TileSet>) {
        println!("swapTiles")
    }

    fn for_each_tile(&self, minRow: i32, minCol: i32, maxRow: i32, maxCol: i32, callback: fn(i32, i32))  {
        println!("forEachTile")
    }

    fn fill_circle(&self, centerX: i32, centerY: i32, radius: i32, tile: definitions::TileSet, mask: Option<definitions::TileSet>) {
        println!("fillCircle")
    }

    fn fill_rectangle(&self, minX: i32, minY: i32, maxX: i32, maxY: i32, tile: definitions::TileSet, mask: Option<definitions::TileSet>) {
        println!("fillRectangle")
    }

    fn legal(&self, x: i32, y: i32) {
        println!("legal")
    }

    fn benchmark(&self) {
        println!("benchmark")
    }

    fn do_benchmark(&self) {
        println!("doBenchmark")
    }

}