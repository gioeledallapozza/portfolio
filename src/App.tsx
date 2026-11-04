// src/App.tsx
import { lazy, Suspense } from 'react'
import { sections } from './sections'
import { Nav } from './sections/Nav'

// The page: nav, one HTML section per entry of sections.ts, and the 3D stage behind them.
// The stage is lazy, so the HTML text paints before three.js arrives (N-01).

const Stage = lazy(() => import('./three/Stage').then((m) => ({ default: m.Stage })))

// Whole page, in the order of sections.ts.
export function App() {
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
      <Suspense fallback={null}>
        <Stage />
      </Suspense>
    </>
  )
}
