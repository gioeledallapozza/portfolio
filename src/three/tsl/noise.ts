// src/three/tsl/noise.ts
import { floor, hash, vec2 } from 'three/tsl'
import type { Node } from 'three/webgpu'

// Random values for grain and digital glitches. Pure TSL blocks: same input, same output.
// Seeds stay small: hash() works on floats, which lose whole numbers past 2^24 and would give
// neighbouring cells the same value (visible as streaks).

const TICKS = 61 // time steps before the pattern repeats; prime, so it never lines up with a row

// A random value in [0, 1) for each integer cell of a 2D grid (cells must be ≥ 0).
export function hash21(cell: Node<'vec2'>) {
  return hash(cell.x.add(hash(cell.y).mul(1e6)))
}

// The current time step, `rate` per second, wrapping after TICKS.
function tick(time: Node<'float'>, rate: number) {
  return floor(time.mul(rate)).mod(TICKS)
}

// Fine film grain in [-0.5, 0.5): a new value per screen pixel, changing `rate` times a second.
// The mean of two random values: most pixels stay near 0, few stand out as dots.
export function grain(pixel: Node<'vec2'>, time: Node<'float'>, rate = 24) {
  const step = tick(time, rate)
  const cell = floor(pixel).add(vec2(step.mul(53), step.mul(97)))
  return hash21(cell)
    .add(hash21(cell.add(vec2(7919, 0))))
    .mul(0.5)
    .sub(0.5)
}

// A random value per block of a `cells` grid over the uv square, redrawn `rate` times a second
// (rate 0: blocks that never change).
export function blockNoise(uv: Node<'vec2'>, cells: Node<'vec2'>, time: Node<'float'>, rate = 0) {
  const step = tick(time, rate)
  return hash21(floor(uv.mul(cells)).add(vec2(step.mul(31), step.mul(17))))
}
