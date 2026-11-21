/* Opening Night — a full 3D theatre.
   Stage, gold proscenium, velvet curtains (custom cloth shader), raked seats, spotlights,
   a marquee ring of bulbs, the couple's names, and metallic confetti.                       */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);

/* ================= music: a waltz in A minor ================= */
const chords = [[45,[57,60,64]],[50,[57,62,65]],[52,[56,59,64]],[45,[57,60,64]],[53,[57,60,65]],[50,[57,62,65]],[52,[56,62,64]],[45,[57,60,64]]];
const mel = [[76,0,0,0,72,76],[77,0,0,0,74,77],[76,0,0,0,71,68],[69,0,0,0,0,0],[72,0,0,0,69,72],[74,0,0,0,77,76],[74,0,0,0,71,68],[69,0,0,0,64,0]];
const music = createMusic({ spb: .21, reverb: .5, play(step, t, tone) {
  const bar = Math.floor(step / 6) % 8, s = step % 6, [bass, ch] = chords[bar];
  if (s === 0) tone(bass - 12, t, { type: 'triangle', dur: 1.2, vol: .14 });
  if (s === 2 || s === 4) ch.forEach(n => tone(n, t, { type: 'sawtooth', dur: .5, vol: .022, attack: .03, cutoff: 1500 }));
  const m = mel[bar][s];
  if (m) { tone(m + 12, t, { type: 'triangle', dur: 1.6, vol: .07, cutoff: 3500 }); tone(m + 24, t, { dur: .7, vol: .015 }); }
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= marquee bulbs (HTML sign) ================= */
(() => {
  let h = ''; const per = 14;
  for (let i = 0; i <= per; i++) { const p = i / per * 100;
    h += `<i style="left:calc(${p}% - 3.5px);top:-3px;animation-delay:${(i % 2) * .6}s"></i><i style="left:calc(${p}% - 3.5px);bottom:-3px;animation-delay:${((i + 1) % 2) * .6}s"></i>`; }
  for (let i = 1; i < 5; i++) { const p = i / 5 * 100;
    h += `<i style="top:calc(${p}% - 3.5px);left:-3px;animation-delay:${(i % 2) * .6}s"></i><i style="top:calc(${p}% - 3.5px);right:-3px;animation-delay:${((i + 1) % 2) * .6}s"></i>`; }
  $('#bulbs').innerHTML = h;
})();

/* ================= helpers ================= */
const ease = { inOut: t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), sine: t => -(Math.cos(Math.PI * t) - 1) / 2 };
function tween(ms, fn, e = ease.inOut) {
  return new Promise(res => { if (reduce) { fn(1); return res(); } const t0 = performance.now();
    (function l(n) { const k = Math.min(1, (n - t0) / ms); fn(e(k)); k < 1 ? requestAnimationFrame(l) : res(); })(t0); });
}
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ================= renderer & scene ================= */
const canvas = $('#stage');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#loader p').textContent = 'This invitation needs a browser with WebGL.'; return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.setClearColor(0x070102, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070102, .028);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 200);

// environment reflections for gold & confetti
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x2a2018);
[[8, 2, 0xfff4e0, 2.4, [0, 8, 4]], [2, 8, 0xffe2b8, 1.5, [-8, 2, 2]], [2, 8, 0xfff0dc, 1.2, [8, 2, 2]], [10, 1.5, 0xffffff, 1.4, [0, -3, 8]]].forEach(([w, h, c, k, p]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
  m.position.set(...p); m.lookAt(0, 0, 0); envScene.add(m);
});
scene.environment = pmrem.fromScene(envScene, .03).texture;

const gold = new THREE.MeshStandardMaterial({ color: 0xe8c07a, metalness: 1, roughness: .38, envMapIntensity: 1.2 });
const OPEN_W = 13.4, OPEN_H = 8.2;

/* ---------- textures drawn in code ---------- */
function woodTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
  const plankH = 64;
  for (let y = 0; y < 1024; y += plankH) {
    let px = -Math.random() * 400;
    while (px < 1024) {
      const len = rand(260, 520), l = rand(18, 30);
      x.fillStyle = `hsl(${rand(16, 24)}, ${rand(38, 50)}%, ${l}%)`; x.fillRect(px, y, len, plankH);
      x.strokeStyle = 'rgba(0,0,0,.18)';
      for (let g = 0; g < 9; g++) { x.lineWidth = rand(.5, 1.6); x.beginPath(); const gy = y + rand(4, plankH - 4); x.moveTo(px, gy);
        x.bezierCurveTo(px + len * .3, gy + rand(-6, 6), px + len * .6, gy + rand(-6, 6), px + len, gy + rand(-3, 3)); x.stroke(); }
      x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(px, y, 2, plankH);
      px += len;
    }
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, y, 1024, 2);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

function namesTexture() {
  const W = 2048, H = 1250, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 200, W, 1000);
  g.addColorStop(0, '#a77b33'); g.addColorStop(.3, '#f8e3ab'); g.addColorStop(.5, '#d8ab5e'); g.addColorStop(.7, '#fff3cf'); g.addColorStop(1, '#a77b33');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const spaced = s => s.split('').join(String.fromCharCode(8202, 8202));
  x.fillStyle = '#e8c987'; x.font = '500 44px "Bodoni Moda", Didot, Georgia, serif';
  x.fillText(spaced('TOGETHER WITH THEIR FAMILIES'), W / 2, 90);
  x.shadowColor = 'rgba(255,200,120,.55)'; x.shadowBlur = 30;
  x.fillStyle = g;
  x.font = '330px "Monsieur La Doulaise", "Snell Roundhand", cursive';
  x.fillText('Sofia', W / 2 - 60, 360);
  x.font = '190px "Monsieur La Doulaise", "Snell Roundhand", cursive';
  x.fillText('&', W / 2 + 10, 610);
  x.font = '330px "Monsieur La Doulaise", "Snell Roundhand", cursive';
  x.fillText('Adrian', W / 2 + 60, 830);
  x.shadowBlur = 0;
  x.strokeStyle = '#d8ab5e'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(W / 2 - 520, 1110); x.lineTo(W / 2 - 330, 1110); x.moveTo(W / 2 + 330, 1110); x.lineTo(W / 2 + 520, 1110); x.stroke();
  x.fillStyle = '#f2d9a0'; x.font = '400 62px "Bodoni Moda", Didot, Georgia, serif';
  x.fillText(spaced('18 · IX · MMXXVII'), W / 2, 1112);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}

