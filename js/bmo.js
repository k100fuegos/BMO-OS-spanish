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
            normal: "M 350 320 Q 400 360 450 320",
            happy: "M 350 310 Q 400 380 450 310",
            sad: "M 350 340 Q 400 300 450 340",
            surprised: "M 380 340 Q 400 380 420 340", // Small circle-ish
            straight: "M 350 330 Q 400 330 450 330"
        };
        
        this.idleTimer = null;
    }

    startIdleRoutine() {
        this.stopIdleRoutine();
        this.currentEmotion = 'normal';
        this.idleRoutine();
    }

    setEmotion(emotion, duration = null) {
        this.currentEmotion = emotion;
        
        // Detener cualquier temporizador previo para que no lo interrumpa
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }
        const elements = {
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

        BmoAnimations.resetEmotion(elements);

        if (emotion === 'cry') {
            BmoAnimations.cry(elements);
            // Si o si reproduce el grito asustado al llorar
            if (typeof audioManager !== 'undefined') {
                audioManager.play('scared');
            }
        } else if (emotion === 'laugh') {
            BmoAnimations.laugh(elements);
            if (typeof audioManager !== 'undefined') {
                audioManager.play('laugh');
            }
        } else if (emotion === 'happy') {
            BmoAnimations.changeMouth(this.mouth, this.expressions.happy);
        } else if (emotion === 'surprised') {
            BmoAnimations.changeMouth(this.mouth, this.expressions.surprised);
        } else if (emotion === 'sleep') {
            BmoAnimations.sleep(elements);
        } else if (emotion === 'talk') {
            BmoAnimations.talk(elements);
        } else if (emotion === 'shout') {
            BmoAnimations.shout(elements);
        }

        // Programar el regreso a la normalidad
        if (emotion !== 'normal') {
            // Si duration es 0, se queda así para siempre (hasta que se llame normal).
            // Si no se pasa duration, la carcajada durará 20 segundos por defecto.
            if (duration !== 0) {
                const timeToKeep = duration || (emotion === 'laugh' ? 20000 : 5000);
                this.idleTimer = setTimeout(() => {
                    this.setEmotion('normal');
                }, timeToKeep);
            } else {
                this.idleTimer = null; // No programamos regreso automático
            }
        } else {
            // Si volvió a normal, reiniciamos el ciclo idle normal
            this.idleTimer = setTimeout(() => this.idleRoutine(), 2000 + Math.random() * 4000);
        }
    }

    stopIdleRoutine() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        if (this.lookTimer) {
            clearTimeout(this.lookTimer);
            this.lookTimer = null;
        }
    }

    idleRoutine() {
        if (this.currentEmotion !== 'normal') return;

        const rand = Math.random();
        
        if (rand < 0.3) {
            // Blink
            BmoAnimations.blink(this.eyes);
        } else if (rand < 0.6) {
            // Look around (movimientos más proporcionales)
            const dirX = (Math.random() - 0.5) * 20; 
            const dirY = (Math.random() - 0.5) * 10;
            BmoAnimations.look(this.eyes, dirX, dirY);
            
            // Regresar a la posición original después de 5 segundos
            if (this.lookTimer) clearTimeout(this.lookTimer);
            this.lookTimer = setTimeout(() => {
                BmoAnimations.resetLook(this.eyes);
            }, 5000);
        } else if (rand < 0.9) {
            // Change expression briefly
            const exps = ['happy', 'sad', 'surprised', 'straight'];
            const randomExp = exps[Math.floor(Math.random() * exps.length)];
            BmoAnimations.changeMouth(this.mouth, this.expressions[randomExp]);
            
            // Revert back after a bit
            setTimeout(() => {
                BmoAnimations.changeMouth(this.mouth, this.expressions.normal);
            }, 2000);
        } else {
            // 10% chance: Hablar de la nada (chiste o grito)
            const talks = ['joke', 'scared'];
            const randomTalk = talks[Math.floor(Math.random() * talks.length)];
            audioManager.play(randomTalk);
        }

        // Schedule next action
        const nextTime = 2000 + Math.random() * 4000;
        this.idleTimer = setTimeout(() => this.idleRoutine(), nextTime);
    }
}
