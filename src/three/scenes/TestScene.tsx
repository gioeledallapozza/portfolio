// src/three/scenes/TestScene.tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { color, mix, normalView } from 'three/tsl'

// Test scene for the skeleton: proves the renderer and a TSL material on both backends.
// Removed in S-04.

// Reads a colour token, so the canvas uses the same palette as the CSS (N-10).
function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Spinning torus knot shaded from accent to background by its view-space normal.
export function TestScene() {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(() => {
    const shade = normalView.z.mul(0.5).add(0.5)
    return new MeshBasicNodeMaterial({
      colorNode: mix(color(token('--color-bg')), color(token('--color-accent')), shade),
    })
  }, [])

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={mesh} material={material}>
      <torusKnotGeometry args={[1, 0.3, 160, 24]} />
    </mesh>
  )
}
