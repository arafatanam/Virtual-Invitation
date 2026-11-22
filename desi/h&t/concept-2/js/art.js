/* Illustrations for Hamza & Tahia, concept 2. Every scene is drawn here as SVG (390 × 844 portrait canvas).
   Heavy, static scenery is turned into <img> data-URLs (cheap to zoom and pan on phones);
   the moving parts (shutters, boat, walking couple, swing) stay as small inline SVGs. */
window.ART = (() => {
'use strict';
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let R = rng(1);
const r = (a, b) => a + R() * (b - a);
const pk = a => a[Math.floor(R() * a.length)];
const n1 = v => Math.round(v * 10) / 10;
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
let NIGHT = 0;
const C = h => NIGHT ? mix(h, '#18245f', NIGHT) : h;     // night-shift a colour

const W = 390, H = 844;
const doc = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${inner}</svg>`;
const url = (inner, defs) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(doc(inner, defs));
const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (id, stops) => `<radialGradient id="${id}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`;

/* ---------------- botanicals ---------------- */
const LEAF = ['#2d6a35', '#3a7d3c', '#4b8f43', '#25592d'];
const MAG = ['#a8104c', '#c4166a', '#d82a7c', '#e54d95', '#ef74ad'];
const ROSES = ['#b5122b', '#d01f3c', '#e8496b', '#f28aa2', '#fbe9e4'];
function bougain(cx, cy, rx, ry, n, pal = MAG) {
  let s = '';
  for (let i = 0; i < n * .7; i++) { const a = r(0, 6.283), d = Math.sqrt(R()), x = n1(cx + Math.cos(a) * rx * d * 1.12), y = n1(cy + Math.sin(a) * ry * d * 1.12);
    s += `<ellipse cx="${x}" cy="${y}" rx="${n1(r(4, 7.5))}" ry="${n1(r(2, 3.5))}" transform="rotate(${n1(r(0, 180))} ${x} ${y})" fill="${C(pk(LEAF))}"/>`; }
  for (let i = 0; i < n; i++) { const a = r(0, 6.283), d = Math.pow(R(), .6), x = n1(cx + Math.cos(a) * rx * d), y = n1(cy + Math.sin(a) * ry * d);
    s += `<g transform="translate(${x} ${y}) rotate(${n1(r(0, 120))}) scale(${r(.75, 1.3).toFixed(2)})" fill="${C(pk(pal))}"><ellipse cy="-2.6" rx="2.7" ry="3.3"/><ellipse cy="-2.6" rx="2.7" ry="3.3" transform="rotate(120)"/><ellipse cy="-2.6" rx="2.7" ry="3.3" transform="rotate(240)"/><circle r=".9" fill="${C('#fff2c4')}"/></g>`; }
  return s;
}
function leaf(x, y, len, w, ang, fill) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(ang)})"><path d="M0 0 Q${n1(w)} ${n1(-len * .45)} 0 ${n1(-len)} Q${n1(-w)} ${n1(-len * .45)} 0 0Z" fill="${fill}"/><path d="M0 0 L0 ${n1(-len * .93)}" stroke="rgba(0,0,0,.2)" stroke-width="1.2"/></g>`;
}
function tropic(x, y, n, len, a0, spread, pal = ['#1f5a2a', '#2a6d32', '#357d3a', '#1a4b24']) {
  let s = ''; for (let i = 0; i < n; i++) { const L = len * r(.55, 1); s += leaf(x + r(-8, 8), y, L, L * r(.2, .3), a0 + r(-spread, spread), C(pk(pal))); } return s;
}
function blossom(x, y, rad, col, ctr = '#f4c84a') {
  let s = `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(r(0, 72))})">`;
  for (let k = 0; k < 5; k++) s += `<ellipse cy="${n1(-rad * .55)}" rx="${n1(rad * .42)}" ry="${n1(rad * .6)}" transform="rotate(${k * 72})" fill="${col}"/>`;
  return s + `<circle r="${n1(rad * .22)}" fill="${ctr}"/></g>`;
}
function rose(x, y, rad, col) {
  return `<g transform="translate(${n1(x)} ${n1(y)})"><circle r="${n1(rad)}" fill="${col}"/><circle r="${n1(rad * .72)}" fill="${mix(col, '#000000', .18)}"/><path d="M${n1(-rad * .5)} 0 A${n1(rad * .5)} ${n1(rad * .5)} 0 1 1 ${n1(rad * .3)} ${n1(rad * .3)}" fill="none" stroke="${mix(col, '#ffffff', .3)}" stroke-width="${n1(rad * .18)}"/><circle r="${n1(rad * .22)}" fill="${mix(col, '#000000', .3)}"/></g>`;
}
function garland(x, y0, len, step = 7) {  // a hanging strand of jasmine ending in a rose
  let s = `<path d="M${x} ${y0} L${x} ${y0 + len}" stroke="#7a8f4a" stroke-width=".8"/>`;
  for (let d = 0; d < len; d += step) s += `<circle cx="${n1(x + Math.sin(d * .3) * .6)}" cy="${n1(y0 + d)}" r="${n1(r(2.3, 3))}" fill="${pk(['#fffaf0', '#fbf3e3', '#fff'])}" stroke="#e4d9c4" stroke-width=".5"/>`;
  return s + rose(x, y0 + len + 4, 5.5, pk(ROSES.slice(0, 3)));
}

