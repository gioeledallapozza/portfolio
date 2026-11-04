// src/sections/Nav.tsx
import { sections } from '../sections'

// Fixed top navigation (F-01): logo to Home, one link per labelled section, CTA to Contact.

// Top navigation bar.
export function Nav() {
  return (
    <nav className="nav" aria-label="Main">
      <a className="nav-logo" href="#home">
        GDP
      </a>
      {sections
        .filter((section) => section.label)
        .map(({ id, label }) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      <a className="nav-cta" href="#contact">
        Let&apos;s talk
      </a>
    </nav>
  )
}
