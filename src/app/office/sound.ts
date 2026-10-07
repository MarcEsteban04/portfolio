// Sound for the 3D office, all synthesised with WebAudio (no files to
// download). It's on by default, but browsers only let audio start after the
// visitor has interacted with the page, so it begins on their first click,
// tap or key press.

export type Sfx =
  | "blip"
  | "key"
  | "click"
  | "shot"
  | "buzz"
  | "meow"
  | "hiss"
  | "crash"
  | "thunder"
  | "alarm"
  | "powerDown"
  | "powerUp"
  | "fridge"
  | "whoosh"
  | "pop"
  | "sip"
  | "chew"
  | "clink"
  | "crunch";

export type Loops = { rain: number; aircon: number; purr: number; music: number };

// A small lo-fi loop for the speakers: chords and a lazy melody.
const chords = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [196, 246.94, 293.66],
  [164.81, 207.65, 246.94],
];
const melody = [659.25, 0, 587.33, 523.25, 0, 493.88, 523.25, 0, 440, 0, 493.88, 523.25, 587.33, 0, 523.25, 0];

export function createSound() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let brown: AudioBuffer | null = null;
  let rainLevel = 0;
  let patter: ReturnType<typeof setInterval> | null = null;
  let enabled = false;
  // Only while the office is actually on screen: its page open, its window
  // the one in use, the tab in front and the scene scrolled into view.
  // Silent until the scene says so.
  let active = false;
  const loopGains: Partial<Record<keyof Loops, GainNode>> = {};
  let musicLevel = 0;
  let musicTimer: ReturnType<typeof setInterval> | null = null;
  let step = 0;
  let stopListening = () => {};

  function noiseSource() {
    const source = ctx!.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    return source;
  }

  function setup() {
    if (ctx) return;
    ctx = new AudioContext();
    // Wake up on the first interaction, if the browser held audio back.
    const wake = () => {
      if (ctx?.state === "suspended" && enabled && active) void ctx.resume();
      if (ctx?.state === "running") unlisten();
    };
    const unlisten = () => {
      for (const type of ["pointerdown", "keydown", "touchstart"]) window.removeEventListener(type, wake);
    };
    for (const type of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(type, wake, { passive: true });
    stopListening = unlisten;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    // Brown noise (white noise, integrated): deep and soft, like steady rain
    // on a roof rather than radio static.
    brown = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const deep = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < deep.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      deep[i] = last * 3.5;
    }

    // Rain: soft hiss. Aircon: a low hum. Purr: a rumble that throbs.
    const loop = (name: keyof Loops, filter: BiquadFilterType, frequency: number, through?: AudioNode, buffer = noise) => {
      const source = ctx!.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const shape = ctx!.createBiquadFilter();
      shape.type = filter;
      shape.frequency.value = frequency;
      const gain = ctx!.createGain();
      gain.gain.value = 0;
      if (through) source.connect(shape).connect(through).connect(gain);
      else source.connect(shape).connect(gain);
      gain.connect(master!);
      source.start();
      loopGains[name] = gain;
    };
    loop("rain", "lowpass", 1100, undefined, brown);
    // Droplets: tiny ticks at random, on the window and the roof.
    patter = setInterval(() => {
      if (!ctx || !enabled || !active || rainLevel <= 0) return;
      const drops = Math.random() < rainLevel ? 1 + Math.floor(Math.random() * 3 * rainLevel) : 0;
      for (let i = 0; i < drops; i++) {
        const f = 1600 + Math.random() * 3200;
        tone("sine", f, f * 0.55, 0.025 + Math.random() * 0.03, (0.006 + Math.random() * 0.014) * rainLevel, Math.random() * 0.04);
      }
    }, 45);
    loop("aircon", "lowpass", 260);
    // The purr throbs about 24 times a second, before its own volume.
    const throbbing = ctx.createGain();
    throbbing.gain.value = 0.5;
    const throb = ctx.createOscillator();
    throb.frequency.value = 24;
    const depth = ctx.createGain();
    depth.gain.value = 0.5;
    throb.connect(depth).connect(throbbing.gain);
    throb.start();
    loop("purr", "lowpass", 180, throbbing);

    musicTimer = setInterval(playMusicStep, 230);
  }

  // One envelope-shaped note or burst.
  function tone(type: OscillatorType, from: number, to: number, seconds: number, volume: number, delay = 0) {
    const at = ctx!.currentTime + delay;
    const osc = ctx!.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + seconds);
    const gain = ctx!.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    osc.connect(gain).connect(master!);
    osc.start(at);
    osc.stop(at + seconds + 0.05);
    return osc;
  }
  function burst(filter: BiquadFilterType, from: number, to: number, seconds: number, volume: number, delay = 0) {
    const at = ctx!.currentTime + delay;
    const source = noiseSource();
    const shape = ctx!.createBiquadFilter();
    shape.type = filter;
    shape.frequency.setValueAtTime(from, at);
    shape.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + seconds);
    const gain = ctx!.createGain();
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    source.connect(shape).connect(gain).connect(master!);
    source.start(at, Math.random());
    source.stop(at + seconds + 0.05);
  }

  function playMusicStep() {
    if (!ctx || !enabled || !active || musicLevel <= 0) return;
    const bar = Math.floor(step / 16) % chords.length;
    const v = 0.05 * musicLevel;
    if (step % 16 === 0) for (const f of chords[bar]) tone("triangle", f, f, 3.4, v);
    if (step % 4 === 0) tone("sine", chords[bar][0] / 2, chords[bar][0] / 2, 0.5, v * 1.6);
    if (step % 4 === 2) burst("highpass", 6000, 6000, 0.05, v * 0.8);
    const note = melody[step % melody.length];
    if (note && step % 2 === 0) tone("square", note, note, 0.22, v * 0.35);
    step++;
  }

  function play(name: Sfx) {
    if (!ctx || !enabled || !active) return;
    switch (name) {
      case "blip":
        tone("sine", 620, 880, 0.08, 0.06);
        break;
      case "key":
        burst("bandpass", 2600 + Math.random() * 1600, 1800, 0.025, 0.12);
        break;
      case "click":
        burst("highpass", 3000, 2000, 0.02, 0.18);
        tone("square", 1800, 1200, 0.015, 0.03);
        break;
      case "shot":
        burst("lowpass", 4000, 300, 0.16, 0.35);
        tone("sine", 140, 50, 0.12, 0.3);
        break;
      case "buzz":
        for (const delay of [0, 0.35]) tone("square", 150, 140, 0.25, 0.05, delay);
        break;
      case "meow": {
        const at = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(520, at);
        osc.frequency.linearRampToValueAtTime(820, at + 0.18);
        osc.frequency.linearRampToValueAtTime(460, at + 0.55);
        const shape = ctx.createBiquadFilter();
        shape.type = "bandpass";
        shape.frequency.value = 1200;
        shape.Q.value = 3;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.12, at + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
        osc.connect(shape).connect(gain).connect(master!);
        osc.start(at);
        osc.stop(at + 0.65);
        break;
      }
      case "hiss":
        burst("highpass", 3500, 5000, 0.7, 0.2);
        break;
      case "crash":
        for (const [f, d] of [[820, 0], [1260, 0.01], [1930, 0.02], [610, 0.18]] as const) tone("sine", f, f * 0.97, 0.35, 0.08, d);
        burst("bandpass", 2500, 900, 0.12, 0.25);
        tone("sine", 90, 50, 0.15, 0.3, 0.18);
        break;
      case "thunder":
        burst("lowpass", 500, 80, 2.6, 0.5);
        burst("lowpass", 900, 120, 0.4, 0.4);
        break;
      case "alarm":
        for (let i = 0; i < 4; i++) tone("square", 1760, 1760, 0.09, 0.06, i * 0.18);
        break;
      case "powerDown":
        tone("sawtooth", 420, 50, 0.7, 0.08);
        break;
      case "powerUp":
        [523.25, 659.25, 783.99].forEach((f, i) => tone("sine", f, f, 0.18, 0.08, i * 0.09));
        break;
      case "fridge":
        tone("sine", 110, 60, 0.18, 0.25);
        burst("lowpass", 1200, 300, 0.2, 0.12, 0.05);
        break;
      case "whoosh":
        burst("bandpass", 300, 2400, 0.9, 0.25);
        break;
      case "sip": {
        // A slurp: air through a narrowing gap, rising, then a gulp.
        burst("bandpass", 700, 2200, 0.32, 0.22);
        burst("bandpass", 1500, 900, 0.18, 0.12, 0.3);
        tone("sine", 220, 140, 0.09, 0.12, 0.5);
        break;
      }
      case "chew":
        burst("lowpass", 900, 300, 0.07, 0.18);
        tone("sine", 120, 80, 0.06, 0.08);
        break;
      case "clink":
        for (const [f, d] of [[2400, 0], [3600, 0.004], [5200, 0.008]] as const) tone("sine", f, f, 0.22, 0.05, d);
        break;
      case "crunch":
        for (let i = 0; i < 3; i++) burst("bandpass", 2600 + i * 500, 1200, 0.03, 0.06, i * 0.05);
        break;
      case "pop":
        tone("sine", 360, 160, 0.07, 0.1);
        break;
    }
  }

  // Silent (and the audio engine paused) unless switched on and showing.
  function apply() {
    if (!ctx || !master) return;
    const audible = enabled && active;
    master.gain.setTargetAtTime(audible ? 0.6 : 0, ctx.currentTime, 0.08);
    if (audible) void ctx.resume();
    else setTimeout(() => {
      if (ctx && !(enabled && active) && ctx.state === "running") void ctx.suspend();
    }, 200);
  }

  return {
    setEnabled(on: boolean) {
      enabled = on;
      if (on) setup();
      apply();
    },
    setActive(on: boolean) {
      if (active === on) return;
      active = on;
      apply();
    },
    setLoops(levels: Loops) {
      musicLevel = levels.music;
      rainLevel = levels.rain;
      if (!ctx) return;
      for (const name of ["rain", "aircon", "purr"] as const) {
        const loudness = name === "purr" ? 0.5 : name === "rain" ? 0.55 : 0.18;
        loopGains[name]?.gain.setTargetAtTime(levels[name] * loudness, ctx.currentTime, 0.4);
      }
    },
    play,
    dispose() {
      stopListening();
      if (musicTimer) clearInterval(musicTimer);
      if (patter) clearInterval(patter);
      void ctx?.close();
    },
  };
}