/* ---------------- people ---------------- */
const PDEFS = lg('wSaree', [[0, '#d8183a'], [1, '#a00b24']], 1, 0) + lg('mSher', [[0, '#fbf7ee'], [.5, '#f2ebdd'], [1, '#e2d7c4']], 1, 0);
const GOLD = '#d9a531', SKIN = '#c68a64', HAIR = '#1b130f';
function gajra(cx, cy, rr, n = 12) { let s = ''; for (let k = 0; k < n; k++) { const a = k / n * 6.283; s += `<circle cx="${n1(cx + Math.cos(a) * rr)}" cy="${n1(cy + Math.sin(a) * rr * .8)}" r="2.6" fill="#fffaf0" stroke="#e6dcc8" stroke-width=".6"/>`; } return s; }
function womanBack(veil) {        // standing, seen from behind; feet at 0,0, ~320 tall
  let s = `<path d="M-34 -248 Q-47 -200 -45 -150 L-35 -150 Q-36 -200 -24 -240Z" fill="${SKIN}"/><path d="M34 -248 Q47 -200 45 -150 L35 -150 Q36 -200 24 -240Z" fill="${SKIN}"/>`;
  s += `<rect x="-47" y="-163" width="12" height="4" rx="2" fill="${GOLD}"/><rect x="-47" y="-158" width="12" height="3" rx="1.5" fill="#b0102a"/><rect x="35" y="-163" width="12" height="4" rx="2" fill="${GOLD}"/><rect x="35" y="-158" width="12" height="3" rx="1.5" fill="#b0102a"/>`;
  s += `<ellipse cx="-40" cy="-145" rx="6" ry="8" fill="${SKIN}"/><ellipse cx="40" cy="-145" rx="6" ry="8" fill="${SKIN}"/>`;
  s += `<path d="M-34 -166 Q-46 -80 -64 0 L64 0 Q46 -80 34 -166Z" fill="url(#wSaree)"/>`;
  [-24, -10, 4, 18].forEach(k => { s += `<path d="M${k * .5} -164 Q${k * .9} -80 ${k * 1.5} -2" stroke="#8a0820" stroke-opacity=".45" stroke-width="1.6" fill="none"/>`; });
  s += `<path d="M-64 0 L64 0 L61 -15 Q0 -10 -61 -15Z" fill="${GOLD}"/><path d="M-61 -15 Q0 -10 61 -15" stroke="#a8781c" stroke-width="1" fill="none"/>`;
  for (let x = -56; x <= 56; x += 8) s += `<circle cx="${x}" cy="-7" r="1.6" fill="#8a0820"/>`;
  s += `<path d="M-30 -191 L30 -191 L33 -166 L-33 -166Z" fill="${SKIN}"/><path d="M-36 -252 Q0 -262 36 -252 L31 -190 L-31 -190Z" fill="#8f0a22"/>`;
  s += `<path d="M-38 -254 L-14 -259 L44 -168 L50 -58 L30 -60 L22 -160Z" fill="#c8102e"/><path d="M-14 -259 L44 -168 L50 -58" stroke="${GOLD}" stroke-width="4" fill="none"/><path d="M-38 -254 L22 -160 L30 -60" stroke="${GOLD}" stroke-width="3" fill="none"/>`;
  s += `<rect x="-7" y="-274" width="14" height="20" fill="${SKIN}"/><ellipse cx="0" cy="-293" rx="19" ry="22" fill="${HAIR}"/>`;
  if (veil) {
    s += `<path d="M0 -323 Q-27 -321 -31 -291 Q-41 -258 -53 -200 Q-62 -150 -60 -108 L60 -108 Q62 -150 53 -200 Q41 -258 31 -291 Q27 -321 0 -323Z" fill="#c8102e" fill-opacity=".86"/>`;
    s += `<path d="M-60 -108 Q-62 -150 -53 -200 Q-41 -258 -31 -291 Q-27 -321 0 -323 Q27 -321 31 -291 Q41 -258 53 -200 Q62 -150 60 -108" stroke="${GOLD}" stroke-width="3.5" fill="none"/><path d="M-60 -110 L60 -110" stroke="${GOLD}" stroke-width="5"/>`;
    for (let i = 0; i < 26; i++) s += `<circle cx="${n1(r(-45, 45))}" cy="${n1(r(-290, -125))}" r="1.3" fill="${GOLD}" opacity=".8"/>`;
  } else s += `<ellipse cx="0" cy="-283" rx="13" ry="11" fill="#261a14"/>` + gajra(0, -283, 14);
  return s;
}
function manBack() {               // groom in an ivory sherwani with a maroon stole
  const iv = '#f5efe3', ivd = '#d9cdb9', sk = '#b67a57';
  let s = `<path d="M-24 -120 L-8 -120 L-10 0 L-22 0Z" fill="#ece2cd"/><path d="M8 -120 L24 -120 L22 0 L10 0Z" fill="#ece2cd"/>`;
  s += `<ellipse cx="-16" cy="0" rx="10" ry="4" fill="#c99a3a"/><ellipse cx="16" cy="0" rx="10" ry="4" fill="#c99a3a"/>`;
  s += `<path d="M-40 -258 Q-53 -200 -49 -140 L-38 -140 Q-40 -200 -28 -248Z" fill="${iv}" stroke="${ivd}"/><path d="M40 -258 Q53 -200 49 -140 L38 -140 Q40 -200 28 -248Z" fill="${iv}" stroke="${ivd}"/>`;
  s += `<ellipse cx="-44" cy="-133" rx="6" ry="8" fill="${sk}"/><ellipse cx="44" cy="-133" rx="6" ry="8" fill="${sk}"/>`;
  s += `<path d="M-40 -261 Q0 -271 40 -261 L43 -95 Q0 -88 -43 -95Z" fill="url(#mSher)"/><path d="M0 -264 L0 -92" stroke="${ivd}" stroke-width="1.2"/>`;
  s += `<path d="M-43 -95 Q0 -88 43 -95 L43 -103 Q0 -96 -43 -103Z" fill="#cfa64a"/>`;
  s += `<path d="M28 -263 L42 -257 L-22 -128 L-36 -131Z" fill="#7d1328"/><path d="M42 -257 L-22 -128 M28 -263 L-36 -131" stroke="${GOLD}" stroke-width="2"/>`;
  s += `<rect x="-12" y="-272" width="24" height="10" rx="2" fill="${iv}" stroke="${ivd}"/><rect x="-7" y="-281" width="14" height="10" fill="${sk}"/>`;
  s += `<ellipse cx="-19" cy="-296" rx="3.5" ry="6" fill="${sk}"/><ellipse cx="19" cy="-296" rx="3.5" ry="6" fill="${sk}"/><ellipse cx="0" cy="-299" rx="19" ry="22" fill="${HAIR}"/>`;
  return s;
}
function coupleSeated() {          // seated side by side, from behind, her head on his shoulder
  let s = `<path d="M-64 0 L-60 -70 Q-58 -93 -33 -97 Q-8 -93 -5 -70 L-2 0Z" fill="#f5efe3"/><path d="M-33 -96 L-33 0" stroke="#ddd2bf" stroke-width="1"/>`;
  s += `<rect x="-39" y="-112" width="12" height="12" fill="#b67a57"/><ellipse cx="-48" cy="-118" rx="3" ry="5" fill="#b67a57"/><ellipse cx="-18" cy="-118" rx="3" ry="5" fill="#b67a57"/><ellipse cx="-33" cy="-121" rx="15" ry="17" fill="${HAIR}"/>`;
  s += `<path d="M2 0 L6 -60 Q10 -82 28 -85 Q46 -82 49 -60 L54 0Z" fill="#8f0a22"/><path d="M4 -40 L50 -70 L54 -20 L8 0Z" fill="#c8102e"/><path d="M4 -40 L50 -70" stroke="${GOLD}" stroke-width="3"/>`;
  s += `<path d="M-8 -80 Q20 -70 46 -48 L44 -40 Q18 -60 -10 -68Z" fill="#f5efe3"/><ellipse cx="46" cy="-44" rx="5" ry="6" fill="#b67a57"/>`;
  s += `<g transform="rotate(-14 28 -92)"><rect x="22" y="-100" width="11" height="10" fill="${SKIN}"/><ellipse cx="28" cy="-108" rx="13" ry="15" fill="${HAIR}"/><ellipse cx="29" cy="-99" rx="9" ry="7" fill="#261a14"/>${gajra(29, -99, 10, 10)}</g>`;
  return s;
}

/* ---------------- architecture helpers ---------------- */
function archPts(cx, spring, apex, hw, lobes = 7, amp = 9) {
  const k = .3, Rr = hw * (1 + k), c0 = cx + hw * k, phiEnd = Math.acos(-hw * k / Rr), sy = (spring - apex) / (Rr * Math.sin(phiEnd)), pts = [];
  for (let i = 0; i <= 70; i++) {
    const t = i / 70, phi = Math.PI - (Math.PI - phiEnd) * t;
    let x = c0 + Rr * Math.cos(phi), y = spring - Rr * Math.sin(phi) * sy;
    const cusp = amp * Math.pow(1 - Math.abs(Math.sin(lobes * Math.PI * t)), 3), dx = cx - x, dy = spring - y, L = Math.hypot(dx, dy) || 1;
    pts.push([x + dx / L * cusp, y + dy / L * cusp]);
  }
  return [...pts, ...pts.slice(0, -1).reverse().map(([x, y]) => [2 * cx - x, y])];
}
const archPath = (cx, spring, apex, hw, bottom, lobes, amp) => `M${cx - hw} ${bottom} ` + archPts(cx, spring, apex, hw, lobes, amp).map(([x, y]) => `L${n1(x)} ${n1(y)}`).join(' ') + ` L${cx + hw} ${bottom}Z`;
function lantern(x, y, s = 1, lit = true) {     // a small brass lantern (Moroccan style), base at x,y
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  if (lit) g += `<circle cy="-16" r="26" fill="url(#lglow)"/>`;
  g += `<path d="M-9 0 L9 0 L7 -4 L-7 -4Z" fill="#9a6b25"/><path d="M-7 -4 L-8 -26 L8 -26 L7 -4Z" fill="${lit ? '#ffd98a' : '#6b4a2a'}"/>`;
  g += `<path d="M-8 -26 L-8 -4 M0 -26 L0 -4 M8 -26 L8 -4 M-8 -15 L8 -15" stroke="#9a6b25" stroke-width="1.3"/><path d="M-10 -26 L10 -26 L4 -34 L-4 -34Z" fill="#b07d2c"/><path d="M-2 -34 L0 -40 L2 -34Z" fill="#b07d2c"/></g>`;
  return g;
}

