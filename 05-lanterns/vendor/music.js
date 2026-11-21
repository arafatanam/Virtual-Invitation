/*
 * Tiny synthesized music engine — no audio files needed.
 * Usage:
 *   const music = createMusic({ spb: 0.25, play(step, t, tone) { tone(72, t, { dur: 1.5, vol: .1 }); } });
 *   music.start();  music.stop();  music.toggle();
 * `step` counts up forever; `t` is the AudioContext time to schedule at.
 */
window.createMusic = function (song) {
  let ctx, master, timer, step = 0, next = 0, playing = false;
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    // soft hall reverb from a generated impulse response
    const len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = song.reverb ?? .45;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); master.connect(verb); verb.connect(wet); wet.connect(comp); comp.connect(ctx.destination);
  }

  // tone(midi, time, {type, dur, vol, attack, partials, cutoff, detune})
  function tone(m, t, o = {}) {
    const dur = o.dur ?? 1.2, vol = o.vol ?? .08, att = o.attack ?? .008;
    const partials = o.partials ?? [[1, 1, 1]];
    partials.forEach(([mul, g, dm]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = o.type ?? 'sine';
      osc.frequency.value = freq(m) * mul;
      if (o.detune) osc.detune.value = o.detune;
      const d = dur * (dm ?? 1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * g, t + att);
      if (o.sustain) { gain.gain.setValueAtTime(vol * g, t + d * .6); gain.gain.linearRampToValueAtTime(0, t + d); }
      else gain.gain.exponentialRampToValueAtTime(.0001, t + d);
      let node = osc;
      if (o.cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cutoff; osc.connect(f); node = f; }
      node.connect(gain); gain.connect(master);
      osc.start(t); osc.stop(t + d + .05);
    });
  }

  function tick() {
    while (next < ctx.currentTime + .4) { song.play(step, next, tone); step++; next += song.spb; }
  }

  const api = {
    get playing() { return playing; },
    start() {
      try {
        if (!ctx) init();
        ctx.resume(); playing = true;
        next = Math.max(next, ctx.currentTime + .05);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(song.volume ?? .85, ctx.currentTime + 2);
        clearInterval(timer); timer = setInterval(tick, 100);
      } catch (e) { console.warn('audio unavailable', e); }
    },
    stop() {
      if (!ctx) return; playing = false;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + .6);
      setTimeout(() => { if (!playing) clearInterval(timer); }, 700);
    },
    toggle() { playing ? api.stop() : api.start(); return playing; }
  };
  return api;
};
