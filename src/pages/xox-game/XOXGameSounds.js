
let audioContext;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function createNoise(ctx, duration) {
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

/* A short, sharp pencil contact with paper. */
export function playPencilMark() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Crisp initial pencil tap.
  const tap = ctx.createOscillator();
  const tapGain = ctx.createGain();

  tap.type = "triangle";
  tap.frequency.setValueAtTime(1250, now);
  tap.frequency.exponentialRampToValueAtTime(480, now + 0.045);

  tapGain.gain.setValueAtTime(0.001, now);
  tapGain.gain.linearRampToValueAtTime(0.075, now + 0.004);
  tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

  tap.connect(tapGain);
  tapGain.connect(ctx.destination);

  tap.start(now);
  tap.stop(now + 0.06);

  // Tiny, dry graphite scratch immediately after the tap.
  const duration = 0.075;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const scratchGain = ctx.createGain();

  source.buffer = createNoise(ctx, duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(3200, now + 0.018);
  filter.frequency.exponentialRampToValueAtTime(
    1700,
    now + duration + 0.018
  );
  filter.Q.value = 1.8;

  scratchGain.gain.setValueAtTime(0.001, now + 0.018);
  scratchGain.gain.linearRampToValueAtTime(
    0.045,
    now + 0.03
  );
  scratchGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + duration + 0.018
  );

  source.connect(filter);
  filter.connect(scratchGain);
  scratchGain.connect(ctx.destination);

  source.start(now + 0.018);
  source.stop(now + duration + 0.02);
}

/* A longer, textured graphite stroke for a winning line. */
export function playPencilStrike() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.62;

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  source.buffer = createNoise(ctx, duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1150, now);
  filter.frequency.linearRampToValueAtTime(
    2600,
    now + duration * 0.42
  );
  filter.frequency.linearRampToValueAtTime(
    1500,
    now + duration
  );
  filter.Q.value = 0.85;

  // Soft start, textured middle, gentle finish.
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.045, now + 0.06);
  gain.gain.linearRampToValueAtTime(
    0.085,
    now + duration * 0.38
  );
  gain.gain.linearRampToValueAtTime(
    0.035,
    now + duration * 0.78
  );
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

/* Keep the existing victory sound unchanged. */
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

/* Keep the restart sound subtle. */
export function playRestart() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.16;

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  source.buffer = createNoise(ctx, duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1300, now);
  filter.frequency.exponentialRampToValueAtTime(
    400,
    now + duration
  );

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.045, now + 0.025);
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
