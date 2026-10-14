(function () {
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  const flash = document.getElementById('flash');
  const N = DS.scenes.length;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let on = true;
  let last = performance.now();
  let nextFlash = 3;
  let clock = 0;
  let cs = 1;

  function size() {
    const k = Math.min(1, 1600 / innerWidth);
    cv.width = Math.round(innerWidth * k);
    cv.height = Math.round(innerHeight * k);
    cs = k;
  }
  size();
  addEventListener('resize', size);

  document.addEventListener('motionchange', e => {
    on = e.detail;
    if (!on) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      flash.style.opacity = 0;
    }
  });

  const fogSprite = document.createElement('canvas');
  fogSprite.width = 256;
  fogSprite.height = 256;
  (function () {
    const x = fogSprite.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(236,241,245,1)');
    g.addColorStop(1, 'rgba(236,241,245,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
  })();

  const seed = {
    rain: n => Array.from({ length: n }, () => ({ x: rnd(-300, 2100), y: rnd(0, 1080), v: rnd(1500, 2300), l: rnd(18, 40), a: rnd(0.25, 0.6) })),
    snow: n => Array.from({ length: n }, () => ({ x: rnd(0, 1920), y: rnd(0, 1080), v: rnd(50, 130), r: rnd(1.6, 4.2), p: rnd(0, 6.28), a: rnd(0.55, 0.95) })),
    leaves: n => Array.from({ length: n }, () => ({ x: rnd(0, 2000), y: rnd(-200, 1080), v: rnd(60, 130), r: rnd(6, 12), p: rnd(0, 6.28), s: rnd(1, 2.4), c: ['#c8372d', '#d9822b', '#b8923a', '#a8321f'][Math.floor(rnd(0, 4))] })),
    sparkle: n => Array.from({ length: n }, () => ({ x: rnd(0, 1920), y: rnd(570, 1000), p: rnd(0, 6.28), s: rnd(0.8, 2.2), r: rnd(2, 5) })),
    lights: n => Array.from({ length: n }, () => ({ x: rnd(1280, 1900), y: rnd(534, 556), p: rnd(0, 6.28), s: rnd(1, 3), r: rnd(1.4, 3) })),
    stars: n => Array.from({ length: n }, () => ({ x: rnd(0, 1920), y: rnd(0, 500), p: rnd(0, 6.28), s: rnd(0.6, 2), r: rnd(1, 2.6) })),
    fog: n => Array.from({ length: n }, () => ({ x: rnd(-300, 2200), y: rnd(300, 900), r: rnd(380, 760), v: rnd(10, 36), a: rnd(0.16, 0.3) }))
  };

  const plan = {
    storm: [['rain', 520]],
    rain: [['rain', 280]],
    snow: [['snow', 260]],
    snowlight: [['snow', 60]],
    leaves: [['leaves', 44]],
    sparkle: [['sparkle', 34]],
    lights: [['lights', 26], ['stars', 40]],
    stars: [['stars', 120]],
    fog: [['fog', 8]],
    none: []
  };

  const pools = {};
  function pool(key, kind, n) {
    if (!pools[key]) pools[key] = seed[kind](n);
    return pools[key];
  }

  function draw(kind, list, dt, al) {
    if (kind === 'rain') {
      ctx.lineWidth = 1.6;
      const lv = [0.3, 0.42, 0.54];
      lv.forEach((a, bi) => {
        ctx.strokeStyle = 'rgba(214,226,238,' + a * al + ')';
        ctx.beginPath();
        list.forEach((p, i) => {
          if (i % 3 !== bi) return;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.l * 0.22, p.y - p.l);
        });
        ctx.stroke();
      });
      list.forEach(p => {
        p.y += p.v * dt;
        p.x -= p.v * 0.22 * dt;
        if (p.y > 1100) { p.y = -50; p.x = rnd(-100, 2200); }
      });
    } else if (kind === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,' + 0.8 * al + ')';
      ctx.beginPath();
      list.forEach(p => {
        p.y += p.v * dt;
        p.x += Math.sin(clock * 0.8 + p.p) * 24 * dt;
        if (p.y > 1100) { p.y = -20; p.x = rnd(0, 1920); }
        ctx.moveTo(p.x + p.r, p.y);
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
      });
      ctx.fill();
    } else if (kind === 'leaves') {
      list.forEach(p => {
        p.y += p.v * dt;
        p.x -= 40 * dt;
        p.p += p.s * dt;
        if (p.y > 1100 || p.x < -50) { p.y = -30; p.x = rnd(300, 2100); }
        ctx.save();
        ctx.translate(p.x + Math.sin(p.p) * 18, p.y);
        ctx.rotate(p.p);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.9 * al;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      });
    } else if (kind === 'sparkle') {
      list.forEach(p => {
        const k = Math.max(0, Math.sin(clock * p.s + p.p));
        ctx.fillStyle = 'rgba(255,246,214,' + k * 0.8 * al + ')';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r * 2.4, p.r * 0.6, 0, 0, 6.283);
        ctx.fill();
      });
    } else if (kind === 'lights' || kind === 'stars') {
      list.forEach(p => {
        const k = 0.45 + 0.55 * Math.sin(clock * p.s + p.p);
        ctx.fillStyle = kind === 'lights' ? 'rgba(255,200,120,' + k * al + ')' : 'rgba(255,255,240,' + k * 0.8 * al + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      });
    } else if (kind === 'fog') {
      list.forEach(p => {
        p.x += p.v * dt;
        if (p.x - p.r > 2000) p.x = -p.r;
        ctx.globalAlpha = p.a * al;
        ctx.drawImage(fogSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        ctx.globalAlpha = 1;
      });
    }
  }

  function strike() {
    flash.style.display = 'block';
    gsap.timeline({ onComplete: () => { flash.style.display = 'none'; } })
      .to(flash, { opacity: 0.55, duration: 0.05 })
      .to(flash, { opacity: 0.1, duration: 0.09 })
      .to(flash, { opacity: 0.45, duration: 0.05 })
      .to(flash, { opacity: 0, duration: 0.5 });
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    if (!on || !DS.view || DS.paused || DS.stageVisible === false) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(DS.view.s * cs, 0, 0, DS.view.s * cs, DS.view.ox * cs, DS.view.oy * cs);
    const wts = DS.fx.weights;
    for (let i = 0; i < N; i++) {
      const al = wts[i];
      if (al < 0.02) continue;
      const kinds = plan[DS.scenes[i].weather] || [];
      kinds.forEach(([kind, n]) => {
        const key = DS.scenes[i].weather + kind;
        draw(kind, pool(key, kind, n), dt, al);
      });
    }
    if (wts[3] > 0.4) {
      nextFlash -= dt;
      if (nextFlash <= 0) {
        strike();
        nextFlash = rnd(3, 8);
      }
    }
  }
  requestAnimationFrame(frame);
})();
