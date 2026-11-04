// src/sections/useActiveSection.ts
import { useEffect, useState } from 'react'

// Which section is under the middle of the screen (F-03), for the nav highlight.

// Id of the section crossing the horizontal centre line of the viewport.
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string>()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      // Shrinks the observed area to a line across the middle: only one section can touch it.
      { rootMargin: '-50% 0px -50% 0px' },
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}
