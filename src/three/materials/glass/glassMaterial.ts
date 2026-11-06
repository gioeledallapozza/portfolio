// src/three/materials/glass/glassMaterial.ts
import {
  cameraPosition,
  cross,
  float,
  max,
  mix,
  normalize,
  normalLocal,
  normalWorld,
  positionWorld,
  screenCoordinate,
  sin,
  smoothstep,
  step,
  texture,
  time,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl'
import { Color, MeshBasicNodeMaterial, Vector2, type Node, type Texture } from 'three/webgpu'
import { chromaticSample, desaturate, softSample } from '../../tsl/color'
import { blockNoise, grain } from '../../tsl/noise'
import { chamferBox, fill, line, roundedBox } from '../../tsl/sdf'
import { glassEnter } from './glassEnter'
import { glassOpen, openTuning } from './glassOpen'

// Glass cards (F-24, A-04): the project image under a simulated pane tinted with its own colour,
// a slab that gives it thickness, and the title floating in front. Built from the blocks in
// three/tsl; changing a uniform never recompiles.

const ASPECT = 16 / 9 // card width over height; every image is 16:9

const token = (name: string) =>
  new Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim())

// Shared by every card, grouped like the Inspector's folders. Lengths are in card heights.
export const glassTuning = {
  color: {
    dim: uniform(0.15), // darkening of the image
    desat: uniform(0.25), // desaturation of the image
    tint: uniform(0.35), // how much the glass takes the colour of the image right under it
    blur: uniform(9.6), // mipmap level of that colour: high is the dominant colour of the area
  },
  shape: {
    // These three also shape the slab's geometry: WorkScene rebuilds it when they change.
    cut: uniform(1), // 0 = rounded corners, 1 = corners cut at 45°
    corner: uniform(0.03), // size of the rounding or of the cut
    thickness: uniform(0.03), // depth of the slab, and width of the rim seen from the front
  },
  edge: {
    width: uniform(0.004), // the threads of light on the outline and on the rim's inner edge
    glow: uniform(0.7), // brightness of the threads
    shade: uniform(0.5), // how much the rim catches the light from the top left
    tint: uniform(0.8), // at rest, how much the edge takes the colour under it instead of `rest`
    rest: uniform(token('--color-text')),
    active: uniform(token('--color-accent')), // hover and focus
  },
  band: {
    on: uniform(1), // 0 hides the reflection
    strength: uniform(0.025),
    width: uniform(0.35),
    slant: uniform(0.7), // how diagonal it is
    travel: uniform(1.6), // how far it runs as the card turns
    follow: uniform(0.25), // how far it leans toward the pointer
  },
  scan: {
    strength: uniform(0), // off by default
    density: uniform(1.6), // radians per screen pixel: about one line every 4 px
  },
  grain: {
    strength: uniform(0.08), // grain that darkens and lightens the image
    cover: uniform(0.15), // the colour under it, with its own grain, laid over like frosted glass
  },
}

// The title over the glass.
export const titleTuning = {
  color: uniform(token('--color-text')),
  aberration: uniform(0.0007), // colour split at rest, in card widths
}

// The values each card moves on its own, so hovering a card leaves its copies alone.
const createCardUniforms = () => ({
  hover: uniform(0), // 0 → 1 while the pointer is over the card
  focus: uniform(0), // 0 → 1 while the card has keyboard focus
  open: uniform(0), // 0 → 1 during the flight into the card
  enter: uniform(0), // 0 → 1 as the card lights up the first time Work is in view (F-35)
  pointer: uniform(new Vector2(0.5, 0.5)), // pointer on the card, in uv
})
export type CardUniforms = ReturnType<typeof createCardUniforms>

