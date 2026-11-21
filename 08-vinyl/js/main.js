/* The Wedding Album — sleeve → turntable. The record spins, the needle drops, the EQ dances to
   real audio levels, and you can scratch the record with your finger. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ================= music: a warm funk groove (≈104 bpm, 16th notes) ================= */
const chords = [[50,[60,65,69,72]],[55,[59,65,69,71]],[52,[59,62,67,71]],[57,[61,64,67,71]]]; // Dm9 · G13 · Em7 · A7
const bassLine = [0,0,null,12,null,0,null,7, 0,null,10,null,12,null,7,5];
const lick = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,  0,0,74,0, 77,0,79,0, 81,0,79,77, 0,74,0,0,
              0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,  76,0,74,0, 72,0,74,0, 76,0,0,79, 0,0,0,0];
const rhodes = [[1,1,1],[2,.22,.6],[3.01,.08,.3]];
const music = createMusic({ spb: .144, reverb: .3, volume: .9, play(step, t, tone, noise) {
  const s = step % 16, bar = Math.floor(step / 16) % 4, [root, ch] = chords[bar];
  if (s === 0 || s === 8 || s === 10) tone(36, t, { dur: .32, vol: .45, slide: -20 });            // kick
  if (s === 4 || s === 12) { noise(t, { dur: .16, vol: .12, freq: 1800, type: 'bandpass', q: .6 }); tone(55, t, { dur: .08, vol: .06, type: 'triangle' }); } // snare
  if (s % 2 === 0) noise(t, { dur: s % 4 === 2 ? .09 : .04, vol: .035, freq: 8000 });              // hats
  const b = bassLine[s]; if (b !== null) tone(root - 12 + b, t, { type: 'sawtooth', dur: .22, vol: .09, cutoff: 520, q: 4 });
  if (s === 2 || s === 7 || s === 11) ch.forEach(n => tone(n, t, { dur: .5, vol: .028, partials: rhodes }));
  const m = lick[step % 64]; if (m) tone(m, t, { type: 'square', dur: .25, vol: .025, cutoff: 2400 });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); state.target = on ? 1 : 0; });
function crackle(len = 1.2) { try { music.sfx((t, tone, noise) => { for (let i = 0; i < 26; i++) noise(t + Math.random() * len, { dur: .015, vol: .08 * Math.random(), freq: 3000 }); }); } catch (e) {} }

/* ================= EQ bars ================= */
const N = 24, eq = $('#eq'), cols = ['#d9622b', '#e8a93a', '#e98b8b', '#2f7f7a'];
eq.innerHTML = Array.from({ length: N }, (_, i) => `<i style="--c:${cols[Math.floor(i / N * 4)]}"></i>`).join('');
const bars = [...eq.children];

/* ================= spin, scratch & tonearm ================= */
const disc = $('#disc'), arm = $('#arm'), label = disc.querySelector('.label');
const state = { angle: 0, speed: 0, target: 0, drag: false, lastA: 0, lastT: 0, vel: 0, armT: 0 };
const angleAt = e => { const r = disc.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
disc.addEventListener('pointerdown', e => {
  state.drag = true; state.lastA = angleAt(e); state.lastT = performance.now(); disc.setPointerCapture(e.pointerId); e.preventDefault();
});
disc.addEventListener('pointermove', e => {
  if (!state.drag) return;
  const a = angleAt(e); let d = a - state.lastA; if (d > 180) d -= 360; if (d < -180) d += 360;
  const now = performance.now(), dt = Math.max(1, now - state.lastT);
  state.angle += d; state.vel = d / dt * 1000; state.lastA = a; state.lastT = now;
  if (Math.abs(d) > 2) try { music.sfx((t, tone, noise) => noise(t, { dur: .07, vol: Math.min(.25, Math.abs(d) / 60), freq: 400 + Math.min(4000, Math.abs(state.vel) * 3), type: 'bandpass', q: 2.5 })); } catch (e) {}
});
const release = () => { state.drag = false; };
disc.addEventListener('pointerup', release); disc.addEventListener('pointercancel', release);

let last = performance.now(), lastScroll = scrollY, scrollBoost = 0;
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  // scrolling gives the platter a little nudge
  scrollBoost += ((scrollY - lastScroll) * .02 - scrollBoost) * .1; lastScroll = scrollY;
  if (!state.drag) {
    state.speed += (state.target - state.speed) * Math.min(1, dt * 1.6);
    state.angle += (state.speed * 200 + scrollBoost * 60) * dt;
  }
  disc.style.transform = `rotate(${state.angle}deg)`;
  const lvl = music.level();
  label.style.transform = `scale(${1 + lvl * .06})`;
  const b = music.bands(N);
  bars.forEach((el, i) => el.style.transform = `scaleY(${Math.max(.06, b[i] * 1.15)})`);
  if (state.target) { state.armT += dt; arm.style.transform = `rotate(${4 + Math.min(10, state.armT * .05)}deg)`; }
  // wavy text marquee
  wave.setAttribute('startOffset', (-((now / 120) % 50)).toFixed(2) + '%');
  requestAnimationFrame(loop);
}
const wave = $('#wavetext');
requestAnimationFrame(loop);

/* ================= opening ================= */
$('#play').addEventListener('click', async () => {
  const gate = $('#gate'); gate.classList.add('playing');
  crackle(.6);
  await wait(1500);
  document.body.classList.add('live');
  gate.classList.add('gone');
  await wait(600);
  arm.style.transform = 'rotate(4deg)';
  await wait(1500);
  crackle(1.5);
  music.start(); musicBtn.hidden = false; state.target = 1;
  document.body.classList.remove('locked');
});

/* ================= reveals & now-playing ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));
const tracks = [...document.querySelectorAll('#tracklist li')];
tracks.forEach((li, i) => li.style.transitionDelay = (i * 80) + 'ms');
let ti = 0;
setInterval(() => { tracks.forEach((li, i) => li.classList.toggle('now', i === ti)); ti = (ti + 1) % tracks.length; }, 2200);

/* poster tilts toward your finger */
const poster = document.querySelector('.poster');
poster.addEventListener('pointermove', e => { const r = poster.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  poster.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`; });
poster.addEventListener('pointerleave', () => poster.style.transform = '');

/* countdown */
const target = new Date('2027-10-09T17:00:00-05:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function count() { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(d, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s); }
count(); setInterval(count, 1000);

/* RSVP */
function flyNotes(n) {
  const fly = $('#fly'), glyphs = ['♪', '♫', '♬', '✦', '❤'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.textContent = glyphs[i % glyphs.length];
    s.style.left = Math.random() * 100 + 'vw'; s.style.color = cols[i % 4];
    s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    s.style.animationDelay = Math.random() * .6 + 's'; s.style.fontSize = (20 + Math.random() * 26) + 'px';
    fly.appendChild(s); setTimeout(() => s.remove(), 3400);
  }
}
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Please add your name so we can put you on the list.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#ok-name').textContent = first;
  $('#thanks-msg').textContent = yes ? `You’re on the list, ${first}. ${$('#f-song').value.trim() ? 'Your song request is in the queue.' : 'See you on the dance floor.'}` : `We’ll miss you, ${first}. Thanks for letting us know.`;
  $('#rsvp').classList.add('done');
  // NOTE: connect a form backend here to collect replies.
  if (yes) flyNotes(40);
});
})();
