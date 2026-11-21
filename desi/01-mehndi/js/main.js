/* Mehndi Raat — a hand gets its mehndi piped on live by a cone, the paste dries and crumbles away to reveal the
   stain (orange, deepening to maroon), then guests hunt for the groom's initial hidden in the design. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const body = document.body;

/* ================= music: mehedi-night dhol, claps, jingles and a folk melody in raag Kafi ================= */
const mel = [69, 0, 71, 69, 67, 0, 65, 64, 65, 0, 67, 0, 69, 0, 0, 0, 72, 0, 71, 69, 67, 0, 69, 0, 65, 64, 62, 0, 64, 0, 0, 0,
             74, 0, 72, 71, 72, 0, 69, 0, 71, 69, 67, 0, 69, 0, 0, 0, 67, 0, 65, 64, 65, 0, 67, 65, 64, 0, 62, 0, 62, 0, 0, 0];
const dholBass = (t, tone, noise, v = 1) => { tone(43, t, { dur: .38, vol: .34 * v, slide: 5 }); noise(t, { dur: .05, vol: .06 * v, freq: 260, type: 'lowpass' }); };
const dholTreble = (t, tone, noise, v = 1) => { tone(79, t, { dur: .09, vol: .055 * v, partials: [[1, 1], [1.48, .5], [2.1, .3]] }); noise(t, { dur: .04, vol: .05 * v, freq: 2600, type: 'bandpass', q: 1.4 }); };
const clap = (t, noise, v = 1) => { for (let i = 0; i < 3; i++) noise(t + i * .009, { dur: .05, vol: .06 * v, freq: 1300, type: 'bandpass', q: .9 }); noise(t + .027, { dur: .14, vol: .035 * v, freq: 1300, type: 'bandpass', q: .7 }); };
const music = createMusic({ spb: .15, reverb: .28, volume: .8, play(step, t, tone, noise, pluck) {
  const k = step % 8;
  if (k === 0 || k === 6) dholBass(t, tone, noise);
  if (k === 3) dholBass(t, tone, noise, .55);
  if (k === 2 || k === 4 || k === 5 || k === 7) dholTreble(t, tone, noise, k === 4 ? 1.2 : .8);
  if (k === 2 || k === 6) clap(t, noise, .9);
  noise(t, { dur: .035, vol: k % 2 ? .018 : .03, freq: 9000 });                       // chimta
  const m = mel[step % mel.length];
  if (m) tone(m, t, { type: 'triangle', dur: .55, vol: .055, attack: .03, bend: 1, vib: [5.5, 16], partials: [[1, 1], [2, .22], [3, .08]] });
  if (step % 32 === 0) [50, 57, 62].forEach(n => tone(n, t, { type: 'sawtooth', dur: 4.8, vol: .011, cutoff: 900, sustain: true, attack: .5 }));
  if (step % 64 === 60) pluck(86, t, { vol: .12, buzz: .4, bend: 2 });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
const chime = () => music.sfx((t, tone, n, pluck) => [74, 78, 81, 86].forEach((m, i) => pluck(m, t + i * .09, { vol: .16, buzz: .3 })));

/* ================= geometry helpers ================= */
const f1 = n => Math.round(n * 10) / 10;
const P = (cx, cy, r, a) => `${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`;
const dot = (x, y, r) => `M${f1(x - r)} ${f1(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
const circ = (cx, cy, r) => `M${f1(cx + r)} ${f1(cy)}A${r} ${r} 0 1 1 ${f1(cx - r)} ${f1(cy)}A${r} ${r} 0 1 1 ${f1(cx + r)} ${f1(cy)}`;
const petal = (cx, cy, a, r1, r2, w) => { const m = (r1 + r2) / 2; return `M${P(cx, cy, r1, a)}Q${P(cx, cy, m, a - w)} ${P(cx, cy, r2, a)}Q${P(cx, cy, m, a + w)} ${P(cx, cy, r1, a)}`; };
// a paisley (kairi) from a template path: absolute M pairs, relative c pairs
const PAISLEY = 'M60 110c-34 0-46-32-34-56 10-20 34-24 46-12 10 10 6 28-8 28-12 0-14-14-6-18M60 110c26 0 44-18 44-44 0-34-26-56-58-58 10 6 14 16 12 26';
function paisley(ox, oy, s, flip = 1, rot = 0) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return PAISLEY.replace(/([Mc])([^Mc]+)/g, (_, cmd, nums) => {
    const v = nums.trim().split(/[\s,]+|(?=-)/).filter(Boolean).map(Number), out = [];
    for (let i = 0; i < v.length; i += 2) {
      let x = (v[i] - (cmd === 'M' ? 60 : 0)) * s * flip, y = (v[i + 1] - (cmd === 'M' ? 60 : 0)) * s;
      const rx = x * c - y * sn, ry = x * sn + y * c;
      out.push(cmd === 'M' ? `${f1(ox + rx)} ${f1(oy + ry)}` : `${f1(rx)} ${f1(ry)}`);
    }
    return cmd + out.join(' ');
  });
}
function mandala(cx, cy, s, items, opt = {}) {
  const add = (d, w, fill) => items.push({ d, w, fill });
  add(dot(cx, cy, 7 * s), 1, true);
  add(circ(cx, cy, 14 * s), 2);
  for (let i = 0; i < 8; i++) add(petal(cx, cy, i / 8 * Math.PI * 2 - Math.PI / 2, 16 * s, 44 * s, .32), 2.2);
  for (let i = 0; i < 8; i++) add(petal(cx, cy, (i + .5) / 8 * Math.PI * 2 - Math.PI / 2, 16 * s, 30 * s, .22), 1, true);
  add(circ(cx, cy, 48 * s), 2.4);
  let sc = ''; const N = 20;
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2; sc += (i ? '' : `M${P(cx, cy, 48 * s, a)}`) + `Q${P(cx, cy, 62 * s, (a + b) / 2)} ${P(cx, cy, 48 * s, b)}`; }
  add(sc, 2);
  for (let i = 0; i < 24; i++) add(dot(...P(cx, cy, 67 * s, i / 24 * Math.PI * 2).split(' ').map(Number), 2.4 * s), 1, true);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 - Math.PI / 2;
    add(petal(cx, cy, a, 72 * s, 104 * s, .2), 2.4);
    add(`M${P(cx, cy, 78 * s, a)}L${P(cx, cy, 97 * s, a)}`, 1.4);
    add(dot(...P(cx, cy, 111 * s, a).split(' ').map(Number), 3 * s), 1, true);
  }
  if (opt.outer) for (let i = 0; i < 36; i++) add(petal(cx, cy, i / 36 * Math.PI * 2, 118 * s, 138 * s, .06), 1.2);
}

/* ================= the hand ================= */
const svg = $('#hand');
const PARTS = {
  palm: { x: 92, y: 250, w: 222, h: 290, r: 72 },
  wrist: { x: 124, y: 440, w: 162, h: 170, r: 30 },
  index: { x: 98, y: 92, w: 52, h: 220, r: 26, rot: [-7, 124, 300] },
  middle: { x: 156, y: 52, w: 54, h: 250, r: 27 },
  ring: { x: 216, y: 72, w: 52, h: 230, r: 26, rot: [6, 242, 300] },
  pinky: { x: 274, y: 142, w: 44, h: 170, r: 22, rot: [14, 296, 310] },
  thumb: { x: 72, y: 270, w: 54, h: 150, r: 27, rot: [-28, 99, 420] }
};
const tf = p => p.rot ? `rotate(${p.rot.join(' ')})` : '';
const rects = Object.values(PARTS).map(p => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.r}" transform="${tf(p)}"/>`).join('');
svg.innerHTML = `<defs>
  <linearGradient id="skin" gradientUnits="userSpaceOnUse" x1="40" y1="60" x2="360" y2="600"><stop offset="0" stop-color="#f5cfab"/><stop offset=".55" stop-color="#e4aa80"/><stop offset="1" stop-color="#c88760"/></linearGradient>
  <radialGradient id="palmLight" cx=".45" cy=".55" r=".5"><stop offset="0" stop-color="#fff3e4" stop-opacity=".35"/><stop offset="1" stop-color="#fff3e4" stop-opacity="0"/></radialGradient>
  <filter id="emboss" x="-5%" y="-5%" width="110%" height="110%"><feOffset dy="1.3" in="SourceAlpha" result="o"/><feFlood flood-color="#160f04" flood-opacity=".6"/><feComposite in2="o" operator="in" result="sh"/><feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="handClip">${rects}</clipPath>
  <linearGradient id="foil" x1="0" x2="1"><stop offset="0" stop-color="#b9862b"/><stop offset=".4" stop-color="#ffe7a1"/><stop offset=".7" stop-color="#d9a441"/><stop offset="1" stop-color="#8a5d17"/></linearGradient>
</defs>
<g fill="url(#skin)">${rects}</g>
<g clip-path="url(#handClip)"><rect x="0" y="0" width="400" height="600" fill="url(#palmLight)"/>
  <path d="M108 236q16 6 32 0M106 160q14 5 30 0M164 214q16 6 32 0M164 130q15 5 30 0M224 222q16 6 32 0M226 146q14 5 30 0M282 256q14 6 28 0M286 198q12 4 24 0" transform="" fill="none" stroke="#b5764f" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>
  <path d="M110 330c40 10 120 0 190-30M118 390c50-6 110-14 150-6M150 300c-20 60-20 140 20 220" fill="none" stroke="#a8694a" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/></g>
<g id="stainG" class="stain" clip-path="url(#handClip)"></g>
<g id="pasteG" class="paste" clip-path="url(#handClip)"></g>
<circle class="found-ring" id="foundRing" r="4"/>
<g id="cone" opacity="0"><g transform="rotate(-28)">
  <path d="M0 0L-11 -84L11 -84Z" fill="url(#foil)" stroke="#6b4512" stroke-width="1"/>
  <path d="M-5 -40L5 -40M-7.5 -58L7.5 -58M-9.5 -74L9.5 -74" stroke="#e8456b" stroke-width="3"/>
  <path d="M-11 -84Q0 -98 11 -84Q6 -90 0 -92Q-6 -90 -11 -84Z" fill="#c58b2f"/><circle r="2.5" fill="#4a3a17"/></g></g>`;

// build the design
const groups = {};
['stainG', 'pasteG'].forEach(id => { const g = svg.getElementById(id); groups[id] = {}; Object.entries(PARTS).forEach(([k, p]) => { const sub = document.createElementNS(NS, 'g'); if (p.rot) sub.setAttribute('transform', tf(p)); g.appendChild(sub); groups[id][k] = sub; }); });
const items = [];   // {part, d, w, fill}
const addTo = part => (d, w, fill) => items.push({ part, d, w, fill });
// palm mandala + corner paisleys + vine
const palmItems = []; mandala(203, 378, .86, palmItems);
palmItems.forEach(i => items.push({ part: 'palm', ...i }));
addTo('palm')(paisley(132, 300, .32, 1, -.5), 2);
addTo('palm')(paisley(276, 302, .32, -1, .5), 2);
addTo('palm')('M203 468c-10 14 10 22 0 36M203 504c-14 6-26-2-24-14M203 504c14 6 26-2 24-14', 2);
// fingers
['index', 'middle', 'ring', 'pinky', 'thumb'].forEach(k => {
  const p = PARTS[k], a = addTo(k), x0 = p.x, x1 = p.x + p.w, cx = p.x + p.w / 2, top = p.y, r = p.r;
  a(`M${x0 - 2} ${top + r + 18}V${top + r}A${r} ${r} 0 0 1 ${x1 + 2} ${top + r}V${top + r + 18}Z`, 1.4, true);      // solid tip
  let sc = `M${x0} ${top + r + 18}`; const bw = p.w / 4;
  for (let i = 0; i < 4; i++) sc += `a${bw / 2} ${bw / 2} 0 0 0 ${bw} 0`;
  a(sc, 2);
  for (let i = 0; i < 4; i++) a(dot(x0 + bw * (i + .5), top + r + 18 + bw / 2 + 6, 1.8), 1, true);
  const by = top + r + 64;
  if (by + 30 < top + p.h - 60) {
    a(`M${x0} ${by}H${x1}M${x0} ${by + 16}H${x1}`, 1.8);
    let z = `M${x0} ${by + 16}`; for (let i = 0; i < 6; i++) z += `L${f1(x0 + p.w / 6 * (i + .5))} ${by}L${f1(x0 + p.w / 6 * (i + 1))} ${by + 16}`;
    a(z, 1.4);
    if (k !== 'ring') for (let y = by + 30; y < top + p.h - 70; y += 13) a(dot(cx, y, 2), 1, true);
  }
  const bb = top + p.h - 62;
  a(`M${x0} ${bb}H${x1}`, 2);
  let dd = ''; for (let i = 0; i < 5; i++) dd += dot(x0 + p.w / 5 * (i + .5), bb + 9, 2.4);
  a(dd, 1, true);
  a(`M${x0} ${bb + 18}H${x1}`, 2);
});
// wrist: bracelet band + lattice
{ const a = addTo('wrist'), x0 = 124, x1 = 286;
  a(`M${x0} 548H${x1}M${x0} 566H${x1}`, 2.2);
  let sc = `M${x0} 566`; for (let i = 0; i < 9; i++) sc += `a9 9 0 0 1 18 0`; a(sc, 1.8);
  let dd = ''; for (let i = 0; i < 9; i++) dd += dot(x0 + 9 + i * 18, 557, 2.2); a(dd, 1, true);
  let lat = ''; for (let i = -6; i < 14; i++) lat += `M${x0 + i * 14} 576l40 40`; a(lat, 1.2);
  let lat2 = ''; for (let i = 0; i < 20; i++) lat2 += `M${x0 + i * 14} 576l-40 40`; a(lat2, 1.2);
}
// the hidden initial, tucked into the ring finger
const R_LOCAL = [242, 214], rr = PARTS.ring.rot, ang = rr[0] * Math.PI / 180;
const R_ROOT = [rr[1] + (R_LOCAL[0] - rr[1]) * Math.cos(ang) - (R_LOCAL[1] - rr[2]) * Math.sin(ang), rr[2] + (R_LOCAL[0] - rr[1]) * Math.sin(ang) + (R_LOCAL[1] - rr[2]) * Math.cos(ang)];

const els = items.map(it => {
  const mk = (gid, w) => {
    const el = document.createElementNS(NS, 'path'); el.setAttribute('d', it.d); el.setAttribute('stroke-width', w);
    if (it.fill) el.setAttribute('class', 'f');
    groups[gid][it.part].appendChild(el); return el;
  };
  return { s: mk('stainG', it.w * .85), p: mk('pasteG', it.w * 1.25), fill: it.fill, part: it.part };
});
const rTexts = ['stainG', 'pasteG'].map(gid => {
  const t = document.createElementNS(NS, 'text'); t.setAttribute('x', R_LOCAL[0]); t.setAttribute('y', R_LOCAL[1]); t.setAttribute('text-anchor', 'middle');
  t.setAttribute('class', 'hidden-r f'); t.setAttribute('font-size', '22'); t.textContent = 'R'; t.setAttribute('stroke', 'none');
  groups[gid].ring.appendChild(t); return t;
});
rTexts[1].style.fillOpacity = 0;

// lengths for the piping animation
let total = 0;
els.forEach(e => { e.len = Math.max(8, e.p.getTotalLength()); e.start = total; total += e.len;
  e.p.style.strokeDasharray = e.len; e.p.style.strokeDashoffset = e.len; });
const cone = svg.getElementById('cone');
const toRoot = (part, x, y) => { const p = PARTS[part]; if (!p.rot) return [x, y]; const [a, cx, cy] = p.rot, r = a * Math.PI / 180;
  return [cx + (x - cx) * Math.cos(r) - (y - cy) * Math.sin(r), cy + (x - cx) * Math.sin(r) + (y - cy) * Math.cos(r)]; };

const status = $('#status');
function say(txt) { status.style.opacity = 0; setTimeout(() => { status.textContent = txt; status.style.opacity = 1; }, 250); }

function pipe() {
  return new Promise(res => {
    const DUR = reduce ? 1 : (small ? 9000 : 10000), t0 = performance.now(); let i = 0;
    cone.setAttribute('opacity', 1);
    (function frame(now) {
      const drawn = (now - t0) / DUR * total;
      while (i < els.length && drawn >= els[i].start + els[i].len) {
        const e = els[i]; e.p.style.strokeDashoffset = 0; if (e.fill) e.p.style.fillOpacity = 1;
        if (e.part === 'ring' && (!els[i + 1] || els[i + 1].part !== 'ring')) rTexts[1].style.fillOpacity = 1;
        i++;
      }
      if (i < els.length) {
        const e = els[i], l = Math.max(0, drawn - e.start);
        e.p.style.strokeDashoffset = e.len - l;
        const pt = e.p.getPointAtLength(Math.min(l, e.len)), [x, y] = toRoot(e.part, pt.x, pt.y);
        cone.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`);
        requestAnimationFrame(frame);
      } else { rTexts[1].style.fillOpacity = 1; cone.setAttribute('opacity', 0); res(); }
    })(t0);
  });
}

/* ================= falling petals, marigold, crumbs ================= */
const cv = $('#petals'), cx2 = cv.getContext('2d');
let W, H, DPR;
function size() { DPR = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; cx2.setTransform(DPR, 0, 0, DPR, 0, 0); }
size(); addEventListener('resize', size);
const bits = [];
const PET = ['#e8456b', '#d81b60', '#ff7d9c', '#f08a24', '#f6a21e', '#ffd36b'];
function petalBit(x = rand(0, W), y = rand(-H, -20), burst) {
  const a = rand(0, Math.PI * 2), sp = burst ? rand(4, 11) : 0;
  return { kind: 'petal', x, y, vx: burst ? Math.cos(a) * sp : rand(-.3, .3), vy: burst ? Math.sin(a) * sp - 4 : rand(.6, 1.4), r: rand(0, 6.3), vr: rand(-.05, .05),
    ph: rand(0, 6.3), vp: rand(.03, .08), s: rand(5, 10), c: PET[Math.floor(rand(0, PET.length))], burst };
}
let ambient = false;
function burst(x, y, n = 50) { for (let i = 0; i < n; i++) bits.push(petalBit(x, y, true)); }
function crumbs(n) {
  const r = svg.getBoundingClientRect(), sx = r.width / 400, sy = r.height / 600;
  for (let k = 0; k < n; k++) {
    const e = els[Math.floor(rand(0, els.length))], pt = e.p.getPointAtLength(rand(0, e.len)), [x, y] = toRoot(e.part, pt.x, pt.y);
    bits.push({ kind: 'crumb', x: r.left + x * sx, y: r.top + y * sy, vx: rand(-.6, .6), vy: rand(-1.5, .5), s: rand(1.5, 3.6), r: rand(0, 6), vr: rand(-.2, .2), delay: rand(0, 1400) });
  }
}
let last = performance.now();
function drawBits(now) {
  const dt = Math.min(2, (now - last) / 16.7); last = now;
  cx2.clearRect(0, 0, W, H);
  if (ambient && bits.filter(b => b.kind === 'petal' && !b.burst).length < (small ? 16 : 28)) bits.push(petalBit(rand(0, W), -20));
  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i];
    if (b.kind === 'crumb') {
      if (b.delay > 0) { b.delay -= dt * 16.7; continue; }
      b.vy += .25 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt;
      cx2.save(); cx2.translate(b.x, b.y); cx2.rotate(b.r); cx2.fillStyle = '#5a4520'; cx2.fillRect(-b.s, -b.s * .6, b.s * 2, b.s * 1.2); cx2.restore();
      if (b.y > H + 20) bits.splice(i, 1);
      continue;
    }
    if (b.burst) { b.vx *= .96; b.vy = b.vy * .96 + .12 * dt; if (Math.abs(b.vx) < .5) b.burst = b.vy > 1.2 ? false : b.burst; }
    b.ph += b.vp * dt; b.r += b.vr * dt;
    b.x += (b.vx + Math.sin(b.ph) * .6) * dt; b.y += b.vy * dt;
    const flip = Math.cos(b.ph * 1.3);
    cx2.save(); cx2.translate(b.x, b.y); cx2.rotate(b.r); cx2.scale(flip, 1);
    cx2.fillStyle = b.c; cx2.beginPath(); cx2.ellipse(0, 0, b.s, b.s * .62, 0, 0, Math.PI * 2); cx2.fill();
    cx2.fillStyle = 'rgba(255,255,255,.18)'; cx2.beginPath(); cx2.ellipse(-b.s * .3, -b.s * .15, b.s * .4, b.s * .2, 0, 0, Math.PI * 2); cx2.fill();
    cx2.restore();
    if (b.y > H + 30 || b.x < -40 || b.x > W + 40) bits.splice(i, 1);
  }
  requestAnimationFrame(drawBits);
}
requestAnimationFrame(drawBits);

/* ================= 3D tilt: idle sway, drag, device tilt, scroll exit ================= */
const hand3d = $('#hand3d'), stage = $('#stage');
let rx = 0, ry = 0, tx = 0, ty = 0, drag = null, tilt = null, flat = false;
stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ry: ty, rx: tx, moved: 0 }; });
addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
  if (!flat) { ty = clamp(drag.ry + dx * .18, -32, 32); tx = clamp(drag.rx - dy * .1, -18, 18); } });
addEventListener('pointerup', () => { setTimeout(() => { drag = null; }, 0); });
addEventListener('deviceorientation', e => { if (e.gamma == null) return; tilt = { y: clamp(e.gamma * .5, -20, 20), x: clamp((e.beta - 45) * .3, -12, 12) }; });
function loop(now) {
  const t = now / 1000;
  if (!drag) { const iy = flat ? 0 : (tilt ? tilt.y : Math.sin(t * .6) * 9), ix = flat ? 0 : (tilt ? tilt.x : Math.sin(t * .45) * 4 + 6); ty += (iy - ty) * .05; tx += (ix - tx) * .05; }
  ry += (ty - ry) * .15; rx += (tx - rx) * .15;
  hand3d.style.setProperty('--ry', ry.toFixed(2)); hand3d.style.setProperty('--rx', rx.toFixed(2));
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('scroll', () => { const sp = clamp(scrollY / innerHeight, 0, 1); stage.style.setProperty('--sp', sp.toFixed(3)); hand3d.style.setProperty('--sp', sp.toFixed(3)); }, { passive: true });

/* ================= find the hidden name ================= */
const seek = $('#seek'), ring = svg.getElementById('foundRing');
let seeking = false, misses = 0;
seek.addEventListener('click', () => { seeking = true; flat = true; seek.hidden = true; say('Tap the spot where you think his name is hiding'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
svg.addEventListener('click', e => {
  if (!seeking || (drag && drag.moved > 10)) return;
  const b = svg.getBoundingClientRect(), p = { x: (e.clientX - b.left) / b.width * 400, y: (e.clientY - b.top) / b.height * 600 };
  if (Math.hypot(p.x - R_ROOT[0], p.y - R_ROOT[1]) < 36) {
    seeking = false; flat = false;
    ring.setAttribute('cx', R_ROOT[0]); ring.setAttribute('cy', R_ROOT[1]); svg.classList.add('found');
    rTexts[0].style.fill = '#ffe9a0'; rTexts[0].style.filter = 'drop-shadow(0 0 6px #ffd36b)';
    say('Found it! An “R” on her ring finger. Rehan owes Ayesha nothing… this time.');
    burst(e.clientX, e.clientY, 70); chime();
  } else {
    misses++;
    music.sfx((t, tone) => tone(60, t, { dur: .2, vol: .1, partials: [[1, 1], [1.5, .3]] }));
    const msgs = ['Not there… look closer', 'Nope! Keep looking', 'Hint: try the fingers', 'Warmer… it’s on a finger near the middle'];
    say(msgs[Math.min(misses - 1, msgs.length - 1)]);
    if (misses >= 3) { rTexts[0].animate([{ opacity: 1 }, { opacity: .2 }, { opacity: 1 }], { duration: 700, iterations: 2 }); }
  }
});

/* ================= gate & story ================= */
// gate mandala decoration
{ const g = $('#gateMandala'), arr = []; mandala(0, 0, .62, arr, { outer: true });
  g.innerHTML = arr.map(i => `<path d="${i.d}"/>`).join(''); }
// garland strands
{ const lari = $('#lari'), n = small ? 11 : 17;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), edge = Math.abs(u - .5) * 2, el = document.createElement('i');
    el.style.left = `calc(${(u * 100).toFixed(2)}% - 11px)`;
    el.style.setProperty('--h', `${(8 + edge * edge * 30 + rand(0, 4)).toFixed(1)}svh`);
    el.style.setProperty('--d', `${(Math.abs(u - .5) * .8 + rand(0, .2)).toFixed(2)}s`);
    el.style.setProperty('--s', `${rand(2.2, 3.4).toFixed(2)}s`);
    lari.appendChild(el);
  } }

$('#open').addEventListener('click', async () => {
  music.start(); musicBtn.hidden = false;
  if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {});
  $('#gate').classList.add('gone'); body.classList.add('open');
  await wait(1500);
  say('Applying the mehndi…');
  await pipe();
  say('Letting it dry… the longer it stays, the deeper the colour');
  svg.querySelector('.paste').style.stroke = '#6e5a2e';
  await wait(2600);
  say('Scraping off the paste…'); crumbs(small ? 120 : 200);
  await wait(900);
  svg.classList.add('dry'); body.classList.remove('locked'); ambient = true;
  await wait(1600);
  svg.classList.add('deep');
  say('Look how dark it came out. They say that means he’ll love her forever.');
  body.classList.add('ready');
  await wait(2400);
  seek.hidden = false;
});

/* ================= reveal on scroll ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .18 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ================= countdown ================= */
const target = new Date('2027-03-11T20:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].map((n, i) => String(n).padStart(i ? 2 : 2, '0'));
  v.forEach((x, i) => { if (cd[i].textContent !== x) { cd[i].textContent = x; cd[i].classList.remove('tick'); void cd[i].offsetWidth; cd[i].classList.add('tick'); } });
}
count(); setInterval(count, 1000);

/* ================= RSVP ================= */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), ev = [...document.querySelectorAll('fieldset input:checked')].map(i => i.value), n = +$('#f-count').value;
  const err = $('#err');
  if (!name) { err.textContent = 'Please tell us your name.'; $('#f-name').focus(); return; }
  if (!ev.length) { err.textContent = 'Pick at least one event, or we’ll miss you!'; return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, events: ev, guests: n }
  const list = ev.length > 1 ? ev.slice(0, -1).join(', ') + ' and ' + ev.at(-1) : ev[0];
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, we’ve saved ${n > 1 ? n + ' places' : 'a place'} for you at the ${list}. Get your dancing shoes ready!`;
  $('#rsvp').classList.add('sent');
  const r = $('#rsvp').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 80, 90);
  music.sfx((t, tone, noise) => { for (let i = 0; i < 6; i++) dholTreble(t + i * .07, tone, noise, 1.3); dholBass(t + .42, tone, noise, 1.2); clap(t + .42, noise); });
});
})();
