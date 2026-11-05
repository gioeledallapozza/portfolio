// src/sections.ts
import type { ComponentType } from 'react'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Home } from './sections/Home'
import { Work } from './sections/Work'

// The sections in page order: nav, page, active section and canvas scenes all come from here.
// A new section (Configure in v2) is one entry plus its components.

// One section: anchor id, nav label (none = not in the nav), HTML and optional 3D scene.
export interface SectionEntry {
  id: string
  label?: string
  Section: ComponentType
  // Always a React.lazy component, so three.js stays out of the initial bundle (N-01).
  Scene?: ComponentType
}

export const sections: SectionEntry[] = [
  { id: 'home', Section: Home },
  { id: 'work', label: 'Work', Section: Work },
  { id: 'about', label: 'About', Section: About },
  { id: 'contact', Section: Contact },
]
