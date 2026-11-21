/*
 * Tiny synthesized music engine — no audio files needed.  (v3, desi edition)
 *   const music = createMusic({ spb: .25, play(step, t, tone, noise, pluck) { ... } });
 *   music.start(); music.stop(); music.toggle(); music.time(); music.level(); music.bands(n)
 *   music.sfx((t, tone, noise, pluck) => { ... })   one-off sound effects
 * tone(midi, t, {type, dur, vol, attack, partials, cutoff, q, bp:[f,q], sustain, slide, bend, bendTime, vib:[rate, cents]})
 *   bend → glide up into the note from `bend` semitones below (meend), vib → vibrato (shehnai, flute, voice)
 * noise(t, {dur, vol, freq, q, type})                      → claps, ghungroo, cymbals, whooshes
 * pluck(midi, t, {vol, dur, bright, buzz, bend})          → plucked string (Karplus-Strong): sitar, dotara, santoor
 */
window.createMusic = function (song) {
  let ctx, master, analyser, data, timer, step = 0, next = 0, playing = false, noiseBuf;
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);
  const ks = {};

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = song.reverb ?? .35;
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
      const f0 = freq(m) * mul;
      if (o.bend) { osc.frequency.setValueAtTime(freq(m - o.bend) * mul, t); osc.frequency.exponentialRampToValueAtTime(f0, t + (o.bendTime ?? .14)); }
      else osc.frequency.setValueAtTime(f0, t);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq(m + o.slide) * mul), t + dur * .9);
      if (o.vib) {
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = o.vib[0]; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib[1], t + Math.min(.35, dur * .5));
        lfo.connect(lg); lg.connect(osc.detune); lfo.start(t); lfo.stop(t + dur + .1);
      }
      const d = dur * (dm ?? 1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * g, t + att);
      if (o.sustain) { gain.gain.setValueAtTime(vol * g, t + d * .65); gain.gain.linearRampToValueAtTime(0, t + d); }
      else gain.gain.exponentialRampToValueAtTime(.0001, t + d);
      let node = osc;
      if (o.cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cutoff; f.Q.value = o.q ?? .7; node.connect(f); node = f; }
      if (o.bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp[0]; f.Q.value = o.bp[1]; node.connect(f); node = f; }
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

  // Karplus-Strong plucked string, rendered once per (note, colour) and cached
  function ksBuffer(m, bright, buzz) {
    const key = m + '|' + bright + '|' + buzz;
    if (ks[key]) return ks[key];
    const sr = ctx.sampleRate, f = freq(m), N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * 2.2);
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0), ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev + (r - prev) * bright; ring[i] = prev; }
    const decay = .996 + Math.min(.0035, f / 400000);
    let idx = 0, peak = 0;
    for (let i = 0; i < len; i++) {
      const a = ring[idx], b = ring[(idx + 1) % N];
      ring[idx] = (a + b) * .5 * decay;
      let s = a;
      if (buzz) s = a * (1 - buzz) + Math.tanh(a * 7 + .15) * buzz * .45;   // jawari-style buzz
      d[i] = s; peak = Math.max(peak, Math.abs(s));
      idx = (idx + 1) % N;
    }
    for (let i = 0; i < len; i++) d[i] /= peak || 1;
    const rate = f * N / sr;   // correct the integer-delay tuning error
    return (ks[key] = { buf, rate });
  }

  function pluck(m, t, o = {}) {
    const { buf, rate } = ksBuffer(m, o.bright ?? .6, o.buzz ?? 0);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf;
    if (o.bend) { src.playbackRate.setValueAtTime(rate * Math.pow(2, -o.bend / 12), t); src.playbackRate.linearRampToValueAtTime(rate, t + (o.bendTime ?? .12)); }
    else src.playbackRate.setValueAtTime(rate, t);
    const vol = o.vol ?? .2, dur = o.dur ?? 1.8;
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(g); g.connect(master); src.start(t); src.stop(t + dur + .05);
  }

  function tick() {
    while (next < ctx.currentTime + .4) { song.play(step, next, tone, noise, pluck); step++; next += song.spb; }
  }

  const api = {
    get playing() { return playing; },
    get ctx() { return ctx; },
    get step() { return step; },
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
    sfx(fn) {
      try {
        if (!ctx) init(); ctx.resume();
        if (!playing) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(song.volume ?? .85, ctx.currentTime); }
        fn(ctx.currentTime + .01, tone, noise, pluck);
      } catch (e) {}
    }
  };
  return api;
};