/* ---------- stage & house ---------- */
const wood = woodTexture();
const floorMat = new THREE.MeshStandardMaterial({ map: wood, roughness: .42, metalness: .05, envMapIntensity: .6 });
wood.repeat.set(3, 3);
const stageFloor = new THREE.Mesh(new THREE.BoxGeometry(18, 1.3, 11), floorMat);
stageFloor.position.set(0, -.65, -2.5); scene.add(stageFloor);
// apron lip in gold
const lip = new THREE.Mesh(new THREE.BoxGeometry(18, .12, .12), gold); lip.position.set(0, -.02, 3); scene.add(lip);

// house floor & walls
const houseMat = new THREE.MeshStandardMaterial({ color: 0x120204, roughness: .95 });
const houseFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), houseMat); houseFloor.rotation.x = -Math.PI / 2; houseFloor.position.set(0, -1.35, 16); scene.add(houseFloor);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x22050a, roughness: .85 });
[-1, 1].forEach(s => {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), wallMat); w.position.set(s * 11, 6, 10); w.rotation.y = -s * Math.PI / 2; scene.add(w);
  // gilded balcony fronts
  for (let k = 0; k < 2; k++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .7, 24, 1, true, 0, Math.PI), gold);
    b.rotation.y = s > 0 ? Math.PI : 0; b.position.set(s * 10.4, 5.2 + k * 3, 6 + k * 0); b.scale.set(.55, 1, 1); scene.add(b);
  }
});
// proscenium wall (front) with an opening
const procMat = new THREE.MeshStandardMaterial({ color: 0x1e0407, roughness: .9 });
[[-10.85, 7, 8.3, 16], [10.85, 7, 8.3, 16], [0, 12.3, 13.4, 7.4]].forEach(([x, y, w, h]) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), procMat); p.position.set(x, y, .65); scene.add(p);
});
// gold frame
const colGeo = new THREE.BoxGeometry(.75, 9.2, .7);
[-1, 1].forEach(s => {
  const c = new THREE.Mesh(colGeo, gold); c.position.set(s * (OPEN_W / 2 + .38), 4.4, .7); scene.add(c);
  for (let k = 0; k < 6; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .05, 8, 24), gold); ring.position.set(s * (OPEN_W / 2 + .38), .9 + k * 1.5, 1.07); scene.add(ring); }
});
const header = new THREE.Mesh(new THREE.BoxGeometry(OPEN_W + 1.6, .9, .75), gold); header.position.set(0, OPEN_H + .55, .72); scene.add(header);
const crest = new THREE.Mesh(new THREE.TorusGeometry(.9, .09, 12, 48, Math.PI), gold); crest.position.set(0, OPEN_H + 1, .9); scene.add(crest);
const crestGem = new THREE.Mesh(new THREE.OctahedronGeometry(.3), new THREE.MeshStandardMaterial({ color: 0x9a0f22, metalness: .3, roughness: .1, envMapIntensity: 2 }));
crestGem.position.set(0, OPEN_H + 1.25, 1); scene.add(crestGem);

