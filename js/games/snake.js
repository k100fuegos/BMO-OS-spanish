/**
 * BMO OS - Snake Game (Lógica y Renderizado Separados)
 */
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
        this.spawnApple();
        this.score = 0;
        this.highScore = this.getHighScore('snake');
        this.isNewHigh = false;
        this.gameOver = false;
        this.soundPlayed = false;
        this.particles = [];
    }

    spawnApple() {
        const maxX = Math.floor(this.width / this.grid);
        const maxY = Math.floor(this.height / this.grid);
        this.apple = {
            x: Math.floor(Math.random() * maxX) * this.grid,
            y: Math.floor(Math.random() * maxY) * this.grid
        };
    }

    update(controller) {
        if (this.gameOver) {
            if (!this.soundPlayed) {
                audioManager.stopBgMusic();
                audioManager.play(this.score > 7 ? 'win' : 'lose');
                this.soundPlayed = true;
                if (controller.triggerRumble) controller.triggerRumble(300, 0.8, 0.8);
            }
            if (controller.justPressed('a') || controller.justPressed('start')) {
                audioManager.playBgMusic(true);
                this.reset();
            }
            return;
        }

        // Controles WASD / D-Pad
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

        // Velocidad de la serpiente
        if (++this.count < 4) return;
        this.count = 0;

        // Mover serpiente
        this.snake.x += this.snake.dx;
        this.snake.y += this.snake.dy;

        // Wrap around pantalla
        if (this.snake.x < 0) this.snake.x = this.width - this.grid;
        else if (this.snake.x >= this.width) this.snake.x = 0;
        if (this.snake.y < 0) this.snake.y = this.height - this.grid;
        else if (this.snake.y >= this.height) this.snake.y = 0;

        this.snake.cells.unshift({ x: this.snake.x, y: this.snake.y });
        if (this.snake.cells.length > this.snake.maxCells) {
            this.snake.cells.pop();
        }

        // Comer Manzana
        const head = this.snake.cells[0];
        if (head && head.x === this.apple.x && head.y === this.apple.y) {
            this.snake.maxCells++;
            this.score++;
            if (this.saveHighScore('snake', this.score)) {
                this.highScore = this.score;
                this.isNewHigh = true;
            }
            
            audioManager.playChiptuneSfx('eat');
            if (controller.triggerRumble) controller.triggerRumble(80, 0.3, 0.4);

            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x: this.apple.x + 10,
                    y: this.apple.y + 10,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    alpha: 1
                });
            }

            this.spawnApple();
        }

        // Colisión con propio cuerpo
        for (let i = 1; i < this.snake.cells.length; i++) {
            if (head && head.x === this.snake.cells[i].x && head.y === this.snake.cells[i].y) {
                this.gameOver = true;
            }
        }

        // Actualizar Partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.05;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        this.clear();

        if (this.gameOver) {
            this.drawText('GAME OVER', this.width / 2, this.height / 2 - 30, '35px');
            this.drawText('Puntos: ' + this.score, this.width / 2, this.height / 2 + 20, '20px');
            this.drawText('Récord: ' + this.highScore, this.width / 2, this.height / 2 + 50, '16px');
            this.drawText('Presiona J o A para reiniciar', this.width / 2, this.height / 2 + 90, '14px');
            return;
        }

        // Manzana
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.fillRect(this.apple.x + 1, this.apple.y + 1, this.grid - 2, this.grid - 2);

        // Partículas
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(44, 76, 59, ${p.alpha})`;
            this.ctx.fillRect(p.x, p.y, 4, 4);
        });

        // Serpiente
        this.snake.cells.forEach((cell, index) => {
            this.ctx.fillStyle = index === 0 ? '#1b3226' : this.colors.fg;
            this.ctx.fillRect(cell.x + 1, cell.y + 1, this.grid - 2, this.grid - 2);
        });

        // HUD
        this.drawText('PTS: ' + this.score, 20, 35, '16px', 'left');
        this.drawText('MAX: ' + this.highScore, this.width - 20, 35, '16px', 'right');
    }
}
