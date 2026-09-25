// Petits effets sonores (Web Audio), voix française et vibrations.

const MUTE_KEY = 'grandtour:mute';

let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;

export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem(MUTE_KEY, v ? '1' : '0');
  } catch {
    /* navigation privée */
  }
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.14) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(start: number, dur: number, gain = 0.2) {
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

export const sfx = {
  /** Les trois notes du carillon SNCF. */
  chime() {
    tone(659, 0, 0.5, 'sine', 0.12);
    tone(784, 0.22, 0.5, 'sine', 0.12);
    tone(988, 0.44, 0.8, 'sine', 0.12);
  },
  roll() {
    for (let i = 0; i < 6; i++) noise(i * 0.07, 0.05, 0.12);
  },
  step() {
    tone(420, 0, 0.08, 'triangle', 0.06);
  },
  stamp() {
    noise(0, 0.12, 0.35);
    tone(90, 0, 0.18, 'sine', 0.3);
  },
  good() {
    tone(523, 0, 0.18, 'triangle');
    tone(659, 0.1, 0.18, 'triangle');
    tone(784, 0.2, 0.35, 'triangle');
  },
  bad() {
    tone(220, 0, 0.25, 'sawtooth', 0.07);
    tone(165, 0.18, 0.4, 'sawtooth', 0.07);
  },
  tick() {
    tone(1200, 0, 0.04, 'square', 0.03);
  },
  whistle() {
    tone(1480, 0, 0.35, 'sine', 0.08);
    tone(1760, 0.05, 0.35, 'sine', 0.06);
  },
};

export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non pris en charge */
  }
}

// ─── Voix française ─────────────────────────────────────────

let frVoice: SpeechSynthesisVoice | null = null;
function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  frVoice =
    voices.find((v) => v.lang === 'fr-FR' && /google|amélie|thomas|audrey|marie/i.test(v.name)) ??
    voices.find((v) => v.lang === 'fr-FR') ??
    voices.find((v) => v.lang.startsWith('fr')) ??
    null;
}
if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export const canSpeak = () => typeof speechSynthesis !== 'undefined';

export function speakFrench(text: string, rate = 0.85) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = rate;
  if (frVoice) u.voice = frVoice;
  speechSynthesis.speak(u);
}
