// src/sections/Home.tsx
import '../styles/home.css'
import '../styles/typed.css'
import { Caret, timeline, Typed, vars } from './Typed'

// Home (F-04): the name types, then what I do and the two ways forward rise, as in About and Contact.

const [first, last] = timeline([
  { text: 'Gioele', speed: 50, pause: 250 },
  { text: 'Dalla Pozza', speed: 50, pause: 70 },
])
const tagline = last.end + 100
const actions = tagline + 150

// Home section content.
export function Home() {
  return (
    <>
      <h1 className="home-name">
        <span className="home-line">
          <Typed {...first} />
        </span>{' '}
        <span className="home-line">
          <Typed {...last} />
          <Caret at={last.end} until={actions + 600} />
        </span>
      </h1>
      <p className="home-tagline rise" style={vars({ at: tagline })}>
        3D product configurators for e-commerce
      </p>
      <div className="home-actions rise" style={vars({ at: actions })}>
        <a className="button" href="#work">
          See my work
        </a>
        <a className="home-link" href="#contact">
          Let&apos;s talk <span aria-hidden="true">→</span>
        </a>
      </div>
    </>
  )
}
