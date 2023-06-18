var mouseDown = false;

function startDrag(x, y) {
    let bounds = canvas.getBoundingClientRect();

    let mx = x - bounds.left - canvas.clientLeft;
    let my = y - bounds.top - canvas.clientTop;
    mouseDown = true;

    x = mx / cScale;
    y = (canvas.height - my) / cScale;

    setObstacle(x,y, true);
}

function drag(x, y) {
    if (mouseDown) {
        let bounds = canvas.getBoundingClientRect();
        let mx = x - bounds.left - canvas.clientLeft;
        let my = y - bounds.top - canvas.clientTop;
        x = mx / cScale;
        y = (canvas.height - my) / cScale;
        setObstacle(x,y, false);
    }
}

function endDrag() {
    mouseDown = false;
}

canvas.addEventListener('mousedown', event => {
    startDrag(event.x, event.y);
});

canvas.addEventListener('mouseup', event => {
    endDrag();
});

canvas.addEventListener('mousemove', event => {
    drag(event.x, event.y);
});

canvas.addEventListener('touchstart', event => {
    startDrag(event.touches[0].clientX, event.touches[0].clientY)
});

canvas.addEventListener('touchend', event => {
    endDrag()
});

canvas.addEventListener('touchmove', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    drag(event.touches[0].clientX, event.touches[0].clientY)
}, { passive: false});

function togglePause() {
    scene.paused = !scene.paused;
}