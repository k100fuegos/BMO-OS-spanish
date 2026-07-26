/**
 * BMO OS - GameEngine Base Class
 * Motor base para todos los juegos retro con persistencia de High Score y utilidades gráficas.
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.isRunning = false;
        
        // Paleta retro oficial BMO
        this.colors = {
            bg: '#8fad8a',      // Verde BMO oscuro pantalla
            fg: '#2c4c3b',      // Verde texto BMO oscuro
            highlight: '#d0f0c0', // Verde brillante BMO
            accentRed: '#e74c3c',
            accentYellow: '#f1c40f'
        };
    }

    start() {
        this.isRunning = true;
        this.reset();
    }

    stop() {
        this.isRunning = false;
    }

    reset() {
        // Implementar en clase hija
    }

    update(controller) {
        // Implementar en clase hija
    }

    draw() {
        // Implementar en clase hija
        this.clear();
    }

    clear() {
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawText(text, x, y, size = '20px', align = 'center', color = this.colors.fg) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size} "Press Start 2P", monospace`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.fillText(text, x, y);
    }

    /**
     * Dibuja un botón retro 2D estilizado en el Canvas para la pantalla de Game Over.
     */
    drawRestartPrompt(x, y, customText = '') {
        const btnLabel = (typeof controller !== 'undefined' && controller.getRestartButtonLabel) 
            ? controller.getRestartButtonLabel() 
            : 'J';

        const prefix = customText ? customText : "PRESIONA ";
        const suffix = customText ? "" : " PARA REINICIAR";

        this.ctx.font = '12px "Press Start 2P", monospace';
        const prefixWidth = this.ctx.measureText(prefix).width;
        const suffixWidth = suffix ? this.ctx.measureText(suffix).width : 0;
        const btnWidth = Math.max(28, Math.round(this.ctx.measureText(btnLabel).width) + 12);
        const btnHeight = 24;

        const totalWidth = prefixWidth + btnWidth + suffixWidth;
        let startX = Math.round(x - totalWidth / 2);

        // Dibujar prefix
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(prefix, startX, y);
        startX += prefixWidth;

        // Dibujar Botón 3D Retro en Canvas
        const badgeY = Math.round(y - btnHeight / 2);
        this.ctx.fillStyle = '#257545';
        if (this.ctx.roundRect) {
            this.ctx.beginPath();
            this.ctx.roundRect(startX, badgeY, btnWidth, btnHeight, 6);
            this.ctx.fill();
            this.ctx.strokeStyle = '#d0f0c0';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            this.ctx.fillRect(startX, badgeY, btnWidth, btnHeight);
            this.ctx.strokeStyle = '#d0f0c0';
            this.ctx.strokeRect(startX, badgeY, btnWidth, btnHeight);
        }

        // Texto del Botón perfectamente centrado (horizontal y verticalmente)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const centerX = startX + btnWidth / 2;
        const centerY = badgeY + btnHeight / 2;
        this.ctx.fillText(btnLabel, centerX, centerY);

        // Dibujar suffix
        if (suffix) {
            startX += btnWidth + 6;
            this.ctx.fillStyle = this.colors.fg;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(suffix, startX, y);
        }
    }

    // Almacenamiento local de Puntuaciones Máximas (High Scores)
    getHighScore(gameKey) {
        try {
            return parseInt(localStorage.getItem(`bmo_highscore_${gameKey}`)) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore(gameKey, score) {
        const currentHigh = this.getHighScore(gameKey);
        if (score > currentHigh) {
            try {
                localStorage.setItem(`bmo_highscore_${gameKey}`, score);
            } catch (e) {}
            return true;
        }
        return false;
    }
}
