(function () {
  const modal = document.getElementById('modal');
  const mm = document.getElementById('modal-model');
  const buy = document.getElementById('modal-buy');
  const cartBtn = document.getElementById('cart-btn');
  const count = document.getElementById('cart-count');
  const drawer = document.getElementById('drawer');
  const list = document.getElementById('drawer-list');
  const total = document.getElementById('drawer-total');
  const items = [];
  let open = -1;

  const money = n => '$' + n.toLocaleString('en-US');

  DS.openProduct = function (k) {
    const s = DS.scenes[k];
    open = k;
    mm.setAttribute('exposure', '1');
    mm.setAttribute('src', 'assets/models/' + s.model.src);
    document.getElementById('modal-jp').textContent = s.jp;
    document.getElementById('modal-name').textContent = s.model.name;
    document.getElementById('modal-desc').textContent = s.model.desc;
    document.getElementById('modal-price').textContent = money(s.model.price);
    modal.dataset.theme = s.weather;
    modal.style.setProperty('--mscene', 'url("' + new URL('assets/img/' + s.bg + '.webp', location.href).href + '")');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    DS.paused = true;
    document.querySelectorAll('.device').forEach(d => d.removeAttribute('auto-rotate'));
  };

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    mm.removeAttribute('src');
    open = -1;
    document.documentElement.classList.remove('modal-open');
    DS.paused = false;
    document.querySelectorAll('.device').forEach(d => d.setAttribute('auto-rotate', ''));
  }

  function render() {
    count.textContent = items.length;
    list.innerHTML = '';
    let sum = 0;
    items.forEach((it, i) => {
      sum += it.price;
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = it.name;
      const price = document.createElement('b');
      price.textContent = money(it.price);
      const rm = document.createElement('button');
      rm.className = 'plain';
      rm.textContent = 'Remove';
      rm.addEventListener('click', () => {
        items.splice(i, 1);
        render();
      });
      li.append(name, price, rm);
      list.appendChild(li);
    });
    total.textContent = money(sum);
  }

  function fly(from) {
    const a = from.getBoundingClientRect();
    const b = cartBtn.getBoundingClientRect();
    const st = document.createElement('div');
    st.className = 'stamp';
    st.textContent = '購';
    document.body.appendChild(st);
    const sx = a.left + a.width / 2 - 28;
    const sy = a.top + a.height / 2 - 28;
    const dx = b.left + b.width / 2 - 28 - sx;
    const dy = b.top + b.height / 2 - 28 - sy;
    gsap.set(st, { x: sx, y: sy });
    gsap.to(st, { x: sx + dx, duration: 0.95, ease: 'power1.in' });
    gsap.to(st, {
      keyframes: [
        { y: sy - 150, duration: 0.4, ease: 'power2.out' },
        { y: sy + dy, duration: 0.55, ease: 'power2.in' }
      ],
      onComplete: () => {
        st.remove();
        gsap.fromTo(cartBtn, { scale: 1.18 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' });
      }
    });
    gsap.to(st, { scale: 0.45, duration: 0.95, ease: 'power1.in' });
  }

  buy.addEventListener('click', () => {
    if (open < 0) return;
    const m = DS.scenes[open].model;
    items.push({ name: m.name, price: m.price });
    fly(buy);
    setTimeout(render, 900);
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      drawer.classList.remove('open');
    }
  });

  cartBtn.addEventListener('click', () => {
    drawer.classList.toggle('open');
    drawer.setAttribute('aria-hidden', drawer.classList.contains('open') ? 'false' : 'true');
  });
  document.getElementById('drawer-close').addEventListener('click', () => drawer.classList.remove('open'));
  document.getElementById('drawer-clear').addEventListener('click', () => {
    items.length = 0;
    render();
  });
  render();
})();
