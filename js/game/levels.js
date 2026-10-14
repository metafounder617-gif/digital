(function () {
  const G = window.G;
  const T = 16;

  const mkGrid = (c, r, ch) => Array.from({ length: r }, () => new Array(c).fill(ch || '.'));
  const fill = (g, r0, r1, c0, c1, ch) => {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (g[r] && g[r][c] !== undefined) g[r][c] = ch;
  };
  const out = g => g.map(r => r.join(''));
  const pipe = (g, c, r, h) => {
    g[r][c] = 'a';
    g[r][c + 1] = 'b';
    for (let i = 1; i < h; i++) {
      g[r + i][c] = 'c';
      g[r + i][c + 1] = 'd';
    }
  };
  const say = (who, t, o) => G.ui.say(who, t, o);
  const hero = L => L.heroWho;
  const npcWho = (L, name, x, y) => ({ name, anchor: L.worldAnchor ? () => ({ x: x() - L.cam.x, y: y() - L.cam.y }) : null });
  const gameplay = () => G.setState('gameplay');
  const cutscene = () => G.setState('cutscene');

  function row(coins, x0, y, n, step) {
    for (let i = 0; i < n; i++) coins.push({ t: 'coin', x: x0 + i * step, y });
  }

  function L1() {
    const g = mkGrid(90, 17);
    fill(g, 15, 16, 0, 89, '#');
    fill(g, 15, 16, 52, 53, '.');
    fill(g, 15, 16, 66, 68, '.');
    fill(g, 0, 7, 7, 12, 'P');
    pipe(g, 34, 12, 3);
    pipe(g, 62, 12, 3);
    fill(g, 14, 14, 38, 45, 'H');
    fill(g, 13, 13, 39, 44, 'H');
    fill(g, 12, 12, 40, 43, 'H');
    fill(g, 14, 14, 76, 81, 'H');
    fill(g, 13, 13, 77, 80, 'H');
    fill(g, 12, 12, 78, 79, 'H');
    fill(g, 12, 14, 84, 89, 'P');
    g[11][17] = 'B';
    g[11][18] = 'I';
    g[11][19] = 'B';
    fill(g, 11, 11, 47, 51, 'B');
    g[11][48] = 'I';
    g[11][50] = 'I';
    fill(g, 10, 10, 80, 82, 'B');
    g[10][81] = 'I';
    g[10][55] = 'X';
    g[9][78] = 'X';
    fill(g, 9, 9, 41, 44, '=');
    fill(g, 9, 9, 20, 23, '=');
    fill(g, 6, 6, 47, 50, '=');
    fill(g, 6, 6, 58, 61, '=');
    fill(g, 7, 7, 28, 31, '=');
    fill(g, 5, 5, 67, 71, '=');
    const coins = [];
    row(coins, 290, 215, 3, 16);
    [[810, 200], [826, 188], [842, 180], [858, 180], [874, 188], [890, 200]].forEach(p => coins.push({ t: 'coin', x: p[0], y: p[1] }));
    row(coins, 664, 130, 4, 16);
    row(coins, 764, 82, 3, 16);
    row(coins, 940, 82, 3, 16);
    row(coins, 1090, 64, 3, 16);
    row(coins, 1250, 170, 2, 16);
    row(coins, 1300, 215, 2, 16);
    row(coins, 460, 98, 3, 16);
    row(coins, 336, 130, 3, 16);
    const walkers = [500, 780, 960, 1190].map(x => ({ t: 'walker', kind: 'bug', x, y: 240, dir: -1 }));
    return G.Platformer({
      id: 1,
      theme: 'plains',
      bg: 'plains',
      cols: 90,
      rows: 17,
      grid: out(g),
      spawn: { x: 160, y: 240 },
      startPipe: { x: 112, y: 0 },
      bigPipes: [{ c: 84, r: 12, cols: 6, rows: 3 }],
      checkpoints: [{ x: 700 }, { x: 1000 }],
      entities: [
        { t: 'sign', x: 220, y: 240, text: 'Careful! Danger ahead! 注意!' },
        { t: 'spring', x: 416, y: 240 },
        { t: 'spring', x: 1032, y: 240 },
        { t: 'bell', x: 688, y: 144 },
        { t: 'bell', x: 368, y: 144 },
        { t: 'reward', id: 'ddr3', x: 1112, y: 62 },
        { t: 'exit', c: 84, r: 12, cols: 6 },
        ...coins,
        ...walkers
      ],
      hooks: {
        drawFront(L, ctx, cx, cy) {
          if (L.showArrow && !L.exiting) G.art.arrow(ctx, 87 * T - cx, 12 * T - 30 - cy, L.time, 'down', L.bigArrow);
        }
      },
      onExit: async (L, e) => {
        cutscene();
        G.ui.prompt(false);
        L.stopHero();
        L.setPose('idle');
        await say(hero(L), 'いくぞ! Here we go!', { hold: 0.6 });
        await L.enterPipe(87 * T, 12 * T);
        G.setState('transition');
        G.completeLevel();
      }
    });
  }

  async function introL1(L) {
    const h = L.hero;
    h.visible = false;
    cutscene();
    G.ui.title(1, 'Green Plains', '草原');
    await G.fadeTo(-1, 1.2);
    await G.wait(0.9);
    L.pipeShake = true;
    await G.wait(0.8);
    h.visible = true;
    G.ui.say(hero(L), 'WAAAAAAAAAAAH!', { hold: 0.4, speed: 12 });
    await L.dropFromPipe(160, 128, 240);
    L.pipeShake = false;
    await G.wait(0.2);
    await say(hero(L), 'Oof! 痛っ! What a landing!');
    L.setPose(null);
    await L.walkTo(206, 60);
    const sign = L.ents.find(e => e.t === 'sign');
    G.ui.tip(sign.who, sign.text, 3.2);
    await say(hero(L), 'Where am I? ここはどこ?');
    L.setPose('look_front');
    await G.wait(0.4);
    await say(hero(L), "Huh? あれ? Someone's watching!");
    L.setPose('call');
    await say(hero(L), 'Hey, you! Please help me! I have to find the princess!');
    L.setPose(null);
    h.face = 1;
    gameplay();
    G.ui.showPlate(G.cfg.plateTime);
    G.ui.objective('Move with W A S D or arrows. Space to jump.');
    let moved = false;
    let t = 0;
    const startX = h.x;
    while (t < 12) {
      await G.wait(0.25);
      t += 0.25;
      if (Math.abs(h.x - startX) > 8) moved = true;
      if (!moved && t > G.cfg.hintIdle && !L.hintShown) {
        L.hintShown = true;
        G.ui.tip(hero(L), 'Try moving me!', 3);
      }
      if (moved && t > 7) break;
    }
    cutscene();
    G.ui.objective('');
    L.setPose('point');
    const ex = 87 * T;
    await L.panTo(ex - 240, 0, 1.4);
    L.showArrow = true;
    await G.wait(0.7);
    await L.panBack(1.2);
    await say(hero(L), 'Look, a pipe! よし、行こう! Let us go!');
    L.setPose(null);
    gameplay();
    G.ui.objective('Reach the big green pipe at the far right');
    let still = 0;
    let lastX = h.x;
    let bestX = h.x;
    while (!L.exiting) {
      await G.wait(1);
      if (G.state !== 'gameplay') continue;
      if (h.x > bestX + 40) {
        bestX = h.x;
        still = 0;
      } else still++;
      if (still === G.cfg.hintGuide) G.ui.tip(hero(L), 'This way! こっちだ!', 3);
      if (still === G.cfg.hintArrow) L.bigArrow = true;
      lastX = h.x;
    }
  }

  function buildTown() {
    const g = mkGrid(40, 30, '.');
    fill(g, 0, 29, 0, 0, 't');
    fill(g, 0, 29, 39, 39, 't');
    fill(g, 29, 29, 0, 39, 't');
    fill(g, 0, 1, 0, 39, 't');
    fill(g, 0, 1, 19, 20, '_');
    fill(g, 2, 28, 19, 20, '_');
    fill(g, 14, 15, 2, 37, '_');
    fill(g, 11, 18, 15, 24, 's');
    fill(g, 20, 21, 21, 28, '_');
    fill(g, 20, 27, 8, 17, ',');
    fill(g, 21, 26, 2, 6, 'F');
    fill(g, 22, 26, 23, 28, 'w');
    fill(g, 18, 24, 29, 37, 's');
    fill(g, 17, 17, 29, 37, 'f');
    fill(g, 25, 25, 29, 37, 'f');
    fill(g, 17, 25, 37, 37, 'f');
    fill(g, 17, 19, 29, 29, 'f');
    fill(g, 22, 25, 29, 29, 'f');
    fill(g, 3, 4, 14, 25, 'R');
    fill(g, 5, 7, 14, 25, 'M');
    for (let c = 15; c <= 24; c += 3) g[6][c] = 'm';
    fill(g, 7, 7, 19, 20, 'D');
    fill(g, 4, 5, 3, 8, 'r');
    fill(g, 6, 8, 3, 8, 'M');
    fill(g, 4, 5, 31, 36, 'r');
    fill(g, 6, 8, 31, 36, 'M');
    [[11, 6], [27, 6], [12, 18], [36, 12], [4, 12], [9, 28], [24, 28], [13, 9], [26, 10], [5, 18]].forEach(p => (g[p[1]][p[0]] = 't'));
    [[10, 12], [29, 13], [14, 24], [21, 24]].forEach(p => (g[p[1]][p[0]] = 'o'));
    [[12, 12], [27, 12], [6, 11], [33, 12]].forEach(p => (g[p[1]][p[0]] = 'F'));
    fill(g, 28, 28, 2, 38, 'h');
    fill(g, 28, 28, 19, 20, '_');
    return out(g);
  }

  function L2() {
    const kinds = [['ember', 400, 300], ['sprout', 220, 230], ['droplet', 410, 360], ['pebble', 500, 200], ['fluff', 140, 260]];
    return G.TopDown({
      id: 2,
      cols: 40,
      rows: 30,
      tiles: buildTown(),
      spawn: { x: 72, y: 420 },
      bgColor: '#1b2a1f',
      entities: [
        { t: 'prop', kind: 'flowerPipe', x: 72, y: 392, solid: { w: 28, h: 8 } },
        { t: 'sign', x: 108, y: 414, text: 'Welcome to Critter Town! ようこそ!' },
        { t: 'fountain', x: 320, y: 250 },
        { t: 'use', x: 320, y: 140, onUse: async L => {
          G.store.hearts = 3;
          G.ui.refresh();
          G.sfx('open');
          G.ui.tip(L.heroWho, 'Care Center: fully rested! 回復!', 2.5);
        } },
        { t: 'orb', x: 536, y: 344 },
        { t: 'chest', x: 568, y: 312, coins: 8 },
        { t: 'chest', x: 456, y: 220, coins: 5 },
        { t: 'chest', x: 176, y: 410, reward: 'cooler' },
        { t: 'chest', x: 570, y: 176, reward: 'arctis' },
        { t: 'gate', x: 320, y: 40, open: false },
        ...kinds.map(k => ({ t: 'critter', kind: k[0], x: k[1], y: k[2], r: 28 }))
      ],
      onGateBlocked: L => G.ui.tip(L.heroWho, 'The gate is sealed. Something glows on the east terrace.', 3.2),
      onOrb: async (L, e) => {
        cutscene();
        const h = L.hero;
        e.gone = true;
        G.sfx('power');
        await say(hero(L), 'A Capture Orb! 見て!');
        const z = { t: 'critter', kind: 'zipp', x: h.x + 70, y: h.y - 12, hx: h.x, hy: h.y, r: 0, wait: 99, hop: 0, hopT: 0, react: 9, tx: h.x, ty: h.y };
        L.ents.push(z);
        G.sfx('zap');
        L.parts.burst(z.x, z.y - 8, 14, '#6fd6ff', 90, 0.5);
        for (let i = 0; i < 40; i++) {
          await G.wait(0.02);
          z.x += (h.x + 16 - z.x) * 0.12;
          z.y += (h.y - z.y) * 0.12;
        }
        await say(hero(L), 'Whoa! Easy there, little spark!');
        for (let i = 0; i < 3; i++) {
          G.sfx('orb');
          await G.wait(0.7);
        }
        z.gone = true;
        L.parts.burst(h.x + 8, h.y - 8, 16, '#ffe27a', 90, 0.7);
        G.sfx('fanfare');
        G.companion.active = true;
        G.companion.kind = 'zipp';
        G.companion.reset();
        await say(hero(L), 'Zipp, you are with me now! よろしく!');
        const gate = L.ents.find(x => x.t === 'gate');
        gate.open = true;
        G.sfx('open');
        G.ui.toast('The north gate is open!');
        G.ui.objective('Go north through the gate');
        gameplay();
      },
      onExit: async L => {
        cutscene();
        G.ui.prompt(false);
        await say(hero(L), 'To the next world! 行こう!', { hold: 0.5 });
        await L.walkTo(L.hero.x, L.hero.y - 40, 50);
        G.setState('transition');
        G.completeLevel();
      }
    });
  }

  async function introL2(L) {
    const h = L.hero;
    cutscene();
    G.companion.active = false;
    G.ui.title(2, 'Critter Town', 'ようこそ');
    h.x = 72;
    h.y = 400;
    h.clip = { y: 362, below: false };
    h.ghost = true;
    const t = L.followTarget();
    L.cam.x = t.x;
    L.cam.y = t.y;
    await G.fadeTo(-1, 1.2);
    await G.wait(0.6);
    G.sfx('pipe');
    await L.walkTo(72, 352, 50);
    h.clip = null;
    L.hopNow();
    await L.walkTo(98, 380, 50);
    await L.walkTo(96, 428, 50);
    h.ghost = false;
    await say(hero(L), 'Landed on my feet! よし!');
    await say(hero(L), 'This looks like a friendly town. Let me look around.');
    gameplay();
    G.ui.showPlate(G.cfg.plateTime);
    G.ui.objective('Find the glowing Capture Orb on the east terrace. Space to use things.');
    let t0 = 0;
    while (!L.exiting) {
      await G.wait(1);
      t0++;
      if (t0 === 25 && !L.find) G.ui.tip(hero(L), 'This way! こっちだ!', 3);
    }
  }

  function L3() {
    return G.Maze({
      id: 3,
      seed: 7,
      tunnels: [7, 15],
      release: [0, 4, 8, 12],
      speedBonus: 0,
      fruitAt: [0.4, 0.75],
      rewards: ['strix', 'blackwidow'],
      bgColor: '#070a1e',
      floor: '#0b0f2a',
      wall: '#1d2f8f',
      wallIn: '#0f1a5c',
      edge: '#6f8cff',
      dot: '#ffe27a',
      onClear: async L => {
        G.ui.objective('The exit is open! Run to the top.');
        G.ui.toast('Exit opened!');
      },
      onExit: async L => {
        cutscene();
        await say(hero(L), 'Next stop! 次へ!', { hold: 0.5 });
        G.setState('transition');
        G.completeLevel();
      }
    });
  }

  async function introMaze(L, n, name, jp, lines) {
    cutscene();
    G.ui.title(n, name, jp);
    const mu = L.munch;
    mu.x = L.px(11);
    mu.y = L.py(19);
    mu.visible = true;
    mu.face = -1;
    L.hero.pose = 'idle';
    await G.fadeTo(-1, 1.2);
    await G.wait(0.5);
    const mw = { name: 'Munch', anchor: () => ({ x: mu.x - L.cam.x, y: mu.y - 6 - L.cam.y }) };
    for (const ln of lines) {
      if (ln.m) await say(mw, ln.m);
      else await say(hero(L), ln.h);
    }
    await L.munchTo(11, 21, 50);
    mu.visible = false;
    L.modeT = 0;
    gameplay();
    G.ui.objective('Eat every dot. Big dots scare the Wisps. Fruit is a bonus item!');
    G.ui.showPlate(5);
    while (!L.exiting) await G.wait(1);
  }

  function L4() {
    const g = mkGrid(30, 24);
    fill(g, 22, 23, 0, 29, '#');
    fill(g, 19, 19, 0, 27, 'T');
    fill(g, 16, 16, 2, 29, 'T');
    fill(g, 13, 13, 0, 27, 'T');
    fill(g, 10, 10, 2, 29, 'T');
    fill(g, 7, 7, 0, 27, 'T');
    const coins = [];
    row(coins, 200, 340, 3, 16);
    row(coins, 160, 292, 3, 16);
    row(coins, 300, 244, 3, 16);
    row(coins, 200, 196, 3, 16);
    row(coins, 300, 148, 3, 16);
    return G.Platformer({
      id: 4,
      theme: 'tower',
      bg: 'tower',
      cols: 30,
      rows: 24,
      grid: out(g),
      camY: 'follow',
      spawn: { x: 60, y: 352 },
      companion: true,
      ladders: [
        { x: 360, top: 304, bottom: 352 },
        { x: 104, top: 256, bottom: 304 },
        { x: 392, top: 208, bottom: 256 },
        { x: 120, top: 160, bottom: 208 },
        { x: 360, top: 112, bottom: 160 }
      ],
      tierDir: { 7: 1, 10: -1, 13: 1, 16: -1, 19: 1, 22: -1 },
      brute: { x: 64, y: 112 },
      barrelEvery: 3.4,
      checkpoints: [],
      entities: [
        { t: 'reward', id: 'poco', x: 72, y: 238 },
        { t: 'reward', id: 'r5', x: 380, y: 94 },
        { t: 'door', x: 420, y: 112, w: 28 },
        ...coins
      ],
      hooks: {
        drawBack(L, ctx, cx, cy) {
          G.art.bigDoor(ctx, 420 - cx, 112 - cy, L.time);
        }
      },
      onExit: async L => {
        cutscene();
        L.barrels.length = 0;
        L.barrelsOn = false;
        L.stopHero();
        await say(hero(L), 'Made it! You can calm down now, big guy.');
        await say({ name: 'Rivet', anchor: () => ({ x: 64 - L.cam.x, y: 50 - L.cam.y }) }, 'Hmph... fine. Go on. 行け!');
        G.setState('transition');
        G.completeLevel();
      }
    });
  }

  async function introL4(L) {
    cutscene();
    G.ui.title(4, 'Rivet Tower', '塔');
    L.cam.y = L.followTarget().y;
    await G.fadeTo(-1, 1.2);
    await G.wait(0.4);
    const t = L.followTarget();
    await L.panTo(0, 0, 1.6);
    const rw = { name: 'Rivet', anchor: () => ({ x: 64 - L.cam.x, y: 50 - L.cam.y }) };
    L.throwT = 0.8;
    await say(rw, 'GRAAAH! Nobody climbs my tower!');
    await L.panBack(1.2);
    await say(hero(L), 'I just want to find the princess!');
    gameplay();
    L.barrelsOn = true;
    G.ui.objective('Climb ladders with W and S. Jump barrels with Space. Reach the door at the top!');
    G.ui.showPlate(5);
    while (!L.exiting) await G.wait(1);
  }

  function buildHotel() {
    const g = mkGrid(30, 26, 'k');
    fill(g, 0, 0, 0, 29, 'x');
    fill(g, 1, 1, 0, 29, 'z');
    fill(g, 0, 25, 0, 0, 'x');
    fill(g, 0, 25, 29, 29, 'x');
    fill(g, 25, 25, 0, 29, 'x');
    fill(g, 2, 8, 9, 9, 'x');
    fill(g, 2, 8, 19, 19, 'x');
    fill(g, 9, 9, 1, 28, 'z');
    fill(g, 9, 9, 4, 5, 'k');
    fill(g, 9, 9, 13, 14, 'k');
    fill(g, 9, 9, 23, 24, 'k');
    fill(g, 2, 8, 20, 28, 'n');
    fill(g, 10, 12, 1, 28, 'e');
    fill(g, 13, 24, 1, 28, 'c');
    fill(g, 14, 22, 3, 8, 'e');
    return out(g);
  }

  function L5() {
    return G.TopDown({
      id: 5,
      cols: 30,
      rows: 26,
      tiles: buildHotel(),
      spawn: { x: 36, y: 262 },
      bgColor: '#14171a',
      dim: 'rgba(30,20,60,0.12)',
      entities: [
        { t: 'prop', kind: 'elevator', x: 32, y: 232, solid: { w: 28, h: 8 } },
        { t: 'npc', kind: 'concierge', label: 'Concierge', x: 110, y: 300, face: 1, solidH: 1 },
        { t: 'prop', kind: 'counter', x: 96, y: 316, w: 72, solid: { w: 72, h: 12 } },
        { t: 'prop', kind: 'plant', x: 200, y: 260, solid: { w: 10, h: 6 } },
        { t: 'prop', kind: 'plant', x: 424, y: 380, solid: { w: 10, h: 6 } },
        { t: 'prop', kind: 'lamp', x: 300, y: 272, solid: { w: 6, h: 4 } },
        { t: 'prop', kind: 'lamp', x: 380, y: 330, solid: { w: 6, h: 4 } },
        { t: 'prop', kind: 'bed', x: 44, y: 80, solid: { w: 28, h: 22 } },
        { t: 'prop', kind: 'tv', x: 120, y: 64, solid: { w: 16, h: 10 } },
        { t: 'prop', kind: 'desk', x: 92, y: 128, w: 40, solid: { w: 40, h: 8 } },
        { t: 'reward', id: 'swift', x: 92, y: 106 },
        { t: 'prop', kind: 'shelf', x: 190, y: 56, w: 40, solid: { w: 40, h: 20 } },
        { t: 'prop', kind: 'plant', x: 280, y: 60, solid: { w: 10, h: 6 } },
        { t: 'chest', x: 230, y: 120, reward: 'r5070' },
        { t: 'chest', x: 280, y: 130, coins: 6 },
        { t: 'prop', kind: 'table', x: 360, y: 100, solid: { w: 20, h: 8 } },
        { t: 'prop', kind: 'table', x: 410, y: 126, solid: { w: 20, h: 8 } },
        { t: 'prop', kind: 'counter', x: 440, y: 62, w: 64, solid: { w: 64, h: 14 } },
        { t: 'key', x: 440, y: 84 },
        { t: 'sign', x: 150, y: 220, text: 'Rooms and restaurant are to the north. 北へ!' },
        { t: 'exitdoor', x: 240, y: 398, w: 36, needsKey: true, lockedText: 'Locked! The key must be in the restaurant. 鍵!' }
      ],
      onKey: async L => {
        G.ui.tip(L.heroWho, 'Got the key! 鍵! Back to the main door!', 3);
        G.ui.objective('Take the key to the main door in the south');
        G.ui.toast('Room key found!');
      },
      onTalk: async (L, e) => {
        const prev = G.state;
        cutscene();
        await say(e.who, G.store.flags.key ? 'The door is yours now. Safe travels!' : 'The front door is locked. The key was left in the restaurant!');
        gameplay();
      },
      onExit: async L => {
        cutscene();
        G.ui.prompt(false);
        await say(hero(L), 'Thank you for the stay! ありがとう!', { hold: 0.6 });
        G.setState('transition');
        G.completeLevel();
      }
    });
  }

  async function introL5(L) {
    const h = L.hero;
    cutscene();
    G.ui.title(5, 'Moonlit Inn', 'ホテル');
    h.x = 32;
    h.y = 246;
    const t = L.followTarget();
    L.cam.x = t.x;
    L.cam.y = t.y;
    G.store.flags.key = false;
    await G.fadeTo(-1, 1.2);
    await G.wait(0.4);
    G.sfx('open');
    await L.walkTo(60, 272, 40);
    const c = L.ents.find(e => e.kind === 'concierge');
    await say(hero(L), 'A hotel? Maybe someone here has seen the princess. ここはホテル?');
    await say(c.who, 'Welcome! Sorry, the front door is locked tonight. The key was left in the restaurant.');
    gameplay();
    G.ui.showPlate(5);
    G.ui.objective('Find the room key in the restaurant (north-east)');
    while (!L.exiting) await G.wait(1);
  }

  function L6() {
    return G.Maze({
      id: 6,
      seed: 21,
      tunnels: [5, 17],
      release: [0, 3, 6, 9],
      speedBonus: 14,
      fruitAt: [0.35, 0.7],
      rewards: ['r4090', 'r9'],
      bgColor: '#12060f',
      floor: '#1a0a16',
      wall: '#8f1d6a',
      wallIn: '#5c0f3f',
      edge: '#ff6fc0',
      dot: '#ffd9a0',
      onClear: async L => {
        G.ui.objective('The exit is open! Run to the top.');
        G.ui.toast('Exit opened!');
      },
      onExit: async L => {
        cutscene();
        await say(hero(L), 'The castle is next! お城へ!', { hold: 0.5 });
        G.setState('transition');
        G.completeLevel();
      }
    });
  }

  function L7() {
    const g = mkGrid(120, 17);
    fill(g, 15, 16, 0, 119, '#');
    fill(g, 15, 16, 9, 40, 'V');
    [[10, 13], [16, 19], [22, 25], [28, 31], [34, 37]].forEach(p => fill(g, 14, 14, p[0], p[1], '='));
    fill(g, 15, 16, 52, 55, 'V');
    fill(g, 15, 16, 66, 69, 'V');
    fill(g, 12, 12, 50, 57, '=');
    fill(g, 12, 12, 64, 71, '=');
    fill(g, 7, 7, 56, 60, '=');
    fill(g, 11, 11, 42, 44, 'W');
    fill(g, 14, 14, 82, 84, 'H');
    fill(g, 13, 13, 83, 84, 'H');
    fill(g, 12, 12, 84, 84, 'H');
    const coins = [];
    row(coins, 170, 200, 3, 16);
    row(coins, 450, 200, 3, 16);
    row(coins, 810, 176, 4, 16);
    row(coins, 1040, 176, 4, 16);
    row(coins, 930, 96, 3, 16);
    row(coins, 1280, 220, 3, 16);
    const ents = [
      { t: 'geyser', x: 14 * 16 + 24, y: 240, period: 4.5, phase: 0, power: 330 },
      { t: 'geyser', x: 26 * 16 + 16, y: 240, period: 5.2, phase: 2, power: 340 },
      { t: 'geyser', x: 38 * 16 + 8, y: 240, period: 4.8, phase: 3.5, power: 330 },
      { t: 'walker', kind: 'ember', x: 45 * 16, y: 240, dir: -1 },
      { t: 'walker', kind: 'ember', x: 60 * 16, y: 240, dir: 1 },
      { t: 'walker', kind: 'ember', x: 74 * 16, y: 240, dir: -1 },
      { t: 'slab', x: 60 * 16, y0: 120, yFloor: 220, w: 28, h: 20 },
      { t: 'slab', x: 75 * 16, y0: 120, yFloor: 220, w: 28, h: 20 },
      { t: 'spring', x: 52 * 16 + 8, y: 192 },
      { t: 'reward', id: 'r5090', x: 58 * 16 + 8, y: 94 },
      { t: 'boss', x: 108 * 16, y: 240, x0: 90 * 16, x1: 116 * 16, trigger: 360 },
      ...coins
    ];
    return G.Platformer({
      id: 7,
      theme: 'castle',
      bg: 'castle',
      cols: 120,
      rows: 17,
      grid: out(g),
      spawn: { x: 40, y: 240 },
      checkpoints: [{ x: 300 }, { x: 700 }, { x: 1300 }],
      entities: ents,
      hooks: {
        drawMid(L, ctx, cx, cy) {
          const px = 1872 - cx;
          const py = 240 - cy;
          if (L.princessOn) {
            G.art.person(ctx, 'princess', px, py, L.princessPose || 'idle', L.time, -1, 'front');
          } else {
            G.art.person(ctx, 'princess', px, py, 'idle', L.time, -1, 'front');
            ctx.fillStyle = '#3a4046';
            for (let i = -14; i <= 14; i += 5) ctx.fillRect(px + i, py - 36, 2, 36);
            ctx.fillRect(px - 15, py - 38, 31, 3);
          }
        }
      }
    });
  }

  async function introL7(L) {
    const h = L.hero;
    cutscene();
    G.ui.title(7, 'Ember Castle', 'お城');
    G.companion.reset();
    await G.fadeTo(-1, 1.2);
    await G.wait(0.4);
    await say(hero(L), 'The castle of fire... The princess must be inside!');
    gameplay();
    G.ui.objective('Cross the lava bridge, survive the hall, face the Ember Tyrant!');
    L.onEvent('bossStart', async (L2, boss) => {
      cutscene();
      L2.stopHero();
      await say({ name: 'Ember Tyrant', anchor: () => ({ x: boss.x - L2.cam.x, y: boss.y - 54 - L2.cam.y }) }, 'ROOOAR! Who dares enter my castle?!');
      await say(hero(L2), 'Give back the princess! Jump on his head!');
      G.ui.objective('Jump on the Tyrant head 3 times! Dodge his fire.');
      gameplay();
    });
    L.onEvent('bossDown', async (L2, boss) => {
      cutscene();
      L2.stopHero();
      G.ui.objective('');
      L2.shake = 1;
      G.sfx('boom');
      await G.wait(1.8);
      await L2.walkTo(1820, 70);
      L2.cageOpen = true;
      L2.princessOn = true;
      G.sfx('open');
      const pw = { name: 'Princess', anchor: () => ({ x: 1872 - L2.cam.x, y: 200 - L2.cam.y }) };
      await say(pw, 'You did it! Thank you! ありがとう!');
      await say(hero(L2), 'Anyone would have done it. Are you okay?');
      await say(pw, 'I am. Please take the final prize, you earned it! やった!');
      L2.ents.push({
        t: 'reward',
        id: 'g9',
        x: 1790,
        y: 224,
        after: async () => {
          await G.wait(0.3);
          G.finish();
        }
      });
      gameplay();
      G.ui.objective('Take the final prize!');
    });
    while (!L.bossDown) await G.wait(1);
  }

  G.LEVELS = [
    { name: 'Green Plains', music: 'plains', make: L1, intro: introL1 },
    { name: 'Critter Town', music: 'town', make: L2, intro: introL2 },
    {
      name: 'Munch Maze',
      music: 'maze',
      make: L3,
      intro: L =>
        introMaze(L, 3, 'Munch Maze', 'めいろ', [
          { m: 'Hungry! おなかすいた! The Wisps took over my maze!' },
          { h: 'I will help! We clear every dot together.' },
          { m: 'Eat all the dots and the exit opens. Watch out!' }
        ])
    },
    { name: 'Rivet Tower', music: 'tower', make: L4, intro: introL4 },
    { name: 'Moonlit Inn', music: 'hotel', make: L5, intro: introL5 },
    {
      name: 'Neon Maze',
      music: 'maze2',
      make: L6,
      intro: L =>
        introMaze(L, 6, 'Neon Maze', 'めいろ 2', [
          { m: 'More Wisps! And they are faster now!' },
          { h: 'We can do it. がんばれ!' }
        ])
    },
    { name: 'Ember Castle', music: 'castle', make: L7, intro: introL7 }
  ];
})();
