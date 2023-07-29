async function main() {
    const { default: init, greet } = await import('../pkg/ant_life_optimised.js');
    await init();
    const result = await greet('I got here from javascript!');
    console.log(result);
}

main();