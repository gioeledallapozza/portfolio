// src/sections/Nav.tsx
import { sections } from '../sections'
import '../styles/nav.css'
import { useActiveSection } from './useActiveSection'

// Fixed top navigation (F-01): logo to Home, one link per labelled section, CTA to Contact.
// The link of the section on screen gets aria-current (F-03).

const ids = sections.map((section) => section.id)

// Top navigation bar.
export function Nav() {
  const active = useActiveSection(ids)
  const current = (id: string) => (id === active ? true : undefined)

  return (
    <nav className="nav" aria-label="Main">
      <a className="nav-logo" href="#home" aria-current={current('home')}>
        GDP
      </a>
      {sections
        .filter((section) => section.label)
        .map(({ id, label }) => (
          <a key={id} className="nav-link" href={`#${id}`} aria-current={current(id)}>
            {label}
          </a>
        ))}
      <a className="button" href="#contact" aria-current={current('contact')}>
        Let&apos;s talk
      </a>
    </nav>
  )
}