// The materials of one card: the glass, its slab, the title in front, and the uniforms they share.
export function createGlassCard(image: Texture, title: Texture) {
  const uniforms = createCardUniforms()
  const { color, shape, edge, band, scan } = glassTuning
  const active = uniforms.hover.max(uniforms.focus)
  const map = texture(image)

  // The colour of the image around a point: a coarser mipmap read at the same uv, softened, so
  // every part of the glass takes the colour of what lies right under it.
  const frosted = (at: Node<'vec2'>) => softSample(map, at, color.blur)
  // The edge: that colour at full brightness at rest, the accent on hover and focus.
  const edgeColor = (under: Node<'vec3'>) => {
    const bright = under.div(max(max(under.r, under.g), under.b).max(0.001))
    return mix(mix(edge.rest, bright, edge.tint), edge.active, active)
  }
  // The rim, the glass's thickness: the colour under it mixed with the edge colour, lit by a light
  // from the top left. One recipe for the sides of the slab and for the rim seen from the front,
  // so the two read as the same material. `normal` is in the card's own space.
  const rimColor = (under: Node<'vec3'>, normal: Node<'vec3'>) => {
    const lambert = normal.dot(normalize(vec3(-0.4, 0.6, 0.7))).max(0)
    return mix(under.mul(0.6), edgeColor(under), active.mul(0.4).add(0.35)).mul(
      lambert.mul(0.75).add(0.25),
    )
  }
  // f. Fine grain, new every frame, by `amount`: first multiplied (added light lifts the blacks a
  // lot once the output goes to sRGB), then a veil of the colour under it, with the same grain.
  const noise = grain(screenCoordinate, time)
  const grained = (color: Node<'vec3'>, under: Node<'vec3'>, amount: Node<'float'>) => {
    const speckled = color.mul(noise.mul(glassTuning.grain.strength).mul(amount).add(1))
    const veil = under.mul(noise.mul(0.6).add(1))
    return mix(speckled, veil, glassTuning.grain.cover.mul(amount))
  }

  // The entrance, then the break of the opening, move the bands of the image, of the shape and of
  // the title alike.
  const enter = glassEnter(uv(), uniforms.enter)
  const opening = uniforms.open.max(openTuning.preview)
  const open = glassOpen(enter.uv, opening)
  // Glass that stands: `glassOn` for the unbroken bands, `kept` adds the frame left on the screen's
  // edges once open (the frame keeps the frosted colour and grain, not the edge or the band).
  const glassOn = open.glass
  const kept = glassOn.max(open.frame)

  // Card space: centred, one card height = 1.
  const p = open.uv.sub(0.5).mul(vec2(ASPECT, 1))
  const half = vec2(ASPECT / 2, 0.5)

  // a. The image, sharp, a little darker and greyer, then washed with the blurred colour of the
  // same spot, like frosted glass tinted by what is behind it.
  const picture = chromaticSample(map, open.uv, open.aberration).color
  const frost = frosted(open.uv)
  const dimmed = desaturate(picture, color.desat).mul(color.dim.oneMinus())
  const tinted = mix(dimmed, frost, color.tint.max(openTuning.frost.mul(open.frame)))
  let result = mix(picture, tinted, kept)

  // b. The shape: rounded or cut corners.
  const d = mix(roundedBox(p, half, shape.corner), chamferBox(p, half, shape.corner), shape.cut)

  // c. The rim: a band as wide as the slab is thick, inside the outline, coloured like the slab's
  // sides; its normal leans outward (by `shade`), as on a bevel, so it catches the same light.
  // Then a thread of light on the outline and a fainter one on the rim's inner edge.
  const rim = fill(d).mul(fill(d.add(shape.thickness)).oneMinus())
  const outward = normalize(p.div(half))
  const rimNormal = normalize(vec3(outward.mul(edge.shade), 1))
  result = mix(result, rimColor(frost, rimNormal), rim.mul(glassOn))
  const thread = line(d, float(0), edge.width).add(line(d, shape.thickness, edge.width).mul(0.4))
  result = result.add(edgeColor(frost).mul(thread).mul(edge.glow).mul(glassOn))

  // d. A diagonal band of light: where it falls depends on the card's angle to the camera, so it
  // sweeps across as the prism turns; on hover it leans toward the pointer.
  const toCamera = normalize(cameraPosition.sub(positionWorld))
  const facing = cross(normalWorld, toCamera).y // 0 when the card faces the camera
  const lean = uniforms.pointer.x.sub(0.5).mul(ASPECT).mul(band.follow).mul(uniforms.hover)
  const across = p.x.add(p.y.mul(band.slant)).sub(facing.mul(band.travel)).sub(lean).abs()
  const sheen = smoothstep(band.width.mul(0.5), band.width.mul(0.2), across)
  result = result.add(sheen.mul(band.strength).mul(band.on).mul(glassOn))

  // e. Scanlines on the screen's rows, stronger while the card lights up.
  const rows = sin(screenCoordinate.y.mul(scan.density)).mul(0.5).add(0.5)
  result = result.mul(rows.mul(scan.strength.max(enter.scan)).mul(glassOn).oneMinus())

  // f. The grain, defined above with the rim.
  result = grained(result, frost, kept)

  // The break on top: noise blocks in the accent colour and a flash of scanlines.
  result = mix(result, edge.active.mul(rows), open.noise.mul(0.6))
  result = result.add(rows.mul(open.flash))

  const glass = new MeshBasicNodeMaterial({ transparent: true })
  glass.colorNode = result
  // Where the glass is gone the card is a plain rectangle, like the detail's image.
  glass.opacityNode = mix(1, fill(d), glassOn).mul(enter.shown)

  // The title: a mask in the text colour, split into red, green and blue for the fringes, that
  // breaks with the glass and crumbles into blocks as the card opens.
  const mask = chromaticSample(
    texture(title),
    open.uv,
    titleTuning.aberration.add(open.aberration),
  ).alpha
  const coverage = mask.x.max(mask.y).max(mask.z)
  const crumble = step(opening.mul(1.15), blockNoise(open.uv, vec2(64, 36), time))
  const titleMaterial = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
  titleMaterial.colorNode = mask.mul(titleTuning.color).div(coverage.max(0.001))
  titleMaterial.opacityNode = coverage.mul(crumble).mul(enter.shown)

  // The slab's sides: the rim's recipe and grain, on the colour of the image at the border (the
  // slab's uv come from its position).
  const border = frosted(uv())
  const slab = new MeshBasicNodeMaterial()
  slab.colorNode = grained(rimColor(border, normalLocal), border, float(1))
  // Opaque, so its bands are cut out rather than faded.
  slab.maskNode = glassEnter(uv(), uniforms.enter).shown.greaterThan(0.5)

  return { glass, slab, title: titleMaterial, uniforms }
}
