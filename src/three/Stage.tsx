// src/three/Stage.tsx
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { DefaultLoadingManager, WebGPURenderer } from 'three/webgpu'
import { timedOut } from '../loader/loader'
import type { Phase } from '../loader/phases'
import { sections } from '../sections'
import { CAMERA, SectionAnchor } from './SectionAnchor'

// The single canvas behind the page (A-01). three falls back to WebGL2 by itself when WebGPU
// is missing; `?webgl` forces it. With no backend at all, or past the loader's time limit, it unmounts.

const query = new URLSearchParams(window.location.search)
const forceWebGL = query.has('webgl')

// Development only: `?inspector` opens the three.js Inspector with the tuning of the scenes.
const InspectorPanel =
  import.meta.env.DEV && query.has('inspector')
    ? lazy(() => import('./inspector/InspectorPanel'))
    : null

const sceneCount = sections.filter((section) => section.Scene).length
const compiled = new Set<string>()

// The loader's phases this stage reports (F-05).
interface StageProps {
  textures: Phase
  compile: Phase
}

// Fixed canvas that mounts the scene of every section that has one.
export function Stage({ textures, compile }: StageProps) {
  const [off, setOff] = useState(false)

  // Past the loader's time limit the grid stays for the whole visit: no swap under the user's eyes (F-23).
  useEffect(() => {
    void timedOut.then(() => setOff(true))
  }, [])

  // Every scene texture goes through three's default manager: its count is the loader's share.
  useEffect(() => {
    DefaultLoadingManager.onProgress = (_url, loaded, total) => textures.report(loaded / total)
  }, [textures])

  const onCompiled = useCallback(
    (id: string) => {
      compiled.add(id)
      compile.report(compiled.size / sceneCount)
      // A scene without textures leaves the manager silent.
      if (compiled.size === sceneCount) textures.report(1)
    },
    [compile, textures],
  )

  if (off) return null

  return (
    <div className="stage">
      <Canvas
        // Pointer events come from the whole page, since the HTML sits on top of the canvas.
        eventSource={document.getElementById('root')!}
        eventPrefix="client"
        // Narrow lens: the prism curves without fisheye. No tone mapping: the cards keep the
        // colours of the HTML images, so the zoom into the detail has no visible seam (F-22).
        camera={{ fov: CAMERA.fov, position: [0, 0, CAMERA.distance] }}
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
            // Nothing more to wait for: the loader leaves on the fonts alone (N-03).
            textures.skip()
            compile.skip()
            setOff(true)
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
              <SectionAnchor key={id} id={id} onCompiled={onCompiled}>
                <Scene />
              </SectionAnchor>
            ),
        )}
        {InspectorPanel && (
          <Suspense fallback={null}>
            <InspectorPanel />
          </Suspense>
        )}
      </Canvas>
    </div>
  )
}
