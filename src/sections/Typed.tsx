// src/sections/Typed.tsx
import type { CSSProperties } from 'react'

// Typewriter text in pure CSS: each character stays transparent until its turn, when its own
// background is the block caret. No pseudo-elements: next to them Chrome drops spaces from names.

// One typed text: starts at `start` ms, then one character every `speed` ms.
export interface TypedText {
  text: string
  start: number
  speed: number
  end: number
}

// Start and end of each text: it begins where the previous one ended, after its pause.
export function timeline(parts: { text: string; speed: number; pause: number }[]): TypedText[] {
  let clock = 0
  return parts.map(({ text, speed, pause }) => {
    const start = clock + pause
    clock = start + [...text].length * speed // Use [...text] because Javascript count in a strange way the accented characters
    return { text, start, speed, end: clock }
  })
}

// Characters of a typed text, each with its own turn.
export function Typed({ text, start, speed }: TypedText) {
  // Spaces stay plain text, so the caret skips them and line breaks work as usual.
  return [...text].map((char, i) =>
    char === ' ' ? (
      ' '
    ) : (
      <span
        key={i}
        className="typed"
        style={vars({ at: start + i * speed, speed, done: start + (i + 1) * speed })}
      >
        {char}
      </span>
      // Example: <span class="typed" style="--at: 1100ms; --speed: 50ms; --done: 1150ms">c</span>
    ),
  )
}

// Blinking block caret from `at` ms, until `until` ms or forever.
export function Caret({ at, until }: { at: number; until?: number }) {
  return (
    <span
      className={until === undefined ? 'caret' : 'caret caret-moves'}
      aria-hidden="true"
      style={vars({ at, until: until ?? 0 })}
    />
  )
}

// Timing as CSS variables, read by the animations in typed.css.
export function vars(times: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(times).map(([name, ms]) => [`--${name}`, `${ms}ms`]),
  ) as CSSProperties
}
