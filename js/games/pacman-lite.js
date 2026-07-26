/**
 * BMO OS - BMO Pac-Man (3 Fantasmas, Colisión Corregida)
 */
class PacmanLiteGame extends GameEngine {
    constructor(canvas) {
        super(canvas);
        this.tileSize = 40;
        this.cols = this.width / this.tileSize;
        this.rows = this.height / this.tileSize;
        
        // 1: Muro, 0: Punto, 2: Vacío, 3: Power Pellet, 4: Fruta Bonus
        this.level = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,3,0,0,0,0,0,1,1,0,0,0,0,0,3,1],
            [1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
            [1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,1],
            [1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1],
            [2,0,1,1,0,0,0,0,0,0,0,0,1,1,0,2],
            [1,0,1,1,0,1,1,2,2,1,1,0,1,1,0,1],
            [1,0,0,0,0,1,2,4,2,2,1,0,0,0,0,1],
            [1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,3,0,0,0,1,1,1,1,1,1,0,0,0,3,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ];
    }

    reset() {
        this.map = this.level.map(row => [...row]);
        this.score = 0;
        this.highScore = this.getHighScore('pacman');
        this.lives = 3;
        this.gameOver = false;
        this.win = false;
        this.soundPlayed = false;
        this.scaredTimer = 0;
        this.ghostStreak = 0;
        
        this.resetPositions();
    }

    resetPositions() {
        this.player = {
            c: 1, r: 1,
            dc: 0, dr: 0,
            nextDc: 1, nextDr: 0
        };

        // 4 Fantasmas (Paleta BMO)
        this.ghosts = [
            { name: 'Blinky', color: '#1b3226', c: 7, r: 6, dc: 0, dr: -1 },
            { name: 'Pinky',  color: '#2c4c3b', c: 8, r: 6, dc: 0, dr: -1 },
            { name: 'Inky',   color: '#3d614e', c: 7, r: 7, dc: 1, dr: 0 },
            { name: 'Clyde',  color: '#527a65', c: 8, r: 7, dc: -1, dr: 0 }
        ];
        this.frameCount = 0;
    }

    isWall(r, c) {
        if (c < 0 || c >= this.cols) return false;
        if (r < 0 || r >= this.rows) return true;
        return this.map[r][c] === 1;
    }

    /**
     * Comprueba colisión entre el jugador y un fantasma.
     * Verifica tanto posición exacta como cruce de posiciones (swap).
     */
    _checkGhostCollision(ghost, prevPlayerC, prevPlayerR, controller) {
        // Colisión directa: misma celda
        const sameCell = (this.player.c === ghost.c && this.player.r === ghost.r);
        // Colisión por cruce: el jugador pasó por donde estaba el fantasma y viceversa
        const swapped = (this.player.c === ghost.prevC && this.player.r === ghost.prevR &&
                         ghost.c === prevPlayerC && ghost.r === prevPlayerR);

        if (sameCell || swapped) {
            if (this.scaredTimer > 0) {
                this.ghostStreak++;
                this.score += 200 * this.ghostStreak;
                ghost.c = 7;
                ghost.r = 7;
                ghost.prevC = ghost.c;
                ghost.prevR = ghost.r;
                audioManager.playChiptuneSfx('laser');
                if (controller.triggerRumble) controller.triggerRumble(120, 0.6, 0.6);
            } else {
                this.lives--;
                audioManager.playChiptuneSfx('hit');
                if (controller.triggerRumble) controller.triggerRumble(250, 0.7, 0.7);

                if (this.lives <= 0) {
                    this.gameOver = true;
                } else {
                    this.resetPositions();
                }
                return true; // Indica que hubo colisión mortal (reset positions)
            }
        }
        return false;
    }

