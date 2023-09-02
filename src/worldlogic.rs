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

    pub fn _sandAction(x:i32,y:i32){
        
    }

}