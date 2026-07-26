/**
 * BMO Face - Máquina de estados de expresiones faciales.
 * 
 * Todas las animaciones pasan por AnimationManager. Si hay una animación
 * de prioridad alta activa (sueño, konami), las rutinas idle se ignoran.
 */
class BmoFace {
    constructor() {
        this.eyes = {
            left: document.getElementById('left-eye'),
            right: document.getElementById('right-eye')
        };
        this.eyesGroup = document.getElementById('eyes');
        this.sadEyesGroup = document.getElementById('sad-eyes');

        this.mouth = document.getElementById('mouth');
        this.mouthGroup = document.getElementById('mouth-group');
        this.halfOpenMouth = document.getElementById('half-open-mouth');
        this.laughingMouth = document.getElementById('laughing-mouth');

        this.cheeks = document.getElementById('cheeks');
        this.tearsGroup = document.getElementById('tears-group');
        this.tearDrops = document.querySelectorAll('.tear-drop');

        this.zzzGroup = document.getElementById('zzz-group');
        this.zzzParticles = document.querySelectorAll('.zzz');

        this.expressions = {
            normal:    "M 350 320 Q 400 360 450 320",
            happy:     "M 350 310 Q 400 380 450 310",
            sad:       "M 350 340 Q 400 300 450 340",
            surprised: "M 380 340 Q 400 380 420 340",
            straight:  "M 350 330 Q 400 330 450 330"
        };

        this.idleTimer = null;
        this.lookTimer = null;
        this.currentEmotion = 'normal';
    }

    /** Construye el objeto de elementos que necesitan las animaciones. */
    _getElements() {
        return {
            faceContainer: document.getElementById('face-container'),
            eyesGroup: this.eyesGroup,
            sadEyesGroup: this.sadEyesGroup,
            eyes: this.eyes,
            mouthGroup: this.mouthGroup,
            halfOpenMouth: this.halfOpenMouth,
            laughingMouth: this.laughingMouth,
            tearsGroup: this.tearsGroup,
            tearDrops: this.tearDrops,
            zzzGroup: this.zzzGroup,
            zzzParticles: this.zzzParticles,
            mouthPath: this.mouth,
            normalMouthData: this.expressions.normal,
            sadMouthData: this.expressions.sad,
            happyMouthData: this.expressions.happy
        };
    }

    /**
     * Inicia la rutina idle. Esto limpia timers previos y comienza el ciclo.
     */
    startIdleRoutine() {
        this._clearTimers();
        this.currentEmotion = 'normal';
        this._scheduleIdle();
    }

    /**
     * Detiene todas las rutinas idle, emociones activas y timers.
     * Restaura la cara a su estado normal.
     */
    stopIdleRoutine() {
        this._clearTimers();
        this.currentEmotion = 'normal';
        BmoAnimations.resetEmotion(this._getElements());
    }

    /**
     * Cambia la emoción de BMO.
     * 
     * @param {string} emotion - Nombre de la emoción.
     * @param {number|null} duration - Duración en ms. 0 = indefinida. null = auto.
     */
    setEmotion(emotion, duration = null) {
        this.currentEmotion = emotion;
        this._clearTimers();

        const elements = this._getElements();

        // Resetear todo al estado neutro antes de la nueva emoción
        BmoAnimations.resetEmotion(elements);

        // Aplicar la nueva emoción
        switch (emotion) {
            case 'cry':
                BmoAnimations.cry(elements);
                if (typeof audioManager !== 'undefined') audioManager.play('scared');
                break;
            case 'laugh':
                BmoAnimations.laugh(elements);
                if (typeof audioManager !== 'undefined') audioManager.play('laugh');
                break;
            case 'dance':
                BmoAnimations.dance(elements);
                if (typeof audioManager !== 'undefined') audioManager.play('si_bmo');
                break;
            case 'happy':
                BmoAnimations.changeMouth(this.mouth, this.expressions.happy);
                break;
            case 'surprised':
                BmoAnimations.changeMouth(this.mouth, this.expressions.surprised);
                break;
            case 'sleep':
                BmoAnimations.sleep(elements);
                break;
            case 'talk':
                BmoAnimations.talk(elements);
                break;
            case 'shout':
                BmoAnimations.shout(elements);
                break;
            case 'normal':
            default:
                // Ya reseteado arriba
                break;
        }

        // Programar retorno a normal
        if (emotion !== 'normal') {
            if (duration === 0) {
                // Indefinido: no programar retorno
            } else {
                const timeToKeep = duration || (
                    (emotion === 'laugh' || emotion === 'dance') ? 10000 : 5000
                );
                this.idleTimer = setTimeout(() => {
                    this.setEmotion('normal');
                }, timeToKeep);
            }
        } else {
            // En modo normal, iniciar idle después de una pausa
            this._scheduleIdle();
        }
    }

    /**
     * Programa la siguiente iteración de la rutina idle.
     */
    _scheduleIdle() {
        if (this.idleTimer) clearTimeout(this.idleTimer);
        const delay = 2500 + Math.random() * 4000;
        this.idleTimer = setTimeout(() => this._idleRoutine(), delay);
    }

    /**
     * Ejecuta una acción idle aleatoria (parpadeo, mirada, expresión).
     * Se cancela automáticamente si hay una animación de prioridad alta activa.
     */
    _idleRoutine() {
        // GUARD: No ejecutar si la emoción actual no es normal
        if (this.currentEmotion !== 'normal') return;

        // GUARD: No ejecutar si BMO está dormido
        if (window.bmoApp && window.bmoApp.isSleeping) return;

        // GUARD: No ejecutar si hay una animación de prioridad alta bloqueando
        if (!animManager.canPlay(1)) return;

        const rand = Math.random();

        if (rand < 0.35) {
            BmoAnimations.blink(this.eyes);
        } else if (rand < 0.65) {
            const dirX = (Math.random() - 0.5) * 20;
            const dirY = (Math.random() - 0.5) * 10;
            BmoAnimations.look(this.eyes, dirX, dirY);

            if (this.lookTimer) clearTimeout(this.lookTimer);
            this.lookTimer = setTimeout(() => {
                if (this.currentEmotion === 'normal' && animManager.canPlay(1)) {
                    BmoAnimations.resetLook(this.eyes);
                }
            }, 4000);
        } else if (rand < 0.9) {
            const exps = ['happy', 'sad', 'surprised', 'straight'];
            const randomExp = exps[Math.floor(Math.random() * exps.length)];
            BmoAnimations.changeMouth(this.mouth, this.expressions[randomExp]);

            setTimeout(() => {
                if (this.currentEmotion === 'normal' && animManager.canPlay(1)) {
                    BmoAnimations.changeMouth(this.mouth, this.expressions.normal);
                }
            }, 2000);
        } else {
            const talks = ['joke', 'scared'];
            const randomTalk = talks[Math.floor(Math.random() * talks.length)];
            if (typeof audioManager !== 'undefined') audioManager.play(randomTalk);
        }

        // Programar la siguiente iteración
        this._scheduleIdle();
    }

    _clearTimers() {
        if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
        if (this.lookTimer) { clearTimeout(this.lookTimer); this.lookTimer = null; }
    }
}
