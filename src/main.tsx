// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/geist-mono/latin-400.css'
import './styles/base.css'
import './loader/loader'
import { addPhase } from './loader/phases'
import { App } from './App'

// Entry point: self-hosted fonts (N-11), the loader and the page; tokens.css is linked by index.html.

// The page is shown only with both fonts in, so no text swaps font under the user's eyes (F-05).
const root = getComputedStyle(document.documentElement)
const fonts = addPhase(1)
void Promise.allSettled([
  document.fonts.load(`600 1em ${root.getPropertyValue('--font-display')}`),
  document.fonts.load(`1em ${root.getPropertyValue('--font-body')}`),
]).then(() => fonts.report(1))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
