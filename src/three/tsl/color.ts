// src/three/tsl/color.ts
import { int, luminance, max, mix, vec2, vec3 } from 'three/tsl'
import type { Node, TextureNode } from 'three/webgpu'

// Colour blocks in pure TSL: desaturation and chromatic aberration.

// The colour moved toward its own grey by `amount` (0 = untouched, 1 = grey).
export function desaturate(color: Node<'vec3'>, amount: Node<'float'>) {
  return mix(color, vec3(luminance(color)), amount)
}

// A soft blur: a coarse mipmap read nine times on a 3×3 grid, one texel apart. One read of a
// small mipmap shows its texels as squares; nine smooth them into a round glow.
export function softSample(map: TextureNode, uv: Node<'vec2'>, level: Node<'float'>) {
  // The typings return a plain Node: it is the mipmap's ivec2 size.
  const size = map.size(int(level)) as Node<'ivec2'>
  const texel = vec2(1).div(vec2(size))
  let sum: Node<'vec3'> = vec3(0)
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      sum = sum.add(map.sample(uv.add(texel.mul(vec2(x, y)))).level(level).rgb)
    }
  }
  return sum.div(9)
}

// Reads a texture three times, red shifted by +offset and blue by -offset along x: the colour
// fringes of a cheap lens. Returns the colour, and in alpha the highest of the three alphas.
export function chromaticSample(map: TextureNode, uv: Node<'vec2'>, offset: Node<'float'>) {
  const shift = vec2(offset, 0)
  const red = map.sample(uv.add(shift))
  const green = map.sample(uv)
  const blue = map.sample(uv.sub(shift))
  return {
    color: vec3(red.r, green.g, blue.b),
    // Alpha of each channel apart, for textures that are only a mask, like the titles.
    alpha: vec3(red.a, green.a, blue.a),
    coverage: max(max(red.a, green.a), blue.a),
  }
}
