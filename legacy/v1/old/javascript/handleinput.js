function keydown(e) {
    // 65 is the code for a, 37 is for <-
    if (e.keyCode === 65 || e.keyCode === 37) {
        game.keys.left = true;
    }
    // 68 is the code for d, 39 is for ^ arrow
    if (e.keyCode === 68 || e.keyCode === 39) {
        game.keys.right = true;
    }
    // 87 is the code for w and 32 is the code for the spacebar, 38 is for ->
    if (e.keyCode === 87 || e.keyCode === 32 || e.keyCode === 38) {
        game.keys.up = true;
    }

    if (e.keyCode) {
        game.pause = false;
        game.splash = false;
    }
}

function keyup(e) {
    if (e.keyCode === 65 || e.keyCode === 37) {
        game.keys.left = false;
    }
    if (e.keyCode === 68 || e.keyCode === 39) {
        game.keys.right = false;
    }
    if (e.keyCode === 87 || e.keyCode === 32 || e.keyCode === 38) {
        game.keys.up = false;
    }
}