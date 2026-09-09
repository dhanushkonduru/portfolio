/* ============================================================================
 * SIGNAL
 *
 * Optional microphone input, and nothing else — no playback, no media
 * element, no autoplay. The stream is requested only when a visitor
 * explicitly turns it on, and released the moment they turn it off.
 *
 * What comes out is one number: a smoothed 0..1 amplitude. The apparatus uses
 * it to perturb node positions by single-digit percentages. It is a signal the
 * structure responds to, not a level meter.
 * ========================================================================= */

export type SignalState = {
  /** Smoothed amplitude, 0..1. Zero whenever the input is off. */
  level: number;
  live: boolean;
};

export const signal: SignalState = { level: 0, live: false };

const listeners = new Set<() => void>();
export function subscribeSignal(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getSignalLive() {
  return signal.live;
}
export function getSignalLiveServer() {
  return false;
}
function emit() {
  for (const l of listeners) l();
}

let ctx: AudioContext | null = null;
let stream: MediaStream | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;
let raf = 0;

function sample() {
  raf = requestAnimationFrame(sample);
  if (!analyser || !bins) return;
  analyser.getByteTimeDomainData(bins);

  // RMS about the 128 midpoint. Time-domain rather than frequency because the
  // structure responds to how much is happening, not to which notes.
  let sum = 0;
  for (let i = 0; i < bins.length; i++) {
    const v = (bins[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / bins.length);

  // Asymmetric smoothing: rise quickly, fall back to equilibrium slowly, so
  // the system settles rather than flickering.
  const target = Math.min(1, rms * 3.2);
  const k = target > signal.level ? 0.35 : 0.06;
  signal.level += (target - signal.level) * k;
}

export async function enableSignal(): Promise<boolean> {
  if (signal.live) return true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    return false;
  }
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  ctx = new AC();
  const src = ctx.createMediaStreamSource(stream);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  bins = new Uint8Array(new ArrayBuffer(analyser.fftSize));
  src.connect(analyser); // analyser is a sink; nothing is routed to output
  signal.live = true;
  emit();
  sample();
  return true;
}

export function disableSignal() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  stream?.getTracks().forEach((t) => t.stop());
  void ctx?.close();
  ctx = null;
  stream = null;
  analyser = null;
  bins = null;
  signal.level = 0;
  signal.live = false;
  emit();
}
