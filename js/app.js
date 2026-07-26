/**
 * BMO OS - App State Machine
 * 
 * GIRO KONAMI: Usa CSS @keyframes (NO GSAP).
 * Así es IMPOSIBLE que cualquier tween de GSAP lo sobreescriba.
 */
class App {
    constructor() {
        this.state = 'BOOTING';
        this.bmoFace = new BmoFace();

        this.screens = {
            boot: document.getElementById('boot-screen'),
            face: document.getElementById('face-screen'),
            menu: document.getElementById('menu-screen'),
            game: document.getElementById('game-screen'),
            emotion: document.getElementById('emotion-screen')
        };

        this.menuList = document.querySelectorAll('.menu-item');
        this.menuIndex = 0;
        this.currentGame = null;

        this.games = {
            'snake': SnakeGame,
            'flappy': FlappyBirdGame,
            'pacman': PacmanLiteGame,
            'guardians': GuardiansGame,
            'pong': PongGame
        };

        this.lastInputTime = performance.now();
        this.isSleeping = false;
        this.konamiSpinning = false;

        // Konami: W W S S A D A D K J
        this.konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
        this.konamiIndex = 0;

        this.lastRandomPhraseTime = performance.now();
        this.nextRandomPhraseDelay = 15000 + Math.random() * 20000;

        this.emoIndex = 0;
        this.emoBtns = document.querySelectorAll('.emo-btn');
        this.emoNames = ['normal', 'happy', 'laugh', 'cry', 'dance', 'sleep'];

        this.init();
    }

    init() {
        this.lastTime = performance.now();
        this.fpsInterval = 1000 / 60;
        this.bindEvents();
        this.runBootSequence();
        requestAnimationFrame((t) => this.loop(t));
    }

