// src/three/scenes/work/useCarousel.ts
import { useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Group, MathUtils, PerspectiveCamera, Vector3 } from 'three/webgpu'

// Movement of the Work carousel (F-20…F-24): steps, drag, cards lifting on hover and focus, and the
// camera flight into a card. It knows nothing of the HTML or the shaders: WorkScene wires them.

const HOLD = 2 // seconds on the active card before the next one
const TURN = 0.35 // seconds of one step
const ZOOM_IN = 0.5 // seconds of the flight into the card
const ZOOM_OUT = 0.4
const CLICK_SLOP = 6 // pixels a pointer may move and still count as a click
const LIFT_TIME = 0.15 // seconds for a card to lift on hover or focus
const LIFT = 0.08 // how far it comes out along its radius, in card widths
const GROW = 0.04 // how much it grows when lifted

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

// Scratch vectors for the per-frame maths.
const cardPosition = new Vector3()
const cardFacing = new Vector3()
const toCamera = new Vector3()

// Hard, mechanical curves: no drift, no long tails.
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const easeIn = (t: number) => t ** 3
const easeOut = (t: number) => 1 - (1 - t) ** 3

// A timed move, read every frame.
interface Tween {
  start: number
  duration: number
}
const progress = ({ start, duration }: Tween, now: number) =>
  duration > 0 ? MathUtils.clamp((now - start) / duration, 0, 1) : 1

// Size of the prism, computed by WorkScene from the screen.
export interface CarouselLayout {
  projects: number
  copies: number
  step: number // angle between two cards
  apothem: number // distance from the axis to the middle of each card
  width: number
  height: number
}

// What the carousel needs from the page.
interface CarouselOptions {
  isPaused: () => boolean
  // Called once the camera has reached the card: the HTML detail takes over from here.
  onOpened: (projectIndex: number) => void
}

