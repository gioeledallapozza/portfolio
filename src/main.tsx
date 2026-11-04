// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/geist-mono/latin-400.css'
import './styles/tokens.css'
import './styles/base.css'
import { App } from './App'

// Entry point: self-hosted fonts (N-11), tokens and the page.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
