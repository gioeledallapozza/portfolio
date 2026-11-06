// src/three/textures/titleTexture.ts
import { CanvasTexture } from 'three/webgpu'

// Project titles drawn on an offscreen 2D canvas, used as textures on the glass (A-02: the real
// title is in the HTML; this is a decorative copy).

const IMAGE_RATIO = 9 / 16
const MAX_WIDTH = 2048 // pixels: past this the title gains nothing and costs memory

// Look of the titles; `redrawTitles()` applies a change to the live textures.
export const titleStyle = {
  upper: true, // capitals, like the name in Home
  spacing: 0.06, // letter spacing, in em
  size: 0.13, // cap size, as a share of the card height
}

const root = getComputedStyle(document.documentElement)
const family = root.getPropertyValue('--font-display')
const fill = root.getPropertyValue('--color-text')
const font = (size: number) => `600 ${size}px ${family}`

// Resolves once Chakra Petch 600 is ready: a canvas never waits for a font by itself.
export const titleFontReady = document.fonts.load(font(64))

// Every live title texture and its text, for redrawTitles().
const live = new Map<CanvasTexture, string>()

// Width in pixels for a card `cssWidth` CSS pixels wide: sharp at the device's pixel ratio,
// in steps of 128 so small resizes reuse the same textures.
export function titlePixels(cssWidth: number) {
  const pixels = Math.ceil((cssWidth * window.devicePixelRatio) / 128) * 128
  return Math.min(MAX_WIDTH, Math.max(256, pixels))
}

// A texture with the title centred over a transparent card, `width` pixels wide.
export function createTitleTexture(text: string, width: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = Math.round(width * IMAGE_RATIO)
  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 4
  live.set(texture, text)
  texture.addEventListener('dispose', () => live.delete(texture))
  drawTitle(texture, text)
  return texture
}

// Draws every live title again, after a change to titleStyle.
export function redrawTitles() {
  live.forEach((text, texture) => drawTitle(texture, text))
}

// Draws `title` on its texture; the entrance's glitch (F-35) draws its passing strings with it.
export function drawTitle(texture: CanvasTexture, title: string) {
  const canvas = texture.image as HTMLCanvasElement
  const context = canvas.getContext('2d')!
  const { width, height } = canvas
  const text = titleStyle.upper ? title.toUpperCase() : title
  context.clearRect(0, 0, width, height)
  context.fillStyle = fill
  context.textBaseline = 'middle'

  // One line if it fits, else two, broken at the space nearest the middle.
  const maxWidth = width * 0.8
  let size = height * titleStyle.size
  context.font = font(size)
  let lines = [text]
  if (measure(context, text, size) > maxWidth && text.includes(' ')) {
    const spaces = [...text.matchAll(/ /g)].map((match) => match.index)
    const cut = spaces.reduce((best, at) =>
      Math.abs(at - text.length / 2) < Math.abs(best - text.length / 2) ? at : best,
    )
    lines = [text.slice(0, cut), text.slice(cut + 1)]
  }
  // Shrink until the longest line fits.
  const longest = Math.max(...lines.map((line) => measure(context, line, size)))
  if (longest > maxWidth) {
    size *= maxWidth / longest
    context.font = font(size)
  }

  const lineHeight = size * 1.05
  lines.forEach((line, index) => {
    const y = height / 2 + (index - (lines.length - 1) / 2) * lineHeight
    let x = (width - measure(context, line, size)) / 2
    // Letter by letter: CanvasRenderingContext2D.letterSpacing is missing in older Safari.
    for (const letter of line) {
      context.fillText(letter, x, y)
      x += context.measureText(letter).width + titleStyle.spacing * size
    }
  })
  texture.needsUpdate = true
}

// Width of a line with the letter spacing, without the space after the last letter.
function measure(context: CanvasRenderingContext2D, line: string, size: number) {
  const letters = [...line]
  const spacing = titleStyle.spacing * size * (letters.length - 1)
  return letters.reduce((sum, letter) => sum + context.measureText(letter).width, spacing)
}
