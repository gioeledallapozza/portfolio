// src/loader/phases.ts
// What the loader waits for (F-05): weighted phases, added by whatever loads something. Add a phase
// before the loader's first frame (at module load), or the real share would have to go back.

const phases: { weight: number; fraction: number }[] = []

// One thing to load: report how much of it is done, or skip it when there is nothing to wait for.
export interface Phase {
  report: (fraction: number) => void
  skip: () => void
}

// Adds a phase worth `weight` against the others.
export function addPhase(weight: number): Phase {
  const phase = { weight, fraction: 0 }
  phases.push(phase)
  return {
    report: (fraction) => {
      phase.fraction = Math.max(phase.fraction, Math.min(fraction, 1))
    },
    skip: () => {
      phase.weight = 0
    },
  }
}

// Share of the weighted work done, 0…1.
export function loadedShare() {
  const total = phases.reduce((sum, { weight }) => sum + weight, 0)
  const done = phases.reduce((sum, { weight, fraction }) => sum + weight * fraction, 0)
  return total > 0 ? done / total : 1
}