    update(controller) {
        if (this.gameOver || this.win) {
            if (!this.soundPlayed) {
                audioManager.stopBgMusic();
                audioManager.play(this.win ? 'win' : 'lose');
                this.soundPlayed = true;
                if (controller.triggerRumble) controller.triggerRumble(300, 0.8, 0.8);
            }
            if (controller.justPressed('a') || controller.justPressed('start')) {
                audioManager.playBgMusic(true);
                this.reset();
            }
            return;
        }

        if (controller.justPressed('left')) { this.player.nextDc = -1; this.player.nextDr = 0; }
        else if (controller.justPressed('right')) { this.player.nextDc = 1; this.player.nextDr = 0; }
        else if (controller.justPressed('up')) { this.player.nextDc = 0; this.player.nextDr = -1; }
        else if (controller.justPressed('down')) { this.player.nextDc = 0; this.player.nextDr = 1; }

        this.frameCount++;
        if (this.scaredTimer > 0) this.scaredTimer--;

        if (this.frameCount % 7 === 0) {
            // Guardar posición previa del jugador
            const prevPlayerC = this.player.c;
            const prevPlayerR = this.player.r;

            // Mover jugador
            let nextC = this.player.c + this.player.nextDc;
            let nextR = this.player.r + this.player.nextDr;
            
            if (!this.isWall(nextR, nextC)) {
                this.player.dc = this.player.nextDc;
                this.player.dr = this.player.nextDr;
            }

            let forwardC = this.player.c + this.player.dc;
            let forwardR = this.player.r + this.player.dr;
            
            if (!this.isWall(forwardR, forwardC)) {
                this.player.c = forwardC;
                this.player.r = forwardR;
            }

            // Tunnel wrap
            if (this.player.c < 0) this.player.c = this.cols - 1;
            else if (this.player.c >= this.cols) this.player.c = 0;

            // Recoger ítems
            const currentCell = this.map[this.player.r][this.player.c];
            if (currentCell === 0) {
                this.map[this.player.r][this.player.c] = 2;
                this.score += 10;
                audioManager.playChiptuneSfx('eat');
            } 
            else if (currentCell === 3) {
                this.map[this.player.r][this.player.c] = 2;
                this.score += 50;
                this.scaredTimer = 170; // 50 + 120 frames (+2 segundos de duración a 60fps)
                this.ghostStreak = 0;
                audioManager.playChiptuneSfx('menu_select');
                if (controller.triggerRumble) controller.triggerRumble(150, 0.4, 0.6);
            }
            else if (currentCell === 4) {
                this.map[this.player.r][this.player.c] = 2;
                this.score += 200;
                audioManager.playChiptuneSfx('win');
            }

            this.saveHighScore('pacman', this.score);
            this.highScore = Math.max(this.score, this.highScore);

            // Comprobar victoria
            let remainingDots = 0;
            this.map.forEach(row => row.forEach(cell => {
                if (cell === 0 || cell === 3) remainingDots++;
            }));
            if (remainingDots === 0) this.win = true;

            // Mover fantasmas y comprobar colisiones
            for (let i = 0; i < this.ghosts.length; i++) {
                const ghost = this.ghosts[i];

                // Guardar posición previa del fantasma
                ghost.prevC = ghost.c;
                ghost.prevR = ghost.r;

                // Movimiento IA del fantasma
                let possibleMoves = [];
                [[0,-1],[0,1],[-1,0],[1,0]].forEach(dir => {
                    if (!this.isWall(ghost.r + dir[1], ghost.c + dir[0])) {
                        possibleMoves.push(dir);
                    }
                });

                const isHeadingToWall = this.isWall(ghost.r + ghost.dr, ghost.c + ghost.dc);
                if (isHeadingToWall || Math.random() < 0.3) {
                    if (possibleMoves.length > 0) {
                        let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                        ghost.dc = move[0];
                        ghost.dr = move[1];
                    }
                }

                if (!this.isWall(ghost.r + ghost.dr, ghost.c + ghost.dc)) {
                    ghost.c += ghost.dc;
                    ghost.r += ghost.dr;
                }

                // Tunnel wrap para fantasma
                if (ghost.c < 0) ghost.c = this.cols - 1;
                else if (ghost.c >= this.cols) ghost.c = 0;

                // Comprobar colisión (posición directa + cruce de caminos)
                const died = this._checkGhostCollision(ghost, prevPlayerC, prevPlayerR, controller);
                if (died) break; // resetPositions fue llamado, no seguir iterando
            }
        }
    }

