// src/three/scenes/work/WorkScene.tsx
import { use, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { MathUtils, PlaneGeometry, SRGBColorSpace, TextureLoader } from 'three/webgpu'
import { projects } from '../../../content/projects'
import { decode } from '../../../motion/scramble'
import { cardsAt, showDetail } from '../../../sections/Work'
import { enterTuning } from '../../materials/glass/glassEnter'
import { createGlassCard, glassTuning, titleTuning } from '../../materials/glass/glassMaterial'
import { openTuning } from '../../materials/glass/glassOpen'
import { createSlabGeometry, type SlabShape } from '../../materials/glass/glassShape'
import {
  createTitleTexture,
  drawTitle,
  titleFontReady,
  titlePixels,
} from '../../textures/titleTexture'
import { useCarousel } from './useCarousel'

// Work carousel (F-20…F-24, F-35): the glass cards in the scene and their wiring to the HTML of
// Work.tsx, where the real titles, the detail and keyboard access stay (A-02, N-06). The motion is
// in useCarousel.

const GAP = 0.06 // space between cards, as a share of the card's size along the turn
const MIN_COPIES = 8 // fewer cards than this make the prism too tight
const IMAGE_RATIO = 9 / 16
const TITLE_GAP = 0.03 // how far the title floats in front of the glass, in card widths
const TITLE_FROM = 0.4 // share of a card's entrance after which its title glitches into the name

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

// The slab's shape as set in glassTuning right now.
const readSlab = (): SlabShape => ({
  cut: glassTuning.shape.cut.value > 0.5,
  corner: glassTuning.shape.corner.value,
  thickness: glassTuning.shape.thickness.value,
})
const sameSlab = (a: SlabShape, b: SlabShape) =>
  a.cut === b.cut && a.corner === b.corner && a.thickness === b.thickness

// The scroll that turns the prism (F-20): Work's track is taller than the screen, its pin sticks
// while the track passes, and each project gets an equal share of the difference.
function track() {
  const track = document.querySelector<HTMLElement>('.work-track')
  const pin = track?.querySelector<HTMLElement>('.work-pin')
  if (!track || !pin) return { top: 0, share: 0 }
  const share = (track.offsetHeight - pin.offsetHeight) / projects.length
  return { top: track.getBoundingClientRect().top, share }
}

// Where the scroll has reached, in projects: each project is square in the middle of its share.
const scrollPosition = () => {
  const { top, share } = track()
  return share > 0 ? MathUtils.clamp(-top / share - 0.5, 0, projects.length - 1) : 0
}

// Tab on a project (F-21): the page scrolls to the middle of its share, and the scroll turns the prism.
const scrollToProject = (projectIndex: number) => {
  const { top, share } = track()
  window.scrollTo({ top: window.scrollY + top + (projectIndex + 0.5) * share })
}

const workEntered = () => document.getElementById('work')?.classList.contains('entered') ?? false

// The prism of glass cards, with their titles, hover, focus, entrance and the flight into the detail.
export function WorkScene() {
  // The titles are drawn with Chakra Petch: wait for it once, before the first card exists.
  use(titleFontReady)
  const images = useLoader(
    TextureLoader,
    projects.map((project) => project.image),
  )
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const gl = useThree((state) => state.gl)

  // Card size follows the screen; copies are a multiple of the projects, so the sequence never
  // breaks. Tall screens roll the prism around the horizontal axis, wide ones turn it around the
  // vertical one, so the cards travel along the screen's long side.
  const copies = projects.length * Math.ceil(MIN_COPIES / projects.length)
  const width = Math.min(
    viewport.width * (viewport.aspect < 1 ? 0.8 : 0.5),
    (viewport.height * 0.6) / IMAGE_RATIO,
  )
  const height = width * IMAGE_RATIO
  const axis = viewport.aspect < 1 ? 'x' : 'y'
  const step = (2 * Math.PI) / copies
  // Distance from the axis to the middle of each flat card.
  const apothem = ((axis === 'y' ? width : height) * (1 + GAP)) / 2 / Math.tan(Math.PI / copies)

  const { prism, cards, motion, ...carousel } = useCarousel(
    { copies, step, axis, width, height },
    {
      scrolled: scrollPosition,
      entered: workEntered,
      enterDelay: reducedMotion.matches ? 0 : cardsAt / 1000,
      onOpened: (projectIndex) => showDetail(projects[projectIndex].id),
    },
  )

  const geometry = useMemo(() => new PlaneGeometry(width, height), [width, height])
  // The slab is real geometry: rebuilt when its shape changes (only from the Inspector).
  const [slabShape, setSlabShape] = useState(readSlab)
  const slab = useMemo(
    () => createSlabGeometry(width, height, slabShape),
    [width, height, slabShape],
  )

  // One title texture per project, as sharp as the card is wide on this screen.
  const pixels = titlePixels((width / viewport.width) * size.width)
  const titles = useMemo(
    () => projects.map((project) => createTitleTexture(project.title, pixels)),
    [pixels],
  )
  // What each title texture shows now, so the glitch redraws only when its string changes.
  const titleTexts = useRef<string[]>([])
  useEffect(() => {
    titleTexts.current = projects.map((project) => project.title)
  }, [titles])

  // One pair of materials per card, so each copy has its own hover, focus, entrance and opening;
  // the shaders are the same, so they compile once.
  const glass = useMemo(() => {
    images.forEach((image) => (image.colorSpace = SRGBColorSpace))
    return Array.from({ length: copies }, (_, copy) =>
      createGlassCard(images[copy % projects.length], titles[copy % projects.length]),
    )
  }, [images, titles, copies])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => slab.dispose(), [slab])
  useEffect(() => () => titles.forEach((title) => title.dispose()), [titles])
  useEffect(
    () => () =>
      glass.forEach((card) => {
        card.glass.dispose()
        card.slab.dispose()
        card.title.dispose()
      }),
    [glass],
  )

  // The grid is the fallback; from here on the carousel takes its place (F-23).
  useEffect(() => {
    document.documentElement.dataset.stage = '3d'
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [])

  // Development: the tuning uniforms and the renderer in the console, e.g.
  // `tuning.glass.band.on.value = 0` or `renderer._pipelines.programs.fragment.size`.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    Object.assign(window, {
      tuning: { glass: glassTuning, open: openTuning, enter: enterTuning, title: titleTuning },
      renderer: gl,
    })
  }, [gl])

  // HTML side: Tab on the hidden buttons scrolls to their card, Enter opens, closing the dialog zooms out.
  useEffect(() => {
    const grid = document.querySelector('.work-grid')
    const dialogs = document.querySelectorAll('.work-detail')

    const onFocus = (event: Event) => {
      const item = (event.target as HTMLElement).closest('li')
      if (!item?.parentElement) return
      const projectIndex = [...item.parentElement.children].indexOf(item)
      carousel.focus(projectIndex)
      // The detail's buttons are inside the item too: only the card's own button scrolls.
      if ((event.target as HTMLElement).classList.contains('work-card')) {
        scrollToProject(projectIndex)
      }
    }
    const onOpen = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      carousel.open(projects.findIndex((project) => project.id === id))
    }

    grid?.addEventListener('focusin', onFocus)
    grid?.addEventListener('focusout', carousel.blur)
    window.addEventListener('work:open', onOpen)
    dialogs.forEach((dialog) => dialog.addEventListener('close', carousel.close))
    return () => {
      grid?.removeEventListener('focusin', onFocus)
      grid?.removeEventListener('focusout', carousel.blur)
      window.removeEventListener('work:open', onOpen)
      dialogs.forEach((dialog) => dialog.removeEventListener('close', carousel.close))
    }
  })

  // Shader side: each card's uniforms follow the carousel. Registered after useCarousel's frame,
  // so it reads this frame's values.
  useFrame(({ clock }) => {
    const next = readSlab()
    if (!sameSlab(next, slabShape)) setSlabShape(next)
    const m = motion.current
    glass.forEach(({ uniforms }, copy) => {
      uniforms.hover.value = m.lift[copy].hover
      uniforms.focus.value = m.lift[copy].focus
      uniforms.open.value = copy === m.openCopy ? m.open : 0
      uniforms.enter.value = m.enter[copy]
    })
    // Each title glitches into its name during its card's entrance (F-35, A-10); the first copy of
    // each project is the one the scroll reaches.
    projects.forEach((project, index) => {
      const progress = MathUtils.clamp((m.enter[index] - TITLE_FROM) / (1 - TITLE_FROM), 0, 1)
      const text =
        progress < 1 ? decode('', project.title, progress, clock.elapsedTime * 1000) : project.title
      if (titleTexts.current[index] === text) return
      titleTexts.current[index] = text
      drawTitle(titles[index], text)
    })
  })

  return (
    // The front card sits on the z = 0 plane, where the viewport sizes hold.
    <group ref={prism} position-z={-apothem}>
      {glass.map((card, copy) => (
        // Each card on its own face of the prism: turned by its angle, then out along its radius.
        <group key={copy} rotation={axis === 'y' ? [0, copy * step, 0] : [copy * step, 0, 0]}>
          <group position-z={apothem}>
            {/* The part that lifts on hover and focus: its local z is the prism's radius. */}
            <group
              ref={(group) => {
                cards.current[copy] = group
              }}
            >
              <mesh
                geometry={geometry}
                material={card.glass}
                onClick={() => carousel.open(copy % projects.length)}
                onPointerOver={(event) => {
                  // Touch fires over but not always out: no hover for it. Not `!== 'mouse'`: after a
                  // scroll the raycast replays the last event, often a wheel, which has no pointerType.
                  if (event.pointerType === 'touch') return
                  carousel.hover(copy)
                  document.body.style.cursor = 'pointer'
                }}
                onPointerMove={(event) => event.uv && card.uniforms.pointer.value.copy(event.uv)}
                onPointerOut={() => {
                  carousel.hover(null)
                  document.body.style.cursor = ''
                }}
              />
              {/* The thickness behind the glass; an array, so the geometry's groups are drawn. */}
              <mesh geometry={slab} material={[card.slab]} />
              {/* The title floats in front; the pointer goes through it to the glass. */}
              <mesh
                geometry={geometry}
                material={card.title}
                position-z={TITLE_GAP * width}
                raycast={() => null}
              />
            </group>
          </group>
        </group>
      ))}
    </group>
  )
}
