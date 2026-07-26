/**
 * BMO OS - Flappy Bird (BMO Fly)
 */
class FlappyBirdGame extends GameEngine {
    constructor(canvas) {
        super(canvas);
        this.gravity = 0.5;
        this.flapPower = -7.5;
    }

    reset() {
        this.bird = {
            x: 100, y: this.height / 2,
            velocity: 0,
            radius: 14
        };
        this.pipes = [];
        this.clouds = [
            { x: 100, y: 50, speed: 0.5 },
            { x: 350, y: 90, speed: 0.8 },
            { x: 550, y: 40, speed: 0.6 }
        ];
        this.frames = 0;
        this.score = 0;
        this.highScore = this.getHighScore('flappy');
        this.gameOver = false;
        this.soundPlayed = false;
        
        this.pipeWidth = 55;
        this.pipeGap = 140;
        this.pipeSpeed = 3.5;
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
                if (controller.triggerRumble) controller.triggerRumble(300, 0.8, 0.8);
            }
            if (controller.justPressed('a') || controller.justPressed('up') || controller.justPressed('start')) {
                audioManager.playBgMusic(true);
                this.reset();
            }
            return;
        }

        // Aleteo (J / A button / Arriba)
        if (controller.justPressed('a') || controller.justPressed('up')) {
            this.bird.velocity = this.flapPower;
            audioManager.playChiptuneSfx('jump');
            if (controller.triggerRumble) controller.triggerRumble(50, 0.2, 0.2);
        }

        // Física
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        // Mover nubes
        this.clouds.forEach(c => {
            c.x -= c.speed;
            if (c.x < -80) c.x = this.width + 50;
        });

        // Colisión suelo / techo
        if (this.bird.y + this.bird.radius >= this.height || this.bird.y - this.bird.radius <= 0) {
            this.gameOver = true;
        }

        // Tuberías
        this.frames++;
        if (this.frames % 85 === 0) {
            const minHeight = 60;
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

            // Colisión
            if (this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth) {
                if (this.bird.y - this.bird.radius < p.top || this.bird.y + this.bird.radius > p.bottom) {
                    this.gameOver = true;
                }
            }

            // Puntuación
            if (p.x + this.pipeWidth < this.bird.x && !p.passed) {
                this.score++;
                this.saveHighScore('flappy', this.score);
                this.highScore = Math.max(this.score, this.highScore);
                p.passed = true;
                audioManager.playChiptuneSfx('eat');
            }

            if (p.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }

    draw() {
        this.clear();

        // Nubes de fondo
        this.ctx.fillStyle = 'rgba(44, 76, 59, 0.25)';
        this.clouds.forEach(c => {
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 25, 0, Math.PI * 2);
            this.ctx.arc(c.x + 20, c.y - 10, 20, 0, Math.PI * 2);
            this.ctx.arc(c.x + 40, c.y, 22, 0, Math.PI * 2);
            this.ctx.fill();
        });

        if (this.gameOver) {
            this.drawText('GAME OVER', this.width / 2, this.height / 2 - 30, '35px');
            this.drawText('Puntos: ' + this.score, this.width / 2, this.height / 2 + 20, '20px');
            this.drawText('Récord: ' + this.highScore, this.width / 2, this.height / 2 + 50, '16px');
            this.drawRestartPrompt(this.width / 2, this.height / 2 + 90);
            return;
        }

        // Tuberías
        this.ctx.fillStyle = this.colors.fg;
        this.pipes.forEach(p => {
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.top);
            this.ctx.fillRect(p.x - 3, p.top - 15, this.pipeWidth + 6, 15);

            this.ctx.fillRect(p.x, p.bottom, this.pipeWidth, this.height - p.bottom);
            this.ctx.fillRect(p.x - 3, p.bottom, this.pipeWidth + 6, 15);
        });

        // Pájaros (BMO volador)
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Ojo del pájaro
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x + 5, this.bird.y - 3, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Pico
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.x + 12, this.bird.y);
        this.ctx.lineTo(this.bird.x + 22, this.bird.y + 4);
        this.ctx.lineTo(this.bird.x + 12, this.bird.y + 8);
        this.ctx.fill();

        // Marcador
        this.drawText('PTS: ' + this.score, 20, 35, '16px', 'left');
        this.drawText('MAX: ' + this.highScore, this.width - 20, 35, '16px', 'right');
    }
}
