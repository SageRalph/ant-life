import init, { greet } from '../pkg/ant_life_optimised.js';

async function main() {
    await init();
    console.log(await greet('I got here from javascript!'));
}

main();