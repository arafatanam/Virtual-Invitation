/* Kinetic — scroll-scrubbed typography. Every scene is driven by how far you've scrolled through it. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ================= music: minimal house, 118 bpm ================= */
const arp = [[60,63,67,70,74],[56,60,63,67,72],[63,67,70,74,79],[58,62,65,70,74]];
const roots = [36, 32, 39, 34];
const music = createMusic({ spb: .127, reverb: .3, volume: .8, play(step, t, tone, noise) {
  const s = step % 16, bar = Math.floor(step / 16) % 4;
  if (s % 4 === 0) tone(36, t, { dur: .28, vol: .38, slide: -22 });
  if (s === 4 || s === 12) noise(t, { dur: .14, vol: .09, freq: 1500, type: 'bandpass', q: .7 });
  if (s % 4 === 2) noise(t, { dur: .05, vol: .05, freq: 9000 });
  if (s % 4 === 2 || s === 15) tone(roots[bar], t, { type: 'sawtooth', dur: .2, vol: .08, cutoff: 380, q: 6 });
  if (s % 2 === 0 || s === 11) { const n = arp[bar][(step >> 1) % 5]; tone(n + 12, t, { type: 'square', dur: .18, vol: .022, cutoff: 1800 + 900 * Math.sin(step / 20) }); }
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
const blip = (m = 84) => { try { music.sfx((t, tone) => tone(m, t, { type: 'triangle', dur: .15, vol: .08 })); } catch (e) {} };

/* ================= split letters ================= */
let ci = 0;
document.querySelectorAll('.row').forEach(r => { r.innerHTML = [...r.textContent].map(c => `<span class="ch" style="--i:${ci++}">${c}</span>`).join(''); });
const chars = [...document.querySelectorAll('.row .ch')];
chars.forEach((c, i) => c.addEventListener('pointerdown', () => { c.classList.remove('jump'); void c.offsetWidth; c.classList.add('jump'); blip(72 + i * 2); }));

/* ================= preloader ================= */
const pre = $('#pre'), preNum = $('#preNum'), preBar = $('#preBar'), go = $('#go');
(async () => {
  const fonts = Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]);
  const t0 = performance.now(), dur = reduce ? 10 : 1900;
  await new Promise(res => (function tick(now) {
    const k = clamp((now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    preNum.textContent = String(Math.round(e * 100)).padStart(3, '0'); preBar.style.width = (e * 100) + '%';
    k < 1 ? requestAnimationFrame(tick) : res();
  })(t0));
  await fonts;
  go.disabled = false; go.textContent = 'Enter ↗';
})();
go.addEventListener('click', () => {
  music.start(); musicBtn.hidden = false;
  $('#wipe').classList.add('run');
  setTimeout(() => pre.classList.add('gone'), 450);
  setTimeout(() => { document.body.classList.add('go'); document.body.classList.remove('locked'); ampIntro.start = performance.now(); }, 900);
});

/* ================= scroll scenes ================= */
const vh = () => innerHeight;
const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - vh())); };
const s1 = $('#s1'), s2 = $('#s2'), s3 = $('#s3'), s4 = $('#s4');
const r1 = $('.r1'), r2 = $('.r2'), amp = $('.amp'), line1 = $('#line1');
const cube = $('#cube'), track = $('#htrack'), cards = [...track.children], hprog = $('#hprog');
const vlines = [...document.querySelectorAll('#vlines span')];
const ampIntro = { start: 0 };
const mvs = [['#mv1', 1, 40], ['#mv2', -1, 55], ['#mv3', 1, 70]].map(([id, dir, sp]) => ({ el: $(id), dir, sp, x: 0 }));
let lastY = scrollY, vel = 0;

function setCubeSize() { cube.style.setProperty('--hz', (cube.offsetWidth / 2) + 'px'); }
setCubeSize(); addEventListener('resize', setCubeSize);

