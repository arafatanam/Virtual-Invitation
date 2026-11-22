/* Hamza & Tahia — concept 2 engine.
   The page is a stack of full-screen snap points (one per scene). Native scrolling + scroll-snap decides
   WHICH scene you are on; the picture then glides there on its own clock (dp follows the scroll position
   smoothly), so one swipe always plays one whole, clean transition. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const SETTLE = location.hash.startsWith('#settle');
const FORCE = (location.hash.match(/dp=([\d.]+)/) || [])[1];
if (SETTLE) document.documentElement.classList.add('settle');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const ein = t => t * t * t;
const N = 9;   // gate, lane-day, lane-night, room, river, ghat, arch, celebrations, finale

/* ---------- paint the scenes ---------- */
$('#laneDay').src = ART.lane(false); $('#laneNight').src = ART.lane(true); $('#laneWin').innerHTML = ART.laneWindow();
$('#roomImg').src = ART.room(); $('#riverImg').src = ART.river(false); $('#cardImg').src = ART.river(true);
$('#riverFx').innerHTML = `<g>${ART.glitter()}</g><g id="boatG">${ART.boatTop()}</g>`;
$('#ghatImg').src = ART.ghat(); $('#archImg').src = ART.arch('walk'); $('#walkSvg').innerHTML = `<g id="walkG">${ART.couple()}</g>`;
const evBg = ART.eventsBg(); $('#eventsImg').src = evBg; $('#gate').style.backgroundImage = `radial-gradient(ellipse at 50% 50%, rgba(251,246,236,.97) 30%, rgba(251,246,236,.55) 62%, rgba(251,246,236,0) 80%), url("${evBg}")`; $('#finaleImg').src = ART.arch('swing'); $('#swingSvg').innerHTML = ART.swing();

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
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.textContent = on ? 'Pause music' : 'Play music'; });
const chime = () => music.sfx((t, tone, noise, pluck) => { [74, 78, 81, 86].forEach((m, i) => pluck(m, t + i * .08, { vol: .06, bright: .9, dur: 1.6 })); });
const rustle = () => music.sfx((t, tone, noise) => { for (let i = 0; i < 10; i++) noise(t + i * .05, { dur: .12, vol: .02, freq: 2500 + i * 200, type: 'bandpass', q: 1 }); });

/* ---------- snap track ---------- */
const track = $('#track');
for (let i = 0; i < N; i++) track.appendChild(document.createElement('div'));
const secH = () => track.firstElementChild.offsetHeight || innerHeight;
let opened = false;
const target = () => FORCE != null ? +FORCE : opened ? clamp(scrollY / secH(), 0, N - 1) : 0;
const go = k => scrollTo({ top: k * secH(), behavior: SETTLE || reduce ? 'auto' : 'smooth' });
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
$('#open').addEventListener('click', () => {
  if (opened) return; opened = true;
  document.body.classList.remove('locked'); music.start(); musicBtn.hidden = false;
  setTimeout(() => go(1), 60);
});

/* ---------- geometry: map the 390×844 art onto the screen (same as object-fit: cover) ---------- */
let Wd, Hd, S, OX, OY;
const PX = x => OX + x * S, PY = y => OY + y * S;
const cardWrap = $('#cardWrap'), CARD = { x: 226, y: 392, pcx: 294, pcy: 522.5 };
function layout() {
  Wd = innerWidth; Hd = innerHeight; S = Math.max(Wd / 390, Hd / 844); OX = (Wd - 390 * S) / 2; OY = (Hd - 844 * S) / 2;
  document.documentElement.style.setProperty('--u', S + 'px');
  cardWrap.style.left = PX(CARD.x) + 'px'; cardWrap.style.top = PY(CARD.y) + 'px';
}
layout(); addEventListener('resize', layout);

