use rand::Rng;

pub struct Utils;

impl Utils {
    // Checks if a point (a, b) is within a radius `r` of the point (x, y)
    pub fn point_within_radius(a: f64, b: f64, x: f64, y: f64, r: f64) -> bool {
        let dist = (a - x).powi(2) + (b - y).powi(2);
        dist < r.powi(2)
    }

    // Generates a random integer within a range [min, max] inclusive
    pub fn random_int_inclusive(min: i32, max: i32) -> i32 {
        let mut rng = rand::thread_rng();
        rng.gen_range(min..=max)
    }

    // Returns 1 or -1 randomly
    pub fn random_sign() -> i32 {
        let mut rng = rand::thread_rng();
        if rng.gen_bool(0.5) {
            1
        } else {
            -1
        }
    }

    // Returns the average of the elements in an array
    pub fn average(arr: &[f64]) -> f64 {
        let sum: f64 = arr.iter().sum();
        sum / arr.len() as f64
    }
}
