// src/three/Stage.tsx
import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import { sections } from '../sections'
import { SectionAnchor } from './SectionAnchor'

// The single canvas behind the page (A-01). three falls back to WebGL2 by itself when WebGPU
// is missing; `?webgl` forces it. With no backend at all the stage unmounts (N-03).

const forceWebGL = new URLSearchParams(window.location.search).has('webgl')

// Fixed canvas that mounts the scene of every section that has one.
export function Stage() {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <div className="stage">
      <Canvas
        // Pointer events come from the whole page, since the HTML sits on top of the canvas.
        eventSource={document.getElementById('root')!}
        eventPrefix="client"
        // Narrow lens: the cylinder curves without fisheye. No tone mapping: the cards keep the
        // colours of the HTML images, so the zoom into the detail has no visible seam (F-22).
        camera={{ fov: 35, position: [0, 0, 10] }}
        flat
        // An object, because `false` makes R3F set PCFSoftShadowMap, which WebGPURenderer no longer has.
        shadows={{ enabled: false }}
        gl={async ({ canvas }) => {
          // <Canvas> always hands over its own DOM canvas, never an OffscreenCanvas.
          const renderer = new WebGPURenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: true,
            forceWebGL,
          })
          try {
            await renderer.init()
          } catch (error) {
            setFailed(true)
            throw error
          }
          if (import.meta.env.DEV) {
            const backend = 'isWebGLBackend' in renderer.backend ? 'webgl2' : 'webgpu'
            console.info(`[stage] backend: ${backend}`)
          }
          return renderer
        }}
      >
        {sections.map(
          ({ id, Scene }) =>
            Scene && (
              <SectionAnchor key={id} id={id}>
                <Suspense fallback={null}>
                  <Scene />
                </Suspense>
              </SectionAnchor>
            ),
        )}
      </Canvas>
    </div>
  )
}