// backdrop behind the curtain
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(20, 13), new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uLit: { value: 0 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;uniform float uTime,uLit;
    float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}
    void main(){vec2 p=vUv;vec3 c=mix(vec3(.05,.0,.01),vec3(.28,.02,.06),p.y*.9);
      float glow=exp(-pow(length((p-vec2(.5,.47))*vec2(1.6,1.)),2.)*9.);c+=vec3(.9,.45,.25)*glow*.55*uLit;
      vec2 g=floor(p*vec2(90.,60.));float s=h(g);float tw=step(.985,s)*(.5+.5*sin(uTime*2.+s*90.));c+=vec3(1.,.85,.6)*tw*.8*uLit*smoothstep(.2,.9,p.y);
      c*=.35+.65*uLit;gl_FragColor=vec4(c,1.);}`
}));
backdrop.position.set(0, 5.2, -7); scene.add(backdrop);

/* ---------- names, marquee ring ---------- */
let namesPlane, ringGroup, bulbs, bulbCount = 64;
function buildNames() {
  const tex = namesTexture();
  namesPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1250 / 2048), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, color: new THREE.Color(1.25, 1.15, 1.05) }));
  namesPlane.position.set(0, 3.95, -2.6);
  scene.add(namesPlane);
}
ringGroup = new THREE.Group(); ringGroup.position.set(0, 4, -3.4); scene.add(ringGroup);
ringGroup.add(new THREE.Mesh(new THREE.TorusGeometry(3.4, .07, 12, 160), gold));
ringGroup.add(new THREE.Mesh(new THREE.TorusGeometry(3.62, .03, 8, 160), gold));
bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.075, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), bulbCount);
(() => { const d = new THREE.Object3D(); for (let i = 0; i < bulbCount; i++) { const a = i / bulbCount * Math.PI * 2; d.position.set(Math.cos(a) * 3.51, Math.sin(a) * 3.51, .08); d.updateMatrix(); bulbs.setMatrixAt(i, d.matrix); bulbs.setColorAt(i, new THREE.Color(.2, .15, .1)); } })();
ringGroup.add(bulbs);

// footlights
const foot = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), 17);
(() => { const d = new THREE.Object3D(); for (let i = 0; i < 17; i++) { d.position.set(-6.4 + i * .8, .08, 2.8); d.updateMatrix(); foot.setMatrixAt(i, d.matrix); foot.setColorAt(i, new THREE.Color(.3, .2, .1)); } })();
scene.add(foot);

// wall sconces
const sconces = new THREE.InstancedMesh(new THREE.SphereGeometry(.16, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, .6) }), 8);
(() => { const d = new THREE.Object3D(); let i = 0; [-1, 1].forEach(s => [3, 7, 11, 15].forEach(z => { d.position.set(s * 10.85, 4.2, z); d.updateMatrix(); sconces.setMatrixAt(i++, d.matrix); })); })();
scene.add(sconces);

/* ---------- raked seats ---------- */
(() => {
  const rows = 8, perSide = small ? 6 : 7, total = rows * perSide * 2;
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x3a0610, roughness: .8 });
  const backs = new THREE.InstancedMesh(new THREE.BoxGeometry(.78, .85, .18), seatMat, total);
  const tops = new THREE.InstancedMesh(new THREE.CylinderGeometry(.39, .39, .2, 16, 1, false, 0, Math.PI), seatMat, total);
  const d = new THREE.Object3D(); let i = 0;
  for (let r = 0; r < rows; r++) for (let s = -1; s <= 1; s += 2) for (let k = 0; k < perSide; k++) {
    const x = s * (1 + k * .95), y = -1.35 + r * .32 + .55, z = 5.2 + r * 1.1;
    d.position.set(x, y, z); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); backs.setMatrixAt(i, d.matrix);
    d.position.set(x, y + .5, z); d.rotation.set(Math.PI / 2, 0, 0); d.scale.set(1, .5, .12); d.updateMatrix(); tops.setMatrixAt(i, d.matrix);
    i++;
  }
  scene.add(backs, tops);
})();

/* ---------- velvet curtains (custom cloth shader) ---------- */
const CU = { uOpen: { value: 0 }, uTime: { value: 0 }, uW: { value: OPEN_W }, uH: { value: OPEN_H }, uBright: { value: .55 }, uSpot: { value: 1 } };
const curtainVert = `
  uniform float uOpen,uTime,uSide,uW,uH;varying vec2 vUv;varying vec3 vN;varying float vFold;varying vec3 vPos;
  void main(){
    vUv=uv; float s = uSide<0. ? uv.x : 1.-uv.x; float v=uv.y;
    float o=clamp(uOpen*1.45-(1.-v)*.3-s*.15,0.,1.); o=o*o*(3.-2.*o);
    float gw=.19-.09*exp(-pow((v-.38)*3.2,2.));
    float squash=mix(1.,gw,o);
    float hw=uW*.5+.3; float sp=s*squash;
    float x = uSide<0. ? -uW*.5-.25+sp*hw : uW*.5+.25-sp*hw;
    float N=15.; float ph=s*N*6.2832+sin(uTime*.6+v*2.5+uSide)*.35;
    float amp=(.11+.22*o)*(1.+.25*(1.-v));
    float z=sin(ph)*amp + o*(1.-o)*1.3*sin(3.1416*s)*(1.-v*.6) + .06*sin(uTime*1.1+v*5.+s*4.)*(1.-v)*(1.-o);
    float dzds=cos(ph)*amp*N*6.2832; float dxds=max(squash*hw,.05); float dzdx=clamp(dzds/dxds,-6.,6.)*(uSide<0.?1.:-1.);
    vN=normalize(vec3(-dzdx,0.,1.)); vFold=sin(ph);
    float y=v*uH*1.02 + o*.3*(1.-v)*(1.-v);
    vec4 wp=modelMatrix*vec4(x,y,z,1.); vPos=wp.xyz;
    gl_Position=projectionMatrix*viewMatrix*wp;
  }`;
const curtainFrag = `
  uniform float uBright,uSpot,uOpen;varying vec2 vUv;varying vec3 vN;varying float vFold;varying vec3 vPos;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec3 n=normalize(vN); vec3 L=normalize(vec3(.2,.45,1.)); float dif=max(dot(n,L),0.);
    float rim=pow(1.-abs(n.z),2.2);
    vec3 base=vec3(.42,.02,.05);
    vec3 col=base*(.25+1.05*dif)+vec3(.95,.22,.28)*rim*.45;
    col*=.45+.55*smoothstep(-1.,1.,vFold);
    col*=mix(1.15,.55,vUv.y);
    col+=vec3(1.,.55,.25)*pow(1.-vUv.y,6.)*.35;
    float spot=exp(-pow(length((vPos.xy-vec2(0.,3.6))*vec2(.32,.24)),2.)*2.5);
    col*=uBright+spot*uSpot*1.6;
    col*=.93+.07*h(floor(gl_FragCoord.xy*.8));
    if(vUv.y<.03){float st=step(.45,fract(vUv.x*260.));col=mix(vec3(.45,.3,.08),vec3(1.,.82,.42),st*.7+.15)*(.5+.7*dif)*(uBright+.3);}
    else if(vUv.y<.042){col=vec3(.9,.7,.32)*(.6+.6*dif)*(uBright+.3);}
    gl_FragColor=vec4(col,1.);
  }`;
const curtainGeo = new THREE.PlaneGeometry(1, 1, small ? 160 : 240, 60);
[-1, 1].forEach(side => {
  const m = new THREE.Mesh(curtainGeo, new THREE.ShaderMaterial({ uniforms: { ...CU, uSide: { value: side } }, vertexShader: curtainVert, fragmentShader: curtainFrag, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.position.z = .15; scene.add(m);
});
// scalloped valance
const valance = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 140, 12), new THREE.ShaderMaterial({
  uniforms: CU,
  vertexShader: `uniform float uW,uH;varying vec2 vUv;void main(){vUv=uv;float x=(uv.x-.5)*(uW+.8);float y=uH+.05-(1.-uv.y)*1.7;float z=.45+.1*sin(uv.x*31.4)*(1.-uv.y);gl_Position=projectionMatrix*modelViewMatrix*vec4(x,y,z,1.);}`,
  fragmentShader: `uniform float uBright;varying vec2 vUv;void main(){
    float sw=6.;float fx=fract(vUv.x*sw);float edge=.45*(1.-sin(fx*3.1416));
    if(vUv.y<edge)discard;
    float d=vUv.y-edge;float sag=sin(fx*3.1416);float folds=.5+.5*sin((vUv.y-edge*.6)*46.);
    vec3 col=vec3(.42,.02,.05)*(.45+.75*folds)*(.75+.35*sag)+vec3(.9,.2,.25)*pow(folds,8.)*.22;
    if(d<.06){float st=step(.5,fract(vUv.x*sw*28.));col=mix(vec3(.5,.34,.1),vec3(1.,.83,.45),st*.7+.15);}
    else if(d<.08)col=vec3(.95,.76,.36);
    col*=mix(.55,1.,smoothstep(1.,.3,vUv.y))*(uBright+.35);
    gl_FragColor=vec4(col,1.);}`,
  side: THREE.DoubleSide
}));
valance.frustumCulled = false; scene.add(valance);

/* ---------- lights ---------- */
const ambient = new THREE.AmbientLight(0xffd8c0, .22); scene.add(ambient);
const house = new THREE.PointLight(0xffc890, .75, 40, 1.4); house.position.set(0, 9, 12); scene.add(house);
const spotTarget = new THREE.Object3D(); spotTarget.position.set(0, 2, -2.5); scene.add(spotTarget);
const spots = [], cones = [];
const coneMat = new THREE.ShaderMaterial({
  uniforms: { uA: { value: 0 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vV;uniform float uA,uTime;void main(){float e=pow(abs(dot(vN,vV)),2.2);
    float h=smoothstep(0.,.3,vUv.y)*(.25+.75*vUv.y);float sh=.85+.15*sin(vUv.x*50.+uTime*.6);float a=e*h*sh*.12*uA;gl_FragColor=vec4(vec3(1.,.88,.7)*a,a);}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
});
[[-5, 13, 7], [5, 13, 7], [0, 14, 9]].forEach(p => {
  const s = new THREE.SpotLight(0xffe6c0, 0, 45, .3, .55, 1.2);
  s.position.set(...p); s.target = spotTarget; scene.add(s); spots.push(s);
  const src = new THREE.Vector3(...p), dst = spotTarget.position.clone(), len = src.distanceTo(dst);
  const c = new THREE.Mesh(new THREE.ConeGeometry(len * Math.tan(.3), len, 48, 1, true), coneMat);
  c.position.copy(src.clone().add(dst).multiplyScalar(.5));
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), src.clone().sub(dst).normalize());
  scene.add(c); cones.push(c);
});

/* ---------- dust in the beams ---------- */
const dustMat = new THREE.PointsMaterial({ size: .05, color: 0xffe7c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const dustGeo = new THREE.BufferGeometry(); const DN = 700, dp = new Float32Array(DN * 3);
for (let i = 0; i < DN; i++) dp.set([rand(-6, 6), rand(0, 11), rand(-3, 7)], i * 3);
dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dust = new THREE.Points(dustGeo, dustMat); scene.add(dust);

/* ---------- metallic confetti ---------- */
const CN = small ? 450 : 750;
const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(.1, .17), new THREE.MeshStandardMaterial({ metalness: .85, roughness: .3, side: THREE.DoubleSide, envMapIntensity: 1.6 }), CN);
confetti.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
const C = Array.from({ length: CN }, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), s: new THREE.Vector3(), ph: Math.random() * 6 }));
const cCols = [0xf2cf7c, 0xd9a441, 0xfff1c9, 0xb3122a, 0xe2b45a];
const dummy = new THREE.Object3D();
C.forEach((c, i) => { confetti.setColorAt(i, new THREE.Color(cCols[i % cCols.length])); dummy.scale.setScalar(0); dummy.updateMatrix(); confetti.setMatrixAt(i, dummy.matrix); });
confetti.frustumCulled = false; scene.add(confetti);
function throwConfetti(n, fromStage = true) {
  let k = 0;
  for (const c of C) {
    if (c.on) continue; if (k++ >= n) break;
    c.on = true;
    if (fromStage) { c.p.set(rand(-8, 8), rand(9, 14), rand(-2, 9)); c.v.set(rand(-.3, .3), rand(-1.2, -.6), rand(-.2, .2)); }
    else { c.p.set(camera.position.x + rand(-2, 2), camera.position.y + rand(1, 3), camera.position.z - rand(3, 6)); c.v.set(rand(-2.5, 2.5), rand(1, 4), rand(-2, 1)); }
    c.r.set(rand(0, 6), rand(0, 6), rand(0, 6)); c.s.set(rand(1, 4), rand(1, 4), rand(1, 4));
  }
}

/* ---------- post ---------- */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .75, .55, .62));
}

/* ================= camera rig ================= */
const R = { pos: new THREE.Vector3(0, 3.3, 19), look: new THREE.Vector3(0, 3.6, 0), tx: 0, ty: 0, px: 0, py: 0 };
const START = { pos: new THREE.Vector3(0, 3.3, 19), look: new THREE.Vector3(0, 3.6, 0) };
const SEAT = { pos: new THREE.Vector3(0, 3.1, 12.5), look: new THREE.Vector3(0, 3.9, -2) };
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = camera.aspect < .8 ? 60 : 42; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(DPR); composer.setSize(w, h); }
  if (namesPlane) {
    const dist = SEAT.pos.z - namesPlane.position.z;
    const visW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    const s = Math.min(7.4, visW * .9); namesPlane.scale.set(s, s, 1);
  }
}
addEventListener('pointermove', e => { R.tx = e.clientX / innerWidth - .5; R.ty = e.clientY / innerHeight - .5; }, { passive: true });

/* ================= loop ================= */
const state = { lit: 0, names: 0, open: 0, bulbs: 0 };
const shade = $('#shade');
let last = performance.now();
function frame(now) {
  const t = now / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
  CU.uTime.value = t; coneMat.uniforms.uTime.value = t; backdrop.material.uniforms.uTime.value = t;
  coneMat.uniforms.uA.value = state.lit; backdrop.material.uniforms.uLit.value = .25 + state.lit * .75;
  spots.forEach(s => s.intensity = state.lit * 2.4);
  dustMat.opacity = state.lit * .55;
  if (namesPlane) { namesPlane.material.opacity = state.names; namesPlane.position.y = 3.95 + (1 - state.names) * -.6; }

  // bulbs chase
  for (let i = 0; i < bulbCount; i++) {
    const on = ((i + Math.floor(t * 6)) % 4) < 2 ? 1 : .35, k = state.bulbs * on;
    bulbs.setColorAt(i, new THREE.Color(.25 + k * 1.6, .18 + k * 1.25, .1 + k * .7));
  }
  bulbs.instanceColor.needsUpdate = true;
  ringGroup.rotation.z = Math.sin(t * .3) * .02;
  for (let i = 0; i < 17; i++) foot.setColorAt(i, new THREE.Color(.35 + state.lit * 1.4, .25 + state.lit * 1.0, .12 + state.lit * .45));
  foot.instanceColor.needsUpdate = true;

  // dust drift
  for (let i = 0; i < DN; i++) { dp[i*3+1] += dt * .08; dp[i*3] += Math.sin(t * .3 + i) * dt * .03; if (dp[i*3+1] > 11) dp[i*3+1] = 0; }
  dustGeo.attributes.position.needsUpdate = true;

  // confetti physics
  let any = false;
  C.forEach((c, i) => {
    if (!c.on) return; any = true;
    c.v.y = Math.max(c.v.y - dt * 2.2, -1.1); c.v.x *= .99; c.v.z *= .99;
    c.p.addScaledVector(c.v, dt); c.p.x += Math.sin(t * 2 + c.ph) * dt * .5;
    c.r.x += c.s.x * dt; c.r.y += c.s.y * dt; c.r.z += c.s.z * dt * .3;
    if (c.p.y < -1.2) { c.on = false; dummy.scale.setScalar(0); }
    else { dummy.position.copy(c.p); dummy.rotation.copy(c.r); dummy.scale.setScalar(1); }
    dummy.updateMatrix(); confetti.setMatrixAt(i, dummy.matrix);
  });
  if (any) confetti.instanceMatrix.needsUpdate = true;

  // camera: rig position + pointer parallax + scroll
  const sp = Math.min(1, scrollY / innerHeight);
  R.px += (R.tx - R.px) * .04; R.py += (R.ty - R.py) * .04;
  camera.position.set(R.pos.x + R.px * 1.2, R.pos.y - R.py * .6 + sp * 2.2, R.pos.z - sp * 2.5);
  camera.lookAt(R.look.x + R.px * .3, R.look.y + sp * 2.4, R.look.z);
  shade.style.opacity = Math.min(.88, sp * 1.05);

  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ================= boot ================= */
(async () => {
  try {
    await Promise.race([Promise.all([document.fonts.load('100px "Monsieur La Doulaise"'), document.fonts.load('500 40px "Bodoni Moda"')]), wait(2500)]);
  } catch (e) {}
  buildNames(); resize(); addEventListener('resize', resize);
  requestAnimationFrame(frame);
  $('#loader').classList.add('done');
})();

$('#raise').addEventListener('click', async () => {
  music.start(); musicBtn.hidden = false;
  const hero = $('#hero'); hero.classList.add('opening');
  tween(700, k => CU.uSpot.value = 1 + k * .6);
  await wait(650);
  tween(4200, k => CU.uOpen.value = k);
  tween(2400, k => { CU.uBright.value = .55 + k * .25; ambient.intensity = .22 - k * .1; house.intensity = .75 - k * .55; CU.uSpot.value = 1.6 * (1 - k); });
  tween(2200, k => { state.lit = k; state.bulbs = k; }, ease.out);
  setTimeout(() => tween(2600, k => state.names = k, ease.out), 1400);
  setTimeout(() => throwConfetti(CN), 1600);
  await tween(5200, k => { R.pos.lerpVectors(START.pos, SEAT.pos, k); R.look.lerpVectors(START.look, SEAT.look, k); }, ease.sine);
  hero.classList.add('lit');
  document.body.classList.remove('locked');
});

/* ================= programme cards ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.card').forEach(c => io.observe(c));

(() => {
  let h = ['M','T','W','T','F','S','S'].map(d => `<span class="dow">${d}</span>`).join('');
  const first = (new Date(2027, 8, 1).getDay() + 6) % 7;
  for (let i = 0; i < first; i++) h += '<span></span>';
  for (let d = 1; d <= 30; d++) h += d === 18
    ? `<span class="hit">${d}<svg viewBox="0 0 40 40" preserveAspectRatio="none" aria-hidden="true"><path d="M30 6C20 1 5 6 4 19s12 18 22 16 12-12 8-21c-2-4-7-7-12-7"/></svg></span>`
    : `<span>${d}</span>`;
  $('#cal').innerHTML = h;
})();

const target = new Date('2027-09-18T18:00:00+02:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function count() { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(d, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s); }
count(); setInterval(count, 1000);

const ticket = $('#ticket');
ticket.addEventListener('click', () => { ticket.classList.toggle('flip'); ticket.style.transform = ''; });
ticket.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = ticket.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
  ticket.style.transform = `rotateY(${(ticket.classList.contains('flip') ? 180 : 0) + dx * 20}deg) rotateX(${-dy * 16}deg)`;
});
ticket.addEventListener('pointerleave', () => ticket.style.transform = '');

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Please add your name so we know whose seat to save.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#thanks-msg').textContent = yes ? `${first}, your seat is reserved. See you on opening night.` : `We’ll miss you, ${first}. Thank you for letting us know.`;
  $('#rsvp .thanks h3').textContent = yes ? 'Bravo!' : 'Grazie';
  $('#rsvp').classList.add('done');
  // NOTE: connect a form backend here to collect replies.
  if (yes) throwConfetti(CN, false);
});
})();