// The prism's motion; returns its group ref, its live state and the actions WorkScene calls.
export function useCarousel(layout: CarouselLayout, { isPaused, onOpened }: CarouselOptions) {
  const { copies, step, apothem, width, height } = layout
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const prism = useRef<Group>(null)
  // The lifting part of each card, filled by WorkScene's refs.
  const cards = useRef<(Group | null)[]>([])

  // Everything that changes every frame lives here, outside React. `active` grows without bound:
  // the card in front is `active mod copies`, and the prism's angle is `-active · step`.
  const motion = useRef({
    now: 0,
    active: 0,
    angle: 0,
    turn: { from: 0, to: 0, start: 0, duration: 0 },
    nextAt: HOLD,
    camera: null as (Tween & { from: Vector3; to: Vector3; ease: (t: number) => number }) | null,
    hovered: null as number | null,
    focused: null as number | null,
    drag: null as { startX: number; angle: number; copy: number } | null,
    phase: 'idle' as 'idle' | 'opening' | 'open' | 'closing',
    opening: 0, // project being opened
    // Per card, 0 → 1: how far hover and focus have gone, read by WorkScene for the shaders.
    lift: Array.from({ length: copies }, () => ({ hover: 0, focus: 0 })),
    openCopy: 0, // card being opened
    open: 0, // 0 → 1 with the flight into that card, back to 0 on the way out
  })
  // Where the camera rests (Stage's position).
  const home = useRef<Vector3>(null)

  // One step to the given card: a short, hard turn, then HOLD seconds still.
  const go = (active: number) => {
    const m = motion.current
    const duration = reducedMotion.matches ? 0 : TURN
    m.turn = { from: m.angle, to: -active * step, start: m.now, duration }
    m.active = active
    m.nextAt = m.now + duration + HOLD
  }

  // `active` that brings the nearest copy of a project to the front.
  const toward = (projectIndex: number) => {
    const base = Math.round(-motion.current.angle / step)
    let best = copies
    for (let copy = projectIndex; copy < copies; copy += layout.projects) {
      let diff = MathUtils.euclideanModulo(copy - base, copies)
      if (diff > copies / 2) diff -= copies
      if (Math.abs(diff) < Math.abs(best)) best = diff
    }
    return base + best
  }

  // Turns to the project, then flies into it.
  const open = (projectIndex: number) => {
    const m = motion.current
    m.opening = projectIndex
    if (reducedMotion.matches) {
      onOpened(projectIndex)
      m.phase = 'open'
      return
    }
    go(toward(projectIndex))
    m.openCopy = MathUtils.euclideanModulo(m.active, copies)
    m.phase = 'opening'
  }

  const close = () => {
    motion.current.phase = 'closing'
  }

  // Keyboard focus on a project's button: its card comes to the front and holds.
  const focus = (projectIndex: number) => {
    const m = motion.current
    if (m.phase !== 'idle') return
    go(toward(projectIndex))
    m.focused = MathUtils.euclideanModulo(m.active, copies)
    // The prism turns under a still mouse, which fires no pointerout: forget the old hover.
    m.hovered = null
  }

  const blur = () => {
    motion.current.focused = null
  }

  const hover = (copy: number | null) => {
    motion.current.hovered = copy
  }

  // Drag (F-21): the pointer turns the prism; on release it snaps to the nearest card.
  const pointerDown = (event: ThreeEvent<PointerEvent>, copy: number) => {
    const m = motion.current
    if (m.phase !== 'idle') return
    m.drag = { startX: event.clientX, angle: m.angle, copy }

    const onMove = (move: PointerEvent) => {
      if (!m.drag) return
      m.angle =
        m.drag.angle + ((move.clientX - m.drag.startX) * viewport.width) / size.width / apothem
    }
    const onUp = (up: PointerEvent) => {
      const drag = m.drag
      m.drag = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (!drag) return
      const click = up.type === 'pointerup' && Math.abs(up.clientX - drag.startX) < CLICK_SLOP
      if (click) open(drag.copy % layout.projects)
      else go(Math.round(-m.angle / step))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  useFrame(({ camera, clock }, delta) => {
    const group = prism.current
    if (!group) return
    const m = motion.current
    m.now = clock.elapsedTime
    home.current ??= camera.position.clone()

    // Steps (F-20): hold on the active card, then turn to the next; anything that holds attention waits.
    const still =
      reducedMotion.matches ||
      isPaused() ||
      m.hovered !== null ||
      m.focused !== null ||
      m.drag !== null ||
      m.phase !== 'idle'
    if (still) m.nextAt = Math.max(m.nextAt, m.now + HOLD)
    else if (m.now >= m.nextAt) go(m.active + 1)
    if (!m.drag) {
      const { from, to } = m.turn
      m.angle = MathUtils.lerp(from, to, easeInOut(progress(m.turn, m.now)))
    }
    group.rotation.y = m.angle

    // Lift (F-24): the hovered or focused card comes out along its radius and grows a little; any
    // other phase puts it back, so the flight starts from a card in its place.
    const rate = reducedMotion.matches ? 1 : delta / LIFT_TIME
    m.lift.forEach((lift, copy) => {
      const idle = m.phase === 'idle'
      lift.hover = approach(lift.hover, idle && m.hovered === copy ? 1 : 0, rate)
      lift.focus = approach(lift.focus, idle && m.focused === copy ? 1 : 0, rate)
      const card = cards.current[copy]
      if (!card) return
      // A card that turns its back to the camera is hidden: only its slab would show.
      card.getWorldPosition(cardPosition)
      card.getWorldDirection(cardFacing)
      card.visible = cardFacing.dot(toCamera.subVectors(camera.position, cardPosition)) > 0
      // With reduced motion the values still change (the edge turns lime), the card stays put.
      const out = reducedMotion.matches ? 0 : easeInOut(Math.max(lift.hover, lift.focus))
      card.position.z = out * LIFT * width
      card.scale.setScalar(1 + out * GROW)
    })

    // Open: once the card is in front, fly in until it covers the screen, then hand over to the dialog.
    if (m.phase === 'opening' && !m.camera && progress(m.turn, m.now) === 1) {
      // Distance at which the card covers the screen, like the dialog's object-fit: cover.
      const fit = Math.min(height, width / viewport.aspect)
      const fov = MathUtils.degToRad((camera as PerspectiveCamera).fov)
      const to = group.getWorldPosition(new Vector3())
      to.set(0, to.y, fit / (2 * Math.tan(fov / 2)))
      m.camera = {
        from: camera.position.clone(),
        to,
        start: m.now,
        duration: ZOOM_IN,
        ease: easeIn,
      }
    }
    if (m.phase === 'closing' && !m.camera) {
      const duration = reducedMotion.matches ? 0 : ZOOM_OUT
      m.camera = {
        from: camera.position.clone(),
        to: home.current,
        start: m.now,
        duration,
        ease: easeOut,
      }
    }
    if (m.camera) {
      const t = progress(m.camera, m.now)
      const eased = m.camera.ease(t)
      camera.position.lerpVectors(m.camera.from, m.camera.to, eased)
      // The glass breaks as the camera closes in, and mends as it backs away (glassOpen).
      m.open = m.phase === 'opening' ? eased : 1 - eased
      if (t === 1) {
        m.camera = null
        if (m.phase === 'opening') onOpened(m.opening)
        m.phase = m.phase === 'opening' ? 'open' : 'idle'
      }
    }
  })

  return { prism, cards, motion, open, close, focus, blur, hover, pointerDown }
}

// `value` moved toward `target` by at most `step`.
function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step)
}
