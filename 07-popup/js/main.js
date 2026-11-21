/* Pop-up — each chapter is a paper pop-up spread that unfolds (and folds away) as you scroll. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const back = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/* ================= music: plucked strings & tambourine ================= */
const prog = [[45,[57,60,64]],[43,[55,59,62]],[41,[53,57,60]],[40,[52,56,59]]];
const mel = [76,0,77,76,74,0,72,0, 74,0,72,71,72,0,0,0, 72,0,74,72,71,0,69,0, 71,0,72,71,68,0,0,0];
const pluck = { type: 'sawtooth', cutoff: 2200, attack: .004, partials: [[1,1,1],[2,.25,.5]] };
const music = createMusic({ spb: .19, reverb: .35, play(step, t, tone, noise) {
  const bar = Math.floor(step / 8) % 4, s = step % 8, [bass, c] = prog[bar];
  if (s === 0 || s === 3 || s === 6) tone(bass, t, { type: 'triangle', dur: .5, vol: .12 });
  if (s % 2 === 1) tone(c[(s >> 1) % 3] + 12, t, { ...pluck, dur: .4, vol: .03 });
  const m = mel[step % 32];
  if (m) { tone(m, t, { ...pluck, dur: .7, vol: .05 }); tone(m, t + .045, { ...pluck, dur: .5, vol: .025 }); }  // tremolo-ish
  if (s === 2 || s === 6) noise(t, { dur: .12, vol: .03, freq: 6000 });
  if (s === 4) noise(t, { dur: .05, vol: .02, freq: 9000 });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
function paper() { try { music.sfx((t, tone, noise) => noise(t, { dur: .25, vol: .05, freq: 2500, type: 'bandpass', q: .7 })); } catch (e) {} }

/* ================= build bits ================= */
// calendar
(() => {
  let h = ['M','T','W','T','F','S','S'].map(d => `<span class="dow">${d}</span>`).join('');
  const first = (new Date(2027, 8, 1).getDay() + 6) % 7;
  for (let i = 0; i < first; i++) h += '<span></span>';
  for (let d = 1; d <= 30; d++) h += `<span class="${d === 4 ? 'hit' : ''}">${d}</span>`;
  $('#cal').innerHTML = h;
})();
// string-light bulbs along the wire curve (same curve as the SVG path)
(() => {
  const b = $('#bulbs'); let h = '';
  const q = (t, p0, p1, p2) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  for (let i = 0; i <= 14; i++) {
    const u = i / 14; let x, y;
    if (u < .5) { const t = u * 2; x = q(t, 0, 100, 200); y = q(t, 10, 70, 20); } else { const t = (u - .5) * 2; x = q(t, 200, 300, 400); y = q(t, 20, -30, 14); }
    h += `<i style="left:${x / 4}%;top:${y / 80 * 100}%;animation-delay:${-i * .37}s"></i>`;
  }
  b.innerHTML = h;
})();
document.querySelectorAll('.wl').forEach(el => el.style.setProperty('--z', el.dataset.z || 0));

/* ================= scroll-driven unfolding ================= */
const scenes = [...document.querySelectorAll('.scene')].map(el => ({
  el, wall: el.querySelector('.wall'), wls: [...el.querySelectorAll('.wl')],
  pops: [...el.querySelectorAll('.pop')].map(p => ({ el: p, s: +p.dataset.s || .1 })), last: -1, wasOpen: false
}));
let intro = 0, opened = false;
function update() {
  const vh = innerHeight;
  scenes.forEach((sc, i) => {
    const r = sc.el.getBoundingClientRect();
    const span = r.height - vh;
    let p = clamp(-r.top / span);
    if (i === 0) p = Math.max(p, 0);
    // open over the first ~35%, stay open, fold away over the last ~18%
    let open = ease(clamp(p / .34));
    if (i === 0) open = Math.max(open, intro) ;
    const close = ease(clamp((p - .82) / .18));
    const k = clamp(open - close);
    if (Math.abs(k - sc.last) < .0005) return;
    sc.last = k;
    sc.wall.style.setProperty('--k', k.toFixed(4));
    sc.wls.forEach(w => w.style.setProperty('--k', k.toFixed(4)));
    sc.pops.forEach(pp => {
      // each piece rises with its own delay and a little overshoot
      const local = i === 0 && intro > 0 && p < .05 ? clamp((intro - pp.s) / .45) : clamp((p - pp.s * .9) / .22);
      const kk = clamp(back(local) - close * 1.2, -.1, 1.08);
      pp.el.style.setProperty('--k', (opened ? kk : 0).toFixed(4));
    });
    const on = k > .35;
    sc.el.classList.toggle('on', on && opened);
    if (on && !sc.wasOpen && opened) paper();
    sc.wasOpen = on;
  });
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
addEventListener('resize', update);
update();

/* ================= opening ================= */
$('#open').addEventListener('click', () => {
  music.start(); musicBtn.hidden = false;
  const gate = $('#gate'); gate.classList.add('opening'); paper();
  opened = true;
  const t0 = performance.now();
  (function anim(now) {
    intro = clamp((now - t0 - 900) / 1800);
    scenes[0].last = -1; update();
    if (intro < 1) requestAnimationFrame(anim);
  })(t0);
  setTimeout(() => { gate.classList.add('gone'); document.body.classList.remove('locked'); }, reduce ? 0 : 1500);
});

/* ================= postcard RSVP ================= */
const pc = $('#postcard');
pc.addEventListener('click', e => {
  if (pc.classList.contains('flip')) return;
  pc.classList.add('flip'); $('#rsvp-scene').classList.add('flipped'); paper();
  setTimeout(() => $('#f-name').focus({ preventScroll: true }), 900);
});
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Please write your name on the card.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#postmark').classList.add('hit');
  try { music.sfx((t, tone, noise) => noise(t, { dur: .18, vol: .12, freq: 400, type: 'lowpass' })); } catch (e) {}
  // NOTE: connect a form backend here to collect replies.
  setTimeout(() => pc.classList.add('sent'), 700);
  setTimeout(() => {
    $('#thanks-msg').textContent = yes ? `${first}, your postcard arrived! We can’t wait to see you in Bodrum.` : `We’ll miss you, ${first}. Thank you for writing.`;
    pc.querySelector('.pc-back').classList.add('done');
    pc.classList.remove('sent'); pc.style.animation = 'none'; void pc.offsetWidth; pc.style.animation = '';
  }, 2300);
});

/* countdown */
const target = new Date('2027-09-04T18:00:00+03:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function count() { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(d, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s); }
count(); setInterval(count, 1000);
})();
