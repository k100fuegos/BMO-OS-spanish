class AudioManager {
    constructor() {
        // Base path for audio files
        this.basePath = 'assets/audio/';
        
        // Dictionary of sounds (user will replace these with actual files)
        this.sounds = {
            hello: 'Hola familia.wav',
            welcome: 'Bienvenidos amigos.wav',
            laugh: 'Risa divertida.wav',
            joke: 'Pequeño chiste.wav',
            scared: 'Grito asustado.wav',
            menu_move: 'menu_move.wav',
            menu_select: 'menu_select.wav',
            click: 'Click_boton.MP3',
            bg_music: 'Musica_fondo.MP3',
            bg_music_game: 'Run Bunny Run - Pix (1080p).mp4', // Added the new audio file for games
            win: 'Ganar.MP3',
            lose: 'Perder.MP3',
            risa_loco: 'Risa_que_loco.MP3',
            si_bmo: 'Si_BMO.MP3',
            abuelito: 'tu_eres_mi_abuelito.MP3',
            asalto: 'Asalto.MP3'
        };

        this.currentAudio = null;
        this.bgMusic = null;
    }

    playBgMusic(isGame = false) {
        const filename = isGame ? this.sounds.bg_music_game : this.sounds.bg_music;
        
        if (!this.bgMusic) {
            this.bgMusic = new Audio(this.basePath + filename);
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.3; // Volumen medio
        } else {
            // Comprobar si el src actual ya es el que queremos reproducir
            // Usamos endsWith o indexOf para evitar problemas con paths absolutos del navegador
            const decodedSrc = decodeURIComponent(this.bgMusic.src);
            if (!decodedSrc.includes(filename)) {
                this.bgMusic.pause();
                this.bgMusic.src = this.basePath + filename;
                this.bgMusic.load();
            }
        }
        
        this.bgMusic.play().catch(e => {
            console.warn(`[Audio] No se pudo reproducir musica de fondo. Error:`, e.name, e.message);
        });
    }

    stopBgMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    }

    // Reproduce una frase o efecto
    play(soundId) {
        if (!this.sounds[soundId]) return;

        // Si ya hay algo reproduciendo, podemos decidir detenerlo o dejarlo
        if (this.currentAudio && ['hello', 'welcome', 'laugh', 'joke', 'scared', 'risa_loco', 'si_bmo', 'abuelito', 'asalto', 'win', 'lose'].includes(soundId)) {
            // Solo detenemos el audio anterior si el nuevo es un audio importante de voz o música,
            // permitiendo que efectos como el click o move se sobrepongan sin cortar la voz.
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        const audio = new Audio(this.basePath + this.sounds[soundId]);
        
        const isSyllableVocal = ['hello', 'welcome', 'joke', 'si_bmo', 'abuelito', 'asalto'].includes(soundId);
        const isShoutVocal = ['laugh', 'scared', 'risa_loco'].includes(soundId);
        
        if (isSyllableVocal || isShoutVocal) {
            audio.addEventListener('play', () => {
                if (window.bmoApp && window.bmoApp.bmoFace) {
                    // Evitar interrumpir la carcajada o el llanto (que ya tienen sus propias emociones)
                    if (window.bmoApp.bmoFace.currentEmotion === 'laugh' || window.bmoApp.bmoFace.currentEmotion === 'cry') return;

                    const emotion = isSyllableVocal ? 'talk' : 'shout';
                    const duration = soundId === 'abuelito' ? 3500 : 0;
                    window.bmoApp.bmoFace.setEmotion(emotion, duration); // Infinito hasta que termine el audio, excepto abuelito
                }
            });

            audio.addEventListener('ended', () => {
                if (window.bmoApp && window.bmoApp.bmoFace) {
                    const curr = window.bmoApp.bmoFace.currentEmotion;
                    if ((curr === 'talk' || curr === 'shout') && soundId !== 'abuelito') {
                        window.bmoApp.bmoFace.setEmotion('normal');
                    }
                }
            });
            
            this.currentAudio = audio; // Solo registramos audios vocales/principales como currentAudio
        }

        if (soundId === 'win' || soundId === 'lose') {
            this.currentAudio = audio;
        }

        audio.play().catch(e => {
            console.warn(`[Audio] No se pudo reproducir '${soundId}' (${this.sounds[soundId]}). Error:`, e.name, e.message);
        });

        // Retorna la promesa y el objeto de audio por si se necesita animar la boca
        return audio;
    }
}

const audioManager = new AudioManager();
