class ControllerManager {
    constructor() {
        this.keyboardKeys = {
            up: false,
            down: false,
            left: false,
            right: false,
            a: false, // J
            b: false, // K
            start: false, // L
            exit: false // Esc or Alt+F4 logic
        };

        this.keys = { ...this.keyboardKeys };
        this.previousKeys = { ...this.keys };
        
        this.gamepadIndex = null;
        this.init();
    }

    init() {
        // Keyboard Support
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Gamepad Support (Xbox Controller)
        window.addEventListener("gamepadconnected", (e) => {
            console.log("Controlador conectado en el índice %d: %s.", e.gamepad.index, e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("Controlador desconectado del índice %d.", e.gamepad.index);
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }

    handleKey(e, isPressed) {
        if (e.key === "Escape") {
            this.keyboardKeys.exit = isPressed;
        }

        switch(e.key.toLowerCase()) {
            case 'w': this.keyboardKeys.up = isPressed; break;
            case 's': this.keyboardKeys.down = isPressed; break;
            case 'a': this.keyboardKeys.left = isPressed; break;
            case 'd': this.keyboardKeys.right = isPressed; break;
            case 'j': this.keyboardKeys.a = isPressed; break;
            case 'k': this.keyboardKeys.b = isPressed; break;
            case 'l': this.keyboardKeys.start = isPressed; break;
        }
    }

    update() {
        // Guardar estado anterior para detectar "just pressed" (presionado este frame)
        this.previousKeys = { ...this.keys };

        // Reiniciar las teclas al estado actual del teclado
        this.keys = { ...this.keyboardKeys };

        if (this.gamepadIndex !== null) {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (gamepad) {
                // Función segura para leer botones (evita crasheos si el mando tiene menos botones)
                const btn = (idx) => gamepad.buttons.length > idx && gamepad.buttons[idx].pressed;

                // Ejes de joystick izquierdo
                if (gamepad.axes.length >= 2) {
                    this.keys.left = this.keys.left || gamepad.axes[0] < -0.5;
                    this.keys.right = this.keys.right || gamepad.axes[0] > 0.5;
                    this.keys.up = this.keys.up || gamepad.axes[1] < -0.5;
                    this.keys.down = this.keys.down || gamepad.axes[1] > 0.5;
                }

                // D-PAD
                this.keys.left = this.keys.left || btn(14);
                this.keys.right = this.keys.right || btn(15);
                this.keys.up = this.keys.up || btn(12);
                this.keys.down = this.keys.down || btn(13);

                // Botones (A, B, Menu)
                this.keys.a = this.keys.a || btn(0); // A button
                this.keys.b = this.keys.b || btn(1); // B button
                this.keys.start = this.keys.start || btn(9); // Menu button
            }
        }
    }

    justPressed(button) {
        return this.keys[button] && !this.previousKeys[button];
    }

    anyJustPressed() {
        return Object.keys(this.keys).some(k => this.justPressed(k));
    }
}

const controller = new ControllerManager();
