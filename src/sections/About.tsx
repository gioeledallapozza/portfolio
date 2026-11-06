// src/sections/About.tsx
import '../styles/about.css'
import '../styles/typed.css'
import { Caret, timeline, Typed, vars } from './Typed'

// About (F-30): who I am, what I do now, and what an agency gets.
// Once in view (F-34) the title types fast, then the two columns rise.

const [title] = timeline([
  { text: 'Erasing the line between physical matter and digital space.', speed: 12, pause: 150 },
])
const bio = title.end + 100
const agencies = bio + 150

const forAgencies = [
  'Real-time 3D configurators, from simple product customisers to complex tools like room planners',
  "Integrated into your client's store: Shopify today, any platform through an adapter",
  'White-label on request',
]

// About section content.
export function About() {
  return (
    <>
      <h2 className="about-title">
        <Typed {...title} />
        <Caret at={title.end} until={agencies + 600} />
      </h2>
      <div className="about-body">
        <div className="about-bio rise" style={vars({ at: bio })}>
          <p>I&apos;m Gioele, a creative engineer obsessed with 3D and the math behind it.</p>
          <p>
            It all started with Bruno Simon&apos;s{' '}
            <a href="https://threejs-journey.com/" target="_blank" rel="noopener">
              Three.js Journey
            </a>
            , and it never stopped: shaders, GPU simulations, real-time rendering. Right now I bring
            it to e-commerce as 3D product configurators, so shoppers see exactly what they&apos;re
            buying before they buy it.
          </p>
          <p>
            I&apos;m studying Computer Science. When I&apos;m not at the keyboard, I&apos;m at the
            gym.
          </p>
        </div>
        <div className="about-agencies rise" style={vars({ at: agencies })}>
          <h3>For agencies</h3>
          <ul>
            {forAgencies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
