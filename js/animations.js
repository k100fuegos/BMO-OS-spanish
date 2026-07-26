/**
 * BMO OS - BmoAnimations & AnimationManager
 * 
 * Prioridades:
 *   0 = Nada activo
 *   1 = Idle (parpadeo, mirada)
 *   2 = Emoción (reír, llorar, bailar)
 *   3 = Sueño / Salvapantallas
 *
 * Nota: El giro Konami (prioridad 4) NO usa GSAP. Usa CSS @keyframes
 * directamente en #face-container, así es imposible que colisione.
 */
class AnimationManager {
    constructor() {
        this.currentPriority = 0;
        this.currentAnimation = null;
        this._locked = false;
    }

    play(name, priority, actionFn) {
        if (this._locked && priority <= this.currentPriority) {
            return false;
        }
        if (priority < this.currentPriority) {
            return false;
        }

        this._killAllFaceTweens();

        this.currentPriority = priority;
        this.currentAnimation = name;
        this._locked = (priority >= 3);

        if (typeof actionFn === 'function') {
            const done = () => {
                if (this.currentAnimation === name) {
                    this.currentPriority = 0;
                    this.currentAnimation = null;
                    this._locked = false;
                }
            };
            actionFn(done);
        }

        return true;
    }

    forceStop() {
        this._killAllFaceTweens();
        this.currentPriority = 0;
        this.currentAnimation = null;
        this._locked = false;
    }

    canPlay(priority) {
        if (this._locked && priority <= this.currentPriority) return false;
        return priority >= this.currentPriority;
    }

    _killAllFaceTweens() {
        const ids = [
            'face-container', 'eyes', 'sad-eyes', 'left-eye', 'right-eye',
            'mouth-group', 'mouth', 'laughing-mouth', 'half-open-mouth',
            'tears-group', 'zzz-group'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) gsap.killTweensOf(el);
        });
        document.querySelectorAll('.tear-drop').forEach(el => gsap.killTweensOf(el));
        document.querySelectorAll('.zzz').forEach(el => gsap.killTweensOf(el));
    }
}

const animManager = new AnimationManager();


class BmoAnimations {

    /* ============ PRIORIDAD 1: IDLE ============ */

    static blink(eyes) {
        if (!eyes || !eyes.left || !eyes.right) return;
        if (!animManager.canPlay(1)) return;

        animManager.play('blink', 1, (done) => {
            gsap.to([eyes.left, eyes.right], {
                scaleY: 0.1,
                scaleX: 1,
                transformOrigin: "center center",
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onComplete: done
            });
        });
    }

    static look(eyes, x, y) {
        if (!eyes || !eyes.left || !eyes.right) return;
        if (!animManager.canPlay(1)) return;

        animManager.play('look', 1, (done) => {
            gsap.to([eyes.left, eyes.right], {
                x: x, y: y,
                scaleX: 1, scaleY: 1,
                transformOrigin: "center center",
                duration: 0.5,
                ease: "power2.out",
                onComplete: done
            });
        });
    }

    static resetLook(eyes) {
        if (!eyes || !eyes.left || !eyes.right) return;
        gsap.killTweensOf([eyes.left, eyes.right]);
        gsap.set([eyes.left, eyes.right], {
            x: 0, y: 0, scaleX: 1, scaleY: 1,
            transformOrigin: "center center"
        });
    }

    static changeMouth(mouthElement, newPathData) {
        if (!mouthElement) return;
        if (!animManager.canPlay(1)) return;
        gsap.killTweensOf(mouthElement);
        gsap.to(mouthElement, {
            attr: { d: newPathData },
            duration: 0.25,
            ease: "power2.out"
        });
    }


    /* ============ PRIORIDAD 2: EMOCIONES ============ */

    static talk(elements) {
        animManager.play('talk', 2, () => {
            gsap.to(elements.mouthGroup, {
                rotation: "+=0",
                duration: 0.1,
                repeat: -1,
                onRepeat: () => {
                    const r = Math.random();
                    if (r < 0.25) {
                        gsap.set(elements.mouthGroup, { opacity: 1 });
                        gsap.set(elements.halfOpenMouth, { opacity: 0 });
                        gsap.set(elements.laughingMouth, { opacity: 0 });
                    } else if (r < 0.6) {
                        gsap.set(elements.mouthGroup, { opacity: 0 });
                        gsap.set(elements.halfOpenMouth, { opacity: 1 });
                        gsap.set(elements.laughingMouth, { opacity: 0 });
                    } else {
                        gsap.set(elements.mouthGroup, { opacity: 0 });
                        gsap.set(elements.halfOpenMouth, { opacity: 0 });
                        gsap.set(elements.laughingMouth, { opacity: 1 });
                    }
                }
            });
        });
    }

    static shout(elements) {
        animManager.play('shout', 2, () => {
            gsap.set(elements.mouthGroup, { opacity: 0 });
            gsap.set(elements.halfOpenMouth, { opacity: 0 });
            gsap.set(elements.laughingMouth, { opacity: 1 });
            gsap.to(elements.eyesGroup, {
                opacity: 1, scaleY: 1.15, scaleX: 1,
                transformOrigin: "center center", duration: 0.2
            });
        });
    }

