// src/content/projects.ts

// The projects, in display order: carousel, list and panel read only from here (F-25).
// A new project is one entry plus a 16:9 image in public/projects/<id>.webp.

export interface Project {
  id: string
  title: string
  description: string
  year: number
  // "Built with": shown in the panel and the list, never on the cards.
  stack: string[]
  image: string
  alt: string
  links: { label: string; url: string; password?: string }[]
}

export const projects: Project[] = [
  {
    id: 'ring-configurator',
    title: 'Shopify Ring Configurator',
    description:
      'My own 3D engine, embedded in a live Shopify theme. Metal, stone shape and carat update the ring in real time and go to the cart with the order.',
    year: 2026,
    stack: ['three.js', 'R3F', 'WebGPU', 'TSL', 'Shopify'],
    image: '/projects/ring-configurator.webp',
    alt: 'A Shopify product page for a classic solitaire: a yellow gold ring with a round diamond and an engraved band, next to metal, shape, carat and engraving options.',
    links: [
      { label: 'Live demo', url: 'https://shopify-demo.dallapozza.dev/', password: 'awgero' },
    ],
  },
  {
    id: 'watch-configurator',
    title: 'Headless Watch Configurator',
    description:
      'A headless watch configurator built on my own 3D engine. Models, materials and options are pure data: a new product is a new model and a JSON file, never new rendering code.',
    year: 2026,
    stack: ['three.js', 'R3F', 'WebGPU', 'TSL'],
    image: '/projects/watch-configurator.webp',
    alt: "A gold diver's watch with a green bezel rendered in 3D, next to case, bezel and dial options and an Add to cart button.",
    links: [{ label: 'Live demo', url: 'https://luxury-watch.dallapozza.dev/' }],
  },
  {
    id: 'car-configurator',
    title: 'Car Configurator',
    description:
      'A sports car configurator: paint, wheels and interior details, with smooth camera transitions and PBR materials.',
    year: 2026,
    stack: ['three.js', 'R3F', 'GLSL'],
    image: '/projects/car-configurator.webp',
    alt: 'A green sports car rendered in 3D, with paint, aerodynamics, wheel and brake caliper swatches in a side panel.',
    links: [{ label: 'Live demo', url: 'https://porsche-gt3rs.dallapozza.dev/' }],
  },
  {
    id: 'fft-ocean',
    title: 'Fast Fourier Transform Ocean',
    description:
      'A stylised sea whose waves are computed on the GPU every frame, with GPGPU and a Fourier transform.',
    year: 2026,
    stack: ['three.js', 'R3F', 'GLSL'],
    image: '/projects/fft-ocean.webp',
    alt: 'A bright blue stylised ocean with rolling waves under a large glowing sun.',
    links: [{ label: 'Live demo', url: 'https://fftocean.dallapozza.dev/' }],
  },
  {
    id: 'pirate-ship',
    title: 'Pirate Ship',
    description:
      'My first portfolio: a pirate ship on a stylised sea, in plain three.js with custom shaders.',
    year: 2026,
    stack: ['three.js', 'GLSL'],
    image: '/projects/pirate-ship.webp',
    alt: 'A three-masted sailing ship on a stylised sea at sunset, behind the name Gioele Dalla Pozza.',
    links: [{ label: 'Live demo', url: 'https://pirate-ship.dallapozza.dev' }],
  },
]
