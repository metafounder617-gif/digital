(function () {
  const G = window.G;
  const art = G.art;
  const R = art.R;
  const disc = art.disc;
  const shapes = art.shapes;

  function mk(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    fn(x);
    return c;
  }
  const cache = {};
  function cached(key, w, h, fn) {
    return cache[key] || (cache[key] = mk(w, h, fn));
  }
  function hash(a, b) {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  art.hash = hash;

  art.img = { coin: new Image(), lucky: new Image() };
  art.img.coin.src = 'sprites/coin-spin.png';
  art.img.lucky.src = 'sprites/block-lucky.png';

  art.coin = function (ctx, x, y, t, phase) {
    const f = Math.floor(t / 0.11 + (phase || 0)) % 6;
    if (art.img.coin.complete && art.img.coin.naturalWidth) {
      ctx.drawImage(art.img.coin, f * 16, 0, 16, 16, Math.round(x) - 8, Math.round(y) - 8, 16, 16);
    } else {
      R(ctx, x - 4, y - 5, 8, 10, '#f2c230');
    }
  };

  function pipeParts(theme) {
    const g = theme === 'castle' ? ['#7a4a2a', '#c4601f', '#f0a05a', '#4a2a16'] : ['#2f9c45', '#3dba4e', '#8de58e', '#1d6b30'];
    const dark = '#14301c';
    const rim = mk(32, 16, x => {
      R(x, 0, 0, 32, 11, dark);
      R(x, 1, 1, 30, 9, g[1]);
      R(x, 2, 1, 5, 9, g[2]);
      R(x, 8, 1, 3, 9, g[2]);
      R(x, 24, 1, 6, 9, g[0]);
      R(x, 1, 9, 30, 1, g[3]);
      R(x, 3, 11, 26, 5, dark);
      R(x, 4, 11, 24, 5, g[1]);
      R(x, 5, 11, 5, 5, g[2]);
      R(x, 22, 11, 5, 5, g[0]);
    });
    const body = mk(32, 16, x => {
      R(x, 3, 0, 26, 16, dark);
      R(x, 4, 0, 24, 16, g[1]);
      R(x, 5, 0, 5, 16, g[2]);
      R(x, 12, 0, 2, 16, g[2]);
      R(x, 22, 0, 5, 16, g[0]);
    });
    return { a: [rim, 0], b: [rim, 16], c: [body, 0], d: [body, 16] };
  }

  function dirt(x, top) {
    R(x, 0, 0, 16, 16, '#8a5a34');
    for (let i = 0; i < 9; i++) {
      const px = Math.floor(hash(i, 3) * 15);
      const py = Math.floor(hash(i, 7) * 15);
      R(x, px, py, 2, 1, i % 2 ? '#6f4527' : '#a06a3c');
    }
    if (top) {
      R(x, 0, 0, 16, 5, '#58b03a');
      R(x, 0, 0, 16, 1, '#8fe05a');
      R(x, 0, 4, 16, 1, '#3f8f2a');
      for (let i = 0; i < 16; i += 3) R(x, i, 5, 2, 1 + (i % 2), '#58b03a');
    }
  }

  function brick(x, base, mortar, hi) {
    R(x, 0, 0, 16, 16, base);
    R(x, 0, 3, 16, 1, mortar);
    R(x, 0, 7, 16, 1, mortar);
    R(x, 0, 11, 16, 1, mortar);
    R(x, 0, 15, 16, 1, mortar);
    R(x, 7, 0, 1, 3, mortar);
    R(x, 3, 4, 1, 3, mortar);
    R(x, 11, 4, 1, 3, mortar);
    R(x, 7, 8, 1, 3, mortar);
    R(x, 3, 12, 1, 3, mortar);
    R(x, 11, 12, 1, 3, mortar);
    R(x, 0, 0, 16, 1, hi);
  }

  art.platTile = function (theme, ch, top) {
    const key = 'p:' + theme + ':' + ch + ':' + (top ? 1 : 0);
    if (cache[key]) return cache[key];
    let c = null;
    const castle = theme === 'castle';
    const tower = theme === 'tower';
    if (ch === '#') {
      c = mk(16, 16, x => {
        if (castle) {
          R(x, 0, 0, 16, 16, '#3d2a47');
          for (let i = 0; i < 8; i++) {
            R(x, Math.floor(hash(i, 5) * 14), Math.floor(hash(i, 9) * 15), 2, 1, i % 2 ? '#2a1a33' : '#58405f');
          }
          if (top) {
            R(x, 0, 0, 16, 2, '#7a5a82');
            R(x, 0, 2, 16, 1, '#2a1a33');
          }
        } else if (tower) {
          R(x, 0, 0, 16, 16, '#3a4258');
          R(x, 0, 0, 16, 1, top ? '#6b7690' : '#2e3548');
          R(x, 0, 15, 16, 1, '#2e3548');
          R(x, 2, 2, 2, 2, '#59647f');
          R(x, 12, 2, 2, 2, '#59647f');
          R(x, 2, 12, 2, 2, '#59647f');
          R(x, 12, 12, 2, 2, '#59647f');
        } else dirt(x, top);
      });
    } else if (ch === 'B') {
      c = mk(16, 16, x => (castle ? brick(x, '#6b4a73', '#2a1a33', '#8a6592') : brick(x, '#c86b3c', '#7a3a1e', '#e8905c')));
    } else if (ch === 'W') {
      c = mk(16, 16, x => brick(x, '#5b3f63', '#241530', '#7a5a82'));
    } else if (ch === 'S') {
      c = mk(16, 16, x => brick(x, '#69758d', '#2e3548', '#8f9db8'));
    } else if (ch === 'U') {
      c = mk(16, 16, x => {
        R(x, 0, 0, 16, 16, '#5a432e');
        R(x, 1, 1, 14, 14, '#8b6a4a');
        R(x, 2, 2, 12, 12, '#7a5a3c');
        R(x, 1, 1, 14, 1, '#a88460');
        R(x, 2, 2, 1, 1, '#2a1a10');
        R(x, 13, 2, 1, 1, '#2a1a10');
        R(x, 2, 13, 1, 1, '#2a1a10');
        R(x, 13, 13, 1, 1, '#2a1a10');
      });
    } else if (ch === 'H') {
      c = mk(16, 16, x => {
        const l = castle ? '#a68bb0' : '#c9d0d8';
        const m = castle ? '#7d6585' : '#9aa3ad';
        const d = castle ? '#493457' : '#5f6770';
        R(x, 0, 0, 16, 16, d);
        R(x, 0, 0, 15, 15, l);
        R(x, 1, 1, 14, 14, m);
        R(x, 3, 3, 10, 10, l === '#c9d0d8' ? '#b3bbc4' : '#94789e');
        R(x, 2, 2, 1, 1, d);
        R(x, 13, 2, 1, 1, d);
        R(x, 2, 13, 1, 1, d);
        R(x, 13, 13, 1, 1, d);
      });
    } else if (ch === '=') {
      c = mk(16, 16, x => {
        if (castle) {
          R(x, 0, 0, 16, 6, '#2a1a33');
          R(x, 0, 1, 16, 4, '#6b4a73');
          R(x, 0, 1, 16, 1, '#8a6592');
          R(x, 5, 1, 1, 4, '#2a1a33');
          R(x, 11, 1, 1, 4, '#2a1a33');
        } else {
          R(x, 0, 0, 16, 6, '#5a3a1e');
          R(x, 0, 1, 16, 4, '#b07a3e');
          R(x, 0, 1, 16, 1, '#d6a064');
          R(x, 5, 1, 1, 4, '#6f4527');
          R(x, 11, 1, 1, 4, '#6f4527');
          R(x, 0, 6, 16, 1, 'rgba(20,23,26,0.25)');
        }
      });
    } else if (ch === 'T') {
      c = mk(16, 16, x => {
        R(x, 0, 0, 16, 9, '#7a2418');
        R(x, 0, 1, 16, 7, '#d8553a');
        R(x, 0, 1, 16, 1, '#f08a6a');
        R(x, 0, 8, 16, 1, '#7a2418');
        x.fillStyle = '#9a3322';
        for (let i = 0; i < 16; i++) x.fillRect(i, 2 + (i % 8 < 4 ? i % 4 : 3 - (i % 4)) * 1, 1, 2);
        R(x, 1, 3, 2, 2, '#ffd9a0');
        R(x, 13, 3, 2, 2, '#ffd9a0');
        R(x, 0, 9, 16, 2, 'rgba(20,23,26,0.3)');
      });
    } else if (ch === 'L') {
      c = mk(16, 16, x => {
        R(x, 3, 0, 2, 16, '#c9d0d8');
        R(x, 11, 0, 2, 16, '#c9d0d8');
        R(x, 3, 0, 1, 16, '#eef2f5');
        R(x, 11, 0, 1, 16, '#eef2f5');
        for (let i = 1; i < 16; i += 4) R(x, 5, i, 6, 2, '#9aa3ad');
      });
    } else if (ch === 'a' || ch === 'b' || ch === 'c' || ch === 'd') {
      const p = pipeParts(theme)[ch];
      c = mk(16, 16, x => x.drawImage(p[0], p[1], 0, 16, 16, 0, 0, 16, 16));
    }
    cache[key] = c;
    return c;
  };

  art.bigPipe = function (theme, cols, rows, flip) {
    const key = 'bp:' + theme + ':' + cols + ':' + rows + ':' + (flip ? 1 : 0);
    return cached(key, cols * 16, rows * 16, x => {
      const dark = '#10301a';
      const w = cols * 16;
      const h = rows * 16;
      const rh = 18;
      const m = 6;
      if (flip) {
        x.translate(0, h);
        x.scale(1, -1);
      }
      R(x, m, rh - 1, w - 2 * m, h - rh + 1, dark);
      R(x, m + 1, rh - 1, w - 2 * m - 2, h - rh + 1, '#3dba4e');
      R(x, m + 3, rh, 9, h - rh, '#8de58e');
      R(x, m + 15, rh, 4, h - rh, '#8de58e');
      R(x, w - m - 20, rh, 19, h - rh, '#2f9c45');
      R(x, w - m - 8, rh, 7, h - rh, '#1d6b30');
      R(x, m + 1, rh, w - 2 * m - 2, 3, '#1d6b30');
      R(x, 0, 0, w, rh, dark);
      R(x, 1, 1, w - 2, rh - 2, '#3dba4e');
      R(x, 4, 1, 12, rh - 2, '#8de58e');
      R(x, 20, 1, 5, rh - 2, '#8de58e');
      R(x, w - 24, 1, 22, rh - 2, '#2f9c45');
      R(x, w - 12, 1, 10, rh - 2, '#1d6b30');
      R(x, 1, rh - 4, w - 2, 3, '#1d6b30');
      R(x, 3, 3, w - 6, 3, dark);
      R(x, 5, 4, w - 10, 1, '#0a1a10');
    });
  };

  art.bg = function (ctx, name, cx, cy, t) {
    if (name === 'plains') {
      const bands = ['#4d8fd1', '#5898d6', '#62a1da', '#6fabde', '#7cb5e2', '#8cc0e7', '#9dcaec', '#b0d6f0', '#c4e2f4'];
      for (let i = 0; i < bands.length; i++) R(ctx, 0, i * 30, 480, 30, bands[i]);
      const cl = [20, 140, 260, 380, 520, 640];
      for (let i = 0; i < cl.length; i++) {
        const px = ((cl[i] - cx * 0.12 - t * 3) % 700 + 700) % 700 - 80;
        const py = 40 + (i % 3) * 22;
        R(ctx, px + 8, py, 40, 12, '#fff');
        R(ctx, px, py + 6, 56, 10, '#fff');
        R(ctx, px + 16, py - 6, 22, 8, '#fff');
        R(ctx, px + 2, py + 14, 52, 2, '#d6e8f5');
      }
      for (let x = 0; x < 480; x++) {
        const hh = 60 + Math.sin((x + cx * 0.25) / 46) * 18 + Math.sin((x + cx * 0.25) / 17) * 6;
        R(ctx, x, 270 - hh - 20, 1, hh, '#7fc0a2');
      }
      for (let x = 0; x < 480; x++) {
        const hh = 40 + Math.sin((x + cx * 0.5 + 90) / 38) * 14 + Math.sin((x + cx * 0.5) / 13) * 4;
        R(ctx, x, 270 - hh - 10, 1, hh, '#4f9d58');
      }
      for (let x = 0; x < 480; x++) {
        const hh = 26 + Math.sin((x + cx * 0.5 + 90) / 38) * 14;
        R(ctx, x, 270 - hh - 10, 1, 2, '#6cc070');
      }
    } else if (name === 'tower') {
      R(ctx, 0, 0, 480, 270, '#1b1e33');
      for (let i = 0; i < 9; i++) {
        const px = i * 64 - ((cy * 0.0) % 64);
        R(ctx, px, 0, 6, 270, '#262b4a');
        R(ctx, px + 6, 0, 1, 270, '#313863');
      }
      for (let j = 0; j < 6; j++) {
        const py = j * 56 - ((cy * 0.3) % 56) - 10;
        R(ctx, 0, py, 480, 4, '#222744');
        for (let i = 0; i < 12; i++) {
          if (hash(i, j + Math.floor(cy * 0.3 / 56)) > 0.6) R(ctx, i * 40 + 18, py + 14, 8, 12, '#3a4572');
        }
      }
      for (let i = 0; i < 24; i++) {
        const px = hash(i, 1) * 480;
        const py = (hash(i, 2) * 270 + t * (6 + hash(i, 3) * 10)) % 270;
        R(ctx, px, py, 1, 1, '#6b78b8');
      }
    } else if (name === 'castle') {
      const bands = ['#1c0a18', '#2a0f20', '#3a1426', '#4c1a2a', '#5e2230', '#722b32'];
      for (let i = 0; i < bands.length; i++) R(ctx, 0, i * 45, 480, 45, bands[i]);
      for (let i = 0; i < 30; i++) {
        const px = hash(i, 4) * 480;
        const py = hash(i, 5) * 140;
        R(ctx, px, py, 1, 1, hash(i, 6) > 0.5 ? '#c9a0b0' : '#8a5a70');
      }
      for (let i = 0; i < 6; i++) {
        const bx = ((i * 130 - cx * 0.2) % 780 + 780) % 780 - 100;
        const bh = 90 + (i % 3) * 36;
        R(ctx, bx, 270 - bh - 40, 44, bh + 40, '#150812');
        for (let k = 0; k < 4; k++) R(ctx, bx + k * 12 - 2, 270 - bh - 48, 8, 8, '#150812');
        R(ctx, bx + 16, 270 - bh - 10, 8, 14, '#ff8a2a');
        R(ctx, bx + 18, 270 - bh - 8, 4, 8, '#ffd23a');
      }
      R(ctx, 0, 230, 480, 40, '#2a0f1a');
    }
  };

  art.lava = function (ctx, x, y, t, c) {
    R(ctx, x, y, 16, 16, '#d6401a');
    for (let i = 0; i < 16; i += 2) {
      const h = 3 + Math.round(Math.sin(t * 3 + (i + c * 16) / 5) * 2);
      R(ctx, x + i, y, 2, h, '#ffb02e');
      R(ctx, x + i, y, 2, Math.max(1, h - 2), '#ffe27a');
    }
    for (let i = 0; i < 3; i++) {
      const px = Math.floor(hash(c, i) * 14);
      const py = 6 + Math.floor(((hash(c, i + 5) * 10 + t * 4) % 9));
      R(ctx, x + px, y + py, 2, 1, '#a82a12');
    }
  };

  art.sign = function (ctx, x, y, glow) {
    const img = cached('sign', 27, 34, c => {
      const o = '#1c1e26';
      R(c, 12, 20, 4, 14, o);
      R(c, 13, 20, 2, 14, '#8a5a34');
      R(c, 13, 20, 1, 14, '#b9854b');
      for (let r = 0; r < 21; r++) {
        const hw = Math.floor(r * 0.62) + 1;
        R(c, 13 - hw, r, hw * 2 + 1, 1, o);
      }
      for (let r = 3; r < 19; r++) {
        const hw = Math.floor(r * 0.62) - 2;
        if (hw < 0) continue;
        R(c, 13 - hw, r, hw * 2 + 1, 1, '#f2c230');
        R(c, 13 - hw, r, Math.min(2, hw * 2 + 1), 1, '#ffe27a');
      }
      R(c, 12, 8, 3, 6, o);
      R(c, 12, 15, 3, 2, o);
      R(c, 13, 9, 1, 4, '#3a3d48');
    });
    ctx.drawImage(img, Math.round(x) - 13, Math.round(y) - 34);
  };

  art.signTop = function (ctx, x, y) {
    shapes(
      ctx,
      [
        ['r', x - 1, y - 6, 3, 6, '#6f4527'],
        ['r', x - 7, y - 14, 14, 9, '#c79a5a'],
        ['e', x - 5, y - 12, 10, 1, '#6f4527'],
        ['e', x - 5, y - 9, 8, 1, '#6f4527']
      ],
      true
    );
  };

  art.chest = function (ctx, x, y, open, t) {
    const L = [
      ['r', x - 7, y - 9, 14, 9, '#8a5a34'],
      ['e', x - 7, y - 5, 14, 1, '#5a3a1e']
    ];
    if (open) {
      L.push(['r', x - 7, y - 18, 14, 6, '#a06a3c']);
      L.push(['e', x - 6, y - 10, 12, 2, '#ffe27a']);
    } else {
      L.push(['r', x - 7, y - 13, 14, 5, '#a06a3c']);
      L.push(['e', x - 7, y - 13, 14, 1, '#c98a52']);
    }
    L.push(['e', x - 1, y - 7, 3, 3, '#f2c230']);
    L.push(['e', x - 7, y - 9, 2, 9, '#d6a52e']);
    L.push(['e', x + 5, y - 9, 2, 9, '#d6a52e']);
    shapes(ctx, L, true);
    if (!open && Math.floor(t * 3) % 6 === 0) R(ctx, x + 4, y - 16, 2, 2, '#fff');
  };

  art.fountain = function (ctx, x, y, t) {
    const L = [
      ['d', x, y - 8, 15, 8, '#9aa3ad'],
      ['f', x, y - 8, 12, 6, '#3f86d8'],
      ['r', x - 3, y - 20, 6, 14, '#b7bcc4'],
      ['r', x - 6, y - 22, 12, 3, '#b7bcc4']
    ];
    shapes(ctx, L, true);
    const f = Math.floor(t * 8) % 4;
    for (let i = 0; i < 6; i++) {
      const px = x - 12 + ((i * 5 + f * 3) % 24);
      R(ctx, px, y - 12 + (i % 2) * 2, 2, 1, '#bfe4ff');
    }
    for (let i = 0; i < 4; i++) {
      const a = ((t * 1.4 + i / 4) % 1);
      R(ctx, x - 9 * a * (i % 2 ? 1 : -1) - 1, y - 24 + Math.sin(a * Math.PI) * -6 + a * 14, 2, 2, '#bfe4ff');
    }
    R(ctx, x - 1, y - 24, 2, 3, '#bfe4ff');
  };

  art.orb = function (ctx, x, y, t) {
    const b = Math.floor(t * 3) % 2;
    const g = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.globalAlpha = 0.25 + 0.25 * g;
    disc(ctx, x, y - 6 - b, 9, 9, '#ffe27a');
    ctx.globalAlpha = 1;
    shapes(
      ctx,
      [
        ['d', x, y - 6 - b, 6, 6, '#e8553a'],
        ['e', x - 6, y - 5 - b, 13, 3, '#f6ecd2'],
        ['e', x - 6, y - 7 - b, 13, 1, '#1c1e26'],
        ['e', x - 1, y - 8 - b, 3, 4, '#fff'],
        ['e', x - 4, y - 11 - b, 2, 2, '#ffb3a8']
      ],
      true
    );
  };

  art.key = function (ctx, x, y, t) {
    const b = Math.floor(t * 3) % 2;
    ctx.globalAlpha = 0.25;
    disc(ctx, x, y - 7 - b, 8, 8, '#ffe27a');
    ctx.globalAlpha = 1;
    shapes(
      ctx,
      [
        ['d', x, y - 11 - b, 3, 3, '#f2c230'],
        ['r', x - 1, y - 9 - b, 3, 10, '#f2c230'],
        ['r', x + 2, y - 3 - b, 3, 2, '#f2c230'],
        ['r', x + 2, y - 6 - b, 3, 2, '#f2c230'],
        ['e', x, y - 12 - b, 1, 1, '#1c1e26']
      ],
      true
    );
  };

  art.bell = function (ctx, x, y, f) {
    const dx = (f - 2) * 2;
    R(ctx, x - 7, y, 14, 3, '#3a4046');
    R(ctx, x - 7, y, 14, 1, '#6b7078');
    R(ctx, x - 1 + Math.round(dx * 0.2), y + 3, 2, 3, '#6b7078');
    R(ctx, x - 1 + Math.round(dx * 0.4), y + 6, 2, 3, '#8d949b');
    const b = x + dx;
    const rows = [4, 6, 6, 8, 8, 8, 10, 10, 10];
    const L = [['r', b - 2, y + 9, 4, 2, '#d6a52e']];
    rows.forEach((w, i) => L.push(['r', b - w / 2, y + 10 + i, w, 1, '#f2c230']));
    L.push(['r', b - 6, y + 19, 12, 2, '#d6a52e']);
    L.push(['r', b - 1, y + 21, 3, 2, '#7a5f1c']);
    shapes(ctx, L, true);
    R(ctx, b - 3, y + 12, 2, 6, '#ffe27a');
  };

  art.springH = [22, 15, 10, 27, 31, 19, 24];
  art.spring = function (ctx, x, y, h) {
    const hh = Math.max(12, h);
    const top = y - hh;
    R(ctx, x - 9, y - 3, 18, 3, '#2a2f38');
    R(ctx, x - 8, y - 3, 16, 2, '#6b7380');
    R(ctx, x - 8, y - 3, 16, 1, '#aab3bf');
    const inner = hh - 8;
    const n = Math.max(3, Math.round(inner / 4));
    const p = inner / n;
    for (let i = 0; i < n; i++) {
      const yb = y - 4 - i * p;
      for (let k = 0; k < 12; k++) {
        const yy = Math.round(yb - (k * p) / 12);
        ctx.fillStyle = '#2a2f38';
        ctx.fillRect(x - 6 + k, yy - 1, 1, 4);
        ctx.fillStyle = k < 4 ? '#e6ebf0' : '#aab3bf';
        ctx.fillRect(x - 6 + k, yy, 1, 2);
      }
    }
    R(ctx, x - 9, top, 18, 4, '#2a2f38');
    R(ctx, x - 8, top + 1, 16, 2, '#e8493a');
    R(ctx, x - 8, top + 1, 16, 1, '#ff8a7a');
  };

  art.flowerPipe = function (ctx, x, y) {
    R(ctx, x - 16, y - 8, 32, 8, '#6f4527');
    for (let i = 0; i < 8; i++) {
      R(ctx, x - 15 + i * 4, y - 10 - (i % 2) * 2, 2, 2 + (i % 2) * 2, '#58b03a');
      R(ctx, x - 15 + i * 4, y - 12 - (i % 3) * 2, 2, 2, ['#e8553a', '#f2c230', '#fff', '#ff7ba0'][i % 4]);
    }
    const p = art.bigPipe('plains', 2, 3);
    ctx.drawImage(p, x - 16, y - 40);
  };

  art.desk = function (ctx, x, y, w) {
    shapes(
      ctx,
      [
        ['r', x, y - 12, w, 8, '#8a5a34'],
        ['e', x, y - 12, w, 2, '#c08a50'],
        ['r', x + 2, y - 4, 3, 4, '#5a3a1e'],
        ['r', x + w - 5, y - 4, 3, 4, '#5a3a1e']
      ],
      true
    );
  };

  art.bed = function (ctx, x, y) {
    shapes(
      ctx,
      [
        ['r', x, y - 22, 28, 22, '#c9c0ae'],
        ['r', x, y - 22, 28, 5, '#8a5a34'],
        ['e', x + 2, y - 17, 10, 5, '#fff'],
        ['e', x + 2, y - 12, 24, 10, '#3d6fb5'],
        ['e', x + 2, y - 12, 24, 2, '#6f9bd8']
      ],
      true
    );
  };

  art.tv = function (ctx, x, y, t, on) {
    shapes(
      ctx,
      [
        ['r', x - 8, y - 18, 16, 12, '#2a2f33'],
        ['e', x - 6, y - 16, 12, 8, on ? (Math.floor(t * 2) % 2 ? '#6fd6ff' : '#8f4de0') : '#14171a'],
        ['r', x - 4, y - 6, 8, 3, '#4a525a'],
        ['r', x - 6, y - 3, 12, 3, '#3a4046']
      ],
      true
    );
  };

  art.plant = function (ctx, x, y) {
    shapes(
      ctx,
      [
        ['r', x - 4, y - 6, 8, 6, '#c4601f'],
        ['d', x, y - 12, 6, 5, '#3f8f2a'],
        ['f', x - 3, y - 15, 3, 3, '#58b03a'],
        ['f', x + 3, y - 11, 3, 3, '#58b03a']
      ],
      true
    );
  };

  art.lamp = function (ctx, x, y, t) {
    ctx.globalAlpha = 0.18 + 0.04 * Math.sin(t * 3);
    disc(ctx, x, y - 20, 12, 12, '#ffe27a');
    ctx.globalAlpha = 1;
    shapes(
      ctx,
      [
        ['r', x - 1, y - 16, 3, 16, '#4a525a'],
        ['r', x - 4, y - 8, 9, 2, '#4a525a'],
        ['r', x - 4, y - 24, 9, 8, '#ffe27a']
      ],
      true
    );
  };

  art.shelf = function (ctx, x, y, w) {
    shapes(ctx, [['r', x, y - 24, w, 24, '#6f4527']], true);
    for (let j = 0; j < 3; j++) {
      R(ctx, x + 1, y - 21 + j * 8, w - 2, 1, '#3a2412');
      for (let i = 0; i < Math.floor((w - 4) / 4); i++) {
        R(ctx, x + 2 + i * 4, y - 19 + j * 8, 3, 5, ['#e8553a', '#3d6fb5', '#f2c230', '#58b03a'][(i + j) % 4]);
      }
    }
  };

  art.table = function (ctx, x, y, t) {
    shapes(
      ctx,
      [
        ['r', x - 10, y - 10, 20, 4, '#c08a50'],
        ['r', x - 8, y - 6, 3, 6, '#8a5a34'],
        ['r', x + 5, y - 6, 3, 6, '#8a5a34'],
        ['r', x - 6, y - 15, 12, 5, '#f6ecd2']
      ],
      true
    );
    R(ctx, x - 4, y - 14, 3, 3, '#e8553a');
    R(ctx, x + 1, y - 14, 3, 3, '#58b03a');
  };

  art.counter = function (ctx, x, y, w, t) {
    shapes(
      ctx,
      [
        ['r', x, y - 14, w, 14, '#6f4527'],
        ['e', x, y - 14, w, 3, '#c08a50'],
        ['e', x + 2, y - 8, w - 4, 1, '#3a2412']
      ],
      true
    );
  };

  art.gate = function (ctx, x, y, open, t) {
    shapes(ctx, [['r', x - 20, y - 26, 6, 26, '#6b7078'], ['r', x + 14, y - 26, 6, 26, '#6b7078']], true);
    R(ctx, x - 20, y - 28, 6, 3, '#9aa3ad');
    R(ctx, x + 14, y - 28, 6, 3, '#9aa3ad');
    if (!open) {
      for (let i = 0; i < 6; i++) {
        const o = Math.floor(t * 6 + i) % 3;
        R(ctx, x - 12 + i * 5, y - 24, 2, 22, o ? '#8f4de0' : '#c9a0ff');
      }
      R(ctx, x - 13, y - 14, 28, 2, '#b080f0');
    }
  };

  art.hotelDoor = function (ctx, x, y, open) {
    shapes(
      ctx,
      [
        ['r', x - 17, y - 32, 34, 32, '#3a4046'],
        ['e', x - 14, y - 29, 13, 29, open ? '#6fd6ff' : '#8a5a34'],
        ['e', x + 1, y - 29, 13, 29, open ? '#6fd6ff' : '#8a5a34'],
        ['e', x - 4, y - 14, 2, 3, '#f2c230'],
        ['e', x + 2, y - 14, 2, 3, '#f2c230']
      ],
      true
    );
    if (!open) R(ctx, x - 2, y - 18, 4, 6, '#c8372d');
  };

  art.crate = function (ctx, x, y) {
    shapes(ctx, [['r', x - 7, y - 14, 14, 14, '#a86a32']], true);
    R(ctx, x - 7, y - 14, 14, 2, '#d6a064');
    for (let i = 0; i < 14; i++) R(ctx, x - 7 + i, y - 14 + i, 1, 1, '#5a3a1e');
    for (let i = 0; i < 14; i++) R(ctx, x + 6 - i, y - 14 + i, 1, 1, '#5a3a1e');
  };

  art.door = function (ctx, x, y) {
    shapes(ctx, [['r', x - 7, y - 20, 14, 20, '#5a3a1e'], ['e', x - 5, y - 18, 10, 18, '#8a5a34'], ['e', x + 2, y - 10, 2, 2, '#f2c230']], true);
  };

  art.elevator = function (ctx, x, y, open, t) {
    shapes(
      ctx,
      [
        ['r', x - 14, y - 36, 28, 36, '#6b7078'],
        ['e', x - 11, y - 33, open ? 4 : 11, 33, '#c9d0d8'],
        ['e', x + (open ? 7 : 0), y - 33, open ? 4 : 11, 33, '#c9d0d8'],
        ['e', x - 11 + (open ? 4 : 11), y - 33, open ? 14 : 0, 33, '#ffe27a']
      ],
      true
    );
    R(ctx, x - 3, y - 40, 6, 3, Math.floor(t * 2) % 2 ? '#ffe27a' : '#8a5a34');
  };

  art.bigDoor = function (ctx, x, y, t) {
    shapes(ctx, [['r', x - 14, y - 40, 28, 40, '#3a2a46'], ['e', x - 10, y - 36, 20, 36, Math.floor(t * 4) % 2 ? '#ffd23a' : '#ff8a2a']], true);
  };

  const ICON = {
    gpu: (c, x, y, k) => {
      shapes(
        c,
        [
          ['r', x - 8, y - 5, 17, 9, '#2a2f33'],
          ['d', x - 3, y - 1, 3, 3, '#14171a'],
          ['d', x + 4, y - 1, 3, 3, '#14171a'],
          ['r', x - 8, y + 4, 16, 2, k],
          ['e', x - 4, y - 2, 2, 2, k],
          ['e', x + 3, y - 2, 2, 2, k]
        ],
        true
      );
    },
    ram: (c, x, y, k) => {
      shapes(c, [['r', x - 8, y - 3, 17, 7, '#2f8f5a'], ['e', x - 6, y - 2, 3, 4, '#14171a'], ['e', x - 1, y - 2, 3, 4, '#14171a'], ['e', x + 4, y - 2, 3, 4, '#14171a'], ['e', x - 8, y + 3, 17, 1, '#f2c230']], true);
    },
    cooler: (c, x, y, k) => {
      shapes(c, [['r', x - 8, y - 6, 8, 12, '#3a4046'], ['d', x + 4, y, 5, 5, '#2a2f33'], ['f', x + 4, y, 2, 2, k], ['e', x - 7, y - 5, 6, 1, k], ['e', x - 7, y - 2, 6, 1, '#6b7078'], ['e', x - 7, y + 1, 6, 1, '#6b7078']], true);
    },
    headset: (c, x, y, k) => {
      shapes(c, [['r', x - 7, y - 8, 14, 2, '#2a2f33'], ['r', x - 8, y - 6, 2, 6, '#2a2f33'], ['r', x + 7, y - 6, 2, 6, '#2a2f33'], ['r', x - 10, y - 2, 5, 8, k], ['r', x + 6, y - 2, 5, 8, k]], true);
    },
    keyboard: (c, x, y, k) => {
      shapes(c, [['r', x - 9, y - 4, 19, 9, '#2a2f33']], true);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) R(c, x - 8 + i * 3, y - 3 + j * 3, 2, 2, j === 0 ? k : '#6b7078');
    },
    phone: (c, x, y, k) => {
      shapes(c, [['r', x - 4, y - 9, 9, 18, '#2a2f33'], ['e', x - 3, y - 8, 7, 14, k], ['e', x - 1, y + 7, 3, 1, '#6b7078']], true);
    },
    cpu: (c, x, y, k) => {
      for (let i = 0; i < 4; i++) {
        R(c, x - 7 + i * 4, y - 9, 1, 3, '#d6a52e');
        R(c, x - 7 + i * 4, y + 6, 1, 3, '#d6a52e');
        R(c, x - 9, y - 7 + i * 4, 3, 1, '#d6a52e');
        R(c, x + 6, y - 7 + i * 4, 3, 1, '#d6a52e');
      }
      shapes(c, [['r', x - 6, y - 6, 13, 13, '#4a525a'], ['e', x - 4, y - 4, 9, 9, '#c9d0d8'], ['e', x - 2, y - 2, 5, 5, k]], true);
    },
    monitor: (c, x, y, k) => {
      shapes(c, [['r', x - 9, y - 8, 19, 12, '#2a2f33'], ['e', x - 8, y - 7, 17, 9, k], ['r', x - 2, y + 4, 5, 3, '#4a525a'], ['r', x - 6, y + 7, 13, 2, '#4a525a']], true);
    },
    ultrawide: (c, x, y, k) => {
      shapes(c, [['r', x - 11, y - 7, 23, 11, '#2a2f33'], ['e', x - 10, y - 6, 21, 8, k], ['e', x - 10, y - 6, 21, 2, '#ffffff55'], ['r', x - 2, y + 4, 5, 3, '#4a525a'], ['r', x - 6, y + 7, 13, 2, '#4a525a']], true);
    }
  };

  art.rewardIcon = function (ctx, kind, x, y, t, tint, small) {
    const b = small ? 0 : Math.floor(t * 3) % 2;
    if (!small) {
      const g = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.globalAlpha = 0.18 + 0.18 * g;
      disc(ctx, x, y - b, 13, 13, '#ffe27a');
      ctx.globalAlpha = 1;
      const s = Math.floor(t * 5) % 4;
      const px = [[-12, -8], [11, -6], [9, 9], [-10, 8]][s];
      R(ctx, x + px[0], y + px[1] - b, 2, 2, '#fff');
    }
    (ICON[kind] || ICON.gpu)(ctx, x, y - b, tint || '#c8372d');
  };

  const TT = {
    '.': (x, c, r) => {
      R(x, 0, 0, 16, 16, '#6cc04a');
      for (let i = 0; i < 4; i++) {
        const px = Math.floor(hash(c * 7 + i, r) * 14);
        const py = Math.floor(hash(c, r * 5 + i) * 13);
        R(x, px, py, 1, 2, i % 2 ? '#58b03a' : '#8fe05a');
      }
    },
    ',': (x, c, r, ph) => {
      R(x, 0, 0, 16, 16, '#58b03a');
      for (let i = 0; i < 5; i++) {
        const px = 1 + i * 3;
        const h = 6 + Math.floor(hash(c + i, r) * 4);
        const sw = ph ? 1 : 0;
        R(x, px + sw, 16 - h, 2, h, '#3f8f2a');
        R(x, px + sw, 16 - h, 2, 2, '#8fe05a');
      }
    },
    _: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#c9b48a');
      R(x, 0, 0, 16, 1, '#b39d72');
      R(x, 0, 8, 16, 1, '#b39d72');
      R(x, 4 + (r % 2) * 4, 1, 1, 7, '#b39d72');
      R(x, 10 - (r % 2) * 4, 9, 1, 7, '#b39d72');
      R(x, 2, 3, 2, 1, '#dcc99e');
      R(x, 11, 11, 2, 1, '#dcc99e');
    },
    s: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#b7bcc4');
      R(x, 0, 0, 16, 1, '#8f959e');
      R(x, 0, 0, 1, 16, '#8f959e');
      R(x, 1, 1, 14, 1, '#d6dae0');
      R(x, 4 + (c % 2) * 3, 5, 2, 1, '#a1a7b0');
    },
    w: (x, c, r, ph) => {
      R(x, 0, 0, 16, 16, '#3f86d8');
      const o = ph ? 4 : 0;
      R(x, 2 + o, 3, 5, 1, '#7fb4f0');
      R(x, 9 - o, 9, 5, 1, '#7fb4f0');
      R(x, 4 + o, 13, 3, 1, '#2f6fbd');
    },
    t: (x, c, r) => {
      TT['.'](x, c, r);
      R(x, 6, 6, 4, 10, '#6f4527');
      R(x, 6, 6, 1, 10, '#8a5a34');
      R(x, 0, 10, 16, 6, 'rgba(0,0,0,0)');
      disc(x, 8, 5, 7, 5, '#2f8f3a');
      disc(x, 6, 4, 4, 3, '#58b03a');
    },
    f: (x, c, r) => {
      TT['.'](x, c, r);
      R(x, 1, 4, 3, 11, '#c79a5a');
      R(x, 12, 4, 3, 11, '#c79a5a');
      R(x, 0, 6, 16, 2, '#e0b36e');
      R(x, 0, 10, 16, 2, '#e0b36e');
      R(x, 0, 7, 16, 1, '#8a5a34');
      R(x, 0, 11, 16, 1, '#8a5a34');
    },
    R: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#c8372d');
      for (let j = 0; j < 4; j++) R(x, (j % 2) * 4, j * 4 + 3, 16, 1, '#8a2119');
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) R(x, i * 4 + (j % 2) * 2, j * 4, 1, 3, '#8a2119');
      R(x, 0, 0, 16, 1, '#e8695e');
    },
    r: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#3d6fb5');
      for (let j = 0; j < 4; j++) R(x, 0, j * 4 + 3, 16, 1, '#264a80');
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) R(x, i * 4 + (j % 2) * 2, j * 4, 1, 3, '#264a80');
      R(x, 0, 0, 16, 1, '#6f9bd8');
    },
    M: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#f2e8d0');
      R(x, 0, 15, 16, 1, '#c9bb98');
      R(x, 3, 3, 10, 9, '#6b4a2a');
      R(x, 4, 4, 8, 7, '#8fcff0');
      R(x, 7, 4, 2, 7, '#6b4a2a');
      R(x, 4, 7, 8, 1, '#6b4a2a');
      R(x, 4, 4, 3, 2, '#cdeeff');
    },
    m: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#f2e8d0');
      R(x, 0, 15, 16, 1, '#c9bb98');
      R(x, 0, 0, 16, 1, '#fff7e0');
    },
    D: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#f2e8d0');
      R(x, 2, 0, 12, 16, '#5a3a1e');
      R(x, 3, 1, 10, 15, '#8a5a34');
      R(x, 11, 8, 2, 2, '#f2c230');
      R(x, 3, 1, 10, 1, '#a06a3c');
    },
    F: (x, c, r) => {
      TT['.'](x, c, r);
      for (let i = 0; i < 5; i++) {
        const px = 1 + Math.floor(hash(c * 3 + i, r) * 12);
        const py = 2 + Math.floor(hash(c, r * 3 + i) * 11);
        R(x, px, py, 2, 2, ['#e8553a', '#f2c230', '#fff', '#ff7ba0', '#a77be0'][i % 5]);
        R(x, px, py + 2, 1, 2, '#3f8f2a');
      }
    },
    o: (x, c, r) => {
      TT['.'](x, c, r);
      shapes(x, [['d', 8, 9, 6, 5, '#9aa3ad'], ['f', 6, 7, 3, 2, '#c9d0d8']], true);
    },
    h: (x, c, r) => {
      TT['.'](x, c, r);
      shapes(x, [['d', 8, 9, 7, 6, '#3f8f2a'], ['f', 5, 7, 3, 2, '#58b03a'], ['f', 11, 11, 2, 2, '#2d6a1c']], true);
    },
    k: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#c08a50');
      R(x, 0, 0, 16, 1, '#a06a3c');
      R(x, 0, 8, 16, 1, '#a06a3c');
      R(x, 5 + (r % 2) * 5, 1, 1, 7, '#a06a3c');
      R(x, 10 - (r % 2) * 5, 9, 1, 7, '#a06a3c');
    },
    c: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#a8322a');
      R(x, 0, 0, 16, 2, '#e8c76e');
      R(x, 0, 14, 16, 2, '#e8c76e');
      R(x, 6, 6, 4, 4, '#8a2119');
    },
    n: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#2f5f8f');
      R(x, 0, 0, 16, 1, '#3d7cb5');
      R(x, 0, 8, 16, 1, '#264a6e');
      R(x, 3, 3, 2, 2, '#3d7cb5');
      R(x, 11, 11, 2, 2, '#3d7cb5');
    },
    e: (x, c, r) => {
      R(x, 0, 0, 16, 16, (c + r) % 2 ? '#e8e0d0' : '#c9c0ae');
    },
    x: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#4a3550');
      R(x, 0, 0, 16, 2, '#6b4a73');
      R(x, 0, 14, 16, 2, '#2a1a33');
      R(x, 3, 4, 10, 8, '#58405f');
    },
    z: (x, c, r) => {
      R(x, 0, 0, 16, 16, '#d8c8a8');
      R(x, 0, 0, 16, 1, '#2a1a33');
      for (let i = 0; i < 16; i += 4) R(x, i, 1, 2, 11, '#cdbb98');
      R(x, 0, 12, 16, 4, '#7a4a2a');
      R(x, 0, 12, 16, 1, '#a06a3c');
    }
  };
  art.topSolid = 'wtfRrMmxzoh';
  art.topTile = function (ctx, ch, px, py, c, r, t) {
    const fn = TT[ch];
    if (!fn) return;
    const anim = ch === 'w' || ch === ',';
    const ph = Math.floor(t * 2 + (anim ? (c + r) * 0.3 : 0)) % 2;
    const key = 't:' + ch + ':' + (ch === '.' || ch === 'F' || ch === 'o' || ch === 'h' || ch === 't' || ch === 'f' || ch === '_' || ch === 'k' || ch === 'e' || ch === 'z' || ch === 'x' ? c + ',' + r : '') + (anim ? ':' + ph : '');
    const cv = cached(key, 16, 16, x => fn(x, c, r, ph));
    ctx.drawImage(cv, px, py);
  };
  art.treeTop = function (ctx, px, py) {
    const cv = cached('tt', 16, 16, x => {
      disc(x, 8, 11, 8, 6, '#2f8f3a');
      disc(x, 6, 9, 5, 4, '#58b03a');
      disc(x, 11, 12, 4, 3, '#256f2e');
    });
    ctx.drawImage(cv, px, py - 10);
  };
})();
