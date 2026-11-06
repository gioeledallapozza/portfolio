// src/three/scenes/work/useCarousel.ts
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils, PerspectiveCamera, Vector3 } from 'three/webgpu'

// Movement of the Work carousel (F-20…F-24, F-35): the prism turning with the scroll, cards lifting on
// hover and focus, the entrance and the camera flight into a card. It knows nothing of the HTML or
// the shaders: WorkScene wires them.

const FOLLOW = 18 // per second: how fast the prism catches up with the scroll
const TURN = 0.35 // seconds to square the prism to a card before opening it
const ZOOM_IN = 0.5 // seconds of the flight into the card
const ZOOM_OUT = 0.4
const LIFT_TIME = 0.15 // seconds for a card to lift on hover or focus
const LIFT = 0.08 // how far it comes out along its radius, in card widths
const GROW = 0.04 // how much it grows when lifted
const ENTER = 0.9 // seconds for a card to light up
const ENTER_OTHERS = 0.45 // seconds after the front card, the others light up

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
  axis: 'x' | 'y' // what the prism turns around
  width: number
  height: number
}

// What the carousel needs from the page.
interface CarouselOptions {
  // How far the scroll has gone, in projects: 2.5 is halfway from the third to the fourth (F-20).
  scrolled: () => number
  // Whether Work has come into view, and how long after that the front card lights up (F-35).
  entered: () => boolean
  enterDelay: number
  // Called once the camera has reached the card: the HTML detail takes over from here.
  onOpened: (projectIndex: number) => void
}

