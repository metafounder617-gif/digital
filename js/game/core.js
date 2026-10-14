(function () {
  const G = (window.G = {});
  const CANCEL = (G.CANCEL = { cancelled: true });

  G.W = 480;
  G.H = 270;
  G.T = 16;
  G.TOP = 24;
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  G.approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));

  G.cfg = {
    platSpeed: 95,
    platAccel: 1000,
    gravity: 900,
    jumpV: 330,
    springV: 560,
    springVHold: 620,
    topSpeed: 88,
    mazeSpeed: 78,
    plateTime: 7,
    learnTime: 10,
    hintIdle: 5,
    hintGuide: 20,
    hintArrow: 40,
    waitAnim: 8
  };

  G.store = { coins: 0, secrets: 0, hearts: 3, rewards: {}, cart: [], flags: {} };

  G.cv = document.getElementById('game');
  G.ctx = G.cv.getContext('2d');
  G.ctx.imageSmoothingEnabled = false;
  G.view = document.getElementById('viewport');
  G.stageEl = document.getElementById('stage');
  G.scale = 4;
  G.motion = true;

  G.resize = function () {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let s = Math.min(vw / G.W, vh / G.H);
    const fl = Math.floor(s);
    if (fl >= 1 && fl / s > 0.9) s = fl;
    G.scale = s;
    G.view.style.width = Math.round(G.W * s) + 'px';
    G.view.style.height = Math.round(G.H * s) + 'px';
    document.documentElement.style.setProperty('--s', s);
  };
  window.addEventListener('resize', G.resize);
  G.resize();

  const ALLOW = {
    gameplay: { cutscene: 1, transition: 1, paused: 1 },
    cutscene: { gameplay: 1, transition: 1, paused: 1 },
    transition: { gameplay: 1, cutscene: 1, paused: 1 },
    paused: { gameplay: 1, cutscene: 1, transition: 1 }
  };
  let beforePause = 'cutscene';
  let pauseCount = 0;
  G.state = 'transition';
  G.stageEl.dataset.state = G.state;

  function applyState(s) {
    G.state = s;
    G.stageEl.dataset.state = s;
    G.input.reset(s === 'gameplay');
  }

  G.setState = function (s) {
    if (s === G.state) return true;
    if (G.state === 'paused') return false;
    if (!ALLOW[G.state][s]) return false;
    applyState(s);
    return true;
  };

  G.forceState = function (s) {
    pauseCount = 0;
    applyState(s);
  };

  G.pause = function () {
    pauseCount++;
    if (G.state !== 'paused') {
      beforePause = G.state;
      applyState('paused');
    }
  };

  G.resume = function () {
    if (pauseCount > 0) pauseCount--;
    if (pauseCount === 0 && G.state === 'paused') applyState(beforePause);
  };

  const timers = [];
  const waiters = [];

  G.wait = s =>
    new Promise((res, rej) => {
      timers.push({ t: s, res, rej });
    });

  G.until = (fn, maxSec) =>
    new Promise((res, rej) => {
      waiters.push({ fn, res, rej, t: 0, max: maxSec || 0 });
    });

  G.tick = function (dt) {
    for (let i = timers.length - 1; i >= 0; i--) {
      const k = timers[i];
      k.t -= dt;
      if (k.t <= 0) {
        timers.splice(i, 1);
        k.res();
      }
    }
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      w.t += dt;
      if (w.fn() || (w.max && w.t >= w.max)) {
        waiters.splice(i, 1);
        w.res();
      }
    }
  };

  G.cancelAll = function () {
    const a = timers.splice(0);
    const b = waiters.splice(0);
    a.forEach(k => k.rej(CANCEL));
    b.forEach(k => k.rej(CANCEL));
  };

  G.run = fn =>
    (async () => {
      try {
        await fn();
      } catch (e) {
        if (e !== CANCEL) console.error(e);
      }
    })();

  const MAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyD: 'right',
    ArrowRight: 'right',
    Space: 'jump'
  };

  const input = (G.input = {
    down: new Set(),
    ignored: new Set(),
    edges: { up: 0, down: 0, left: 0, right: 0, jump: 0 },
    enabled: true,
    isActive(n) {
      return G.state === 'gameplay' && this.enabled && this.down.has(n) && !this.ignored.has(n);
    },
    held(n) {
      return this.isActive(n);
    },
    axis() {
      let x = (this.isActive('right') ? 1 : 0) - (this.isActive('left') ? 1 : 0);
      let y = (this.isActive('down') ? 1 : 0) - (this.isActive('up') ? 1 : 0);
      if (x && y) {
        return { x: x * 0.7071, y: y * 0.7071, rx: x, ry: y };
      }
      return { x, y, rx: x, ry: y };
    },
    take(n) {
      if (G.state !== 'gameplay') return false;
      if (this.edges[n] > 0) {
        this.edges[n] = 0;
        return true;
      }
      return false;
    },
    peek(n) {
      return G.state === 'gameplay' && this.edges[n] > 0;
    },
    reset(entering) {
      this.edges = { up: 0, down: 0, left: 0, right: 0, jump: 0 };
      this.ignored = new Set();
      if (entering) this.down.forEach(n => this.ignored.add(n));
    },
    clearAll() {
      this.down.clear();
      this.ignored.clear();
      this.edges = { up: 0, down: 0, left: 0, right: 0, jump: 0 };
    },
    decay(dt) {
      for (const k in this.edges) if (this.edges[k] > 0) this.edges[k] = Math.max(0, this.edges[k] - dt);
    }
  });

  function typing(e) {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  function onKeyDown(e) {
    const n = MAP[e.code];
    if (!n || typing(e)) return;
    if (G.state === 'paused') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (e.repeat) return;
    input.down.add(n);
    if (G.state === 'gameplay' && !input.ignored.has(n)) input.edges[n] = 0.12;
    G.audio.unlock();
  }

  function onKeyUp(e) {
    const n = MAP[e.code];
    if (!n) return;
    input.down.delete(n);
    input.ignored.delete(n);
  }

  G.bindInput = function () {
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => input.clearAll());
    document.addEventListener('visibilitychange', () => input.clearAll());
  };
  G.unbindInput = function () {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };

  const ac = { ctx: null, master: null, music: null, track: null, timer: 0, step: 0, next: 0, on: true };
  try {
    ac.on = localStorage.getItem('hg-sound') !== '0';
  } catch (e) {}

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freqOf(n) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) return 0;
    let s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (s + (parseInt(m[3], 10) - 4) * 12 - 9) / 12);
  }

  function tone(f, dur, type, vol, slide, delay, dest) {
    if (!ac.ctx || !ac.on) return;
    const t = ac.ctx.currentTime + (delay || 0);
    const o = ac.ctx.createOscillator();
    const g = ac.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || ac.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, hp, delay) {
    if (!ac.ctx || !ac.on) return;
    const t = ac.ctx.currentTime + (delay || 0);
    const n = Math.floor(ac.ctx.sampleRate * dur);
    const b = ac.ctx.createBuffer(1, n, ac.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.ctx.createBufferSource();
    s.buffer = b;
    const f = ac.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp || 800;
    const g = ac.ctx.createGain();
    g.gain.value = vol || 0.1;
    s.connect(f);
    f.connect(g);
    g.connect(ac.master);
    s.start(t);
  }

  const SFX = {
    jump: () => tone(300, 0.16, 'square', 0.07, 700),
    coin: () => {
      tone(988, 0.07, 'square', 0.06);
      tone(1319, 0.2, 'square', 0.06, 0, 0.07);
    },
    stomp: () => {
      tone(220, 0.1, 'square', 0.09, 90);
      noise(0.08, 0.05, 1200);
    },
    hurt: () => tone(380, 0.35, 'sawtooth', 0.09, 70),
    bump: () => tone(110, 0.1, 'square', 0.1, 70),
    bell: () => {
      tone(1568, 0.7, 'sine', 0.07);
      tone(2349, 0.5, 'sine', 0.04);
      tone(784, 0.9, 'sine', 0.05);
    },
    spring: () => tone(220, 0.35, 'triangle', 0.12, 1100),
    pipe: () => tone(420, 0.5, 'square', 0.07, 80),
    land: () => noise(0.09, 0.05, 500),
    scream: () => {
      tone(1100, 1.7, 'sawtooth', 0.08, 180);
      tone(1650, 1.7, 'square', 0.03, 270, 0.02);
    },
    blip: () => tone(520 + Math.random() * 80, 0.035, 'square', 0.025),
    chomp: () => tone(260, 0.05, 'square', 0.04, 160),
    eat: () => {
      tone(500, 0.08, 'square', 0.07, 1000);
      tone(1000, 0.12, 'square', 0.07, 1500, 0.08);
    },
    power: () => {
      for (let i = 0; i < 5; i++) tone(330 * Math.pow(1.26, i), 0.09, 'square', 0.06, 0, i * 0.06);
    },
    open: () => {
      tone(440, 0.1, 'square', 0.06);
      tone(660, 0.1, 'square', 0.06, 0, 0.1);
      tone(880, 0.2, 'square', 0.06, 0, 0.2);
    },
    orb: () => {
      tone(880, 0.12, 'sine', 0.08, 440);
      tone(660, 0.12, 'sine', 0.08, 330, 0.25);
      tone(520, 0.12, 'sine', 0.08, 260, 0.5);
    },
    click: () => tone(1500, 0.05, 'square', 0.07),
    fanfare: () => {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.07, 0, i * 0.13));
    },
    roar: () => {
      tone(140, 0.9, 'sawtooth', 0.12, 55);
      noise(0.6, 0.06, 200);
    },
    fire: () => noise(0.4, 0.08, 400),
    boom: () => {
      noise(0.5, 0.14, 120);
      tone(90, 0.5, 'sawtooth', 0.12, 30);
    },
    ladder: () => tone(700, 0.03, 'square', 0.03),
    zap: () => {
      tone(1400, 0.1, 'sawtooth', 0.06, 300);
      tone(900, 0.1, 'square', 0.05, 1800, 0.08);
    },
    select: () => tone(760, 0.08, 'square', 0.06)
  };

  G.sfx = n => {
    if (SFX[n]) SFX[n]();
  };

  const TRACKS = {
    plains: {
      bpm: 132,
      lead: 'E5 - G5 - E5 - C5 D5 E5 - - G4 - - - D5 - F5 - D5 - B4 C5 D5 - - - G4 - - - ',
      bass: 'C3 - G3 - C3 - G3 - C3 - G3 - C3 - G3 - G2 - D3 - G2 - D3 - G2 - D3 - G2 - D3 - '
    },
    town: {
      bpm: 108,
      lead: 'G4 - B4 D5 - B4 G4 - A4 - C5 E5 - C5 A4 - B4 - D5 F5 - D5 B4 - C5 E5 G5 - E5 C5 - ',
      bass: 'G2 - D3 - G2 - D3 - A2 - E3 - A2 - E3 - B2 - F3 - B2 - F3 - C3 - G3 - C3 - G3 - '
    },
    maze: {
      bpm: 150,
      lead: 'A4 - A5 - A4 - A5 - G4 - G5 - G4 - G5 - F4 - F5 - F4 - F5 - E4 E5 - - E4 B4 E5 - ',
      bass: 'A2 - - A2 - - A2 - G2 - - G2 - - G2 - F2 - - F2 - - F2 - E2 - - E2 - - E2 - '
    },
    tower: {
      bpm: 140,
      lead: 'D5 - D5 F5 - D5 - A4 - C5 - D5 - - - C5 - C5 E5 - C5 - G4 - Bb4 - C5 - - - ',
      bass: 'D2 D2 - D2 D2 - D2 - D2 D2 - D2 D2 - D2 - C2 C2 - C2 C2 - C2 - C2 C2 - C2 C2 - C2 - '
    },
    hotel: {
      bpm: 92,
      lead: 'E5 - - G5 - - B5 - - A5 - G5 - - - - D5 - - F5 - - A5 - - G5 - F5 - - - - ',
      bass: 'E3 - - - B3 - - - A3 - - - E3 - - - D3 - - - A3 - - - G3 - - - D3 - - - '
    },
    maze2: {
      bpm: 164,
      lead: 'C5 - Eb5 - G5 - Eb5 - C5 - Eb5 - G5 - C6 - Bb4 - D5 - F5 - D5 - Bb4 - D5 - F5 - Bb5 - ',
      bass: 'C2 - - C2 - C2 - - C2 - - C2 - C2 - - Bb1 - - Bb1 - Bb1 - - Bb1 - - Bb1 - Bb1 - - '
    },
    castle: {
      bpm: 120,
      lead: 'A4 - - C5 - - E5 - - D5 - C5 - - - G#4 - - B4 - - D5 - - C5 - B4 - - - A4 - - - ',
      bass: 'A2 A2 - A2 A2 - A2 - A2 A2 - A2 A2 - A2 - E2 E2 - E2 E2 - E2 - E2 E2 - E2 E2 - E2 - '
    },
    title: {
      bpm: 100,
      lead: 'C5 - E5 - G5 - E5 - C5 - E5 - G5 - C6 - - - ',
      bass: 'C3 - - - G2 - - - A2 - - - F2 - - - '
    }
  };

  function sched() {
    if (!ac.ctx || !ac.track || !ac.on) return;
    const tr = ac.track;
    const stepDur = 60 / tr.bpm / 2;
    const lead = tr.leadN;
    const bass = tr.bassN;
    while (ac.next < ac.ctx.currentTime + 0.25) {
      const i = ac.step;
      const l = lead[i % lead.length];
      const b = bass[i % bass.length];
      const d = Math.max(0, ac.next - ac.ctx.currentTime);
      if (l !== '-') tone(freqOf(l), stepDur * 0.9, 'square', 0.035, 0, d, ac.music);
      if (b !== '-') tone(freqOf(b), stepDur * 0.95, 'triangle', 0.08, 0, d, ac.music);
      ac.step++;
      ac.next += stepDur;
    }
  }

  G.audio = {
    unlock() {
      if (ac.ctx) {
        if (ac.ctx.state === 'suspended') ac.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac.ctx = new AC();
      ac.master = ac.ctx.createGain();
      ac.master.gain.value = 0.9;
      ac.master.connect(ac.ctx.destination);
      ac.music = ac.ctx.createGain();
      ac.music.gain.value = 0.8;
      ac.music.connect(ac.master);
      if (ac.track) {
        ac.next = ac.ctx.currentTime + 0.05;
        ac.step = 0;
      }
      if (!ac.timer) ac.timer = setInterval(sched, 40);
    },
    music(name) {
      const tr = TRACKS[name];
      if (!tr) {
        ac.track = null;
        return;
      }
      if (!tr.leadN) {
        tr.leadN = tr.lead.trim().split(/\s+/);
        tr.bassN = tr.bass.trim().split(/\s+/);
      }
      if (ac.track === tr) return;
      ac.track = tr;
      ac.step = 0;
      ac.next = ac.ctx ? ac.ctx.currentTime + 0.05 : 0;
      if (ac.ctx && !ac.timer) ac.timer = setInterval(sched, 40);
    },
    stopMusic() {
      ac.track = null;
    },
    isOn() {
      return ac.on;
    },
    toggle() {
      ac.on = !ac.on;
      try {
        localStorage.setItem('hg-sound', ac.on ? '1' : '0');
      } catch (e) {}
      if (ac.on && ac.ctx) {
        ac.next = ac.ctx.currentTime + 0.05;
      }
      return ac.on;
    }
  };

  G.Particles = function () {
    const list = [];
    return {
      add(p) {
        list.push(
          Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0.5, age: 0, size: 2, color: '#fff', text: null }, p)
        );
      },
      burst(x, y, n, color, spd, life, grav) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = (spd || 60) * (0.4 + Math.random() * 0.6);
          this.add({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - (spd || 60) * 0.3,
            g: grav === undefined ? 200 : grav,
            life: (life || 0.5) * (0.6 + Math.random() * 0.6),
            color,
            size: Math.random() < 0.5 ? 1 : 2
          });
        }
      },
      dust(x, y, dir) {
        for (let i = 0; i < 4; i++) {
          this.add({
            x: x + (Math.random() - 0.5) * 6,
            y: y - 1,
            vx: (dir || 0) * -10 + (Math.random() - 0.5) * 30,
            vy: -Math.random() * 20,
            g: 20,
            life: 0.3 + Math.random() * 0.2,
            color: '#e8dcc0',
            size: 2
          });
        }
      },
      text(x, y, text, color) {
        this.add({ x, y, vy: -26, life: 0.8, text, color: color || '#ffe27a', size: 0 });
      },
      update(dt) {
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.age += dt;
          if (p.age >= p.life) {
            list.splice(i, 1);
            continue;
          }
          p.vy += p.g * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
      },
      draw(ctx, cx, cy) {
        for (const p of list) {
          const a = 1 - p.age / p.life;
          if (p.text) {
            G.art.text(ctx, p.text, Math.round(p.x - cx), Math.round(p.y - cy), p.color, a);
          } else {
            ctx.globalAlpha = Math.min(1, a * 1.5);
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.size, p.size);
            ctx.globalAlpha = 1;
          }
        }
      },
      clear() {
        list.length = 0;
      }
    };
  };

  G.fade = { p: 0, dir: 0, speed: 1.6, cells: null, done: null };
  G.fadeTo = function (dir, speed) {
    return new Promise((res, rej) => {
      G.fade.dir = dir;
      G.fade.speed = speed || 1.6;
      G.fade.done = { res, rej };
      if (dir > 0 && G.fade.p >= 1) {
        G.fade.dir = 0;
        G.fade.done = null;
        res();
      }
      if (dir < 0 && G.fade.p <= 0) {
        G.fade.dir = 0;
        G.fade.done = null;
        res();
      }
    });
  };
  G.fadeReset = function (p) {
    G.fade.p = p;
    G.fade.dir = 0;
    if (G.fade.done) {
      G.fade.done.rej(CANCEL);
      G.fade.done = null;
    }
  };

  const CW = 30;
  const CH = 17;
  const cells = [];
  for (let i = 0; i < CW * CH; i++) cells.push(Math.random());
  G.fade.cells = cells;

  function updateFade(dt) {
    const f = G.fade;
    if (!f.dir) return;
    f.p = G.clamp(f.p + f.dir * f.speed * dt, 0, 1);
    if ((f.dir > 0 && f.p >= 1) || (f.dir < 0 && f.p <= 0)) {
      f.dir = 0;
      const d = f.done;
      f.done = null;
      if (d) d.res();
    }
  }

  function drawFade(ctx) {
    const f = G.fade;
    if (f.p <= 0) return;
    ctx.fillStyle = '#14171a';
    if (f.p >= 1) {
      ctx.fillRect(0, 0, G.W, G.H);
      return;
    }
    const bs = 16;
    for (let j = 0; j < CH; j++) {
      for (let i = 0; i < CW; i++) {
        const r = f.cells[j * CW + i] * 0.7 + (i / CW) * 0.15 + (j / CH) * 0.15;
        if (r < f.p * 1.15) ctx.fillRect(i * bs, j * bs, bs, bs);
      }
    }
  }

  G.level = null;
  let last = 0;
  G.time = 0;
  G.frame = function (ts) {
    requestAnimationFrame(G.frame);
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000) || 0);
    last = ts;
    if (document.hidden) return;
    if (G.state !== 'paused') {
      G.time += dt;
      G.input.decay(dt);
      G.tick(dt);
      if (G.level) G.level.update(dt);
      updateFade(dt);
      if (G.ui) G.ui.update(dt);
    } else if (G.ui) {
      G.ui.updatePaused(dt);
    }
    const ctx = G.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, G.W, G.H);
    if (G.level) G.level.draw(ctx);
    drawFade(ctx);
  };
})();
