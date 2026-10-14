(function () {
  const modal = document.getElementById('modal');
  const drawer = document.getElementById('drawer');
  const buy = document.getElementById('modal-buy');
  let motion = true;
  document.addEventListener('motionchange', e => { motion = e.detail; });

  function group(host, area) {
    const lamps = Array.from(area.querySelectorAll('.lamp')).map((el, i) => ({ el, a: 0, v: 0, ph: i * 2.1 }));
    let last = null;
    let raf = 0;
    let t0 = 0;

    function kick(x, y, dx, power) {
      lamps.forEach(l => {
        const r = l.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.55;
        const ax = Math.abs(x - cx);
        const ay = Math.abs(y - cy);
        if (ax < r.width * 1.8 && ay < r.height * 0.75) {
          const f = (1 - ax / (r.width * 1.8)) * (1 - ay / (r.height * 0.75));
          const dv = Math.max(-60, Math.min(60, dx)) * power * f;
          l.v += dv;
          if (Math.abs(dv) > 4) document.dispatchEvent(new CustomEvent('lampknock', { detail: { strength: Math.abs(dv) / 30, x: cx / innerWidth } }));
        }
      });
    }

    area.addEventListener('pointermove', e => {
      if (!motion) return;
      if (last !== null) kick(e.clientX, e.clientY, e.clientX - last, 1.1);
      last = e.clientX;
    });
    area.addEventListener('pointerleave', () => { last = null; });
    area.addEventListener('pointerdown', e => {
      if (!motion) return;
      lamps.forEach(l => {
        const r = l.el.getBoundingClientRect();
        if (Math.abs(e.clientX - (r.left + r.width / 2)) < r.width * 1.4 && Math.abs(e.clientY - (r.top + r.height / 2)) < r.height) {
          l.v += (e.clientX < r.left + r.width / 2 ? 1 : -1) * 38;
          document.dispatchEvent(new CustomEvent('lampknock', { detail: { strength: 1, x: (r.left + r.width / 2) / innerWidth } }));
        }
      });
    });

    function step(now) {
      const dt = Math.min(0.033, (now - (t0 || now)) / 1000);
      t0 = now;
      const t = now / 1000;
      lamps.forEach(l => {
        const wind = Math.sin(t * 0.8 + l.ph) * 3 + Math.sin(t * 1.7 + l.ph * 2) * 1.2;
        l.v += (-26 * l.a - 2.1 * l.v + wind) * dt;
        l.a += l.v * dt;
        l.el.style.transform = 'rotate(' + l.a.toFixed(2) + 'deg)';
      });
      raf = host.isOpen() && motion ? requestAnimationFrame(step) : 0;
    }

    return {
      start() {
        if (!raf && motion) { t0 = 0; raf = requestAnimationFrame(step); }
      }
    };
  }

  const mv = group({ isOpen: () => modal.classList.contains('open') }, modal.querySelector('.modal-view'));
  new MutationObserver(() => { if (modal.classList.contains('open')) mv.start(); })
    .observe(modal, { attributes: true, attributeFilter: ['class'] });

  const petals = Array.from({ length: 5 }, (_, i) => 'assets/img/ui/petal' + (i + 1) + '.webp');
  const imgs = petals.map(src => { const im = new Image(); im.src = src; return im; });
  let live = 0;

  function bindBuy(btn) {
    let timer = 0;
    function drop() {
      if (live >= 7 || !motion) return;
      const r = btn.getBoundingClientRect();
      const b = btn.querySelector('.buy-branch').getBoundingClientRect();
      const el = imgs[(Math.random() * imgs.length) | 0].cloneNode();
      el.className = 'petal';
      el.style.width = (14 + Math.random() * 10) + 'px';
      document.body.appendChild(el);
      const x0 = b.left + b.width * (0.4 + Math.random() * 0.55);
      const y0 = b.top + b.height * (0.35 + Math.random() * 0.4);
      const fall = r.bottom - y0 + 60 + Math.random() * 60;
      const sway = (Math.random() - 0.5) * 90;
      const rot = (Math.random() - 0.5) * 540;
      const dur = 2200 + Math.random() * 1400;
      live++;
      const an = el.animate([
        { transform: `translate(${x0}px, ${y0}px) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${x0 + sway * 0.3}px, ${y0 + fall * 0.15}px) rotate(${rot * 0.2}deg)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${x0 + sway}px, ${y0 + fall * 0.55}px) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x0 + sway * 0.4}px, ${y0 + fall}px) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: dur, easing: 'cubic-bezier(0.35, 0.1, 0.65, 0.9)' });
      an.onfinish = () => { el.remove(); live--; };
    }
    btn.addEventListener('pointerenter', () => {
      drop();
      clearInterval(timer);
      timer = setInterval(drop, 380);
    });
    btn.addEventListener('pointerleave', () => clearInterval(timer));
  }
  document.querySelectorAll('.buy').forEach(bindBuy);

  const dg = group({ isOpen: () => drawer.classList.contains('open') }, drawer);
  new MutationObserver(() => { if (drawer.classList.contains('open')) dg.start(); })
    .observe(drawer, { attributes: true, attributeFilter: ['class'] });
})();
