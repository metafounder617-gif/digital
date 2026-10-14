(function () {
  const W = 1920;
  const H = 1080;
  const cfg = DS.scenes;
  const N = cfg.length;
  const IMG = 'assets/img/';
  const MODELS = 'assets/models/';
  const stage = document.getElementById('stage');
  const nav = document.getElementById('nav');
  const hero = document.getElementById('hero');
  const hudJp = document.getElementById('hud-jp');
  const hudEn = document.getElementById('hud-en');
  const hudName = document.getElementById('hud-name');
  const hudNum = document.getElementById('hud-num');
  const hudBtn = document.getElementById('hud-product');

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const dolly = (q, smax) => 1 / (1 - q * (1 - 1 / smax));

  function div(cls, parent) {
    const d = document.createElement('div');
    d.className = cls;
    parent.appendChild(d);
    return d;
  }

  function layer(parent, v) {
    const d = div('layer', parent);
    d.style.transformOrigin = v.x + 'px ' + v.y + 'px';
    return d;
  }

  function pic(parent, name, x, y, w, h, flip) {
    const i = document.createElement('img');
    i.src = IMG + name + '.webp';
    i.alt = '';
    i.draggable = false;
    i.style.left = x + 'px';
    i.style.top = y + 'px';
    i.style.width = w + 'px';
    i.style.height = h + 'px';
    if (flip) i.style.transform = 'scaleX(-1)';
    parent.appendChild(i);
    return i;
  }

  const bakeQueue = [];
  function bake(img, name, filt, fade) {
    if (!filt && !fade) return;
    bakeQueue.push(() => new Promise(done => {
      const src = new Image();
      src.onload = () => {
        const c = document.createElement('canvas');
        c.width = src.naturalWidth;
        c.height = src.naturalHeight;
        const x = c.getContext('2d');
        if (filt) x.filter = filt;
        x.drawImage(src, 0, 0);
        x.filter = 'none';
        if (fade) {
          const g = x.createLinearGradient(0, 0, 0, c.height);
          g.addColorStop(fade, '#000');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          x.globalCompositeOperation = 'destination-in';
          x.fillStyle = g;
          x.fillRect(0, 0, c.width, c.height);
        }
        c.toBlob(b => {
          if (!b) return done();
          const u = URL.createObjectURL(b);
          const n = new Image();
          n.src = u;
          n.decode().then(() => { img.src = u; done(); }, done);
        }, 'image/webp', 0.95);
      };
      src.onerror = done;
      src.src = IMG + name + '.webp';
    }));
  }
  function runBake() {
    const job = bakeQueue.shift();
    if (!job) return;
    job().then(() => setTimeout(runBake, 40));
  }

  const tierWorld = div('tier', stage);
  const tierMid = div('tier', stage);
  const tierNear = div('tier', stage);

  const scenes = cfg.map((s, k) => {
    const g = DS.gates[s.gate];
    const gw = g.draw;
    const gh = (gw * g.h) / g.w;
    const gateCx = (s.side === 'R' ? 760 : 1180) + ((k * 37) % 90) - 45;
    const gl = gateCx - gw / 2;
    const gt = g.bottom - gh;
    const o = { x1: gl + g.o.l * gw, x2: gl + g.o.r * gw, y1: gt + g.o.t * gh, y2: gt + g.o.b * gh };
    const v = { x: (o.x1 + o.x2) / 2, y: (o.y1 + o.y2) / 2 };
    const sg = 1.12 * Math.max(v.x / (v.x - o.x1), (W - v.x) / (o.x2 - v.x), v.y / (v.y - o.y1), (H - v.y) / (o.y2 - v.y));

    const wclip = div('wclip', tierWorld);
    wclip.style.zIndex = 100 - k;
    const bgL = layer(wclip, v);
    const bg = pic(bgL, s.bg, 0, 0, W, H);
    bg.style.objectFit = 'cover';
    const cloudL = layer(wclip, v);
    if (s.clouds) {
      const a = pic(cloudL, 'cloud-a', -60, 90, 1000, 274);
      const b = pic(cloudL, 'cloud-b', 900, 50, 1000, 239);
      a.className = 'cloud drift-a';
      b.className = 'cloud drift-b';
    }
    const farL = layer(wclip, v);
    DS.farSets[k % DS.farSets.length].forEach(f => {
      const fh = (f.draw * f.h) / f.w;
      const im = pic(farL, f.img, f.cx - f.draw / 2, f.bottom - fh, f.draw, fh, f.flip);
      const sfilt = s.filter === 'none' ? '' : s.filter;
      bake(im, f.img, 'saturate(0.75) brightness(1.06) opacity(0.92)' + (sfilt ? ' ' + sfilt : ''), f.img !== 'rock-cluster' ? 0.84 : 0);
      const sf = div('foam', farL);
      sf.style.left = f.cx - f.draw * 0.58 + 'px';
      sf.style.top = f.bottom - 30 + 'px';
      sf.style.width = f.draw * 1.16 + 'px';
    });

    const gateL = layer(tierMid, v);
    gateL.style.zIndex = 100 - k;
    const gimg = pic(gateL, 'hi/' + g.img, gl, gt, gw, gh);
    bake(gimg, 'hi/' + g.img, s.filter === 'none' ? '' : s.filter, 0.9);
    const foam = div('foam', gateL);
    foam.style.left = gateCx - gw * 0.54 + 'px';
    foam.style.top = g.bottom - 34 + 'px';
    foam.style.width = gw * 1.08 + 'px';

    const nearL = layer(tierNear, v);
    nearL.style.zIndex = 100 - k;
    const p = DS.peds[s.ped];
    const pw = p.draw;
    const ph = (pw * p.h) / p.w;
    const pedBottom = s.pedBottom || 1012;
    const pedLeft = s.ped === 'ledge' ? -60 : (s.side === 'R' ? 1500 : 420) - pw / 2;
    const modelX = pedLeft + p.cx * pw;
    const ground = pedBottom - ph + p.top * ph;
    const pedImg = pic(nearL, p.img, pedLeft, pedBottom - ph, pw, ph);
    pedImg.className = 'ped';
    bake(pedImg, p.img, s.filter === 'none' ? '' : s.filter, s.pedBottom ? 0.9 : 0);
    if (s.pedBottom) {
      const pf = div('foam', nearL);
      pf.style.left = pedLeft - pw * 0.06 + 'px';
      pf.style.top = pedBottom - 34 + 'px';
      pf.style.width = pw * 1.12 + 'px';
    }
    pedImg.addEventListener('click', () => DS.openProduct(k));

    const BOX = 780;
    const rk = BOX / 580;
    const zoomPct = parseFloat(s.model.zoom || '100') * rk;
    const cy = ground - 240 + (s.model.dy || 0);
    const mv = document.createElement('model-viewer');
    mv.className = 'device';
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('rotation-per-second', '22deg');
    mv.setAttribute('camera-orbit', '25deg 80deg ' + zoomPct + '%');
    mv.setAttribute('max-camera-orbit', 'auto auto 400%');
    mv.setAttribute('min-camera-orbit', 'auto auto 20%');
    mv.setAttribute('shadow-intensity', '0');
    mv.setAttribute('exposure', String(s.exposure));
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('disable-zoom', '');
    mv.setAttribute('disable-pan', '');
    if (s.model.orient) mv.setAttribute('orientation', s.model.orient);
    if (s.model.float) mv.classList.add('float');
    if (s.filter !== 'none') mv.style.filter = s.filter;
    mv.style.left = modelX - BOX / 2 + 'px';
    mv.style.top = cy - BOX / 2 + 'px';
    mv.style.width = BOX + 'px';
    mv.style.height = BOX + 'px';
    nearL.appendChild(mv);

    const hz = s.model.hit || { w: 380, h: 520 };
    const hit = div('hit', nearL);
    hit.style.left = modelX - hz.w / 2 + 'px';
    hit.style.top = cy - hz.h / 2 + 'px';
    hit.style.width = hz.w + 'px';
    hit.style.height = hz.h + 'px';
    hit.addEventListener('click', () => DS.openProduct(k));
    hit.addEventListener('mouseenter', () => mv.classList.add('hot'));
    hit.addEventListener('mouseleave', () => mv.classList.remove('hot'));

    if (s.strip !== 'none') {
    const sd = DS.strips[s.strip];
    const sw = 2100;
    const stripImg = pic(nearL, sd.img, -90, 930, sw, (sw * sd.h) / sd.w);
    bake(stripImg, sd.img, s.filter === 'none' ? '' : s.filter, 0);
    }

    return { k, s, v, o, sg, wclip, bgL, cloudL, farL, gateL, nearL, mv, loaded: false, state: '' };
  });

  function fit() {
    const sc = Math.max(innerWidth / W, innerHeight / H);
    const ox = (innerWidth - W * sc) / 2;
    const oy = (innerHeight - H * sc) / 2;
    stage.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + sc + ')';
    DS.view = { s: sc, ox, oy };
  }
  fit();
  addEventListener('resize', fit);

  DS.fx = { weights: new Array(N).fill(0) };
  DS.current = 0;

  function put(l, op, s, tx, ty) {
    l.style.opacity = op;
    l.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
  }

  function setModels(i) {
    scenes.forEach(sc => {
      const want = sc.k >= i - 1 && sc.k <= i + 2;
      if (want && !sc.loaded) {
        sc.mv.setAttribute('src', MODELS + sc.s.model.src);
        sc.loaded = true;
      } else if (!want && sc.loaded && Math.abs(sc.k - i) > 4) {
        sc.mv.removeAttribute('src');
        sc.loaded = false;
      }
    });
  }

  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  addEventListener('mousemove', e => {
    tmx = (e.clientX / innerWidth - 0.5) * 2;
    tmy = (e.clientY / innerHeight - 0.5) * 2;
  });

  const veilEl = document.createElement('div');
  veilEl.className = 'veil';
  const veilFill = div('veil-fill', veilEl);
  const veilA = document.createElement('img');
  const veilB = document.createElement('img');
  veilA.src = IMG + 'cloud-a.webp';
  veilB.src = IMG + 'cloud-b.webp';
  veilA.className = 'veil-cloud va';
  veilB.className = 'veil-cloud vb';
  veilEl.appendChild(veilA);
  veilEl.appendChild(veilB);
  stage.parentNode.insertBefore(veilEl, stage.nextSibling);

  const tone = k => (cfg[k].dark ? [20, 27, 42] : [236, 230, 216]);
  const mixc = (a, b, x) => a.map((v, i) => Math.round(v + (b[i] - v) * x));
  const sm = x => x * x * (3 - 2 * x);

  function veilState(I, t, last) {
    const rise = last ? 0 : sm(clamp((t - 0.62) / 0.38));
    const fall = I > 0 ? 1 - sm(clamp(t / 0.3)) : 0;
    if (rise > 0 && rise >= fall) return { a: rise, c: mixc(tone(I), tone(I + 1), rise * 0.5) };
    if (fall > 0) return { a: fall, c: mixc(tone(I - 1), tone(I), 0.5 + 0.5 * (1 - fall)) };
    return { a: 0, c: null };
  }

  let veilOn = false;
  function paintVeil(v, f) {
    if (v.a < 0.004) {
      if (veilOn) {
        veilEl.style.display = 'none';
        veilOn = false;
      }
      return;
    }
    if (!veilOn) {
      veilEl.style.display = 'block';
      veilOn = true;
    }
    veilFill.style.background = 'rgb(' + v.c[0] + ',' + v.c[1] + ',' + v.c[2] + ')';
    veilFill.style.opacity = v.a * 0.94;
    veilEl.style.setProperty('--va', v.a);
    veilA.style.opacity = v.a;
    veilB.style.opacity = v.a;
    veilA.style.transform = 'translateX(' + f * -540 + 'px)';
    veilB.style.transform = 'translateX(' + f * 420 + 'px)';
  }

  function reset(l) {
    l.style.transform = '';
    l.style.opacity = 0.01;
  }

  function enter(sc, role) {
    const prevRole = sc.state;
    sc.state = role;
    sc.nearL.classList.toggle('off', role !== 'cur');
    if (role === 'off') {
      sc.wclip.style.display = 'none';
      sc.gateL.style.display = 'none';
      sc.nearL.style.display = 'none';
      sc.mv.style.display = 'none';
      return;
    }
    sc.wclip.style.display = 'block';
    if (role === 'prev') {
      [sc.bgL, sc.cloudL, sc.farL, sc.gateL, sc.nearL].forEach(reset);
      sc.wclip.style.opacity = 0.01;
      sc.gateL.style.display = 'block';
      sc.nearL.style.display = 'block';
      sc.mv.style.display = 'none';
      return;
    }
    if (role === 'next') {
      sc.gateL.style.display = 'none';
      sc.nearL.style.display = 'none';
      sc.mv.style.display = 'none';
      sc.cloudL.style.opacity = 0;
      sc.farL.style.opacity = 0;
      sc.bgL.style.transformOrigin = sc.v.x + 'px ' + sc.v.y + 'px';
      return;
    }
    sc.gateL.style.display = 'block';
    sc.nearL.style.display = 'block';
    sc.mv.style.display = '';
    sc.bgL.style.transformOrigin = sc.v.x + 'px ' + sc.v.y + 'px';
  }

  let lastLabel = 0;
  let heroH = hero.offsetHeight;
  let navLight = null;
  function updateNav() {
    const onHero = scrollY < heroH - innerHeight * 0.4;
    const v = !onHero && cfg[lastLabel].dark;
    if (v !== navLight) {
      navLight = v;
      nav.classList.toggle('light', v);
    }
  }
  const journey = document.getElementById('journey');
  const hudNumBox = document.querySelector('.hud-count');
  let hudOp = 1;
  function fadeHud() {
    const b = journey.getBoundingClientRect().bottom;
    const v = clamp((b - innerHeight * 0.55) / (innerHeight * 0.35));
    if (Math.abs(v - hudOp) < 0.01 && v !== 0 && v !== 1) return;
    hudOp = v;
    hudBtn.style.opacity = v;
    if (hudNumBox) hudNumBox.style.opacity = v;
  }
  addEventListener('scroll', () => { updateNav(); fadeHud(); }, { passive: true });
  addEventListener('resize', () => { heroH = hero.offsetHeight; });

  function render(f) {
    const I = Math.min(N - 1, Math.floor(f));
    const t = f - I;
    const last = I === N - 1;
    const q = last ? 0 : clamp((t - 0.55) / 0.45);
    const w = ease(clamp(t / 0.28));
    const d = clamp((t - 0.28) / 0.27);
    const fade = 1 - clamp((q - 0.88) / 0.12);
    const sgNow = dolly(q, scenes[I].sg);

    const vq = veilState(I, t, last);
    scenes.forEach(sc => {
      const role = sc.k === I ? 'cur' : sc.k === I + 1 ? 'next' : sc.k === I - 1 ? 'prev' : 'off';
      if (role !== sc.state) enter(sc, role);
      if (role === 'off' || role === 'prev') return;
      if (role === 'next') {
        sc.wclip.style.opacity = Math.max(0.01, ease(clamp((q - 0.4) / 0.5)));
        put(sc.bgL, 1, (0.82 + 0.18 * ease(q)) * 1.03, 0, 0);
        return;
      }
      const fly = q > 0;
      if (fly !== sc.fly) {
        sc.fly = fly;
        sc.gateL.style.willChange = fly ? 'auto' : 'transform, opacity';
      }
      sc.wclip.style.opacity = 1 - ease(clamp((q - 0.5) / 0.45));
      const ox = mx;
      const oy = my;
      put(sc.bgL, 1, dolly(q, 1.3) * 1.03 * (1 + 0.012 * d), ox * -4, oy * -2);
      put(sc.cloudL, fade * (1 - clamp((q - 0.6) / 0.4)), dolly(q, 3) * (1 + 0.02 * d), ox * -9, oy * -3);
      put(sc.farL, w * fade, dolly(q, 7) * (1 + 0.03 * d), ox * -16, oy * -5 + (1 - w) * 30);
      put(sc.gateL, w * fade, dolly(q, sc.sg) * (1 + 0.04 * d), ox * -26, oy * -8 + (1 - w) * 50);
      put(sc.nearL, w * fade, dolly(q, 26) * (1 + 0.05 * d), ox * -44, oy * -12 + (1 - w) * 120);
      sc.nearL.classList.toggle('off', q > 0 || w < 0.85);
    });
    paintVeil(vq, f);

    const label = !last && t > 0.8 ? I + 1 : I;
    if (label !== DS.current || !DS.hudReady) {
      DS.current = label;
      DS.hudReady = true;
      const s = cfg[label];
      hudJp.textContent = s.jp;
      hudEn.textContent = s.en;
      hudName.textContent = s.model.name;
      hudNum.textContent = String(label + 1).padStart(2, '0');
      hudBtn.classList.toggle('right', s.side === 'L');
    }
    lastLabel = !last && t > 0.97 ? I + 1 : I;
    updateNav();

    const wts = DS.fx.weights;
    for (let i = 0; i < N; i++) wts[i] = 0;
    wts[I] = last ? 1 : 1 - ease(clamp(q * 1.3));
    if (!last) wts[I + 1] = ease(q);
    setModels(I);
  }

  hudBtn.addEventListener('click', () => DS.openProduct(DS.current));

  let target = 0;
  let cur = 0;
  ScrollTrigger.create({
    trigger: '#journey',
    start: 'top top',
    end: () => '+=' + Math.round(N * innerHeight * 1.5),
    pin: '#stage-wrap',
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: self => {
      target = self.progress * N;
    }
  });

  let lc = -1;
  let lmx = 9;
  let lmy = 9;
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; DS.stageVisible = visible; }, { threshold: 0 }).observe(document.getElementById('stage-wrap'));
  DS.stageVisible = true;

  gsap.ticker.add(() => {
    if (!visible || DS.paused) return;
    cur += (target - cur) * 0.11;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    if (Math.abs(mx - tmx) < 0.002) mx = tmx;
    if (Math.abs(my - tmy) < 0.002) my = tmy;
    if (cur === lc && mx === lmx && my === lmy) return;
    lc = cur;
    lmx = mx;
    lmy = my;
    render(cur);
  });

  DS.setProgress = p => {
    target = p * N;
    cur = target;
    lc = cur;
    lmx = mx;
    lmy = my;
    render(cur);
  };
  render(0);
  setTimeout(runBake, 1500);
})();
