// src/three/materials/glass/glassEnter.ts
import { clamp, hash, PI, sin, step, uniform, vec2 } from 'three/tsl'
import type { Node } from 'three/webgpu'
import { glassBand } from './glassOpen'

// The card lighting up the first time Work is in view (F-35), driven by uEnter from 0 to 1: the
// same bands as the break (A-10) slide in from alternate sides and click into place, under a
// flash of scanlines.

// Strength of each part of the entrance; 0 turns a part off.
export const enterTuning = {
  slide: uniform(0.35), // how far the bands start from their place, in card widths
  spread: uniform(0.55), // share of the entrance over which the bands set off, one after another
  scan: uniform(0.6), // strength of the scanlines while the card lights up
}

// What the entrance does to one pixel of the card.
export interface EnterEffect {
  uv: Node<'vec2'> // where to read the card from
  shown: Node<'float'> // 1 once this pixel's band has set off
  scan: Node<'float'> // strength of the scanlines
}

export function glassEnter(uv: Node<'vec2'>, enter: Node<'float'>): EnterEffect {
  const band = glassBand(uv)
  const side = band.mod(2).mul(2).sub(1)
  // Each band sets off at its own moment and lands with a hard ease-out, no drift.
  const start = hash(band.add(5)).mul(enterTuning.spread)
  const run = enterTuning.spread.oneMinus()
  const local = clamp(enter.sub(start).div(run), 0, 1)
  const slide = side.mul(local.oneMinus().pow(3)).mul(enterTuning.slide)

  return {
    uv: vec2(uv.x.add(slide), uv.y),
    shown: step(start, enter).mul(step(0.0001, enter)),
    scan: sin(enter.mul(PI)).mul(enterTuning.scan),
  }
}
