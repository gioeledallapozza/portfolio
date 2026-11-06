// src/three/SectionAnchor.tsx
import { Suspense, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, type Group, type Object3D } from 'three'

// Ties a scene to its HTML section: it scrolls with it, is hidden while the section is off screen,
// and is compiled under the loader, so its first sight does not stall (F-05).

// The camera at rest, set by Stage. Sizes on the z = 0 plane come from it, not from R3F's viewport:
// that one is measured from wherever the camera is when the canvas resizes, and on a phone opening
// a detail resizes it (the address bar) while the camera is inside a card.
export const CAMERA = { fov: 35, distance: 10 }

// Width and height of the z = 0 plane on a canvas of `size` CSS pixels, seen by the resting camera.
export function restingViewport({ width, height }: { width: number; height: number }) {
  const planeHeight = 2 * Math.tan(MathUtils.degToRad(CAMERA.fov) / 2) * CAMERA.distance
  return { width: (planeHeight * width) / height, height: planeHeight, aspect: width / height }
}

// Props of SectionAnchor.
interface SectionAnchorProps {
  id: string
  onCompiled: (id: string) => void
  children: ReactNode
}

// Group that follows the section with the given id.
export function SectionAnchor({ id, onCompiled, children }: SectionAnchorProps) {
  const group = useRef<Group>(null)

  useFrame(({ size }) => {
    // A section taller than the screen marks with data-scene the part its scene stays with.
    const section = document.getElementById(id)
    const element = section?.querySelector('[data-scene]') ?? section
    if (!element || !group.current) return
    const rect = element.getBoundingClientRect()
    group.current.visible = rect.bottom > 0 && rect.top < size.height
    // Section centre to screen centre, from CSS pixels to world units on the z = 0 plane.
    const offset = size.height / 2 - (rect.top + rect.height / 2)
    group.current.position.y = (offset * restingViewport(size).height) / size.height
  })

  return (
    <group ref={group}>
      <Suspense fallback={null}>
        {children}
        {/* In the same boundary as the scene, so it mounts only once the scene's assets are in. */}
        <Compile group={group} id={id} onCompiled={onCompiled} />
      </Suspense>
    </group>
  )
}

// Compiles the scene's shaders and uploads its textures.
function Compile({
  group,
  id,
  onCompiled,
}: {
  group: RefObject<Group | null>
  id: string
  onCompiled: (id: string) => void
}) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    // compileAsync skips hidden and out-of-frustum objects, and collects the rest at once: the whole
    // scene counts as in view just for the call. The next frame hides again what must be hidden.
    const culled: Object3D[] = []
    group.current!.traverse((object) => {
      object.visible = true
      if (!object.frustumCulled) return
      object.frustumCulled = false
      culled.push(object)
    })
    const done = gl.compileAsync(group.current!, camera, scene)
    culled.forEach((object) => (object.frustumCulled = true))
    void done.then(() => onCompiled(id))
  }, [gl, camera, scene, group, id, onCompiled])

  return null
}
