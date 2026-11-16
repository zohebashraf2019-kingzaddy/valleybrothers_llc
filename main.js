/* Valley Brothers — scroll scenes & UI (no dependencies) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));           // 0..1 within [a,b]
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ---------- nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    links.classList.toggle('is-open', open);
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); }
  });
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- reveal + video autoplay ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { v.preload = 'auto'; const pr = v.play(); if (pr) pr.catch(() => {}); }
    else v.pause();
  }), { threshold: .25 });
  $$('video[data-autoplay]').forEach(v => vio.observe(v));

  /* ---------- scene progress helper ---------- */
  const scenes = $$('[data-scene]').map(el => ({ el, name: el.dataset.scene }));
  const progressOf = el => {
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  };

  /* ================= SCENE 1: crane load + truck drive ================= */
  const svg = $('#loadSvg'), crane = $('#crane'), boom = $('#boom'), boomInner = $('#boomInner'),
        spreader = $('#spreader'), box = $('#box'), boxLabel = $('#boxLabel'), rig = $('#rig'),
        panel = $('#loadPanel'), word = $('#outlineWord'), headline = $('#loadHeadline'),
        caption = $('#loadCaption');
  const GROUND = 560, PIVOT = { x: 90, y: -170 }, TIPX = 560;
  const craneWheels = $$('.wheel', crane).map(g => { const c = g.querySelector('circle'); return { g, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), r: +c.getAttribute('r') }; });
  const rigWheels = $$('.wheel', rig).map(g => { const c = g.querySelector('circle'); return { g, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), r: +c.getAttribute('r') }; });
  const spin = (wheels, dist) => wheels.forEach(w => w.g.setAttribute('transform', `rotate(${(dist / w.r) * 57.2958} ${w.cx} ${w.cy})`));

  const captions = [
    ['01 — Pick up', 'We pick up Conex boxes at the yard or port…'],
    ['02 — Load', '…load them on our gooseneck…'],
    ['03 — Deliver', '…and haul them anywhere in Northern Nevada.']
  ];
  let capIdx = -1;
  const setCaption = i => {
    if (i === capIdx) return; capIdx = i;
    caption.querySelector('.kicker').textContent = captions[i][0];
    caption.querySelector('p').textContent = captions[i][1];
    caption.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };

  function load(p) {
    // crane x and tip height
    const a = ease(seg(p, 0, .22)), b = ease(seg(p, .22, .34)), c = ease(seg(p, .34, .40)), d = ease(seg(p, .40, .54));
    const e = ease(seg(p, .48, .80));
    let cx = lerp(-260, 620, a);
    cx = lerp(cx, -1100, d);
    let ty = lerp(-434, -178, b);          // lowering onto deck
    ty = lerp(ty, -205, c);                // release / lift spreader
    const rdx = e * 2700;                  // rig drive distance

    // boom
    const dx = TIPX - PIVOT.x, dy = ty - PIVOT.y;
    const L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 57.2958;
    crane.setAttribute('transform', `translate(${cx} ${GROUND})`);
    boom.setAttribute('width', Math.min(L, 330));
    boom.setAttribute('transform', `translate(${PIVOT.x} ${PIVOT.y}) rotate(${ang})`);
    boomInner.setAttribute('width', L);
    boomInner.setAttribute('transform', `translate(${PIVOT.x} ${PIVOT.y}) rotate(${ang})`);
    spreader.setAttribute('transform', `translate(${TIPX} ${ty})`);
    spin(craneWheels, cx);

    // container: hangs from spreader until released, then rides the rig
    const hangTop = GROUND + ty + 8;
    const deckTop = GROUND - 55 - 115;      // 390
    const boxX = (p < .34 ? cx + TIPX - 240 : 620 + TIPX - 240) + rdx;
    const boxY = p < .34 ? hangTop : deckTop;
    box.setAttribute('x', boxX); box.setAttribute('y', boxY);
    boxLabel.setAttribute('x', boxX + 30); boxLabel.setAttribute('y', boxY + 66);

    rig.setAttribute('transform', `translate(${rdx} 0)`);
    spin(rigWheels, rdx);

    // camera: follow the action on narrower screens
    const w = svg.clientWidth || 1, h = svg.clientHeight || 1, asp = w / h;
    let vbW = 640 * asp, vbH = 640;
    const minW = innerWidth < 700 ? 820 : 1250;
    if (vbW < minW) { vbW = minW; vbH = vbW / asp; }
    let x0;
    if (vbW >= 2000) x0 = (2000 - vbW) / 2;
    else {
      const craneFocus = cx + TIPX;
      const rigFocus = 1450 + Math.min(rdx, 500);
      const focus = lerp(craneFocus, rigFocus, ease(seg(p, .36, .52)));
      x0 = clamp(focus - vbW / 2, -60, 2000 - vbW + 60);
    }
    svg.setAttribute('viewBox', `${x0.toFixed(1)} ${(640 - vbH).toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`);

    // captions
    setCaption(p < .22 ? 0 : p < .44 ? 1 : 2);
    caption.style.opacity = 1 - seg(p, .62, .7);

    // dark panel + outline word + headline
    const pp = easeOut(seg(p, .62, .8));
    panel.style.transform = `translateY(${(1 - pp) * 100}%)`;
    word.style.transform = `translateX(${lerp(40, -70, seg(p, .6, 1))}%)`;
    const hp = easeOut(seg(p, .8, .93));
    headline.style.opacity = hp;
    headline.style.transform = `translateY(${(1 - hp) * 40}px) rotate(${(1 - hp) * -3}deg)`;
  }

  /* ================= SCENE 2: road / process ================= */
  const roadPath = $('#roadPath'), topTruck = $('#topTruck'), ms = $$('#milestones li');
  const RL = roadPath.getTotalLength();
  function road(p) {
    const s = clamp(lerp(-150, RL - 120, p), 0, RL);
    const pt = roadPath.getPointAtLength(s);
    const pt2 = roadPath.getPointAtLength(clamp(s - 160, 0, RL));
    let ang = Math.atan2(pt.y - pt2.y, pt.x - pt2.x) * 57.2958;
    if (s < 160) ang = 0;
    const x = s <= 0 ? pt.x + lerp(-150, RL - 120, p) : pt.x;
    topTruck.setAttribute('transform', `translate(${x} ${pt.y}) rotate(${ang})`);
    const on = Math.floor(p * 4.6);
    ms.forEach((li, i) => li.classList.toggle('is-on', i <= on));
  }

  /* ================= SCENE 3: aerial ================= */
  const lanes = $('#aerialLanes'), aRig = $('#aerialRig'), beam = $('.aerial__beam'),
        aTitle = $('#aerialTitle'), feats = $$('#aerialFeats > div'), aerialEl = $('[data-scene="aerial"]');
  function aerial(p) {
    lanes.style.backgroundPosition = `0 ${(p * 2600).toFixed(0)}px`;
    const y = lerp(28, -10, p);              // vh drift upward
    aRig.style.transform = `translate(-50%, calc(-50% + ${y}vh))`;
    const rb = aRig.getBoundingClientRect(), sb = aerialEl.querySelector('.scene__sticky').getBoundingClientRect();
    beam.style.top = `${rb.top - sb.top - beam.offsetHeight + 10}px`;
    const t = easeOut(seg(p, .08, .3));
    aTitle.style.opacity = t;
    aTitle.style.transform = `scale(${lerp(.92, 1, t)}) translateY(${lerp(0, -4, seg(p, .45, .7))}vh)`;
    feats.forEach((f, i) => {
      const k = easeOut(seg(p, .42 + i * .07, .6 + i * .07));
      f.style.opacity = k; f.style.transform = `translateY(${(1 - k) * 30}px)`;
    });
  }

  const handlers = { load, road, aerial };
  let ticking = false;
  function frame() {
    ticking = false;
    nav.classList.toggle('is-solid', scrollY > 40);
    scenes.forEach(({ el, name }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      handlers[name](progressOf(el));
    });
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { scenes.forEach(({ el, name }) => handlers[name](progressOf(el))); req(); });
  scenes.forEach(({ el, name }) => handlers[name](progressOf(el)));
  frame();

  /* ---------- quote form → prefilled text message ---------- */
  const form = $('#quoteForm'), note = $('#formNote');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), phone = form.phone.value.trim();
    form.name.classList.toggle('is-bad', !name);
    form.phone.classList.toggle('is-bad', phone.replace(/\D/g, '').length < 7);
    if (!name || phone.replace(/\D/g, '').length < 7) { note.textContent = 'Please add your name and a phone number so we can reach you.'; return; }
    const needs = $$('input[name="need"]:checked', form).map(i => i.value).join(', ') || 'Not sure yet';
    const body = [
      `Hi Valley Brothers! Quote request from ${name} (${phone}).`,
      `Need: ${needs}`,
      form.where.value.trim() && `Location: ${form.where.value.trim()}`,
      form.when.value.trim() && `When: ${form.when.value.trim()}`,
      form.msg.value.trim() && `Details: ${form.msg.value.trim()}`
    ].filter(Boolean).join('\n');
    note.textContent = 'Opening your messages app… If nothing opens, call or text (775) 857-0312.';
    location.href = `sms:+17758570312?&body=${encodeURIComponent(body)}`;
  });
})();
