Как открыть:
1. Откройте папку digital-shop в VS Code.
2. ПКМ на index.html -> Open with Live Server.
3. Нужен интернет (шрифты Google и библиотека 3D-моделей).
4. Скролльте вниз. Клик по модели - окно с вращением, кнопка Buy - в корзину.

SOUND (js/sound.js, assets/audio/)
Files are mp3. Missing files are skipped silently.
Loops (30-60 s, mono is fine, seamless): sea-soft, sea-rough, wind, rain, birds, crickets, cicadas
Music (1-3 min loops): music-day, music-weather, music-night
One-shots: gull, furin, bell, thunder, whoosh, paper, chime
Currently sea-soft, sea-rough, wind, rain, crickets, whoosh, paper, chime, bell, furin, thunder are synthetic placeholders.
Replace them with real recordings under the same names.

Music: js/music.js generates koto/shakuhachi-style music in the browser when music-day/music-weather/music-night.mp3 are missing.
If those mp3 files exist they are used instead.
lamp.mp3 is the sound of touching a lantern. whoosh.mp3 is the gate flight sound (one voice at a time, fades out).
