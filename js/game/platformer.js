(function () {
  const G = window.G;
  const art = G.art;
  const T = 16;
  const HW = 5;
  const HH = 16;
  const SOLID = new Set('#BIUHSWKPabcd'.split(''));
  const ONEWAY = new Set(['=', 'T']);
  const STEP = 1 / 120;
  const SPRING_SEQ = [
    [0.045, 1],
    [0.105, 2]
  ];
  const BELL_SEQ = [4, 0, 4, 0, 3, 1, 3, 1, 2];

  G.Platformer = function (def) {
    const cols = def.cols;
    const rows = def.rows;
    const grid = def.grid.map(r => r.split(''));
    const L = {
      kind: 'plat',
      def,
      W: cols * T,
      H: rows * T,
      grid,
      time: 0,
      acc: 0,
      parts: G.Particles(),
      cam: { x: 0, y: 0 },
      camOverride: null,
      camTween: null,
      bumps: {},
      ents: [],
      barrels: [],
      fireballs: [],
      checkpoint: { x: def.spawn.x, y: def.spawn.y },
      done: false,
      exiting: false,
      promptTarget: null,
      lastX: 0,
      stand: 0,
      idleT: 0,
      barrelsOn: false,
      barrelT: 2,
      throwT: 0,
      events: {},
      shake: 0,
      flash: 0,
      bossDown: false
    };

    const hero = (L.hero = {
      x: def.spawn.x,
      y: def.spawn.y,
      vx: 0,
      vy: 0,
      face: 1,
      onGround: true,
      pose: 'idle',
      force: null,
      ph: 0,
      inv: 0,
      stun: 0,
      jumpBuf: 0,
      coyote: 0,
      jumpHeld: false,
      climb: null,
      ghost: false,
      hold: false,
      clip: null,
      auto: null,
      ax: 0,
      visible: true,
      landT: 0,
      prevY: def.spawn.y,
      sink: 0
    });

    def.entities.forEach(e => {
      const o = Object.assign({}, e);
      if (o.t === 'coin') o.phase = ((Math.floor(o.x / T) * 5) % 6);
      if (o.t === 'walker') {
        o.dir = o.dir || -1;
        o.vy = 0;
        o.alive = true;
        o.sq = 0;
        o.x0 = o.x;
      }
      if (o.t === 'spring') {
        o.st = null;
        o.cd = 0;
        o.t0 = 0;
      }
      if (o.t === 'bell') {
        o.st = null;
        o.cd = 0;
        o.sign = 1;
      }
      if (o.t === 'sign') {
        o.who = { name: '', anchor: () => ({ x: o.x - L.cam.x, y: o.y - 32 - L.cam.y }) };
      }
      if (o.t === 'geyser') {
        o.tm = o.phase || 0;
        o.st = 0;
      }
      if (o.t === 'slab') {
        o.y = o.y0;
        o.vy = 0;
        o.st = 'wait';
        o.tm = 0;
      }
      if (o.t === 'boss') {
        o.hp = 3;
        o.vx = 0;
        o.vy = 0;
        o.dir = -1;
        o.inv = 0;
        o.fireT = 2.5;
        o.mouth = 0;
        o.jumpT = 3.5;
        o.active = false;
        o.dead = false;
        o.walkT = 0;
        o.dying = 0;
      }
      L.ents.push(o);
    });

    L.tile = (c, r) => {
      if (c < 0 || c >= cols) return '#';
      if (r < 0 || r >= rows) return r < 0 ? '.' : '.';
      return grid[r][c];
    };
    const solid = (c, r) => SOLID.has(L.tile(c, r));

    L.anchor = function (dy) {
      return () => ({ x: hero.x - L.cam.x, y: hero.y - (dy || 24) - L.cam.y });
    };
    L.heroWho = { name: G.heroName || '', anchor: L.anchor(24) };
    L.worldAnchor = (x, y) => () => ({ x: x - L.cam.x, y: y - L.cam.y });

    L.setPose = p => {
      hero.force = p;
    };
    L.faceDir = d => {
      hero.face = d;
    };
    L.stopHero = () => {
      hero.vx = 0;
      hero.auto = null;
    };
    L.walkTo = (x, speed) => {
      hero.auto = { tx: x, speed: speed || 60 };
      return G.until(() => !hero.auto);
    };
    L.jump = (v, vx) => {
      hero.vy = -(v || G.cfg.jumpV);
      hero.onGround = false;
      hero.vx = vx || hero.vx;
      G.sfx('jump');
    };
    L.panTo = (x, y, secs) => {
      const from = { x: L.cam.x, y: L.cam.y };
      L.camTween = { from, to: { x, y }, t: 0, d: secs || 1 };
      return G.until(() => !L.camTween);
    };
    L.panBack = secs => {
      const to = L.followTarget();
      const from = { x: L.cam.x, y: L.cam.y };
      L.camTween = { from, to, t: 0, d: secs || 0.8, back: true };
      return G.until(() => !L.camTween);
    };
    L.onEvent = (n, fn) => {
      L.events[n] = fn;
    };

    L.followTarget = () => {
      let tx = hero.x - G.W / 2 + hero.face * 20;
      tx = G.clamp(tx, 0, Math.max(0, L.W - G.W));
      let ty = 0;
      if (def.camY === 'follow') {
        ty = G.clamp(hero.y - 170, -G.TOP, Math.max(-G.TOP, L.H - G.H));
      } else {
        ty = def.camFixedY || 0;
      }
      return { x: tx, y: ty };
    };

    L.dropFromPipe = function (x, mouthY, groundY) {
      hero.ghost = true;
      hero.x = x;
      hero.y = mouthY - 30;
      hero.vy = 0;
      hero.vx = 0;
      hero.clip = { y: mouthY, below: true };
      hero.force = 'fall';
      hero.onGround = false;
      hero.fall = { groundY };
      G.sfx('scream');
      return G.until(() => !hero.fall);
    };

    L.enterPipe = function (cx, topY) {
      hero.ghost = true;
      hero.vx = 0;
      hero.vy = 0;
      hero.x = cx;
      hero.clip = { y: topY, below: false };
      hero.force = 'enter';
      hero.sinkTo = topY + 26;
      G.sfx('pipe');
      return G.until(() => hero.y >= hero.sinkTo);
    };

    L.reveal = function () {
      hero.ghost = false;
      hero.clip = null;
      hero.force = null;
    };

    function bump(c, r) {
      const ch = L.tile(c, r);
      const key = c + ',' + r;
      if (ch === 'I') {
        grid[r][c] = 'U';
        L.bumps[key] = 0;
        G.store.coins++;
        G.sfx('coin');
        G.ui.refresh();
        L.parts.text(c * T + 5, r * T - 8, '+1');
        L.parts.burst(c * T + 8, r * T - 2, 6, '#ffe27a', 60, 0.4);
        L.popCoin = { x: c * T + 8, y: r * T - 4, t: 0 };
      } else if (ch === 'X') {
        grid[r][c] = 'U';
        L.bumps[key] = 0;
        G.store.coins += 3;
        G.store.secrets++;
        G.sfx('power');
        G.ui.refresh();
        L.parts.text(c * T + 3, r * T - 8, '+3');
        L.parts.burst(c * T + 8, r * T - 2, 12, '#ffe27a', 80, 0.6);
        G.ui.toast('Secret found!');
      } else if (ch === 'B' || ch === 'U') {
        L.bumps[key] = 0;
        G.sfx('bump');
        if (ch === 'B') L.parts.burst(c * T + 8, r * T + 4, 4, '#c86b3c', 40, 0.3);
      }
    }

    function moveX(h) {
      hero.x += hero.vx * h;
      const l = hero.x - HW;
      const r = hero.x + HW - 0.01;
      const top = hero.y - HH + 0.01;
      const bot = hero.y - 0.01;
      const c0 = Math.floor(l / T);
      const c1 = Math.floor(r / T);
      const r0 = Math.floor(top / T);
      const r1 = Math.floor(bot / T);
      for (let rr = r0; rr <= r1; rr++) {
        for (let cc = c0; cc <= c1; cc++) {
          if (solid(cc, rr)) {
            if (hero.vx > 0) hero.x = cc * T - HW - 0.02;
            else if (hero.vx < 0) hero.x = (cc + 1) * T + HW + 0.02;
            else hero.x = hero.x < cc * T + 8 ? cc * T - HW - 0.02 : (cc + 1) * T + HW + 0.02;
            hero.vx = 0;
            if (hero.auto) hero.auto.blocked = true;
            return;
          }
        }
      }
    }

    function moveY(h) {
      hero.prevY = hero.y;
      hero.y += hero.vy * h;
      const l = hero.x - HW;
      const r = hero.x + HW - 0.01;
      const c0 = Math.floor(l / T);
      const c1 = Math.floor(r / T);
      hero.onGround = false;
      if (hero.vy >= 0) {
        const row = Math.floor(hero.y / T);
        for (let cc = c0; cc <= c1; cc++) {
          const ch = L.tile(cc, row);
          const top = row * T;
          if (SOLID.has(ch) || (ONEWAY.has(ch) && hero.prevY <= top + 0.01)) {
            if (hero.prevY <= top + 0.01 || SOLID.has(ch)) {
              if (hero.y >= top && hero.prevY <= top + 0.5) {
                hero.y = top;
                hero.vy = 0;
                hero.onGround = true;
                break;
              }
            }
          }
        }
        if (!hero.onGround && hero.vy === 0) {
          const below = Math.floor((hero.y + 0.5) / T);
          for (let cc = c0; cc <= c1; cc++) {
            const ch = L.tile(cc, below);
            if ((SOLID.has(ch) || ONEWAY.has(ch)) && Math.abs(hero.y - below * T) < 0.6) {
              hero.onGround = true;
              hero.y = below * T;
            }
          }
        }
      } else {
        const head = hero.y - HH;
        const row = Math.floor(head / T);
        for (let cc = c0; cc <= c1; cc++) {
          let ch = L.tile(cc, row);
          if (SOLID.has(ch) || ch === 'X') {
            hero.y = (row + 1) * T + HH + 0.01;
            hero.vy = 0;
            bump(cc, row);
            break;
          }
        }
      }
    }

    function ladderAt() {
      const ls = def.ladders || [];
      for (const l of ls) {
        if (Math.abs(hero.x - l.x) <= 8 && hero.y >= l.top - 3 && hero.y <= l.bottom + 2) return l;
      }
      return null;
    }

    L.hurt = function (kx) {
      if (hero.inv > 0 || hero.ghost || L.done) return false;
      G.store.hearts--;
      G.sfx('hurt');
      L.parts.burst(hero.x, hero.y - 10, 8, '#ff7a59', 80, 0.5);
      hero.inv = 1.5;
      hero.stun = 0.25;
      hero.climb = null;
      hero.vy = -190;
      hero.vx = (kx !== undefined ? kx : -hero.face) * 90;
      hero.hold = false;
      if (G.store.hearts <= 0) {
        G.store.hearts = 3;
        L.respawn();
        G.ui.toast('Try again!');
      }
      G.ui.refresh();
      return true;
    };

    L.respawn = function () {
      hero.x = L.checkpoint.x;
      hero.y = L.checkpoint.y;
      hero.vx = 0;
      hero.vy = 0;
      hero.inv = 1.6;
      hero.stun = 0;
      hero.climb = null;
      hero.hold = false;
      hero.onGround = false;
      L.barrels.length = 0;
      L.fireballs.length = 0;
      const t = L.followTarget();
      L.cam.x = t.x;
      L.cam.y = t.y;
    };

    function pitDeath() {
      G.store.hearts--;
      G.sfx('hurt');
      if (G.store.hearts <= 0) {
        G.store.hearts = 3;
        G.ui.toast('Try again!');
      }
      G.ui.refresh();
      L.respawn();
    }

    function updateHero(dt) {
      const gp = G.state === 'gameplay' && !hero.ghost && !L.done;
      let ax = 0;
      if (hero.stun > 0) {
        hero.stun -= dt;
      } else if (gp && !hero.hold) {
        ax = G.input.axis().rx;
      } else if (hero.auto) {
        const d = hero.auto.tx - hero.x;
        if (Math.abs(d) < 1.5 || hero.auto.blocked) {
          hero.auto = null;
          hero.vx = 0;
        } else ax = d > 0 ? 1 : -1;
      }
      hero.ax = ax;
      if (ax) hero.face = ax;
      if (hero.inv > 0) hero.inv -= dt;
      if (hero.landT > 0) hero.landT -= dt;

      if (hero.fall) {
        hero.vy += 500 * dt;
        hero.y += hero.vy * dt;
        hero.vx = 0;
        if (hero.y >= hero.fall.groundY) {
          hero.y = hero.fall.groundY;
          hero.vy = 0;
          hero.ghost = false;
          hero.clip = null;
          hero.onGround = true;
          hero.fall = null;
          hero.force = 'land';
          hero.landT = 0.3;
          L.parts.dust(hero.x, hero.y, 0);
          L.parts.dust(hero.x, hero.y, 1);
          G.sfx('land');
          L.shake = 0.25;
        }
        return;
      }
      if (hero.ghost) {
        if (hero.sinkTo !== undefined) {
          hero.y += 34 * dt;
        }
        return;
      }

      const upCtx = L.contextUp;
      if (gp) {
        if (G.input.take('jump')) hero.jumpBuf = 0.12;
        if (G.input.peek('up') && !upCtx && !hero.climb && !ladderAt()) {
          G.input.take('up');
          hero.jumpBuf = 0.12;
        }
        hero.jumpHeld = G.input.held('jump') || (G.input.held('up') && !hero.climb);
      } else {
        hero.jumpHeld = false;
      }
      if (hero.jumpBuf > 0) hero.jumpBuf -= dt;

      if (gp && !hero.hold) {
        const lad = ladderAt();
        if (!hero.climb && lad) {
          if (G.input.held('up') && hero.y > lad.top + 1) {
            hero.climb = lad;
            hero.x = lad.x;
            hero.vx = 0;
            hero.vy = 0;
          } else if (G.input.held('down') && hero.onGround && Math.abs(hero.y - lad.top) < 3) {
            hero.climb = lad;
            hero.x = lad.x;
            hero.y = lad.top + 2;
            hero.vx = 0;
            hero.vy = 0;
          }
        }
        if (hero.climb) {
          const l = hero.climb;
          const dy = (G.input.held('down') ? 1 : 0) - (G.input.held('up') ? 1 : 0);
          hero.y += dy * 52 * dt;
          hero.ph += Math.abs(dy) * dt * 2.2;
          if (dy && Math.floor(hero.ph * 4) % 2 === 0 && Math.random() < 0.08) G.sfx('ladder');
          if (hero.y <= l.top) {
            hero.y = l.top;
            hero.climb = null;
            hero.onGround = true;
            hero.vy = 0;
          } else if (hero.y >= l.bottom) {
            hero.y = l.bottom;
            hero.climb = null;
            hero.onGround = true;
            hero.vy = 0;
          }
          if (G.input.held('left') || G.input.held('right') || hero.jumpBuf > 0) {
            if (hero.jumpBuf > 0) {
              hero.vy = -200;
              hero.jumpBuf = 0;
              G.sfx('jump');
            }
            hero.vx = (G.input.held('right') ? 1 : G.input.held('left') ? -1 : 0) * 50;
            hero.climb = null;
          }
          if (hero.climb) return;
        }
      }

      if (hero.onGround) hero.coyote = 0.08;
      else hero.coyote -= dt;
      if (gp && !hero.hold && hero.jumpBuf > 0 && hero.coyote > 0) {
        hero.vy = -G.cfg.jumpV;
        hero.jumpBuf = 0;
        hero.coyote = 0;
        hero.onGround = false;
        G.sfx('jump');
        L.parts.dust(hero.x, hero.y, hero.face);
      }
      if (!hero.jumpHeld && hero.vy < -150 && !hero.springLaunch) hero.vy = -150;
      if (hero.vy >= 0) hero.springLaunch = false;

      const wasGround = hero.onGround;
      const preVy = hero.vy;
      L.acc += dt;
      let n = 0;
      while (L.acc >= STEP && n < 8) {
        L.acc -= STEP;
        n++;
        const target = ax * G.cfg.platSpeed;
        if (hero.stun <= 0) hero.vx = G.approach(hero.vx, target, G.cfg.platAccel * STEP);
        if (!hero.hold) {
          hero.vy = Math.min(hero.vy + G.cfg.gravity * STEP, 430);
        }
        moveX(STEP);
        if (!hero.hold) moveY(STEP);
        if (hero.onGround && preVy > 220 && !wasGround) {
          L.parts.dust(hero.x, hero.y, 0);
          G.sfx('land');
          hero.landT = 0.1;
        }
      }
      hero.ph += (Math.abs(hero.vx) * dt) / 24;
      if (hero.y > L.H + 40) pitDeath();
      const tc = Math.floor(hero.x / T);
      const tr = Math.floor((hero.y - 4) / T);
      if (L.tile(tc, tr) === 'V' || L.tile(tc, Math.floor((hero.y - 1) / T)) === 'V') {
        L.parts.burst(hero.x, hero.y, 10, '#ffb02e', 90, 0.6);
        pitDeath();
      }
      if (hero.onGround) {
        for (const cp of def.checkpoints || []) {
          if (hero.x > cp.x && cp.x > (L.checkpoint.cx || 0)) {
            L.checkpoint = { x: hero.x, y: hero.y, cx: cp.x };
          }
        }
      }
    }

    function heroBox() {
      return { l: hero.x - HW, r: hero.x + HW, t: hero.y - HH, b: hero.y };
    }

    function overlap(a, b) {
      return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
    }

    function updateWalker(e, dt) {
      if (!e.alive) {
        if (e.sq > 0) e.sq -= dt;
        return;
      }
      if (Math.abs(e.x - hero.x) > 300) return;
      const dir = e.dir;
      const sp = e.kind === 'ember' ? 34 : 28;
      e.x += dir * sp * dt;
      const ahead = e.x + dir * 8;
      const wall = solid(Math.floor(ahead / T), Math.floor((e.y - 4) / T));
      const feetRow = Math.floor((e.y + 1) / T);
      const ground = solid(Math.floor(ahead / T), feetRow) || ONEWAY.has(L.tile(Math.floor(ahead / T), feetRow));
      if (wall || (!ground && e.vy === 0 && !(e.noTurn))) {
        e.dir = -dir;
        e.x += e.dir * sp * dt * 2;
      }
      if (e.range && Math.abs(e.x - e.x0) > e.range) e.dir = e.x > e.x0 ? -1 : 1;
      const under = solid(Math.floor(e.x / T), Math.floor((e.y + 0.5) / T)) || ONEWAY.has(L.tile(Math.floor(e.x / T), Math.floor((e.y + 0.5) / T)));
      if (!under) {
        e.vy += 600 * dt;
        e.y += e.vy * dt;
        const row = Math.floor(e.y / T);
        if (solid(Math.floor(e.x / T), row) || ONEWAY.has(L.tile(Math.floor(e.x / T), row))) {
          e.y = row * T;
          e.vy = 0;
        }
      } else e.vy = 0;
      if (e.y > L.H + 40) e.alive = false;
    }

    function killWalker(e) {
      e.alive = false;
      e.sq = 0.5;
      G.sfx('stomp');
      L.parts.burst(e.x, e.y - 4, 6, e.kind === 'ember' ? '#ff8a2a' : '#e8a070', 70, 0.4);
      L.parts.text(e.x - 4, e.y - 16, '+1');
      G.store.coins++;
      G.ui.refresh();
    }

    function stompBounce() {
      hero.vy = hero.jumpHeld ? -300 : -220;
      hero.onGround = false;
      hero.springLaunch = true;
    }

    function updateEnts(dt) {
      const hb = heroBox();
      const hc = { x: hero.x, y: hero.y - 8 };
      let prompt = null;
      L.contextUp = false;
      const gp = G.state === 'gameplay' && !hero.ghost && !L.done;
      for (const e of L.ents) {
        if (e.gone) continue;
        switch (e.t) {
          case 'coin': {
            if (Math.abs(e.x - hc.x) < 10 && Math.abs(e.y - hc.y) < 12 && !hero.ghost) {
              e.gone = true;
              G.store.coins++;
              G.sfx('coin');
              L.parts.burst(e.x, e.y, 5, '#ffe27a', 50, 0.25, 0);
              G.ui.refresh();
            }
            break;
          }
          case 'walker': {
            updateWalker(e, dt);
            if (e.alive && !hero.ghost && !L.done) {
              const eb = { l: e.x - 6, r: e.x + 6, t: e.y - 10, b: e.y };
              if (overlap(hb, eb)) {
                if (hero.vy > 30 && hero.y - hero.vy * dt * 1.5 <= e.y - 10 + 7) {
                  killWalker(e);
                  stompBounce();
                } else if (hero.inv <= 0) {
                  L.hurt(hero.x < e.x ? -1 : 1);
                }
              }
            }
            break;
          }
          case 'spring': {
            if (e.cd > 0) e.cd -= dt;
            if (e.st === null) {
              const dx = Math.abs(hero.x - e.x);
              const fall = hero.vy > 0 && hero.y >= e.y - 26 && hero.y <= e.y - 6 && dx <= 9;
              const walk = hero.onGround && Math.abs(hero.y - e.y) <= 3 && dx <= 7 && Math.abs(hero.vx) > 5;
              if (e.cd <= 0 && gp && !hero.hold && !hero.climb && (fall || walk)) {
                e.st = 0;
                hero.hold = true;
                hero.vy = 0;
                hero.onGround = false;
                hero.x += (e.x - hero.x) * 0.5;
              }
            } else {
              e.st += dt;
              const t = e.st;
              if (t < 0.105) {
                hero.hold = true;
                hero.vy = 0;
                hero.y = e.y - (t < 0.045 ? 15 : 10);
              } else if (t - dt < 0.105 || hero.hold) {
                if (hero.hold) {
                  hero.hold = false;
                  hero.vy = -(hero.jumpHeld ? G.cfg.springVHold : G.cfg.springV);
                  hero.springLaunch = true;
                  hero.onGround = false;
                  G.sfx('spring');
                  L.parts.burst(e.x, e.y - 22, 6, '#ffe27a', 60, 0.3);
                }
              }
              if (t >= 0.315) {
                e.st = null;
                e.cd = 0.3;
              }
            }
            break;
          }
          case 'bell': {
            if (e.cd > 0) e.cd -= dt;
            if (e.st !== null) {
              e.st += dt;
              if (e.st >= BELL_SEQ.length * 0.08) e.st = null;
            }
            const bb = { l: e.x - 6, r: e.x + 6, t: e.y, b: e.y + 24 };
            if (e.cd <= 0 && overlap(hb, bb) && !hero.ghost) {
              e.st = 0;
              e.cd = 0.6;
              e.sign = hero.x < e.x ? 1 : -1;
              G.sfx('bell');
              L.parts.burst(e.x, e.y + 20, 5, '#ffe27a', 50, 0.5, -20);
            }
            break;
          }
          case 'sign': {
            const near = Math.abs(hero.x - e.x) < 40 && Math.abs(hero.y - e.y) < 20;
            if (near && gp) {
              prompt = { x: e.x - L.cam.x, y: e.y - 38 - L.cam.y, label: 'W' };
              L.contextUp = true;
              if (G.input.take('up')) {
                hero.face = e.x >= hero.x ? 1 : -1;
                G.ui.tip(e.who, e.text, 4);
                e.read = 4;
              }
            }
            break;
          }
          case 'reward': {
            if (Math.abs(e.x - hc.x) < 12 && Math.abs(e.y - hc.y) < 14 && gp && !e.taking) {
              e.taking = true;
              L.parts.burst(e.x, e.y, 14, '#ffe27a', 90, 0.6);
              G.run(async () => {
                await G.ui.reward(e.id);
                e.gone = true;
                if (e.after) e.after(L);
              });
            }
            break;
          }
          case 'exit': {
            const cx = (e.c + e.cols / 2) * T;
            const top = e.r * T;
            const on = hero.onGround && Math.abs(hero.y - top) < 2 && Math.abs(hero.x - cx) <= (e.cols * T) / 2 - 8 && gp;
            if (on) {
              prompt = { x: cx - L.cam.x, y: top - 24 - L.cam.y, label: 'S' };
              L.contextDown = true;
              const centered = Math.abs(hero.x - cx) <= 6;
              L.stand = centered ? L.stand + dt : 0;
              if ((centered && L.stand > 0.3) || (G.input.take('down') && centered)) {
                if (!L.exiting) {
                  L.exiting = true;
                  e.fire = true;
                  G.run(() => def.onExit(L, e));
                }
              }
            } else L.stand = 0;
            break;
          }
          case 'door': {
            if (gp && Math.abs(hero.x - e.x) < e.w / 2 && Math.abs(hero.y - e.y) < 10 && !L.exiting) {
              L.exiting = true;
              G.run(() => def.onExit(L, e));
            }
            break;
          }
          case 'geyser': {
            e.tm += dt;
            const per = e.period;
            const ph = e.tm % per;
            if (ph > per - 0.7 && ph < per - 0.7 + dt + 0.001) e.warn = 0.7;
            if (e.warn > 0) {
              e.warn -= dt;
              if (Math.random() < 0.5) L.parts.add({ x: e.x + G.rand(-4, 4), y: e.y, vy: -30, g: 0, life: 0.3, color: '#ffb02e', size: 1 });
              if (e.warn <= 0) {
                L.fireballs.push({ x: e.x, y: e.y, vx: 0, vy: -(e.power || 330), g: 520, life: 3, kind: 'geyser' });
                G.sfx('fire');
              }
            }
            break;
          }
          case 'slab': {
            const near = Math.abs(hero.x - e.x) < 22 && hero.y > e.y + 10;
            if (e.st === 'wait' && near && !hero.ghost) {
              e.st = 'drop';
              e.vy = 0;
            } else if (e.st === 'drop') {
              e.vy += 900 * dt;
              e.y += e.vy * dt;
              if (e.y >= e.yFloor) {
                e.y = e.yFloor;
                e.st = 'down';
                e.tm = 0.7;
                G.sfx('boom');
                L.shake = 0.2;
                L.parts.burst(e.x, e.y + 20, 8, '#8d949b', 70, 0.5);
              }
            } else if (e.st === 'down') {
              e.tm -= dt;
              if (e.tm <= 0) e.st = 'rise';
            } else if (e.st === 'rise') {
              e.y -= 40 * dt;
              if (e.y <= e.y0) {
                e.y = e.y0;
                e.st = 'wait';
              }
            }
            if (!hero.ghost && !L.done) {
              const sb = { l: e.x - 14, r: e.x + 14, t: e.y, b: e.y + 20 };
              if (overlap(hb, sb) && (e.st === 'drop' || e.st === 'down') && hero.inv <= 0) L.hurt(0);
            }
            break;
          }
          case 'boss':
            updateBoss(e, dt, hb, gp);
            break;
          case 'pad': {
            break;
          }
        }
      }
      if (prompt) G.ui.prompt(true, prompt.x, prompt.y, prompt.label);
      else G.ui.prompt(false);
    }

    function updateBoss(e, dt, hb, gp) {
      if (e.dead) {
        e.dying += dt;
        return;
      }
      if (!e.active) {
        if (gp && Math.abs(hero.x - e.x) < e.trigger) {
          e.active = true;
          if (L.events.bossStart) G.run(() => L.events.bossStart(L, e));
        }
        return;
      }
      if (e.inv > 0) e.inv -= dt;
      const to = hero.x < e.x ? -1 : 1;
      if (e.mouth > 0) {
        e.mouth -= dt;
        e.vx = 0;
        if (e.mouth <= 0.2 && !e.fired) {
          e.fired = true;
          L.fireballs.push({ x: e.x + e.dir * 26, y: e.y - 20, vx: e.dir * (110 + (3 - e.hp) * 18), vy: 0, g: 0, life: 4, kind: 'boss' });
          G.sfx('fire');
        }
      } else {
        e.fired = false;
        e.dir = to;
        const sp = 32 + (3 - e.hp) * 14;
        e.vx = e.dir * sp;
        e.walkT += dt;
        e.fireT -= dt;
        e.jumpT -= dt;
        if (e.fireT <= 0 && e.onG !== false) {
          e.fireT = 2.2 + Math.random() * 1.2;
          e.mouth = 0.7;
        }
        if (e.jumpT <= 0 && e.onG !== false) {
          e.jumpT = 3 + Math.random() * 1.5;
          e.vy = -300;
          e.onG = false;
        }
      }
      e.x += e.vx * dt;
      e.x = G.clamp(e.x, e.x0, e.x1);
      e.vy += 800 * dt;
      e.y += e.vy * dt;
      const row = Math.floor(e.y / T);
      const c = Math.floor(e.x / T);
      if (e.vy >= 0 && (solid(c, row) || ONEWAY.has(L.tile(c, row)))) {
        if (e.vy > 150) {
          L.shake = 0.15;
          G.sfx('boom');
        }
        e.y = row * T;
        e.vy = 0;
        e.onG = true;
      }
      if (hero.ghost || L.done) return;
      const eb = { l: e.x - 18, r: e.x + 18, t: e.y - 36, b: e.y };
      if (overlap(hb, eb)) {
        const onTop = hero.vy > 20 && hero.y - hero.vy * dt * 1.5 <= e.y - 30;
        if (onTop && e.inv <= 0) {
          e.hp--;
          e.inv = 1.4;
          G.sfx('stomp');
          L.shake = 0.25;
          L.parts.burst(e.x, e.y - 34, 12, '#ffb02e', 90, 0.5);
          stompBounce();
          hero.vy = -260;
          if (e.hp <= 0) {
            e.dead = true;
            G.sfx('roar');
            L.bossDown = true;
            L.fireballs.length = 0;
            if (L.events.bossDown) G.run(() => L.events.bossDown(L, e));
          }
        } else if (!onTop && hero.inv <= 0 && e.inv <= 0.3) {
          L.hurt(hero.x < e.x ? -1 : 1);
        } else if (onTop) {
          stompBounce();
        }
      }
    }

    function updateFire(dt) {
      for (let i = L.fireballs.length - 1; i >= 0; i--) {
        const f = L.fireballs[i];
        f.life -= dt;
        f.vy += f.g * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.life <= 0 || f.y > L.H + 30) {
          L.fireballs.splice(i, 1);
          continue;
        }
        if (Math.random() < 0.4) L.parts.add({ x: f.x, y: f.y, vy: 10, life: 0.25, color: '#ff8a2a', size: 2 });
        if (f.kind === 'boss' && (solid(Math.floor(f.x / T), Math.floor(f.y / T)) || f.x < 4 || f.x > L.W - 4)) {
          L.fireballs.splice(i, 1);
          continue;
        }
        if (!hero.ghost && !L.done && Math.abs(f.x - hero.x) < 8 && Math.abs(f.y - (hero.y - 8)) < 11) {
          if (hero.inv <= 0) {
            L.hurt(hero.x < f.x ? -1 : 1);
            L.fireballs.splice(i, 1);
          }
        }
      }
    }

    function updateBarrels(dt) {
      const br = def.brute;
      if (!br) return;
      if (L.throwT > 0) L.throwT -= dt;
      if (L.barrelsOn && G.state === 'gameplay') {
        L.barrelT -= dt;
        if (L.barrelT <= 0) {
          L.barrelT = def.barrelEvery || 3.2;
          L.throwT = 0.5;
          G.sfx('roar');
          setTimeout(() => {
            if (G.level === L && !L.done) {
              L.barrels.push({ x: br.x + 26, y: br.y - 16, vx: 50, vy: -40, ang: 0, alive: true });
              G.sfx('bump');
            }
          }, 380);
        }
      }
      for (let i = L.barrels.length - 1; i >= 0; i--) {
        const b = L.barrels[i];
        const prev = b.y;
        b.vy = Math.min(b.vy + 500 * dt, 260);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.ang += (b.vx * dt) / 5;
        if (b.vy >= 0) {
          const row = Math.floor((b.y + 6) / T);
          const c = Math.floor(b.x / T);
          const ch = L.tile(c, row);
          const top = row * T;
          if ((ONEWAY.has(ch) || SOLID.has(ch)) && prev + 6 <= top + 1) {
            b.y = top - 6;
            b.vy = 0;
            const d = def.tierDir && def.tierDir[row];
            if (d) b.vx = 52 * d;
          }
        }
        if (b.y > L.H + 30) {
          L.barrels.splice(i, 1);
          continue;
        }
        if (!hero.ghost && !L.done && Math.abs(b.x - hero.x) < 9 && Math.abs(b.y - (hero.y - 8)) < 11 && hero.inv <= 0) {
          L.hurt(hero.x < b.x ? -1 : 1);
          L.barrels.splice(i, 1);
          L.parts.burst(b.x, b.y, 8, '#a86a32', 70, 0.4);
        }
      }
    }

    function updatePose(dt) {
      if (hero.force) {
        if (hero.force === 'land' && hero.landT <= 0) hero.force = null;
        else {
          hero.pose = hero.force;
          return;
        }
      }
      if (hero.climb) hero.pose = 'climb';
      else if (hero.hold) hero.pose = 'crouch';
      else if (!hero.onGround) hero.pose = hero.vy < 0 ? 'jump' : 'fall2';
      else if (hero.landT > 0) hero.pose = 'land';
      else if (Math.abs(hero.vx) > 8) {
        hero.pose = 'run';
        L.idleT = 0;
      } else {
        L.idleT += dt;
        hero.pose = L.idleT > G.cfg.waitAnim ? 'wait' : 'idle';
      }
      if (Math.abs(hero.vx) > 8 || !hero.onGround) L.idleT = 0;
    }

    L.update = function (dt) {
      L.time += dt;
      L.parts.update(dt);
      if (L.shake > 0) L.shake -= dt;
      updateHero(dt);
      updateEnts(dt);
      updateFire(dt);
      updateBarrels(dt);
      updatePose(dt);
      if (def.tick) def.tick(L, dt);
      for (const k in L.bumps) {
        L.bumps[k] += dt;
        if (L.bumps[k] > 0.12) delete L.bumps[k];
      }
      if (L.popCoin) {
        L.popCoin.t += dt;
        if (L.popCoin.t > 0.4) L.popCoin = null;
      }
      if (L.camTween) {
        const ct = L.camTween;
        ct.t += dt;
        const k = G.clamp(ct.t / ct.d, 0, 1);
        const e = k * k * (3 - 2 * k);
        const to = ct.back ? L.followTarget() : ct.to;
        L.cam.x = G.lerp(ct.from.x, to.x, e);
        L.cam.y = G.lerp(ct.from.y, to.y, e);
        if (k >= 1) L.camTween = null;
      } else {
        const t = L.followTarget();
        L.cam.x += (t.x - L.cam.x) * Math.min(1, dt * 7);
        L.cam.y += (t.y - L.cam.y) * Math.min(1, dt * 7);
        if (Math.abs(L.cam.x - t.x) < 0.3) L.cam.x = t.x;
        if (Math.abs(L.cam.y - t.y) < 0.3) L.cam.y = t.y;
      }
    };

    function drawTiles(ctx, cx, cy) {
      const c0 = Math.max(0, Math.floor(cx / T));
      const c1 = Math.min(cols - 1, c0 + 31);
      const r0 = Math.max(0, Math.floor(cy / T));
      const r1 = Math.min(rows - 1, r0 + 18);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const ch = grid[r][c];
          if (ch === '.' || ch === 'P' || ch === 'X') continue;
          let x = c * T - cx;
          let y = r * T - cy;
          const bt = L.bumps[c + ',' + r];
          if (bt !== undefined) y -= Math.round(4 * Math.sin((bt / 0.12) * Math.PI));
          if (ch === 'V') {
            art.lava(ctx, x, y, L.time, c);
            continue;
          }
          if (ch === 'I') {
            if (art.img.lucky.complete && art.img.lucky.naturalWidth) ctx.drawImage(art.img.lucky, x - 1, y - 1);
            else art.R(ctx, x, y, 16, 16, '#f2c230');
            continue;
          }
          const top = ch === '#' && !SOLID.has(L.tile(c, r - 1));
          const tile = art.platTile(def.theme, ch, top);
          if (tile) ctx.drawImage(tile, x, y);
        }
      }
    }

    function drawEnt(ctx, e, cx, cy) {
      const x = Math.round(e.x - cx);
      const y = Math.round((e.y || 0) - cy);
      switch (e.t) {
        case 'coin':
          art.coin(ctx, x, y, L.time, e.phase);
          break;
        case 'walker':
          if (e.alive || e.sq > 0) art.bug(ctx, e.kind, x, y, L.time + e.x, e.dir, !e.alive);
          break;
        case 'spring': {
          let h = 22;
          if (e.st !== null) {
            const t = e.st;
            h = t < 0.045 ? 15 : t < 0.105 ? 10 : t < 0.145 ? 27 : t < 0.195 ? 31 : t < 0.255 ? 19 : 24;
          }
          art.spring(ctx, x, y, h);
          break;
        }
        case 'bell': {
          let f = 2;
          if (e.st !== null) f = BELL_SEQ[Math.min(BELL_SEQ.length - 1, Math.floor(e.st / 0.08))];
          if (e.sign < 0) f = 4 - f;
          art.bell(ctx, x, y, f);
          break;
        }
        case 'sign':
          art.sign(ctx, x, y);
          break;
        case 'reward': {
          const r = G.rewardById[e.id];
          art.rewardIcon(ctx, r.kind, x, y, L.time, r.tint);
          break;
        }
        case 'slab': {
          art.R(ctx, x - 1, y - 1 - 40, 2, 40, '#3a4046');
          ctx.fillStyle = '#14171a';
          ctx.fillRect(x - 15, y - 1, 30, 22);
          ctx.fillStyle = '#69758d';
          ctx.fillRect(x - 14, y, 28, 20);
          ctx.fillStyle = '#8f9db8';
          ctx.fillRect(x - 14, y, 28, 3);
          ctx.fillStyle = '#2e3548';
          ctx.fillRect(x - 14, y + 17, 28, 3);
          ctx.fillStyle = '#c8372d';
          ctx.fillRect(x - 6, y + 8, 3, 3);
          ctx.fillRect(x + 3, y + 8, 3, 3);
          break;
        }
        case 'boss': {
          if (e.dead && e.dying > 1.6) break;
          const flash = e.inv > 0 && Math.floor(L.time * 14) % 2;
          const oy = e.dead ? Math.min(40, e.dying * 30) : 0;
          art.tyrant(ctx, x, y + oy, L.time, e.dir, { mouth: e.mouth > 0, hurt: flash, walk: Math.abs(e.vx) > 5 });
          break;
        }
      }
    }

    L.draw = function (ctx) {
      let cx = Math.round(L.cam.x);
      let cy = Math.round(L.cam.y);
      if (L.shake > 0 && G.motion) {
        cx += Math.round((Math.random() - 0.5) * 3);
        cy += Math.round((Math.random() - 0.5) * 3);
      }
      art.bg(ctx, def.bg, cx, cy, L.time);
      if (def.theme === 'castle') {
        ctx.globalAlpha = 0.25 + 0.08 * Math.sin(L.time * 2);
        const g = ctx.createLinearGradient(0, 150, 0, 270);
        g.addColorStop(0, 'rgba(255,106,42,0)');
        g.addColorStop(1, 'rgba(255,138,42,1)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 150, 480, 120);
        ctx.globalAlpha = 1;
      }
      (def.bigPipes || []).forEach(p => {
        const img = art.bigPipe(def.theme, p.cols, p.rows);
        ctx.drawImage(img, p.c * T - cx, p.r * T - cy);
      });
      if (def.startPipe) {
        const img = art.bigPipe(def.theme, 6, 8, true);
        const sh = L.pipeShake ? Math.round(Math.sin(L.time * 70)) : 0;
        ctx.drawImage(img, def.startPipe.x - cx + sh, def.startPipe.y - cy);
      }
      for (const e of L.ents) if (!e.gone && (e.t === 'sign' || e.t === 'bell')) drawEnt(ctx, e, cx, cy);
      if (def.hooks && def.hooks.drawBack) def.hooks.drawBack(L, ctx, cx, cy);
      (def.ladders || []).forEach(l => {
        const tile = art.platTile(def.theme, 'L', false);
        for (let y = l.top; y < l.bottom; y += T) ctx.drawImage(tile, l.x - 8 - cx, y - cy);
      });
      drawTiles(ctx, cx, cy);
      if (L.popCoin) {
        const k = L.popCoin.t / 0.4;
        art.coin(ctx, L.popCoin.x - cx, L.popCoin.y - cy - Math.sin(k * Math.PI) * 32, L.time, 0);
      }
      for (const e of L.ents) if (!e.gone && e.t !== 'sign' && e.t !== 'bell') drawEnt(ctx, e, cx, cy);
      if (def.brute) {
        art.rivet(ctx, def.brute.x - cx, def.brute.y - cy, L.time, L.throwT > 0);
      }
      L.barrels.forEach(b => art.barrel(ctx, Math.round(b.x - cx), Math.round(b.y - cy), b.ang));
      if (def.hooks && def.hooks.drawMid) def.hooks.drawMid(L, ctx, cx, cy);
      if (hero.visible) {
        const blink = hero.inv > 0 && Math.floor(L.time * 16) % 2;
        if (!blink) {
          ctx.save();
          if (hero.clip) {
            ctx.beginPath();
            const cyy = hero.clip.y - cy;
            if (hero.clip.below) ctx.rect(0, cyy, 480, 270 - cyy);
            else ctx.rect(0, 0, 480, cyy);
            ctx.clip();
          }
          if (!hero.clip && hero.onGround) art.shadow(ctx, Math.round(hero.x - cx), Math.round(hero.y - cy), 10);
          art.hero(ctx, hero.x - cx, hero.y - cy, hero.pose, L.time, hero.face, hero.ph);
          ctx.restore();
        }
      }
      if (def.companion !== false && G.companion) G.companion.drawPlat(ctx, L, cx, cy);
      L.fireballs.forEach(f => {
        const x = Math.round(f.x - cx);
        const y = Math.round(f.y - cy);
        art.disc(ctx, x, y, 5, 5, '#c8372d');
        art.disc(ctx, x, y, 4, 4, '#ff8a2a');
        art.disc(ctx, x, y, 2, 2, '#ffe27a');
      });
      L.parts.draw(ctx, cx, cy);
      if (def.hooks && def.hooks.drawFront) def.hooks.drawFront(L, ctx, cx, cy);
      if (L.flash > 0) {
        ctx.globalAlpha = Math.min(1, L.flash);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 480, 270);
        ctx.globalAlpha = 1;
      }
    };

    L.destroy = function () {
      L.parts.clear();
    };

    return L;
  };
})();