/* ================= scene 1–2: the lane (day / night) ================= */
function city() {
  let s = '';
  for (let i = 0; i < 16; i++) { const w = r(14, 32), x = r(100, 278), h = r(50, 135), y = 700 - h, c = pk(['#e9b896', '#dba79c', '#f0cfa6', '#cdb6a2', '#e3a988', '#d8bfa8']);
    s += `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="${C(c)}"/><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="3" fill="${C(mix(c, '#ffffff', .25))}"/>`;
    for (let yy = y + 10; yy < 690; yy += 13) for (let xx = x + 4; xx < x + w - 5; xx += 8) s += `<rect x="${n1(xx)}" y="${n1(yy)}" width="3.4" height="5" fill="${NIGHT && R() < .55 ? '#ffd27a' : C('#8a6656')}" opacity="${NIGHT ? .95 : .45}"/>`; }
  s += `<rect x="193" y="520" width="24" height="180" fill="${C('#c56f55')}"/><path d="M189 522 L205 470 L221 522Z" fill="${C('#9c4a3a')}"/><path d="M205 470 L205 455" stroke="${C('#9c4a3a')}" stroke-width="2"/>`;
  s += `<circle cx="205" cy="546" r="7" fill="${NIGHT ? '#ffe7a8' : '#f7ead0'}"/><path d="M205 546 L205 541 M205 546 L208 547" stroke="#6b4030" stroke-width="1"/>`;
  for (let yy = 570; yy < 690; yy += 18) s += `<rect x="201" y="${yy}" width="8" height="10" rx="4" fill="${NIGHT ? '#ffcf70' : C('#8f4a3a')}"/>`;
  s += `<rect x="118" y="622" width="44" height="78" fill="${C('#efd9bf')}"/><path d="M118 624 Q118 586 140 578 Q162 586 162 624Z" fill="${C('#f4e4cb')}"/><path d="M140 578 L140 566" stroke="${C('#c9a46a')}" stroke-width="2"/>`;
  s += `<rect x="106" y="586" width="7" height="114" fill="${C('#efd9bf')}"/><path d="M105 588 Q109.5 574 114 588Z" fill="${C('#e8cfaf')}"/><rect x="167" y="586" width="7" height="114" fill="${C('#efd9bf')}"/><path d="M166 588 Q170.5 574 175 588Z" fill="${C('#e8cfaf')}"/>`;
  for (let i = 0; i < 3; i++) s += `<path d="M${124 + i * 13} 700 V672 Q${128 + i * 13} 664 ${132 + i * 13} 672 V700Z" fill="${NIGHT ? '#ffcf70' : C('#b98e6e')}"/>`;
  return s;
}
function lane(night) {
  R = rng(11); NIGHT = night ? .58 : 0;
  const defs = lg('sky', night ? [[0, '#0a1438'], [.45, '#172a6c'], [.8, '#2d4290'], [1, '#4a5aa0']] : [[0, '#f09a62'], [.35, '#f7bf83'], [.62, '#fbdcaa'], [1, '#f9cf98']])
    + lg('peach', [[0, C('#e48f66')], [1, C('#f2b38b')]], 1, 0) + lg('cream', [[0, C('#ece1d0')], [1, C('#f9f3ea')]], 1, 0) + lg('road', [[0, C('#e2c29a')], [1, C('#c49b72')]])
    + rg('sun', [[0, '#fff6d8', 1], [.3, '#ffd78a', .9], [1, '#ffb36b', 0]]) + rg('moon', [[0, '#fffbe8', 1], [.25, '#fff3c4', .55], [1, '#9fb4ff', 0]])
    + rg('lglow', [[0, '#ffe7a0', .95], [.45, '#ffc15a', .35], [1, '#ff9f3a', 0]]) + rg('wglow', [[0, '#ffd27a', .9], [1, '#ffb050', 0]]) + PDEFS;
  let s = `<rect width="390" height="844" fill="url(#sky)"/>`;
  if (night) {
    for (let i = 0; i < 70; i++) s += `<circle cx="${n1(r(90, 300))}" cy="${n1(r(10, 520))}" r="${n1(r(.5, 1.4))}" fill="#fff" opacity="${n1(r(.35, 1))}"/>`;
    s += `<circle cx="180" cy="168" r="70" fill="url(#moon)"/><circle cx="180" cy="168" r="15" fill="#fff9e6"/><circle cx="175" cy="164" r="3" fill="#efe6cc"/><circle cx="185" cy="173" r="2" fill="#efe6cc"/>`;
  } else {
    s += `<circle cx="196" cy="610" r="120" fill="url(#sun)"/><circle cx="196" cy="610" r="24" fill="#fff0c8"/>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${n1(r(110, 280))}" cy="${n1(r(260, 470))}" rx="${n1(r(20, 45))}" ry="${n1(r(3, 6))}" fill="#fff4e0" opacity=".45"/>`;
    for (let i = 0; i < 7; i++) { const x = r(140, 260), y = r(250, 380); s += `<path d="M${n1(x)} ${n1(y)} q3.5 -3.5 7 0 q3.5 -3.5 7 0" stroke="#7a5040" stroke-width="1.2" fill="none"/>`; }
  }
  s += city();
  // lane & cobbles
  s += `<path d="M150 700 L242 700 L300 844 L92 844Z" fill="url(#road)"/>`;
  for (let j = 0; j < 12; j++) { const t = Math.pow(j / 11, 1.5), y = 704 + t * 136, half = 46 + t * 104, rw = 4 + t * 12;
    for (let x = 196 - half; x < 196 + half; x += rw * 1.9) s += `<rect x="${n1(x + (j % 2) * rw * .9)}" y="${n1(y)}" width="${n1(rw * 1.6)}" height="${n1(2 + t * 6)}" rx="${n1(1 + t * 3)}" fill="${C('#b88d66')}" opacity=".55"/>`; }
  s += `<path d="M168 700 V648 M224 700 V648" stroke="${C('#3d332e')}" stroke-width="2"/>` + lantern(168, 650, .55, night) + lantern(224, 650, .55, night);
  // left building
  s += `<polygon points="138,40 162,82 162,702 138,742" fill="${C('#c97b58')}"/><rect width="140" height="844" fill="url(#peach)"/>`;
  [200, 470].forEach(y => { s += `<rect x="0" y="${y}" width="142" height="12" fill="${C('#f6cfae')}"/>`; for (let x = 2; x < 140; x += 8) s += `<rect x="${x}" y="${y + 12}" width="4" height="5" fill="${C('#d6966f')}"/>`; });
  s += `<path d="M32 180 V110 Q32 78 70 78 Q108 78 108 110 V180Z" fill="${C('#2f7550')}"/><path d="M70 80 V180" stroke="${C('#1f5a3c')}" stroke-width="2"/>`;
  for (let y = 100; y < 178; y += 7) s += `<path d="M36 ${y} H104" stroke="${C('#245e40')}" stroke-width="1.4"/>`;
  s += `<path d="M18 432 V332 Q18 284 68 284 Q118 284 118 332 V432Z" fill="${night ? '#f0b25a' : C('#5a382a')}"/>`;
  if (night) s += `<ellipse cx="68" cy="370" rx="60" ry="70" fill="url(#wglow)" opacity=".6"/>`;
  s += `<path d="M18 432 V332 Q18 284 68 284 Q118 284 118 332 V432" stroke="${C('#f7d7bb')}" stroke-width="5" fill="none"/>`;
  s += `<path d="M18 300 L-6 290 L-6 440 L18 432Z" fill="${C('#2f7550')}"/><path d="M118 300 L136 292 L136 440 L118 432Z" fill="${C('#2f7550')}"/>`;
  for (let y = 304; y < 430; y += 8) s += `<path d="M-4 ${y} L16 ${y + 2} M120 ${y + 2} L134 ${y}" stroke="${C('#245e40')}" stroke-width="1.3"/>`;
  s += hamzaWin(70, 360);
  s += `<rect x="6" y="430" width="128" height="9" fill="${C('#f2d3b5')}"/>`;
  for (let x = 12; x < 132; x += 10) s += `<rect x="${x}" y="439" width="5" height="34" rx="2" fill="${C('#f7efe4')}"/>`;
  s += `<rect x="6" y="472" width="128" height="7" fill="${C('#e9c3a2')}"/>`;
  s += `<path d="M28 844 V700 Q28 640 70 640 Q112 640 112 700 V844Z" fill="${C('#6b3b22')}"/><path d="M70 642 V844" stroke="${C('#4e2a17')}" stroke-width="2"/><path d="M28 844 V700 Q28 640 70 640 Q112 640 112 700 V844" stroke="${C('#f3c9a5')}" stroke-width="5" fill="none"/>`;
  s += lantern(136, 590, .9, night);
  s += bougain(30, 495, 34, 26, 70) + bougain(126, 498, 18, 20, 30) + bougain(150, 270, 14, 60, 50) + bougain(60, 20, 90, 34, 120);
  // right building (window opening only — the shutters & Tahia are animated on top)
  s += `<polygon points="232,90 252,60 252,742 232,705" fill="${C('#d6c8b3')}"/><rect x="250" width="140" height="844" fill="url(#cream)"/>`;
  [[150, 14], [500, 10]].forEach(([y, h]) => { s += `<rect x="248" y="${y}" width="142" height="${h}" fill="${C('#fffaf2')}"/><rect x="248" y="${y + h}" width="142" height="3" fill="${C('#d9ccb6')}"/>`; for (let x = 252; x < 390; x += 9) s += `<circle cx="${x}" cy="${y + h + 7}" r="2.4" fill="${C('#e3d6c1')}"/>`; });
  s += `<path d="M268 246 L324 216 L380 246Z" fill="${C('#fffaf2')}" stroke="${C('#d9ccb6')}" stroke-width="2"/><path d="M296 240 Q324 222 352 240" stroke="${C('#d9ccb6')}" fill="none" stroke-width="1.5"/>`;
  s += `<rect x="270" y="246" width="108" height="170" fill="${C('#fffaf2')}"/><rect x="278" y="252" width="92" height="160" fill="${C('#3b2c28')}"/>`;
  s += `<rect x="266" y="414" width="116" height="7" fill="${C('#efe5d3')}"/>`;
  for (let x = 270; x < 380; x += 12) s += `<path d="M${x} 421 V456 M${x} 438 q6 -8 12 0" stroke="${C('#2b2b33')}" stroke-width="1.6" fill="none"/>`;
  s += `<rect x="266" y="455" width="116" height="4" fill="${C('#2b2b33')}"/>`;
  [286, 352].forEach(x => { s += `<path d="M${x - 12} 466 L${x + 12} 466 L${x + 8} 486 L${x - 8} 486Z" fill="${C('#b55a3c')}"/>` + bougain(x, 460, 16, 9, 22); for (let k = 0; k < 6; k++) s += leaf(x + r(-12, 12), 486, r(14, 26), 4, 180 + r(-25, 25), C(pk(LEAF))); });
  s += `<rect x="284" y="560" width="80" height="112" fill="${C('#fffaf2')}"/>`;
  [0, 1].forEach(k => { s += `<rect x="${290 + k * 35}" y="566" width="33" height="100" fill="${C('#1f5cc4')}"/>`; for (let y = 572; y < 664; y += 6) s += `<path d="M${293 + k * 35} ${y} H${320 + k * 35}" stroke="${C('#164a9e')}" stroke-width="1.4"/>`; });
  s += `<path d="M268 844 V770 Q268 735 324 735 Q380 735 380 770 V844Z" fill="${C('#4a3328')}"/>`;
  s += bougain(370, 60, 42, 80, 110) + bougain(384, 250, 22, 110, 80) + bougain(300, 140, 60, 18, 60) + bougain(384, 640, 18, 90, 50);
  // foreground foliage
  s += tropic(10, 860, 10, 210, -10, 50) + tropic(380, 860, 10, 210, 10, 50) + tropic(120, 870, 5, 120, 20, 40) + tropic(280, 870, 5, 120, -20, 40);
  s += bougain(60, 790, 40, 24, 40) + bougain(345, 780, 36, 22, 36);
  return url(s, defs);
}
function hamzaWin(x, y) {          // groom leaning out of his window, facing right (toward her)
  const sk = C('#b67a57'), hr = '#17110e';
  let s = `<path d="M${x - 36} ${y + 74} L${x - 31} ${y + 30} Q${x - 22} ${y + 19} ${x - 6} ${y + 18} L${x + 14} ${y + 19} Q${x + 31} ${y + 24} ${x + 35} ${y + 42} L${x + 40} ${y + 74}Z" fill="${C('#f6f2ea')}"/>`;
  s += `<path d="M${x + 4} ${y + 20} L${x + 6} ${y + 50}" stroke="${C('#d8cfc0')}" stroke-width="1.5"/><circle cx="${x + 5}" cy="${y + 28}" r="1.3" fill="${C('#c9a45a')}"/><circle cx="${x + 5.5}" cy="${y + 37}" r="1.3" fill="${C('#c9a45a')}"/>`;
  s += `<path d="M${x + 12} ${y + 44} L${x + 58} ${y + 62} L${x + 55} ${y + 73} L${x + 8} ${y + 58}Z" fill="${C('#f6f2ea')}" stroke="${C('#ddd3c4')}"/><ellipse cx="${x + 63}" cy="${y + 68}" rx="8" ry="6" fill="${sk}"/>`;
  s += `<rect x="${x - 5}" y="${y + 10}" width="13" height="12" fill="${sk}"/><ellipse cx="${x + 3}" cy="${y}" rx="15" ry="18" fill="${sk}"/>`;
  s += `<path d="M${x + 15} ${y - 4} L${x + 21} ${y + 5} L${x + 16} ${y + 6}" fill="${sk}" stroke="${C('#9a6446')}" stroke-width="1"/>`;
  s += `<path d="M${x - 13} ${y + 8} Q${x - 18} ${y - 20} ${x + 3} ${y - 21} Q${x + 19} ${y - 20} ${x + 18} ${y - 7} Q${x + 8} ${y - 12} ${x - 1} ${y - 9} Q${x - 5} ${y - 1} ${x - 7} ${y + 9}Z" fill="${hr}"/>`;
  s += `<path d="M${x - 9} ${y + 6} Q${x + 2} ${y + 20} ${x + 15} ${y + 11}" stroke="${hr}" stroke-width="3" fill="none" opacity=".8"/>`;
  s += `<ellipse cx="${x - 5}" cy="${y + 2}" rx="3" ry="5" fill="${C('#a36a4b')}"/><circle cx="${x + 10}" cy="${y - 2}" r="1.7" fill="${hr}"/><path d="M${x + 6} ${y - 7} q4 -2 8 0" stroke="${hr}" stroke-width="1.4" fill="none"/><path d="M${x + 9} ${y + 9} q3 2 6 0" stroke="${C('#7a3f2e')}" stroke-width="1.3" fill="none"/>`;
  return s;
}
/* the right window: lit interior, Tahia, and the two blue shutters (inline, animated) */
function laneWindow() {
  let s = `<defs>${rg('tw', [[0, '#ffe2a0'], [1, '#f0a850']])}${rg('twg', [[0, '#ffd27a', .85], [1, '#ffb050', 0]])}</defs>`;
  s += `<g id="winLit" opacity="0"><ellipse cx="324" cy="330" rx="110" ry="130" fill="url(#twg)"/><rect x="278" y="252" width="92" height="160" fill="url(#tw)"/><path d="M290 252 V300 Q300 286 310 300 V252Z" fill="#e89a48" opacity=".5"/></g>`;
  const sk = '#c68a64', x = 330, y = 345;
  s += `<g id="tahia" opacity="0">`;
  s += `<path d="M${x + 36} ${y + 70} L${x + 31} ${y + 30} Q${x + 22} ${y + 19} ${x + 6} ${y + 18} L${x - 12} ${y + 19} Q${x - 28} ${y + 24} ${x - 33} ${y + 42} L${x - 37} ${y + 70}Z" fill="#c8102e"/>`;
  s += `<path d="M${x + 2} ${y + 19} L${x + 16} ${y + 17} L${x + 38} ${y + 66} L${x + 26} ${y + 70}Z" fill="#a50d26"/><path d="M${x + 2} ${y + 19} L${x + 26} ${y + 70} M${x + 16} ${y + 17} L${x + 38} ${y + 66}" stroke="${GOLD}" stroke-width="2.5"/>`;
  s += `<path d="M${x - 12} ${y + 44} L${x - 56} ${y + 60} L${x - 53} ${y + 70} L${x - 8} ${y + 57}Z" fill="${sk}"/><rect x="${x - 26}" y="${y + 50}" width="4" height="12" rx="1.5" fill="${GOLD}" transform="rotate(-20 ${x - 24} ${y + 56})"/><rect x="${x - 31}" y="${y + 52}" width="3" height="12" rx="1.5" fill="#b0102a" transform="rotate(-20 ${x - 29} ${y + 58})"/>`;
  s += `<ellipse cx="${x - 60}" cy="${y + 65}" rx="7" ry="5.5" fill="${sk}"/>`;
  s += `<rect x="${x - 7}" y="${y + 9}" width="12" height="12" fill="${sk}"/><ellipse cx="${x - 3}" cy="${y}" rx="14" ry="17" fill="${sk}"/>`;
  s += `<path d="M${x - 14} ${y - 4} L${x - 19} ${y + 4} L${x - 14} ${y + 5}" fill="${sk}" stroke="#a36a4b" stroke-width="1"/>`;
  s += `<path d="M${x + 12} ${y + 10} Q${x + 17} ${y - 19} ${x - 3} ${y - 19} Q${x - 18} ${y - 18} ${x - 16} ${y - 6} Q${x - 7} ${y - 11} ${x + 1} ${y - 8} Q${x + 4} ${y} ${x + 5} ${y + 10}Z" fill="${HAIR}"/>`;
  s += `<ellipse cx="${x + 15}" cy="${y + 2}" rx="9" ry="8" fill="#261a14"/>${gajra(x + 15, y + 2, 10, 10)}`;
  s += `<circle cx="${x + 2}" cy="${y + 9}" r="2.2" fill="${GOLD}"/><circle cx="${x - 9}" cy="${y - 2}" r="1.6" fill="${HAIR}"/><path d="M${x - 13} ${y - 7} q4 -2 7 0" stroke="${HAIR}" stroke-width="1.3" fill="none"/><path d="M${x - 14} ${y + 9} q3 1.5 5 0" stroke="#b0303a" stroke-width="1.6" fill="none"/>`;
  s += `</g>`;
  const panel = (x0, id, hinge) => { let p = `<g id="${id}" data-hinge="${hinge}"><rect x="${x0}" y="252" width="46" height="160" fill="#1f5cc4" stroke="#174a9e" stroke-width="2"/>`;
    for (let yy = 262; yy < 405; yy += 6) p += `<path d="M${x0 + 4} ${yy} H${x0 + 42}" stroke="#164a9e" stroke-width="1.5"/>`;
    return p + `<rect x="${x0 + 4}" y="326" width="38" height="4" fill="#2a6bd6"/></g>`; };
  s += panel(278, 'shL', 278) + panel(324, 'shR', 370);
  s += `<rect x="274" y="248" width="100" height="168" fill="none" stroke="#fffaf2" stroke-width="5"/>`;
  return s;
}

