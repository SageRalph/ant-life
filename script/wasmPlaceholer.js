import init, { greet } from '../pkg/ant_life_optimised.js';

async function main() {
    await init();
    const result = await greet('I got here from javascript!');
    console.log(result);
}

main();