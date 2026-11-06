// src/motion/scramble.ts
// Character glitch for "system" text (A-10): pure functions of the text and the time, so the
// loader and the titles on the cards draw the same glitch.

const CHARS = '>)#j4f7<_/\\|[]{}*+=%$&@!?'
const FRAME = 50 // ms each random character holds: the glitch steps, it does not shimmer
const WINDOW = 700 // ms; at most one burst per window, at a random moment in it
const BURST_CHANCE = 0.45 // share of windows with a burst
const BURST_FRAMES = 2 // how long a burst lasts
const SWAP_CHANCE = 0.4 // share of letters a burst swaps

// Repeatable noise in 0…1 from three integers: the same inputs always give the same glitch.
function noise(a: number, b: number, c: number) {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const randomChar = (frame: number, index: number) =>
  CHARS[Math.floor(noise(frame, index, 1) * CHARS.length)]

// `text` at `time` ms: now and then, for an instant, some letters turn into random characters.
export function glitch(text: string, time: number) {
  const frame = Math.floor(time / FRAME)
  const window = Math.floor(time / WINDOW)
  const first = Math.floor(
    (window * WINDOW) / FRAME + noise(window, 0, 2) * (WINDOW / FRAME - BURST_FRAMES),
  )
  const burst = noise(window, 0, 3) < BURST_CHANCE && frame >= first && frame < first + BURST_FRAMES
  if (!burst) return text
  return [...text]
    .map((char, i) =>
      char !== ' ' && noise(frame, i, 4) < SWAP_CHANCE ? randomChar(frame, i) : char,
    )
    .join('')
}

// From `from` to `to` while `progress` goes 0 → 1: each letter, at its own moment, runs through
// random characters and settles on the new one. An empty `from` starts as all random characters.
export function decode(from: string, to: string, progress: number, time: number) {
  const frame = Math.floor(time / FRAME)
  const before = [...from]
  const after = [...to]
  const length = Math.max(before.length, after.length)
  let text = ''
  for (let i = 0; i < length; i++) {
    const start = noise(i, length, 5) * 0.5 // the letter settles half a run after it starts
    if (progress >= start + 0.5) text += after[i] ?? ''
    else if (progress >= start || before[i] === undefined) text += randomChar(frame, i)
    else text += before[i]
  }
  return text
}
