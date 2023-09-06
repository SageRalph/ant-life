use crate::world::World;
use crate::utils::Utils;
use crate::definitions;
use std::cell::RefCell;
use std::rc::Rc;


#[derive(Clone)]
pub struct Worldlogic{
    world:Rc<RefCell<World>>,
}

impl Worldlogic {
    pub fn new(world: Rc<RefCell<World>>) -> Worldlogic {
        Worldlogic {
            world
        }
    }

    pub fn _sand_action(&self, x: i32, y: i32) -> bool{
        // move down or diagonally down
        let bias: i32 = Utils::random_sign();

        return 
            self.world.swap_tiles(x, y, x, y - 1, vec![definitions::TileSet::AIR,
                definitions::TileSet:: WATER]) ||
            self.world.swap_tiles(x, y, x + bias, y - 1, vec![definitions::TileSet::AIR, 
                definitions::TileSet::WATER]) ||
            self.world.swap_tiles(x, y, x - bias, y - 1, vec![definitions::TileSet::AIR,
                definitions::TileSet::WATER]);
    }

}