/* ---------- per-frame composition ---------- */
const el = id => document.getElementById(id);
const sc = { lane: el('s-lane'), room: el('s-room'), river: el('s-river'), ghat: el('s-ghat'), arch: el('s-arch'), events: el('s-events'), finale: el('s-finale') };
const show = (e, op, tf = '') => { e.style.opacity = op; e.style.visibility = op > .001 ? 'visible' : 'hidden'; e.style.transform = tf; };
const copy = (e, op, ty = 0) => { e.style.opacity = op; e.style.visibility = op > .01 ? 'visible' : 'hidden'; e.style.transform = `translate(-50%, ${ty}px)`; };
const gate = el('gate'), laneNight = el('laneNight'), winLit = el('winLit'), tahia = el('tahia'), shL = el('shL'), shR = el('shR');
const flap = cardWrap.querySelector('.env-flap'), envs = cardWrap.querySelectorAll('.env-back, .env-front, .env-flap'), cardMove = el('cardMove'), cardBot = cardWrap.querySelector('.card-bot');
const boatG = el('boatG'), walkG = el('walkG'), swingG = el('swing'), keep = el('keep'), cEvents = el('c-events');
let dp = 0, envT = 0, walkT = 0, last = performance.now(), lastScene = 0;

function frame() {
  const now = performance.now(), dt = clamp((now - last) / 1000, 0, .05), t = now / 1000; last = now;
  const tg = target();
  dp = SETTLE || reduce ? tg : dp + (tg - dp) * (1 - Math.exp(-dt * 2.3));
  if (Math.abs(tg - dp) < .0008) dp = tg;
  const scene = Math.round(dp);
  if (scene !== lastScene && Math.abs(dp - scene) < .05) { lastScene = scene; if (opened) (scene === 3 ? rustle : chime)(); }

  show(gate, opened ? 1 - sstep(.02, .45, dp) : 1); gate.style.pointerEvents = opened ? 'none' : 'auto';

  /* 1–2 · the lane: sunset → moonlight, her shutters open; then we fly into her window */
  const night = sstep(1.1, 1.85, dp), op = sstep(1.45, 1.95, dp);
  sc.lane.style.transformOrigin = `${PX(324)}px ${PY(330)}px`;
  show(sc.lane, sstep(.1, .6, dp) * (1 - sstep(2.72, 2.97, dp)), `scale(${1 + .06 * sstep(1, 2, dp) + 2.8 * ein(sstep(2.06, 2.95, dp))})`);
  laneNight.style.opacity = night; winLit.setAttribute('opacity', night); tahia.setAttribute('opacity', op);
  const sx = 1 - 1.35 * eio(op);
  shL.setAttribute('transform', `translate(278 0) scale(${sx} 1) translate(-278 0)`); shR.setAttribute('transform', `translate(370 0) scale(${sx} 1) translate(-370 0)`);
  const o1 = sstep(.45, .9, dp) * (1 - sstep(1.1, 1.35, dp)), o2 = sstep(1.72, 1.97, dp) * (1 - sstep(2.1, 2.32, dp));
  copy(el('c-names'), o1); copy(el('c-hint'), o1); copy(el('c-bless'), o2); copy(el('c-couple'), o2);

  /* 3 · her room: the envelope opens and the card unfolds; 3→4 we dive into the card's painting */
  show(sc.room, sstep(2.6, 2.92, dp) * (1 - sstep(3.5, 3.82, dp)), `scale(${1.14 - .14 * sstep(2.6, 3, dp)})`);
  if (dp > 2.8) envT = Math.min(1, envT + dt / 3.4); else if (dp < 2.4) envT = 0;
  if (SETTLE && dp >= 2.99) envT = 1;
  envT = Math.max(envT, sstep(3, 3.12, dp));
  const ca = sstep(0, .2, envT), cb = sstep(.18, .52, envT), cc = sstep(.5, .7, envT), cd = sstep(.64, 1, envT);
  flap.style.transform = `rotateX(${ca * 180}deg)`; flap.style.zIndex = ca > .5 ? 0 : 4;
  cardMove.style.transform = `translateY(${(1 - eio(cb)) * 150 * S}px)`;
  envs.forEach(e => { e.style.opacity = 1 - cc; e.style.translate = `0 ${eio(cc) * 170 * S}px`; });
  cardBot.style.transform = `rotateX(${(1 - eio(cd)) * 180}deg)`;
  const z = eio(sstep(3.04, 3.9, dp)), cover = Math.max(Wd / (124 * S), Hd / (83 * S)) * 1.05;
  const cl = el('cardLayer'), co = sstep(2.72, 2.95, dp) * (1 - sstep(3.93, 3.995, dp));
  cl.style.visibility = co > .001 ? 'visible' : 'hidden'; cl.style.opacity = co;
  cardWrap.style.transform = `translate(${(Wd / 2 - PX(CARD.pcx)) * z}px, ${(Hd / 2 - PY(CARD.pcy)) * z}px) rotate(${-4 * (1 - z) + Math.sin(t * .8) * .6 * (1 - z)}deg) scale(${Math.exp(Math.log(cover) * z)})`;

  /* 4 · the river from above; the boat drifts up and away */
  show(sc.river, sstep(3.72, 3.93, dp) * (1 - sstep(4.6, 4.86, dp)));
  const by = lerp(520, 440, sstep(3.7, 4, dp)) - 640 * ein(sstep(4.04, 4.95, dp)) + Math.sin(t * 1.3) * 3;
  boatG.setAttribute('transform', `translate(195 ${by.toFixed(1)}) rotate(${(Math.sin(t * .8) * 3).toFixed(2)}) scale(1.15)`);

  /* 5 · the ghat at night; 5→6, 6→7, 7→8 pan upward like turning pages of a scroll */
  const pan = (a) => eio(sstep(a + .05, a + .95, dp));
  const p5 = pan(5), p6 = pan(6), p7 = pan(7);
  show(sc.ghat, sstep(4.55, 4.85, dp) * (p5 < 1 ? 1 : 0), `translateY(${-p5 * Hd}px) scale(${1.1 - .1 * sstep(4.5, 5, dp)})`);
  copy(el('c-await'), sstep(4.82, 5, dp) * (1 - sstep(5.04, 5.25, dp)), -p5 * Hd);

  show(sc.arch, p5 > 0 && p6 < 1 ? 1 : 0, `translateY(${(1 - p5) * Hd - p6 * Hd}px)`);
  if (dp > 5.85) walkT = Math.min(1, walkT + dt / 5); else if (dp < 5.3) walkT = 0;
  if (SETTLE && dp >= 5.99) walkT = 1;
  const w = eio(walkT), bob = walkT > 0 && walkT < 1 ? Math.abs(Math.sin(t * 5)) * 3 : 0;
  walkG.setAttribute('transform', `translate(195 ${(lerp(850, 716, w) - bob).toFixed(1)}) scale(${lerp(.95, .5, w).toFixed(3)})`);
  copy(el('c-explore'), sstep(.45, .85, walkT) * (1 - sstep(6.02, 6.2, dp)) * (p5 > .98 ? 1 : 0));

  show(sc.events, p6 > 0 && p7 < 1 ? 1 : 0, `translateY(${(1 - p6) * Hd - p7 * Hd}px)`);
  copy(cEvents, p6 > 0 && p7 < 1 ? 1 : 0, (1 - p6) * Hd - p7 * Hd);
  cEvents.classList.toggle('in', p6 > .7);

  show(sc.finale, p7 > 0 ? 1 : 0, `translateY(${(1 - p7) * Hd}px)`);
  swingG.setAttribute('transform', `rotate(${(Math.sin(t * .9) * 2.2).toFixed(2)} 195 300)`);
  copy(el('c-finale'), sstep(.55, 1, p7), (1 - p7) * Hd * .6);

  keep.classList.toggle('on', opened && dp > .95 && dp < 7.05 && Math.abs(dp - tg) < .01 && Math.abs(tg - Math.round(tg)) < .01 && tg !== 5 && tg !== 1);
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
