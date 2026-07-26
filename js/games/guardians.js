/**
 * BMO OS - Guardians of Sunshine (Posición de Barra de Vida de Jefes Corregida y Paleta BMO)
 */
class GuardiansGame extends GameEngine {
    constructor(canvas) {
        super(canvas);
    }

    reset() {
        this.player = {
            x: this.width / 2 - 20,
            y: this.height - 40,
            width: 40,
            height: 20,
            speed: 6.5
        };
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.level = 1;
        this.boss = null;
        this.highScore = this.getHighScore('guardians');
        this.gameOver = false;
        this.soundPlayed = false;
        this.frameCount = 0;

        this.startLevel();
    }

    startLevel() {
        this.bullets = [];
        this.enemyBullets = [];
        this.boss = null;

        if (this.level % 3 === 0) {
            this.spawnBoss();
        } else {
            this.spawnNormalEnemies();
        }
    }

    spawnNormalEnemies() {
        this.enemies = [];
        const rows = Math.min(4, 2 + Math.floor(this.level / 2));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < 8; c++) {
                this.enemies.push({
                    x: 60 + c * 65,
                    y: 60 + r * 38,
                    width: 35,
                    height: 24,
                    alive: true,
                    dx: 1.5 + (this.level * 0.3),
                    type: r % 3
                });
            }
        }
    }

    spawnBoss() {
        this.enemies = [];
        const bossIndex = Math.min(3, Math.floor(this.level / 3));

        if (bossIndex === 1) {
            // Jefe 1 (Nivel 3): Sun Guardian
            this.boss = {
                name: 'SUN GUARDIAN',
                x: this.width / 2 - 50,
                y: 80,
                width: 100,
                height: 60,
                hp: 35,
                maxHp: 35,
                dx: 2.5,
                shootTimer: 0,
                type: 1
            };
        } else if (bossIndex === 2) {
            // Jefe 2 (Nivel 6): Super-Cube
            this.boss = {
                name: 'SUPER-CUBE',
                x: this.width / 2 - 60,
                y: 80,
                width: 120,
                height: 70,
                hp: 55,
                maxHp: 55,
                dx: 3.5,
                shootTimer: 0,
                type: 2
            };
        } else {
            // Jefe 3 (Nivel 9+): Sleepy Sam
            this.boss = {
                name: 'SLEEPY SAM',
                x: this.width / 2 - 70,
                y: 80,
                width: 140,
                height: 80,
                hp: 75,
                maxHp: 75,
                dx: 4.0,
                shootTimer: 0,
                type: 3
            };
        }
    }

    update(controller) {
        if (this.gameOver) {
            if (!this.soundPlayed) {
                audioManager.stopBgMusic();
                audioManager.play(this.score > 1000 ? 'win' : 'lose');
                this.soundPlayed = true;
                if (controller.triggerRumble) controller.triggerRumble(300, 0.8, 0.8);
            }
            if (controller.justPressed('a') || controller.justPressed('start')) {
                audioManager.playBgMusic(true);
                this.reset();
            }
            return;
        }

        if (controller.keys.left && this.player.x > 10) {
            this.player.x -= this.player.speed;
        }
        if (controller.keys.right && this.player.x < this.width - this.player.width - 10) {
            this.player.x += this.player.speed;
        }

        if (controller.justPressed('a') || controller.justPressed('up')) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 3,
                y: this.player.y,
                width: 6,
                height: 12,
                speed: 9.5
            });
            audioManager.playChiptuneSfx('laser');
            if (controller.triggerRumble) controller.triggerRumble(40, 0.2, 0.2);
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y -= b.speed;
            if (b.y < -20) this.bullets.splice(i, 1);
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            let eb = this.enemyBullets[i];
            eb.y += eb.speed;
            if (eb.x < this.player.x + this.player.width && eb.x + eb.width > this.player.x &&
                eb.y < this.player.y + this.player.height && eb.y + eb.height > this.player.y) {
                this.gameOver = true;
            }
            if (eb.y > this.height + 20) this.enemyBullets.splice(i, 1);
        }

        if (this.boss) {
            this.boss.x += this.boss.dx;
            if (this.boss.x <= 20 || this.boss.x + this.boss.width >= this.width - 20) {
                this.boss.dx *= -1;
            }

            this.boss.shootTimer++;
            if (this.boss.shootTimer % 45 === 0) {
                if (this.boss.type === 1) {
                    this.enemyBullets.push({ x: this.boss.x + 20, y: this.boss.y + 60, width: 8, height: 16, speed: 5 });
                    this.enemyBullets.push({ x: this.boss.x + this.boss.width - 28, y: this.boss.y + 60, width: 8, height: 16, speed: 5 });
                } else if (this.boss.type === 2) {
                    this.enemyBullets.push({ x: this.boss.x + this.boss.width / 2 - 4, y: this.boss.y + 70, width: 8, height: 16, speed: 6 });
                    this.enemyBullets.push({ x: this.boss.x + 10, y: this.boss.y + 70, width: 8, height: 16, speed: 5 });
                    this.enemyBullets.push({ x: this.boss.x + this.boss.width - 18, y: this.boss.y + 70, width: 8, height: 16, speed: 5 });
                } else {
                    for (let k = 0; k < 4; k++) {
                        this.enemyBullets.push({ x: this.boss.x + 15 + k * 30, y: this.boss.y + 70, width: 10, height: 16, speed: 6.5 });
                    }
                }
            }

            for (let i = this.bullets.length - 1; i >= 0; i--) {
                let b = this.bullets[i];
                if (b.x < this.boss.x + this.boss.width && b.x + b.width > this.boss.x &&
                    b.y < this.boss.y + this.boss.height && b.y + b.height > this.boss.y) {
                    
                    this.bullets.splice(i, 1);
                    this.boss.hp--;
                    this.score += 50;
                    audioManager.playChiptuneSfx('hit');
                    if (controller.triggerRumble) controller.triggerRumble(60, 0.3, 0.3);

                    if (this.boss.hp <= 0) {
                        this.score += 2000;
                        audioManager.playChiptuneSfx('win');
                        this.level++;
                        this.startLevel();
                        break;
                    }
                }
            }
        } 
        else {
            let moveDown = false;
            let activeEnemies = 0;
            this.enemies.forEach(e => {
                if (!e.alive) return;
                activeEnemies++;
                e.x += e.dx;
                if (e.x <= 15 || e.x + e.width >= this.width - 15) {
                    moveDown = true;
                }
            });

            if (moveDown) {
                this.enemies.forEach(e => {
                    if (e.alive) {
                        e.dx *= -1;
                        e.y += 10;
                        if (e.y + e.height >= this.player.y) {
                            this.gameOver = true;
                        }
                    }
                });
            }

            if (activeEnemies === 0) {
                this.level++;
                this.startLevel();
            }

            for (let i = this.bullets.length - 1; i >= 0; i--) {
                let b = this.bullets[i];
                for (let j = 0; j < this.enemies.length; j++) {
                    let e = this.enemies[j];
                    if (e.alive && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                        e.alive = false;
                        this.bullets.splice(i, 1);
                        this.score += (3 - e.type) * 100;
                        this.saveHighScore('guardians', this.score);
                        this.highScore = Math.max(this.score, this.highScore);
                        audioManager.playChiptuneSfx('hit');
                        if (controller.triggerRumble) controller.triggerRumble(80, 0.4, 0.4);

                        for (let p = 0; p < 5; p++) {
                            this.particles.push({
                                x: e.x + e.width / 2,
                                y: e.y + e.height / 2,
                                vx: (Math.random() - 0.5) * 5,
                                vy: (Math.random() - 0.5) * 5,
                                alpha: 1
                            });
                        }
                        break;
                    }
                }
            }
        }

        for (let p = this.particles.length - 1; p >= 0; p--) {
            let pt = this.particles[p];
            pt.x += pt.vx; pt.y += pt.vy;
            pt.alpha -= 0.05;
            if (pt.alpha <= 0) this.particles.splice(p, 1);
        }

        this.frameCount++;
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

        // Nave Jugador (BMO)
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.fillRect(this.player.x, this.player.y + 8, this.player.width, 12);
        this.ctx.fillRect(this.player.x + 12, this.player.y, 16, 8);
        this.ctx.fillRect(this.player.x + 18, this.player.y - 6, 4, 6);

        // Balas Jugador (Blanco Menta)
        this.ctx.fillStyle = '#ffffff';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x, b.y, b.width, b.height);
        });

        // Balas Enemigas (Verde Oscuro Profundo)
        this.ctx.fillStyle = '#1b3226';
        this.enemyBullets.forEach(eb => {
            this.ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
        });

        // DIBUJAR JEFE Y BARRA DE VIDA UBICADA LIMPIAMENTE ABAJO DEL HUD
        if (this.boss) {
            this.ctx.fillStyle = this.colors.fg;
            this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);

            // Barra de vida del Jefe
            const barX = this.width / 2 - 120;
            const barY = 42;
            const barWidth = 240;
            const barHeight = 14;

            // Fondo de la barra (verde oscuro profundo)
            this.ctx.fillStyle = '#1b3226';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Relleno de vida (verde menta BMO)
            this.ctx.fillStyle = '#d0f0c0';
            this.ctx.fillRect(barX, barY, (this.boss.hp / this.boss.maxHp) * barWidth, barHeight);

            // Borde de la barra (blanco)
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Nombre del jefe con separación debajo de la barra
            this.drawText(this.boss.name, this.width / 2, barY + barHeight + 18, '11px');
        } 
        else {
            this.enemies.forEach(e => {
                if (!e.alive) return;
                this.ctx.fillStyle = this.colors.fg;
                this.ctx.fillRect(e.x, e.y, e.width, e.height);
                this.ctx.fillStyle = this.colors.bg;
                this.ctx.fillRect(e.x + 6, e.y + 6, 6, 6);
                this.ctx.fillRect(e.x + e.width - 12, e.y + 6, 6, 6);
            });
        }

        // Partículas
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(44, 76, 59, ${p.alpha})`;
            this.ctx.fillRect(p.x, p.y, 4, 4);
        });

        // HUD Fijo Superior
        this.drawText('NIVEL ' + this.level, 20, 25, '14px', 'left');
        this.drawText('PTS: ' + this.score, this.width / 2, 25, '14px', 'center');
        this.drawText('MAX: ' + this.highScore, this.width - 20, 25, '14px', 'right');
    }
}
