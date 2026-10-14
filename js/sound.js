(function () {
  const KEY = 'ds-sound';
  const BASE = 'assets/audio/';
  const btn = document.getElementById('sound-toggle');
  const modal = document.getElementById('modal');

  const LAYERS = {
    musicDay: { src: 'music-day', stream: true, vol: 0.55, mood: 'day' },
    musicWx: { src: 'music-weather', stream: true, vol: 0.55, mood: 'weather' },
    musicNight: { src: 'music-night', stream: true, vol: 0.55, mood: 'night' },
    seaSoft: { src: 'sea-soft', vol: 0.42 },
    seaRough: { src: 'sea-rough', vol: 0.55 },
    wind: { src: 'wind', vol: 0.34 },
    rain: { src: 'rain', vol: 0.36 },
    birds: { src: 'birds', vol: 0.32 },
    crickets: { src: 'crickets', vol: 0.22 },
    cicadas: { src: 'cicadas', vol: 0.22 }
  };

  const MIX = [
    { musicDay: 0.6, seaSoft: 0.5, birds: 0.12 },
    { musicDay: 0.6, seaSoft: 0.5, wind: 0.12 },
    { musicDay: 0.2, musicWx: 0.35, seaRough: 0.5, wind: 0.8 },
    { musicWx: 0.6, seaRough: 0.9, wind: 0.7, rain: 0.9 },
    { musicWx: 0.45, seaSoft: 0.25, rain: 0.7 },
    { musicDay: 0.5, seaSoft: 0.4, cicadas: 0.35 },
    { musicNight: 0.45, seaSoft: 0.3, crickets: 0.3 },
    { musicNight: 0.25, seaSoft: 0.15 },
    { musicNight: 0.2, seaSoft: 0.25, crickets: 0.35 },
    { musicNight: 0.3, seaSoft: 0.1, wind: 0.12 },
    { musicDay: 0.4, seaSoft: 0.4, birds: 0.4 }
  ];

  const SHOTS = {
    gull: { vol: 0.2 },
    furin: { vol: 0.22 },
    bell: { vol: 0.25 },
    thunder: { vol: 0.4 },
    paper: { vol: 0.2 },
    chime: { vol: 0.28 },
    lamp: { vol: 0.3 }
  };

  const RULES = [
    { shot: 'gull', scenes: [0, 1, 10], gap: [28, 60] },
    { shot: 'furin', scenes: [1], gap: [30, 70] },
    { shot: 'bell', scenes: [6], gap: [55, 85] },
    { shot: 'thunder', scenes: [3], gap: [12, 30] }
  ];

  let muted = false;
  try { muted = localStorage.getItem(KEY) === '0'; } catch (e) {}
  let ctx = null;
  let master = null;
  let started = false;
  let duck = 1;
  let timer = 0;
  const shotBuf = {};
  const now0 = () => performance.now() / 1000;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function label() {
    btn.textContent = muted ? 'Sound: off' : 'Sound';
    btn.classList.toggle('wait', !muted && !started);
  }

  function weights() {
    const w = DS.fx && DS.fx.weights;
    return w && w.length ? w : [1];
  }

  function loadBuffer(url) {
    return fetch(url)
      .then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)));
  }

  function prepare(name, L) {
    if (L.state) return;
    L.state = 'loading';
    const url = BASE + L.src + '.mp3';
    if (L.stream) {
      const a = new Audio(url);
      a.loop = true;
      a.preload = 'auto';
      a.addEventListener('error', () => {
        L.state = 'failed';
        if (L.mood && DS.music && !L.gen) L.gen = DS.music.attach(ctx, L.mood, L.gain);
      });
      L.el = a;
      L.node = ctx.createMediaElementSource(a);
      L.node.connect(L.gain);
      L.state = 'ready';
      a.play().catch(() => {});
    } else {
      loadBuffer(url).then(buf => {
        const s = ctx.createBufferSource();
        s.buffer = buf;
        s.loop = true;
        s.connect(L.gain);
        s.start(0, Math.random() * buf.duration);
        L.state = 'ready';
      }).catch(() => { L.state = 'failed'; });
    }
  }

  function update() {
    if (!ctx || ctx.state !== 'running') return;
    const w = weights();
    const t = ctx.currentTime;
    for (const name in LAYERS) {
      const L = LAYERS[name];
      let v = 0;
      for (let i = 0; i < w.length && i < MIX.length; i++) v += w[i] * (MIX[i][name] || 0);
      v = Math.min(1, v) * L.vol;
      if (v > 0.01) prepare(name, L);
      L.gain.gain.setTargetAtTime(v, t, 0.7);
      if (L.gen) L.gen.tick(v);
      if (L.stream && L.el && L.state === 'ready') {
        if (v < 0.004 && !L.el.paused && t - (L.quiet || t) > 6) L.el.pause();
        else if (v >= 0.004 && L.el.paused) L.el.play().catch(() => {});
        L.quiet = v < 0.004 ? (L.quiet || t) : 0;
      }
    }
    master.gain.setTargetAtTime(muted ? 0 : 0.6 * duck, t, 0.35);
  }

  function shot(name, opt) {
    if (!ctx || ctx.state !== 'running' || muted) return;
    const S = SHOTS[name];
    if (!S || S.failed) return;
    const play = buf => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = S.vol * rnd(0.8, 1) * ((opt && opt.gain) || 1);
      if (opt && opt.rate) s.playbackRate.value = opt.rate;
      s.connect(g);
      let out = g;
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = opt && opt.pan !== undefined ? opt.pan : rnd(-0.6, 0.6);
        g.connect(p);
        out = p;
      }
      out.connect(master);
      s.start();
    };
    if (shotBuf[name]) { play(shotBuf[name]); return; }
    loadBuffer(BASE + name + '.mp3').then(b => { shotBuf[name] = b; play(b); }).catch(() => { S.failed = true; });
  }

  function tick() {
    if (!ctx || ctx.state !== 'running' || muted) return;
    const w = weights();
    const t = now0();
    RULES.forEach(r => {
      if (!r.next) r.next = t + rnd(6, 15);
      if (t < r.next) return;
      const here = r.scenes.reduce((a, i) => a + (w[i] || 0), 0);
      r.next = t + rnd(r.gap[0], r.gap[1]);
      if (here > 0.5) shot(r.shot);
    });
  }

  function start() {
    if (started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    started = true;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master = ctx.createGain();
    master.gain.value = 0;
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 9000;
    master.connect(soft);
    soft.connect(comp);
    comp.connect(ctx.destination);
    for (const name in LAYERS) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(master);
      LAYERS[name].gain = g;
    }
    label();
    ctx.resume().then(() => {
      update();
      clearInterval(timer);
      timer = setInterval(() => { update(); tick(); watchScene(); }, 200);
    });
  }

  let lastScene = null;
  let whooshBuf = null;
  let voice = null;
  function whoosh() {
    if (!ctx || ctx.state !== 'running' || muted) return;
    const t = ctx.currentTime;
    if (voice && t - voice.t0 < 0.9) return;
    const go = buf => {
      const t1 = ctx.currentTime;
      if (voice && t1 - voice.t0 < 0.9) return;
      if (voice) {
        voice.g.gain.cancelScheduledValues(t1);
        voice.g.gain.setValueAtTime(voice.g.gain.value, t1);
        voice.g.gain.linearRampToValueAtTime(0, t1 + 0.7);
        voice.s.stop(t1 + 0.8);
      }
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = rnd(0.95, 1.05);
      const g = ctx.createGain();
      const peak = voice && t1 - voice.t0 < 2.5 ? 0.22 : 0.3;
      const dur = buf.duration / s.playbackRate.value;
      g.gain.setValueAtTime(0, t1);
      g.gain.linearRampToValueAtTime(peak, t1 + 0.25);
      g.gain.setValueAtTime(peak, t1 + dur * 0.45);
      g.gain.linearRampToValueAtTime(0, t1 + dur - 0.05);
      s.connect(g);
      g.connect(master);
      s.start(t1);
      const v = { s, g, t0: t1 };
      voice = v;
      s.onended = () => { if (voice === v) voice = null; };
    };
    if (whooshBuf) go(whooshBuf);
    else loadBuffer(BASE + 'whoosh.mp3').then(b => { whooshBuf = b; go(b); }).catch(() => {});
  }

  let lampAt = 0;
  document.addEventListener('lampknock', e => {
    const t = now0();
    if (t - lampAt < 0.8) return;
    lampAt = t;
    const rates = [1, 1.125, 1.3333, 1.5];
    shot('lamp', { rate: rates[(Math.random() * rates.length) | 0], gain: 0.5 + 0.5 * Math.min(1, e.detail.strength), pan: (e.detail.x - 0.5) * 1.2 });
  });

  function watchScene() {
    if (DS.current === undefined) return;
    if (lastScene !== null && DS.current !== lastScene) whoosh();
    lastScene = DS.current;
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(KEY, m ? '0' : '1'); } catch (e) {}
    if (!m && !started) start();
    else if (ctx) {
      if (!m) ctx.resume().then(update);
      else {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
        setTimeout(() => { if (muted && ctx) ctx.suspend(); }, 900);
      }
    }
    label();
  }

  btn.addEventListener('click', () => setMuted(!muted));

  function firstGesture(e) {
    if (e.target && e.target.closest && e.target.closest('#sound-toggle')) return;
    if (muted || started) return;
    ['pointerdown', 'keydown', 'touchend'].forEach(n => window.removeEventListener(n, firstGesture, true));
    start();
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(n => window.addEventListener(n, firstGesture, true));

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (!muted) ctx.resume().then(update);
  });

  if (modal) {
    let wasOpen = false;
    new MutationObserver(() => {
      const open = modal.classList.contains('open');
      if (open === wasOpen) return;
      wasOpen = open;
      duck = open ? 0.45 : 1;
      if (open) shot('paper');
      update();
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  const buy = document.getElementById('modal-buy');
  if (buy) buy.addEventListener('click', () => shot('chime'));

  label();
})();
