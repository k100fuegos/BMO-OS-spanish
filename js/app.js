class App {
    constructor() {
        this.state = 'BOOTING'; // BOOTING, IDLE, MENU, PLAYING
        this.bmoFace = new BmoFace();
        
        // DOM Elements
        this.screens = {
            boot: document.getElementById('boot-screen'),
            face: document.getElementById('face-screen'),
            menu: document.getElementById('menu-screen'),
            game: document.getElementById('game-screen')
        };
        
        this.menuList = document.querySelectorAll('.menu-item');
        this.menuIndex = 0;
        
        this.currentGame = null;
        
        // Games Dictionary
        this.games = {
            'snake': SnakeGame,
            'flappy': FlappyBirdGame,
            'pacman': PacmanLiteGame
        };

        this.lastInputTime = performance.now();
        this.isSleeping = false;
        
        this.konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
        this.konamiIndex = 0;
        
        this.lastRandomPhraseTime = performance.now();
        this.nextRandomPhraseDelay = 15000 + Math.random() * 20000;
        
        this.init();
    }

    init() {
        this.lastTime = performance.now();
        this.fpsInterval = 1000 / 60; // Bloquear a 60 FPS
        
        // Run Boot Sequence
        this.runBootSequence();
        
        // Main Loop
        requestAnimationFrame((t) => this.loop(t));
    }

    runBootSequence() {
        const progress = document.getElementById('boot-progress');
        const prompt = document.getElementById('boot-prompt');
        let width = 0;
        
        const interval = setInterval(() => {
            width += Math.random() * 15;
            if (width >= 100) {
                width = 100;
                clearInterval(interval);
                
                if (prompt) prompt.classList.remove('hidden');
                
                const startUp = () => {
                    document.removeEventListener('keydown', startUp);
                    document.removeEventListener('click', startUp);
                    audioManager.playBgMusic();
                    this.switchState('IDLE');
                };
                
                document.addEventListener('keydown', startUp);
                document.addEventListener('click', startUp);
            }
            progress.style.width = width + '%';
        }, 200);
    }

    switchState(newState, silent = false) {
        this.state = newState;
        
        // Hide all screens
        Object.values(this.screens).forEach(screen => screen.classList.add('hidden'));
        document.getElementById('close-instruction').classList.add('hidden');

        if (newState === 'IDLE') {
            this.screens.face.classList.remove('hidden');
            this.bmoFace.startIdleRoutine();
            if (!silent) audioManager.play('hello');
        } else if (newState === 'MENU') {
            this.bmoFace.stopIdleRoutine();
            this.screens.menu.classList.remove('hidden');
            this.updateMenuSelection();
        } else if (newState === 'PLAYING') {
            this.screens.game.classList.remove('hidden');
            document.getElementById('close-instruction').classList.remove('hidden');
            // Face might react in the background or we just hide it
        }
    }

    updateMenuSelection() {
        this.menuList.forEach((el, index) => {
            if (index === this.menuIndex) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    }

    loop(timestamp) {
        requestAnimationFrame((t) => this.loop(t));

        if (!timestamp) timestamp = performance.now();
        const elapsed = timestamp - this.lastTime;
        
        if (elapsed < this.fpsInterval) {
            return;
        }
        
        this.lastTime = timestamp - (elapsed % this.fpsInterval);

        controller.update();

        // Check global input for inactivity timer
        if (controller.anyJustPressed()) {
            this.lastInputTime = timestamp;
            if (this.state !== 'PLAYING' && this.state !== 'BOOTING') {
                audioManager.play('click');
            }
            if (this.isSleeping) {
                this.wakeUp();
                return; // skip this frame input handling to avoid accidental presses
            }
        }

        // Sleep after 3 minutes (180,000 ms)
        if (!this.isSleeping && this.state === 'IDLE' && (timestamp - this.lastInputTime > 180000)) {
            this.goToSleep();
        }

        // Konami Code Check solo en IDLE
        let konamiHandled = false;
        if (this.state === 'IDLE') {
            const allButtons = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'exit'];
            for (let btn of allButtons) {
                if (controller.justPressed(btn)) {
                    if (btn === this.konamiCode[this.konamiIndex]) {
                        this.konamiIndex++;
                        konamiHandled = true;
                        
                        if (this.konamiIndex === this.konamiCode.length) {
                            this.triggerEasterEgg();
                            this.konamiIndex = 0;
                        }
                    } else {
                        this.konamiIndex = (btn === 'up') ? 1 : 0;
                        if (this.konamiIndex === 1) konamiHandled = true;
                    }
                }
            }
        }

        if (this.isSleeping) return; // Don't handle normal input if sleeping

        if (this.state === 'IDLE') {
            // Random phrases while idle
            if (timestamp - this.lastRandomPhraseTime > this.nextRandomPhraseDelay) {
                const phrases = ['risa_loco', 'si_bmo', 'abuelito', 'asalto', 'joke'];
                const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
                audioManager.play(randomPhrase);
                this.lastRandomPhraseTime = timestamp;
                this.nextRandomPhraseDelay = 15000 + Math.random() * 20000;
            }

            // Any key press goes to menu, a menos que estemos tecleando el código Konami
            if (!konamiHandled && (controller.justPressed('start') || controller.justPressed('a') || controller.justPressed('b'))) {
                this.switchState('MENU');
            }
        } 
        else if (this.state === 'MENU') {
            if (controller.justPressed('up')) {
                this.menuIndex = (this.menuIndex - 1 + this.menuList.length) % this.menuList.length;
                audioManager.play('menu_move');
                this.updateMenuSelection();
            }
            if (controller.justPressed('down')) {
                this.menuIndex = (this.menuIndex + 1) % this.menuList.length;
                audioManager.play('menu_move');
                this.updateMenuSelection();
            }
            if (controller.justPressed('a') || controller.justPressed('start')) {
                audioManager.play('menu_select');
                this.launchGame();
            }
            if (controller.justPressed('b') || controller.justPressed('exit')) {
                this.switchState('IDLE', true); // Go back quietly
            }
        }
        else if (this.state === 'PLAYING') {
            // Exit game
            if (controller.justPressed('start') || controller.justPressed('exit')) {
                this.stopGame();
            } else if (this.currentGame) {
                this.currentGame.update(controller);
                this.currentGame.draw();
            }
        }

        // Global exit app (if running in Electron or window wrapper)
        if (controller.justPressed('exit') && this.state !== 'PLAYING') {
            // Se puede integrar con window.close() si es web o ipcRenderer si es Electron
            // console.log("Exit app requested");
            // window.close(); 
        }
    }

    launchGame() {
        const gameId = this.menuList[this.menuIndex].dataset.game;
        const GameClass = this.games[gameId];
        
        if (GameClass) {
            this.switchState('PLAYING');
            const canvas = document.getElementById('game-canvas');
            this.currentGame = new GameClass(canvas);
            this.currentGame.start();
            
            // Cambiar la música de fondo a la del juego
            audioManager.playBgMusic(true);
        }
    }

    stopGame() {
        let won = false;
        let lost = false;

        if (this.currentGame) {
            // Si el juego tiene una propiedad win (Pacman) o una puntuación mayor a 7 (Snake/Flappy)
            if (this.currentGame.win || (this.currentGame.score !== undefined && this.currentGame.score > 7)) {
                won = true;
            } else {
                // Cualquier otra cosa (incluyendo salir antes de tiempo con poco puntaje) cuenta como perder
                lost = true;
            }
            
            this.currentGame.stop();
            this.currentGame = null;
        }
        
        // Regresamos a la música normal
        audioManager.playBgMusic(false);
        
        // Regresamos al menú (IDLE) y reproducimos una reacción diferente
        this.switchState('IDLE', true);
        
        if (won) {
            this.bmoFace.setEmotion('laugh', 5000);
        } else if (lost) {
            this.bmoFace.setEmotion('cry', 5000);
        }
    }

    goToSleep() {
        this.isSleeping = true;
        this.switchState('IDLE', true);
        this.bmoFace.setEmotion('sleep', 0); // infinite duration
    }

    wakeUp() {
        this.isSleeping = false;
        this.bmoFace.setEmotion('normal');
        audioManager.play('welcome');
    }

    triggerEasterEgg() {
        console.log("¡Código Konami activado!");
        
        // Volver a la cara si estábamos en menú
        if (this.state !== 'IDLE') {
            this.switchState('IDLE', true);
        }

        // BMO se ríe a carcajadas
        this.bmoFace.setEmotion('laugh', 4000);
        
        // Animación secreta: La cara da una vuelta completa (360 grados) desde su centro
        const face = document.getElementById('face-container');
        gsap.to(face, { 
            rotation: 360, 
            scale: 1.5,
            duration: 1.5,
            transformOrigin: "50% 50%", 
            ease: "back.out(1.7)",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                gsap.set(face, { rotation: 0, scale: 1 }); // reset
            }
        });
    }
}

// Start when document is ready
window.addEventListener('DOMContentLoaded', () => {
    window.bmoApp = new App();
});
