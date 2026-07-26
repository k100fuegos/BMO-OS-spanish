/**
 * BMO OS - Controller & Keyboard Manager (Guías Dinámicas por Mando / Teclado)
 */
class ControllerManager {
    constructor() {
        this.keyboardKeys = {
            up: false,
            down: false,
            left: false,
            right: false,
            a: false,     // Tecla J / Botón A
            b: false,     // Tecla K / Botón B
            start: false, // Tecla L / Botón Start
            exit: false   // Escape
        };

        this.keys = { ...this.keyboardKeys };
        this.previousKeys = { ...this.keys };
        
        this.gamepadIndex = null;
        this.gamepadName = '';
        this.activeDevice = 'keyboard'; // 'keyboard', 'xbox', 'playstation', 'switch', 'gamepad'

        this.deviceGuides = {
            keyboard: {
                name: 'Teclado',
                faceHTML: 'Presiona <kbd class="bmo-badge badge-start">L</kbd> para el Menú',
                menuHTML: '<span class="arrow-group"><kbd class="bmo-badge sm badge-arrow">W</kbd><kbd class="bmo-badge sm badge-arrow">A</kbd><kbd class="bmo-badge sm badge-arrow">S</kbd><kbd class="bmo-badge sm badge-arrow">D</kbd></span> Navegar &nbsp;|&nbsp; <kbd class="bmo-badge badge-a">J</kbd> Entrar &nbsp;|&nbsp; <kbd class="bmo-badge badge-b">K</kbd> Volver',
                gameHTML: 'Presiona <kbd class="bmo-badge badge-start">L</kbd> para salir al menú',
                appHTML: 'Presiona <kbd class="bmo-badge badge-start">L</kbd> para volver al menú',
                restartText: 'Presiona J para reiniciar',
                restartBtnLabel: 'J'
            },
            xbox: {
                name: 'Xbox Controller',
                faceHTML: 'Presiona <kbd class="bmo-badge badge-start">START</kbd> para el Menú',
                menuHTML: '<span class="arrow-group"><kbd class="bmo-badge sm badge-arrow">▲</kbd><kbd class="bmo-badge sm badge-arrow">◀</kbd><kbd class="bmo-badge sm badge-arrow">▼</kbd><kbd class="bmo-badge sm badge-arrow">▶</kbd></span> Navegar &nbsp;|&nbsp; <kbd class="bmo-badge badge-a">A</kbd> Entrar &nbsp;|&nbsp; <kbd class="bmo-badge badge-b">B</kbd> Volver',
                gameHTML: 'Presiona <kbd class="bmo-badge badge-start">START</kbd> para salir al menú',
                appHTML: 'Presiona <kbd class="bmo-badge badge-start">START</kbd> para volver al menú',
                restartText: 'Presiona A para reiniciar',
                restartBtnLabel: 'A'
            },
            playstation: {
                name: 'PlayStation Controller',
                faceHTML: 'Presiona <kbd class="bmo-badge badge-start">OPTIONS</kbd> para el Menú',
                menuHTML: '<span class="arrow-group"><kbd class="bmo-badge sm badge-arrow">▲</kbd><kbd class="bmo-badge sm badge-arrow">◀</kbd><kbd class="bmo-badge sm badge-arrow">▼</kbd><kbd class="bmo-badge sm badge-arrow">▶</kbd></span> Navegar &nbsp;|&nbsp; <kbd class="bmo-badge badge-a">✕</kbd> Entrar &nbsp;|&nbsp; <kbd class="bmo-badge badge-b">◯</kbd> Volver',
                gameHTML: 'Presiona <kbd class="bmo-badge badge-start">OPTIONS</kbd> para salir al menú',
                appHTML: 'Presiona <kbd class="bmo-badge badge-start">OPTIONS</kbd> para volver al menú',
                restartText: 'Presiona ✕ para reiniciar',
                restartBtnLabel: '✕'
            },
            switch: {
                name: 'Switch Pro Controller',
                faceHTML: 'Presiona <kbd class="bmo-badge badge-start">+</kbd> para el Menú',
                menuHTML: '<span class="arrow-group"><kbd class="bmo-badge sm badge-arrow">▲</kbd><kbd class="bmo-badge sm badge-arrow">◀</kbd><kbd class="bmo-badge sm badge-arrow">▼</kbd><kbd class="bmo-badge sm badge-arrow">▶</kbd></span> Navegar &nbsp;|&nbsp; <kbd class="bmo-badge badge-a">A</kbd> Entrar &nbsp;|&nbsp; <kbd class="bmo-badge badge-b">B</kbd> Volver',
                gameHTML: 'Presiona <kbd class="bmo-badge badge-start">+</kbd> para salir al menú',
                appHTML: 'Presiona <kbd class="bmo-badge badge-start">+</kbd> para volver al menú',
                restartText: 'Presiona A para reiniciar',
                restartBtnLabel: 'A'
            },
            gamepad: {
                name: 'Mando USB',
                faceHTML: 'Presiona <kbd class="bmo-badge badge-start">START</kbd> para el Menú',
                menuHTML: '<span class="arrow-group"><kbd class="bmo-badge sm badge-arrow">▲</kbd><kbd class="bmo-badge sm badge-arrow">◀</kbd><kbd class="bmo-badge sm badge-arrow">▼</kbd><kbd class="bmo-badge sm badge-arrow">▶</kbd></span> Navegar &nbsp;|&nbsp; <kbd class="bmo-badge badge-a">A</kbd> Entrar &nbsp;|&nbsp; <kbd class="bmo-badge badge-b">B</kbd> Volver',
                gameHTML: 'Presiona <kbd class="bmo-badge badge-start">START</kbd> para salir al menú',
                appHTML: 'Presiona <kbd class="bmo-badge badge-start">START</kbd> para volver al menú',
                restartText: 'Presiona A para reiniciar',
                restartBtnLabel: 'A'
            }
        };

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        window.addEventListener("gamepadconnected", (e) => {
            console.log("🎮 Control conectado:", e.gamepad.id, "Índice:", e.gamepad.index);
            this.gamepadIndex = e.gamepad.index;
            this.gamepadName = e.gamepad.id || 'Mando Estándar';
            const deviceType = this.detectDeviceType(this.gamepadName);
            this.setDevice(deviceType);
            this.showHUDNotification(`🎮 Mando Conectado: ${this.deviceGuides[deviceType].name}`);
            this.triggerRumble(150, 0.4, 0.8);
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("🎮 Control desconectado:", e.gamepad.index);
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                this.gamepadName = '';
                this.setDevice('keyboard');
                this.showHUDNotification("⚠️ Mando Desconectado");
            }
        });

