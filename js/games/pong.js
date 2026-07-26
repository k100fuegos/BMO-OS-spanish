/**
 * BMO OS - BMO Pong (Corregido)
 */
class PongGame extends GameEngine {
    constructor(canvas) {
        super(canvas);
    }

    reset() {
        this.paddleHeight = 80;
        this.paddleWidth = 14;

        this.player = {
            x: 20,
            y: this.height / 2 - this.paddleHeight / 2,
            score: 0
        };

        this.ai = {
            x: this.width - 20 - this.paddleWidth,
            y: this.height / 2 - this.paddleHeight / 2,
            score: 0,
            speed: 4.5
        };

        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 8,
            vx: 5 * (Math.random() > 0.5 ? 1 : -1),
            vy: 3 * (Math.random() > 0.5 ? 1 : -1)
        };

        this.score = 0;
        this.targetScore = 5;
        this.gameOver = false;
        this.winner = '';
        this.soundPlayed = false;
    }

    update(controller) {
        if (this.gameOver) {
            if (!this.soundPlayed) {
                audioManager.stopBgMusic();
                audioManager.play(this.winner === 'JUGADOR' ? 'win' : 'lose');
                this.soundPlayed = true;
                if (controller.triggerRumble) controller.triggerRumble(300, 0.8, 0.8);
            }
            if (controller.justPressed('a') || controller.justPressed('start')) {
                audioManager.playBgMusic(true);
                this.reset();
            }
            return;
        }

        // Movimiento Jugador 1
        const speed = 7;
        if (controller.keys.up && this.player.y > 10) {
            this.player.y -= speed;
        }
        if (controller.keys.down && this.player.y < this.height - this.paddleHeight - 10) {
            this.player.y += speed;
        }

        // IA BMO
        const aiCenter = this.ai.y + this.paddleHeight / 2;
        if (this.ball.vx > 0) {
            if (aiCenter < this.ball.y - 15) {
                this.ai.y += this.ai.speed;
            } else if (aiCenter > this.ball.y + 15) {
                this.ai.y -= this.ai.speed;
            }
        }
        if (this.ai.y < 10) this.ai.y = 10;
        if (this.ai.y > this.height - this.paddleHeight - 10) this.ai.y = this.height - this.paddleHeight - 10;

        // Mover Pelota
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Rebote paredes superior e inferior (con corrección de posición para no atascarse)
        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.y = this.ball.radius;
            this.ball.vy *= -1;
            audioManager.playChiptuneSfx('click');
        } else if (this.ball.y + this.ball.radius >= this.height) {
            this.ball.y = this.height - this.ball.radius;
            this.ball.vy *= -1;
            audioManager.playChiptuneSfx('click');
        }

        // Colisión Paleta Jugador
        if (this.ball.x - this.ball.radius <= this.player.x + this.paddleWidth &&
            this.ball.y >= this.player.y && this.ball.y <= this.player.y + this.paddleHeight && this.ball.vx < 0) {
            
            this.ball.x = this.player.x + this.paddleWidth + this.ball.radius;
            this.ball.vx *= -1.08;
            if (Math.abs(this.ball.vx) > 14) this.ball.vx = 14;
            
            const deltaY = this.ball.y - (this.player.y + this.paddleHeight / 2);
            this.ball.vy = deltaY * 0.18;
            audioManager.playChiptuneSfx('jump');
            if (controller.triggerRumble) controller.triggerRumble(80, 0.3, 0.4);
        }

        // Colisión Paleta IA BMO
        if (this.ball.x + this.ball.radius >= this.ai.x &&
            this.ball.y >= this.ai.y && this.ball.y <= this.ai.y + this.paddleHeight && this.ball.vx > 0) {
            
            this.ball.x = this.ai.x - this.ball.radius;
            this.ball.vx *= -1.08;
            if (Math.abs(this.ball.vx) > 14) this.ball.vx = -14;

            const deltaY = this.ball.y - (this.ai.y + this.paddleHeight / 2);
            this.ball.vy = deltaY * 0.18;
            audioManager.playChiptuneSfx('jump');
        }

        // Punto para IA
        if (this.ball.x < 0) {
            this.ai.score++;
            audioManager.playChiptuneSfx('hit');
            this.resetBall(-1);
        }
        // Punto para Jugador
        else if (this.ball.x > this.width) {
            this.player.score++;
            this.score = this.player.score;
            audioManager.playChiptuneSfx('eat');
            this.resetBall(1);
        }

        if (this.player.score >= this.targetScore) {
            this.gameOver = true;
            this.winner = 'JUGADOR';
        } else if (this.ai.score >= this.targetScore) {
            this.gameOver = true;
            this.winner = 'BMO AI';
        }
    }

    resetBall(direction) {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.vx = 5 * direction;
        this.ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
    }

    draw() {
        this.clear();

        if (this.gameOver) {
            this.drawText(this.winner === 'JUGADOR' ? '¡GANASTE!' : 'BMO GANA', this.width / 2, this.height / 2 - 30, '35px');
            this.drawText(`${this.player.score} - ${this.ai.score}`, this.width / 2, this.height / 2 + 20, '25px');
            this.drawRestartPrompt(this.width / 2, this.height / 2 + 70);
            return;
        }

        this.ctx.strokeStyle = this.colors.fg;
        this.ctx.setLineDash([8, 8]);
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = this.colors.fg;
        this.ctx.fillRect(this.player.x, this.player.y, this.paddleWidth, this.paddleHeight);
        this.ctx.fillRect(this.ai.x, this.ai.y, this.paddleWidth, this.paddleHeight);

        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.drawText(this.player.score, this.width / 4, 50, '30px');
        this.drawText(this.ai.score, (this.width / 4) * 3, 50, '30px');
    }
}
