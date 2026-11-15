/**
 * Motion tokens. Every animated component reads its durations, distances and
 * springs from here, so the page moves with one hand.
 */
export const motionTokens = {
  duration: { fast: 0.2, normal: 0.45, slow: 0.9, reveal: 1.1 },
  easing: {
    /** Entrances: fast out of the gate, long settle. */
    out: [0.16, 1, 0.3, 1] as [number, number, number, number],
    /** State to state. */
    inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  },
  distance: { sm: 8, md: 18, lg: 36, xl: 72 },
  /** How soft a thing is before it has arrived, in px. */
  blur: 7,
  scale: { press: 0.97, pop: 1.03, card: 0.94 },
  stagger: 0.07,
} as const;

export const springs = {
  /** Cursor-following things: tight, no wobble. */
  magnet: { type: "spring", stiffness: 180, damping: 16, mass: 0.4 },
  snappy: { type: "spring", stiffness: 420, damping: 32 },
  gentle: { type: "spring", stiffness: 140, damping: 22 },
} as const;