        // Actualizar UI inicial al cargar DOM
        document.addEventListener('DOMContentLoaded', () => {
            this.updateUIInstructions();
        });
    }

    detectDeviceType(name) {
        if (!name) return 'gamepad';
        const lower = name.toLowerCase();
        if (lower.includes("dualsense") || lower.includes("wireless controller") || lower.includes("playstation") || lower.includes("dualshock") || lower.includes("ps4") || lower.includes("ps5")) {
            return 'playstation';
        }
        if (lower.includes("pro controller") || lower.includes("switch") || lower.includes("nintendo")) {
            return 'switch';
        }
        if (lower.includes("xbox")) {
            return 'xbox';
        }
        return 'gamepad';
    }

    setDevice(deviceType) {
        if (this.activeDevice !== deviceType) {
            this.activeDevice = deviceType;
            this.updateUIInstructions();
        }
    }

    updateUIInstructions() {
        const guide = this.deviceGuides[this.activeDevice] || this.deviceGuides.keyboard;

        // 1. Instrucciones de la cara de BMO
        const faceInst = document.querySelector('.face-instructions');
        if (faceInst && guide.faceHTML) faceInst.innerHTML = guide.faceHTML;

        // 2. Instrucciones del menú principal
        const menuInst = document.querySelector('.menu-instructions');
        if (menuInst && guide.menuHTML) menuInst.innerHTML = guide.menuHTML;

        // 3. Barra del juego activo
        const inGameBar = document.querySelector('.in-game-bar');
        if (inGameBar && guide.gameHTML) inGameBar.innerHTML = guide.gameHTML;

        // 4. Instrucciones del Teatro de Emociones
        const appInst = document.querySelector('.app-instructions');
        if (appInst && guide.appHTML) appInst.innerHTML = guide.appHTML;
    }

    getRestartGuideText() {
        const guide = this.deviceGuides[this.activeDevice] || this.deviceGuides.keyboard;
        return guide.restartText;
    }

    getRestartButtonLabel() {
        const guide = this.deviceGuides[this.activeDevice] || this.deviceGuides.keyboard;
        return guide.restartBtnLabel || 'J';
    }

    cleanGamepadName(name) {
        const type = this.detectDeviceType(name);
        return this.deviceGuides[type].name;
    }

    showHUDNotification(msg) {
        let hud = document.getElementById('gamepad-hud');
        if (!hud) {
            hud = document.createElement('div');
            hud.id = 'gamepad-hud';
            document.body.appendChild(hud);
        }
        hud.textContent = msg;
        hud.classList.add('show');
        clearTimeout(this.hudTimer);
        this.hudTimer = setTimeout(() => {
            hud.classList.remove('show');
        }, 3000);
    }

    handleKey(e, isPressed) {
        if (["Space", "Enter", "Backspace", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }

        // Al presionar cualquier tecla del teclado → cambiar guías a Teclado automáticamente
        if (isPressed) {
            this.setDevice('keyboard');
        }

        if (e.key === "Escape") {
            this.keyboardKeys.exit = isPressed;
        }

        const key = e.key.toLowerCase();
        switch(key) {
            case 'w': case 'arrowup': 
                this.keyboardKeys.up = isPressed; break;
            case 's': case 'arrowdown': 
                this.keyboardKeys.down = isPressed; break;
            case 'a': case 'arrowleft': 
                this.keyboardKeys.left = isPressed; break;
            case 'd': case 'arrowright': 
                this.keyboardKeys.right = isPressed; break;
            case 'j': case ' ': case 'enter': 
                this.keyboardKeys.a = isPressed; break;
            case 'k': case 'backspace': 
                this.keyboardKeys.b = isPressed; break;
            case 'l': 
                this.keyboardKeys.start = isPressed; break;
        }
    }

    update() {
        this.previousKeys = { ...this.keys };
        this.keys = { ...this.keyboardKeys };

        // Auto-detección de gamepad
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (this.gamepadIndex === null) {
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    this.gamepadIndex = i;
                    this.gamepadName = gamepads[i].id;
                    break;
                }
            }
        }

        if (this.gamepadIndex !== null) {
            const gamepad = gamepads[this.gamepadIndex];
            
            if (gamepad) {
                const btn = (idx) => gamepad.buttons.length > idx && gamepad.buttons[idx].pressed;

                let gamepadInputActive = false;
                const deadZone = 0.35;

                if (gamepad.axes.length >= 2) {
                    if (gamepad.axes[0] < -deadZone) { this.keys.left = true; gamepadInputActive = true; }
                    if (gamepad.axes[0] > deadZone) { this.keys.right = true; gamepadInputActive = true; }
                    if (gamepad.axes[1] < -deadZone) { this.keys.up = true; gamepadInputActive = true; }
                    if (gamepad.axes[1] > deadZone) { this.keys.down = true; gamepadInputActive = true; }
                }

                if (btn(12)) { this.keys.up = true; gamepadInputActive = true; }
                if (btn(13)) { this.keys.down = true; gamepadInputActive = true; }
                if (btn(14)) { this.keys.left = true; gamepadInputActive = true; }
                if (btn(15)) { this.keys.right = true; gamepadInputActive = true; }

                if (btn(0) || btn(2)) { this.keys.a = true; gamepadInputActive = true; }
                if (btn(1) || btn(3)) { this.keys.b = true; gamepadInputActive = true; }
                if (btn(9)) { this.keys.start = true; gamepadInputActive = true; }
                if (btn(8)) { this.keys.exit = true; gamepadInputActive = true; }

                // Si se interactúa con el mando → cambiar guías automáticamente al tipo de mando
                if (gamepadInputActive) {
                    const deviceType = this.detectDeviceType(this.gamepadName || gamepad.id);
                    this.setDevice(deviceType);
                }
            } else {
                this.gamepadIndex = null;
            }
        }
    }

    justPressed(button) {
        return this.keys[button] && !this.previousKeys[button];
    }

    anyJustPressed() {
        return Object.keys(this.keys).some(k => this.justPressed(k));
    }

    flush() {
        Object.keys(this.keyboardKeys).forEach(k => {
            this.keyboardKeys[k] = false;
        });
        this.update();
        this.previousKeys = { ...this.keys };
    }

    triggerRumble(durationMs = 100, weakMagnitude = 0.5, strongMagnitude = 0.5) {
        if (this.gamepadIndex === null) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gamepad = gamepads[this.gamepadIndex];
        
        if (gamepad && gamepad.vibrationActuator) {
            try {
                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: durationMs,
                    weakMagnitude: weakMagnitude,
                    strongMagnitude: strongMagnitude
                });
            } catch (e) {}
        }
    }
}

const controller = new ControllerManager();
