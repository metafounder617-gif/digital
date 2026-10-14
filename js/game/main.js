(function () {
  const G = window.G;
  let started = false;

  function resetStore() {
    const cart = G.store.cart;
    G.store = { coins: 0, secrets: 0, hearts: 3, rewards: {}, cart, flags: {} };
  }

  G.startLevel = function (i) {
    const lv = G.LEVELS[i];
    G.levelIndex = i;
    if (G.level && G.level.destroy) G.level.destroy();
    G.ui.reset();
    G.store.hearts = 3;
    G.store.flags.key = false;
    G.companion.reset();
    const L = lv.make();
    G.level = L;
    const t = L.followTarget();
    L.cam.x = t.x;
    L.cam.y = t.y;
    G.fadeReset(1);
    G.forceState('cutscene');
    G.audio.music(lv.music);
    G.ui.refresh();
    G.run(() => lv.intro(L));
  };

  G.completeLevel = function () {
    G.run(async () => {
      G.setState('transition');
      await G.fadeTo(1, 1.1);
      const n = G.levelIndex + 1;
      if (n >= G.LEVELS.length) G.finish();
      else G.startLevel(n);
    });
  };

  G.finish = function () {
    G.run(async () => {
      G.forceState('cutscene');
      G.sfx('fanfare');
      G.audio.music('title');
      G.ui.objective('');
      G.ui.prompt(false);
      await G.wait(0.6);
      G.ui.ending();
    });
  };

  G.restart = function () {
    G.cancelAll();
    G.fadeReset(1);
    resetStore();
    G.companion.active = false;
    G.startLevel(0);
  };

  G.goto = function (n) {
    G.cancelAll();
    G.fadeReset(1);
    G.startLevel(G.clamp(n - 1, 0, G.LEVELS.length - 1));
  };

  function begin() {
    if (started) return;
    started = true;
    document.getElementById('title-screen').classList.add('off');
    G.audio.unlock();
    const q = new URLSearchParams(location.search).get('level');
    G.startLevel(q ? G.clamp(parseInt(q, 10) - 1, 0, G.LEVELS.length - 1) : 0);
  }

  document.addEventListener('DOMContentLoaded', () => {});
  G.bindInput();
  G.initUI();
  G.art.loadCustom();
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('.hud button')) e.target.blur();
  });
  document.getElementById('start-btn').addEventListener('click', begin);
  window.addEventListener('keydown', e => {
    if (!started && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      begin();
    }
  });
  G.audio.music('title');
  requestAnimationFrame(G.frame);
  window.__G = G;
})();
