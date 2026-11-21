/*
 * Tiny synthesized music engine — no audio files needed.  (v2)
 *   const music = createMusic({ spb: .25, play(step, t, tone, noise) { ... } });
 *   music.start(); music.stop(); music.toggle();
 *   music.time()      → current audio clock (for syncing visuals)
 *   music.level()     → 0..1 loudness right now (for visualisers)
 *   music.bands(n)    → array of n frequency band levels 0..1
 * tone(midi, t, {type, dur, vol, attack, partials, cutoff, sustain, slide})
 * noise(t, {dur, vol, freq, q, type})  → hats, snares, shakers, whooshes
 */
window.createMusic = function (song) {
  let ctx, master, analyser, data, timer, step = 0, next = 0, playing = false, noiseBuf;
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = song.reverb ?? .4;
    const comp = ctx.createDynamicsCompressor();
    analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .75;
    data = new Uint8Array(analyser.frequencyBinCount);
    master.connect(comp); master.connect(verb); verb.connect(wet); wet.connect(comp);
    comp.connect(analyser); analyser.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }

  function tone(m, t, o = {}) {
    const dur = o.dur ?? 1.2, vol = o.vol ?? .08, att = o.attack ?? .008;
    (o.partials ?? [[1, 1, 1]]).forEach(([mul, g, dm]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = o.type ?? 'sine';
      osc.frequency.setValueAtTime(freq(m) * mul, t);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq(m + o.slide) * mul), t + dur * .9);
      const d = dur * (dm ?? 1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * g, t + att);
      if (o.sustain) { gain.gain.setValueAtTime(vol * g, t + d * .6); gain.gain.linearRampToValueAtTime(0, t + d); }
      else gain.gain.exponentialRampToValueAtTime(.0001, t + d);
      let node = osc;
      if (o.cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cutoff; f.Q.value = o.q ?? .7; osc.connect(f); node = f; }
      node.connect(gain); gain.connect(master);
      osc.start(t); osc.stop(t + d + .05);
    });
  }

  function noise(t, o = {}) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.type ?? 'highpass'; f.frequency.value = o.freq ?? 7000; f.Q.value = o.q ?? .8;
    const g = ctx.createGain(), dur = o.dur ?? .06, vol = o.vol ?? .05;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random() * .5); src.stop(t + dur + .02);
  }

  function tick() {
    while (next < ctx.currentTime + .4) { song.play(step, next, tone, noise); step++; next += song.spb; }
  }

  const api = {
    get playing() { return playing; },
    get ctx() { return ctx; },
    time() { return ctx ? ctx.currentTime : 0; },
    level() {
      if (!analyser || !playing) return 0;
      analyser.getByteFrequencyData(data);
      let s = 0; for (let i = 0; i < 48; i++) s += data[i]; return Math.min(1, s / (48 * 170));
    },
    bands(n) {
      const out = new Array(n).fill(0);
      if (!analyser || !playing) return out;
      analyser.getByteFrequencyData(data);
      const per = Math.floor(80 / n);
      for (let b = 0; b < n; b++) { let s = 0; for (let i = 0; i < per; i++) s += data[b * per + i]; out[b] = Math.min(1, s / (per * 200)); }
      return out;
    },
    start() {
      try {
        if (!ctx) init();
        ctx.resume(); playing = true;
        next = Math.max(next, ctx.currentTime + .05);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(song.volume ?? .85, ctx.currentTime + (song.fadeIn ?? 2));
        clearInterval(timer); timer = setInterval(tick, 90);
      } catch (e) { console.warn('audio unavailable', e); }
    },
    stop() {
      if (!ctx) return; playing = false;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + .6);
      setTimeout(() => { if (!playing) clearInterval(timer); }, 700);
    },
    toggle() { playing ? api.stop() : api.start(); return playing; },
    // one-off sound effects
    sfx(fn) { if (!ctx) init(); ctx.resume(); fn(ctx.currentTime + .01, tone, noise); }
  };
  return api;
};