    bindEvents() {
        this.menuList.forEach((el, index) => {
            el.addEventListener('click', () => {
                this.menuIndex = index;
                this.updateMenuSelection();
                audioManager.playChiptuneSfx('menu_select');
                this.launchAppOrGame();
            });
        });

        this.emoBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.emoIndex = index;
                this.updateEmotionSelection();
                const emo = this.emoNames[index];
                this._showFaceScreen();
                this.bmoFace.setEmotion(emo, emo === 'sleep' ? 0 : 5000);
                if (emo === 'sleep') this.isSleeping = true;
            });
        });

        const faceContainer = document.getElementById('face-container');
        if (faceContainer) {
            // Listener para cuando termine la animación CSS del giro Konami
            faceContainer.addEventListener('animationend', (e) => {
                if (e.animationName === 'konami-spin') {
                    this._onKonamiSpinComplete();
                }
            });
        }
    }

    runBootSequence() {
        const progress = document.getElementById('boot-progress');
        const prompt = document.getElementById('boot-prompt');
        let width = 0;
        this.bootReady = false;

        const interval = setInterval(() => {
            width += Math.random() * 18;
            if (width >= 100) {
                width = 100;
                clearInterval(interval);
                if (prompt) prompt.classList.remove('hidden');
                this.bootReady = true;

                // Keyboard o click: listener directo
                const startUp = (e) => {
                    if (!this.bootReady) return;
                    if (e && e.preventDefault) e.preventDefault();
                    this.bootReady = false;
                    document.removeEventListener('keydown', startUp);
                    document.removeEventListener('click', startUp);
                    this._completeBoot();
                };
                document.addEventListener('keydown', startUp);
                document.addEventListener('click', startUp);
            }
            if (progress) progress.style.width = width + '%';
        }, 150);
    }

    /**
     * Completa el boot y envía al usuario directamente a la CARA de BMO.
     * Funciona con cualquier input: teclado, ratón o mando.
     */
    _completeBoot() {
        controller.flush();
        audioManager.playBgMusic();
        this.switchState('IDLE');
    }

    _showFaceScreen() {
        this.state = 'IDLE';
        Object.values(this.screens).forEach(s => { if (s) s.classList.add('hidden'); });
        this.screens.face.classList.remove('hidden');
    }

    switchState(newState, silent = false) {
        if (typeof controller !== 'undefined' && controller.flush) {
            controller.flush();
        }
        this.state = newState;
        Object.values(this.screens).forEach(s => { if (s) s.classList.add('hidden'); });

        if (newState === 'IDLE') {
            this.screens.face.classList.remove('hidden');
            if (!this.isSleeping && !this.konamiSpinning) {
                this.bmoFace.startIdleRoutine();
                if (!silent) audioManager.play('hello');
            }
        } else if (newState === 'MENU') {
            this.bmoFace.stopIdleRoutine();
            this.screens.menu.classList.remove('hidden');
            this.updateMenuSelection();
        } else if (newState === 'PLAYING') {
            this.screens.game.classList.remove('hidden');
        } else if (newState === 'EMOTION') {
            this.screens.emotion.classList.remove('hidden');
            this.updateEmotionSelection();
        }
    }

    updateMenuSelection() {
        this.menuList.forEach((el, i) => {
            el.classList.toggle('selected', i === this.menuIndex);
        });
    }

    updateEmotionSelection() {
        this.emoBtns.forEach((btn, i) => {
            btn.classList.toggle('active', i === this.emoIndex);
        });
    }

    loop(timestamp) {
        requestAnimationFrame((t) => this.loop(t));
        if (!timestamp) timestamp = performance.now();
        const elapsed = timestamp - this.lastTime;
        if (elapsed < this.fpsInterval) return;
        this.lastTime = timestamp - (elapsed % this.fpsInterval);

        controller.update();

        // Durante el boot, detectar cualquier input de mando para completar el arranque
        if (this.state === 'BOOTING' && this.bootReady) {
            if (controller.anyJustPressed()) {
                this.bootReady = false;
                this._completeBoot();
                return;
            }
            return; // No procesar nada más durante boot
        }

        // Si está girando por el Konami, no procesar nada
        if (this.konamiSpinning) return;

        if (controller.anyJustPressed()) {
            this.lastInputTime = timestamp;
            if (this.state !== 'PLAYING') {
                audioManager.playChiptuneSfx('click');
            }
            if (this.isSleeping) {
                this.wakeUp();
                return;
            }
        }

        // Auto-dormir tras 3 min sin input
        if (!this.isSleeping && this.state === 'IDLE' && (timestamp - this.lastInputTime > 180000)) {
            this.goToSleep();
        }

        // ── DETECCIÓN KONAMI ──
        let konamiHandled = false;
        if ((this.state === 'IDLE' || this.state === 'MENU') && !this.isSleeping) {
            const inputs = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'exit'];
            for (const btn of inputs) {
                if (controller.justPressed(btn)) {
                    const expected = this.konamiCode[this.konamiIndex];
                    if (btn === expected) {
                        this.konamiIndex++;
                        konamiHandled = true;
                        if (this.konamiIndex === this.konamiCode.length) {
                            this.konamiIndex = 0;
                            this.triggerEasterEgg();
                            return;
                        }
                    } else {
                        this.konamiIndex = (btn === 'up') ? 1 : 0;
                        if (this.konamiIndex === 1) konamiHandled = true;
                    }
                    break;
                }
            }
        }

        if (this.isSleeping) return;

        // ── LÓGICA POR ESTADO ──
        if (this.state === 'IDLE') {
            if (timestamp - this.lastRandomPhraseTime > this.nextRandomPhraseDelay) {
                const phrases = ['risa_loco', 'si_bmo', 'abuelito', 'asalto', 'joke'];
                audioManager.play(phrases[Math.floor(Math.random() * phrases.length)]);
                this.lastRandomPhraseTime = timestamp;
                this.nextRandomPhraseDelay = 15000 + Math.random() * 20000;
            }
            // Solo L/Start abre el menú desde la cara de BMO
            if (!konamiHandled && controller.justPressed('start')) {
                this.switchState('MENU');
            }
        }
        else if (this.state === 'MENU') {
            if (controller.justPressed('up')) {
                this.menuIndex = (this.menuIndex - 1 + this.menuList.length) % this.menuList.length;
                audioManager.playChiptuneSfx('menu_move');
                this.updateMenuSelection();
            }
            if (controller.justPressed('down')) {
                this.menuIndex = (this.menuIndex + 1) % this.menuList.length;
                audioManager.playChiptuneSfx('menu_move');
                this.updateMenuSelection();
            }
            if (!konamiHandled && controller.justPressed('a')) {
                audioManager.playChiptuneSfx('menu_select');
                this.launchAppOrGame();
            }
            if (controller.justPressed('b') || controller.justPressed('start') || controller.justPressed('exit')) {
                this.switchState('IDLE', true);
            }
        }
        else if (this.state === 'PLAYING') {
            if (controller.justPressed('start') || controller.justPressed('exit')) {
                this.stopGame();
            } else if (this.currentGame) {
                this.currentGame.update(controller);
                this.currentGame.draw();
            }
        }
        else if (this.state === 'EMOTION') {
            if (controller.justPressed('left') || controller.justPressed('up')) {
                this.emoIndex = (this.emoIndex - 1 + this.emoNames.length) % this.emoNames.length;
                this.updateEmotionSelection();
            }
            if (controller.justPressed('right') || controller.justPressed('down')) {
                this.emoIndex = (this.emoIndex + 1) % this.emoNames.length;
                this.updateEmotionSelection();
            }
            if (controller.justPressed('a')) {
                const emo = this.emoNames[this.emoIndex];
                this._showFaceScreen();
                this.bmoFace.setEmotion(emo, emo === 'sleep' ? 0 : 5000);
                if (emo === 'sleep') this.isSleeping = true;
                if (controller.triggerRumble) controller.triggerRumble(100, 0.5, 0.5);
            }
            if (controller.justPressed('b') || controller.justPressed('start') || controller.justPressed('exit')) {
                this.switchState('MENU');
            }
        }
    }

    launchAppOrGame() {
        if (!this.menuList[this.menuIndex]) return;
        const appKey = this.menuList[this.menuIndex].dataset.app;
        if (appKey === 'emotion') {
            this.switchState('EMOTION');
            return;
        }
        const GameClass = this.games[appKey];
        if (GameClass) {
            this.switchState('PLAYING');
            const canvas = document.getElementById('game-canvas');
            this.currentGame = new GameClass(canvas);
            this.currentGame.start();
            audioManager.playBgMusic(true);
        }
    }

    stopGame() {
        let won = false, lost = false;
        if (this.currentGame) {
            let gameScore = 0;
            if (typeof this.currentGame.score === 'number') {
                gameScore = this.currentGame.score;
            } else if (this.currentGame.player && typeof this.currentGame.player.score === 'number') {
                gameScore = this.currentGame.player.score;
            }

            // Regla de reacción al salir del juego:
            // - Si ganaste O hiciste más de 7 puntos -> BMO sale riendo ('laugh')
            // - Si perdiste O saliste con 0 puntos -> BMO sale llorando ('cry')
            if (this.currentGame.win || gameScore > 7) {
                won = true;
            } else if (this.currentGame.gameOver || gameScore === 0) {
                lost = true;
            }

            this.currentGame.stop();
            this.currentGame = null;
        }
        audioManager.playBgMusic(false);

        // Mostrar pantalla de la cara limpiamente
        this.bmoFace.stopIdleRoutine();
        this._showFaceScreen();

        if (won) {
            const winAudios = ['si_bmo', 'laugh', 'risa_loco'];
            const chosenWin = winAudios[Math.floor(Math.random() * winAudios.length)];
            if (chosenWin === 'laugh') {
                this.bmoFace.setEmotion('laugh', 4000);
            } else {
                audioManager.play(chosenWin);
            }
        } else if (lost) {
            this.bmoFace.setEmotion('cry', 5000);
        } else {
            this.bmoFace.startIdleRoutine();
        }
    }

    goToSleep() {
        this.isSleeping = true;
        this.bmoFace.stopIdleRoutine();
        this._showFaceScreen();
        this.bmoFace.setEmotion('sleep', 0);
    }

    wakeUp() {
        this.isSleeping = false;
        const container = document.getElementById('bmo-container');
        if (container) {
            container.classList.remove('bmo-sleeping');
            container.classList.add('bmo-awake');
        }
        this.bmoFace.setEmotion('normal');
        audioManager.play('welcome');
    }

    /**
     * EASTER EGG - GIRO 360° DEL CÓDIGO KONAMI
     * 
     * Usa CSS @keyframes en vez de GSAP.
     * Es IMPOSIBLE que cualquier tween de GSAP lo sobreescriba porque
     * CSS animations con !important tienen prioridad absoluta sobre
     * estilos inline que GSAP aplica.
     */
    triggerEasterEgg() {
        console.log("🌟 ¡Código Konami Activado!");

        const faceContainer = document.getElementById('face-container');
        if (!faceContainer) return;

        // 1. Bloquear todo input durante el giro
        this.konamiSpinning = true;

        // 2. Parar toda rutina idle y tweens de GSAP
        this.bmoFace.stopIdleRoutine();
        animManager.forceStop();

        // 3. Mostrar pantalla de la cara
        this._showFaceScreen();

        // 4. Limpiar TODOS los estilos inline de GSAP en face-container
        //    para que no bloqueen la animación CSS
        faceContainer.style.transform = '';
        faceContainer.style.cssText = '';

        // 5. Poner expresión de risa manualmente
        const mouthGroup = document.getElementById('mouth-group');
        const laughingMouth = document.getElementById('laughing-mouth');
        const halfOpenMouth = document.getElementById('half-open-mouth');
        const eyesGroup = document.getElementById('eyes');

        if (mouthGroup) mouthGroup.style.opacity = '0';
        if (halfOpenMouth) halfOpenMouth.style.opacity = '0';
        if (laughingMouth) laughingMouth.style.opacity = '1';
        if (eyesGroup) eyesGroup.style.transform = 'scaleY(0.85)';
        if (eyesGroup) eyesGroup.style.transformOrigin = 'center center';

        // 6. Audio festivo
        audioManager.play('si_bmo');
        audioManager.playChiptuneSfx('win');

        // 7. Iniciar giro CSS puro: agregar la clase que activa @keyframes
        //    Remover primero por si ya estaba (para poder re-triggerear)
        faceContainer.classList.remove('konami-spinning');
        // Forzar reflow para que el navegador registre la remoción
        void faceContainer.offsetWidth;
        // Ahora agregar la clase → dispara la animación @keyframes
        faceContainer.classList.add('konami-spinning');
    }

    /**
     * Callback cuando termina la animación CSS del giro Konami.
     * (Escuchado por el evento 'animationend' en bindEvents)
     */
    _onKonamiSpinComplete() {
        const faceContainer = document.getElementById('face-container');
        if (faceContainer) {
            faceContainer.classList.remove('konami-spinning');
            faceContainer.style.transform = '';
        }

        // Restaurar expresión normal
        const mouthGroup = document.getElementById('mouth-group');
        const laughingMouth = document.getElementById('laughing-mouth');
        const eyesGroup = document.getElementById('eyes');

        if (mouthGroup) mouthGroup.style.opacity = '1';
        if (laughingMouth) laughingMouth.style.opacity = '0';
        if (eyesGroup) { eyesGroup.style.transform = ''; eyesGroup.style.transformOrigin = ''; }

        // Desbloquear
        this.konamiSpinning = false;

        // Reiniciar rutina idle
        this.bmoFace.startIdleRoutine();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.bmoApp = new App();
});