function frame(now) {
  const t = now / 1000;
  vel += ((scrollY - lastY) - vel) * .15; lastY = scrollY;

  // 1 — names split apart, the ampersand grows, the line wipes in
  const p1 = prog(s1);
  const ai = ampIntro.start ? clamp((now - ampIntro.start - 600) / 1000) : 0;
  const aie = ai === 0 ? 0 : 1 - Math.pow(1 - ai, 3) * Math.cos(ai * 6) ;
  r1.style.transform = `translateX(${-smooth(.05, .6, p1) * 70}vw) translateY(${-smooth(.3, .8, p1) * 12}svh)`;
  r2.style.transform = `translateX(${smooth(.05, .6, p1) * 70}vw) translateY(${smooth(.3, .8, p1) * 12}svh)`;
  const as = aie * (1 + smooth(.05, .55, p1) * 2.4) * (1 - smooth(.55, .8, p1));
  amp.style.transform = `translate(-50%, -52%) scale(${as}) rotate(${(1 - aie) * -40 + p1 * 200}deg)`;
  line1.style.clipPath = `inset(0 ${(1 - smooth(.5, .85, p1)) * 100}% 0 0)`;
  chars.forEach((c, i) => c.style.setProperty('--w', Math.round(560 + 240 * Math.sin(t * 1.6 + i * .7))));

  // 2 — date cube
  const p2 = prog(s2);
  cube.style.transform = `rotateX(${-18 + p2 * 360 + Math.sin(t) * 3}deg) rotateY(${28 + p2 * 450}deg)`;

  // 3 — horizontal timeline with 3D tilt
  const p3 = prog(s3);
  const maxX = Math.max(0, track.scrollWidth - innerWidth + 40);
  track.style.transform = `translateX(${-p3 * maxX}px)`;
  hprog.style.transform = `scaleX(${p3})`;
  cards.forEach(c => {
    const r = c.getBoundingClientRect(), d = ((r.left + r.width / 2) - innerWidth / 2) / innerWidth;
    c.style.transform = `rotateY(${clamp(d, -1, 1) * -28}deg) scale(${1 - Math.min(.12, Math.abs(d) * .12)})`;
  });

  // 4 — venue lines slide in from alternating sides
  const p4 = prog(s4);
  vlines.forEach((l, i) => { const k = smooth(i * .1, i * .1 + .4, p4); l.style.transform = `translateX(${(i % 2 ? 1 : -1) * (1 - k) * 110}vw)`; });

  // marquees: constant drift, boosted by scroll velocity
  mvs.forEach(m => {
    const half = m.el.scrollWidth / 2 || 1;
    m.x += (m.sp + Math.abs(vel) * 6) * m.dir * .016;
    m.x = ((m.x % half) + half) % half;
    m.el.style.transform = `translateX(${-m.x}px)`;
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ================= numbers count up ================= */
const nio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target; el.classList.add('in'); nio.unobserve(el);
  const b = el.querySelector('b'), to = +b.dataset.to; if (!to) return;
  const t0 = performance.now(), dur = 1400;
  (function tick(now) { const k = clamp((now - t0) / dur); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(tick); })(t0);
}), { threshold: .4 });
document.querySelectorAll('.n').forEach(n => nio.observe(n));

/* ================= countdown ================= */
const target = new Date('2027-06-05T16:00:00+01:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function count() { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(d, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s); }
count(); setInterval(count, 1000);

/* ================= RSVP: a burst of letters ================= */
function burst(words) {
  const box = $('#burst'), parts = [];
  const glyphs = words.join('').split('');
  for (let i = 0; i < 46; i++) {
    const s = document.createElement('span'); s.textContent = glyphs[i % glyphs.length];
    s.style.fontSize = (24 + Math.random() * 60) + 'px'; if (i % 3 === 0) s.style.color = '#121212';
    box.appendChild(s);
    parts.push({ el: s, x: innerWidth / 2, y: innerHeight * .7, vx: (Math.random() - .5) * 16, vy: -(Math.random() * 18 + 10), r: 0, vr: (Math.random() - .5) * 20 });
  }
  const t0 = performance.now();
  (function step(now) {
    parts.forEach(p => { p.vy += .6; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`; });
    if (now - t0 < 3200) requestAnimationFrame(step); else box.innerHTML = '';
  })(t0);
}
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Type your name first.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  const yay = $('#yay'); yay.textContent = yes ? 'YAY!' : 'OH NO';
  yay.innerHTML = [...yay.textContent].map((c, i) => `<span class="ch" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  $('#thanks-msg').textContent = yes ? `See you on the dance floor, ${first}.` : `We’ll miss you, ${first}. Thanks for letting us know.`;
  $('#rsvp').classList.add('done');
  // NOTE: connect a form backend here to collect replies.
  if (yes) { burst(['YAY', 'LOVE', '♥']); [72, 76, 79, 84].forEach((m, i) => setTimeout(() => blip(m), i * 90)); }
});
})();
