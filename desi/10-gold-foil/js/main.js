/* Gold Foil — break the gold seal, the flap lifts, the card slides out of the emerald envelope, and the full stationery
   suite is dealt onto the table as you scroll. The gold foil and the paper sheen follow the tilt of your phone. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const root = document.documentElement;

/* ================= music: a piano waltz with strings ================= */
const piano = (m, t, tone, v = 1, dur = 2.2) => tone(m, t, { dur, vol: .055 * v, attack: .004, partials: [[1, 1, 1], [2, .45, .7], [3, .18, .5], [4, .07, .3]] });
const CH = [[50, [62, 66, 69]], [47, [62, 66, 71]], [43, [62, 67, 71]], [45, [61, 64, 69]]];
const MEL = { 0: 78, 4: 76, 6: 74, 10: 76, 12: 79, 16: 78, 18: 76, 22: 73, 24: 74, 26: 78, 28: 81, 30: 83, 34: 81, 36: 79, 38: 78, 40: 76, 42: 76, 44: 73, 46: 74 };
const music = createMusic({ spb: .19, reverb: .5, volume: .8, fadeIn: 2.5, play(step, t, tone) {
  const bar = Math.floor(step / 6), k = step % 6, [bass, ch] = CH[bar % 4];
  if (k === 0) { piano(bass - 12, t, tone, 1.1, 2.6); ch.forEach(n => tone(n - 12, t, { type: 'sawtooth', dur: 1.25, vol: .008, cutoff: 1300, attack: .25, sustain: true })); }
  if (k === 2 || k === 4) ch.forEach(n => piano(n - 12, t, tone, .42, 1));
  const m = MEL[step % 48]; if (m) piano(m, t, tone, 1, 2.6);
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= light: device tilt, pointer, or a slow automatic sweep ================= */
let tx = 0, ty = 0, cx = 0, cy = 0, lastInput = -1e9;
addEventListener('deviceorientation', e => { if (e.gamma == null) return; tx = clamp(e.gamma / 30, -1, 1); ty = clamp((e.beta - 50) / 30, -1, 1); lastInput = performance.now(); });
addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; lastInput = performance.now(); });
function light(now) {
  if (now - lastInput > 2500) { tx = Math.sin(now / 2200) * .8; ty = Math.sin(now / 3100) * .4; }
  cx += (tx - cx) * .08; cy += (ty - cy) * .08;
  root.style.setProperty('--fx', (50 + cx * 38).toFixed(1));
  root.style.setProperty('--ry', (cx * 7).toFixed(2) + 'deg'); root.style.setProperty('--rx', (-cy * 5).toFixed(2) + 'deg');
  requestAnimationFrame(light);
}
requestAnimationFrame(light);

/* ================= drifting gold dust ================= */
const cv = $('#dust'), x = cv.getContext('2d');
let W, H, D;
function size() { D = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; x.setTransform(D, 0, 0, D, 0, 0); }
size(); addEventListener('resize', size);
const motes = Array.from({ length: innerWidth < 600 ? 50 : 90 }, () => ({ x: rand(0, innerWidth), y: rand(0, innerHeight), r: rand(.5, 2), vx: rand(-.1, .1), vy: rand(-.25, -.05), p: rand(0, 6) }));
(function dust() {
  x.clearRect(0, 0, W, H);
  motes.forEach(m => { m.x += m.vx + cx * .2; m.y += m.vy; m.p += .03; if (m.y < -5) { m.y = H + 5; m.x = rand(0, W); }
    const a = .25 + .6 * Math.pow(.5 + .5 * Math.sin(m.p), 3);
    x.fillStyle = `rgba(240,214,150,${a})`; x.beginPath(); x.arc(m.x, m.y, m.r, 0, 7); x.fill(); });
  requestAnimationFrame(dust);
})();

/* ================= opening the envelope ================= */
const gate = $('#gate');
$('#seal').addEventListener('click', async () => {
  if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {});
  music.sfx((t, tone, noise) => { noise(t, { dur: .07, vol: .18, freq: 2400, type: 'bandpass', q: 1 }); noise(t + .25, { dur: .9, vol: .05, freq: 3000, type: 'bandpass', q: .5 }); noise(t + 1, { dur: 1.1, vol: .04, freq: 1800, type: 'bandpass', q: .5 }); });
  gate.classList.add('open');
  music.start(); musicBtn.hidden = false;
  await wait(2300);
  gate.classList.add('away');
  document.body.classList.remove('locked');
  window.scrollTo(0, 0);
  const hero = document.querySelector('.suite.hero'); hero.classList.add('in', 'settling'); setTimeout(() => hero.classList.remove('settling'), 1400);
});

/* ================= the suite is dealt as you scroll ================= */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting || !gate.classList.contains('away')) return;
  e.target.classList.add('in', 'settling'); setTimeout(() => e.target.classList.remove('settling'), 1400); io.unobserve(e.target);
  music.sfx((t, tone, noise) => noise(t, { dur: .5, vol: .035, freq: 2600, type: 'bandpass', q: .6 }));
}), { threshold: .2 });
document.querySelectorAll('.suite:not(.hero)').forEach(s => io.observe(s));

/* ================= countdown ================= */
const target = new Date('2028-03-04T19:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);

/* ================= reply card ================= */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), yes = $('#f-yes').checked, n = +$('#f-count').value, err = $('#err');
  if (!name) { err.textContent = 'Kindly add your name.'; $('#f-name').focus(); return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, attending: yes, guests: n }
  $('#thanks-msg').textContent = yes
    ? `Dear ${name.split(' ')[0]}, we are delighted. ${n > 1 ? n + ' places have' : 'A place has'} been reserved in your name.`
    : `Dear ${name.split(' ')[0]}, you will be missed. Thank you for letting us know, and please keep us in your duas.`;
  $('.reply').classList.add('sent');
  music.sfx((t, tone) => [74, 78, 81, 86].forEach((m, i) => piano(m, t + i * .12, tone, 1.2, 2.4)));
});
})();
