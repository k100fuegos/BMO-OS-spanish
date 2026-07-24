class BmoAnimations {
    static blink(eyes) {
        // Usa GSAP para achicar en Y simulando parpadeo
        gsap.to([eyes.left, eyes.right], {
            scaleY: 0.1,
            transformOrigin: "center center",
            duration: 0.1,
            yoyo: true,
            repeat: 1
        });
    }

    static look(eyes, x, y) {
        gsap.to([eyes.left, eyes.right], {
            x: x,
            y: y,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    static resetLook(eyes) {
        gsap.to([eyes.left, eyes.right], {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    static changeMouth(mouthElement, newPathData) {
        gsap.to(mouthElement, {
            attr: { d: newPathData },
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto"
        });
    }

    static talk(elements) {
        // Dummy property tween to act as a loop that we can easily kill
        gsap.to(elements.mouthGroup, {
            rotation: "+=0", 
            duration: 0.1, // velocidad de cada sílaba
            repeat: -1,
            overwrite: "auto",
            onRepeat: () => {
                const r = Math.random();
                let f;
                if (r < 0.25) f = { c: 1, h: 0, o: 0 }; // Closed (25% chance)
                else if (r < 0.6) f = { c: 0, h: 1, o: 0 }; // Half-open (35% chance)
                else f = { c: 0, h: 0, o: 1 }; // Open (40% chance)

                gsap.set(elements.mouthGroup, { opacity: f.c });
                gsap.set(elements.halfOpenMouth, { opacity: f.h });
                gsap.set(elements.laughingMouth, { opacity: f.o });
            }
        });
    }

    static shout(elements) {
        // Abre la boca grande estáticamente (para gritos o risa sin tanto rebote si no es carcajada de juego)
        gsap.to(elements.mouthGroup, { opacity: 0, duration: 0.1, overwrite: "auto" });
        gsap.to(elements.halfOpenMouth, { opacity: 0, duration: 0.1, overwrite: "auto" });
        gsap.to(elements.laughingMouth, { opacity: 1, duration: 0.1, overwrite: "auto" });
        
        // Abre un poco los ojos por la sorpresa/grito
        gsap.to(elements.eyesGroup, { opacity: 1, scaleY: 1.2, duration: 0.2, overwrite: "auto" });
    }

    static cry(elements) {
        gsap.to(elements.eyesGroup, { opacity: 0, duration: 0.2, overwrite: "auto" });
        gsap.to(elements.sadEyesGroup, { opacity: 1, duration: 0.2, overwrite: "auto" });
        
        BmoAnimations.changeMouth(elements.mouthPath, elements.sadMouthData);
        
        gsap.to(elements.tearsGroup, { opacity: 1, duration: 0.2, overwrite: "auto" });
        
        // Animate tears falling (yoyo effect)
        gsap.fromTo(elements.tearDrops, 
            { y: -10, opacity: 0 }, 
            { 
                y: 20, 
                opacity: 1, 
                duration: 0.6, 
                stagger: 0.15, 
                repeat: -1, 
                yoyo: true,
                ease: "sine.inOut",
                overwrite: "auto"
            }
        );
    }

    static laugh(elements) {
        gsap.to(elements.mouthGroup, { opacity: 0, duration: 0.1, overwrite: "auto" });
        gsap.to(elements.laughingMouth, { opacity: 1, duration: 0.1, overwrite: "auto" });
        
        // Eyes squint slightly (scaleY down) and ensure they are visible
        gsap.to(elements.eyesGroup, { opacity: 1, scaleY: 0.8, duration: 0.2, overwrite: "auto" });

        // Bouncing head animation
        gsap.to(elements.faceContainer, {
            y: -15,
            duration: 0.15,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            overwrite: "auto"
        });
    }

    static sleep(elements) {
        // Ojos cerrados más naturales (se afinan mucho más y más lento simulando pesadez)
        gsap.to(elements.eyesGroup, { 
            opacity: 1, 
            scaleY: 0.03, 
            duration: 1.5, 
            ease: "power2.inOut",
            overwrite: "auto" 
        });
        
        // Boca relajada (línea recta un poco más abajo)
        BmoAnimations.changeMouth(elements.mouthPath, "M 380 345 Q 400 345 420 345");
        
        // Respiración orgánica (se infla ligeramente y baja más lento)
        gsap.to(elements.faceContainer, {
            y: 12,
            scaleX: 1.02,
            scaleY: 0.98,
            duration: 3,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            overwrite: "auto"
        });

        // Oscurecer la pantalla de forma muy suave
        gsap.to(document.getElementById('screen'), { filter: 'brightness(0.5)', duration: 3 });
        
        // Animar las partículas Zzz de forma mucho más fluida
        gsap.to(elements.zzzGroup, { opacity: 1, duration: 1 });
        
        // 1. Subida y crecimiento orgánico, girando un poco
        gsap.fromTo(elements.zzzParticles, 
            { y: 0, scale: 0.2, rotation: -10 },
            {
                y: -130, 
                scale: 1.6,
                rotation: 15,
                duration: 4,
                stagger: 1.5,
                repeat: -1,
                ease: "power1.out",
                overwrite: "auto",
                transformOrigin: "center center"
            }
        );

        // 2. Movimiento oscilante en X (como hojas cayendo/subiendo)
        gsap.fromTo(elements.zzzParticles,
            { x: 0 },
            {
                x: 40,
                duration: 2,
                stagger: 1.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                overwrite: "auto"
            }
        );

        // 3. Desvanecimiento (aparecen de a poco, desaparecen al final)
        gsap.fromTo(elements.zzzParticles,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 2,
                stagger: 1.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                overwrite: "auto"
            }
        );
    }

    static resetEmotion(elements) {
        // Kill ALL active tweens on these elements to prevent conflicts
        const allElements = [
            elements.eyesGroup, elements.sadEyesGroup, 
            elements.mouthGroup,
            elements.laughingMouth,
            elements.halfOpenMouth,
            elements.tearsGroup, elements.mouthPath,
            elements.zzzGroup
        ];
        gsap.killTweensOf(allElements);
        if (elements.eyes) {
            gsap.killTweensOf([elements.eyes.left, elements.eyes.right]);
            gsap.to([elements.eyes.left, elements.eyes.right], { x: 0, y: 0, duration: 0.2 });
        }
        if (elements.tearDrops) gsap.killTweensOf(elements.tearDrops);
        if (elements.zzzParticles) gsap.killTweensOf(elements.zzzParticles);
        
        // Solo matamos la animación en 'y' del faceContainer para no cortar giros del easter egg abruptamente,
        // o si los cortamos, nos aseguramos de resetear rotation y scale también.
        gsap.killTweensOf(elements.faceContainer);
        
        // Reset face container pos and rotation/scale
        gsap.to(elements.faceContainer, { y: 0, rotation: 0, scale: 1, duration: 0.2 });
        
        // Reset eyes
        gsap.to(elements.eyesGroup, { opacity: 1, scaleY: 1, duration: 0.2 });
        gsap.to(elements.sadEyesGroup, { opacity: 0, duration: 0.2 });
        
        // Reset mouth
        gsap.to(elements.mouthGroup, { opacity: 1, duration: 0.2 });
        gsap.to(elements.laughingMouth, { opacity: 0, duration: 0.2 });
        gsap.to(elements.halfOpenMouth, { opacity: 0, duration: 0.2 });
        BmoAnimations.changeMouth(elements.mouthPath, elements.normalMouthData);
        
        // Hide tears and zzz
        gsap.to(elements.tearsGroup, { opacity: 0, duration: 0.2 });
        gsap.to(elements.zzzGroup, { opacity: 0, duration: 0.2 });

        // Reset screen brightness (in case of waking up from sleep)
        gsap.to(document.getElementById('screen'), { filter: 'brightness(1)', duration: 0.5 });
    }
}
