// src/three/inspector/colorPicker.ts

// A color popover in the Inspector's palette: saturation/value square, hue bar, hex field.
// The browser's <input type="color"> opens the OS dialog, unusable for tuning by eye.

const KNOB =
  'position:absolute;width:10px;height:10px;margin:-5px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 2px #000;pointer-events:none'
const HUES = 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)'

let close: (() => void) | null = null

// Opens the picker under an anchor, closing any other; every change hands a '#rrggbb'.
export function openColorPicker(anchor: HTMLElement, hex: string, onChange: (hex: string) => void) {
  close?.()
  let [h, s, v] = toHsv(hex)
  const root = element(
    'div',
    `position:fixed;z-index:2147483001;width:200px;padding:8px;display:grid;gap:8px;background:#1e1e24;border:1px solid #4a4a5a;border-radius:6px;font:12px monospace;color:#e0e0e0`,
  )
  const square = element('div', 'position:relative;height:140px;border-radius:4px;cursor:crosshair')
  const squareKnob = element('div', KNOB)
  const bar = element(
    'div',
    `position:relative;height:12px;border-radius:6px;cursor:ew-resize;background:${HUES}`,
  )
  const barKnob = element('div', `${KNOB};top:50%`)
  const field = element(
    'input',
    'width:100%;box-sizing:border-box;padding:4px;background:#2a2a33;border:1px solid #4a4a5a;border-radius:4px;color:inherit;font:inherit',
  )
  square.append(squareKnob)
  bar.append(barKnob)
  root.append(square, bar, field)

  const paint = () => {
    square.style.background = `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${h} 100% 50%))`
    squareKnob.style.left = `${s * 100}%`
    squareKnob.style.top = `${(1 - v) * 100}%`
    barKnob.style.left = `${(h / 360) * 100}%`
  }
  const pick = () => {
    paint()
    field.value = toHex(h, s, v)
    onChange(field.value)
  }
  drag(square, (x, y) => {
    s = x
    v = 1 - y
    pick()
  })
  drag(bar, (x) => {
    h = x * 360
    pick()
  })
  field.value = hex
  field.addEventListener('change', () => {
    if (!/^#[0-9a-f]{6}$/i.test(field.value)) return
    ;[h, s, v] = toHsv(field.value)
    pick()
  })

  const box = anchor.getBoundingClientRect()
  root.style.top = `${Math.min(box.bottom + 4, innerHeight - 230)}px`
  root.style.left = `${Math.max(4, box.right - 218)}px`
  document.body.append(root)
  paint()

  const outside = (event: PointerEvent) => {
    if (!root.contains(event.target as Node)) close?.()
  }
  const escape = (event: KeyboardEvent) => event.key === 'Escape' && close?.()
  close = () => {
    root.remove()
    removeEventListener('pointerdown', outside, true)
    removeEventListener('keydown', escape)
    close = null
  }
  addEventListener('pointerdown', outside, true)
  addEventListener('keydown', escape)
}

// An element with inline style.
function element<K extends keyof HTMLElementTagNameMap>(tag: K, style: string) {
  const node = document.createElement(tag)
  node.style.cssText = style
  return node
}

// Calls back with the pointer position in the area, 0..1 on both axes, while pressed.
function drag(area: HTMLElement, move: (x: number, y: number) => void) {
  const at = (event: PointerEvent) => {
    const box = area.getBoundingClientRect()
    const clamp = (n: number) => Math.min(1, Math.max(0, n))
    move(
      clamp((event.clientX - box.left) / box.width),
      clamp((event.clientY - box.top) / box.height),
    )
  }
  area.addEventListener('pointerdown', (event) => {
    area.setPointerCapture(event.pointerId)
    at(event)
  })
  area.addEventListener('pointermove', (event) => {
    if (area.hasPointerCapture(event.pointerId)) at(event)
  })
}

// '#rrggbb' to hue (degrees), saturation and value (0..1).
function toHsv(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  return [h * 60, max > 0 ? d / max : 0, max]
}

// Hue (degrees), saturation and value (0..1) to '#rrggbb'.
function toHex(h: number, s: number, v: number): string {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6
    const value = v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(5)}${channel(3)}${channel(1)}`
}
