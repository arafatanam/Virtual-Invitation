/* Hamza & Tahia — concept 2 engine.
   A stack of full-screen snap points, one per scene. Native scroll + scroll-snap decides WHICH scene you
   are on; the picture then glides there on its own clock (dp follows the scroll position smoothly),
   so one swipe always plays one whole, clean transition.
   The paintings are 1536 × 2752 portraits; positions below are fractions of that frame. */
(() => {
'use strict';
const el = id => document.getElementById(id);
const SETTLE = location.hash.startsWith('#settle');
const FORCE = (location.hash.match(/dp=([\d.]+)/) || [])[1];
if (SETTLE) document.documentElement.classList.add('settle');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const ein = t => t * t * t;
const rand = (a, b) => a + Math.random() * (b - a);
const N = 9;   // gate, lane-day, lane-night, room, river, ghat, arch, celebrations, finale
const IW = 1536, IH = 2752;

/* ---------- music: santoor-like melody in a Yaman colour over a tanpura drone and a soft dadra ---------- */
const SC = [62, 64, 66, 68, 69, 71, 73, 74, 76, 78, 81, 83];
const MEL = { 0: 9, 2: 8, 3: 7, 4: 8, 6: 6, 8: 7, 12: 5, 16: 4, 18: 5, 19: 6, 20: 7, 22: 6, 24: 5, 28: 4, 32: 9, 34: 10, 36: 9, 38: 8, 40: 7, 42: 8, 44: 6, 48: 5, 50: 4, 51: 3, 52: 4, 54: 2, 56: 0 };
const music = createMusic({ spb: .27, reverb: .6, volume: .8, fadeIn: 3, play(step, t, tone, noise, pluck) {
  if (step % 4 === 0) pluck([57, 62, 62, 50][(step >> 2) % 4], t, { vol: .07, buzz: .5, bright: .4, dur: 2.6 });
  const k = step % 6;
  if (k === 0) tone(45, t, { dur: .5, vol: .1, slide: 4 });
  if (k === 3) tone(50, t, { dur: .4, vol: .06, slide: 3 });
  if (k === 2 || k === 5) tone(77, t, { dur: .1, vol: .018, partials: [[1, 1], [2.02, .4]] });
  const m = MEL[step % 64];
  if (m != null) { pluck(SC[m], t, { vol: .11, bright: .85, dur: 1.6 }); pluck(SC[m], t + .07, { vol: .05, bright: .8, dur: 1.2 }); }
  if (step % 16 === 0) tone(SC[[0, 4, 5, 2][(step >> 4) % 4]] - 12, t, { type: 'triangle', dur: 4, vol: .014, attack: 1, sustain: true, cutoff: 800 });
}});
const musicBtn = el('music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.textContent = on ? 'Pause music' : 'Play music'; });
const chime = () => music.sfx((t, tone, noise, pluck) => { [74, 78, 81, 86].forEach((m, i) => pluck(m, t + i * .08, { vol: .06, bright: .9, dur: 1.6 })); });
const rustle = () => music.sfx((t, tone, noise) => { for (let i = 0; i < 10; i++) noise(t + i * .05, { dur: .12, vol: .02, freq: 2500 + i * 200, type: 'bandpass', q: 1 }); });

/* ---------- snap track ---------- */
const track = el('track');
for (let i = 0; i < N; i++) track.appendChild(document.createElement('div'));
const secH = () => track.firstElementChild.offsetHeight || innerHeight;
let opened = false;
const target = () => FORCE != null ? +FORCE : opened ? clamp(scrollY / secH(), 0, N - 1) : 0;
const go = k => scrollTo({ top: k * secH(), behavior: SETTLE || reduce ? 'auto' : 'smooth' });
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
const openBtn = el('open');
openBtn.addEventListener('click', () => {
  if (opened) return; opened = true;
  document.body.classList.remove('locked'); music.start(); musicBtn.hidden = false;
  setTimeout(() => go(1), 60);
});
// enable the button once the first scenes are decoded (the rest keep loading behind the story)
const first = [...document.querySelectorAll('#s-lane img')];
Promise.race([Promise.all(first.map(i => i.decode ? i.decode().catch(() => {}) : 0)), new Promise(r => setTimeout(r, SETTLE ? 0 : 4000))])
  .then(() => { openBtn.disabled = false; openBtn.textContent = 'Open the invitation'; });

/* ---------- geometry: map the painting onto the screen (same as object-fit: cover) ---------- */
let Wd, Hd, S, OX, OY, U;
const PX = f => OX + f * IW * S, PY = f => OY + f * IH * S;
const cardWrap = el('cardWrap'), CARD = { x: .6, bottom: .565, w: .28 };
const boat = el('boat'), walkers = el('walkers');
const fx = el('fx'), g = fx.getContext('2d'), FXR = Math.min(devicePixelRatio || 1, 1.5);
function layout() {
  Wd = innerWidth; Hd = innerHeight; S = Math.max(Wd / IW, Hd / IH); OX = (Wd - IW * S) / 2; OY = (Hd - IH * S) / 2;
  U = CARD.w * IW * S / 136;
  document.documentElement.style.setProperty('--u', U + 'px');
  cardWrap.style.left = PX(CARD.x) + 'px'; cardWrap.style.top = (PY(CARD.bottom) - 178 * U) + 'px';
  fx.width = Math.round(Wd * FXR); fx.height = Math.round(Hd * FXR);
}
layout(); addEventListener('resize', layout);
// place a sprite: centre (fxp, fyp) in painting fractions, height as a fraction of the painting height
function sprite(img, fxp, fyp, hf, rot = 0) {
  if (!img.naturalWidth) return;
  const h = hf * IH * S, w = h * img.naturalWidth / img.naturalHeight;
  img.style.width = w + 'px'; img.style.height = h + 'px';
  img.style.transformOrigin = `${w / 2}px ${h / 2}px`;
  img.style.transform = `translate(${PX(fxp) - w / 2}px, ${PY(fyp) - h / 2}px) rotate(${rot}deg)`;
}

/* ---------- light effects: stars, fireflies, water glitter, dust motes, rose petals ---------- */
const mk = (n, f) => Array.from({ length: n }, f);
const STARS = mk(46, () => ({ x: rand(.3, .72), y: rand(.02, .3), r: rand(.6, 1.6), ph: rand(0, 6.3), sp: rand(1, 2.5) }));
const FIRE = mk(26, () => ({ x: rand(.05, .95), y: rand(.35, .95), ph: rand(0, 6.3), sp: rand(.2, .5), r: rand(1.5, 3) }));
const GLIT = mk(70, () => ({ x: .5 + (Math.random() - .5) * rand(.12, .42), y: rand(0, 1), ph: rand(0, 6.3), sp: rand(1.5, 3.5), s: rand(3, 8) }));
const DUST = mk(34, () => ({ x: rand(.2, .9), y: rand(0, .6), ph: rand(0, 6.3), vy: rand(.004, .012), r: rand(.8, 1.8) }));
const PET = mk(26, () => ({ x: rand(0, 1), y: rand(-1, 1), vy: rand(.035, .07), sw: rand(.01, .03), ph: rand(0, 6.3), rot: rand(0, 6.3), vr: rand(-1.5, 1.5), s: rand(5, 9), c: ['#c8102e', '#e0475f', '#f28aa0', '#a50d26'][Math.floor(rand(0, 4))] }));
function drawFx(t, dt, w) {
  g.setTransform(FXR, 0, 0, FXR, 0, 0); g.clearRect(0, 0, Wd, Hd);
  if (w.stars > .01) {                         // twinkling stars over the lane (they follow the zoom)
    const { z, ox, oy } = w.laneZ; g.fillStyle = '#fffbe8';
    STARS.forEach(s => { g.globalAlpha = w.stars * (.35 + .65 * Math.max(0, Math.sin(t * s.sp + s.ph)));
      g.beginPath(); g.arc(ox + (PX(s.x) - ox) * z, oy + (PY(s.y) - oy) * z, s.r, 0, 6.283); g.fill(); });
  }
  if (w.fire > .01) {                          // warm fireflies drifting over the ghat
    g.globalAlpha = 1;
    FIRE.forEach(f => { f.y -= f.sp * dt * .02; if (f.y < .3) f.y = .98;
      const x = (f.x + Math.sin(t * .6 + f.ph) * .02) * Wd, y = f.y * Hd + w.fireY, a = w.fire * (.4 + .6 * Math.max(0, Math.sin(t * 1.7 + f.ph)));
      const gr = g.createRadialGradient(x, y, 0, x, y, f.r * 5); gr.addColorStop(0, `rgba(255,225,140,${a})`); gr.addColorStop(1, 'rgba(255,190,80,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, f.r * 5, 0, 6.283); g.fill(); });
  }
  if (w.glit > .01) {                          // sun glitter on the river
    g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 1;
    GLIT.forEach(p => { p.y += dt * .015; if (p.y > 1.02) p.y = -.02;
      const a = w.glit * Math.pow(Math.max(0, Math.sin(t * p.sp + p.ph)), 3); if (a < .02) return;
      const x = p.x * Wd, y = p.y * Hd, s = p.s * (.5 + a);
      g.globalAlpha = a; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke();
      g.beginPath(); g.arc(x, y, 1.3, 0, 6.283); g.fill(); });
  }
  if (w.dust > .01) {                          // dust motes in the lamplight of her room
    g.fillStyle = '#ffe2a6';
    DUST.forEach(d => { d.y -= d.vy * dt; if (d.y < -.02) d.y = .62;
      g.globalAlpha = w.dust * (.3 + .5 * Math.max(0, Math.sin(t + d.ph)));
      g.beginPath(); g.arc((d.x + Math.sin(t * .3 + d.ph) * .02) * Wd, d.y * Hd, d.r, 0, 6.283); g.fill(); });
  }
  if (w.pet > .01) {                           // rose petals drifting down over the arch and the swing
    PET.forEach(p => { p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > 1.05) { p.y = -.05; p.x = rand(0, 1); }
      g.globalAlpha = w.pet * .9; g.fillStyle = p.c; g.save();
      g.translate((p.x + Math.sin(t * .9 + p.ph) * p.sw) * Wd, p.y * Hd); g.rotate(p.rot); g.scale(1, .55 + .45 * Math.sin(t * 2 + p.ph));
      g.beginPath(); g.ellipse(0, 0, p.s, p.s * .62, 0, 0, 6.283); g.fill(); g.restore(); });
  }
  g.globalAlpha = 1;
}

/* ---------- per-frame composition ---------- */
const sc = { lane: el('s-lane'), room: el('s-room'), river: el('s-river'), ghat: el('s-ghat'), arch: el('s-arch'), events: el('s-events'), finale: el('s-finale') };
const kbs = Object.values(sc).map(s => s.querySelector('.kb'));
const show = (e, op, tf = '') => { e.style.opacity = op; e.style.visibility = op > .001 ? 'visible' : 'hidden'; e.style.transform = tf; };
const copy = (e, op, ty = 0) => { e.style.opacity = op; e.style.visibility = op > .01 ? 'visible' : 'hidden'; e.style.transform = `translate(-50%, ${ty}px)`; };
const gate = el('gate'), laneNight = el('laneNight'), keep = el('keep'), cEvents = el('c-events');
const flap = cardWrap.querySelector('.env-flap'), envs = cardWrap.querySelectorAll('.env-back, .env-front, .env-flap'), cardMove = el('cardMove'), cardBot = cardWrap.querySelector('.card-bot');
let dp = 0, envT = 0, walkT = 0, last = performance.now(), lastScene = 0;

function frame() {
  const now = performance.now(), dt = clamp((now - last) / 1000, 0, .05), t = now / 1000; last = now;
  const tg = target();
  dp = SETTLE || reduce ? tg : dp + (tg - dp) * (1 - Math.exp(-dt * 2.2));
  if (Math.abs(tg - dp) < .0008) dp = tg;
  const scene = Math.round(dp);
  if (scene !== lastScene && Math.abs(dp - scene) < .05) { lastScene = scene; if (opened) (scene === 3 ? rustle : chime)(); }

  // a slow, barely-there drift keeps every painting alive while you rest on it
  if (!reduce) kbs.forEach((k, i) => { k.style.transform = `scale(${(1.025 + .02 * Math.sin(t * .11 + i * 1.7)).toFixed(4)}) translate(${(Math.sin(t * .07 + i) * .6).toFixed(2)}%, ${(Math.cos(t * .09 + i) * .4).toFixed(2)}%)`; });

  show(gate, opened ? 1 - sstep(.02, .45, dp) : 1); gate.style.pointerEvents = opened ? 'none' : 'auto';

  /* 1–2 · the lane: sunset → moonlight (her shutters are open in the night painting); then we fly into her window */
  const night = sstep(1.08, 1.9, dp), lz = 1 + .05 * sstep(1, 2, dp) + 2.3 * ein(sstep(2.06, 2.95, dp)), lox = PX(.8), loy = PY(.47);
  sc.lane.style.transformOrigin = `${lox}px ${loy}px`;
  const laneOp = sstep(.1, .6, dp) * (1 - sstep(2.72, 2.97, dp));
  const lc = ein(sstep(2.06, 2.95, dp));
  show(sc.lane, laneOp, `translate(${(Wd / 2 - lox) * lc}px, ${(Hd * .45 - loy) * lc}px) scale(${lz})`);
  laneNight.style.opacity = night;
  const o1 = sstep(.45, .9, dp) * (1 - sstep(1.1, 1.35, dp)), o2 = sstep(1.72, 1.97, dp) * (1 - sstep(2.1, 2.32, dp));
  copy(el('c-names'), o1); copy(el('c-hint'), o1); copy(el('c-bless'), o2); copy(el('c-couple'), o2);

  /* 3 · her room: the envelope opens and the card unfolds above her hand; 3→4 we dive into the card's painting */
  const roomOp = sstep(2.6, 2.92, dp) * (1 - sstep(3.5, 3.82, dp));
  show(sc.room, roomOp, `scale(${1.14 - .14 * sstep(2.6, 3, dp)})`);
  if (dp > 2.8) envT = Math.min(1, envT + dt / 3.4); else if (dp < 2.4) envT = 0;
  if (SETTLE && dp >= 2.99) envT = 1;
  envT = Math.max(envT, sstep(3, 3.12, dp));
  const ca = sstep(0, .2, envT), cb = sstep(.18, .52, envT), cc = sstep(.5, .7, envT), cd = sstep(.64, 1, envT);
  flap.style.transform = `rotateX(${ca * 180}deg)`; flap.style.zIndex = ca > .5 ? 0 : 4;
  cardMove.style.transform = `translateY(${(1 - eio(cb)) * 150 * U}px)`;
  envs.forEach(e => { e.style.opacity = 1 - cc; e.style.translate = `0 ${eio(cc) * 170 * U}px`; });
  cardBot.style.transform = `rotateX(${(1 - eio(cd)) * 180}deg)`;
  const z = eio(sstep(3.04, 3.9, dp)), cover = Math.max(Wd / (124 * U), Hd / (83 * U)) * 1.05;
  const cl = el('cardLayer'), co = sstep(2.72, 2.95, dp) * (1 - sstep(3.93, 3.995, dp));
  cl.style.visibility = co > .001 ? 'visible' : 'hidden'; cl.style.opacity = co;
  const pcx = PX(CARD.x) + 68 * U, pcy = PY(CARD.bottom) - 178 * U + 130.5 * U;
  cardWrap.style.transform = `translate(${(Wd / 2 - pcx) * z}px, ${(Hd / 2 - pcy) * z}px) rotate(${-4 * (1 - z) + Math.sin(t * .8) * .6 * (1 - z)}deg) scale(${Math.exp(Math.log(cover) * z)})`;

  /* 4 · the river from above; the boat drifts up and away */
  const riverOp = sstep(3.72, 3.93, dp) * (1 - sstep(4.6, 4.86, dp));
  show(sc.river, riverOp);
  sprite(boat, .5 + Math.sin(t * .5) * .006, lerp(.6, .52, sstep(3.7, 4, dp)) - 1.0 * ein(sstep(4.04, 4.95, dp)) + Math.sin(t * 1.3) * .003, .32, Math.sin(t * .8) * 2);

  /* 5 · the ghat at night; 5→6, 6→7, 7→8 pan upward like turning pages */
  const pan = a => eio(sstep(a + .05, a + .95, dp));
  const p5 = pan(5), p6 = pan(6), p7 = pan(7);
  const ghatOp = sstep(4.55, 4.85, dp) * (p5 < 1 ? 1 : 0);
  show(sc.ghat, ghatOp, `translateY(${-p5 * Hd}px) scale(${1.1 - .1 * sstep(4.5, 5, dp)})`);
  copy(el('c-await'), sstep(4.82, 5, dp) * (1 - sstep(5.04, 5.25, dp)), -p5 * Hd);

  const archOn = p5 > 0 && p6 < 1;
  show(sc.arch, archOn ? 1 : 0, `translateY(${(1 - p5) * Hd - p6 * Hd}px)`);
  if (dp > 5.85) walkT = Math.min(1, walkT + dt / 5.5); else if (dp < 5.3) walkT = 0;
  if (SETTLE && dp >= 5.99) walkT = 1;
  const w = eio(walkT), moving = walkT > 0 && walkT < 1, bob = moving ? Math.abs(Math.sin(t * 4.6)) * .004 : 0;
  sprite(walkers, .5, lerp(.83, .66, w) - bob, lerp(.4, .15, w), moving ? Math.sin(t * 4.6) * .8 : 0);
  copy(el('c-explore'), sstep(.45, .85, walkT) * (1 - sstep(6.02, 6.2, dp)) * (p5 > .98 ? 1 : 0));

  show(sc.events, p6 > 0 && p7 < 1 ? 1 : 0, `translateY(${(1 - p6) * Hd - p7 * Hd}px)`);
  copy(cEvents, p6 > 0 && p7 < 1 ? 1 : 0, (1 - p6) * Hd - p7 * Hd);
  cEvents.classList.toggle('in', p6 > .7);

  show(sc.finale, p7 > 0 ? 1 : 0, `translateY(${(1 - p7) * Hd}px)`);
  copy(el('c-finale'), sstep(.55, 1, p7), (1 - p7) * Hd * .6);

  drawFx(t, dt, {
    stars: laneOp * night, laneZ: { z: lz, ox: lox, oy: loy },
    dust: roomOp, glit: riverOp,
    fire: ghatOp * (1 - p5), fireY: -p5 * Hd,
    pet: (archOn ? (1 - p6) * p5 : 0) + p7,
  });

  keep.classList.toggle('on', opened && dp > .95 && dp < 7.05 && Math.abs(dp - tg) < .01 && Math.abs(tg - Math.round(tg)) < .01 && tg !== 5 && tg !== 1 && tg !== 6);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__state = () => JSON.stringify({ dp: +dp.toFixed(3), envT: +envT.toFixed(2), walkT: +walkT.toFixed(2), opened });

/* ---------- countdown to the Holud ---------- */
const target0 = new Date('2026-12-30T15:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => el('cd-' + k));
function count() { const s = Math.max(0, Math.floor((target0 - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);
})();
