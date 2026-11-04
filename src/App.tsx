// src/App.tsx
import { lazy, Suspense, useEffect } from 'react'
import { sections } from './sections'
import { Nav } from './sections/Nav'

// The page: nav, one HTML section per entry of sections.ts, and the 3D stage behind them.
// The stage is lazy and mounts only when a section has a scene, so text paints first (N-01).

const Stage = lazy(() => import('./three/Stage').then((m) => ({ default: m.Stage })))
const hasScenes = sections.some((section) => section.Scene)

// Whole page, in the order of sections.ts.
export function App() {
  // The sections exist only after this render, so the browser cannot jump to /#work by itself (F-02).
  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1))
    target?.scrollIntoView({ behavior: 'instant' })
  }, [])

  return (
    <>
      <Nav />
      <main>
        {sections.map(({ id, Section }) => (
          <section key={id} id={id}>
            <Section />
          </section>
        ))}
      </main>
      {hasScenes && (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      )}
    </>
  )
}
