// src/three/inspector/InspectorPanel.tsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Inspector } from 'three/addons/inspector/Inspector.js'
import type { ParametersGroup } from 'three/addons/inspector/tabs/Parameters.js'
import type { Color, UniformNode, WebGPURenderer } from 'three/webgpu'
import { glassTuning, titleTuning } from '../materials/glass/glassMaterial'
import { openTuning } from '../materials/glass/glassOpen'
import { redrawTitles, titleStyle } from '../textures/titleTexture'
import { openColorPicker } from './colorPicker'

// Development only (?inspector): the three.js Inspector with the glass tuning in folders.
// Reached through a DEV-guarded lazy import in Stage, so no production bundle has it.

// Attaches the Inspector to the renderer and builds its groups; edits last until a reload.
export default function InspectorPanel() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const renderer = gl as unknown as WebGPURenderer
    const previous = renderer.inspector
    const inspector = new Inspector()
    // Fixed on <body>: inside the canvas wrapper the page would cover it.
    const dom = inspector.domElement
    Object.assign(dom.style, { position: 'fixed', inset: '0', zIndex: '2147483000' })
    document.body.appendChild(dom)
    setInspector(renderer, inspector)
    addGroups(inspector)
    return () => {
      setInspector(renderer, previous)
      dom.remove()
    }
  }, [gl])

  return null
}

// A function, because hooks may not mutate R3F state inline.
function setInspector(renderer: WebGPURenderer, inspector: WebGPURenderer['inspector']) {
  renderer.inspector = inspector
}

// glass › color, shape, edge, band, scan, grain · open · title: one row per uniform.
function addGroups(inspector: Inspector) {
  const glass = inspector.createParameters('glass')
  const { color, shape, edge, band, scan, grain } = glassTuning

  const colorFolder = glass.addFolder('color')
  slider(colorFolder, 'dim', color.dim, 0, 1)
  slider(colorFolder, 'desat', color.desat, 0, 1)
  slider(colorFolder, 'tint', color.tint, 0, 1)
  slider(colorFolder, 'blur', color.blur, 0, 12, 0.1)

  const shapeFolder = glass.addFolder('shape')
  slider(shapeFolder, 'cut', shape.cut, 0, 1, 1)
  slider(shapeFolder, 'corner', shape.corner, 0, 0.2)
  slider(shapeFolder, 'thickness', shape.thickness, 0, 0.15)

  const edgeFolder = glass.addFolder('edge')
  slider(edgeFolder, 'width', edge.width, 0, 0.02)
  slider(edgeFolder, 'glow', edge.glow, 0, 2)
  slider(edgeFolder, 'shade', edge.shade, 0, 1)
  slider(edgeFolder, 'tint', edge.tint, 0, 1)
  colorRow(edgeFolder, 'rest', edge.rest)
  colorRow(edgeFolder, 'active', edge.active)

  const bandFolder = glass.addFolder('band')
  slider(bandFolder, 'on', band.on, 0, 1, 1)
  slider(bandFolder, 'strength', band.strength, 0, 0.5)
  slider(bandFolder, 'width', band.width, 0, 1)
  slider(bandFolder, 'slant', band.slant, -2, 2)
  slider(bandFolder, 'travel', band.travel, 0, 4)
  slider(bandFolder, 'follow', band.follow, 0, 1)

  const scanFolder = glass.addFolder('scan')
  slider(scanFolder, 'strength', scan.strength, 0, 0.5)
  slider(scanFolder, 'density', scan.density, 0.2, 4)

  const grainFolder = glass.addFolder('grain')
  slider(grainFolder, 'strength', grain.strength, 0, 0.5)
  slider(grainFolder, 'cover', grain.cover, 0, 0.6)

  const open = inspector.createParameters('open')
  slider(open, 'slide', openTuning.slide, 0, 0.5)
  slider(open, 'aberration', openTuning.aberration, 0, 0.1)
  slider(open, 'noise', openTuning.noise, 0, 1)
  slider(open, 'flash', openTuning.flash, 0, 2)
  slider(open, 'preview', openTuning.preview, 0, 1)
  slider(open, 'frame', openTuning.frame, 0, 0.3)
  slider(open, 'frost', openTuning.frost, 0, 1)

  const title = inspector.createParameters('title')
  slider(title, 'aberration', titleTuning.aberration, 0, 0.02)
  colorRow(title, 'color', titleTuning.color)
  title.add(titleStyle, 'upper').onChange(redrawTitles)
  title.add(titleStyle, 'spacing', 0, 0.3, 0.01).onChange(redrawTitles)
  title.add(titleStyle, 'size', 0.05, 0.3, 0.005).onChange(redrawTitles)
}

// A slider bound to a uniform's value.
function slider(
  group: ParametersGroup,
  name: string,
  node: UniformNode<'float', number>,
  min: number,
  max: number,
  step = 0.001,
) {
  group.add(node, 'value', min, max, step).name(name)
}

// A colour row bound to a colour uniform, with our picker instead of the OS dialog.
function colorRow(group: ParametersGroup, name: string, node: UniformNode<'color', Color>) {
  const current = () => `#${node.value.getHexString()}`
  const editor = group.addColor({ [name]: current() }, name)
  // The colour input lives inside the editor, out of the typings.
  const input = (editor as unknown as { colorInput: HTMLInputElement }).colorInput
  input.addEventListener('click', (event) => {
    event.preventDefault()
    openColorPicker(input, current(), (hex) => {
      node.value.set(hex)
      input.value = hex
    })
  })
}
