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
        this.ctx.fillText(text, x, y);
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
