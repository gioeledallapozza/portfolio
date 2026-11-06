// src/App.tsx
import { lazy, Suspense, useEffect } from 'react'
import { shown } from './loader/loader'
import { addPhase } from './loader/phases'
import { sections } from './sections'
import { Nav } from './sections/Nav'

// The page: nav, one HTML section per entry of sections.ts, and the 3D stage behind them.
// The stage is lazy and mounts only when a section has a scene, so text paints first (N-01).

const hasScenes = sections.some((section) => section.Scene)

// What the loader waits for from the 3D (F-05); the weights are shares of its bar.
const stagePhases = { chunk: addPhase(4), textures: addPhase(4), compile: addPhase(2) }
if (!hasScenes) Object.values(stagePhases).forEach((phase) => phase.skip())

const Stage = lazy(() =>
  import('./three/Stage').then((m) => {
    stagePhases.chunk.report(1)
    return { default: m.Stage }
  }),
)

// Whole page, in the order of sections.ts.
export function App() {
  // Marks each section the first time its top passes 70% of the screen: its entrance starts then (F-34),
  // and never before the loader has gone (F-05).
  useEffect(() => {
    let live = true
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('entered')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -30% 0px' },
    )
    void shown.then(() => {
      if (!live) return
      for (const section of document.querySelectorAll('main > section')) observer.observe(section)
    })
    return () => {
      live = false
      observer.disconnect()
    }
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
          <Stage textures={stagePhases.textures} compile={stagePhases.compile} />
        </Suspense>
      )}
    </>
  )
}
