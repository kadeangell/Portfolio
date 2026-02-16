// Create an instance of the Game class to run the game
const game = new Game();
game.drawBack();
game.startScreen();

function update() {
    game.move();
    game.drawBack();
    game.drawLevel();
    game.drawCharacter();

    if (game.splash) {
        game.startScreen();
    }

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
}

setInterval(update, 1000 / 15);