    static cry(elements) {
        animManager.play('cry', 2, () => {
            gsap.set(elements.eyesGroup, { opacity: 0 });
            gsap.set(elements.sadEyesGroup, { opacity: 1 });
            gsap.set(elements.mouthGroup, { opacity: 1 });
            gsap.set(elements.laughingMouth, { opacity: 0 });
            gsap.set(elements.halfOpenMouth, { opacity: 0 });

            if (elements.mouthPath) {
                gsap.to(elements.mouthPath, {
                    attr: { d: elements.sadMouthData },
                    duration: 0.3
                });
            }

            gsap.set(elements.tearsGroup, { opacity: 1 });
            gsap.fromTo(elements.tearDrops,
                { y: -10, opacity: 0 },
                {
                    y: 20, opacity: 1,
                    duration: 0.6, stagger: 0.15,
                    repeat: -1, yoyo: true, ease: "sine.inOut"
                }
            );
        });
    }

    static laugh(elements) {
        animManager.play('laugh', 2, () => {
            gsap.set(elements.mouthGroup, { opacity: 0 });
            gsap.set(elements.halfOpenMouth, { opacity: 0 });
            gsap.set(elements.laughingMouth, { opacity: 1 });
            gsap.to(elements.eyesGroup, {
                opacity: 1, scaleY: 0.85, scaleX: 1,
                transformOrigin: "center center", duration: 0.2
            });
            gsap.to(elements.faceContainer, {
                y: -15,
                duration: 0.15,
                yoyo: true, repeat: -1, ease: "sine.inOut"
            });
        });
    }

    static dance(elements) {
        animManager.play('dance', 2, () => {
            gsap.set(elements.mouthGroup, { opacity: 0 });
            gsap.set(elements.halfOpenMouth, { opacity: 0 });
            gsap.set(elements.laughingMouth, { opacity: 1 });
            gsap.to(elements.eyesGroup, {
                opacity: 1, scaleY: 0.9, scaleX: 1,
                transformOrigin: "center center", duration: 0.2
            });
            gsap.to(elements.faceContainer, {
                y: -25, scaleY: 1.04,
                duration: 0.22,
                yoyo: true, repeat: -1, ease: "sine.inOut",
                transformOrigin: "50% 50%"
            });
        });
    }


    /* ============ PRIORIDAD 3: SUEÑO ============ */

    static sleep(elements) {
        animManager.play('sleep', 3, () => {
            gsap.set(elements.laughingMouth, { opacity: 0 });
            gsap.set(elements.halfOpenMouth, { opacity: 0 });
            gsap.set(elements.mouthGroup, { opacity: 1 });

            gsap.to(elements.eyesGroup, {
                opacity: 1, scaleY: 0.05, scaleX: 1,
                transformOrigin: "center center",
                duration: 1.8, ease: "sine.inOut"
            });

            if (elements.mouthPath) {
                gsap.to(elements.mouthPath, {
                    attr: { d: "M 370 338 Q 400 348 430 338" },
                    duration: 1.2, ease: "sine.inOut"
                });
            }

            // Oscurecer TODA la pantalla con clase CSS
            const container = document.getElementById('bmo-container');
            if (container) {
                container.classList.remove('bmo-awake');
                container.classList.add('bmo-sleeping');
            }

            // Respiración
            gsap.to(elements.faceContainer, {
                y: 8, scaleY: 0.98, scaleX: 1.01,
                duration: 3.2,
                yoyo: true, repeat: -1, ease: "sine.inOut",
                transformOrigin: "50% 50%"
            });

            // Zzz flotantes con desvanecimiento
            gsap.to(elements.zzzGroup, { opacity: 1, duration: 1 });
            gsap.fromTo(elements.zzzParticles,
                { y: 0, scale: 0.3, opacity: 0 },
                {
                    y: -140, scale: 1.5,
                    keyframes: [
                        { opacity: 0, percent: 0 },
                        { opacity: 1, percent: 30 },
                        { opacity: 0, percent: 100 }
                    ],
                    duration: 3.6, stagger: 1.2,
                    repeat: -1, ease: "power1.out",
                    transformOrigin: "center center"
                }
            );
        });
    }


    /* ============ RESETEO TOTAL ============ */

    static resetEmotion(elements) {
        animManager.forceStop();

        const container = document.getElementById('bmo-container');

        if (elements.faceContainer) {
            gsap.set(elements.faceContainer, {
                y: 0, x: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0,
                transformOrigin: "50% 50%"
            });
        }

        gsap.set(elements.eyesGroup, {
            opacity: 1, scaleY: 1, scaleX: 1,
            transformOrigin: "center center"
        });
        gsap.set(elements.sadEyesGroup, { opacity: 0 });
        if (elements.eyes) {
            gsap.set([elements.eyes.left, elements.eyes.right], {
                x: 0, y: 0, scaleX: 1, scaleY: 1,
                transformOrigin: "center center"
            });
        }

        gsap.set(elements.mouthGroup, { opacity: 1, rotation: 0 });
        gsap.set(elements.laughingMouth, { opacity: 0 });
        gsap.set(elements.halfOpenMouth, { opacity: 0 });
        if (elements.mouthPath) {
            gsap.set(elements.mouthPath, { attr: { d: elements.normalMouthData } });
        }

        gsap.set(elements.tearsGroup, { opacity: 0 });
        if (elements.tearDrops) gsap.set(elements.tearDrops, { y: 0, opacity: 0 });

        gsap.set(elements.zzzGroup, { opacity: 0 });
        if (elements.zzzParticles) {
            gsap.set(elements.zzzParticles, { y: 0, x: 0, opacity: 0, scale: 1 });
        }

        // Restaurar brillo con clase CSS
        if (container) {
            container.classList.remove('bmo-sleeping');
            container.classList.add('bmo-awake');
        }
    }
}
