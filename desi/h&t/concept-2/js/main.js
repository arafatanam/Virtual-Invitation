/* Hamza & Tahia — concept 2 engine.
   One continuous timeline scrubbed by the scroll position, like a video: scroll slowly and it plays slowly,
   fling it and it plays fast, scroll back and it rewinds. Positions on the timeline are in "screens"
   (1 = one screen-height of scrolling). The paintings are 1536 × 2752; scene positions are fractions of that frame.

   0.0  sunset lane · names            3.8  her room · the folded card opens in her hand
   0.5  sunset → dusk → night           5.0  we fly into the card's painting → the river
   1.9  night · blessings               6.0  the boat glides up-river
   2.9  dive into her window            7.5  the ghat at night · "Our celebration awaits"
   8.6  page turns to the arch · the couple walk in · 11.0 the celebrations · 12.9 the finale */
(() => {
'use strict';
const el = id => document.getElementById(id);
const SETTLE = location.hash.startsWith('#settle');
const FORCE = (location.hash.match(/dp=([\d.]+)/) || [])[1];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const rand = (a, b) => a + Math.random() * (b - a);
const IW = 1536, IH = 2752, END = 13.9;

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
const rustle = () => music.sfx((t, tone, noise) => { for (let i = 0; i < 12; i++) noise(t + i * .045, { dur: .12, vol: .022, freq: 2400 + i * 180, type: 'bandpass', q: 1 }); });

/* ---------- the scroll track ---------- */
const track = el('track');
const sizeTrack = () => { track.style.height = (END + 1) * innerHeight + 'px'; };
sizeTrack();
let opened = false;
const target = () => FORCE != null ? +FORCE : opened ? clamp(scrollY / innerHeight, 0, END) : 0;
const scrollToT = u => scrollTo({ top: u * innerHeight, behavior: reduce ? 'auto' : 'smooth' });
document.querySelectorAll('[data-to]').forEach(b => b.addEventListener('click', () => scrollToT(+b.dataset.to)));
const openBtn = el('open');
openBtn.addEventListener('click', () => {
  if (opened) return; opened = true;
  document.body.classList.remove('locked'); music.start(); musicBtn.hidden = false;
});
const first = [...document.querySelectorAll('#s-lane img')];
Promise.race([Promise.all(first.map(i => i.decode ? i.decode().catch(() => {}) : 0)), new Promise(r => setTimeout(r, SETTLE ? 0 : 4000))])
  .then(() => { openBtn.disabled = false; openBtn.textContent = 'Open the invitation'; });

/* ---------- 2D projective helpers (homographies) for mapping the card in perspective ---------- */
const mul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
function inv(m) {
  const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
}
function sq2q(q) {   // unit square → quad [tl, tr, br, bl]
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  return [[x1 - x0 + g * x1, x3 - x0 + h * x3, x0], [y1 - y0 + g * y1, y3 - y0 + h * y3, y0], [g, h, 1]];
}
const rect2sq = (x, y, w, h) => [[1 / w, 0, -x / w], [0, 1 / h, -y / h], [0, 0, 1]];
const ap = (M, [x, y]) => { const w = M[2][0] * x + M[2][1] * y + M[2][2]; return [(M[0][0] * x + M[0][1] * y + M[0][2]) / w, (M[1][0] * x + M[1][1] * y + M[1][2]) / w]; };
const css3 = M => { const n = M[2][2]; return `matrix3d(${M[0][0] / n},${M[1][0] / n},0,${M[2][0] / n},${M[0][1] / n},${M[1][1] / n},0,${M[2][1] / n},0,0,1,0,${M[0][2] / n},${M[1][2] / n},0,1)`; };
const lerpQ = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);

/* ---------- geometry ---------- */
let Wd, Hd, S, OX, OY;
const PX = f => OX + f * IW * S, PY = f => OY + f * IH * S, P = ([x, y]) => [PX(x), PY(y)];
// the card in her hand (fractions of the room painting): resting upright on her open palm, tipped slightly back
const CARDQ = [[.592, .378], [.862, .356], [.878, .57], [.606, .588]];
const PIC = [[.06, .40], [.94, .40], [.94, .945], [.06, .945]];   // painting window inside the card (card units)
const boat = el('boat'), walkers = el('walkers');
const fx = el('fx'), g = fx.getContext('2d'), FXR = Math.min(devicePixelRatio || 1, 1.5);
function layout() {
  Wd = innerWidth; Hd = innerHeight; S = Math.max(Wd / IW, Hd / IH); OX = (Wd - IW * S) / 2; OY = (Hd - IH * S) / 2;
  fx.width = Math.round(Wd * FXR); fx.height = Math.round(Hd * FXR); sizeTrack();
}
layout(); addEventListener('resize', layout);
function sprite(img, fxp, fyp, hf, rot = 0) {
  if (!img.naturalWidth) return;
  const h = hf * IH * S, w = h * img.naturalWidth / img.naturalHeight;
  img.style.width = w + 'px'; img.style.height = h + 'px';
  img.style.transformOrigin = `${w / 2}px ${h / 2}px`;
  img.style.transform = `translate(${PX(fxp) - w / 2}px, ${PY(fyp) - h / 2}px) rotate(${rot}deg)`;
}
const tpl = el('faceTpl');
document.querySelectorAll('#cardFace .fr').forEach(fr => fr.appendChild(tpl.content.cloneNode(true)));

/* ---------- light effects ---------- */
const mk = (n, f) => Array.from({ length: n }, f);
const STARS = mk(46, () => ({ x: rand(.3, .72), y: rand(.02, .3), r: rand(.6, 1.6), ph: rand(0, 6.3), sp: rand(1, 2.5) }));
const FIRE = mk(26, () => ({ x: rand(.05, .95), y: rand(.35, .95), ph: rand(0, 6.3), sp: rand(.2, .5), r: rand(1.5, 3) }));
const GLIT = mk(70, () => ({ x: .5 + (Math.random() - .5) * rand(.12, .42), y: rand(0, 1), ph: rand(0, 6.3), sp: rand(1.5, 3.5), s: rand(3, 8) }));
const DUST = mk(34, () => ({ x: rand(.2, .9), y: rand(0, .6), ph: rand(0, 6.3), vy: rand(.004, .012), r: rand(.8, 1.8) }));
const PET = mk(26, () => ({ x: rand(0, 1), y: rand(-1, 1), vy: rand(.035, .07), sw: rand(.01, .03), ph: rand(0, 6.3), rot: rand(0, 6.3), vr: rand(-1.5, 1.5), s: rand(5, 9), c: ['#c8102e', '#e0475f', '#f28aa0', '#a50d26'][Math.floor(rand(0, 4))] }));
function drawFx(t, dt, w) {
  g.setTransform(FXR, 0, 0, FXR, 0, 0); g.clearRect(0, 0, Wd, Hd);
  if (w.stars > .01) { const { z, ox, oy, tx, ty } = w.lane; g.fillStyle = '#fffbe8';
    STARS.forEach(s => { g.globalAlpha = w.stars * (.35 + .65 * Math.max(0, Math.sin(t * s.sp + s.ph)));
      g.beginPath(); g.arc(tx + ox + (PX(s.x) - ox) * z, ty + oy + (PY(s.y) - oy) * z, s.r, 0, 6.283); g.fill(); }); }
  if (w.fire > .01) { g.globalAlpha = 1;
    FIRE.forEach(f => { f.y -= f.sp * dt * .02; if (f.y < .3) f.y = .98;
      const x = (f.x + Math.sin(t * .6 + f.ph) * .02) * Wd, y = f.y * Hd + w.fireY, a = w.fire * (.4 + .6 * Math.max(0, Math.sin(t * 1.7 + f.ph)));
      const gr = g.createRadialGradient(x, y, 0, x, y, f.r * 5); gr.addColorStop(0, `rgba(255,225,140,${a})`); gr.addColorStop(1, 'rgba(255,190,80,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, f.r * 5, 0, 6.283); g.fill(); }); }
  if (w.glit > .01) { g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 1;
    GLIT.forEach(p => { p.y += dt * (.015 + Math.min(w.flow, 1) * .08); if (p.y > 1.02) p.y = -.02;
      const a = w.glit * Math.pow(Math.max(0, Math.sin(t * p.sp + p.ph)), 3); if (a < .02) return;
      const x = p.x * Wd, y = p.y * Hd, s = p.s * (.5 + a);
      g.globalAlpha = a; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke();
      g.beginPath(); g.arc(x, y, 1.3, 0, 6.283); g.fill(); }); }
  if (w.dust > .01) { g.fillStyle = '#ffe2a6';
    DUST.forEach(d => { d.y -= d.vy * dt; if (d.y < -.02) d.y = .62;
      g.globalAlpha = w.dust * (.3 + .5 * Math.max(0, Math.sin(t + d.ph)));
      g.beginPath(); g.arc((d.x + Math.sin(t * .3 + d.ph) * .02) * Wd, d.y * Hd, d.r, 0, 6.283); g.fill(); }); }
  if (w.pet > .01) {
    PET.forEach(p => { p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > 1.05) { p.y = -.05; p.x = rand(0, 1); }
      g.globalAlpha = Math.min(1, w.pet) * .9; g.fillStyle = p.c; g.save();
      g.translate((p.x + Math.sin(t * .9 + p.ph) * p.sw) * Wd, p.y * Hd); g.rotate(p.rot); g.scale(1, .55 + .45 * Math.sin(t * 2 + p.ph));
      g.beginPath(); g.ellipse(0, 0, p.s, p.s * .62, 0, 0, 6.283); g.fill(); g.restore(); }); }
  g.globalAlpha = 1;
}

/* ---------- per-frame composition ---------- */
const sc = { lane: el('s-lane'), room: el('s-room'), river: el('s-river'), ghat: el('s-ghat'), arch: el('s-arch'), events: el('s-events'), finale: el('s-finale') };
const kbs = [...document.querySelectorAll('.kb')].filter(k => k.id !== 'riverKb');
const riverKb = el('riverKb');
const show = (e, op, tf = '') => { e.style.opacity = op; e.style.visibility = op > .001 ? 'visible' : 'hidden'; e.style.transform = tf; };
const copy = (e, op, ty = 0) => { e.style.opacity = op; e.style.visibility = op > .01 ? 'visible' : 'hidden'; e.style.transform = `translate(-50%, ${ty}px)`; };
const gate = el('gate'), laneNight = el('laneNight'), keep = el('keep'), card = el('cardFace'), pn1 = el('pn1'), pn3 = el('pn3');
const evs = [...document.querySelectorAll('.ev')], shadow = el('cardShadow');
let dp = 0, last = performance.now(), lastMove = performance.now(), rustled = false;

function frame() {
  const now = performance.now(), dt = clamp((now - last) / 1000, 0, .05), t = now / 1000; last = now;
  const tg = target(), prev = dp;
  dp = SETTLE || reduce ? tg : dp + (tg - dp) * (1 - Math.exp(-dt * 9));     // light smoothing; still follows your finger
  if (Math.abs(tg - dp) < .0005) dp = tg;
  if (Math.abs(dp - prev) > .0004) lastMove = now;
  const laneDusk = el('laneDusk');

  if (!reduce) kbs.forEach((k, i) => { k.style.transform = `scale(${(1.025 + .02 * Math.sin(t * .11 + i * 1.7)).toFixed(4)}) translate(${(Math.sin(t * .07 + i) * .5).toFixed(2)}%, ${(Math.cos(t * .09 + i) * .35).toFixed(2)}%)`; });
  gate.classList.toggle('gone', opened);

  /* ── lane: sunset → (dusk) → night, then the dive into her window ── */
  let night;
  if (laneDusk) { laneDusk.style.opacity = ss(.5, 1.25, dp); night = ss(1.2, 1.95, dp); }
  else night = ss(.5, 1.95, dp);
  laneNight.style.opacity = night;
  const dive = eio(ss(2.9, 3.8, dp)), lz = 1 + .06 * ss(.3, 2.9, dp) + 2.3 * dive * dive, lox = PX(.8), loy = PY(.47);
  const ltx = (Wd / 2 - lox) * dive, lty = (Hd * .45 - loy) * dive;
  sc.lane.style.transformOrigin = `${lox}px ${loy}px`;
  const laneOp = 1 - ss(3.55, 3.8, dp);
  show(sc.lane, laneOp, `translate(${ltx}px, ${lty}px) scale(${lz})`);
  copy(el('c-names'), 1 - ss(.45, .85, dp)); copy(el('c-hint'), opened ? 1 - ss(.05, .4, dp) : 0);
  const bl = ss(1.85, 2.15, dp) * (1 - ss(2.75, 2.95, dp));
  copy(el('c-bless'), bl, (1 - ss(1.85, 2.15, dp)) * 20); copy(el('c-couple'), bl, (1 - ss(1.9, 2.25, dp)) * 30);

  /* ── her room: the folded card opens on her palm; then we fly into its painting ── */
  const zoom = eio(ss(5.0, 6.0, dp));
  const u = ss(3.95, 4.75, dp);                                  // unfold: bottom flap down, then top flap up
  const drop = (1 - eio(ss(0, .6, u))) * .072;                   // folded, it rests in her palm; it rises as it opens
  const cq = CARDQ.map(([x, y]) => P([x, y + drop])), Hc = sq2q(cq);
  const picQ = PIC.map(p => ap(Hc, p));                          // the painting window on screen
  const scr = [[0, 0], [Wd, 0], [Wd, Hd], [0, Hd]];
  const Qz = lerpQ(picQ, scr, zoom);                             // where the painting is right now
  const Hz = mul(sq2q(Qz), inv(sq2q(picQ)));                     // the whole room moves with it
  const pre = 1 + .12 * (1 - ss(3.55, 4.0, dp));                 // the room settles in after the dive
  const cx = PX(.72), cy = PY(.47), Pre = [[pre, 0, cx * (1 - pre)], [0, pre, cy * (1 - pre)], [0, 0, 1]];
  const HR = mul(Hz, Pre);
  const roomOp = ss(3.55, 3.8, dp) * (1 - ss(5.95, 6.05, dp));
  show(sc.room, roomOp, css3(HR));
  const cardOp = ss(3.75, 3.95, dp) * (1 - ss(5.95, 6.05, dp));
  card.style.visibility = cardOp > .001 ? 'visible' : 'hidden'; card.style.opacity = cardOp;
  const cqs = cq.map(p => ap(HR, p));
  card.style.transform = css3(mul(sq2q(cqs), rect2sq(0, 0, 600, 800)));
  // soft contact shadow where the card meets her fingers
  const fold = 1 - eio(ss(0, .5, u)), bx = (cqs[2][0] + cqs[3][0]) / 2, by = lerp((cqs[2][1] + cqs[3][1]) / 2, (cqs[1][1] + cqs[2][1]) / 2 * .33 + (cqs[2][1] + cqs[3][1]) / 2 * .67, fold * 0);
  const bw = Math.hypot(cqs[2][0] - cqs[3][0], cqs[2][1] - cqs[3][1]);
  shadow.style.opacity = cardOp * (1 - zoom) * .55; shadow.style.width = bw * .9 + 'px'; shadow.style.height = bw * .16 + 'px';
  shadow.style.transform = `translate(${bx - bw * .45}px, ${by - bw * .06}px) rotate(${Math.atan2(cqs[2][1] - cqs[3][1], cqs[2][0] - cqs[3][0])}rad)`;
  pn3.style.transform = `translateZ(1px) rotateX(${(1 - eio(ss(0, .5, u))) * 180}deg)`;
  pn1.style.transform = `translateZ(.5px) rotateX(${-(1 - eio(ss(.45, 1, u))) * 180}deg)`;
  if (u > .55 && !rustled && opened) { rustled = true; rustle(); } if (u < .1) rustled = false;
  const live = dp > 3.75;

  /* ── the river lives inside the card's painting window, then fills the screen (stays sharp) ── */
  const picAspect = Math.hypot(picQ[1][0] - picQ[0][0], picQ[1][1] - picQ[0][1]) / Math.hypot(picQ[3][0] - picQ[0][0], picQ[3][1] - picQ[0][1]);
  const r0h = Wd / picAspect, R0y = Hd * .5 - r0h / 2;
  const Rz = [0, lerp(R0y, 0, zoom), Wd, lerp(r0h, Hd, zoom)];
  const mapped = zoom < .999;
  const rv = ss(.3, .55, u); card.style.setProperty('--picA', (1 - rv).toFixed(3));
  const riverOp = live ? (zoom > 0 ? 1 : cardOp * rv) * (1 - ss(7.5, 7.9, dp)) : 0;
  show(sc.river, riverOp, mapped ? css3(mul(sq2q(Qz), rect2sq(...Rz))) : '');
  sc.river.style.clipPath = mapped ? `inset(${Rz[1]}px 0 ${Hd - Rz[1] - Rz[3]}px 0)` : 'none';
  const flow = ss(6.0, 7.6, dp);
  riverKb.style.transform = `translateY(${(flow * 9 - 4.5).toFixed(2)}%) scale(1.12)`;
  sprite(boat, .5 + Math.sin(t * .5) * .005, .53 - 1.05 * Math.pow(flow, 1.6) + Math.sin(t * 1.3) * .003, .3, Math.sin(t * .8) * 1.6);

  /* ── the ghat, then the page scrolls on: arch → celebrations → finale ── */
  const ghIn = ss(7.5, 7.9, dp), p1 = eio(ss(8.6, 9.6, dp)), p2 = eio(ss(11.0, 12.0, dp)), p3 = eio(ss(12.9, 13.9, dp));
  show(sc.ghat, ghIn * (p1 < 1 ? 1 : 0), `translateY(${-p1 * Hd}px) scale(${1.1 - .1 * ghIn})`);
  copy(el('c-await'), ss(7.75, 8.0, dp), -p1 * Hd + (1 - ss(7.75, 8.0, dp)) * 30);
  const archOn = p1 > 0 && p2 < 1;
  show(sc.arch, archOn ? 1 : 0, `translateY(${(1 - p1) * Hd - p2 * Hd}px)`);
  const w = eio(ss(9.3, 10.8, dp)), step = Math.sin(dp * 46), walking = w > 0 && w < 1;
  sprite(walkers, .5, lerp(.86, .66, w) - (walking ? Math.abs(step) * .004 : 0), lerp(.42, .15, w), walking ? step * .7 : 0);
  copy(el('c-explore'), ss(10.4, 10.7, dp), -p2 * Hd);
  show(sc.events, p2 > 0 && p3 < 1 ? 1 : 0, `translateY(${(1 - p2) * Hd - p3 * Hd}px)`);
  copy(el('c-events'), p2 > 0 && p3 < 1 ? 1 : 0, (1 - p2) * Hd - p3 * Hd);
  evs.forEach((e, i) => { const a = ss(11.55 + i * .18, 11.85 + i * .18, dp); e.style.opacity = a; e.style.transform = `translateY(${(1 - a) * 26}px)`; });
  show(sc.finale, p3 > 0 ? 1 : 0, `translateY(${(1 - p3) * Hd}px)`);
  copy(el('c-finale'), ss(13.45, 13.9, dp), (1 - ss(13.3, 13.9, dp)) * 40);

  drawFx(t, dt, {
    stars: laneOp * night, lane: { z: lz, ox: lox, oy: loy, tx: ltx, ty: lty },
    dust: roomOp * (1 - zoom), glit: riverOp * ss(.95, 1, zoom), flow: Math.abs(dp - prev) / Math.max(dt, .001) * .3,
    fire: ghIn * (1 - p1), fireY: -p1 * Hd,
    pet: (archOn ? p1 * (1 - p2) : 0) + p3,
  });

  keep.classList.toggle('on', opened && dp < END - .2 && now - lastMove > 1600 && !(dp > 7.7 && dp < 8.7));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__state = () => JSON.stringify({ dp: +dp.toFixed(3), opened });

/* ---------- countdown to the Holud ---------- */
const target0 = new Date('2026-12-30T15:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => el('cd-' + k));
function count() { const s = Math.max(0, Math.floor((target0 - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);
})();
