// Audio cues for the guided session. The exercise start/end tones are the only
// way to follow the routine without watching the screen, so they need to be
// heard across a room from a phone speaker:
//
// - Frequencies sit in the 1-2kHz band. A phone speaker can barely move air
//   below ~500Hz, and human hearing peaks around 2-4kHz, so pitch does far
//   more for audibility here than gain does.
// - Square waves, not sines. The extra harmonics cut through a room at the
//   same nominal level.
// - iOS only lets an AudioContext produce sound if it was resumed from a user
//   gesture, hence unlockAudio() being called from the Start/Resume taps
//   rather than from the timer.

// Peak gain per note (0-1). The one knob to turn if the cues need to be
// louder or softer.
const PEAK_GAIN = 0.6;

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

// One blip, scheduled `delay` seconds from now on the audio clock.
function playTone(
  audio: AudioContext,
  frequency: number,
  delay: number,
  duration: number,
): void {
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  // Takes the harshest edge off the square wave without dulling it.
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 5000;
  osc.type = "square";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, start + 0.008);
  gain.gain.setValueAtTime(PEAK_GAIN, start + duration - 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(filter);
  filter.connect(gain);
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
    [1046, 0, 0.13],
    [1568, 0.15, 0.18],
  ]);
}

/** Three quick blips — the exercise is over. */
export function playEndChime(): void {
  play([
    [1318, 0, 0.12],
    [1318, 0.17, 0.12],
    [1318, 0.34, 0.22],
  ]);
}
