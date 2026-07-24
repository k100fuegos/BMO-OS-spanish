class FlappyBirdGame extends GameEngine {
    constructor(canvas) {
        super(canvas);
        this.gravity = 0.6;
        this.flapPower = -8;
    }

    reset() {
        this.bird = {
            x: 100, y: this.height / 2,
            velocity: 0,
            radius: 12
        };
        this.pipes = [];
        this.frames = 0;
        this.score = 0;
        this.gameOver = false;
        this.soundPlayed = false;
        
        this.pipeWidth = 50;
        this.pipeGap = 150;
        this.pipeSpeed = 4;
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

        // Input flap (A button, up, or start)
        if (controller.justPressed('a') || controller.justPressed('up')) {
            this.bird.velocity = this.flapPower;
        }

        // Physics
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        // Collision with ground/ceiling
        if (this.bird.y + this.bird.radius >= this.height || this.bird.y - this.bird.radius <= 0) {
            this.gameOver = true;
        }

        // Pipes
        this.frames++;
        if (this.frames % 90 === 0) {
            const minHeight = 50;
            const maxHeight = this.height - this.pipeGap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            
            this.pipes.push({
                x: this.width,
                top: topHeight,
                bottom: topHeight + this.pipeGap,
                passed: false
            });
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            let p = this.pipes[i];
            p.x -= this.pipeSpeed;

            // Collision
            if (this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth) {
                if (this.bird.y - this.bird.radius < p.top || this.bird.y + this.bird.radius > p.bottom) {
                    this.gameOver = true;
                }
            }

            // Score
            if (p.x + this.pipeWidth < this.bird.x && !p.passed) {
                this.score++;
                p.passed = true;
            }

            // Remove off-screen pipes
            if (p.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }

    draw() {
        this.clear();

        if (this.gameOver) {
            this.drawText('GAME OVER', this.width / 2, this.height / 2 - 20, '40px');
            this.drawText('Puntos: ' + this.score, this.width / 2, this.height / 2 + 30, '20px');
            this.drawText('Presiona J para reiniciar', this.width / 2, this.height / 2 + 70, '15px');
            return;
        }

        // Draw bird
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw pipes
        this.ctx.fillStyle = this.colors.fg;
        this.pipes.forEach(p => {
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.top);
            this.ctx.fillRect(p.x, p.bottom, this.pipeWidth, this.height - p.bottom);
        });

        // Score
        this.drawText(this.score, this.width / 2, 50, '40px');
    }
}
