/**
 * BMO OS - Controller & Keyboard Manager (Corregido)
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
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        window.addEventListener("gamepadconnected", (e) => {
            console.log("🎮 Control conectado:", e.gamepad.id, "Índice:", e.gamepad.index);
            this.gamepadIndex = e.gamepad.index;
            this.gamepadName = e.gamepad.id || 'Mando Estándar';
            this.showHUDNotification(`🎮 Mando Conectado: ${this.cleanGamepadName(this.gamepadName)}`);
            this.triggerRumble(150, 0.4, 0.8);
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("🎮 Control desconectado:", e.gamepad.index);
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                this.gamepadName = '';
                this.showHUDNotification("⚠️ Mando Desconectado");
            }
        });
    }

    cleanGamepadName(name) {
        if (name.includes("Xbox")) return "Xbox Controller";
        if (name.includes("DualSense") || name.includes("Wireless Controller")) return "PlayStation Controller";
        if (name.includes("Pro Controller")) return "Switch Pro Controller";
        return "Mando USB";
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
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
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

        // Auto-detección de gamepad si estuvo conectado previamente antes del evento
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

                const deadZone = 0.35;
                if (gamepad.axes.length >= 2) {
                    if (gamepad.axes[0] < -deadZone) this.keys.left = true;
                    if (gamepad.axes[0] > deadZone) this.keys.right = true;
                    if (gamepad.axes[1] < -deadZone) this.keys.up = true;
                    if (gamepad.axes[1] > deadZone) this.keys.down = true;
                }

                this.keys.up = this.keys.up || btn(12);
                this.keys.down = this.keys.down || btn(13);
                this.keys.left = this.keys.left || btn(14);
                this.keys.right = this.keys.right || btn(15);

                this.keys.a = this.keys.a || btn(0) || btn(2);
                this.keys.b = this.keys.b || btn(1) || btn(3);
                this.keys.start = this.keys.start || btn(9);
                this.keys.exit = this.keys.exit || btn(8);
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
