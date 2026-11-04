// src/three/SectionAnchor.tsx
import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

// Ties a scene to its HTML section: it scrolls with it and is hidden while the section is off screen.

// Props of SectionAnchor.
interface SectionAnchorProps {
  id: string
  children: ReactNode
}

// Group that follows the section with the given id.
export function SectionAnchor({ id, children }: SectionAnchorProps) {
  const group = useRef<Group>(null)

  useFrame(({ size, viewport }) => {
    const element = document.getElementById(id)
    if (!element || !group.current) return
    const rect = element.getBoundingClientRect()
    group.current.visible = rect.bottom > 0 && rect.top < size.height
    // Section centre to screen centre, from CSS pixels to world units on the z = 0 plane.
    const offset = size.height / 2 - (rect.top + rect.height / 2)
    group.current.position.y = (offset * viewport.height) / size.height
  })

  return <group ref={group}>{children}</group>
}
