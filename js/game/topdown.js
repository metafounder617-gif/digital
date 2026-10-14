(function () {
  const G = window.G;
  const art = G.art;
  const T = 16;

  G.companion = {
    active: false,
    kind: 'zipp',
    trail: [],
    reset() {
      this.trail = [];
    },
    push(x, y) {
      const t = this.trail;
      const l = t[t.length - 1];
      if (!l || Math.abs(l.x - x) + Math.abs(l.y - y) > 1.2) {
        t.push({ x, y });
        if (t.length > 80) t.shift();
      }
    },
    pos(x, y) {
      const t = this.trail;
      if (!t.length) return { x: x - 14, y };
      let acc = 0;
      let px = x;
      let py = y;
      for (let i = t.length - 1; i >= 0; i--) {
        acc += Math.abs(t[i].x - px) + Math.abs(t[i].y - py);
        px = t[i].x;
        py = t[i].y;
        if (acc >= 22) return { x: px, y: py };
      }
      return { x: px, y: py };
    },
    drawPlat(ctx, L, cx, cy) {
      if (!this.active) return;
      this.push(L.hero.x, L.hero.y);
      const p = this.pos(L.hero.x, L.hero.y);
      const hop = L.hero.onGround && Math.abs(L.hero.vx) > 8 ? Math.abs(Math.sin(L.time * 12)) * 3 : 0;
      art.shadow(ctx, Math.round(p.x - cx), Math.round(p.y - cy), 10);
      art.critter(ctx, this.kind, p.x - cx, p.y - cy, L.time, hop);
    },
    posTop(L) {
      this.push(L.hero.x, L.hero.y);
      return this.pos(L.hero.x, L.hero.y);
    }
  };

  G.TopDown = function (def) {
    const cols = def.cols;
    const rows = def.rows;
    const tiles = def.tiles.map(r => r.split(''));
    const L = {
      kind: 'top',
      def,
      W: cols * T,
      H: rows * T,
      time: 0,
      parts: G.Particles(),
      cam: { x: 0, y: 0 },
      camTween: null,
      ents: [],
      done: false,
      exiting: false,
      shake: 0,
      lockMsgT: 0,
      idleT: 0
    };
    const hero = (L.hero = {
      x: def.spawn.x,
      y: def.spawn.y,
      vx: 0,
      vy: 0,
      dir: 'down',
      face: 1,
      moving: false,
      ph: 0,
      hop: 0,
      hopT: 0,
      auto: null,
      visible: true,
      pose: 'idle',
      force: null,
      ghost: false,
      sink: 0
    });

    def.entities.forEach(e => {
      const o = Object.assign({}, e);
      if (o.t === 'critter') {
        o.hx = o.x;
        o.hy = o.y;
        o.tx = o.x;
        o.ty = o.y;
        o.wait = Math.random() * 2;
        o.hop = 0;
        o.hopT = 0;
        o.r = o.r || 24;
        o.react = 0;
      }
      if (o.t === 'chest') o.opened = false;
      if (o.t === 'sign') o.who = { name: '', anchor: () => ({ x: o.x - L.cam.x, y: o.y - 20 - L.cam.y }) };
      if (o.t === 'npc') o.who = { name: o.label || '', anchor: () => ({ x: o.x - L.cam.x, y: o.y - 26 - L.cam.y }) };
      L.ents.push(o);
    });

    L.heroWho = { name: '', anchor: () => ({ x: hero.x - L.cam.x, y: hero.y - 24 - hero.hop - L.cam.y }) };
    L.worldAnchor = (x, y) => () => ({ x: x - L.cam.x, y: y - L.cam.y });
    L.find = id => L.ents.find(e => e.id === id);

    const tileAt = (c, r) => (c < 0 || c >= cols || r < 0 || r >= rows ? 'w' : tiles[r][c]);
    const tileSolid = (c, r) => art.topSolid.indexOf(tileAt(c, r)) >= 0;
    L.setTile = (c, r, ch) => {
      tiles[r][c] = ch;
    };

    function entSolid(e) {
      if (e.gone) return null;
      if (e.t === 'fountain') return { l: e.x - 14, r: e.x + 14, t: e.y - 12, b: e.y };
      if (e.t === 'chest') return { l: e.x - 7, r: e.x + 7, t: e.y - 8, b: e.y };
      if (e.t === 'npc') return { l: e.x - 5, r: e.x + 5, t: e.y - 5, b: e.y };
      if (e.t === 'gate' && !e.open) return { l: e.x - 20, r: e.x + 20, t: e.y - 6, b: e.y };
      if (e.t === 'sign') return { l: e.x - 4, r: e.x + 4, t: e.y - 5, b: e.y };
      if (e.t === 'prop' && e.solid) return { l: e.x - e.solid.w / 2, r: e.x + e.solid.w / 2, t: e.y - e.solid.h, b: e.y };
      return null;
    }

    function blocked(x, y) {
      const l = x - 4;
      const r = x + 4;
      const t = y - 5;
      const b = y;
      const c0 = Math.floor(l / T);
      const c1 = Math.floor((r - 0.01) / T);
      const r0 = Math.floor(t / T);
      const r1 = Math.floor((b - 0.01) / T);
      for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) if (tileSolid(cc, rr)) return true;
      for (const e of L.ents) {
        const s = entSolid(e);
        if (s && l < s.r && r > s.l && t < s.b && b > s.t) return true;
      }
      return false;
    }

    L.setPose = p => {
      hero.force = p;
    };
    L.faceDir = d => {
      hero.dir = d;
      if (d === 'left') hero.face = -1;
      if (d === 'right') hero.face = 1;
    };
    L.walkTo = (x, y, speed) => {
      hero.auto = { tx: x, ty: y, speed: speed || 60 };
      return G.until(() => !hero.auto);
    };
    L.hopNow = () => {
      hero.hopT = 0.01;
      G.sfx('jump');
    };
    L.panTo = (x, y, secs) => {
      L.camTween = { from: { x: L.cam.x, y: L.cam.y }, to: { x: x - G.W / 2, y: y - 147 }, t: 0, d: secs || 1 };
      return G.until(() => !L.camTween);
    };
    L.panBack = secs => {
      L.camTween = { from: { x: L.cam.x, y: L.cam.y }, to: null, t: 0, d: secs || 0.8, back: true };
      return G.until(() => !L.camTween);
    };

    L.followTarget = () => {
      let tx = hero.x - G.W / 2;
      let ty = hero.y - 147;
      tx = L.W <= G.W ? -(G.W - L.W) / 2 : G.clamp(tx, 0, L.W - G.W);
      const usable = G.H - G.TOP;
      ty = L.H <= usable ? -G.TOP - (usable - L.H) / 2 : G.clamp(ty, -G.TOP, L.H - G.H);
      return { x: tx, y: ty };
    };

    L.moveHeroTo = (x, y) => {
      hero.x = x;
      hero.y = y;
      const t = L.followTarget();
      L.cam.x = t.x;
      L.cam.y = t.y;
    };

    function near(e, d) {
      return Math.hypot(hero.x - e.x, hero.y - 4 - (e.y - 4)) < d;
    }

    function useEnt(e) {
      if (e.t === 'sign') {
        G.ui.tip(e.who, e.text, 4);
        G.sfx('click');
      } else if (e.t === 'chest') {
        if (e.opened) {
          G.ui.tip(L.heroWho, 'Empty.', 1.5);
          return;
        }
        e.opened = true;
        G.sfx('open');
        L.parts.burst(e.x, e.y - 12, 10, '#ffe27a', 70, 0.6);
        G.run(async () => {
          await G.wait(0.35);
          if (e.reward) {
            await G.ui.reward(e.reward);
          } else {
            const n = e.coins || 5;
            G.store.coins += n;
            G.sfx('coin');
            L.parts.text(e.x - 6, e.y - 22, '+' + n);
            G.ui.refresh();
          }
        });
      } else if (e.t === 'fountain') {
        G.sfx('coin');
        L.parts.burst(e.x, e.y - 14, 8, '#bfe4ff', 60, 0.6);
        if (!e.wished) {
          e.wished = true;
          G.store.coins += 5;
          L.parts.text(e.x - 6, e.y - 30, '+5');
          G.ui.refresh();
          G.ui.tip(L.heroWho, 'A wish! 願い!', 2);
        } else G.ui.tip(L.heroWho, 'The water sparkles.', 1.6);
      } else if (e.t === 'npc') {
        if (def.onTalk) G.run(() => def.onTalk(L, e));
      } else if (e.t === 'use') {
        if (e.onUse) G.run(() => e.onUse(L, e));
      }
    }

    function interactable(e) {
      if (e.gone) return false;
      return e.t === 'sign' || e.t === 'chest' || e.t === 'fountain' || e.t === 'npc' || e.t === 'use';
    }

    function updateHero(dt) {
      const gp = G.state === 'gameplay' && !L.done;
      let ax = 0;
      let ay = 0;
      if (hero.auto) {
        const dx = hero.auto.tx - hero.x;
        const dy = hero.auto.ty - hero.y;
        const d = Math.hypot(dx, dy);
        if (d < 1.5) {
          hero.x = hero.auto.tx;
          hero.y = hero.auto.ty;
          hero.auto = null;
          hero.vx = 0;
          hero.vy = 0;
          hero.moving = false;
        } else {
          const sp = Math.min(hero.auto.speed, d / dt);
          hero.vx = (dx / d) * sp;
          hero.vy = (dy / d) * sp;
          hero.x += hero.vx * dt;
          hero.y += hero.vy * dt;
          hero.moving = true;
          hero.ph += (sp * dt) / 22;
          if (Math.abs(dx) > Math.abs(dy)) {
            hero.dir = dx > 0 ? 'right' : 'left';
            hero.face = dx > 0 ? 1 : -1;
          } else hero.dir = dy > 0 ? 'down' : 'up';
        }
      } else if (gp) {
        const a = G.input.axis();
        ax = a.x;
        ay = a.y;
        const sp = G.cfg.topSpeed;
        hero.vx = G.approach(hero.vx, ax * sp, 1200 * dt);
        hero.vy = G.approach(hero.vy, ay * sp, 1200 * dt);
        let nx = hero.x + hero.vx * dt;
        if (!blocked(nx, hero.y)) hero.x = nx;
        else hero.vx = 0;
        let ny = hero.y + hero.vy * dt;
        if (!blocked(hero.x, ny)) hero.y = ny;
        else hero.vy = 0;
        hero.moving = Math.abs(hero.vx) + Math.abs(hero.vy) > 8;
        if (ax || ay) {
          if (Math.abs(ax) >= Math.abs(ay) && ax) {
            hero.dir = ax > 0 ? 'right' : 'left';
            hero.face = ax > 0 ? 1 : -1;
          } else if (ay) hero.dir = ay > 0 ? 'down' : 'up';
        }
        if (hero.moving) hero.ph += (Math.hypot(hero.vx, hero.vy) * dt) / 22;
      } else if (!hero.ghost) {
        hero.vx = 0;
        hero.vy = 0;
        hero.moving = false;
      }
      if (hero.hopT > 0) {
        hero.hopT += dt;
        if (hero.hopT >= 0.34) {
          hero.hopT = 0;
          hero.hop = 0;
        } else hero.hop = Math.sin((hero.hopT / 0.34) * Math.PI) * 9;
      }
      if (hero.moving) L.idleT = 0;
      else L.idleT += dt;
      const tc = Math.floor(hero.x / T);
      const tr = Math.floor((hero.y - 1) / T);
      if (hero.moving && tileAt(tc, tr) === ',' && Math.random() < dt * 14) {
        L.parts.add({ x: hero.x + G.rand(-4, 4), y: hero.y - 2, vx: G.rand(-14, 14), vy: -G.rand(14, 30), g: 80, life: 0.35, color: '#8fe05a', size: 1 });
      }
    }

    function updateEnts(dt) {
      let target = null;
      let bd = 1e9;
      const gp = G.state === 'gameplay' && !L.done;
      for (const e of L.ents) {
        if (e.gone) continue;
        if (e.t === 'critter') {
          e.wait -= dt;
          const dh = Math.hypot(hero.x - e.x, hero.y - e.y);
          if (dh < 30 && e.react <= 0) {
            e.react = 2.5;
            e.hopT = 0.01;
            L.parts.add({ x: e.x, y: e.y - 20, vy: -22, life: 0.8, color: '#ff7ba0', size: 3 });
            L.parts.add({ x: e.x + 3, y: e.y - 22, vy: -22, life: 0.8, color: '#ff7ba0', size: 2 });
          }
          if (e.react > 0) e.react -= dt;
          if (e.hopT > 0) {
            e.hopT += dt;
            if (e.hopT >= 0.3) {
              e.hopT = 0;
              e.hop = 0;
            } else e.hop = Math.sin((e.hopT / 0.3) * Math.PI) * 6;
          }
          if (e.wait <= 0) {
            e.tx = e.hx + G.rand(-e.r, e.r);
            e.ty = e.hy + G.rand(-e.r * 0.6, e.r * 0.6);
            e.wait = G.rand(1.2, 3.5);
          }
          const dx = e.tx - e.x;
          const dy = e.ty - e.y;
          const d = Math.hypot(dx, dy);
          if (d > 1) {
            const nx = e.x + (dx / d) * 18 * dt;
            const ny = e.y + (dy / d) * 18 * dt;
            const c = Math.floor(nx / T);
            const r = Math.floor((ny - 1) / T);
            if (!tileSolid(c, r) && tileAt(c, r) !== 'w') {
              e.x = nx;
              e.y = ny;
              e.hopT = e.hopT || (Math.random() < dt * 2 ? 0.01 : 0);
            }
          }
        }
        if (e.t === 'orb' && gp && Math.hypot(hero.x - e.x, hero.y - 6 - e.y) < 12 && !e.taken) {
          e.taken = true;
          G.run(() => def.onOrb(L, e));
        }
        if (e.t === 'key' && gp && Math.hypot(hero.x - e.x, hero.y - 6 - e.y) < 12) {
          e.gone = true;
          G.store.flags.key = true;
          G.sfx('power');
          L.parts.burst(e.x, e.y - 8, 12, '#ffe27a', 80, 0.6);
          if (def.onKey) G.run(() => def.onKey(L, e));
        }
        if (e.t === 'coin' && gp && Math.hypot(hero.x - e.x, hero.y - 8 - e.y) < 10) {
          e.gone = true;
          G.store.coins++;
          G.sfx('coin');
          L.parts.burst(e.x, e.y, 4, '#ffe27a', 40, 0.25, 0);
          G.ui.refresh();
        }
        if (e.t === 'reward' && gp && Math.hypot(hero.x - e.x, hero.y - 8 - e.y) < 12 && !e.taking) {
          e.taking = true;
          L.parts.burst(e.x, e.y, 14, '#ffe27a', 90, 0.6);
          G.run(async () => {
            await G.ui.reward(e.id);
            e.gone = true;
            if (e.after) e.after(L);
          });
        }
        if (e.t === 'gate' && e.open && gp && !L.exiting && Math.abs(hero.x - e.x) < 18 && hero.y < e.y - 4 && hero.y > e.y - 30) {
          L.exiting = true;
          G.run(() => def.onExit(L, e));
        }
        if (e.t === 'gate' && !e.open && gp && Math.abs(hero.x - e.x) < 26 && hero.y < e.y + 8 && hero.y > e.y - 16 && L.lockMsgT <= 0) {
          L.lockMsgT = 4;
          if (def.onGateBlocked) def.onGateBlocked(L, e);
        }
        if (e.t === 'exitdoor' && gp && !L.exiting && Math.abs(hero.x - e.x) < e.w / 2 && Math.abs(hero.y - e.y) < 8) {
          if (e.needsKey && !G.store.flags.key) {
            if (L.lockMsgT <= 0) {
              L.lockMsgT = 3;
              G.sfx('bump');
              G.ui.tip(L.heroWho, e.lockedText || 'Locked.', 2.4);
            }
          } else {
            L.exiting = true;
            G.run(() => def.onExit(L, e));
          }
        }
        if (interactable(e) && gp && !(e.t === 'chest' && e.opened && !e.reward && false)) {
          const d = Math.hypot(hero.x - e.x, hero.y - 4 - (e.y - 4));
          const lim = e.t === 'fountain' ? 30 : 20;
          if (d < lim && d < bd) {
            bd = d;
            target = e;
          }
        }
      }
      if (L.lockMsgT > 0) L.lockMsgT -= dt;
      L.target = target;
      if (target) {
        G.ui.prompt(true, target.x - L.cam.x, target.y - (target.t === 'chest' ? 22 : 30) - L.cam.y, 'Space');
        if (G.input.take('jump')) {
          hero.dir = target.x > hero.x + 4 ? 'right' : target.x < hero.x - 4 ? 'left' : target.y < hero.y ? 'up' : 'down';
          if (hero.dir === 'left') hero.face = -1;
          if (hero.dir === 'right') hero.face = 1;
          useEnt(target);
        }
      } else {
        G.ui.prompt(false);
        if (gp && G.input.take('jump') && hero.hopT === 0) {
          hero.hopT = 0.01;
          G.sfx('jump');
        }
      }
    }

    L.update = function (dt) {
      L.time += dt;
      L.parts.update(dt);
      if (L.shake > 0) L.shake -= dt;
      updateHero(dt);
      updateEnts(dt);
      if (def.tick) def.tick(L, dt);
      if (def.companion !== false && G.companion.active) G.companion.push(hero.x, hero.y);
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
        L.cam.x += (t.x - L.cam.x) * Math.min(1, dt * 8);
        L.cam.y += (t.y - L.cam.y) * Math.min(1, dt * 8);
      }
    };

    function drawEntFeet(ctx, e, cx, cy) {
      const x = Math.round(e.x - cx);
      const y = Math.round(e.y - cy);
      switch (e.t) {
        case 'sign':
          art.signTop(ctx, x, y);
          break;
        case 'chest':
          art.chest(ctx, x, y, e.opened, L.time);
          break;
        case 'fountain':
          art.fountain(ctx, x, y, L.time);
          break;
        case 'orb':
          if (!e.taken) {
            art.shadow(ctx, x, y, 10);
            art.orb(ctx, x, y, L.time);
          }
          break;
        case 'key':
          art.key(ctx, x, y, L.time);
          break;
        case 'coin':
          art.coin(ctx, x, y, L.time, 0);
          break;
        case 'reward': {
          const r = G.rewardById[e.id];
          art.shadow(ctx, x, y + 8, 12);
          art.rewardIcon(ctx, r.kind, x, y, L.time, r.tint);
          break;
        }
        case 'critter':
          art.shadow(ctx, x, y, 12);
          art.critter(ctx, e.kind, x, y, L.time + e.hx, e.hop);
          break;
        case 'npc':
          art.shadow(ctx, x, y, 10);
          if (e.kind === 'critter') art.critter(ctx, e.crit, x, y, L.time, 0);
          else if (e.kind === 'munch') art.munch(ctx, x, y, L.time, e.face || 1);
          else art.person(ctx, e.kind, x, y, 'idle', L.time, e.face || 1, e.view || 'front');
          break;
        case 'gate':
          art.gate(ctx, x, y, e.open, L.time);
          if (e.open) art.arrow(ctx, x, y - 38, L.time, 'up', false);
          break;
        case 'exitdoor':
          art.hotelDoor(ctx, x, y, !!(!e.needsKey || G.store.flags.key));
          break;
        case 'prop': {
          const p = e.kind;
          if (p === 'bed') art.bed(ctx, x - 14, y);
          else if (p === 'desk') art.desk(ctx, x - e.w / 2, y, e.w);
          else if (p === 'tv') art.tv(ctx, x, y, L.time, true);
          else if (p === 'plant') art.plant(ctx, x, y);
          else if (p === 'lamp') art.lamp(ctx, x, y, L.time);
          else if (p === 'shelf') art.shelf(ctx, x - e.w / 2, y, e.w);
          else if (p === 'table') art.table(ctx, x, y, L.time);
          else if (p === 'counter') art.counter(ctx, x - e.w / 2, y, e.w, L.time);
          else if (p === 'flowerPipe') art.flowerPipe(ctx, x, y);
          else if (p === 'elevator') art.elevator(ctx, x, y, false, L.time);
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
      ctx.fillStyle = def.bgColor || '#1b2a1f';
      ctx.fillRect(0, 0, G.W, G.H);
      const c0 = Math.max(0, Math.floor(cx / T));
      const c1 = Math.min(cols - 1, c0 + 31);
      const r0 = Math.max(0, Math.floor(cy / T));
      const r1 = Math.min(rows - 1, r0 + 18);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const ch = tiles[r][c];
          if (ch === ' ') continue;
          art.topTile(ctx, ch, c * T - cx, r * T - cy, c, r, L.time);
        }
      }
      const list = [];
      for (const e of L.ents) if (!e.gone) list.push({ y: e.y + (e.sortOff || 0), fn: () => drawEntFeet(ctx, e, cx, cy) });
      const comp = G.companion.active && def.companion !== false ? G.companion.pos(hero.x, hero.y) : null;
      if (comp) {
        list.push({
          y: comp.y,
          fn: () => {
            art.shadow(ctx, Math.round(comp.x - cx), Math.round(comp.y - cy), 12);
            const hp = hero.moving ? Math.abs(Math.sin(L.time * 12)) * 3 : 0;
            art.critter(ctx, G.companion.kind, comp.x - cx, comp.y - cy, L.time, hp);
          }
        });
      }
      if (hero.visible) {
        list.push({
          y: hero.y,
          fn: () => {
            art.shadow(ctx, Math.round(hero.x - cx), Math.round(hero.y - cy), 10);
            ctx.save();
            if (hero.clip) {
              ctx.beginPath();
              const cyy = hero.clip.y - cy;
              if (hero.clip.below) ctx.rect(0, cyy, 480, 270 - cyy);
              else ctx.rect(0, 0, 480, cyy);
              ctx.clip();
            }
            if (hero.force && hero.force !== 'idle') {
              const view = hero.force === 'look_front' ? 'front' : hero.dir === 'up' ? 'back' : hero.dir === 'down' ? 'front' : 'side';
              art.hero(ctx, hero.x - cx, hero.y - cy - hero.hop, hero.force, L.time, hero.face, hero.ph, view);
            } else {
              art.heroTop(ctx, hero.x - cx, hero.y - cy, hero.dir, hero.moving, L.time, hero.ph, hero.hop);
            }
            ctx.restore();
          }
        });
      }
      list.sort((a, b) => a.y - b.y);
      list.forEach(i => i.fn());
      for (let r = r0; r <= r1 + 1 && r < rows; r++) {
        for (let c = c0; c <= c1; c++) {
          if (tiles[r][c] === 't') art.treeTop(ctx, c * T - cx, r * T - cy);
        }
      }
      L.parts.draw(ctx, cx, cy);
      if (def.hooks && def.hooks.drawFront) def.hooks.drawFront(L, ctx, cx, cy);
      if (def.dim) {
        ctx.fillStyle = def.dim;
        ctx.fillRect(0, 0, G.W, G.H);
      }
    };

    L.destroy = function () {
      L.parts.clear();
    };

    return L;
  };
})();
