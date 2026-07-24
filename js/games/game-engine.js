class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.isRunning = false;
        
        // Standard retro colors matching BMO palette
        this.colors = {
            bg: '#8fad8a',
            fg: '#2c4c3b'
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
        // override in child
    }

    update(controller) {
        // override in child
    }

    draw() {
        // override in child
        this.clear();
    }

    clear() {
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawText(text, x, y, size = '20px', align = 'center') {
        this.ctx.fillStyle = this.colors.fg;
        this.ctx.font = `${size} "Press Start 2P", monospace`;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }
}
