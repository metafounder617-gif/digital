(function () {
  const G = window.G;
  const art = (G.art = {});
  const OUT = '#1c1e26';

  function R(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function disc(ctx, cx, cy, rx, ry, c) {
    ctx.fillStyle = c;
    for (let j = -ry; j <= ry; j++) {
      const k = j / (ry + 0.5);
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - k * k)));
      ctx.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1);
    }
  }

  function shapes(ctx, list, outline) {
    if (outline !== false) {
      for (const s of list) {
        if (s[0] === 'd') disc(ctx, s[1], s[2], s[3] + 1, s[4] + 1, OUT);
        else if (s[0] === 'r') R(ctx, s[1] - 1, s[2] - 1, s[3] + 2, s[4] + 2, OUT);
      }
    }
    for (const s of list) {
      if (s[0] === 'd' || s[0] === 'f') disc(ctx, s[1], s[2], s[3], s[4], s[5]);
      else R(ctx, s[1], s[2], s[3], s[4], s[5]);
    }
  }

  art.R = R;
  art.disc = disc;
  art.shapes = shapes;
  art.OUT = OUT;

  const FONT = {
    0: '111101101101111',
    1: '010110010010111',
    2: '111001111100111',
    3: '111001111001111',
    4: '101101111001001',
    5: '111100111001111',
    6: '111100111101111',
    7: '111001001001001',
    8: '111101111101111',
    9: '111101111001111',
    '+': '000010111010000',
    x: '101101010101101',
    '/': '001001010100100',
    '-': '000000111000000',
    '!': '010010010000010',
    '?': '111001010000010'
  };

  art.text = function (ctx, str, x, y, color, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    let cx = x;
    for (const ch of String(str)) {
      const f = FONT[ch];
      if (f) {
        for (let i = 0; i < 15; i++) {
          if (f[i] === '1') {
            R(ctx, cx + (i % 3) + 1, y + Math.floor(i / 3) + 1, 1, 1, '#1c1e26');
          }
        }
        for (let i = 0; i < 15; i++) {
          if (f[i] === '1') R(ctx, cx + (i % 3), y + Math.floor(i / 3), 1, 1, color);
        }
      }
      cx += 4;
    }
    ctx.globalAlpha = 1;
  };

  const PAL = {
    skin: '#f0c49a',
    skinD: '#d49c70',
    hat: '#2a8f8a',
    hatD: '#1f6e6a',
    band: '#f6ecd2',
    top: '#e0a82e',
    topD: '#b5811c',
    scarf: '#e8553a',
    scarfD: '#b23a24',
    pants: '#4d4a6b',
    pantsD: '#3a3855',
    boot: '#f6f1e6',
    bootD: '#a39c8a',
    eye: '#1c1e26',
    hair: null,
    skirt: null,
    crown: null
  };
  art.PAL = PAL;
  art.NPC_PAL = {
    concierge: Object.assign({}, PAL, {
      hat: '#b8322a',
      hatD: '#8a2119',
      band: '#e8c76e',
      top: '#26324a',
      topD: '#1a2234',
      scarf: '#e8c76e',
      scarfD: '#b8923a',
      pants: '#1a2234',
      pantsD: '#10141f',
      boot: '#2a2f33',
      bootD: '#14171a'
    }),
    princess: Object.assign({}, PAL, {
      hat: '#f2c230',
      hatD: '#c79a1e',
      band: '#fff3b0',
      top: '#a77be0',
      topD: '#7f56b8',
      scarf: '#fff3b0',
      scarfD: '#d9c36a',
      pants: '#a77be0',
      pantsD: '#7f56b8',
      boot: '#f6f1e6',
      bootD: '#a39c8a',
      hair: '#3a2433',
      skirt: '#a77be0',
      crown: '#f2c230'
    })
  };

  function figure(ctx, x, y, view, o, p) {
    const b = o.bob | 0;
    const c = o.crouch | 0;
    const legH = 4 - c;
    const L = [];
    const hairL = p.hair;
    if (view === 'side') {
      if (o.armsUp) {
        L.push(['r', -5, -19 + b + c, 2, 6, p.topD]);
      } else {
        L.push(['r', -2 + (o.abx | 0), -11 + b + c, 2, 5, p.topD]);
      }
      if (p.skirt) {
        L.push(['r', -4, -7 + c, 8, 7 - c, p.skirt]);
        L.push(['e', -4, -1, 8, 1, p.pantsD]);
      } else {
        L.push(['r', -1 + (o.blx | 0), -6 - (o.bll | 0) + c, 2, legH, p.pantsD]);
        L.push(['r', -1 + (o.blx | 0), -2 - (o.bll | 0), 3, 2, p.bootD]);
      }
      L.push(['r', -3, -12 + b + c, 6, 6, p.top]);
      L.push(['e', -3, -12 + b + c, 6, 1, p.band === '#f6ecd2' ? '#f2c95e' : p.band]);
      if (!p.skirt) {
        L.push(['r', -1 + (o.flx | 0), -6 - (o.fll | 0) + c, 2, legH, p.pants]);
        L.push(['r', -1 + (o.flx | 0), -2 - (o.fll | 0), 3, 2, p.boot]);
      }
      const wv = Math.sin((o.t || 0) * 9);
      const run = o.run ? 1 : 0;
      for (let i = 0; i < 3; i++) {
        L.push(['r', -5 - i * 2, -13 + b + c + (run ? Math.round(Math.sin((o.t || 0) * 18 + i) * 1) : Math.round(wv * (i > 0 ? 1 : 0))), 2, 2, i % 2 ? p.scarfD : p.scarf]);
      }
      L.push(['r', -3, -13 + b + c, 6, 2, p.scarf]);
      if (hairL) L.push(['r', -5, -19 + b + c, 3, 12, hairL]);
      L.push(['r', -4, -21 + b + c, 8, 3, p.hat]);
      L.push(['r', -4, -18 + b + c, 8, 1, p.band]);
      if (p.crown) L.push(['e', -3, -23 + b + c, 6, 2, p.crown]);
      else L.push(['r', -1, -23 + b + c, 3, 2, p.band]);
      L.push(['r', -3, -17 + b + c, 7, 4, p.skin]);
      L.push(['e', 2, -16 + b + c, 1, 2, p.eye]);
      L.push(['e', -2, -16 + b + c, 1, 2, p.skinD]);
      L.push(['e', 4, -15 + b + c, 1, 1, p.skin]);
      if (o.point) {
        L.push(['r', 1, -11 + b + c, 6, 2, p.top]);
        L.push(['e', 7, -11 + b + c, 2, 2, p.skin]);
      } else if (o.wave !== undefined) {
        L.push(['r', 2, -17 + b + c + (o.wave | 0), 2, 6, p.top]);
        L.push(['e', 2, -18 + b + c + (o.wave | 0), 2, 2, p.skin]);
      } else if (o.armsUp) {
        L.push(['r', 3, -19 + b + c, 2, 6, p.top]);
        L.push(['e', 3, -20 + b + c, 2, 2, p.skin]);
      } else {
        L.push(['r', -1 + (o.afx | 0), -11 + b + c, 2, 5, p.top]);
        L.push(['e', -1 + (o.afx | 0), -6 + b + c, 2, 1, p.skin]);
      }
    } else if (view === 'front') {
      if (o.armsUp) {
        L.push(['r', -6, -19 + b + c, 2, 7, p.top]);
        L.push(['e', -6, -20 + b + c, 2, 2, p.skin]);
        L.push(['r', 4, -19 + b + c, 2, 7, p.top]);
        L.push(['e', 4, -20 + b + c, 2, 2, p.skin]);
      } else if (o.wave !== undefined) {
        L.push(['r', -5, -11 + b + c, 2, 5, p.topD]);
        L.push(['r', 3, -17 + b + c + (o.wave | 0), 2, 7, p.top]);
        L.push(['e', 3, -18 + b + c + (o.wave | 0), 2, 2, p.skin]);
      } else {
        L.push(['r', -5, -11 + b + c + (o.alo | 0), 2, 5, p.topD]);
        L.push(['e', -5, -6 + b + c + (o.alo | 0), 2, 1, p.skin]);
        L.push(['r', 3, -11 + b + c + (o.aro | 0), 2, 5, p.topD]);
        L.push(['e', 3, -6 + b + c + (o.aro | 0), 2, 1, p.skin]);
      }
      if (p.skirt) {
        L.push(['r', -5, -7 + c, 10, 7 - c, p.skirt]);
        L.push(['e', -5, -1, 10, 1, p.pantsD]);
      } else {
        L.push(['r', -3, -6 - (o.bll | 0) + c, 2, legH, p.pants]);
        L.push(['r', -4, -2 - (o.bll | 0), 3, 2, p.boot]);
        L.push(['r', 1, -6 - (o.fll | 0) + c, 2, legH, p.pants]);
        L.push(['r', 1, -2 - (o.fll | 0), 3, 2, p.boot]);
      }
      L.push(['r', -3, -12 + b + c, 6, 6, p.top]);
      L.push(['e', -1, -9 + b + c, 2, 3, p.topD]);
      L.push(['r', -3, -13 + b + c, 6, 2, p.scarf]);
      L.push(['e', 0, -11 + b + c, 2, 3, p.scarfD]);
      if (hairL) {
        L.push(['r', -5, -19 + b + c, 2, 11, hairL]);
        L.push(['r', 3, -19 + b + c, 2, 11, hairL]);
      }
      L.push(['r', -4, -21 + b + c, 8, 3, p.hat]);
      L.push(['r', -4, -18 + b + c, 8, 1, p.band]);
      if (p.crown) L.push(['e', -3, -23 + b + c, 6, 2, p.crown]);
      else L.push(['r', -2, -23 + b + c, 3, 2, p.band]);
      L.push(['r', -3, -17 + b + c, 6, 4, p.skin]);
      const blink = o.blink ? 1 : 2;
      L.push(['e', -2, -16 + b + c, 1, blink, p.eye]);
      L.push(['e', 1, -16 + b + c, 1, blink, p.eye]);
      L.push(['e', -1, -14 + b + c, 2, 1, p.skinD]);
    } else {
      L.push(['r', -5, -11 + b + c + (o.alo | 0), 2, 5, p.topD]);
      L.push(['r', 3, -11 + b + c + (o.aro | 0), 2, 5, p.topD]);
      if (p.skirt) {
        L.push(['r', -5, -7 + c, 10, 7 - c, p.skirt]);
      } else {
        L.push(['r', -3, -6 - (o.bll | 0) + c, 2, legH, p.pantsD]);
        L.push(['r', -4, -2 - (o.bll | 0), 3, 2, p.bootD]);
        L.push(['r', 1, -6 - (o.fll | 0) + c, 2, legH, p.pantsD]);
        L.push(['r', 1, -2 - (o.fll | 0), 3, 2, p.bootD]);
      }
      L.push(['r', -3, -12 + b + c, 6, 6, p.topD]);
      L.push(['r', -3, -13 + b + c, 6, 2, p.scarf]);
      L.push(['e', -1, -11 + b + c, 2, 6, p.scarfD]);
      if (hairL) L.push(['r', -4, -19 + b + c, 8, 12, hairL]);
      L.push(['r', -4, -21 + b + c, 8, 6, p.hat]);
      L.push(['e', -4, -17 + b + c, 8, 1, p.hatD]);
      L.push(['e', -3, -15 + b + c, 6, 2, p.skinD]);
      if (p.crown) L.push(['e', -3, -23 + b + c, 6, 2, p.crown]);
      else L.push(['r', -2, -23 + b + c, 3, 2, p.band]);
    }
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (o.flip) ctx.scale(-1, 1);
    shapes(ctx, L, true);
    ctx.restore();
  }

  art.figure = figure;

  const custom = {};
  art.loadCustom = function () {
    const cfg = window.GAME_SPRITES || {};
    const anims = window.GAME_SPRITE_ANIMS || {};
    Object.keys(cfg).forEach(name => {
      const c = cfg[name];
      (c.sheets || []).forEach(a => {
        if (!anims[a]) return;
        const img = new Image();
        img.onload = () => {
          custom[name] = custom[name] || { cell: c.cell, a: {} };
          custom[name].a[a] = img;
        };
        img.src = c.folder + a + '.png';
      });
    });
  };

  function drawCustom(ctx, name, pose, x, y, t, flip) {
    const c = custom[name];
    if (!c) return false;
    const anims = window.GAME_SPRITE_ANIMS;
    const map = { fall2: 'fall', crouch: 'land', climb: 'idle', enter: 'idle', sit: 'idle' };
    const key = map[pose] || pose;
    const img = c.a[key] || c.a.idle;
    if (!img) return false;
    const spec = anims[c.a[key] ? key : 'idle'];
    const f = Math.floor(t * spec.fps) % spec.n;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, f * c.cell[0], 0, c.cell[0], c.cell[1], -c.cell[0] / 2, -c.cell[1] + 2, c.cell[0], c.cell[1]);
    ctx.restore();
    return true;
  }

  art.sheet = drawCustom;

  function poseParams(pose, t, ph) {
    const o = { t };
    const s = Math.sin(ph * Math.PI * 2);
    switch (pose) {
      case 'run':
      case 'walk': {
        const k = pose === 'run' ? 3 : 2;
        o.run = pose === 'run';
        o.flx = Math.round(s * k);
        o.blx = -Math.round(s * k);
        o.fll = s < -0.3 ? 1 : 0;
        o.bll = s > 0.3 ? 1 : 0;
        o.afx = -Math.round(s * 2);
        o.abx = Math.round(s * 2);
        o.alo = Math.round(s * 1);
        o.aro = -Math.round(s * 1);
        o.bob = Math.abs(s) > 0.85 ? 1 : 0;
        break;
      }
      case 'jump':
        o.flx = 2;
        o.fll = 2;
        o.blx = -2;
        o.bll = 1;
        o.afx = 1;
        o.abx = -1;
        o.run = true;
        break;
      case 'fall':
      case 'fall2':
        o.armsUp = pose === 'fall';
        o.flx = Math.sin(t * 24) > 0 ? 2 : -1;
        o.blx = -o.flx;
        o.fll = 1;
        o.bll = 1;
        o.run = true;
        break;
      case 'land':
        o.crouch = 2;
        o.flx = 2;
        o.blx = -2;
        break;
      case 'crouch':
        o.crouch = 2;
        break;
      case 'point':
        o.point = true;
        break;
      case 'call':
        o.wave = Math.floor(t * 6) % 2 ? 0 : 1;
        break;
      case 'wait':
        o.bob = Math.floor(t * 3) % 2;
        o.fll = Math.floor(t * 3) % 2 ? 1 : 0;
        break;
      case 'hurt':
        o.armsUp = true;
        o.flx = -2;
        o.blx = 2;
        o.fll = 1;
        break;
      case 'happy':
        o.armsUp = true;
        o.bob = Math.floor(t * 6) % 2;
        break;
      case 'climb':
        o.alo = Math.floor(ph * 2) % 2 ? -3 : 1;
        o.aro = -o.alo;
        o.bll = Math.floor(ph * 2) % 2 ? 1 : 0;
        o.fll = 1 - o.bll;
        break;
      default:
        o.bob = Math.floor(t * 2) % 2;
        o.blink = Math.floor(t * 0.9) % 4 === 0 && (t * 0.9) % 1 > 0.9;
    }
    return o;
  }

  art.hero = function (ctx, x, y, pose, t, face, ph, view) {
    if (drawCustom(ctx, 'hero', pose, x, y, t, face < 0)) return;
    const o = poseParams(pose, t, ph || 0);
    let v = view || 'side';
    if (pose === 'look_front' || pose === 'enter') v = 'front';
    if (pose === 'climb') v = 'back';
    if (pose === 'call' && !view) v = 'side';
    o.flip = face < 0;
    if (v === 'front' && pose === 'call') o.wave = 0;
    figure(ctx, x, y, v, o, PAL);
  };

  art.person = function (ctx, who, x, y, pose, t, face, view) {
    const p = art.NPC_PAL[who] || PAL;
    if (drawCustom(ctx, who, pose, x, y, t, face < 0)) return;
    const o = poseParams(pose, t, 0);
    o.flip = face < 0;
    figure(ctx, x, y, view || 'side', o, p);
  };

  art.heroTop = function (ctx, x, y, dir, moving, t, ph, hop) {
    const yy = y - (hop || 0);
    const s = Math.sin(ph * Math.PI * 2);
    const o = { t };
    if (moving) {
      o.fll = s > 0.2 ? 1 : 0;
      o.bll = s < -0.2 ? 1 : 0;
      o.alo = Math.round(s);
      o.aro = -Math.round(s);
      o.bob = Math.abs(s) > 0.85 ? 1 : 0;
      o.flx = Math.round(s * 2);
      o.blx = -Math.round(s * 2);
      o.afx = -Math.round(s * 2);
      o.abx = Math.round(s * 2);
    } else {
      o.bob = Math.floor(t * 2) % 2;
      o.blink = Math.floor(t * 0.9) % 4 === 0 && (t * 0.9) % 1 > 0.9;
    }
    if (hop) {
      o.fll = 1;
      o.bll = 1;
    }
    let view = 'front';
    if (dir === 'up') view = 'back';
    else if (dir === 'left' || dir === 'right') view = 'side';
    o.flip = dir === 'left';
    if (drawCustom(ctx, 'hero', moving ? 'run' : 'idle', x, yy, t, dir === 'left')) return;
    figure(ctx, x, yy, view, o, PAL);
  };

  art.shadow = function (ctx, x, y, w) {
    ctx.fillStyle = 'rgba(20,23,26,0.35)';
    const hw = Math.round(w / 2);
    ctx.fillRect(x - hw + 1, y - 1, w - 2, 1);
    ctx.fillRect(x - hw, y, w, 2);
    ctx.fillRect(x - hw + 1, y + 2, w - 2, 1);
  };

  const CR = {
    zipp: o => [
      ['d', 0, -7, 6, 6, '#3d6fe0'],
      ['r', -5, -15, 2, 4, '#3d6fe0'],
      ['r', 3, -15, 2, 4, '#3d6fe0'],
      ['r', -4, -2, 3, 2, '#2b52b0'],
      ['r', 2, -2, 3, 2, '#2b52b0'],
      ['r', 6, -10 + o.wag, 3, 2, '#f4c430'],
      ['r', 8, -12 + o.wag, 2, 3, '#f4c430'],
      ['r', 6, -14 + o.wag, 3, 2, '#f4c430'],
      ['e', -5, -16, 2, 2, '#f4c430'],
      ['e', 3, -16, 2, 2, '#f4c430'],
      ['f', 0, -5, 3, 3, '#f6ecd2'],
      ['e', -3, -10, 2, 2, '#11131a'],
      ['e', 2, -10, 2, 2, '#11131a'],
      ['e', -3, -10, 1, 1, '#fff'],
      ['e', 2, -10, 1, 1, '#fff'],
      ['e', -6, -7, 2, 2, '#e8553a'],
      ['e', 5, -7, 2, 2, '#e8553a']
    ],
    ember: o => [
      ['d', 0, -6, 5, 5, '#f08a3c'],
      ['r', 4, -4, 5, 2, '#f08a3c'],
      ['r', 8, -6 + o.wag, 2, 3, '#f08a3c'],
      ['r', -4, -2, 3, 2, '#c4601f'],
      ['r', 2, -2, 3, 2, '#c4601f'],
      ['r', -3, -13, 2, 3, '#f08a3c'],
      ['r', 2, -13, 2, 3, '#f08a3c'],
      ['e', 9, -9 + o.wag, 3, 3, '#ffd23a'],
      ['e', 10, -11 + o.wag, 2, 2, '#ff5a2a'],
      ['f', 0, -4, 3, 3, '#f6ecd2'],
      ['e', -3, -9, 2, 2, '#11131a'],
      ['e', 2, -9, 2, 2, '#11131a'],
      ['e', -3, -9, 1, 1, '#fff'],
      ['e', 2, -9, 1, 1, '#fff']
    ],
    sprout: o => [
      ['d', 0, -6, 6, 5, '#6cc04a'],
      ['r', -5, -2, 3, 2, '#3f8f2a'],
      ['r', 3, -2, 3, 2, '#3f8f2a'],
      ['r', 0, -14, 1, 3, '#3f8f2a'],
      ['r', -5, -16 + o.wag, 5, 2, '#3f8f2a'],
      ['r', 1, -17 - o.wag, 5, 2, '#58b03a'],
      ['f', 0, -4, 4, 3, '#a6e07a'],
      ['e', -3, -9, 2, 2, '#11131a'],
      ['e', 2, -9, 2, 2, '#11131a'],
      ['e', -3, -9, 1, 1, '#fff'],
      ['e', 2, -9, 1, 1, '#fff'],
      ['e', -1, -6, 2, 1, '#2d6a1c']
    ],
    droplet: o => [
      ['d', 0, -6, 5, 5, '#4aa8ff'],
      ['r', -1, -14, 3, 3, '#4aa8ff'],
      ['r', 0, -16 - o.wag, 1, 2, '#4aa8ff'],
      ['r', -8, -6 + o.wag, 3, 3, '#2f86d8'],
      ['r', 6, -6 + o.wag, 3, 3, '#2f86d8'],
      ['r', -3, -2, 2, 2, '#2f86d8'],
      ['r', 2, -2, 2, 2, '#2f86d8'],
      ['e', -3, -10, 2, 3, '#bfe4ff'],
      ['e', -3, -8, 2, 2, '#11131a'],
      ['e', 2, -8, 2, 2, '#11131a'],
      ['e', -3, -8, 1, 1, '#fff'],
      ['e', 2, -8, 1, 1, '#fff'],
      ['e', -1, -5, 2, 1, '#1b5fa8']
    ],
    pebble: o => [
      ['d', 0, -6, 6, 5, '#8b8f98'],
      ['r', -5, -13, 3, 3, '#8b8f98'],
      ['r', 3, -13, 3, 3, '#8b8f98'],
      ['r', -4, -2, 3, 2, '#5f636c'],
      ['r', 2, -2, 3, 2, '#5f636c'],
      ['f', 0, -4, 3, 2, '#b6bac2'],
      ['e', -5, -9, 3, 1, '#5f636c'],
      ['e', 4, -5, 2, 1, '#5f636c'],
      ['e', -3, -8, 2, 2, '#11131a'],
      ['e', 2, -8, 2, 2, '#11131a'],
      ['e', -3, -8, 1, 1, '#fff'],
      ['e', 2, -8, 1, 1, '#fff']
    ],
    fluff: o => [
      ['d', 0, -7, 6, 6, '#ffb3c7'],
      ['r', -1, -16, 3, 3, '#ff7ba0'],
      ['r', 1, -17 - o.wag, 3, 2, '#ff7ba0'],
      ['r', -3, -2, 2, 2, '#ff9a2e'],
      ['r', 1, -2, 2, 2, '#ff9a2e'],
      ['f', -5, -6 + o.wag, 2, 3, '#ff8fb0'],
      ['f', 5, -6 + o.wag, 2, 3, '#ff8fb0'],
      ['e', -1, -8, 3, 2, '#ffb02e'],
      ['e', -3, -10, 2, 2, '#11131a'],
      ['e', 2, -10, 2, 2, '#11131a'],
      ['e', -3, -10, 1, 1, '#fff'],
      ['e', 2, -10, 1, 1, '#fff']
    ]
  };

  art.critter = function (ctx, kind, x, y, t, hop) {
    if (drawCustom(ctx, kind, 'idle', x, y - (hop || 0), t, false)) return;
    const fn = CR[kind] || CR.zipp;
    const wag = Math.floor(t * 4) % 2;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y - (hop || 0)));
    shapes(ctx, fn({ wag }), true);
    ctx.restore();
  };
  art.critterKinds = Object.keys(CR);

  art.munch = function (ctx, x, y, t, face, mouthOpen) {
    if (drawCustom(ctx, 'munch', 'idle', x, y, t, face < 0)) return;
    const open = mouthOpen === undefined ? Math.floor(t * 4) % 2 : mouthOpen;
    const L = [
      ['d', 0, -8, 7, 7, '#2fb5a8'],
      ['r', -5, -2, 3, 2, '#1f7f76'],
      ['r', 3, -2, 3, 2, '#1f7f76'],
      ['e', -5, -8 + (open ? 0 : 1), 11, open ? 4 : 2, '#2a1020'],
      ['e', -4, -8 + (open ? 0 : 1), 2, 1, '#fff'],
      ['e', 1, -8 + (open ? 0 : 1), 2, 1, '#fff'],
      ['e', -4, -14, 3, 3, '#fff'],
      ['e', 1, -14, 3, 3, '#fff'],
      ['e', -3, -13, 1, 2, '#11131a'],
      ['e', 2, -13, 1, 2, '#11131a']
    ];
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    shapes(ctx, L, true);
    ctx.restore();
  };

  const WISP = ['#8f4de0', '#6fd13a', '#ff7a59', '#6fd6ff'];
  art.wispColors = WISP;
  art.wisp = function (ctx, idx, x, y, t, dx, dy, mode, flash) {
    const col = WISP[idx % 4];
    const body = mode === 'scared' ? (flash && Math.floor(t * 8) % 2 ? '#f6ecd2' : '#2a3f9a') : col;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (mode === 'eyes') {
      shapes(
        ctx,
        [
          ['e', -4 + dx, -9 + dy, 3, 4, '#fff'],
          ['e', 1 + dx, -9 + dy, 3, 4, '#fff'],
          ['e', -3 + dx * 2, -8 + dy * 2, 1, 2, '#11131a'],
          ['e', 2 + dx * 2, -8 + dy * 2, 1, 2, '#11131a']
        ],
        false
      );
      ctx.restore();
      return;
    }
    const w = Math.floor(t * 8) % 2;
    const L = [
      ['d', 0, -9, 6, 5, body],
      ['r', -6, -9, 13, 6, body],
      ['r', -6, -3, 3, 2 + w, body],
      ['r', -1, -3, 3, 2 + (1 - w), body],
      ['r', 4, -3, 3, 2 + w, body]
    ];
    if (mode !== 'scared') L.push(['e', -1, -16, 3, 2, col === '#6fd6ff' ? '#fff' : '#f6ecd2']);
    if (mode === 'scared') {
      L.push(['e', -3, -10, 2, 2, '#ffe9a8']);
      L.push(['e', 2, -10, 2, 2, '#ffe9a8']);
      for (let i = 0; i < 5; i++) L.push(['e', -4 + i * 2, -6 + (i % 2), 1, 1, '#ffe9a8']);
    } else {
      L.push(['e', -4 + dx, -11 + dy, 3, 4, '#fff']);
      L.push(['e', 1 + dx, -11 + dy, 3, 4, '#fff']);
      L.push(['e', -3 + dx * 2, -10 + dy * 2, 1, 2, '#11131a']);
      L.push(['e', 2 + dx * 2, -10 + dy * 2, 1, 2, '#11131a']);
    }
    shapes(ctx, L, true);
    ctx.restore();
  };

  art.bug = function (ctx, kind, x, y, t, dir, squash) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (dir < 0) ctx.scale(-1, 1);
    const base = kind === 'ember' ? '#5a2c3e' : '#b3452f';
    const spot = kind === 'ember' ? '#ff8a2a' : '#f6ecd2';
    if (squash) {
      shapes(ctx, [['r', -7, -3, 15, 3, base], ['e', -3, -3, 2, 1, spot], ['e', 3, -3, 2, 1, spot]], true);
      ctx.restore();
      return;
    }
    const s = Math.floor(t * 6) % 2;
    const L = [
      ['d', 0, -5, 7, 5, base],
      ['r', -7, -5, 15, 3, base],
      ['r', -6, -2 - s, 4, 2 + s, '#2a1a1a'],
      ['r', 3, -2 - (1 - s), 4, 2 + (1 - s), '#2a1a1a'],
      ['e', -3, -9, 2, 2, spot],
      ['e', 2, -8, 2, 2, spot],
      ['e', 2, -5, 3, 3, '#fff'],
      ['e', -2, -5, 3, 3, '#fff'],
      ['e', 3, -4, 1, 2, '#11131a'],
      ['e', -1, -4, 1, 2, '#11131a'],
      ['e', -2, -6, 3, 1, '#11131a'],
      ['e', 2, -6, 3, 1, '#11131a']
    ];
    if (kind === 'ember') {
      L.push(['e', -2, -12, 2, 3, '#ffb02e']);
      L.push(['e', 1, -13, 2, 4, '#ff5a2a']);
    }
    shapes(ctx, L, true);
    ctx.restore();
  };

  art.barrel = function (ctx, x, y, ang) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    const q = Math.floor(ang / (Math.PI / 4)) % 4;
    const L = [['d', 0, 0, 6, 6, '#a86a32']];
    shapes(ctx, L, true);
    ctx.fillStyle = '#5a3a1e';
    if (q === 0) {
      ctx.fillRect(-5, -3, 11, 1);
      ctx.fillRect(-5, 3, 11, 1);
    } else if (q === 1) {
      ctx.fillRect(-3, -5, 1, 11);
      ctx.fillRect(3, -5, 1, 11);
    } else if (q === 2) {
      ctx.fillRect(-5, -2, 11, 1);
      ctx.fillRect(-5, 2, 11, 1);
    } else {
      ctx.fillRect(-2, -5, 1, 11);
      ctx.fillRect(2, -5, 1, 11);
    }
    ctx.fillStyle = '#d6a064';
    ctx.fillRect(-4, -4, 2, 1);
    ctx.fillStyle = '#6b707a';
    ctx.fillRect(0, 0, 1, 1);
    ctx.restore();
  };

  art.rivet = function (ctx, x, y, t, throwing) {
    if (drawCustom(ctx, 'rivet', throwing ? 'attack' : 'idle', x, y, t, false)) return;
    const b = Math.floor(t * 2) % 2;
    const up = throwing ? 1 : 0;
    const L = [
      ['r', -14, -10, 10, 10, '#4c5b6e'],
      ['r', 4, -10, 10, 10, '#4c5b6e'],
      ['r', -16, -3, 14, 3, '#2b3340'],
      ['r', 3, -3, 14, 3, '#2b3340'],
      ['r', -18, -34 + b, 36, 26, '#5a6b80'],
      ['r', -16, -32 + b, 32, 4, '#7b8da3'],
      ['r', -26, up ? -46 : -32 + b, 8, 22, '#4c5b6e'],
      ['r', 18, up ? -46 : -32 + b, 8, 22, '#4c5b6e'],
      ['r', -28, up ? -50 : -12 + b, 12, 8, '#2b3340'],
      ['r', 16, up ? -50 : -12 + b, 12, 8, '#2b3340'],
      ['r', -9, -45 + b, 18, 12, '#6b7d93'],
      ['r', -1, -52 + b, 2, 7, '#2b3340'],
      ['e', 0, -54 + b, 2, 2, up ? '#ff5a2a' : '#ffb02e'],
      ['e', -8, -24 + b, 16, 8, '#2b3340'],
      ['e', -6, -22 + b, 12, 4, up ? '#ff5a2a' : '#c4601f'],
      ['e', -6, -41 + b, 4, 3, '#ffb02e'],
      ['e', 2, -41 + b, 4, 3, '#ffb02e'],
      ['e', -6, -36 + b, 12, 2, '#2b3340'],
      ['e', -4, -36 + b, 2, 2, '#fff'],
      ['e', 2, -36 + b, 2, 2, '#fff']
    ];
    for (let i = 0; i < 4; i++) {
      L.push(['e', -14 + i * 9, -30 + b, 2, 2, '#9fb0c4']);
      L.push(['e', -14 + i * 9, -12 + b, 2, 2, '#9fb0c4']);
    }
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    shapes(ctx, L, true);
    ctx.restore();
  };

  art.tyrant = function (ctx, x, y, t, face, st) {
    if (drawCustom(ctx, 'tyrant', 'idle', x, y, t, face < 0)) return;
    const b = Math.floor(t * 3) % 2;
    const mouth = st && st.mouth ? 1 : 0;
    const hurt = st && st.hurt;
    const body = hurt ? '#fff' : '#c8452a';
    const head = hurt ? '#fff' : '#d9582f';
    const walk = st && st.walk ? Math.floor(t * 6) % 2 : 0;
    const L = [
      ['r', -24, -14, 12, 5, body],
      ['r', -31, -12, 8, 4, body],
      ['e', -36, -12, 5, 6, '#ff8a2a'],
      ['r', -12, -8 - walk, 9, 8 + walk, '#a3341e'],
      ['r', 3, -8 - (1 - walk), 9, 8 + (1 - walk), '#a3341e'],
      ['e', -12, -2, 11, 2, '#f6ecd2'],
      ['e', 3, -2, 11, 2, '#f6ecd2'],
      ['d', 0, -19 + b, 15, 13, body],
      ['f', 3, -16 + b, 9, 9, '#f2d6a0'],
      ['r', -14, -34 + b, 5, 6, '#3a2a46'],
      ['r', -8, -36 + b, 5, 7, '#3a2a46'],
      ['r', -2, -35 + b, 5, 6, '#3a2a46'],
      ['r', 8, -22 + b, 9, 4, body],
      ['e', 16, -23 + b, 3, 3, '#f6ecd2'],
      ['d', 10, -31 + b, 9, 8, head],
      ['r', 14, -29 + b, 11, 7, head],
      ['r', 6, -42 + b, 3, 7, '#f6ecd2'],
      ['r', 14, -42 + b, 3, 7, '#f6ecd2'],
      ['e', 6, -38 + b, 11, 3, '#f2c230'],
      ['e', 11, -34 + b, 4, 3, '#ffe66b'],
      ['e', 13, -33 + b, 1, 2, '#11131a'],
      ['e', 22, -28 + b, 2, 2, '#11131a']
    ];
    if (mouth) {
      L.push(['e', 15, -23 + b, 10, 5, '#2a0f1a']);
      L.push(['e', 16, -22 + b, 7, 3, '#ff8a2a']);
      L.push(['e', 18, -22 + b, 3, 2, '#ffe66b']);
    } else {
      L.push(['e', 15, -23 + b, 10, 2, '#2a0f1a']);
    }
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (face < 0) ctx.scale(-1, 1);
    shapes(ctx, L, true);
    ctx.restore();
  };

  art.arrow = function (ctx, x, y, t, dir, big) {
    const bob = Math.floor(t * 4) % 2 ? 2 : 0;
    const s = big ? 1.5 : 1;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + bob));
    const L = dir === 'down'
      ? [['r', -2, -10, 5, 6, '#ffe27a'], ['r', -5, -4, 11, 2, '#ffe27a'], ['r', -3, -2, 7, 2, '#ffe27a'], ['r', -1, 0, 3, 2, '#ffe27a']]
      : [['r', -2, 4, 5, 6, '#ffe27a'], ['r', -5, 2, 11, 2, '#ffe27a'], ['r', -3, 0, 7, 2, '#ffe27a'], ['r', -1, -2, 3, 2, '#ffe27a']];
    if (big) ctx.scale(s, s);
    shapes(ctx, L, true);
    ctx.restore();
  };

  art.bubbleKey = function (ctx, x, y, label, t) {
    const bob = Math.floor(t * 3) % 2;
    const w = label.length * 4 + 5;
    const L = [['r', x - Math.floor(w / 2), y - 8 + bob, w, 8, '#f6ecd2']];
    shapes(ctx, L, true);
    art.text(ctx, label, x - Math.floor(w / 2) + 2, y - 7 + bob, '#2a2f33');
  };
})();
