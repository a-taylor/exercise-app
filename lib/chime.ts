// Audio cues for the guided session. The exercise start/end tones are the only
// way to follow the routine without watching the screen, so they need to work
// on an iPhone: iOS only lets an AudioContext produce sound if it was resumed
// from a user gesture, hence unlockAudio() being called from the Start/Resume
// taps rather than from the timer.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  return ctx;
}

/**
 * Create/resume the AudioContext. Must be called synchronously from a user
 * gesture (a click handler) — safe to call repeatedly.
 */
export function unlockAudio(): void {
  const audio = getContext();
  if (audio && audio.state !== "running") void audio.resume();
}

// One sine blip, scheduled `delay` seconds from now on the audio clock.
function playTone(
  audio: AudioContext,
  frequency: number,
  delay: number,
  duration: number,
): void {
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration);
}

function play(notes: [frequency: number, delay: number, duration: number][]) {
  const audio = getContext();
  if (!audio) return;
  // The context can end up suspended again after the app is backgrounded.
  if (audio.state !== "running") void audio.resume();
  for (const [frequency, delay, duration] of notes) {
    playTone(audio, frequency, delay, duration);
  }
}

/** Two rising blips — an exercise is starting, go. */
export function playStartChime(): void {
  play([
    [660, 0, 0.11],
    [990, 0.13, 0.11],
  ]);
}

/** One longer blip — the exercise is over. */
export function playEndChime(): void {
  play([[880, 0, 0.3]]);
}