/* ================= scene 3: Tahia's room ================= */
function room() {
  R = rng(21); NIGHT = 0;
  const defs = lg('wall', [[0, '#9c3426'], [1, '#c0563a']]) + lg('floor', [[0, '#7a4126'], [1, '#55291a']]) + rg('cg', [[0, '#ffe3a0', .7], [1, '#ffb050', 0]])
    + rg('lglow', [[0, '#ffe7a0', .9], [1, '#ff9f3a', 0]]) + PDEFS
    + `<pattern id="dm" width="48" height="56" patternUnits="userSpaceOnUse"><path d="M24 6 C30 16 38 18 38 28 C38 38 30 40 24 50 C18 40 10 38 10 28 C10 18 18 16 24 6Z" fill="#000" opacity=".07"/><circle cx="0" cy="0" r="3" fill="#000" opacity=".06"/><circle cx="48" cy="56" r="3" fill="#000" opacity=".06"/></pattern>`
    + `<pattern id="cp" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11 2 L20 11 L11 20 L2 11Z" fill="#1f2f5a" opacity=".55"/><circle cx="11" cy="11" r="2.2" fill="#d9a531"/></pattern>`;
  let s = `<rect width="390" height="620" fill="url(#wall)"/><rect width="390" height="620" fill="url(#dm)"/><rect width="390" height="26" fill="#7c241a"/><rect y="26" width="390" height="3" fill="#d9a531"/>`;
  s += `<circle cx="262" cy="90" r="120" fill="url(#cg)"/><path d="M262 0 V46" stroke="#b88a35" stroke-width="2"/><ellipse cx="262" cy="74" rx="10" ry="20" fill="#d4a53c"/>`;
  [-56, -30, 0, 30, 56].forEach(d => { s += `<path d="M262 82 Q${262 + d * .5} 104 ${262 + d} 92 L${262 + d} 80" stroke="#c99a3a" stroke-width="2.4" fill="none"/><rect x="${262 + d - 2.5}" y="66" width="5" height="14" fill="#fbf3e1"/><circle cx="${262 + d}" cy="60" r="10" fill="url(#lglow)"/><ellipse cx="${262 + d}" cy="62" rx="2" ry="4" fill="#fff4c8"/>`;
    for (let k = 1; k < 4; k++) s += `<path d="M${262 + d * (k / 4)} ${92 + Math.sin(k / 4 * 3.14) * 8} l2 4 l-2 4 l-2 -4z" fill="#eaf4ff" opacity=".9"/>`; });
  for (let k = 0; k < 9; k++) s += `<path d="M${246 + k * 4} 96 l2 6 l-2 6 l-2 -6z" fill="#eaf4ff"/>`;
  s += `<rect x="34" y="150" width="80" height="96" fill="#c9993f"/><rect x="40" y="156" width="68" height="84" fill="#f4e3c8"/><path d="M60 236 L66 212 L82 212 L88 236Z" fill="#2f5d8a"/>` + bougain(74, 196, 22, 18, 36);
  s += `<rect x="300" y="200" width="56" height="70" fill="#c9993f"/><rect x="305" y="205" width="46" height="60" fill="#e8dcc4"/><path d="M308 262 Q328 220 348 262Z" fill="#6f8f5a"/><circle cx="337" cy="220" r="6" fill="#f3b25a"/>`;
  s += `<rect y="600" width="390" height="244" fill="url(#floor)"/>`;
  for (let y = 612; y < 844; y += 22) s += `<path d="M0 ${y} H390" stroke="#3d1d10" stroke-opacity=".35"/>`;
  s += `<path d="M0 700 L390 650 L390 844 L0 844Z" fill="#8e1a22"/><path d="M14 712 L376 666 L376 844 L14 844Z" fill="url(#cp)" stroke="#1f2f5a" stroke-width="8"/><path d="M14 712 L376 666 L376 844 L14 844Z" fill="#a52630" opacity=".55"/>`;
  s += `<path d="M330 690 L370 690 L364 640 L336 640Z" fill="#b8862f"/><rect x="332" y="634" width="36" height="8" rx="3" fill="#d4a53c"/>` + tropic(350, 640, 12, 150, 0, 70);
  // Tahia, large, from behind: bun with gajra, red saree, arm reaching for the card
  const sk = SKIN;
  s += `<path d="M175 572 Q205 600 222 640 L236 632 Q222 590 192 560Z" fill="${sk}"/><path d="M222 640 Q238 610 246 580 L234 574 Q228 602 214 630Z" fill="${sk}"/>`;
  s += `<rect x="212" y="616" width="16" height="7" rx="3" fill="${GOLD}" transform="rotate(-62 220 620)"/><rect x="216" y="606" width="16" height="5" rx="2" fill="#b0102a" transform="rotate(-62 224 609)"/><rect x="219" y="598" width="16" height="5" rx="2" fill="${GOLD}" transform="rotate(-62 227 601)"/>`;
  s += `<path d="M14 572 Q100 540 192 560 L210 600 L190 844 L20 844Z" fill="#8f0a22"/><path d="M90 546 Q100 552 112 546" stroke="${GOLD}" stroke-width="3" fill="none"/>`;
  s += `<path d="M-10 590 Q20 556 66 548 L120 844 L-10 844Z" fill="#c8102e"/><path d="M66 548 L120 844" stroke="${GOLD}" stroke-width="9"/><path d="M66 548 L120 844" stroke="#a8781c" stroke-width="2" stroke-dasharray="3 5"/>`;
  for (let i = 0; i < 18; i++) s += `<circle cx="${n1(r(0, 95))}" cy="${n1(r(600, 840))}" r="1.8" fill="${GOLD}" opacity=".75"/>`;
  s += `<rect x="82" y="508" width="34" height="44" fill="${sk}"/><ellipse cx="99" cy="466" rx="44" ry="50" fill="${HAIR}"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${70 + i * 7} 425 Q${66 + i * 7} 470 ${80 + i * 4} 505" stroke="#3a2a22" stroke-width="1.2" fill="none" opacity=".6"/>`;
  s += `<ellipse cx="100" cy="510" rx="27" ry="22" fill="#241914"/>` + gajra(100, 510, 27, 16).replace(/r="2.6"/g, 'r="5"');
  s += `<circle cx="58" cy="486" r="4" fill="${GOLD}"/><circle cx="58" cy="494" r="3" fill="${GOLD}"/>`;
  return url(s, defs);
}

