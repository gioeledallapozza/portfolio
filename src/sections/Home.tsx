// src/sections/Home.tsx
import '../styles/home.css'
import '../styles/typed.css'
import { Caret, timeline, Typed, vars } from './Typed'

// Home (F-04): name, what I do and the two ways forward, typed in this order.

const [first, last, tagline, work, talk] = timeline([
  { text: 'Gioele', speed: 50, pause: 250 },
  { text: 'Dalla Pozza', speed: 50, pause: 70 },
  { text: '3D product configurators for e-commerce', speed: 30, pause: 250 },
  { text: 'See my work', speed: 40, pause: 400 },
  { text: "Let's talk →", speed: 40, pause: 200 },
])

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
          <Caret at={last.end} until={tagline.start} />
        </span>
      </h1>
      <p className="home-tagline">
        <Typed {...tagline} />
        <Caret at={tagline.end} until={work.start} />
      </p>
      <div className="home-actions">
        <a className="button typed-box" href="#work" style={vars({ at: work.start })}>
          <Typed {...work} />
        </a>
        <a className="home-link typed-box" href="#contact" style={vars({ at: talk.start })}>
          <Typed {...talk} />
          <Caret at={talk.end} />
        </a>
      </div>
    </>
  )
}
