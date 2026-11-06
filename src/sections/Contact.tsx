// src/sections/Contact.tsx
import '../styles/contact.css'
import '../styles/typed.css'
import { Caret, timeline, Typed, vars } from './Typed'

// Contact (F-31, F-32): booking link to Cal.com without its script, email, profiles and footer.
// Once in view (F-34) the title types, then each block rises a beat after the previous one.

const [title] = timeline([{ text: "Let's talk", speed: 40, pause: 150 }])
const [lead, actions, links, footer] = [0, 1, 2, 3].map((i) => title.end + 100 + i * 150)

const email = 'gioele@dallapozza.dev'

const profiles = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/gioeledallapozza/' },
  { label: 'GitHub', url: 'https://github.com/gioeledallapozza' },
  { label: 'X', url: 'https://x.com/DallaPozzaG' },
]

// Contact section content.
export function Contact() {
  return (
    <>
      <div className="contact">
        <h2 className="contact-title">
          <Typed {...title} />
          <Caret at={title.end} />
        </h2>
        <p className="contact-lead rise" style={vars({ at: lead })}>
          Have a product that deserves to be seen in 3D? Book a call or write me.
        </p>
        <div className="contact-actions rise" style={vars({ at: actions })}>
          <a
            className="button"
            href="https://cal.com/gioeledallapozza/discovery-call"
            target="_blank"
            rel="noopener"
          >
            Book a call <span aria-hidden="true">↗</span>
          </a>
          <a className="contact-email" href={`mailto:${email}`}>
            {email}
          </a>
        </div>
        <ul className="contact-profiles rise" style={vars({ at: links })}>
          {profiles.map(({ label, url }) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener">
                {label} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <footer className="contact-footer rise" style={vars({ at: footer })}>
        © 2026 Gioele Dalla Pozza
      </footer>
    </>
  )
}
