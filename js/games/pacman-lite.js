class PacmanLiteGame extends GameEngine {
    constructor(canvas) {
        super(canvas);
        this.tileSize = 40;
        this.cols = this.width / this.tileSize;
        this.rows = this.height / this.tileSize;
        
        // 1: Wall, 0: Dot, 2: Empty
        this.level = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
            [1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,1],
            [1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1],
            [1,1,1,1,0,1,1,2,2,1,1,0,1,1,1,1],
            [1,0,0,0,0,1,2,2,2,2,1,0,0,0,0,1],
            [1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ];
    }

    reset() {
        // Deep copy level so dots respawn
        this.map = this.level.map(row => [...row]);
        this.score = 0;
        this.gameOver = false;
        this.win = false;
        this.soundPlayed = false;
        this.totalDots = 0;
        
        this.map.forEach(row => row.forEach(cell => {
            if (cell === 0) this.totalDots++;
        }));

        this.player = {
            c: 1, r: 1,
            dc: 0, dr: 0,
            nextDc: 0, nextDr: 0
        };

        this.ghost = {
            c: 8, r: 7,
            dc: 1, dr: 0,
            timer: 0
        };
        
        this.frameCount = 0;
    }

    update(controller) {
        if (this.gameOver || this.win) {
            if (!this.soundPlayed) {
                audioManager.stopBgMusic();
                if (this.win) {
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

        // Buffer input
        if (controller.justPressed('left')) { this.player.nextDc = -1; this.player.nextDr = 0; }
        else if (controller.justPressed('right')) { this.player.nextDc = 1; this.player.nextDr = 0; }
        else if (controller.justPressed('up')) { this.player.nextDc = 0; this.player.nextDr = -1; }
        else if (controller.justPressed('down')) { this.player.nextDc = 0; this.player.nextDr = 1; }

        this.frameCount++;
        // Move every 8 frames to act as grid movement
        if (this.frameCount % 8 === 0) {
            // Try next direction
            let nextC = this.player.c + this.player.nextDc;
            let nextR = this.player.r + this.player.nextDr;
            
            if (this.map[nextR][nextC] !== 1) {
                this.player.dc = this.player.nextDc;
                this.player.dr = this.player.nextDr;
            }

            // Move player
            let forwardC = this.player.c + this.player.dc;
            let forwardR = this.player.r + this.player.dr;
            
            if (this.map[forwardR][forwardC] !== 1) {
                this.player.c = forwardC;
                this.player.r = forwardR;
            }

            // Eat Dot
            if (this.map[this.player.r][this.player.c] === 0) {
                this.map[this.player.r][this.player.c] = 2; // Empty
                this.score++;
                if (this.score >= this.totalDots) {
                    this.win = true;
                }
            }

            // Move Ghost (simple AI: try to move randomly at intersections)
            let possibleMoves = [];
            [[0,-1],[0,1],[-1,0],[1,0]].forEach(dir => {
                if (this.map[this.ghost.r + dir[1]][this.ghost.c + dir[0]] !== 1) {
                    possibleMoves.push(dir);
                }
            });

            // If hitting a wall or randomly (20% chance), change dir
            if (this.map[this.ghost.r + this.ghost.dr][this.ghost.c + this.ghost.dc] === 1 || Math.random() < 0.2) {
                if (possibleMoves.length > 0) {
                    let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    this.ghost.dc = move[0];
                    this.ghost.dr = move[1];
                }
            }

            this.ghost.c += this.ghost.dc;
            this.ghost.r += this.ghost.dr;

            // Collision check
            if (this.player.c === this.ghost.c && this.player.r === this.ghost.r) {
                this.gameOver = true;
            }
        }
    }

    draw() {
        this.clear();

        // Draw Map
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.map[r][c] === 1) { // Wall
                    this.ctx.fillStyle = this.colors.fg;
                    // Draw smaller walls for aesthetic
                    this.ctx.fillRect(c * this.tileSize + 4, r * this.tileSize + 4, this.tileSize - 8, this.tileSize - 8);
                } else if (this.map[r][c] === 0) { // Dot
                    this.ctx.fillStyle = this.colors.fg;
                    this.ctx.beginPath();
                    this.ctx.arc(c * this.tileSize + this.tileSize / 2, r * this.tileSize + this.tileSize / 2, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        // Draw Player
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        // Interpolate slightly for smooth drawing? No, simple blocky movement is fine
        let px = this.player.c * this.tileSize + this.tileSize / 2;
        let py = this.player.r * this.tileSize + this.tileSize / 2;
        
        // Simple pacman shape
        let startAngle = 0.2 * Math.PI;
        let endAngle = 1.8 * Math.PI;
        
        // Mouth animation
        if ((this.frameCount % 16) < 8) {
            startAngle = 0; endAngle = 2 * Math.PI;
        }

        // Rotate based on direction (very basic approximation)
        this.ctx.save();
        this.ctx.translate(px, py);
        if (this.player.dc === -1) this.ctx.rotate(Math.PI);
        else if (this.player.dr === -1) this.ctx.rotate(-Math.PI/2);
        else if (this.player.dr === 1) this.ctx.rotate(Math.PI/2);
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.tileSize / 2 - 4, startAngle, endAngle);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();
        this.ctx.restore();

        // Draw Ghost
        this.ctx.fillStyle = '#444'; // Darker for ghost
        let gx = this.ghost.c * this.tileSize + this.tileSize / 2;
        let gy = this.ghost.r * this.tileSize + this.tileSize / 2;
        this.ctx.beginPath();
        this.ctx.arc(gx, gy, this.tileSize / 2 - 4, Math.PI, 0);
        this.ctx.fillRect(gx - (this.tileSize/2 - 4), gy, this.tileSize - 8, this.tileSize/2 - 4);
        this.ctx.fill();

        // UI
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(143, 173, 138, 0.8)'; // Bg transparent
            this.ctx.fillRect(0, this.height/2 - 60, this.width, 120);
            this.drawText('GAME OVER', this.width / 2, this.height / 2, '30px');
            this.drawText('Presiona J', this.width / 2, this.height / 2 + 40, '15px');
        } else if (this.win) {
            this.ctx.fillStyle = 'rgba(143, 173, 138, 0.8)';
            this.ctx.fillRect(0, this.height/2 - 60, this.width, 120);
            this.drawText('YOU WIN!', this.width / 2, this.height / 2, '30px');
            this.drawText('Presiona J', this.width / 2, this.height / 2 + 40, '15px');
        } else {
            // Draw Score at top
            this.drawText(this.score, 20, 30, '15px', 'left');
        }
    }
}