// The prism's motion; returns its group ref, its live state and the actions WorkScene calls.
export function useCarousel(
  { projects, copies, step, axis, width, height }: CarouselLayout,
  { scrolled, entered, enterDelay, onOpened }: CarouselOptions,
) {
  const viewport = useThree((state) => state.viewport)
  const events = useThree((state) => state.events)
  const prism = useRef<Group>(null)
  // The lifting part of each card, filled by WorkScene's refs.
  const cards = useRef<(Group | null)[]>([])

  // Everything that changes every frame lives here, outside React. The card in front is `active`,
  // which is also its project, and the prism's angle is `-active · step`.
  const motion = useRef({
    now: 0,
    active: 0,
    angle: 0,
    turn: { from: 0, to: 0, start: 0, duration: 0 },
    camera: null as (Tween & { from: Vector3; to: Vector3; ease: (t: number) => number }) | null,
    hovered: null as number | null,
    focused: null as number | null,
    phase: 'idle' as 'idle' | 'opening' | 'open' | 'closing',
    opening: 0, // project being opened
    // Per card, 0 → 1: how far hover and focus have gone, read by WorkScene for the shaders.
    lift: Array.from({ length: copies }, () => ({ hover: 0, focus: 0 })),
    openCopy: 0, // card being opened
    open: 0, // 0 → 1 with the flight into that card, back to 0 on the way out
    scrollY: 0, // the page's scroll at the last frame
    enterStart: null as number | null, // when the front card starts lighting up
    enter: Array.from({ length: copies }, () => 0), // per card, 0 → 1 as it lights up
  })
  // Where the camera rests (Stage's position).
  const home = useRef<Vector3>(null)

  // How far the prism must turn to bring a card to the front, the short way round.
  const turnTo = (copy: number) =>
    MathUtils.euclideanModulo(-copy * step - motion.current.angle + Math.PI, 2 * Math.PI) - Math.PI

  // The copy of a project nearest to the front, for opening it from the keyboard.
  const nearest = (projectIndex: number) => {
    let best = projectIndex
    for (let copy = projectIndex; copy < copies; copy += projects) {
      if (Math.abs(turnTo(copy)) < Math.abs(turnTo(best))) best = copy
    }
    return best
  }

  // Squares the prism to the given card with a short, hard turn.
  const go = (copy: number) => {
    const m = motion.current
    const duration = reducedMotion.matches ? 0 : TURN
    m.turn = { from: m.angle, to: m.angle + turnTo(copy), start: m.now, duration }
    m.active = copy
  }

  // Turns to the card (the one clicked, or the project's nearest copy), then flies into it.
  const open = (projectIndex: number, copy = nearest(projectIndex)) => {
    const m = motion.current
    // Only from rest: with a detail open, a click on it (Close too) also reaches the scene, whose
    // card fills the screen behind it; opening again then would race the close.
    if (m.phase !== 'idle') return
    m.opening = projectIndex
    m.openCopy = copy
    if (reducedMotion.matches) {
      onOpened(projectIndex)
      m.phase = 'open'
      return
    }
    // Square to the card first: following the scroll, the prism can rest between two.
    if (Math.abs(turnTo(copy)) > 1e-4) go(copy)
    m.phase = 'opening'
  }

  // Back out from wherever the camera is, even halfway through another move.
  const close = () => {
    const m = motion.current
    m.camera = null
    m.phase = 'closing'
  }

  // Keyboard focus on a project's button: WorkScene scrolls to it, its card lifts.
  const focus = (projectIndex: number) => {
    const m = motion.current
    m.focused = projectIndex
    // The prism turns under a still mouse, which fires no pointerout: forget the old hover.
    m.hovered = null
  }

  const blur = () => {
    motion.current.focused = null
  }

  const hover = (copy: number | null) => {
    motion.current.hovered = copy
  }

  useFrame(({ camera, clock }, delta) => {
    const group = prism.current
    if (!group) return
    const m = motion.current
    m.now = clock.elapsedTime
    home.current ??= camera.position.clone()

    // The scroll turns the prism (F-20), eased just enough that wheel notches do not jump; while a
    // detail opens, is open or closes, a tween holds it square to its card.
    const before = m.angle
    if (m.phase === 'idle') {
      const position = scrolled()
      m.active = Math.round(position)
      const target = -position * step
      m.angle = reducedMotion.matches ? target : MathUtils.damp(m.angle, target, FOLLOW, delta)
    } else {
      const { from, to } = m.turn
      m.angle = MathUtils.lerp(from, to, easeInOut(progress(m.turn, m.now)))
    }
    group.rotation.set(axis === 'x' ? m.angle : 0, axis === 'y' ? m.angle : 0, 0)

    // Entrance (F-35): the front card lights up once the title is typed, the others after it; with
    // reduced motion every card is on from the start.
    if (m.enterStart === null && entered()) m.enterStart = m.now + enterDelay
    m.enter.forEach((_, copy) => {
      if (reducedMotion.matches) m.enter[copy] = 1
      else if (m.enterStart === null) m.enter[copy] = 0
      else {
        const start = m.enterStart + (copy === m.active ? 0 : ENTER_OTHERS)
        m.enter[copy] = MathUtils.clamp((m.now - start) / ENTER, 0, 1)
      }
    })

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
    const flying = m.camera !== null
    if (m.camera) {
      const t = progress(m.camera, m.now)
      const eased = m.camera.ease(t)
      camera.position.lerpVectors(m.camera.from, m.camera.to, eased)
      // The glass breaks as the camera closes in, and mends as it backs away (glassOpen).
      m.open = m.phase === 'opening' ? eased : 1 - eased
      if (t === 1) {
        m.camera = null
        if (m.phase === 'opening') onOpened(m.opening)
        // Back from the detail, WorkScene has scrolled to the project: every copy of it looks the
        // same, so the prism takes the scroll's angle for it without turning (F-20).
        else m.angle = -m.opening * step
        m.phase = m.phase === 'opening' ? 'open' : 'idle'
      }
    }

    // The cards move under a still mouse, which fires no pointer event: when the prism turns, the
    // page scrolls or the camera flies, raycast again from where the mouse last was, so hover
    // follows what is under it now. After a detail closes, Close sits outside the card again.
    if (flying || Math.abs(m.angle - before) > 1e-5 || window.scrollY !== m.scrollY) {
      camera.updateMatrixWorld()
      group.updateMatrixWorld()
      events.update?.()
    }
    m.scrollY = window.scrollY
  })

  return { prism, cards, motion, open, close, focus, blur, hover }
}

// `value` moved toward `target` by at most `step`.
function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step)
}
