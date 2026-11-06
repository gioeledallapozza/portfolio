// src/three/materials/glass/glassOpen.ts
import {
  clamp,
  floor,
  hash,
  min,
  PI,
  screenUV,
  select,
  sin,
  smoothstep,
  step,
  time,
  uniform,
  vec2,
} from 'three/tsl'
import type { Node } from 'three/webgpu'
import { blockNoise } from '../../tsl/noise'

// The glass breaking when a card opens (F-22), driven by uOpen from 0 to 1 in sync with the camera.
// On its own file so variants can be tried by swapping this one function.

// Strength of each part of the break; 0 turns a part off.
export const openTuning = {
  slide: uniform(0.12), // how far the bands slide sideways, in card widths
  aberration: uniform(0.015), // colour split at the peak, in card widths
  noise: uniform(0.2), // share of digital noise blocks at the peak
  flash: uniform(0.25), // brightness of the scanline flash
  preview: uniform(0), // holds every card at this point of the break, for tuning it by eye
  // The frame of glass left along the screen's edges once open; the detail's CSS draws the same
  // frame (work.css, .work-detail::before), so canvas and dialog read as one scene.
  frame: uniform(0.08), // width, as a share of the screen (8% in work.css)
  frost: uniform(0.7), // how frosted the frame is
}

// What the break does to one pixel of the card.
export interface OpenEffect {
  uv: Node<'vec2'> // where to read the image and the shape from
  aberration: Node<'float'> // extra colour split
  glass: Node<'float'> // 1 while this pixel's band of glass still stands, 0 once it is gone
  noise: Node<'float'> // 1 where a digital noise block covers the pixel
  flash: Node<'float'> // strength of the scanline flash
  frame: Node<'float'> // 1 on the screen's edges, where the glass stays once open
}

// The band of glass a pixel belongs to: six thick rows, some of them split into thin ones, so
// the heights differ. Shared with the entrance (glassEnter), so the card mends along the same cuts.
export function glassBand(uv: Node<'vec2'>) {
  const thick = floor(uv.y.mul(6))
  const thin = floor(uv.y.mul(26)).add(100)
  return select(hash(thick).greaterThan(0.55), thin, thick)
}

// The break at `open`: bands of different heights slide left and right, colours split, noise
// blocks flicker, scanlines flash, and each band of glass vanishes at its own moment.
export function glassOpen(uv: Node<'vec2'>, open: Node<'float'>): OpenEffect {
  // 0 at rest and when fully open, 1 halfway: the moments that must show a clean card stay clean.
  const burst = sin(open.mul(PI))

  const band = glassBand(uv)
  // Alternate directions, each band with its own distance.
  const side = band.mod(2).mul(2).sub(1)
  const slide = side
    .mul(burst)
    .mul(openTuning.slide)
    .mul(hash(band.add(11)).mul(0.8).add(0.2))

  // Each band stands until `open` passes its own threshold, so the glass breaks piece by piece.
  const glass = step(open, hash(band.add(7)).mul(0.7).add(0.25))

  // Blocks that change 20 times a second; at the peak about `noise` of them light up.
  const blocks = blockNoise(uv, vec2(18, 10), time, 20)
  const noise = step(burst.mul(openTuning.noise).oneMinus(), blocks)

  // The frame: full on the screen's edges, fading to nothing `frame` inside, as the CSS mask;
  // it comes in over the second half of the flight.
  const fromEdge = min(
    min(screenUV.x, screenUV.x.oneMinus()),
    min(screenUV.y, screenUV.y.oneMinus()),
  )
  const frame = clamp(fromEdge.div(openTuning.frame), 0, 1)
    .oneMinus()
    .mul(smoothstep(0.5, 1, open))

  return {
    uv: vec2(uv.x.add(slide), uv.y),
    aberration: burst.mul(openTuning.aberration).mul(hash(band.add(3))),
    glass,
    noise,
    flash: burst.pow(4).mul(openTuning.flash),
    frame,
  }
}
