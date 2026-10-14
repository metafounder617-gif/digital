(function () {
  const hero = document.getElementById('hero');
  const box = document.querySelector('.hero-text');
  const title = document.getElementById('hero-title');
  const desc = document.getElementById('hero-desc');
  const frames = Array.from(document.querySelectorAll('#tide .tide-img'));
  const N = frames.length;
  const texts = [
    ['温故知新', '故きを温ねて新しきを知る'],
    ['一期一会', '一生に一度の出会い'],
    ['初心忘るべからず', '初心を忘れてはならない']
  ];
  let idx = 0;
  let tl = null;
  let inView = true;
  let motion = true;
  const st = { p: 0 };
  const shown = new Array(N).fill(-1);

  function paint() {
    const p = ((st.p % N) + N) % N;
    for (let i = 0; i < N; i++) {
      let d = Math.abs(p - i);
      if (d > N / 2) d = N - d;
      const o = d >= 1 ? 0 : 1 - d;
      const v = Math.round(o * 1000) / 1000;
      if (v !== shown[i]) {
        shown[i] = v;
        frames[i].style.opacity = v;
      }
    }
  }

  function rest() {
    st.p = 0;
    paint();
    gsap.set(box, { opacity: 1, filter: 'blur(0px)' });
  }

  function sync() {
    if (!tl) return;
    tl.paused(!(inView && motion));
  }

  function swapText() {
    idx = (idx + 1) % texts.length;
    title.textContent = texts[idx][0];
    desc.textContent = texts[idx][1];
  }

  function build() {
    if (tl) tl.kill();
    rest();
    tl = gsap.timeline({ repeat: -1 });
    tl.to({}, { duration: 4 })
      .to(st, { p: 1, duration: 1.1, ease: 'sine.in', onUpdate: paint })
      .to(st, { p: 4.2, duration: 2.6, ease: 'power1.inOut', onUpdate: paint })
      .to(box, { opacity: 0, filter: 'blur(12px)', duration: 1.2, ease: 'power1.in' }, '-=1.4')
      .to(st, { p: 5, duration: 1.1, ease: 'power2.out', onUpdate: paint })
      .add(swapText)
      .to({}, { duration: 0.6 })
      .to(st, { p: 7, duration: 3.4, ease: 'power1.inOut', onUpdate: paint })
      .to(box, { opacity: 1, filter: 'blur(0px)', duration: 2.2, ease: 'power1.out' }, '-=2.2')
      .to(st, { p: 9, duration: 2.8, ease: 'sine.inOut', onUpdate: paint })
      .to(st, { p: 10, duration: 2.4, ease: 'sine.inOut', onUpdate: paint })
      .add(() => { st.p = 0; paint(); });
    sync();
  }

  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    sync();
  }).observe(hero);

  document.addEventListener('motionchange', e => {
    motion = e.detail;
    if (!motion) {
      if (tl) tl.kill();
      tl = null;
      rest();
    } else {
      build();
    }
  });

  build();
})();
