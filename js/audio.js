/**
 * BMO OS - Audio Manager & Synthesizer (Corregido)
 */
class AudioManager {
    constructor() {
        this.basePath = 'assets/audio/';
        
        this.sounds = {
            hello: 'Hola familia.wav',
            welcome: 'Bienvenidos amigos.wav',
            laugh: 'Risa divertida.wav',
            joke: 'Pequeño chiste.wav',
            scared: 'Grito asustado.wav',
            click: 'Click_boton.MP3',
            bg_music: 'Musica_fondo.MP3',
            bg_music_game: 'Run Bunny Run - Pix (1080p).mp4',
            win: 'Ganar.MP3',
            lose: 'Perder.MP3',
            risa_loco: 'Risa_que_loco.MP3',
            si_bmo: 'Si_BMO.MP3',
            abuelito: 'tu_eres_mi_abuelito.MP3',
            asalto: 'Asalto.MP3'
        };

        this.currentAudio = null;
        this.bgMusic = null;
        this.audioCtx = null;
        this.soundMuted = false;
        
        const initAudioCtx = () => {
            if (!this.audioCtx) {
                const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                if (AudioCtxClass) {
                    this.audioCtx = new AudioCtxClass();
                }
            } else if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        };
        window.addEventListener('click', initAudioCtx, { once: false });
        window.addEventListener('keydown', initAudioCtx, { once: false });
    }

    playBgMusic(isGame = false) {
        if (this.soundMuted) return;
        const filename = isGame ? this.sounds.bg_music_game : this.sounds.bg_music;
        
        if (!this.bgMusic) {
            this.bgMusic = new Audio(this.basePath + filename);
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.25;
        } else {
            const decodedSrc = decodeURIComponent(this.bgMusic.src);
            if (!decodedSrc.includes(filename)) {
                this.bgMusic.pause();
                this.bgMusic.src = this.basePath + filename;
                this.bgMusic.load();
            }
        }
        
        this.bgMusic.play().catch(e => {
            console.warn(`[Audio] Música de fondo pausada o no autorizada todavía.`);
        });
    }

    stopBgMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    }

    play(soundId) {
        if (this.soundMuted) return;
        
        if (!this.sounds[soundId]) {
            this.playChiptuneSfx(soundId);
            return;
        }

        // Si ya hay un audio reproduciéndose, detenerlo y restablecer la boca a normal
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            } catch (e) {}
            this.currentAudio = null;
            if (window.bmoApp && window.bmoApp.bmoFace) {
                const curr = window.bmoApp.bmoFace.currentEmotion;
                if (curr === 'talk' || curr === 'shout') {
                    window.bmoApp.bmoFace.setEmotion('normal');
                }
            }
        }

        const audio = new Audio(this.basePath + this.sounds[soundId]);
        audio.volume = 0.7;
        
        const isSyllableVocal = ['hello', 'welcome', 'joke', 'si_bmo', 'abuelito', 'asalto', 'risa_loco'].includes(soundId);
        const isShoutVocal = ['laugh', 'scared'].includes(soundId);
        
        if (isSyllableVocal || isShoutVocal) {
            this.currentAudio = audio;

            const stopMouth = () => {
                if (this.currentAudio === audio) {
                    this.currentAudio = null;
                }
                if (window.bmoApp && window.bmoApp.bmoFace) {
                    const curr = window.bmoApp.bmoFace.currentEmotion;
                    if (curr === 'talk' || curr === 'shout') {
                        window.bmoApp.bmoFace.setEmotion('normal');
                    }
                }
            };

            audio.addEventListener('ended', stopMouth);
            audio.addEventListener('pause', stopMouth);
            audio.addEventListener('error', stopMouth);

            // SOLO activar la boca cuando el navegador REALMENTE comience la reproducción del audio
            audio.play().then(() => {
                if (window.bmoApp && window.bmoApp.bmoFace) {
                    if (window.bmoApp.isSleeping || window.bmoApp.konamiSpinning) return;
                    if (window.bmoApp.bmoFace.currentEmotion === 'laugh' || window.bmoApp.bmoFace.currentEmotion === 'cry') return;
                    const emotion = isSyllableVocal ? 'talk' : 'shout';
                    const duration = soundId === 'abuelito' ? 3500 : (audio.duration && isFinite(audio.duration) ? audio.duration * 1000 + 300 : 4000);
                    window.bmoApp.bmoFace.setEmotion(emotion, duration);
                }
            }).catch(e => {
                console.warn(`[Audio Error/Autoplay] No se reprodujo '${soundId}':`, e);
                stopMouth();
                this.playChiptuneSfx(soundId);
            });

            return audio;
        }

        if (soundId === 'win' || soundId === 'lose') {
            this.currentAudio = audio;
        }

        audio.play().catch(e => {
            console.warn(`[Audio Fallback] Usando sintetizador para '${soundId}'`);
            this.playChiptuneSfx(soundId);
        });

        return audio;
    }

    playChiptuneSfx(type) {
        if (!this.audioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
        }
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        switch (type) {
            case 'click':
            case 'menu_move':
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'menu_select':
                osc.type = 'square';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.06);
                osc.frequency.setValueAtTime(783.99, now + 0.12);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'jump':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'eat':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(600, now + 0.05);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'laser':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            case 'hit':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.2);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'win':
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'square';
                    o.frequency.setValueAtTime(freq, now + idx * 0.1);
                    g.gain.setValueAtTime(0.15, now + idx * 0.1);
                    g.gain.linearRampToValueAtTime(0, now + (idx + 1) * 0.1);
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.start(now + idx * 0.1);
                    o.stop(now + (idx + 1) * 0.1);
                });
                break;
            case 'lose':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.4);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            default:
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
        }
    }

    playNote(freq, duration = 0.2) {
        if (!this.audioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
        }
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }
}

const audioManager = new AudioManager();
