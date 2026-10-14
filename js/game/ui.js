(function () {
  const G = window.G;
  const $ = id => document.getElementById(id);
  const money = n => '$' + n.toLocaleString('en-US');

  const el = {
    bubbles: $('bubbles'),
    prompt: $('prompt'),
    hearts: $('hearts'),
    items: $('items-count'),
    objective: $('objective'),
    plate: $('plate'),
    plateBar: $('plate-bar'),
    card: $('title-card'),
    toast: $('toast'),
    coin: $('coin-count'),
    secret: $('secret-count'),
    cartCount: $('cart-count'),
    modal: $('reward-modal'),
    model: $('reward-model'),
    icon: $('reward-icon'),
    drawer: $('drawer'),
    list: $('drawer-list'),
    total: $('drawer-total'),
    end: $('end'),
    title: $('title-screen')
  };

  const active = [];
  let plate = null;
  let rewardDone = null;
  let rewardCur = null;
  let modalOpen = false;
  let drawerOpen = false;
  let promptShown = false;

  function place(node, ax, ay, dy) {
    const s = G.scale;
    const vw = G.view.clientWidth;
    let x = ax * s;
    const half = node.offsetWidth / 2 + 12;
    x = G.clamp(x, half, vw - half);
    node.style.left = x + 'px';
    node.style.top = Math.max(node.offsetHeight + 80, ay * s + (dy || 0)) + 'px';
  }

  function makeBubble(who, text, opts) {
    const node = document.createElement('div');
    node.className = 'bubble' + (opts.tip ? ' tip' : '');
    if (who.name) {
      const w = document.createElement('span');
      w.className = 'who';
      w.textContent = who.name;
      node.appendChild(w);
    }
    const p = document.createElement('p');
    node.appendChild(p);
    el.bubbles.appendChild(node);
    const b = {
      node,
      p,
      who,
      text,
      n: 0,
      t: 0,
      hold: opts.hold !== undefined ? opts.hold : Math.max(1.2, text.length * 0.045 + 0.5),
      done: false,
      out: 0,
      tip: !!opts.tip,
      speed: opts.speed || 42,
      skip: false,
      blip: 0
    };
    p.textContent = '';
    node.style.visibility = 'hidden';
    return b;
  }

  function updateBubbles(dt) {
    for (let i = active.length - 1; i >= 0; i--) {
      const b = active[i];
      if (b.out > 0) {
        b.out -= dt;
        if (b.out <= 0) {
          b.node.remove();
          active.splice(i, 1);
        }
        continue;
      }
      if (b.n < b.text.length) {
        if (b.skip) b.n = b.text.length;
        else {
          const before = Math.floor(b.n);
          b.n = Math.min(b.text.length, b.n + dt * b.speed);
          if (Math.floor(b.n / 3) > Math.floor(before / 3)) G.sfx('blip');
        }
        b.p.textContent = b.text.slice(0, Math.floor(b.n));
      } else {
        b.t += dt;
        if (b.skip || b.t >= b.hold) {
          b.done = true;
          b.node.classList.add('out');
          b.out = 0.22;
        }
      }
      const a = b.who.anchor ? b.who.anchor() : { x: 240, y: 120 };
      b.node.style.visibility = 'visible';
      place(b.node, a.x, a.y - 22, -12);
    }
  }

  const ui = (G.ui = {
    say(who, text, opts) {
      const b = makeBubble(who, text, opts || {});
      active.push(b);
      return G.until(() => b.done);
    },
    tip(who, text, hold) {
      const b = makeBubble(who, text, { tip: true, hold: hold || 2.4 });
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].tip && active[i].who === who) {
          active[i].node.remove();
          active.splice(i, 1);
        }
      }
      active.push(b);
      return b;
    },
    skipBubble() {
      const b = active.find(x => !x.done && x.out <= 0);
      if (b) b.skip = true;
    },
    prompt(show, ax, ay, label) {
      if (!show) {
        if (promptShown) {
          el.prompt.style.display = 'none';
          promptShown = false;
        }
        return;
      }
      if (!promptShown) {
        el.prompt.style.display = 'block';
        promptShown = true;
      }
      if (el.prompt.textContent !== label) el.prompt.textContent = label;
      el.prompt.style.left = ax * G.scale + 'px';
      el.prompt.style.top = ay * G.scale + 'px';
    },
    showPlate(seconds) {
      el.plate.classList.add('on');
      plate = { t: 0, max: seconds };
      return G.until(() => !plate);
    },
    hidePlate() {
      el.plate.classList.remove('on');
      plate = null;
    },
    objective(text) {
      if (!text) {
        el.objective.classList.remove('on');
        return;
      }
      el.objective.textContent = text;
      el.objective.classList.add('on');
    },
    title(n, name, jp) {
      $('tc-num').textContent = 'World ' + n;
      $('tc-name').textContent = name;
      $('tc-jp').textContent = jp;
      el.card.classList.remove('on');
      void el.card.offsetWidth;
      el.card.classList.add('on');
    },
    toast(text) {
      el.toast.textContent = text;
      el.toast.classList.remove('on');
      void el.toast.offsetWidth;
      el.toast.classList.add('on');
    },
    refresh() {
      const st = G.store;
      el.coin.textContent = '×' + String(st.coins).padStart(2, '0');
      el.secret.textContent = st.secrets + '/2';
      el.cartCount.textContent = st.cart.length;
      const have = Object.keys(st.rewards).length;
      el.items.textContent = have + '/' + G.REWARDS.length;
      [...el.hearts.children].forEach((h, i) => h.classList.toggle('off', i >= st.hearts));
    },
    reset() {
      active.splice(0).forEach(b => b.node.remove());
      ui.hidePlate();
      ui.prompt(false);
      ui.objective('');
      el.card.classList.remove('on');
      el.toast.classList.remove('on');
      closeModalSilent();
      closeDrawer();
      el.end.classList.remove('on');
      ui.refresh();
    },
    reward(id) {
      const r = G.rewardById[id];
      if (!r || G.store.rewards[id]) return Promise.resolve();
      G.store.rewards[id] = true;
      G.sfx('fanfare');
      ui.refresh();
      return new Promise(res => {
        rewardDone = res;
        rewardCur = r;
        $('reward-jp').textContent = r.jp;
        $('reward-name').textContent = r.name;
        $('reward-desc').textContent = r.desc;
        $('reward-price').textContent = money(r.price);
        const mv = el.model;
        const hasMV = !!window.customElements.get('model-viewer');
        if (hasMV) {
          mv.style.display = '';
          el.icon.style.display = 'none';
          mv.setAttribute('src', 'assets/models/gaming/' + r.model);
        } else {
          mv.style.display = 'none';
          el.icon.style.display = 'block';
          const c = el.icon.getContext('2d');
          c.imageSmoothingEnabled = false;
          c.clearRect(0, 0, 48, 48);
          G.art.rewardIcon(c, r.kind, 24, 24, 0, r.tint, true);
        }
        $('reward-add').disabled = G.store.cart.some(c => c.id === id);
        $('reward-add').textContent = $('reward-add').disabled ? 'In cart' : 'Add to cart';
        el.modal.classList.add('open');
        el.modal.setAttribute('aria-hidden', 'false');
        modalOpen = true;
        G.pause();
      });
    },
    ending() {
      const have = G.REWARDS.filter(r => G.store.rewards[r.id]);
      $('end-sub').textContent = 'You found ' + have.length + ' of ' + G.REWARDS.length + ' items and ' + G.store.coins + ' coins.';
      const list = $('end-list');
      list.innerHTML = '';
      G.REWARDS.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r.name;
        if (!G.store.rewards[r.id]) li.className = 'no';
        list.appendChild(li);
      });
      el.end.classList.add('on');
    },
    update(dt) {
      updateBubbles(dt);
      if (plate) {
        plate.t += dt;
        el.plateBar.style.width = Math.max(0, 100 - (plate.t / plate.max) * 100) + '%';
        if (plate.t >= plate.max) {
          el.plate.classList.remove('on');
          plate = null;
        }
      }
      if (el.plate.classList.contains('on')) {
        el.plate.querySelectorAll('.k').forEach(k => k.classList.toggle('on', G.input.down.has(k.dataset.k)));
      }
    },
    updatePaused() {
      if (el.plate.classList.contains('on')) {
        el.plate.querySelectorAll('.k').forEach(k => k.classList.toggle('on', false));
      }
    }
  });

  function closeModalSilent() {
    if (!modalOpen) return;
    el.modal.classList.remove('open');
    el.modal.setAttribute('aria-hidden', 'true');
    el.model.removeAttribute('src');
    modalOpen = false;
    const d = rewardDone;
    rewardDone = null;
    rewardCur = null;
    if (d) d();
  }

  function closeModal() {
    if (!modalOpen) return;
    closeModalSilent();
    G.resume();
  }

  function openDrawer() {
    drawerOpen = true;
    el.drawer.classList.add('open');
    el.drawer.setAttribute('aria-hidden', 'false');
    G.pause();
    renderCart();
  }

  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;
    el.drawer.classList.remove('open');
    el.drawer.setAttribute('aria-hidden', 'true');
    G.resume();
  }

  function renderCart() {
    el.list.innerHTML = '';
    let sum = 0;
    if (!G.store.cart.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Your cart is empty. Find items in the game worlds.';
      el.list.appendChild(li);
    }
    G.store.cart.forEach((it, i) => {
      sum += it.price;
      const li = document.createElement('li');
      const n = document.createElement('span');
      n.textContent = it.name;
      const p = document.createElement('b');
      p.textContent = money(it.price);
      p.style.fontWeight = '400';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = 'Remove';
      rm.addEventListener('click', () => {
        G.store.cart.splice(i, 1);
        renderCart();
        ui.refresh();
      });
      li.append(n, p, rm);
      el.list.appendChild(li);
    });
    el.total.textContent = money(sum);
  }

  function addToCart(r) {
    if (G.store.cart.some(c => c.id === r.id)) return;
    G.store.cart.push({ id: r.id, name: r.name, price: r.price });
    G.sfx('coin');
    ui.refresh();
  }

  G.initUI = function () {
    $('reward-close').addEventListener('click', closeModal);
    $('reward-add').addEventListener('click', () => {
      if (rewardCur) {
        addToCart(rewardCur);
        $('reward-add').disabled = true;
        $('reward-add').textContent = 'In cart';
      }
    });
    $('cart-btn').addEventListener('click', () => {
      if (modalOpen) return;
      if (drawerOpen) closeDrawer();
      else openDrawer();
    });
    $('drawer-close').addEventListener('click', closeDrawer);
    $('drawer-clear').addEventListener('click', () => {
      G.store.cart.length = 0;
      renderCart();
      ui.refresh();
    });
    $('drawer-pay').addEventListener('click', () => {
      ui.toast('Demo only');
      G.sfx('click');
    });
    $('end-add').addEventListener('click', () => {
      G.REWARDS.forEach(r => {
        if (G.store.rewards[r.id]) addToCart(r);
      });
      ui.toast('Added to cart');
    });
    $('end-again').addEventListener('click', () => G.restart());
    $('sound-toggle').addEventListener('click', () => {
      const on = G.audio.toggle();
      $('sound-toggle').setAttribute('aria-pressed', on ? 'true' : 'false');
      G.audio.unlock();
    });
    $('sound-toggle').setAttribute('aria-pressed', G.audio.isOn() ? 'true' : 'false');
    $('motion-toggle').addEventListener('click', () => {
      G.motion = !G.motion;
      $('motion-toggle').setAttribute('aria-pressed', G.motion ? 'true' : 'false');
    });
    $('restart-btn').addEventListener('click', () => G.restart());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (modalOpen) closeModal();
        else if (drawerOpen) closeDrawer();
      }
      if (e.key === 'Enter' && G.state !== 'paused') ui.skipBubble();
    });
    G.view.addEventListener('click', () => ui.skipBubble());
    ui.refresh();
  };
})();
