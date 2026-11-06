// src/three/materials/glass/glassShape.ts
import { ExtrudeGeometry, Shape } from 'three/webgpu'

// The card's outline as real geometry: the slab behind the glass that gives the card its
// thickness. Same corners as the shader's sdf (glassMaterial), so the two always line up.

// Corners and thickness, in card heights, as in glassTuning.shape.
export interface SlabShape {
  cut: boolean // corners cut at 45° instead of rounded
  corner: number
  thickness: number
}

// The sides of the slab of a card `width` × `height`, from z = -thickness to z = 0. No faces:
// the glass plane is the front, and a card whose back would show is hidden (useCarousel).
// Its uv come from the position, as on the glass, so the sides take the image's border colour.
export function createSlabGeometry(width: number, height: number, slab: SlabShape) {
  const x = width / 2
  const y = height / 2
  const c = Math.min(slab.corner * height, y)
  const depth = Math.max(slab.thickness * height, 0.001)

  // Clockwise from the top left, one corner at a time.
  const outline = new Shape()
  if (slab.cut) {
    outline.moveTo(-x + c, y)
    outline.lineTo(x - c, y)
    outline.lineTo(x, y - c)
    outline.lineTo(x, -y + c)
    outline.lineTo(x - c, -y)
    outline.lineTo(-x + c, -y)
    outline.lineTo(-x, -y + c)
    outline.lineTo(-x, y - c)
  } else {
    outline.moveTo(-x + c, y)
    outline.lineTo(x - c, y)
    outline.absarc(x - c, y - c, c, Math.PI / 2, 0, true)
    outline.lineTo(x, -y + c)
    outline.absarc(x - c, -y + c, c, 0, -Math.PI / 2, true)
    outline.lineTo(-x + c, -y)
    outline.absarc(-x + c, -y + c, c, -Math.PI / 2, -Math.PI, true)
    outline.lineTo(-x, y - c)
    outline.absarc(-x + c, y - c, c, Math.PI, Math.PI / 2, true)
  }

  const geometry = new ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 6 })
  geometry.translate(0, 0, -depth)

  // ExtrudeGeometry draws the two faces in its first group and the sides in the second: draw
  // only the sides (from 0, the material's index in WorkScene's array).
  const sides = geometry.groups[1]
  geometry.clearGroups()
  geometry.addGroup(sides.start, sides.count, 0)

  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / width + 0.5, position.getY(i) / height + 0.5)
  }
  return geometry
}