/* ================= scene 4: the river from above ================= */
function boatTop() {               // seen from above: she sits in front, he behind; both face up-river
  let s = `<path d="M0 -80 C26 -44 26 44 0 80 C-26 44 -26 -44 0 -80Z" fill="#6b3519"/><path d="M0 -70 C19 -40 19 40 0 70 C-19 40 -19 -40 0 -70Z" fill="#9a5226"/>`;
  s += `<path d="M-17 -44 H17 M-18 4 H18 M-14 50 H14" stroke="#5a2b12" stroke-width="4"/>`;
  // her: saree spread over the seat, shoulders, then head with a bun and a ring of jasmine
  s += `<ellipse cx="0" cy="-20" rx="15" ry="13" fill="#c8102e"/><path d="M-15 -20 Q0 -4 15 -20" stroke="${GOLD}" stroke-width="2.4" fill="none"/>`;
  s += `<path d="M-12 -30 Q0 -38 12 -30 L10 -24 Q0 -28 -10 -24Z" fill="#9e0c25"/><path d="M-12 -30 Q-17 -24 -15 -16 M12 -30 Q17 -24 15 -16" stroke="${SKIN}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`;
  s += `<circle cx="0" cy="-36" r="6" fill="${HAIR}"/><circle cx="0" cy="-29.5" r="3.6" fill="#2a1c15"/>`;
  for (let k = 0; k < 7; k++) { const a = Math.PI * (.05 + k / 6 * .9); s += `<circle cx="${n1(Math.cos(a) * 5.2)}" cy="${n1(-29.5 + Math.sin(a) * 4.4)}" r="1.4" fill="#fffaf0"/>`; }
  // him: ivory kurta shoulders and dark hair
  s += `<ellipse cx="0" cy="26" rx="16" ry="11" fill="#f5efe3"/><path d="M-16 26 Q0 34 16 26" stroke="#ddd2bf" stroke-width="1.5" fill="none"/><path d="M-14 20 Q-19 10 -12 2 M14 20 Q19 10 12 2" stroke="#f5efe3" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  s += `<circle cx="0" cy="16" r="6.5" fill="${HAIR}"/>`;
  s += `<path d="M-24 66 Q-34 116 -60 166 M24 66 Q34 116 60 166" stroke="#ffffff" stroke-opacity=".55" stroke-width="2.4" fill="none"/><path d="M-10 -84 Q0 -92 10 -84" stroke="#ffffff" stroke-opacity=".6" stroke-width="2" fill="none"/>`;
  return s;
}
function bank(side) {
  let s = '', x0 = side < 0 ? 0 : 390;
  const edge = []; for (let y = -10; y <= 860; y += 30) edge.push([x0 + side * -(62 + Math.sin(y * .02 + side) * 18 + r(-6, 6)), y]);
  s += `<path d="M${x0} -10 ${edge.map(([x, y]) => `L${n1(x)} ${y}`).join(' ')} L${x0} 860Z" fill="#2c6a2e"/>`;
  for (let i = 0; i < 70; i++) { const [ex, ey] = pk(edge); s += leaf(ex + side * r(0, 50), ey + r(-20, 20), r(20, 40), r(6, 11), r(0, 360), pk(['#2f7a33', '#3f8f3c', '#4fa046', '#256a2c'])); }
  for (let i = 0; i < 28; i++) { const [ex, ey] = pk(edge); s += blossom(ex + side * r(5, 45), ey + r(-15, 15), r(5, 9), pk(['#f2a2c0', '#ffffff', '#f6d36b', '#ef6f9a'])); }
  for (let i = 0; i < 24; i++) { const [ex, ey] = pk(edge), cx = ex - side * r(4, 40), cy = ey + r(-15, 15), rr = r(7, 14), a = r(0, 6.28);
    s += `<path d="M${n1(cx)} ${n1(cy)} L${n1(cx + Math.cos(a) * rr)} ${n1(cy + Math.sin(a) * rr)} A${n1(rr)} ${n1(rr)} 0 1 1 ${n1(cx + Math.cos(a + .5) * rr)} ${n1(cy + Math.sin(a + .5) * rr)}Z" fill="${pk(['#5aa84a', '#6cb655', '#4c9a40'])}"/>`;
    if (R() < .3) s += blossom(cx, cy, r(5, 8), pk(['#f7b6cf', '#ffffff']), '#f2cf5a'); }
  return s;
}
function river(withBoat) {
  R = rng(31); NIGHT = 0;
  const defs = lg('water', [[0, '#0f86b5'], [.5, '#2cc3dc'], [1, '#0f86b5']], 1, 0) + rg('shine', [[0, '#ffffff', .55], [1, '#bdf6ff', 0]]) + PDEFS;
  let s = `<rect width="390" height="844" fill="url(#water)"/><ellipse cx="195" cy="380" rx="90" ry="460" fill="url(#shine)"/>`;
  for (let i = 0; i < 90; i++) { const x = 195 + (R() - .5) * (R() < .7 ? 120 : 260), y = r(0, 844); s += `<path d="M${n1(x)} ${n1(y)} q6 -3 12 0" stroke="#e8fbff" stroke-width="${n1(r(.8, 2))}" fill="none" opacity="${n1(r(.3, .8))}"/>`; }
  s += bank(-1) + bank(1);
  if (withBoat) s += `<g transform="translate(195 430) scale(.9)">${boatTop()}</g>`;
  return url(s, defs);
}
function glitter() {
  R = rng(41); let s = '';
  for (let i = 0; i < 110; i++) { const x = 195 + (R() - .5) * (R() < .75 ? 110 : 230), y = r(0, 844), z = r(.6, 1.8);
    s += `<path class="gl" style="animation-delay:-${r(0, 3).toFixed(2)}s" d="M${n1(x)} ${n1(y - 3 * z)} L${n1(x + 1.2 * z)} ${n1(y)} L${n1(x)} ${n1(y + 3 * z)} L${n1(x - 1.2 * z)} ${n1(y)}Z" fill="#fff"/>`; }
  return s;
}

/* ================= scene 5: the ghat at night ================= */
function ghat() {
  R = rng(51); NIGHT = 0;
  const defs = lg('nsky', [[0, '#0e1a4a'], [1, '#23336e']]) + lg('wat', [[0, '#1a3f86'], [1, '#0b1f52']]) + lg('step', [[0, '#cbb69c'], [1, '#a8927a']])
    + rg('lglow', [[0, '#ffe7a0', .95], [.45, '#ffc15a', .35], [1, '#ff9f3a', 0]]) + rg('ag', [[0, '#ffd27a', .8], [1, '#ffb050', 0]]) + PDEFS;
  let s = `<rect width="390" height="360" fill="url(#nsky)"/>`;
  for (let i = 0; i < 30; i++) s += `<circle cx="${n1(r(0, 390))}" cy="${n1(r(80, 200))}" r="${n1(r(.5, 1.2))}" fill="#fff" opacity=".7"/>`;
  // palace facade with lit arches
  s += `<rect x="0" y="150" width="390" height="220" fill="#d9b99a"/><rect x="0" y="150" width="390" height="10" fill="#f0d9bd"/>`;
  s += `<path d="M150 150 Q150 96 195 84 Q240 96 240 150Z" fill="#e8cdb0"/><path d="M195 84 V66" stroke="#c9a46a" stroke-width="3"/>`;
  for (let i = 0; i < 6; i++) { const x = 12 + i * 64; s += `<ellipse cx="${x + 20}" cy="${260}" rx="40" ry="60" fill="url(#ag)" opacity=".7"/><path d="M${x} 340 V230 Q${x} 196 ${x + 20} 190 Q${x + 40} 196 ${x + 40} 230 V340Z" fill="#ffcf6e"/><path d="M${x} 340 V230 Q${x} 196 ${x + 20} 190 Q${x + 40} 196 ${x + 40} 230 V340" stroke="#f3e2c8" stroke-width="4" fill="none"/>`; }
  // steps
  let y = 360; for (let k = 0; k < 14; k++) { const h = 8 + k * 1.6; s += `<rect x="0" y="${n1(y)}" width="390" height="${n1(h)}" fill="url(#step)"/><rect x="0" y="${n1(y)}" width="390" height="2" fill="#e5d3bb"/>`; y += h; }
  [[60, 372], [140, 372], [250, 372], [330, 372], [30, 420], [120, 430], [270, 430], [360, 420], [80, 500], [196, 490], [310, 500], [40, 580], [150, 586], [240, 586], [350, 580]].forEach(([x, yy]) => { s += lantern(x, yy, .9 + (yy - 360) / 400); });
  // water & reflections
  s += `<rect y="${n1(y)}" width="390" height="${n1(844 - y)}" fill="url(#wat)"/>`;
  for (let i = 0; i < 26; i++) { const x = r(10, 380); s += `<path d="M${n1(x)} ${n1(y + 6)} q4 40 -2 80 q-4 40 2 90" stroke="#ffcf6b" stroke-width="${n1(r(2, 6))}" opacity="${n1(r(.15, .45))}" fill="none"/>`; }
  for (let i = 0; i < 40; i++) { const x = r(0, 390), yy = r(y + 10, 844); s += `<path d="M${n1(x)} ${n1(yy)} h${n1(r(8, 30))}" stroke="#9ec0ff" stroke-width="1.2" opacity=".35"/>`; }
  // bougainvillea canopy
  s += bougain(70, 30, 120, 60, 170) + bougain(330, 40, 110, 55, 160) + bougain(195, 0, 110, 26, 90) + bougain(14, 230, 22, 90, 60) + bougain(378, 240, 22, 90, 60);
  // the couple in the boat, from behind
  s += `<g transform="translate(170 790)"><path d="M-140 -40 Q-96 14 0 16 Q96 14 140 -40 Q70 -14 0 -14 Q-70 -14 -140 -40Z" fill="#5a2b12"/><path d="M-130 -36 Q-70 -10 0 -10 Q70 -10 130 -36" stroke="#8a4a22" stroke-width="5" fill="none"/>
    <path d="M-120 -30 Q-70 4 0 6 Q70 4 120 -30" stroke="#3e1c0b" stroke-width="2" fill="none"/><g transform="translate(0 -10) scale(.95)">${coupleSeated()}</g></g>`;
  s += `<path d="M30 800 Q170 830 320 796" stroke="#ffd98a" stroke-opacity=".3" stroke-width="3" fill="none"/>`;
  return url(s, defs);
}

/* ================= scenes 6 & 8: the arch over the lake palace ================= */
function view() {
  let s = `<rect width="390" height="844" fill="url(#ssky)"/>`;
  for (let i = 0; i < 6; i++) s += `<ellipse cx="${n1(r(40, 350))}" cy="${n1(r(180, 470))}" rx="${n1(r(30, 70))}" ry="${n1(r(3, 7))}" fill="#ffd2b8" opacity=".45"/>`;
  s += `<circle cx="195" cy="560" r="90" fill="url(#sung)"/><circle cx="195" cy="560" r="20" fill="#fff1c2"/>`;
  const palace = (op, flip) => {
    let p = `<g opacity="${op}"${flip ? ' transform="translate(0 1120) scale(1 -1)"' : ''}>`;
    p += `<rect x="100" y="512" width="190" height="48" fill="#cf8a76"/><rect x="164" y="496" width="62" height="22" fill="#dd9a82"/>`;
    p += `<path d="M166 498 Q160 456 195 432 Q230 456 224 498Z" fill="#e8a88c"/><path d="M195 432 V412" stroke="#e8a88c" stroke-width="2.5"/>`;
    [[136, 18], [254, 18]].forEach(([x, rr]) => { p += `<rect x="${x - rr}" y="500" width="${rr * 2}" height="14" fill="#dd9a82"/><path d="M${x - rr} 502 Q${x - rr} 480 ${x} 470 Q${x + rr} 480 ${x + rr} 502Z" fill="#e3a088"/>`; });
    [104, 286].forEach(x => { p += `<rect x="${x - 4}" y="440" width="8" height="120" fill="#d99680"/><path d="M${x - 6} 442 Q${x} 426 ${x + 6} 442Z" fill="#e3a088"/>`; });
    for (let i = 0; i < 7; i++) p += `<path d="M${112 + i * 25} 560 V534 Q${118 + i * 25} 524 ${124 + i * 25} 534 V560Z" fill="#ffd27a" opacity=".85"/>`;
    return p + '</g>';
  };
  s += `<path d="M0 560 Q60 530 110 556 L110 560Z M280 560 Q330 528 390 552 L390 560Z" fill="#6d4a68"/>`;
  s += palace(1, false);
  s += `<rect y="560" width="390" height="140" fill="url(#lake)"/>` + palace(.32, true);
  for (let i = 0; i < 40; i++) { const yy = r(565, 690); s += `<path d="M${n1(195 + (R() - .5) * 60 * (1 + (yy - 560) / 60))} ${n1(yy)} h${n1(r(5, 16))}" stroke="#fff1c2" stroke-width="1.4" opacity="${n1(r(.3, .8))}"/>`; }
  const palm = (x, lean, h) => { let p = `<path d="M${x} 700 Q${x + lean * .4} ${700 - h * .5} ${x + lean} ${700 - h}" stroke="#2a2522" stroke-width="7" fill="none"/>`;
    for (let k = 0; k < 9; k++) { const a = -160 + k * 40 + r(-10, 10); p += leaf(x + lean, 700 - h, r(55, 80), 9, a, '#1f2e26'); } return p; };
  s += palm(40, 20, 260) + palm(78, -10, 200) + palm(350, -24, 250) + palm(312, 12, 190);
  return s;
}
const VIEWDEFS = () => lg('ssky', [[0, '#3c3f8c'], [.3, '#9a5a99'], [.55, '#ee8e6e'], [.66, '#fbbd7a']]) + lg('lake', [[0, '#f2ad82'], [1, '#6f4f86']])
  + rg('sung', [[0, '#fff3c8', .9], [1, '#ffb070', 0]]) + lg('marble', [[0, '#f6ecdb'], [1, '#e6d5ba']], 1, 0) + lg('floorm', [[0, '#efe3cf'], [1, '#d8c6a8']])
  + rg('lglow', [[0, '#ffe7a0', .95], [.45, '#ffc15a', .35], [1, '#ff9f3a', 0]]) + PDEFS;
function arch(mode) {      // mode 'walk' (scene 6) or 'swing' (finale)
  R = rng(mode === 'swing' ? 71 : 61); NIGHT = 0;
  let s = view();
  s += `<path d="M0 700 H390 V844 H0Z" fill="url(#floorm)"/>`;
  for (let i = -6; i <= 6; i++) s += `<path d="M${195 + i * 16} 700 L${195 + i * 70} 844" stroke="#cdb894" stroke-width="1"/>`;
  [716, 740, 772, 812].forEach(y => { s += `<path d="M0 ${y} H390" stroke="#cdb894" stroke-width="1"/>`; });
  const open = archPath(195, 420, 140, 145, 720, 7, 10);
  s += `<path d="M-10 -10 H400 V720 H-10Z ${open.replace(/L/g, ' L')}" fill="url(#marble)" fill-rule="evenodd"/>`;
  s += `<path d="${open}" fill="none" stroke="#e2cfae" stroke-width="12"/><path d="${open}" fill="none" stroke="#c9a04a" stroke-width="3"/>`;
  s += `<path d="${archPath(195, 420, 118, 168, 720, 7, 6)}" fill="none" stroke="#d8c19a" stroke-width="2"/>`;
  [[30, 60], [360, 60], [30, 330], [360, 330]].forEach(([x, y]) => { for (let k = 0; k < 6; k++) s += `<ellipse cx="${x}" cy="${y - 10}" rx="4" ry="10" transform="rotate(${k * 60} ${x} ${y})" fill="#c9a04a" opacity=".75"/>`; s += `<circle cx="${x}" cy="${y}" r="4" fill="#b5122b"/>`; });
  // sheer curtains tied at the columns
  [-1, 1].forEach(sd => { const x = 195 + sd * 150;
    s += `<path d="M${195 + sd * 210} -10 Q${x + sd * 10} 200 ${x - sd * 6} 470 Q${x + sd * 30} 600 ${x + sd * 24} 720 L${195 + sd * 210} 720Z" fill="#fffaf0" opacity=".78"/>`;
    s += `<path d="M${x - sd * 6} 470 q${sd * 16} 6 ${sd * 30} -2" stroke="#c9a04a" stroke-width="4" fill="none"/>`; });
  // garlands along the arch crown and hanging strands
  const pts = archPts(195, 420, 140, 145, 7, 10);
  for (let i = 4; i < pts.length - 4; i += 4) { const [x, y] = pts[i]; s += bougain(x, y - 4, 14, 10, 12, ROSES); }
  for (let i = 0; i < 11; i++) { const x = 105 + i * 18, top = pts.reduce((m, [px, py]) => Math.abs(px - x) < Math.abs(m[0] - x) ? [px, py] : m, [0, 0])[1]; s += garland(x, top, r(40, 110)); }
  s += lantern(70, 730, 1.3) + lantern(320, 730, 1.3);
  s += bougain(20, 700, 40, 30, 50, ROSES) + bougain(370, 700, 40, 30, 50, ROSES) + tropic(0, 760, 6, 90, 20, 30) + tropic(390, 760, 6, 90, -20, 30);
  return url(s, VIEWDEFS());
}
function swing() {        // ropes, carved seat and the couple (inline, sways)
  let s = `<defs>${PDEFS}</defs><g id="swing">`;
  [-80, 80].forEach(x => { s += `<path d="M${195 + x} 300 V676" stroke="#7a5a2a" stroke-width="3"/>`; for (let y = 304; y < 676; y += 12) s += `<circle cx="${195 + x + (y % 24 ? 2 : -2)}" cy="${y}" r="3.4" fill="${y % 36 ? '#fffaf0' : '#d01f3c'}"/>`; });
  s += `<g transform="translate(195 690) scale(1.05)">${coupleSeated()}</g>`;
  s += `<path d="M110 680 H280 L272 700 H118Z" fill="#6e3b1f"/><path d="M110 680 H280" stroke="#d9a531" stroke-width="3"/><path d="M122 694 H268" stroke="#d9a531" stroke-width="1" stroke-dasharray="4 4"/></g>`;
  return s;
}
function couple() {
  return `<defs>${PDEFS}</defs><g id="walkers"><g id="wM" transform="translate(-30 0)">${manBack()}</g><path d="M-8 -138 Q0 -128 8 -140" stroke="#c68a64" stroke-width="9" stroke-linecap="round" fill="none"/><g id="wW" transform="translate(32 4) scale(.94)">${womanBack(true)}</g></g>`;
}

/* ================= celebrations background ================= */
function eventsBg() {
  R = rng(81); NIGHT = 0;
  const defs = lg('cr', [[0, '#fbf5ea'], [1, '#f1e4cf']]);
  let s = `<rect width="390" height="844" fill="url(#cr)"/>`;
  for (let i = 0; i < 40; i++) s += `<circle cx="${n1(r(0, 390))}" cy="${n1(r(0, 844))}" r="${n1(r(10, 40))}" fill="#e9d6b6" opacity=".18"/>`;
  s += bougain(195, 10, 230, 40, 240) + bougain(20, 130, 30, 80, 70) + bougain(370, 130, 30, 80, 70);
  for (let i = 0; i < 16; i++) s += garland(40 + i * 21, 30 + r(0, 20), r(30, 80));
  s += bougain(40, 830, 70, 40, 90, ROSES) + bougain(350, 830, 70, 40, 90, ROSES);
  return url(s, defs);
}

return { lane, laneWindow, room, river, glitter, boatTop, ghat, arch, swing, couple, eventsBg };
})();
