function simulate() 
{
    if (!scene.paused)
        scene.fluid.simulate(scene.dt, scene.gravity, scene.numIters)
        scene.frameNr++;
}

function update() {
    simulate();
    draw();
    requestAnimationFrame(update);
}

setupScene(1);
update();
