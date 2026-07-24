class SnakeGame extends GameEngine {
    constructor(canvas) {
        super(canvas);
        this.grid = 20;
        this.count = 0;
    }

    reset() {
        this.snake = {
            x: 160, y: 160,
            dx: this.grid, dy: 0,
            cells: [],
            maxCells: 4
        };
        this.apple = { x: 320, y: 320 };
        this.score = 0;
        this.gameOver = false;
        this.soundPlayed = false;
    }

    update(controller) {
        if (this.gameOver) {
            if (!this.soundPlayed) {
                audioManager.stopBgMusic();
                if (this.score > 7) {
                    audioManager.play('win');
                } else {
                    audioManager.play('lose');
                }
                this.soundPlayed = true;
            }
            if (controller.justPressed('a') || controller.justPressed('start')) {
                audioManager.playBgMusic(true);
                this.reset();
            }
            return;
        }

        // Handle Input
        if (controller.justPressed('left') && this.snake.dx === 0) {
            this.snake.dx = -this.grid;
            this.snake.dy = 0;
        } else if (controller.justPressed('right') && this.snake.dx === 0) {
            this.snake.dx = this.grid;
            this.snake.dy = 0;
        } else if (controller.justPressed('up') && this.snake.dy === 0) {
            this.snake.dx = 0;
            this.snake.dy = -this.grid;
        } else if (controller.justPressed('down') && this.snake.dy === 0) {
            this.snake.dx = 0;
            this.snake.dy = this.grid;
        }

        // Slower game speed
        if (++this.count < 4) {
            return;
        }
        this.count = 0;

        // Move snake
        this.snake.x += this.snake.dx;
        this.snake.y += this.snake.dy;

        // Wrap around screen
        if (this.snake.x < 0) this.snake.x = this.width - this.grid;
        else if (this.snake.x >= this.width) this.snake.x = 0;
        if (this.snake.y < 0) this.snake.y = this.height - this.grid;
        else if (this.snake.y >= this.height) this.snake.y = 0;

        // Keep track of where snake has been
        this.snake.cells.unshift({ x: this.snake.x, y: this.snake.y });
        if (this.snake.cells.length > this.snake.maxCells) {
            this.snake.cells.pop();
        }
    }

    draw() {
        this.clear();

        if (this.gameOver) {
            this.drawText('GAME OVER', this.width / 2, this.height / 2, '40px');
            this.drawText('Puntos: ' + this.score, this.width / 2, this.height / 2 + 40, '20px');
            this.drawText('Presiona J para reiniciar', this.width / 2, this.height / 2 + 80, '15px');
            return;
        }

        // Draw Apple
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.fillRect(this.apple.x, this.apple.y, this.grid - 1, this.grid - 1);

        // Draw Snake
        this.ctx.fillStyle = this.colors.fg;
        this.snake.cells.forEach((cell, index) => {
            this.ctx.fillRect(cell.x, cell.y, this.grid - 1, this.grid - 1);

            // Eat Apple
            if (cell.x === this.apple.x && cell.y === this.apple.y) {
                this.snake.maxCells++;
                this.score++;
                this.apple.x = Math.floor(Math.random() * (this.width / this.grid)) * this.grid;
                this.apple.y = Math.floor(Math.random() * (this.height / this.grid)) * this.grid;
            }

            // Collision with itself
            for (let i = index + 1; i < this.snake.cells.length; i++) {
                if (cell.x === this.snake.cells[i].x && cell.y === this.snake.cells[i].y) {
                    this.gameOver = true;
                }
            }
        });

        // Score
        this.drawText(this.score, 30, 40, '20px', 'left');
    }
}
