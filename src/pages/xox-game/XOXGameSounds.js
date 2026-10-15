
let audioContext;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioContext) audioContext = new AudioContextClass();

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function createNoise(ctx, duration) {
  const buffer = ctx.createBuffer(
    1,
    Math.ceil(ctx.sampleRate * duration),
    ctx.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function playScrape(duration, volume, frequency = 1800) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  source.buffer = createNoise(ctx, duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, now);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(400, frequency * 0.5),
    now + duration
  );
  filter.Q.value = 1.1;

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + duration
  );

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(now);
  source.stop(now + duration);
}

export function playPencilMark() {
  // Short pencil tap and scratch.
  playScrape(0.11, 0.12, 2400);
}

export function playPencilStrike() {
  // Longer scratch for a winning line.
  playScrape(0.55, 0.15, 2100);
}

export function playVictory() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + index * 0.12;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      start + 0.36
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.38);
  });
}

export function playRestart() {
  playScrape(0.2, 0.07, 1200);
}
