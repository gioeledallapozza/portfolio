// src/three/tsl/sdf.ts
import { abs, fwidth, length, max, min, smoothstep, vec2 } from 'three/tsl'
import type { Node } from 'three/webgpu'

// 2D signed distance fields: negative inside a shape, zero on its outline, positive outside.
// Pure TSL blocks, shared by the glass cards and, in v2, the particles.

// A box of half size `half` whose corners are rounded with `radius`.
export function roundedBox(p: Node<'vec2'>, half: Node<'vec2'>, radius: Node<'float'>) {
  const q = abs(p).sub(half).add(radius)
  return length(max(q, vec2(0)))
    .add(min(max(q.x, q.y), 0))
    .sub(radius)
}

// A box of half size `half` whose corners are cut at 45° by `cut`, like the corners of Chakra Petch.
export function chamferBox(p: Node<'vec2'>, half: Node<'vec2'>, cut: Node<'float'>) {
  const q = abs(p).sub(half)
  // The cut is the line x + y = -cut in the corner's frame, as a distance.
  return max(max(q.x, q.y), q.x.add(q.y).add(cut).mul(Math.SQRT1_2))
}

// How much of the pixel is inside: 1 inside, 0 outside, antialiased over one pixel.
export function fill(d: Node<'float'>) {
  const pixel = fwidth(d)
  // Edges in increasing order: GLSL leaves smoothstep undefined otherwise.
  return smoothstep(pixel.negate(), pixel, d).oneMinus()
}

// A line of the given width that runs `inset` inside the outline, antialiased.
export function line(d: Node<'float'>, inset: Node<'float'>, width: Node<'float'>) {
  const pixel = fwidth(d)
  const half = width.mul(0.5)
  return smoothstep(half, half.add(pixel), abs(d.add(inset).add(half))).oneMinus()
}
