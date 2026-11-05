// src/three/scenes/WorkScene.tsx
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import {
  Group,
  MathUtils,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three/webgpu'
import { texture } from 'three/tsl'
import { projects } from '../../content/projects'
import { showDetail } from '../../sections/Work'

// Work carousel (F-20…F-22): flat project cards around a prism, stepping from one to the next.
// Titles, detail and keyboard access stay in the HTML of Work.tsx (A-02, N-06).

const GAP = 0.06 // space between cards, as a share of the card width
const MIN_COPIES = 8 // fewer cards than this make the prism too tight
const HOLD = 2 // seconds on the active card before the next one
const TURN = 0.35 // seconds of one step
const ZOOM_IN = 0.5 // seconds of the flight into the card
const ZOOM_OUT = 0.4
const IMAGE_RATIO = 9 / 16
const CLICK_SLOP = 6 // pixels a pointer may move and still count as a click

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const noHover = window.matchMedia('(hover: none)')

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

// Scratch vector for the per-frame maths.
const point = new Vector3()

// The prism of cards, with drag, hover label, focus and the zoom into the detail.
export function WorkScene() {
  const textures = useLoader(
    TextureLoader,
    projects.map((project) => project.image),
  )
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const prism = useRef<Group>(null)

  // Card size follows the screen; copies are a multiple of the projects, so the sequence never breaks.
  const copies = projects.length * Math.ceil(MIN_COPIES / projects.length)
  const width = Math.min(
    viewport.width * (viewport.aspect < 1 ? 0.8 : 0.5),
    (viewport.height * 0.6) / IMAGE_RATIO,
  )
  const height = width * IMAGE_RATIO
  const step = (2 * Math.PI) / copies
  // Distance from the axis to the middle of each flat card.
  const apothem = (width * (1 + GAP)) / 2 / Math.tan(Math.PI / copies)

  const geometry = useMemo(() => new PlaneGeometry(width, height), [width, height])

  const materials = useMemo(
    () =>
      textures.map((map) => {
        map.colorSpace = SRGBColorSpace
        const material = new MeshBasicNodeMaterial()
        material.colorNode = texture(map)
        return material
      }),
    [textures],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])

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
    opening: '',
  })
  // Where the camera rests (Stage's position), and the carousel's HTML in Work.tsx.
  const home = useRef<Vector3>(null)
  const html = useRef<{ label: HTMLElement | null; pause: HTMLElement | null }>(null)

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
    for (let copy = projectIndex; copy < copies; copy += projects.length) {
      let diff = MathUtils.euclideanModulo(copy - base, copies)
      if (diff > copies / 2) diff -= copies
      if (Math.abs(diff) < Math.abs(best)) best = diff
    }
    return base + best
  }

  const open = (projectIndex: number) => {
    const m = motion.current
    m.opening = projects[projectIndex].id
    if (reducedMotion.matches) {
      showDetail(m.opening)
      m.phase = 'open'
      return
    }
    go(toward(projectIndex))
    m.phase = 'opening'
  }

  // The grid is the fallback; from here on the carousel takes its place (F-23).
  useEffect(() => {
    document.documentElement.dataset.stage = '3d'
    html.current = {
      label: document.querySelector('.work-label'),
      pause: document.querySelector('.work-pause'),
    }
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [])

  // HTML side: Tab on the hidden buttons turns the carousel, Enter opens, closing the dialog zooms out.
  useEffect(() => {
    const grid = document.querySelector('.work-grid')
    const dialogs = document.querySelectorAll('.work-detail')
    const m = motion.current

    const onFocus = (event: Event) => {
      const item = (event.target as HTMLElement).closest('li')
      if (!item?.parentElement || m.phase !== 'idle') return
      go(toward([...item.parentElement.children].indexOf(item)))
      m.focused = MathUtils.euclideanModulo(m.active, copies)
    }
    const onBlur = () => {
      m.focused = null
    }
    const onOpen = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      open(projects.findIndex((project) => project.id === id))
    }
    const onClose = () => {
      m.phase = 'closing'
    }

    grid?.addEventListener('focusin', onFocus)
    grid?.addEventListener('focusout', onBlur)
    window.addEventListener('work:open', onOpen)
    dialogs.forEach((dialog) => dialog.addEventListener('close', onClose))
    return () => {
      grid?.removeEventListener('focusin', onFocus)
      grid?.removeEventListener('focusout', onBlur)
      window.removeEventListener('work:open', onOpen)
      dialogs.forEach((dialog) => dialog.removeEventListener('close', onClose))
    }
  })

  // Drag (F-21): the pointer turns the prism; on release it snaps to the nearest card.
  const onPointerDown = (event: ThreeEvent<PointerEvent>, copy: number) => {
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
      if (click) open(drag.copy % projects.length)
      else go(Math.round(-m.angle / step))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  useFrame(({ camera, clock }) => {
    const group = prism.current
    if (!group || !html.current) return
    const m = motion.current
    const { label, pause } = html.current
    m.now = clock.elapsedTime
    home.current ??= camera.position.clone()

    // Steps (F-20): hold on the active card, then turn to the next; anything that holds attention waits.
    const still =
      reducedMotion.matches ||
      pause?.getAttribute('aria-pressed') === 'true' ||
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
      camera.position.lerpVectors(m.camera.from, m.camera.to, m.camera.ease(t))
      if (t === 1) {
        m.camera = null
        if (m.phase === 'opening') showDetail(m.opening)
        m.phase = m.phase === 'opening' ? 'open' : 'idle'
      }
    }

    // Label (F-22): focused card, else the hovered one, else on touch the one in front.
    if (!label) return
    let copy = m.focused ?? m.hovered
    if (copy === null && noHover.matches) copy = MathUtils.euclideanModulo(m.active, copies)
    const shown = copy !== null && m.phase === 'idle' && group.parent?.visible !== false
    label.classList.toggle('is-shown', shown)
    label.classList.toggle('is-focus', m.focused !== null)
    if (!shown || copy === null) return
    label.textContent = projects[copy % projects.length].title
    point.set(0, height / 2, apothem).applyAxisAngle(group.up, copy * step)
    group.localToWorld(point).project(camera)
    label.style.transform = `translate(${((point.x + 1) / 2) * size.width}px, ${((1 - point.y) / 2) * size.height}px)`
  })

  return (
    // The front card sits on the z = 0 plane, where the viewport sizes hold.
    <group ref={prism} position-z={-apothem}>
      {Array.from({ length: copies }, (_, copy) => (
        <mesh
          key={copy}
          geometry={geometry}
          material={materials[copy % projects.length]}
          position={[apothem * Math.sin(copy * step), 0, apothem * Math.cos(copy * step)]}
          rotation-y={copy * step}
          onPointerDown={(event) => onPointerDown(event, copy)}
          onPointerOver={(event) => {
            // Touch fires over but not always out: hover is for mice only.
            if (event.pointerType !== 'mouse') return
            motion.current.hovered = copy
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            motion.current.hovered = null
            document.body.style.cursor = ''
          }}
        />
      ))}
    </group>
  )
}