    draw() {
        this.clear();

        // Laberinto
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.map[r][c] === 1) {
                    this.ctx.fillStyle = this.colors.fg;
                    this.ctx.fillRect(c * this.tileSize + 2, r * this.tileSize + 2, this.tileSize - 4, this.tileSize - 4);
                } else if (this.map[r][c] === 0) {
                    this.ctx.fillStyle = this.colors.fg;
                    this.ctx.beginPath();
                    this.ctx.arc(c * this.tileSize + this.tileSize / 2, r * this.tileSize + this.tileSize / 2, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (this.map[r][c] === 3) {
                    if (Math.floor(this.frameCount / 8) % 2 === 0) {
                        this.ctx.fillStyle = this.colors.fg;
                        this.ctx.beginPath();
                        this.ctx.arc(c * this.tileSize + this.tileSize / 2, r * this.tileSize + this.tileSize / 2, 9, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } else if (this.map[r][c] === 4) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(c * this.tileSize + 14, r * this.tileSize + 24, 6, 0, Math.PI * 2);
                    this.ctx.arc(c * this.tileSize + 26, r * this.tileSize + 24, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        // Pac-Man
        let px = this.player.c * this.tileSize + this.tileSize / 2;
        let py = this.player.r * this.tileSize + this.tileSize / 2;
        
        let startAngle = 0.25 * Math.PI;
        let endAngle = 1.75 * Math.PI;
        if ((this.frameCount % 12) < 6) {
            startAngle = 0.05 * Math.PI; endAngle = 1.95 * Math.PI;
        }

        this.ctx.save();
        this.ctx.translate(px, py);
        if (this.player.dc === -1) this.ctx.rotate(Math.PI);
        else if (this.player.dr === -1) this.ctx.rotate(-Math.PI/2);
        else if (this.player.dr === 1) this.ctx.rotate(Math.PI/2);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.tileSize / 2 - 4, startAngle, endAngle);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();
        this.ctx.restore();

        // Fantasmas
        this.ghosts.forEach(ghost => {
            let gx = ghost.c * this.tileSize + this.tileSize / 2;
            let gy = ghost.r * this.tileSize + this.tileSize / 2;

            const isFrightened = this.scaredTimer > 0;
            const isFlashing = this.scaredTimer < 12 && this.frameCount % 4 < 2;
            this.ctx.fillStyle = isFrightened ? (isFlashing ? '#1b3226' : '#ffffff') : ghost.color;

            this.ctx.beginPath();
            this.ctx.arc(gx, gy, this.tileSize / 2 - 4, Math.PI, 0);
            this.ctx.fillRect(gx - (this.tileSize/2 - 4), gy, this.tileSize - 8, this.tileSize/2 - 4);
            this.ctx.fill();

            // Ojos
            this.ctx.fillStyle = isFrightened ? '#2c4c3b' : '#d0f0c0';
            this.ctx.beginPath();
            this.ctx.arc(gx - 6, gy - 3, 4, 0, Math.PI * 2);
            this.ctx.arc(gx + 6, gy - 3, 4, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#1b3226';
            this.ctx.beginPath();
            this.ctx.arc(gx - 5, gy - 3, 2, 0, Math.PI * 2);
            this.ctx.arc(gx + 7, gy - 3, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // HUD
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(143, 173, 138, 0.95)';
            this.ctx.fillRect(0, this.height/2 - 70, this.width, 140);
            this.drawText('GAME OVER', this.width / 2, this.height / 2 - 15, '30px');
            this.drawText('PTS: ' + this.score + ' | MAX: ' + this.highScore, this.width / 2, this.height / 2 + 20, '14px');
            this.drawRestartPrompt(this.width / 2, this.height / 2 + 50);
        } else if (this.win) {
            this.ctx.fillStyle = 'rgba(143, 173, 138, 0.95)';
            this.ctx.fillRect(0, this.height/2 - 70, this.width, 140);
            this.drawText('¡VICTORIA!', this.width / 2, this.height / 2 - 15, '30px');
            this.drawText('Puntos: ' + this.score, this.width / 2, this.height / 2 + 20, '16px');
            this.drawRestartPrompt(this.width / 2, this.height / 2 + 50);
        } else {
            // Barra de información en la parte inferior del canvas
            this.ctx.fillStyle = 'rgba(27, 50, 38, 0.85)';
            this.ctx.fillRect(0, this.height - 32, this.width, 32);
            this.ctx.fillStyle = '#d0f0c0';
            this.ctx.font = '12px "Press Start 2P", monospace';
            this.ctx.textBaseline = 'middle';
            const hudY = this.height - 16;
            this.ctx.textAlign = 'left';
            this.ctx.fillText('PTS: ' + this.score, 12, hudY);
            this.ctx.textAlign = 'center';
            this.ctx.fillText('VIDAS: ' + this.lives, this.width / 2, hudY);
            this.ctx.textAlign = 'right';
            this.ctx.fillText('MAX: ' + this.highScore, this.width - 12, hudY);
        }
    }
}
