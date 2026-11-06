// src/loader/loader.ts
import { decode, glitch } from '../motion/scramble'
import { loadedShare } from './phases'

// The loading screen (F-05): index.html paints it, here it follows the phases, turns to READY and
// leaves in glass slices (A-10), then hands the page over.

const MIN_TIME = 1200 // ms: even from the cache the bar is seen filling
const MAX_TIME = 10000 // ms: past this the page opens with the grid for the whole visit (F-23)
const RISE = 3 // per second: how fast the number closes in on the real share
const MIN_RISE = 0.5 // share per second at least, so the last points do not crawl
const READY_TIME = 320 // ms of the glitch from LOADING to READY
const READY_HOLD = 250 // ms on READY before the exit
const SLICES = 12
const SLICE_TIME = 380 // ms of each slice's slide
const SLICE_STAGGER = 25 // ms between one slice and the next
const FADE_TIME = 300 // ms of the exit with reduced motion

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const loader = document.getElementById('loader')!
const word = loader.querySelector<HTMLElement>('.loader-word')!
const value = loader.querySelector<HTMLElement>('.loader-value')!
const bar = loader.querySelector<HTMLElement>('.loader-bar')!
const pitch = parseFloat(getComputedStyle(bar).getPropertyValue('--pitch'))

let giveUp = () => {}
let show = () => {}
// Resolves if the time runs out: the 3D must not replace the grid afterwards (F-23).
export const timedOut = new Promise<void>((resolve) => (giveUp = resolve))
// Resolves once the loader has gone and the page is usable: the entrances start from here.
export const shown = new Promise<void>((resolve) => (show = resolve))

let share = 0 // the share on screen: it only rises
let last = performance.now()

// Bar and number for a share; screen readers get only steps of ten, not every point.
function draw(share: number) {
  const percent = Math.floor(share * 100)
  value.textContent = `${String(percent).padStart(3, '0')}%`
  const step = String(Math.floor(percent / 10) * 10)
  if (loader.getAttribute('aria-valuenow') !== step) loader.setAttribute('aria-valuenow', step)
  // Whole segments only: the CSS `round` repeat fits this many in the bar's width.
  const segments = Math.max(1, Math.round(bar.clientWidth / pitch))
  bar.style.setProperty('--fill', String(Math.floor(share * segments) / segments))
}

function setWord(text: string) {
  if (word.textContent !== text) word.textContent = text
}

function frame(now: number) {
  const real = loadedShare()
  if (real < 1 && now > MAX_TIME) {
    giveUp()
    void leave()
    return
  }
  // Towards the real share, never faster than MIN_TIME allows, never back.
  const target = Math.min(real, now / MIN_TIME)
  // A frame's timestamp is when the frame began, so the first one can predate `last`.
  const dt = Math.max(now - last, 0) / 1000
  last = now
  if (target > share)
    share = Math.min(target, share + Math.max((target - share) * RISE, MIN_RISE) * dt)
  draw(share)
  if (!reducedMotion) setWord(glitch('LOADING', now))
  if (share >= 1) void leave()
  else requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// LOADING → READY, then out; the page underneath takes over.
async function leave() {
  draw(1)
  if (reducedMotion) setWord('READY')
  else await retype('LOADING', 'READY')
  await wait(READY_HOLD)
  // An anchor in the URL is reached under the loader, so the exit uncovers that section (F-02).
  document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
  await (reducedMotion
    ? loader.animate({ opacity: [1, 0] }, FADE_TIME).finished.then(() => loader.remove())
    : slide())
  document.documentElement.classList.remove('is-loading')
  document.getElementById('root')!.inert = false
  show()
}

function retype(from: string, to: string) {
  return new Promise<void>((resolve) => {
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / READY_TIME, 1)
      setWord(decode(from, to, progress, now))
      if (progress < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

// The loader cut into horizontal slices that slide out to alternate sides.
async function slide() {
  const slices = Array.from({ length: SLICES }, (_, i) => {
    const slice = loader.cloneNode(true) as HTMLElement
    slice.removeAttribute('id')
    slice.removeAttribute('role')
    slice.setAttribute('aria-hidden', 'true')
    // A pixel of overlap, so no seam shows the page between two slices.
    const top = (i / SLICES) * 100
    const bottom = 100 - ((i + 1) / SLICES) * 100
    slice.style.clipPath = `inset(calc(${top}% - 1px) 0 calc(${bottom}% - 1px) 0)`
    return slice
  })
  loader.replaceWith(...slices)
  await Promise.all(
    slices.map(
      (slice, i) =>
        slice.animate(
          { transform: ['none', `translateX(${i % 2 ? 100 : -100}%)`] },
          {
            duration: SLICE_TIME,
            delay: i * SLICE_STAGGER,
            easing: 'cubic-bezier(0.7, 0, 0.84, 0)',
            fill: 'forwards',
          },
        ).finished,
    ),
  )
  slices.forEach((slice) => slice.remove())
}
