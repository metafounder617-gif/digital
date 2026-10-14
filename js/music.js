(function () {
  window.DS = window.DS || {};
  const D3 = 146.83;
  const MOODS = {
    day: { scale: [0, 2, 4, 7, 9], oct: [1, 2], gap: [1.0, 2.8], run: 0.4, wet: 0.32, drone: 0.05, flute: [18, 30], fvol: 0.05, pvol: 0.5, decay: 0.9965 },
    weather: { scale: [0, 1, 5, 7, 8], oct: [-1, 0], gap: [3.2, 6.5], run: 0.1, wet: 0.4, drone: 0.15, flute: [20, 34], fvol: 0.07, pvol: 0.55, decay: 0.9972 },
    night: { scale: [0, 1, 5, 7, 8], oct: [2, 3], gap: [4.5, 9], run: 0, wet: 0.5, drone: 0.035, flute: null, fvol: 0, pvol: 0.4, decay: 0.9978 }
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  let shared = null;

  function setup(ctx) {
    if (shared && shared.ctx === ctx) return shared;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 2.8);
    const imp = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = imp.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const nb = ctx.createBuffer(1, sr * 2, sr);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    shared = { ctx, imp, nb, plucks: {} };
    return shared;
  }

  function pluck(S, f, decay) {
    const key = f.toFixed(1) + decay;
    if (S.plucks[key]) return S.plucks[key];
    const ctx = S.ctx;
    const sr = ctx.sampleRate;
    const n = Math.floor(sr * 3.2);
    const buf = ctx.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f - 0.5));
    const line = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { prev = prev * 0.55 + (Math.random() * 2 - 1) * 0.45; line[i] = prev; }
    let p = 0;
    for (let i = 0; i < n; i++) {
      const a = line[p];
      const b = line[(p + 1) % N];
      line[p] = (a + b) * 0.5 * decay;
      d[i] = a;
      p = (p + 1) % N;
    }
    const fade = Math.floor(sr * 0.25);
    for (let i = 0; i < fade; i++) d[n - 1 - i] *= i / fade;
    S.plucks[key] = buf;
    return buf;
  }

  DS.music = {
    attach(ctx, mood, out) {
      const M = MOODS[mood];
      const S = setup(ctx);
      const bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(out);
      const conv = ctx.createConvolver();
      conv.buffer = S.imp;
      const wet = ctx.createGain();
      wet.gain.value = M.wet;
      bus.connect(conv);
      conv.connect(wet);
      wet.connect(out);

      const drone = ctx.createGain();
      drone.gain.value = M.drone;
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 420;
      drone.connect(lpf);
      lpf.connect(bus);
      [[D3 / 2, 'triangle', 1], [D3 * 0.75, 'sine', 0.6], [D3, 'sine', 0.35]].forEach(([f, type, g]) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        const og = ctx.createGain();
        og.gain.value = g;
        o.connect(og);
        og.connect(drone);
        o.start();
      });
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lg = ctx.createGain();
      lg.gain.value = M.drone * 0.4;
      lfo.connect(lg);
      lg.connect(drone.gain);
      lfo.start();

      let nextP = 0;
      let nextF = 0;
      let run = 0;

      function note(t) {
        const deg = pick(M.scale) + 12 * pick(M.oct);
        const f = D3 * Math.pow(2, deg / 12);
        const s = ctx.createBufferSource();
        s.buffer = pluck(S, f, M.decay);
        const g = ctx.createGain();
        g.gain.value = M.pvol * rnd(0.55, 1);
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        s.connect(g);
        if (pan) { pan.pan.value = rnd(-0.5, 0.5); g.connect(pan); pan.connect(bus); } else g.connect(bus);
        s.start(t);
      }

      function breath(t) {
        const deg = pick(M.scale) + 12 * (mood === 'weather' ? 1 : 2);
        const f = D3 * Math.pow(2, deg / 12);
        const dur = rnd(3.5, 5.5);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(M.fvol, t + 1.1);
        g.gain.setValueAtTime(M.fvol, t + dur - 0.2);
        g.gain.linearRampToValueAtTime(0, t + dur + 1.8);
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f * 0.965, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.35);
        const vib = ctx.createOscillator();
        vib.frequency.value = rnd(4.6, 5.6);
        const vg = ctx.createGain();
        vg.gain.value = f * 0.006;
        vib.connect(vg);
        vg.connect(o.frequency);
        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = f * 2;
        const g2 = ctx.createGain();
        g2.gain.value = 0.12;
        o2.connect(g2);
        g2.connect(g);
        o.connect(g);
        const ns = ctx.createBufferSource();
        ns.buffer = S.nb;
        ns.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = f * 1.5;
        bp.Q.value = 5;
        const ng = ctx.createGain();
        ng.gain.value = 0.9;
        ns.connect(bp);
        bp.connect(ng);
        ng.connect(g);
        g.connect(bus);
        const end = t + dur + 2;
        [o, vib, o2, ns].forEach(x => { x.start(t); x.stop(end); });
      }

      return {
        tick(level) {
          const now = ctx.currentTime;
          if (level < 0.02) { nextP = 0; nextF = 0; return; }
          if (!nextP) { nextP = now + rnd(0.5, 2); nextF = M.flute ? now + rnd(6, 14) : 0; }
          while (nextP < now + 0.6) {
            note(Math.max(nextP, now));
            if (run > 0) { run--; nextP += rnd(0.22, 0.42); }
            else {
              nextP += rnd(M.gap[0], M.gap[1]);
              if (Math.random() < M.run) run = 1 + ((Math.random() * 3) | 0);
            }
          }
          if (M.flute && nextF && nextF < now + 0.6) {
            breath(Math.max(nextF, now));
            nextF += rnd(M.flute[0], M.flute[1]);
          }
        }
      };
    }
  };
})();
